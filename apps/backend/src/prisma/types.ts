import { prismaWithScope, prismaAdmin } from './client'

// Client a seller-facing service receives (business-scoped, findUnique disabled).
export type ScopedPrisma = ReturnType<typeof prismaWithScope>

// Client an admin-facing service receives (raw, no scope).
export type AdminPrisma = typeof prismaAdmin
