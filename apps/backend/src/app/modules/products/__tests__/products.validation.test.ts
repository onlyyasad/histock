import { ProductValidation } from '../products.validation'

describe('ProductValidation', () => {
  it('accepts a valid create-product body', () => {
    const result = ProductValidation.createProduct.safeParse({ body: { name: 'Panjabi', price: 500 } })
    expect(result.success).toBe(true)
  })

  it('rejects a negative price', () => {
    const result = ProductValidation.createProduct.safeParse({ body: { name: 'Panjabi', price: -1 } })
    expect(result.success).toBe(false)
  })

  it('rejects a non-positive lot quantity on cost entry', () => {
    const result = ProductValidation.createCostEntry.safeParse({
      body: { entryDate: '2026-01-01', lotQuantity: 0, totalCost: 10 },
    })
    expect(result.success).toBe(false)
  })
})
