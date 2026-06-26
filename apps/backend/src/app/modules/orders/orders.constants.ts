import { OrderStatus } from '@prisma/client'

// The 8-state machine: allowed next states per current state.
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['handover_to_courier', 'cancelled'],
  handover_to_courier: ['delivered', 'delivery_failed', 'cancelled'],
  delivery_failed: ['handover_to_courier', 'cancelled'],
  delivered: ['refunded'],
  cancelled: ['refunded'],
  refunded: [],
}

export const TERMINAL_STATUSES: OrderStatus[] = ['refunded']

// Statuses that trigger a customer notification email.
export const NOTIFIABLE_STATUSES: OrderStatus[] = [
  'processing',
  'packed',
  'handover_to_courier',
  'delivered',
  'delivery_failed',
  'cancelled',
]

// Monthly order cap warns at 90% before hard-blocking at the limit.
export const ORDER_CAP_WARNING_THRESHOLD = 0.9
