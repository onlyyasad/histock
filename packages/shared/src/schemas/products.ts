import { z } from 'zod'

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(300),
  sku: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().nonnegative(),
})

export const UpdateProductSchema = CreateProductSchema.partial()

export const CreateCostEntrySchema = z.object({
  entryDate: z.string().date(),
  lotQuantity: z.number().int().positive(),
  totalCost: z.number().nonnegative(),
})

export const ProductResponseSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  name: z.string(),
  sku: z.string().nullable(),
  description: z.string().nullable(),
  price: z.number(),
  currentStock: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  variants: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        price: z.number(),
        currentStock: z.number().int(),
      }),
    )
    .optional(),
})

export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
export type CreateCostEntryInput = z.infer<typeof CreateCostEntrySchema>
export type ProductResponse = z.infer<typeof ProductResponseSchema>
