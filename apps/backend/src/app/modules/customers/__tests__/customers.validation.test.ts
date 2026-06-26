import { CustomerValidation } from '../customers.validation'

describe('CustomerValidation', () => {
  it('accepts a valid create-customer body', () => {
    const result = CustomerValidation.createCustomer.safeParse({
      body: { name: 'Rahim', phone: '01700000000' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects a create-customer body with a short phone', () => {
    const result = CustomerValidation.createCustomer.safeParse({
      body: { name: 'Rahim', phone: '123' },
    })
    expect(result.success).toBe(false)
  })

  it('applies address defaults (label, isDefault)', () => {
    const result = CustomerValidation.createAddress.parse({
      body: { addressLine: 'Road 1, Dhaka' },
    })
    expect(result.body).toMatchObject({ label: 'Home', isDefault: false })
  })
})
