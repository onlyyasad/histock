import { z } from 'zod'

export const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(10).max(15),
  email: z.string().email().nullable().optional(),
})

export const UpdateCustomerSchema = CreateCustomerSchema.partial()

export const CreateAddressSchema = z.object({
  label: z.string().min(1).max(100).default('Home'),
  addressLine: z.string().min(1).max(500),
  district: z.string().max(100).optional(),
  division: z.string().max(100).optional(),
  isDefault: z.boolean().default(false),
})

export const UpdateAddressSchema = CreateAddressSchema.partial()

export const FlagCustomerSchema = z.object({
  reason: z.string().min(1).max(500),
})
