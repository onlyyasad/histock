import type { PrismaClient } from '@prisma/client'

// FIFO cost allocation. ALL methods must be called inside a Prisma transaction.
export class OrderCostService {
  constructor(
    private tx: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) {}

  // Allocate FIFO cost lots for a single order item.
  // If stock runs below logged cost entries, the gap is silently skipped (no throw).
  async allocateForItem(params: {
    orderItemId: string
    productId: string
    variantId: string | null
    businessId: string
    quantity: number
  }): Promise<void> {
    const { orderItemId, productId, variantId, businessId, quantity } = params

    const lots = await this.tx.productCostEntry.findMany({
      where: {
        productId,
        variantId: variantId ?? undefined,
        businessId,
        remainingQty: { gt: 0 },
      },
      orderBy: { entryDate: 'asc' },
    })

    let remaining = quantity

    for (const lot of lots) {
      if (remaining <= 0) break

      const toAllocate = Math.min(lot.remainingQty, remaining)
      const costPerUnit = Number(lot.costPerUnit)
      const totalCost = Number((costPerUnit * toAllocate).toFixed(2))

      await this.tx.orderCostAllocation.create({
        data: {
          orderItemId,
          costEntryId: lot.id,
          quantityAllocated: toAllocate,
          costPerUnit,
          totalCost,
        },
      })

      await this.tx.productCostEntry.update({
        where: { id: lot.id },
        data: { remainingQty: { decrement: toAllocate } },
      })

      remaining -= toAllocate
    }
  }

  // Reverse all FIFO allocations for a cancelled/refunded order.
  // Must be called in the same transaction as the status change.
  async reverseForOrder(orderId: string): Promise<void> {
    const orderItems = await this.tx.orderItem.findMany({
      where: { orderId },
      include: { allocations: true },
    })

    for (const item of orderItems) {
      for (const allocation of item.allocations) {
        await this.tx.productCostEntry.update({
          where: { id: allocation.costEntryId },
          data: { remainingQty: { increment: allocation.quantityAllocated } },
        })

        await this.tx.orderCostAllocation.delete({ where: { id: allocation.id } })
      }
    }
  }
}
