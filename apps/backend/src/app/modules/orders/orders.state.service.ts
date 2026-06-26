import type { OrderStatus, PrismaClient } from '@prisma/client'
import { CostsService } from '../costs/costs.service'
import { CustomersService } from '../customers/customers.service'
import { emailQueue } from '../../../jobs/emailQueue'

// OrderStateService is the ONLY place where order status changes.
// No direct prisma.order.update({ data: { status } }) in route handlers — enforced by ESLint.
//
// Valid transitions:
//   pending → processing | cancelled
//   processing → packed | cancelled
//   packed → handover_to_courier | cancelled
//   handover_to_courier → delivered | delivery_failed | cancelled
//   delivery_failed → handover_to_courier | cancelled
//   delivered → refunded
//   cancelled (prepaid only) → refunded
//   COD cancelled → cannot refund

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['handover_to_courier', 'cancelled'],
  handover_to_courier: ['delivered', 'delivery_failed', 'cancelled'],
  delivery_failed: ['handover_to_courier', 'cancelled'],
  delivered: ['refunded'],
  cancelled: ['refunded'],
  refunded: [],
}

const TERMINAL: OrderStatus[] = ['refunded']

export class OrderStateService {
  constructor(
    private prisma: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) {}

  async transition(params: {
    orderId: string
    businessId: string
    toStatus: OrderStatus
    reason?: string
    userId: string
  }): Promise<void> {
    const { orderId, businessId, toStatus, reason, userId } = params

    const emailPayload = await (this.prisma as PrismaClient).$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, businessId, deletedAt: null },
        include: { items: true, customer: { select: { email: true, name: true } } },
      })

      if (!order) throw Object.assign(new Error('Order not found'), { status: 404 })
      if (TERMINAL.includes(order.status)) {
        throw Object.assign(
          new Error(`Cannot transition from terminal status: ${order.status}`),
          { status: 422 },
        )
      }

      const valid = VALID_TRANSITIONS[order.status] ?? []
      if (!valid.includes(toStatus)) {
        throw Object.assign(
          new Error(`Invalid transition: ${order.status} → ${toStatus}`),
          { status: 422 },
        )
      }

      if (toStatus === 'packed' && !order.courierId) {
        throw Object.assign(
          new Error('A courier must be assigned before packing the order'),
          { status: 422 },
        )
      }

      if (
        toStatus === 'refunded' &&
        order.status === 'cancelled' &&
        order.paymentMethod === 'cod'
      ) {
        throw Object.assign(new Error('COD cancelled orders cannot be refunded'), { status: 422 })
      }

      const updateData: Record<string, unknown> = { status: toStatus }

      // delivery_failed_at and delivery_attempts must change atomically with status
      if (toStatus === 'delivery_failed') {
        updateData.deliveryFailedAt = new Date()
        updateData.deliveryAttempts = { increment: 1 }
      }

      if (order.status === 'delivery_failed' && toStatus === 'handover_to_courier') {
        updateData.deliveryFailedAt = null
      }

      await tx.order.update({ where: { id: orderId }, data: updateData })

      // On cancellation: reverse FIFO cost allocations and customer counters in same TX
      if (toStatus === 'cancelled') {
        await CostsService.reverseForOrder(tx, orderId)

        await CustomersService.decrementOrderCounters(
          tx as unknown as typeof import('../../../prisma/client').prismaAdmin,
          order.customerId,
          businessId,
          Number(order.total),
        )
      }

      if (reason) {
        await tx.orderNote.create({
          data: {
            orderId,
            businessId,
            userId,
            content: `Status changed to ${toStatus}: ${reason}`,
          },
        })
      }

      return {
        orderNumber: order.orderNumber,
        customerEmail: order.customer.email,
        customerName: order.customer.name,
      }
    })

    const notifiableStatuses: OrderStatus[] = [
      'processing', 'packed', 'handover_to_courier', 'delivered', 'delivery_failed', 'cancelled',
    ]
    const { orderNumber, customerEmail, customerName } = emailPayload
    if (notifiableStatuses.includes(toStatus) && customerEmail) {
      emailQueue
        .add('order_status', {
          type: 'order_status',
          orderId,
          orderNumber,
          newStatus: toStatus,
          recipientEmail: customerEmail,
          recipientName: customerName,
        })
        .catch((err: Error) => console.error('[email] queue error:', err.message))
    }
  }
}
