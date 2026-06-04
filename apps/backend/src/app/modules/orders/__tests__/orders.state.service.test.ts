import { prismaAdmin } from '../../../../prisma/client'
import { OrderStateService } from '../orders.state.service'
import { redis } from '../../../../shared/redis/client'

// Hits the real test database — no mocks.
// Requires: Docker stack running (postgres + redis).

async function createTestBusiness() {
  const now = new Date()
  return prismaAdmin.business.create({
    data: {
      name: `OSS Test ${Date.now()}`,
      slug: `oss-test-${Date.now()}`,
      subscription: {
        create: {
          planId: 'starter',
          status: 'active',
          billingAnchorDate: now,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      emailPreferences: { create: {} },
      users: {
        create: {
          email: `oss-${Date.now()}@test.com`,
          passwordHash: 'x',
          name: 'Owner',
          role: 'owner',
        },
      },
    },
    include: { users: true },
  })
}

async function createTestOrder(
  businessId: string,
  status: string,
  courierId: string | null = null,
) {
  const customer = await prismaAdmin.customer.create({
    data: { businessId, name: 'Cust', phone: `01${Date.now()}` },
  })
  const product = await prismaAdmin.product.create({
    data: { businessId, name: 'Prod', price: 100, currentStock: 0 },
  })
  return prismaAdmin.order.create({
    data: {
      businessId,
      orderNumber: Math.floor(Math.random() * 999999),
      customerId: customer.id,
      courierId,
      paymentMethod: 'cod',
      subtotal: 100,
      deliveryFee: 0,
      total: 100,
      status: status as never,
      items: {
        create: [
          {
            businessId,
            productId: product.id,
            variantId: null,
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
            productNameSnapshot: 'Prod',
            variantNameSnapshot: null,
          },
        ],
      },
    },
  })
}

async function cleanupBusiness(businessId: string) {
  await prismaAdmin.orderCostAllocation.deleteMany({
    where: { orderItem: { order: { businessId } } },
  })
  await prismaAdmin.orderNote.deleteMany({ where: { businessId } })
  await prismaAdmin.orderItem.deleteMany({ where: { order: { businessId } } })
  await prismaAdmin.order.deleteMany({ where: { businessId } })
  await prismaAdmin.customer.deleteMany({ where: { businessId } })
  await prismaAdmin.product.deleteMany({ where: { businessId } })
  await prismaAdmin.subscription.deleteMany({ where: { businessId } })
  await prismaAdmin.emailPreference.deleteMany({ where: { businessId } })
  await prismaAdmin.user.deleteMany({ where: { businessId } })
  await prismaAdmin.business.delete({ where: { id: businessId } })
}

afterAll(async () => {
  await prismaAdmin.$disconnect()
  await redis.quit()
})

describe('OrderStateService — valid transitions', () => {
  it('pending → processing', async () => {
    const biz = await createTestBusiness()
    const order = await createTestOrder(biz.id, 'pending')
    const svc = new OrderStateService(prismaAdmin)

    await svc.transition({
      orderId: order.id,
      businessId: biz.id,
      toStatus: 'processing',
      userId: biz.users[0].id,
    })

    const updated = await prismaAdmin.order.findUnique({ where: { id: order.id } })
    expect(updated?.status).toBe('processing')
    await cleanupBusiness(biz.id)
  })

  it('processing → packed when courier is assigned', async () => {
    const biz = await createTestBusiness()
    const courier = await prismaAdmin.courier.findFirst({ where: { isActive: true } })
    if (!courier) throw new Error('No active courier in DB — run seed first')

    const order = await createTestOrder(biz.id, 'processing', courier.id)
    const svc = new OrderStateService(prismaAdmin)

    await svc.transition({
      orderId: order.id,
      businessId: biz.id,
      toStatus: 'packed',
      userId: biz.users[0].id,
    })

    const updated = await prismaAdmin.order.findUnique({ where: { id: order.id } })
    expect(updated?.status).toBe('packed')
    await cleanupBusiness(biz.id)
  })

  it('handover_to_courier → delivery_failed sets deliveryFailedAt and increments attempts', async () => {
    const biz = await createTestBusiness()
    const courier = await prismaAdmin.courier.findFirst({ where: { isActive: true } })
    if (!courier) throw new Error('No active courier in DB')

    const order = await createTestOrder(biz.id, 'handover_to_courier', courier.id)
    const svc = new OrderStateService(prismaAdmin)

    await svc.transition({
      orderId: order.id,
      businessId: biz.id,
      toStatus: 'delivery_failed',
      userId: biz.users[0].id,
    })

    const updated = await prismaAdmin.order.findUnique({ where: { id: order.id } })
    expect(updated?.status).toBe('delivery_failed')
    expect(updated?.deliveryFailedAt).not.toBeNull()
    expect(updated?.deliveryAttempts).toBe(1)
    await cleanupBusiness(biz.id)
  })

  it('delivery_failed → handover_to_courier clears deliveryFailedAt', async () => {
    const biz = await createTestBusiness()
    const courier = await prismaAdmin.courier.findFirst({ where: { isActive: true } })
    if (!courier) throw new Error('No active courier in DB')

    const order = await createTestOrder(biz.id, 'delivery_failed', courier.id)
    await prismaAdmin.order.update({
      where: { id: order.id },
      data: { deliveryFailedAt: new Date(), deliveryAttempts: 1 },
    })

    const svc = new OrderStateService(prismaAdmin)
    await svc.transition({
      orderId: order.id,
      businessId: biz.id,
      toStatus: 'handover_to_courier',
      userId: biz.users[0].id,
    })

    const updated = await prismaAdmin.order.findUnique({ where: { id: order.id } })
    expect(updated?.status).toBe('handover_to_courier')
    expect(updated?.deliveryFailedAt).toBeNull()
    await cleanupBusiness(biz.id)
  })
})

describe('OrderStateService — invalid transitions', () => {
  it('packed → processing is invalid', async () => {
    const biz = await createTestBusiness()
    const courier = await prismaAdmin.courier.findFirst({ where: { isActive: true } })
    if (!courier) throw new Error('No active courier in DB')

    const order = await createTestOrder(biz.id, 'packed', courier.id)
    const svc = new OrderStateService(prismaAdmin)

    await expect(
      svc.transition({
        orderId: order.id,
        businessId: biz.id,
        toStatus: 'processing',
        userId: biz.users[0].id,
      }),
    ).rejects.toThrow(/Invalid transition/)
    await cleanupBusiness(biz.id)
  })

  it('processing → packed without courier is blocked', async () => {
    const biz = await createTestBusiness()
    const order = await createTestOrder(biz.id, 'processing', null)
    const svc = new OrderStateService(prismaAdmin)

    await expect(
      svc.transition({
        orderId: order.id,
        businessId: biz.id,
        toStatus: 'packed',
        userId: biz.users[0].id,
      }),
    ).rejects.toThrow(/courier must be assigned/)
    await cleanupBusiness(biz.id)
  })

  it('COD cancelled order cannot transition to refunded', async () => {
    const biz = await createTestBusiness()
    const order = await createTestOrder(biz.id, 'cancelled')
    const svc = new OrderStateService(prismaAdmin)

    await expect(
      svc.transition({
        orderId: order.id,
        businessId: biz.id,
        toStatus: 'refunded',
        userId: biz.users[0].id,
      }),
    ).rejects.toThrow(/COD cancelled orders cannot be refunded/)
    await cleanupBusiness(biz.id)
  })

  it('refunded is a terminal state — no further transitions allowed', async () => {
    const biz = await createTestBusiness()
    const order = await createTestOrder(biz.id, 'refunded')
    const svc = new OrderStateService(prismaAdmin)

    await expect(
      svc.transition({
        orderId: order.id,
        businessId: biz.id,
        toStatus: 'cancelled',
        userId: biz.users[0].id,
      }),
    ).rejects.toThrow(/terminal/)
    await cleanupBusiness(biz.id)
  })
})
