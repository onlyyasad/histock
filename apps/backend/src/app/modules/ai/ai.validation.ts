import { z } from 'zod'
import { AI_GENERATION_TYPES } from './ai.constants'

const generate = z.object({
  body: z.object({
    type: z.enum(AI_GENERATION_TYPES),
    payload: z.record(z.string(), z.string()),
  }),
})

export const AiValidation = {
  generate,
}
