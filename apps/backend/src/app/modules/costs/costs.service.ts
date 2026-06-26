import httpStatus from 'http-status'
import { prismaAdmin } from '../../../prisma/client'
import ApiError from '../../../errors/ApiError'
import type {
  CostTxClient,
  IAllocateForItemParams,
  ICreateCostEntryParams,
} from './costs.interface'

// Allocate FIFO cost lots for a single order item. MUST run inside a transaction.
// If stock runs below logged cost entries, the gap is silently skipped (no throw).
const allocateForItem = async (
  tx: CostTxClient,
  params: IAllocateForItemParams,
): Promise<void> => {
  const { orderItemId, productId, variantId, businessId, quantity } = params

  const lots = await tx.productCostEntry.findMany({
    where: { productId, variantId: variantId ?? undefined, businessId, remainingQty: { gt: 0 } },
    orderBy: { entryDate: 'asc' },
  })

  let remaining = quantity
  for (const lot of lots) {
    if (remaining <= 0) break

    const toAllocate = Math.min(lot.remainingQty, remaining)
    const costPerUnit = Number(lot.costPerUnit)
    const totalCost = Number((costPerUnit * toAllocate).toFixed(2))

    await tx.orderCostAllocation.create({
      data: {
        orderItemId,
        costEntryId: lot.id,
        quantityAllocated: toAllocate,
        costPerUnit,
        totalCost,
      },
    })
    await tx.productCostEntry.update({
      where: { id: lot.id },
      data: { remainingQty: { decrement: toAllocate } },
    })

    remaining -= toAllocate
  }
}

// Reverse all FIFO allocations for a cancelled/refunded order.
// Must be called in the same transaction as the status change.
const reverseForOrder = async (tx: CostTxClient, orderId: string): Promise<void> => {
  const orderItems = await tx.orderItem.findMany({
    where: { orderId },
    include: { allocations: true },
  })

  for (const item of orderItems) {
    for (const allocation of item.allocations) {
      await tx.productCostEntry.update({
        where: { id: allocation.costEntryId },
        data: { remainingQty: { increment: allocation.quantityAllocated } },
      })
      await tx.orderCostAllocation.delete({ where: { id: allocation.id } })
    }
  }
}

// Log a purchase lot (ProductCostEntry) and increment product stock. Idempotent by key.
const createCostEntry = async (
  businessId: string,
  productId: string,
  params: ICreateCostEntryParams,
) => {
  const { lotQuantity, totalCost, idempotencyKey } = params

  // Idempotency check — findUnique on the raw client (disabled on the scoped client).
  const existing = await prismaAdmin.productCostEntry.findUnique({ where: { idempotencyKey } })
  if (existing) {
    const sameBody =
      existing.lotQuantity === lotQuantity &&
      Number(existing.totalCost) === totalCost &&
      existing.businessId === businessId
    if (sameBody) {
      return { entry: existing, created: false }
    }
    throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'Idempotency key conflict: same key, different body')
  }

  const costPerUnit = Number((totalCost / lotQuantity).toFixed(2))
  const entry = await prismaAdmin.productCostEntry.create({
    data: {
      productId,
      variantId: params.variantId ?? null,
      businessId,
      entryDate: new Date(params.entryDate),
      lotQuantity,
      remainingQty: lotQuantity,
      totalCost,
      costPerUnit,
      idempotencyKey,
    },
  })

  await prismaAdmin.product.update({
    where: { id: productId },
    data: { currentStock: { increment: lotQuantity } },
  })

  return { entry, created: true }
}

export const CostsService = {
  allocateForItem,
  reverseForOrder,
  createCostEntry,
}
