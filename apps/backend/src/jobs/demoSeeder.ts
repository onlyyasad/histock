import { Queue, Worker } from 'bullmq'
import bcrypt from 'bcryptjs'
import { prismaAdmin } from '../prisma/client'
import { redis } from '../shared/redis/client'
import {
  DEMO_BUSINESS_SLUG,
  DEMO_OWNER,
  DEMO_MANAGER,
  DEMO_STAFF,
  DEMO_PRODUCTS,
  DEMO_CUSTOMER_NAMES,
  DEMO_COURIER_NAMES,
} from './demoSeedData'

export const DEMO_SEED_QUEUE = 'demo-seed'
export const demoSeedQueue = new Queue(DEMO_SEED_QUEUE, { connection: redis })

export async function scheduleDemoSeed() {
  await demoSeedQueue.add(
    'nightly-reseed',
    {},
    {
      repeat: { pattern: '0 18 * * *', tz: 'UTC' },
      jobId: 'demo-reseed-nightly',
    },
  )
  console.log('[demo-seed] Nightly reseed scheduled for 18:00 UTC')
}

export const demoSeedWorker = new Worker(
  DEMO_SEED_QUEUE,
  async (job) => {
    console.log(`[demo-seed] Starting reseed job ${job.id}`)
    await reseedDemoData()
    console.log(`[demo-seed] Reseed complete`)
  },
  { connection: redis, concurrency: 1 },
)

demoSeedWorker.on('failed', (job, err) => {
  console.error(`[demo-seed] Job ${job?.id} failed:`, err)
})

async function reseedDemoData() {
  let business = await prismaAdmin.business.findFirst({
    where: { slug: DEMO_BUSINESS_SLUG },
  })

  if (!business) {
    business = await prismaAdmin.business.create({
      data: {
        name: 'Demo Business',
        slug: DEMO_BUSINESS_SLUG,
        isDemo: true,
      },
    })
  }

  const businessId = business.id

  // Hard-delete all existing demo data (dependent tables first)
  // OrderCostAllocation links to orderItem — cascade delete handles it via orderItem onDelete: Cascade
  await prismaAdmin.orderItem.deleteMany({ where: { businessId } })
  await prismaAdmin.orderNote.deleteMany({ where: { order: { businessId } } })
  await prismaAdmin.order.deleteMany({ where: { businessId } })
  await prismaAdmin.productCostEntry.deleteMany({ where: { businessId } })
  await prismaAdmin.product.deleteMany({ where: { businessId } })
  await prismaAdmin.customerAddress.deleteMany({ where: { businessId } })
  await prismaAdmin.customer.deleteMany({ where: { businessId } })
  await prismaAdmin.user.deleteMany({ where: { businessId } })

  // Create demo users
  const [ownerHash, managerHash, staffHash] = await Promise.all([
    bcrypt.hash(DEMO_OWNER.password, 12),
    bcrypt.hash(DEMO_MANAGER.password, 12),
    bcrypt.hash(DEMO_STAFF.password, 12),
  ])

  await prismaAdmin.$transaction([
    prismaAdmin.user.create({
      data: {
        businessId,
        email: DEMO_OWNER.email,
        passwordHash: ownerHash,
        name: DEMO_OWNER.name,
        role: DEMO_OWNER.role,
      },
    }),
    prismaAdmin.user.create({
      data: {
        businessId,
        email: DEMO_MANAGER.email,
        passwordHash: managerHash,
        name: DEMO_MANAGER.name,
        role: DEMO_MANAGER.role,
      },
    }),
    prismaAdmin.user.create({
      data: {
        businessId,
        email: DEMO_STAFF.email,
        passwordHash: staffHash,
        name: DEMO_STAFF.name,
        role: DEMO_STAFF.role,
      },
    }),
  ])

  // Create products with cost entries
  const productData: Array<{ id: string; name: string }> = []
  for (const p of DEMO_PRODUCTS) {
    const costPerUnit = Number((p.totalCost / p.lotQuantity).toFixed(2))
    const product = await prismaAdmin.product.create({
      data: {
        businessId,
        name: p.name,
        sku: p.sku,
        price: p.price,
        currentStock: p.lotQuantity,
        costEntries: {
          create: {
            businessId,
            entryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            lotQuantity: p.lotQuantity,
            remainingQty: p.lotQuantity,
            totalCost: p.totalCost,
            costPerUnit,
            idempotencyKey: `demo-${businessId}-${p.sku}-seed`,
          },
        },
      },
    })
    productData.push({ id: product.id, name: product.name })
  }

  // Create customers
  const customerIds: string[] = []
  const phoneBase = 1711000000
  for (let i = 0; i < 50; i++) {
    const baseName = DEMO_CUSTOMER_NAMES[i % DEMO_CUSTOMER_NAMES.length]
    const suffix = i >= DEMO_CUSTOMER_NAMES.length ? ` ${Math.floor(i / DEMO_CUSTOMER_NAMES.length) + 1}` : ''
    const customer = await prismaAdmin.customer.create({
      data: {
        businessId,
        name: `${baseName}${suffix}`,
        phone: `0${phoneBase + i}`,
        addresses: {
          create: {
            businessId,
            label: 'Home',
            addressLine: `Road ${i + 1}, Block A, Dhaka`,
            isDefault: true,
          },
        },
      },
    })
    customerIds.push(customer.id)
  }

  // Get courier IDs
  const couriers = await prismaAdmin.courier.findMany({
    where: { name: { in: DEMO_COURIER_NAMES } },
    select: { id: true },
  })

  // Create ~90 orders spread over 30 days
  const STATUSES = [
    'delivered', 'delivered', 'delivered', 'delivered',
    'processing', 'packed', 'handover_to_courier',
    'delivery_failed', 'cancelled', 'pending',
  ] as const

  const PAYMENT_METHODS = ['cod', 'cod', 'cod', 'cod', 'bkash'] as const

  const now = Date.now()
  let orderCounter = 1

  for (let day = 0; day < 30; day++) {
    const dayAgoMs = now - day * 24 * 60 * 60 * 1000
    const ordersOnDay = 2 + Math.floor(Math.random() * 4)

    for (let o = 0; o < ordersOnDay; o++) {
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)]
      const product = productData[Math.floor(Math.random() * productData.length)]
      const courier = couriers.length > 0 ? couriers[Math.floor(Math.random() * couriers.length)] : null
      const status = STATUSES[Math.floor(Math.random() * STATUSES.length)]
      const paymentMethod = PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)]
      const qty = 1 + Math.floor(Math.random() * 3)
      const unitPrice = Number((500 + Math.random() * 1000).toFixed(2))
      const totalPrice = Number((unitPrice * qty).toFixed(2))
      const deliveryFee = [60, 70, 80][Math.floor(Math.random() * 3)]
      const subtotal = totalPrice
      const total = Number((subtotal + deliveryFee).toFixed(2))
      const createdAt = new Date(dayAgoMs + Math.random() * 8 * 60 * 60 * 1000)

      await prismaAdmin.order.create({
        data: {
          businessId,
          orderNumber: orderCounter++,
          customerId,
          courierId: courier?.id ?? null,
          status,
          paymentMethod,
          subtotal,
          deliveryFee,
          total,
          deliveryFailedAt: status === 'delivery_failed' ? new Date(dayAgoMs + 2 * 86400000) : null,
          createdAt,
          items: {
            create: {
              businessId,
              productId: product.id,
              quantity: qty,
              unitPrice,
              totalPrice,
              productNameSnapshot: product.name,
            },
          },
        },
      })
    }
  }

  // Reset Redis order counter for this business
  const yearMonth = new Date().toISOString().slice(0, 7)
  await redis.del(`orders:count:${businessId}:${yearMonth}`)

  console.log(
    `[demo-seed] Seeded ${DEMO_PRODUCTS.length} products, 50 customers, ${orderCounter - 1} orders`,
  )
}
