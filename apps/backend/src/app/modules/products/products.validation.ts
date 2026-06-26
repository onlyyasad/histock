import { z } from 'zod'

const createProduct = z.object({
  body: z.object({
    name: z.string().min(1).max(300),
    sku: z.string().max(100).optional(),
    description: z.string().max(2000).optional(),
    price: z.number().nonnegative(),
  }),
})

const updateProduct = z.object({
  body: z.object({
    name: z.string().min(1).max(300).optional(),
    sku: z.string().max(100).optional(),
    description: z.string().max(2000).optional(),
    price: z.number().nonnegative().optional(),
    isActive: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  }),
})

const createVariant = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    sku: z.string().max(100).optional(),
    price: z.number().nonnegative(),
  }),
})

const createCostEntry = z.object({
  body: z.object({
    entryDate: z.string().date(),
    lotQuantity: z.number().int().positive(),
    totalCost: z.number().nonnegative(),
  }),
})

export const ProductValidation = {
  createProduct,
  updateProduct,
  createVariant,
  createCostEntry,
}
