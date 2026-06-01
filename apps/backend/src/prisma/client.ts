import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

// ONE connection pool shared by both clients.
// Never call `new PrismaClient()` anywhere else in the codebase.
const _base = new PrismaClient({
  errorFormat: 'minimal',
  datasources: { db: { url: process.env.DATABASE_URL! } },
})

// prismaAdmin: raw client — no scoping. Use ONLY in:
//   • src/app/modules/auth/ (login, register, passport strategy)
//   • src/admin/ routes
// ESLint no-restricted-imports enforces this at CI — prismaAdmin is blocked
// outside those directories.
export const prismaAdmin = _base

// prismaWithScope: auto-injects businessId + deletedAt: null on all queries.
// Use in ALL seller route handlers. Accepts businessId from session.
//
// IMPORTANT: findUnique() is disabled — it cannot safely inject businessId scope.
// Use findFirst() instead (equivalent when businessId scope is applied).
export const prismaWithScope = (businessId: string) =>
  _base.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          args.where = { ...(args.where as object), businessId, deletedAt: null }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...(args.where as object), businessId, deletedAt: null }
          return query(args)
        },
        async findUnique() {
          // findUnique bypasses scope injection — use findFirst() instead.
          throw new Error('[prismaWithScope] findUnique() disabled — use findFirst()')
        },
      },
    },
  })
