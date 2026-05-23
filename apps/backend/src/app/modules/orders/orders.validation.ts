import { z } from 'zod'

export const CreateOrderSchema = z.object({
  customerId: z.string().uuid(),
  courierId: z.string().uuid().nullable(),
  paymentMethod: z.enum(['cod', 'bkash', 'nagad', 'rocket', 'bank_transfer', 'other']),
  deliveryFee: z.number().nonnegative().default(0),
  notes: z.string().max(1000).nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullable(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
      }),
    )
    .min(1),
})

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'processing',
    'packed',
    'handover_to_courier',
    'delivered',
    'delivery_failed',
    'cancelled',
    'refunded',
  ]),
  reason: z.string().max(500).optional(),
})

export const UpdateOrderMetadataSchema = z.object({
  courierId: z.string().uuid().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
})
