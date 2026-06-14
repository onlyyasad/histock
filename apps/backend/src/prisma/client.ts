import { PrismaClient } from '@prisma/client'

// ONE connection pool shared by both clients.
// Never call `new PrismaClient()` anywhere else in the codebase.
const _base = new PrismaClient({
  errorFormat: 'minimal',
})

// prismaAdmin: raw client — no scoping. Use ONLY in:
//   • src/app/modules/auth/ (login, register, passport strategy)
//   • src/admin/ routes
// ESLint no-restricted-imports enforces this at CI — prismaAdmin is blocked
// outside those directories.
export const prismaAdmin = _base

// Models that have a `deleted_at` column and support soft-delete.
// Only these get `deletedAt: null` injected by prismaWithScope.
// Add here when a new model gains a `deleted_at` column.
const SOFT_DELETE_MODELS = new Set(['User', 'Customer', 'Product', 'ProductVariant', 'Order'])

// prismaWithScope: auto-injects businessId (+ deletedAt: null for soft-delete models) on all queries.
// Use in ALL seller route handlers. Accepts businessId from session.
//
// IMPORTANT: findUnique() is disabled — it cannot safely inject businessId scope.
// Use findFirst() instead (equivalent when businessId scope is applied).
export const prismaWithScope = (businessId: string) =>
  _base.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          const where: Record<string, unknown> = { ...(args.where as Record<string, unknown>), businessId }
          if (SOFT_DELETE_MODELS.has(model)) where.deletedAt = null
          args.where = where
          return query(args)
        },
        async findFirst({ model, args, query }) {
          const where: Record<string, unknown> = { ...(args.where as Record<string, unknown>), businessId }
          if (SOFT_DELETE_MODELS.has(model)) where.deletedAt = null
          args.where = where
          return query(args)
        },
        async findUnique() {
          // findUnique bypasses scope injection — use findFirst() instead.
          throw new Error('[prismaWithScope] findUnique() disabled — use findFirst()')
        },
      },
    },
  })
