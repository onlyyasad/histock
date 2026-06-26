import { AiValidation } from '../ai.validation'

describe('AiValidation.generate', () => {
  it('accepts a valid generate body', () => {
    const r = AiValidation.generate.safeParse({
      body: { type: 'product_description', payload: { name: 'Panjabi' } },
    })
    expect(r.success).toBe(true)
  })

  it('rejects an unknown generation type', () => {
    const r = AiValidation.generate.safeParse({ body: { type: 'poem', payload: {} } })
    expect(r.success).toBe(false)
  })

  it('rejects a missing payload', () => {
    const r = AiValidation.generate.safeParse({ body: { type: 'social_post' } })
    expect(r.success).toBe(false)
  })
})
