import httpStatus from 'http-status'
import { prismaAdmin } from '../../../prisma/client'
import ApiError from '../../../errors/ApiError'
import type { IRecordPaymentInput } from './billing.interface'

const list = (businessId: string) =>
  prismaAdmin.subscriptionPayment.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  })

const record = async (businessId: string, adminId: string, input: IRecordPaymentInput) => {
  const business = await prismaAdmin.business.findUnique({
    where: { id: businessId },
    include: { subscription: true },
  })
  if (!business) throw new ApiError(httpStatus.NOT_FOUND, 'Business not found')
  if (!business.subscription) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No subscription found for this business')
  }

  return prismaAdmin.$transaction(async (tx) => {
    const payment = await tx.subscriptionPayment.create({
      data: {
        businessId: business.id,
        subscriptionId: business.subscription!.id,
        planId: input.planId,
        amountPaid: input.amountPaid,
        paymentMethod: input.paymentMethod,
        paymentRef: input.paymentRef ?? null,
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        confirmedBy: adminId,
        notes: input.notes ?? null,
      },
    })

    await tx.subscription.update({
      where: { businessId: business.id },
      data: {
        planId: input.planId,
        status: 'active',
        currentPeriodStart: new Date(input.periodStart),
        currentPeriodEnd: new Date(input.periodEnd),
      },
    })

    return payment
  })
}

export const BillingPaymentService = { list, record }
