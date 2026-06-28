import { z } from 'zod'

const update = z.object({
  body: z.object({
    action: z.enum(['reply', 'resolve']),
    content: z.string().min(1).optional(),
  }),
})

export const InquiriesValidation = { update }
