import { OrderValidation } from '../orders.validation'

describe('OrderValidation', () => {
  it('defaults deliveryFee to 0 on a valid create body', () => {
    const result = OrderValidation.createOrder.parse({
      body: {
        customerId: '11111111-1111-1111-1111-111111111111',
        courierId: null,
        paymentMethod: 'cod',
        items: [
          {
            productId: '22222222-2222-2222-2222-222222222222',
            variantId: null,
            quantity: 1,
            unitPrice: 100,
          },
        ],
      },
    })
    expect(result.body.deliveryFee).toBe(0)
  })

  it('rejects an empty items array', () => {
    const result = OrderValidation.createOrder.safeParse({
      body: {
        customerId: '11111111-1111-1111-1111-111111111111',
        courierId: null,
        paymentMethod: 'cod',
        items: [],
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown status', () => {
    const result = OrderValidation.updateStatus.safeParse({ body: { status: 'nope' } })
    expect(result.success).toBe(false)
  })
})
