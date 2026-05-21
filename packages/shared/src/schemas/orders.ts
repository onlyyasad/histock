import { z } from 'zod'

export const OrderStatusSchema = z.enum([
  'pending',
  'processing',
  'packed',
  'handover_to_courier',
  'delivered',
  'delivery_failed',
  'cancelled',
  'refunded',
])

export type OrderStatus = z.infer<typeof OrderStatusSchema>
