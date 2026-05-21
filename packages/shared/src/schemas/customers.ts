import { z } from 'zod'

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  phone: z.string().min(1),
})

export type Customer = z.infer<typeof CustomerSchema>
