import { Prisma } from '@prisma/client'

// List view: courier + order count per batch.
export const remittanceListInclude = {
  courier: { select: { id: true, name: true } },
  _count: { select: { orders: true } },
} satisfies Prisma.RemittanceInclude

// Detail view: courier + each order's summary.
export const remittanceDetailInclude = {
  courier: true,
  orders: {
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          customer: { select: { name: true, phone: true } },
        },
      },
    },
  },
} satisfies Prisma.RemittanceInclude

// Returned after create/import.
export const remittanceCreateInclude = {
  courier: { select: { id: true, name: true } },
  _count: { select: { orders: true } },
} satisfies Prisma.RemittanceInclude
