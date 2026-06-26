import { OrderStatus, PaymentMethod, Prisma } from '@prisma/client'
import httpStatus from 'http-status'
import { prismaAdmin } from '../../../prisma/client'
import type { ScopedPrisma, AdminPrisma } from '../../../prisma/types'
import ApiError from '../../../errors/ApiError'
import { CostsService } from '../costs/costs.service'
import type { CostTxClient } from '../costs/costs.interface'
import { CustomersService } from '../customers/customers.service'
import { emailQueue } from '../../../jobs/emailQueue'
import { redis } from '../../../shared/redis/client'
import {
  VALID_TRANSITIONS,
  TERMINAL_STATUSES,
  NOTIFIABLE_STATUSES,
  ORDER_CAP_WARNING_THRESHOLD,
} from './orders.constants'
import type {
  IOrderFilters,
  ICreateOrderInput,
  IOrderItemInput,
  IUpdateOrderMetadataInput,
  ITransitionParams,
  IOrderCapWarning,
} from './orders.interface'

// update/create are not intercepted by the scoped client — reach them through the
// writable (admin-typed) view. Preserves existing behavior exactly.
const writable = (db: ScopedPrisma) => db as unknown as AdminPrisma

// --- reads -----------------------------------------------------------------

const list = (db: ScopedPrisma, filters: IOrderFilters) => {
  const { status, courierId, paymentMethod, from, to, page = 1, limit = 30 } = filters
  return db.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(courierId ? { courierId } : {}),
      ...(paymentMethod ? { paymentMethod: paymentMethod as PaymentMethod } : {}),
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

const getById = (db: ScopedPrisma, orderId: string) =>
  db.order.findFirst({
    where: { id: orderId },
    include: {
      customer: { include: { addresses: true } },
      courier: true,
      items: { include: { allocations: { include: { costEntry: true } } } },
      orderNotes: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

// --- order cap (module-private) --------------------------------------------

const getOrderCountFromDb = (businessId: string, yearMonth: string) => {
  const [year, month] = yearMonth.split('-').map(Number)
  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 1)
  return prismaAdmin.order.count({
    where: { businessId, createdAt: { gte: from, lt: to }, deletedAt: null },
  })
}

const checkOrderCap = async (businessId: string): Promise<IOrderCapWarning | null> => {
  const yearMonth = new Date().toISOString().slice(0, 7)
  const redisKey = `orders:count:${businessId}:${yearMonth}`

  let count: number
  try {
    const cached = await redis.get(redisKey)
    count = cached ? parseInt(cached, 10) : await getOrderCountFromDb(businessId, yearMonth)
  } catch {
    count = await getOrderCountFromDb(businessId, yearMonth)
  }

  const sub = await prismaAdmin.subscription.findUnique({
    where: { businessId },
    include: { plan: { select: { maxOrdersPerMonth: true } } },
  })
  const cap = sub?.plan.maxOrdersPerMonth ?? null
  if (cap === null) return null

  if (count >= cap) {
    throw new ApiError(
      httpStatus.PAYMENT_REQUIRED,
      `Monthly order limit reached (${cap}). Upgrade your plan.`,
      { code: 'ORDER_CAP_REACHED' },
    )
  }
  if (count >= Math.floor(cap * ORDER_CAP_WARNING_THRESHOLD)) {
    return { type: 'ORDER_CAP_NEAR', used: count, cap }
  }
  return null
}

// --- create (module-private helpers + public method) -----------------------

const nextOrderNumber = async (tx: CostTxClient, businessId: string) => {
  const seqName = `orders_seq_${businessId.replace(/-/g, '')}`
  const result = await tx.$queryRawUnsafe<[{ nextval: bigint }]>(`SELECT nextval('${seqName}')`)
  return Number(result[0].nextval)
}

const loadNameSnapshots = async (tx: CostTxClient, items: IOrderItemInput[]) => {
  const productIds = [...new Set(items.map((i) => i.productId))]
  const variantIds = items.map((i) => i.variantId).filter(Boolean) as string[]

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

  return {
    productMap: new Map(products.map((p) => [p.id, p.name])),
    variantMap: new Map(variants.map((v) => [v.id, v.name])),
  }
}

const buildOrderItemsData = (
  businessId: string,
  items: IOrderItemInput[],
  productMap: Map<string, string>,
  variantMap: Map<string, string>,
) =>
  items.map((item) => ({
    businessId,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: Number((item.unitPrice * item.quantity).toFixed(2)),
    productNameSnapshot: productMap.get(item.productId) ?? '',
    variantNameSnapshot: item.variantId ? (variantMap.get(item.variantId) ?? null) : null,
  }))

const create = async (businessId: string, data: ICreateOrderInput) => {
  const warning = await checkOrderCap(businessId)

  const order = await prismaAdmin.$transaction(async (tx) => {
    const orderNumber = await nextOrderNumber(tx, businessId)
    const { productMap, variantMap } = await loadNameSnapshots(tx, data.items)

    const subtotal = data.items.reduce(
      (sum, item) => sum + Number((item.unitPrice * item.quantity).toFixed(2)),
      0,
    )
    const total = Number((subtotal + data.deliveryFee).toFixed(2))

    const created = await tx.order.create({
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
        items: { create: buildOrderItemsData(businessId, data.items, productMap, variantMap) },
      },
      include: { items: true },
    })

    for (const item of created.items) {
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

    return created
  })

  return { order, warning }
}

// --- metadata / soft delete / COD confirmation -----------------------------

const updateMetadata = (db: ScopedPrisma, orderId: string, data: IUpdateOrderMetadataInput) =>
  writable(db).order.update({ where: { id: orderId }, data })

const softDelete = (db: ScopedPrisma, orderId: string) =>
  writable(db).order.update({ where: { id: orderId }, data: { deletedAt: new Date() } })

const confirmCodPayment = async (db: ScopedPrisma, orderId: string) => {
  const order = await db.order.findFirst({ where: { id: orderId, status: 'delivered' } })
  if (!order) {
    throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'Order not found or not delivered')
  }
  return writable(db).order.update({
    where: { id: orderId },
    data: { isCodPaymentConfirmed: true },
  })
}

// --- status transition (folded from OrderStateService) ---------------------
// The ONLY status-write path. Decomposed into small, testable helpers.

const loadOrderForTransition = (tx: CostTxClient, orderId: string, businessId: string) =>
  tx.order.findFirst({
    where: { id: orderId, businessId, deletedAt: null },
    include: { items: true, customer: { select: { email: true, name: true } } },
  })

type TransitionOrder = NonNullable<Awaited<ReturnType<typeof loadOrderForTransition>>>

const assertTransitionAllowed = (order: TransitionOrder, toStatus: OrderStatus) => {
  if (TERMINAL_STATUSES.includes(order.status)) {
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      `Cannot transition from terminal status: ${order.status}`,
    )
  }
  const valid = VALID_TRANSITIONS[order.status] ?? []
  if (!valid.includes(toStatus)) {
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      `Invalid transition: ${order.status} → ${toStatus}`,
    )
  }
  if (toStatus === 'packed' && !order.courierId) {
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      'A courier must be assigned before packing the order',
    )
  }
  if (toStatus === 'refunded' && order.status === 'cancelled' && order.paymentMethod === 'cod') {
    throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'COD cancelled orders cannot be refunded')
  }
}

const buildStatusUpdateData = (
  order: TransitionOrder,
  toStatus: OrderStatus,
): Prisma.OrderUpdateInput => {
  const updateData: Prisma.OrderUpdateInput = { status: toStatus }
  // delivery_failed_at and delivery_attempts must change atomically with status.
  if (toStatus === 'delivery_failed') {
    updateData.deliveryFailedAt = new Date()
    updateData.deliveryAttempts = { increment: 1 }
  }
  if (order.status === 'delivery_failed' && toStatus === 'handover_to_courier') {
    updateData.deliveryFailedAt = null
  }
  return updateData
}

const applyCancellationSideEffects = async (
  tx: CostTxClient,
  order: TransitionOrder,
  businessId: string,
) => {
  await CostsService.reverseForOrder(tx, order.id)
  await CustomersService.decrementOrderCounters(
    tx as unknown as AdminPrisma,
    order.customerId,
    businessId,
    Number(order.total),
  )
}

const recordStatusNote = (
  tx: CostTxClient,
  params: {
    orderId: string
    businessId: string
    userId: string
    toStatus: OrderStatus
    reason: string
  },
) =>
  tx.orderNote.create({
    data: {
      orderId: params.orderId,
      businessId: params.businessId,
      userId: params.userId,
      content: `Status changed to ${params.toStatus}: ${params.reason}`,
    },
  })

const enqueueStatusEmail = (
  toStatus: OrderStatus,
  payload: {
    orderId: string
    orderNumber: number
    customerEmail: string | null
    customerName: string
  },
) => {
  if (!NOTIFIABLE_STATUSES.includes(toStatus) || !payload.customerEmail) return
  emailQueue
    .add('order_status', {
      type: 'order_status',
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      newStatus: toStatus,
      recipientEmail: payload.customerEmail,
      recipientName: payload.customerName,
    })
    .catch((err: Error) => console.error('[email] queue error:', err.message))
}

const transition = async (params: ITransitionParams): Promise<void> => {
  const { orderId, businessId, toStatus, reason, userId } = params

  const emailPayload = await prismaAdmin.$transaction(async (tx) => {
    const order = await loadOrderForTransition(tx, orderId, businessId)
    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found')
    }

    assertTransitionAllowed(order, toStatus)

    await tx.order.update({ where: { id: orderId }, data: buildStatusUpdateData(order, toStatus) })

    if (toStatus === 'cancelled') {
      await applyCancellationSideEffects(tx, order, businessId)
    }

    if (reason) {
      await recordStatusNote(tx, { orderId, businessId, userId, toStatus, reason })
    }

    return {
      orderId,
      orderNumber: order.orderNumber,
      customerEmail: order.customer.email,
      customerName: order.customer.name,
    }
  })

  enqueueStatusEmail(toStatus, emailPayload)
}

// --- per-order cost breakdown + notes (moved out of routes) ----------------

const getCostBreakdown = async (db: ScopedPrisma, businessId: string, orderId: string) => {
  const order = await db.order.findFirst({
    where: { id: orderId },
    select: { total: true, deliveryFee: true, status: true },
  })
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found')
  }

  // OrderCostAllocation has no businessId — filter through the order relation.
  const allocations = await prismaAdmin.orderCostAllocation.findMany({
    where: { orderItem: { order: { id: orderId, businessId, deletedAt: null } } },
    include: {
      costEntry: { include: { product: { select: { name: true } } } },
      orderItem: { select: { quantity: true } },
    },
  })

  const totalCost = allocations.reduce((sum, a) => sum + Number(a.totalCost), 0)
  const revenue = Number(order.total) - Number(order.deliveryFee)
  const profit = Number((revenue - totalCost).toFixed(2))
  const margin = revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0

  return {
    totalRevenue: Number(revenue.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    profit,
    margin,
    allocations: allocations.map((a) => ({
      productName: a.costEntry.product.name,
      quantity: a.orderItem.quantity,
      costPerUnit: Number(a.costEntry.costPerUnit),
      totalCost: Number(a.totalCost),
    })),
    note:
      allocations.length === 0
        ? order.status === 'delivery_failed'
          ? 'Cost allocation reversed (delivery failed)'
          : 'No cost data — log a purchase for this product to enable COGS tracking'
        : null,
  }
}

const addNote = async (
  db: ScopedPrisma,
  businessId: string,
  userId: string,
  orderId: string,
  content: string,
) => {
  const order = await db.order.findFirst({ where: { id: orderId }, select: { id: true } })
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found')
  }
  return prismaAdmin.orderNote.create({
    data: { orderId, businessId, userId, content },
    include: { user: { select: { id: true, name: true } } },
  })
}

export const OrdersService = {
  list,
  getById,
  create,
  updateMetadata,
  softDelete,
  confirmCodPayment,
  transition,
  getCostBreakdown,
  addNote,
}
