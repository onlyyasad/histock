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

export const PaymentMethodSchema = z.enum([
  'cod',
  'bkash',
  'nagad',
  'rocket',
  'bank_transfer',
  'other',
])

export const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
})

export const CreateOrderSchema = z.object({
  customerId: z.string().uuid(),
  courierId: z.string().uuid().nullable(),
  paymentMethod: PaymentMethodSchema,
  deliveryFee: z.number().nonnegative().default(0),
  notes: z.string().max(1000).nullable().optional(),
  items: z.array(OrderItemSchema).min(1),
})

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
  reason: z.string().max(500).optional(),
})

export const OrderResponseSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.number().int(),
  businessId: z.string().uuid(),
  status: OrderStatusSchema,
  paymentMethod: PaymentMethodSchema,
  subtotal: z.number(),
  deliveryFee: z.number(),
  total: z.number(),
  isCodPaymentConfirmed: z.boolean(),
  deliveryFailedAt: z.string().datetime().nullable(),
  deliveryAttempts: z.number().int(),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  customer: z.object({
    id: z.string().uuid(),
    name: z.string(),
    phone: z.string(),
  }),
  courier: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      productId: z.string().uuid(),
      variantId: z.string().uuid().nullable(),
      quantity: z.number().int(),
      unitPrice: z.number(),
      totalPrice: z.number(),
      productNameSnapshot: z.string(),
      variantNameSnapshot: z.string().nullable(),
    }),
  ),
})

export type OrderStatus = z.infer<typeof OrderStatusSchema>
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>
export type OrderResponse = z.infer<typeof OrderResponseSchema>
