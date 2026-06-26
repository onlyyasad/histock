import { z } from 'zod'

const getProfitLoss = z.object({
  query: z.object({
    from: z.string().min(1, 'from and to query params required (YYYY-MM-DD)'),
    to: z.string().min(1, 'from and to query params required (YYYY-MM-DD)'),
  }),
})

export const FinancialValidation = {
  getProfitLoss,
}
