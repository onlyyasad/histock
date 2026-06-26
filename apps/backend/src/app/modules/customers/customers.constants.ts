import { Prisma } from '@prisma/client'

// Columns returned by the customer list endpoint.
export const customerListSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  totalOrders: true,
  totalSpent: true,
  isFlagged: true,
  flagReason: true,
  createdAt: true,
} satisfies Prisma.CustomerSelect

// Fields the list search matches against (reference for maintainers).
export const customerSearchableFields = ['name', 'phone'] as const
