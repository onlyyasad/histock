import { z } from 'zod'

const createRemittance = z.object({
  body: z.object({
    courierId: z.string().uuid(),
    batchName: z.string().min(1).max(200),
    orderIds: z.array(z.string().uuid()).min(1),
  }),
})

const importRemittance = z.object({
  body: z.object({
    courierId: z.string().uuid(),
    batchName: z.string().min(1).max(200),
    fileName: z.string().min(1),
    orders: z
      .array(z.object({ orderId: z.string().uuid(), codAmount: z.number().positive() }))
      .min(1),
    unmatchedCount: z.number().int().min(0).default(0),
  }),
})

export const RemittanceValidation = {
  createRemittance,
  importRemittance,
}
