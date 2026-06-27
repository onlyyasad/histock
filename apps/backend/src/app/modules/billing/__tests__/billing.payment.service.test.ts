import httpStatus from 'http-status'
import ApiError from '../../../../errors/ApiError'

jest.mock('../../../../prisma/client', () => ({
  prismaAdmin: {
    business: { findUnique: jest.fn() },
  },
}))

import { prismaAdmin } from '../../../../prisma/client'
import { BillingPaymentService } from '../billing.payment.service'

const findUnique = prismaAdmin.business.findUnique as jest.Mock

describe('BillingPaymentService.record', () => {
  beforeEach(() => jest.clearAllMocks())

  it('throws 404 when the business does not exist', async () => {
    findUnique.mockResolvedValue(null)
    await expect(
      BillingPaymentService.record('biz-1', 'admin-1', {
        planId: 'p1',
        amountPaid: 500,
        paymentMethod: 'bkash',
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-02-01T00:00:00.000Z',
      }),
    ).rejects.toMatchObject({ statusCode: httpStatus.NOT_FOUND })
  })

  it('throws 404 when the business has no subscription', async () => {
    findUnique.mockResolvedValue({ id: 'biz-1', subscription: null })
    await expect(
      BillingPaymentService.record('biz-1', 'admin-1', {
        planId: 'p1',
        amountPaid: 500,
        paymentMethod: 'bkash',
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-02-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ApiError)
  })
})
