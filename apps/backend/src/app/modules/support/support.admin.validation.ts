import { z } from 'zod'

const addMessage = z.object({
  body: z.object({ body: z.string().min(1) }),
})

const setStatus = z.object({
  body: z.object({ status: z.enum(['open', 'in_progress', 'resolved', 'closed']) }),
})

export const SupportAdminValidation = { addMessage, setStatus }
