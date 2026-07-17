import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from './d1-adapter'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const globalForPrisma = globalThis as unknown as {
  _prismaClient?: PrismaClient
}

// Lazily resolve the Prisma client. We must read the Cloudflare context at
// request time (not at module load) so that the D1 binding is available.
// A Proxy forwards every property access to the resolved client, which lets
// the 100+ existing `prisma.xxx` call sites keep working unchanged.
function getPrisma(): PrismaClient {
  if (globalForPrisma._prismaClient) return globalForPrisma._prismaClient

  let adapter: PrismaD1 | undefined
  try {
    const { env } = getCloudflareContext()
    if (env.DB) adapter = new PrismaD1(env.DB)
  } catch {
    // not running inside the OpenNext Cloudflare runtime
  }

  globalForPrisma._prismaClient = adapter
    ? new PrismaClient({ adapter })
    : new PrismaClient()

  return globalForPrisma._prismaClient
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

