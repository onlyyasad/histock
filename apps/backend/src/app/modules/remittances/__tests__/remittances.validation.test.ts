import { RemittanceValidation } from '../remittances.validation'

describe('RemittanceValidation', () => {
  it('accepts a valid create body', () => {
    const result = RemittanceValidation.createRemittance.safeParse({
      body: {
        courierId: '11111111-1111-1111-1111-111111111111',
        batchName: 'May COD',
        orderIds: ['22222222-2222-2222-2222-222222222222'],
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects a create body with an empty orderIds array', () => {
    const result = RemittanceValidation.createRemittance.safeParse({
      body: { courierId: '11111111-1111-1111-1111-111111111111', batchName: 'x', orderIds: [] },
    })
    expect(result.success).toBe(false)
  })

  it('defaults unmatchedCount to 0 on import', () => {
    const result = RemittanceValidation.importRemittance.parse({
      body: {
        courierId: '11111111-1111-1111-1111-111111111111',
        batchName: 'Imported',
        fileName: 'pathao.csv',
        orders: [{ orderId: '22222222-2222-2222-2222-222222222222', codAmount: 500 }],
      },
    })
    expect(result.body.unmatchedCount).toBe(0)
  })

  it('rejects an import order row with a non-positive codAmount', () => {
    const result = RemittanceValidation.importRemittance.safeParse({
      body: {
        courierId: '11111111-1111-1111-1111-111111111111',
        batchName: 'Imported',
        fileName: 'pathao.csv',
        orders: [{ orderId: '22222222-2222-2222-2222-222222222222', codAmount: 0 }],
      },
    })
    expect(result.success).toBe(false)
  })
})
