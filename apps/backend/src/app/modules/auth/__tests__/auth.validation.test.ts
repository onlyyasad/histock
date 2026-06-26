import { AuthValidation } from '../auth.validation'

describe('AuthValidation', () => {
  it('accepts a valid register body', () => {
    const r = AuthValidation.register.safeParse({
      body: { businessName: 'Shop', email: 'a@b.com', password: 'password123', name: 'Owner' },
    })
    expect(r.success).toBe(true)
  })

  it('rejects a register body with a short password', () => {
    const r = AuthValidation.register.safeParse({
      body: { businessName: 'Shop', email: 'a@b.com', password: 'short', name: 'Owner' },
    })
    expect(r.success).toBe(false)
  })

  it('rejects a reset-password body with a short password', () => {
    const r = AuthValidation.resetPassword.safeParse({ body: { token: 't', password: 'short' } })
    expect(r.success).toBe(false)
  })

  it('requires an email on forgot-password', () => {
    const r = AuthValidation.forgotPassword.safeParse({ body: {} })
    expect(r.success).toBe(false)
  })
})
