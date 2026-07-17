import { defineConfig } from "@prisma/config"
import { PrismaD1 } from "@prisma/adapter-d1"

export default defineConfig({
  migrations: {
    adapter: (env) => {
      if (env.DB) {
        return new PrismaD1(env.DB as unknown as D1Database)
      }
      throw new Error("D1 binding (DB) is required for migrations")
    },
  },
  client: {
    adapter: (env) => {
      if (env.DB) {
        return new PrismaD1(env.DB as unknown as D1Database)
      }
      throw new Error("D1 binding (DB) is required for the client")
    },
  },
})
