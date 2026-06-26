import { prismaAdmin } from '../../../../prisma/client'
import { CostsService } from '../costs.service'

// Hits the real test database — no mocks.

async function createTestBusiness(planId = 'starter') {
  const now = new Date()
  return prismaAdmin.business.create({
    data: {
      name: `Costs Test ${Date.now()}`,
      slug: `costs-test-${Date.now()}`,
      subscription: {
        create: {
          planId,
          status: 'active',
          billingAnchorDate: now,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      emailPreferences: { create: {} },
      users: {
        create: {
          email: `costs-${Date.now()}@test.com`,
          passwordHash: 'x',
          name: 'Owner',
          role: 'owner',
        },
      },
    },
  })
}

async function cleanupBusiness(businessId: string) {
  await prismaAdmin.orderCostAllocation.deleteMany({
    where: { orderItem: { order: { businessId } } },
  })
  await prismaAdmin.orderItem.deleteMany({ where: { order: { businessId } } })
  await prismaAdmin.order.deleteMany({ where: { businessId } })
  await prismaAdmin.productCostEntry.deleteMany({ where: { businessId } })
  await prismaAdmin.productVariant.deleteMany({ where: { businessId } })
  await prismaAdmin.product.deleteMany({ where: { businessId } })
  await prismaAdmin.customer.deleteMany({ where: { businessId } })
  await prismaAdmin.subscription.deleteMany({ where: { businessId } })
  await prismaAdmin.emailPreference.deleteMany({ where: { businessId } })
  await prismaAdmin.user.deleteMany({ where: { businessId } })
  await prismaAdmin.business.delete({ where: { id: businessId } })
}

afterAll(async () => {
  await prismaAdmin.$disconnect()
})

describe('CostsService — FIFO allocation', () => {
  it('depletes oldest lot first and creates allocation record', async () => {
    const biz = await createTestBusiness()

    const product = await prismaAdmin.product.create({
      data: { businessId: biz.id, name: 'Panjabi', price: 500, currentStock: 0 },
    })

    const lotJan = await prismaAdmin.productCostEntry.create({
      data: {
        productId: product.id,
        businessId: biz.id,
        entryDate: new Date('2026-01-01'),
        lotQuantity: 5,
        remainingQty: 5,
        totalCost: 250,
        costPerUnit: 50,
        idempotencyKey: `fifo-jan-${Date.now()}`,
      },
    })
    await prismaAdmin.productCostEntry.create({
      data: {
        productId: product.id,
        businessId: biz.id,
        entryDate: new Date('2026-02-01'),
        lotQuantity: 10,
        remainingQty: 10,
        totalCost: 600,
        costPerUnit: 60,
        idempotencyKey: `fifo-feb-${Date.now()}`,
      },
    })

    const customer = await prismaAdmin.customer.create({
      data: { businessId: biz.id, name: 'Cust', phone: `01${Date.now()}` },
    })
    const order = await prismaAdmin.order.create({
      data: {
        businessId: biz.id,
        orderNumber: Math.floor(Math.random() * 999999),
        customerId: customer.id,
        paymentMethod: 'cod',
        subtotal: 500,
        deliveryFee: 0,
        total: 500,
        items: {
          create: [
            {
              businessId: biz.id,
              productId: product.id,
              variantId: null,
              quantity: 3,
              unitPrice: 500,
              totalPrice: 500,
              productNameSnapshot: 'Panjabi',
              variantNameSnapshot: null,
            },
          ],
        },
      },
      include: { items: true },
    })

    await prismaAdmin.$transaction(async (tx) => {
      await CostsService.allocateForItem(tx, {
        orderItemId: order.items[0].id,
        productId: product.id,
        variantId: null,
        businessId: biz.id,
        quantity: 3,
      })
    })

    const updatedJan = await prismaAdmin.productCostEntry.findUnique({ where: { id: lotJan.id } })
    expect(updatedJan?.remainingQty).toBe(2)

    const allocations = await prismaAdmin.orderCostAllocation.findMany({
      where: { orderItemId: order.items[0].id },
    })
    expect(allocations).toHaveLength(1)
    expect(Number(allocations[0].costPerUnit)).toBe(50)
    expect(allocations[0].quantityAllocated).toBe(3)

    await cleanupBusiness(biz.id)
  })

  it('reverseForOrder restores remaining qty and deletes allocations', async () => {
    const biz = await createTestBusiness()
    const product = await prismaAdmin.product.create({
      data: { businessId: biz.id, name: 'Shirt', price: 300, currentStock: 0 },
    })

    const lot = await prismaAdmin.productCostEntry.create({
      data: {
        productId: product.id,
        businessId: biz.id,
        entryDate: new Date('2026-03-01'),
        lotQuantity: 10,
        remainingQty: 10,
        totalCost: 500,
        costPerUnit: 50,
        idempotencyKey: `reverse-${Date.now()}`,
      },
    })

    const customer = await prismaAdmin.customer.create({
      data: { businessId: biz.id, name: 'Cust', phone: `01${Date.now()}` },
    })
    const order = await prismaAdmin.order.create({
      data: {
        businessId: biz.id,
        orderNumber: Math.floor(Math.random() * 999999),
        customerId: customer.id,
        paymentMethod: 'cod',
        subtotal: 300,
        deliveryFee: 0,
        total: 300,
        items: {
          create: [
            {
              businessId: biz.id,
              productId: product.id,
              variantId: null,
              quantity: 2,
              unitPrice: 300,
              totalPrice: 300,
              productNameSnapshot: 'Shirt',
              variantNameSnapshot: null,
            },
          ],
        },
      },
      include: { items: true },
    })

    await prismaAdmin.$transaction(async (tx) => {
      await CostsService.allocateForItem(tx, {
        orderItemId: order.items[0].id,
        productId: product.id,
        variantId: null,
        businessId: biz.id,
        quantity: 2,
      })
    })

    const afterAlloc = await prismaAdmin.productCostEntry.findUnique({ where: { id: lot.id } })
    expect(afterAlloc?.remainingQty).toBe(8)

    await prismaAdmin.$transaction(async (tx) => {
      await CostsService.reverseForOrder(tx, order.id)
    })

    const afterReverse = await prismaAdmin.productCostEntry.findUnique({ where: { id: lot.id } })
    expect(afterReverse?.remainingQty).toBe(10)

    const allocations = await prismaAdmin.orderCostAllocation.findMany({
      where: { orderItemId: order.items[0].id },
    })
    expect(allocations).toHaveLength(0)

    await cleanupBusiness(biz.id)
  })
})
