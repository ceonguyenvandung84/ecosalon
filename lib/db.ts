import { getCloudflareContext } from '@opennextjs/cloudflare'
import schemaJson from './schema-d1.json'
import type { PrismaLike } from './prisma-types'

const SCHEMA = schemaJson as Record<string, { columns: string[]; fks?: { column: string; ref: string }[] }>

// ---- helpers ----
function camelToPascal(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}

// Build a WHERE clause from a Prisma-style `where` object.
// Supports: equality, { equals, not, lt, lte, gt, gte, contains, startsWith,
//           endsWith, in, notIn, has, is, isNot }, AND/OR/NOT arrays.
// Returns { sql, params }.
function buildWhere(where, columns) {
  if (!where || Object.keys(where).length === 0) return { sql: '', params: [] }
  const clauses = []
  const params = []
  const ops = {
    equals: '=',
    not: '!=',
    lt: '<',
    lte: '<=',
    gt: '>',
    gte: '>=',
  }
  function walk(cond, col) {
    if (cond === null) {
      clauses.push(`${col} IS NULL`)
      return
    }
    if (isPlainObject(cond)) {
      for (const k of Object.keys(cond)) {
        if (k === 'equals') {
          clauses.push(`${col} = ?`)
          params.push(cond[k])
        } else if (k === 'not') {
          if (isPlainObject(cond[k])) {
            walk(cond[k], col)
            // wrap as NOT handled by caller; for simplicity use !=
            clauses[clauses.length - 1] = `NOT (${clauses[clauses.length - 1]})`
          } else {
            clauses.push(`${col} != ?`)
            params.push(cond[k])
          }
        } else if (ops[k]) {
          clauses.push(`${col} ${ops[k]} ?`)
          params.push(cond[k])
        } else if (k === 'contains') {
          clauses.push(`${col} LIKE ?`)
          params.push(`%${cond[k]}%`)
        } else if (k === 'startsWith') {
          clauses.push(`${col} LIKE ?`)
          params.push(`${cond[k]}%`)
        } else if (k === 'endsWith') {
          clauses.push(`${col} LIKE ?`)
          params.push(`%${cond[k]}`)
        } else if (k === 'in') {
          const ph = cond[k].map(() => '?').join(',')
          clauses.push(`${col} IN (${ph})`)
          params.push(...cond[k])
        } else if (k === 'notIn') {
          const ph = cond[k].map(() => '?').join(',')
          clauses.push(`${col} NOT IN (${ph})`)
          params.push(...cond[k])
        } else if (k === 'has') {
          clauses.push(`instr(${col}, ?) > 0`)
          params.push(cond[k])
        } else if (k === 'mode') {
          // ignore case-sensitivity hint
        } else if (k === 'gte' || k === 'lte' || k === 'gt' || k === 'lt') {
          clauses.push(`${col} ${ops[k]} ?`)
          params.push(cond[k])
        }
      }
    } else {
      clauses.push(`${col} = ?`)
      params.push(cond)
    }
  }
  for (const key of Object.keys(where)) {
    if (key === 'AND') {
      const subs = where[key].map((w) => buildWhere(w, columns))
      subs.forEach((s) => {
        if (s.sql) clauses.push(s.sql)
        params.push(...s.params)
      })
    } else if (key === 'OR') {
      const subs = where[key].map((w) => buildWhere(w, columns))
      const orSql = subs.filter((s) => s.sql).map((s) => `(${s.sql})`).join(' OR ')
      if (orSql) clauses.push(`(${orSql})`)
      subs.forEach((s) => params.push(...s.params))
    } else if (key === 'NOT') {
      const w = where[key]
      if (Array.isArray(w)) {
        w.forEach((sub) => {
          const s = buildWhere(sub, columns)
          if (s.sql) clauses.push(`NOT (${s.sql})`)
          params.push(...s.params)
        })
      } else {
        const s = buildWhere(w, columns)
        if (s.sql) clauses.push(`NOT (${s.sql})`)
        params.push(...s.params)
      }
    } else {
      walk(where[key], key)
    }
  }
  return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params }
}

function buildOrderBy(orderBy, columns) {
  if (!orderBy) return ''
  const arr = Array.isArray(orderBy) ? orderBy : [orderBy]
  const parts = arr
    .map((o) => {
      const k = Object.keys(o)[0]
      const dir = o[k] === 'desc' ? 'DESC' : 'ASC'
      return `${k} ${dir}`
    })
    .join(', ')
  return parts ? `ORDER BY ${parts}` : ''
}

function buildData(data) {
  const cols = []
  const params = []
  const vals = []
  for (const k of Object.keys(data)) {
    if (k === 'connect' && data[k]) {
      const ck = Object.keys(data[k])[0]
      cols.push(ck)
      vals.push('?')
      params.push(data[k][ck])
      continue
    }
    cols.push(k)
    vals.push('?')
    // JSON-encode object/array values
    let v = data[k]
    if (isPlainObject(v) || Array.isArray(v)) v = JSON.stringify(v)
    params.push(v)
  }
  return { cols, vals, params }
}

async function runQuery(db, sql, params) {
  const stmt = db.prepare(sql)
  const r = await stmt.bind(...params).all()
  return r.results || []
}

// Serialize a row: parse JSON columns? We don't know which are JSON.
// We just return row as-is (strings). Callers expecting objects for JSON
// fields will need casting; for now return raw.
function mapRow(row) {
  return row
}

class ModelClient {
  constructor(db, table, schema) {
    this.db = db
    this.table = table
    this.schema = schema
    this.columns = schema.columns
  }
  _cols() {
    return this.columns.join(', ')
  }

  async findMany(args = {}) {
    const where = buildWhere(args.where, this.columns)
    const order = buildOrderBy(args.orderBy, this.columns)
    let sql = `SELECT ${args.select ? Object.keys(args.select).join(', ') : this._cols()} FROM "${this.table}" ${where.sql} ${order}`
    if (args.take != null) sql += ` LIMIT ${Number(args.take)}`
    if (args.skip != null) sql += ` OFFSET ${Number(args.skip)}`
    const rows = await runQuery(this.db, sql, where.params)
    const mapped = rows.map(mapRow)
    if (args.include) return this._applyInclude(mapped, args.include)
    return mapped
  }

  async findFirst(args = {}) {
    const res = await this.findMany({ ...args, take: 1 })
    return res[0] || null
  }

  async findUnique(args = {}) {
    return this.findFirst({ where: args.where })
  }

  async findFirstOrThrow(args = {}) {
    const r = await this.findFirst(args)
    if (!r) throw new Error(`Record in ${this.table} not found`)
    return r
  }

  async create(args = {}) {
    const { cols, vals, params } = buildData(args.data)
    const sql = `INSERT INTO "${this.table}" (${cols.join(', ')}) VALUES (${vals.join(', ')})`
    const info = await this.db.prepare(sql).bind(...params).run()
    const id = info.meta?.last_row_id
    const where = {}
    if (id != null && this.columns.includes('id')) where.id = id
    else {
      // try to fetch by unique fields in data
      for (const c of this.columns) {
        if (c !== 'id' && args.data[c] != null) where[c] = args.data[c]
      }
    }
    const created = await this.findFirst({ where })
    return created || { id, ...args.data }
  }

  async update(args = {}) {
    const { cols, vals, params } = buildData(args.data)
    const setSql = cols.map((c) => `${c} = ?`).join(', ')
    const where = buildWhere(args.where, this.columns)
    const sql = `UPDATE "${this.table}" SET ${setSql} ${where.sql}`
    await this.db.prepare(sql).bind(...params, ...where.params).run()
    return this.findFirst({ where: args.where })
  }

  async updateMany(args = {}) {
    const { cols, vals, params } = buildData(args.data)
    const setSql = cols.map((c) => `${c} = ?`).join(', ')
    const where = buildWhere(args.where, this.columns)
    const sql = `UPDATE "${this.table}" SET ${setSql} ${where.sql}`
    const info = await this.db.prepare(sql).bind(...params, ...where.params).run()
    return { count: info.meta?.changes || 0 }
  }

  async upsert(args = {}) {
    const existing = await this.findFirst({ where: args.where })
    if (existing) {
      return this.update({ where: args.where, data: args.update })
    }
    return this.create({ data: { ...args.create, ...args.update } })
  }

  async delete(args = {}) {
    const existing = await this.findFirst({ where: args.where })
    const where = buildWhere(args.where, this.columns)
    const sql = `DELETE FROM "${this.table}" ${where.sql}`
    await this.db.prepare(sql).bind(...where.params).run()
    return existing
  }

  async deleteMany(args = {}) {
    const where = buildWhere(args.where || {}, this.columns)
    const sql = `DELETE FROM "${this.table}" ${where.sql}`
    const info = await this.db.prepare(sql).bind(...where.params).run()
    return { count: info.meta?.changes || 0 }
  }

  async createMany(args = {}) {
    const data = Array.isArray(args.data) ? args.data : [args.data]
    let count = 0
    for (const d of data) {
      await this.create({ data: d })
      count++
    }
    return { count }
  }

  async count(args = {}) {
    const where = buildWhere(args?.where, this.columns)
    const sql = `SELECT COUNT(*) as c FROM "${this.table}" ${where.sql}`
    const r = await runQuery(this.db, sql, where.params)
    return r[0]?.c || 0
  }

  async aggregate(args = {}) {
    const where = buildWhere(args?.where, this.columns)
    const selects = []
    const result = {}
    const _agg = (obj) => {
      for (const fn of Object.keys(obj)) {
        for (const col of Object.keys(obj[fn])) {
          const alias = `${fn}_${col}`
          selects.push(`${fn}(${col}) as ${alias}`)
          result[fn] = result[fn] || {}
          // placeholder
        }
      }
    }
    if (args._count) _agg({ _count: args._count })
    if (args._sum) _agg({ _sum: args._sum })
    if (args._avg) _agg({ _avg: args._avg })
    if (args._min) _agg({ _min: args._min })
    if (args._max) _agg({ _max: args._max })
    if (selects.length === 0) selects.push('COUNT(*) as _count_all')
    const sql = `SELECT ${selects.join(', ')} FROM "${this.table}" ${where.sql}`
    const r = await runQuery(this.db, sql, where.params)
    const row = r[0] || {}
    // restructure
    const out = {}
    for (const k of Object.keys(row)) {
      const m = k.match(/^(.+)_(.+)$/)
      if (m) {
        out[m[1]] = out[m[1]] || {}
        out[m[1]][m[2]] = row[k]
      }
    }
    return out
  }

  async groupBy(args = {}) {
    const by = Array.isArray(args.by) ? args.by : [args.by]
    const where = buildWhere(args.where, this.columns)
    const selects = by.map((b) => `${b}`).join(', ')
    let sql = `SELECT ${selects} FROM "${this.table}" ${where.sql} GROUP BY ${by.join(', ')}`
    const rows = await runQuery(this.db, sql, where.params)
    return rows.map(mapRow)
  }

  async _applyInclude(rows, include) {
    if (!Array.isArray(rows)) rows = [rows]
    for (const rel of Object.keys(include)) {
      // relation field -> table = PascalCase(rel)
      const relTable = camelToPascal(rel)
      const schema = SCHEMA[relTable]
      if (!schema) continue
      const fkCol = `${rel}Id`
      const ids = rows.map((r) => r[fkCol]).filter((v) => v != null)
      if (ids.length === 0) {
        rows.forEach((r) => (r[rel] = null))
        continue
      }
      const ph = ids.map(() => '?').join(',')
      const childRows = await runQuery(
        this.db,
        `SELECT ${schema.columns.join(', ')} FROM "${relTable}" WHERE id IN (${ph})`,
        ids
      )
      const byId = {}
      childRows.forEach((c) => (byId[c.id] = c))
      rows.forEach((r) => (r[rel] = byId[r[fkCol]] || null))
    }
    return Array.isArray(rows) ? rows : rows[0]
  }
}

let _client = null
function getDb() {
  const { env } = getCloudflareContext()
  return env.DB
}

function buildClient() {
  const db = getDb()
  const client = {}
  for (const table of Object.keys(SCHEMA)) {
    client[table.charAt(0).toLowerCase() + table.slice(1)] = new ModelClient(db, table, SCHEMA[table])
  }
  return client
}

export const prisma = new Proxy(
  {} as PrismaLike,
  {
    get(_t, prop) {
      if (!_client) _client = buildClient()
      return _client[prop as keyof PrismaLike]
    },
  }
) as PrismaLike
