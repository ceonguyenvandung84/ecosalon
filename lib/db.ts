import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrisma(): PrismaClient {
  // @ts-ignore - env injected by runtime (Cloudflare Workers / Pages)
  const env = (globalThis as any).env ?? (typeof process !== 'undefined' ? process.env : {})
  const d1 = env.DB
  if (!d1) {
    // Local fallback: standard PrismaClient (expects DATABASE_URL sqlite/postgres)
    // @ts-ignore
    return new PrismaClient()
  }
  // @ts-ignore
  const adapter = new PrismaD1(d1)
  // @ts-ignore
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
