import { OrderStatus } from '@prisma/client'
import { prismaAdmin } from '../../../prisma/client'
import type { prismaWithScope } from '../../../prisma/client'
import { CostsService } from '../costs/costs.service'
import { CustomersService } from '../customers/customers.service'
import { redis } from '../../../shared/redis/client'

type ScopedPrisma = ReturnType<typeof prismaWithScope>

export class OrdersService {
  constructor(private prisma: ScopedPrisma) {}

  list(filters: {
    status?: OrderStatus
    courierId?: string
    paymentMethod?: string
    from?: string
    to?: string
    page?: number
    limit?: number
  }) {
    const { status, courierId, paymentMethod, from, to, page = 1, limit = 30 } = filters
    return this.prisma.order.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(courierId ? { courierId } : {}),
        ...(paymentMethod ? { paymentMethod: paymentMethod as never } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        courier: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })
  }

  getById(orderId: string) {
    return this.prisma.order.findFirst({
      where: { id: orderId },
      include: {
        customer: { include: { addresses: true } },
        courier: true,
        items: {
          include: { allocations: { include: { costEntry: true } } },
        },
        orderNotes: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  }

  async create(
    businessId: string,
    userId: string,
    data: {
      customerId: string
      courierId: string | null
      paymentMethod: never
      deliveryFee: number
      notes?: string | null
      items: Array<{
        productId: string
        variantId: string | null
        quantity: number
        unitPrice: number
      }>
    },
  ) {
    const warning = await this.checkOrderCap(businessId)

    const order = await prismaAdmin.$transaction(async (tx) => {
      const seqName = `orders_seq_${businessId.replace(/-/g, '')}`
      const result = await tx.$queryRawUnsafe<[{ nextval: bigint }]>(
        `SELECT nextval('${seqName}')`,
      )
      const orderNumber = Number(result[0].nextval)

      // Fetch product/variant name snapshots
      const productIds = [...new Set(data.items.map((i) => i.productId))]
      const variantIds = data.items.map((i) => i.variantId).filter(Boolean) as string[]

      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      })
      const variants = variantIds.length
        ? await tx.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, name: true },
          })
        : []

      const productMap = new Map(products.map((p) => [p.id, p.name]))
      const variantMap = new Map(variants.map((v) => [v.id, v.name]))

      const subtotal = data.items.reduce(
        (sum, item) => sum + Number((item.unitPrice * item.quantity).toFixed(2)),
        0,
      )
      const total = Number((subtotal + data.deliveryFee).toFixed(2))

      const order = await tx.order.create({
        data: {
          businessId,
          orderNumber,
          customerId: data.customerId,
          courierId: data.courierId,
          paymentMethod: data.paymentMethod,
          subtotal,
          deliveryFee: data.deliveryFee,
          total,
          notes: data.notes,
          items: {
            create: data.items.map((item) => ({
              businessId,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: Number((item.unitPrice * item.quantity).toFixed(2)),
              productNameSnapshot: productMap.get(item.productId) ?? '',
              variantNameSnapshot: item.variantId ? (variantMap.get(item.variantId) ?? null) : null,
            })),
          },
        },
        include: { items: true },
      })

      for (const item of order.items) {
        await CostsService.allocateForItem(tx, {
          orderItemId: item.id,
          productId: item.productId,
          variantId: item.variantId,
          businessId,
          quantity: item.quantity,
        })
      }

      await CustomersService.incrementOrderCounters(tx as never, data.customerId, businessId, total)

      const monthKey = `orders:count:${businessId}:${new Date().toISOString().slice(0, 7)}`
      await redis.incr(monthKey).catch(() => {})

      return order
    })

    return { order, warning }
  }

  updateMetadata(
    orderId: string,
    data: {
      courierId?: string | null
      notes?: string | null
      tags?: string[]
      linkedOrderId?: string | null
    },
  ) {
    return (this.prisma as unknown as typeof prismaAdmin).order.update({
      where: { id: orderId },
      data,
    })
  }

  softDelete(orderId: string) {
    return (this.prisma as unknown as typeof prismaAdmin).order.update({
      where: { id: orderId },
      data: { deletedAt: new Date() },
    })
  }

  async confirmCodPayment(businessId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, status: 'delivered' },
    })
    if (!order) throw Object.assign(new Error('Order not found or not delivered'), { status: 422 })

    return (this.prisma as unknown as typeof prismaAdmin).order.update({
      where: { id: orderId },
      data: { isCodPaymentConfirmed: true },
    })
  }

  private async checkOrderCap(
    businessId: string,
  ): Promise<{ type: 'ORDER_CAP_NEAR'; used: number; cap: number } | null> {
    const yearMonth = new Date().toISOString().slice(0, 7)
    const redisKey = `orders:count:${businessId}:${yearMonth}`

    let count: number
    try {
      const cached = await redis.get(redisKey)
      count = cached ? parseInt(cached, 10) : await this.getOrderCountFromDb(businessId, yearMonth)
    } catch {
      count = await this.getOrderCountFromDb(businessId, yearMonth)
    }

    const sub = await prismaAdmin.subscription.findUnique({
      where: { businessId },
      include: { plan: { select: { maxOrdersPerMonth: true } } },
    })

    const cap = sub?.plan.maxOrdersPerMonth ?? null
    if (cap === null) return null

    if (count >= cap) {
      throw Object.assign(
        new Error(`Monthly order limit reached (${cap}). Upgrade your plan.`),
        { status: 402, code: 'ORDER_CAP_REACHED' },
      )
    }

    if (count >= Math.floor(cap * 0.9)) {
      return { type: 'ORDER_CAP_NEAR' as const, used: count, cap }
    }

    return null
  }

  private async getOrderCountFromDb(businessId: string, yearMonth: string): Promise<number> {
    const [year, month] = yearMonth.split('-').map(Number)
    const from = new Date(year, month - 1, 1)
    const to = new Date(year, month, 1)
    return prismaAdmin.order.count({
      where: { businessId, createdAt: { gte: from, lt: to }, deletedAt: null },
    })
  }
}
