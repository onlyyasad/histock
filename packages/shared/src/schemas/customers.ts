import { z } from 'zod'

export const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(11).max(15),
  email: z.string().email().nullable().optional(),
})

export const UpdateCustomerSchema = CreateCustomerSchema.partial()

export const CustomerAddressSchema = z.object({
  label: z.string().min(1).max(100).default('Home'),
  addressLine: z.string().min(1).max(500),
  district: z.string().max(100).optional(),
  division: z.string().max(100).optional(),
  isDefault: z.boolean().default(false),
})

export const CustomerResponseSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  totalOrders: z.number().int(),
  totalSpent: z.number(),
  isFlagged: z.boolean(),
  flagReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  addresses: z
    .array(
      z.object({
        id: z.string().uuid(),
        label: z.string(),
        addressLine: z.string(),
        district: z.string().nullable(),
        division: z.string().nullable(),
        isDefault: z.boolean(),
      }),
    )
    .optional(),
})

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>
export type CustomerAddressInput = z.infer<typeof CustomerAddressSchema>
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>
