import { FinancialValidation } from '../financials.validation'

describe('FinancialValidation.getProfitLoss', () => {
  it('accepts from and to query params', () => {
    const result = FinancialValidation.getProfitLoss.safeParse({
      query: { from: '2026-05-01', to: '2026-05-31' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects when from is missing', () => {
    const result = FinancialValidation.getProfitLoss.safeParse({ query: { to: '2026-05-31' } })
    expect(result.success).toBe(false)
  })
})
