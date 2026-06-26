import type { PrismaClient } from '@prisma/client'

// A Prisma transaction client (the value passed to a $transaction callback).
// FIFO allocation/reversal must run inside a transaction.
export type CostTxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export type IAllocateForItemParams = {
  orderItemId: string
  productId: string
  variantId: string | null
  businessId: string
  quantity: number
}

export type ICreateCostEntryParams = {
  variantId?: string
  entryDate: string
  lotQuantity: number
  totalCost: number
  idempotencyKey: string
}
