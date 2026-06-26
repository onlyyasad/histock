import { z } from 'zod'
import handleZodError from '../handleZodError'

describe('handleZodError', () => {
  it('maps zod issues to a 400 Validation Error response', () => {
    const schema = z.object({ body: z.object({ email: z.string().email() }) })
    const result = schema.safeParse({ body: { email: 'not-an-email' } })
    expect(result.success).toBe(false)
    if (result.success) return

    const simplified = handleZodError(result.error)
    expect(simplified.statusCode).toBe(400)
    expect(simplified.message).toBe('Validation Error')
    expect(simplified.errorMessages[0]).toEqual({
      path: 'email',
      message: expect.any(String),
    })
  })
})
