import { z } from 'zod'

// Permissive form schema — uses z.coerce.number() for number inputs from HTML forms.
// Do NOT use CreateOrderSchema from packages/shared here.
export const newOrderFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  courierId: z.string().nullable(),
  paymentMethod: z.enum(['cod', 'bkash', 'nagad', 'rocket', 'bank_transfer', 'other']),
  deliveryFee: z.coerce.number().nonnegative(),
  notes: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product required'),
        variantId: z.string().nullable(),
        quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
        unitPrice: z.coerce.number().nonnegative(),
      }),
    )
    .min(1, 'Add at least one item'),
})

export type NewOrderFormValues = z.infer<typeof newOrderFormSchema>
