import { prismaAdmin, prismaWithScope } from '../../../../prisma/client'
import { ProductsService } from '../products.service'
import { redis } from '../../../../shared/redis/client'

// Hits the real test database — no mocks.

async function createTestBusiness(planId = 'starter') {
  const now = new Date()
  return prismaAdmin.business.create({
    data: {
      name: `PS Test ${Date.now()}`,
      slug: `ps-test-${Date.now()}`,
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
          email: `ps-${Date.now()}@test.com`,
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
  await redis.quit()
})

describe('ProductsService — product cap (starter: maxProducts = 5)', () => {
  it('throws PRODUCT_CAP_REACHED when at limit', async () => {
    const biz = await createTestBusiness('starter')
    const db = prismaWithScope(biz.id)

    for (let i = 0; i < 5; i++) {
      await prismaAdmin.product.create({
        data: { businessId: biz.id, name: `Product ${i}`, price: 100, currentStock: 0 },
      })
    }

    await expect(
      ProductsService.createProduct(db, biz.id, { name: 'One Too Many', price: 100 }),
    ).rejects.toMatchObject({ code: 'PRODUCT_CAP_REACHED' })

    await cleanupBusiness(biz.id)
  })

  it('returns PRODUCT_CAP_NEAR warning when at 80% of limit', async () => {
    // 80% of 5 = 4. After creating 4 products, the 5th triggers the warning.
    const biz = await createTestBusiness('starter')
    const db = prismaWithScope(biz.id)

    for (let i = 0; i < 4; i++) {
      await prismaAdmin.product.create({
        data: { businessId: biz.id, name: `Product ${i}`, price: 100, currentStock: 0 },
      })
    }

    const { product, warning } = await ProductsService.createProduct(db, biz.id, {
      name: 'Fifth',
      price: 100,
    })
    expect(product.name).toBe('Fifth')
    expect(warning?.type).toBe('PRODUCT_CAP_NEAR')
    expect(warning?.cap).toBe(5)
    expect(warning?.used).toBe(4)

    await cleanupBusiness(biz.id)
  })

  it('returns no warning when well below limit', async () => {
    const biz = await createTestBusiness('starter')
    const db = prismaWithScope(biz.id)

    const { warning } = await ProductsService.createProduct(db, biz.id, {
      name: 'First',
      price: 100,
    })
    expect(warning).toBeNull()

    await cleanupBusiness(biz.id)
  })
})
