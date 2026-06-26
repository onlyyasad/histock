import { z } from 'zod'

const createTicket = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    description: z.string().min(1),
    type: z.enum(['bug_report', 'feature_request', 'question']),
  }),
})

// Message field is itself named `body` — wrapped by validateRequest's { body } envelope.
const addMessage = z.object({
  body: z.object({
    body: z.string().min(1),
  }),
})

export const SupportValidation = {
  createTicket,
  addMessage,
}
