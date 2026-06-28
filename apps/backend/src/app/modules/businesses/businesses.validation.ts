import { z } from 'zod'

const setIsDemo = z.object({
  body: z.object({ isDemo: z.boolean() }),
})

export const BusinessesValidation = { setIsDemo }
