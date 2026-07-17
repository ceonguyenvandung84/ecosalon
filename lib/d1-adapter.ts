// Fully self-contained Prisma D1 driver adapter (no @prisma/* imports).
// OpenNext on Windows externalizes @prisma/* packages, so we inline everything
// needed to talk to a Cloudflare D1 database from Prisma Client.

const ColumnTypeEnum = {
  Int32: 0,
  Int64: 1,
  Float: 2,
  Double: 3,
  Numeric: 4,
  Boolean: 5,
  DateTime: 6,
  Json: 7,
  String: 8,
  Bytes: 9,
  UnknownNumber: 10,
} as const;

class DriverAdapterError extends Error {
  constructor(public error: any) {
    super(error?.message ?? String(error));
    this.name = "DriverAdapterError";
  }
}

const MAX_BIND_VALUES = 98;

function getColumnTypes(columnNames: string[], rows: unknown[][]) {
  const columnTypes: number[] = [];
  columnLoop: for (let columnIndex = 0; columnIndex < columnNames.length; columnIndex++) {
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const candidateValue = rows[rowIndex][columnIndex];
      if (candidateValue !== null) {
        const inferred = inferColumnType(candidateValue);
        if (columnTypes[columnIndex] === undefined || inferred === ColumnTypeEnum.String) {
          columnTypes[columnIndex] = inferred;
        }
        if (inferred !== ColumnTypeEnum.UnknownNumber) {
          continue columnLoop;
        }
      }
    }
    if (columnTypes[columnIndex] === undefined) {
      columnTypes[columnIndex] = ColumnTypeEnum.Int32;
    }
  }
  return columnTypes;
}

function inferColumnType(value: unknown) {
  switch (typeof value) {
    case "string":
      return inferStringType(value);
    case "number":
      return ColumnTypeEnum.UnknownNumber;
    case "object":
      if (value instanceof Array) return ColumnTypeEnum.Bytes;
      throw new Error(`unexpected value of type object: ${JSON.stringify(value)}`);
    default:
      throw new Error(`unexpected value of type ${typeof value}`);
  }
}

const isoDateRegex =
  /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/;
const sqliteDateRegex = /^\d{4}-[0-1]\d-[0-3]\d [0-2]\d:[0-5]\d:[0-5]\d$/;

function isISODate(str: string) {
  return isoDateRegex.test(str) || sqliteDateRegex.test(str);
}

function inferStringType(value: string) {
  if (isISODate(value)) return ColumnTypeEnum.DateTime;
  return ColumnTypeEnum.String;
}

function mapRow(result: unknown[], columnTypes: number[]) {
  for (let i = 0; i < result.length; i++) {
    const value = result[i];
    if (value instanceof ArrayBuffer) {
      result[i] = Array.from(new Uint8Array(value));
      continue;
    }
    if (
      typeof value === "number" &&
      (columnTypes[i] === ColumnTypeEnum.Int32 || columnTypes[i] === ColumnTypeEnum.Int64) &&
      !Number.isInteger(value)
    ) {
      result[i] = Math.trunc(value);
      continue;
    }
    if (typeof value === "number" && columnTypes[i] === ColumnTypeEnum.String) {
      result[i] = value.toString();
      continue;
    }
    if (typeof value === "bigint") {
      result[i] = value.toString();
      continue;
    }
    if (columnTypes[i] === ColumnTypeEnum.Boolean) {
      result[i] = JSON.parse(value as unknown as string);
    }
  }
  return result;
}

function convertDriverError(error: any) {
  if (typeof error?.message !== "string") throw error;
  let stripped = error.message.split("D1_ERROR: ").at(1) ?? error.message;
  stripped = stripped.split("SqliteError: ").at(1) ?? stripped;
  if (stripped.startsWith("UNIQUE constraint failed") || stripped.startsWith("PRIMARY KEY constraint failed")) {
    return {
      kind: "UniqueConstraintViolation",
      fields: stripped.split(": ").at(1)?.split(", ").map((f: string) => f.split(".").pop()) ?? [],
    };
  } else if (stripped.startsWith("NOT NULL constraint failed")) {
    return { kind: "NullConstraintViolation", fields: stripped.split(": ").at(1)?.split(", ").map((f: string) => f.split(".").pop()) ?? [] };
  } else if (stripped.startsWith("FOREIGN KEY constraint failed") || stripped.startsWith("CHECK constraint failed")) {
    return { kind: "ForeignKeyConstraintViolation", constraint: { foreignKey: {} } };
  } else if (stripped.startsWith("no such table")) {
    return { kind: "TableDoesNotExist", table: stripped.split(": ").pop() };
  } else if (stripped.startsWith("no such column")) {
    return { kind: "ColumnNotFound", column: stripped.split(": ").pop() };
  } else if (stripped.includes("has no column named ")) {
    return { kind: "ColumnNotFound", column: stripped.split("has no column named ").pop() };
  }
  return { kind: "sqlite", extendedCode: error["code"] ?? error["cause"]?.["code"] ?? 1, message: error.message };
}

function cleanArg(arg: unknown, argType: string) {
  if (arg !== null) {
    if (argType === "Int64") return Number.parseInt(arg as string);
    if (argType === "Int32") return Number.parseInt(arg as string);
    if (argType === "Float" || argType === "Double") return Number.parseFloat(arg as string);
    if (arg === true) return 1;
    if (arg === false) return 0;
    if (arg instanceof Uint8Array) return Array.from(arg);
  }
  return arg;
}

class D1Queryable {
  provider = "sqlite";
  adapterName = "d1-vendored";
  constructor(protected client: any) {}

  async queryRaw(query: any) {
    const data = await this.performIO(query);
    return this.convertData(data);
  }

  convertData(ioResult: any) {
    const columnNames = ioResult[0];
    const results = ioResult[1];
    if (results.length === 0) return { columnNames: [], columnTypes: [], rows: [] };
    const columnTypes = Object.values(getColumnTypes(columnNames, results)) as number[];
    const rows = results.map((value: unknown[]) => mapRow(value, columnTypes));
    return { columnNames, columnTypes, rows };
  }

  async executeRaw(query: any) {
    const result = await this.performIO(query, true);
    return result.meta?.changes ?? 0;
  }

  async performIO(query: any, executeRaw = false) {
    try {
      query.args = query.args.map((arg: unknown, i: number) => cleanArg(arg, query.argTypes[i]));
      const stmt = this.client.prepare(query.sql).bind(...query.args);
      if (executeRaw) return await stmt.run();
      const [columnNames, ...rows] = await stmt.raw({ columnNames: true });
      return [columnNames, rows];
    } catch (e: any) {
      console.error("Error in performIO: %O", e);
      throw new DriverAdapterError(convertDriverError(e));
    }
  }
}

class PrismaD1Adapter extends D1Queryable {
  async executeScript(script: string) {
    try {
      await this.client.exec(script);
    } catch (error: any) {
      console.error("Error in performIO: %O", error);
      throw new DriverAdapterError(convertDriverError(error));
    }
  }

  getConnectionInfo() {
    return { maxBindValues: MAX_BIND_VALUES };
  }

  async startTransaction(isolationLevel: any) {
    if (isolationLevel && isolationLevel !== "SERIALIZABLE") {
      throw new DriverAdapterError({ kind: "InvalidIsolationLevel", level: isolationLevel });
    }
    return {
      async commit() {},
      async rollback() {},
    } as any;
  }

  async dispose() {}
}

export class PrismaD1 {
  provider = "sqlite";
  adapterName = "d1-vendored";
  constructor(private client: any) {}
  async connect() {
    return new PrismaD1Adapter(this.client);
  }
}
