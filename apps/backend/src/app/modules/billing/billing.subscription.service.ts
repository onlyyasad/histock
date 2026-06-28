import { prismaAdmin } from '../../../prisma/client'
import type { IUpdateSubscriptionInput } from './billing.interface'

const update = (businessId: string, data: IUpdateSubscriptionInput) =>
  prismaAdmin.subscription.update({
    where: { businessId },
    data: {
      ...(data.planId ? { planId: data.planId } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.currentPeriodEnd ? { currentPeriodEnd: new Date(data.currentPeriodEnd) } : {}),
      ...(data.adminNotes !== undefined ? { adminNotes: data.adminNotes } : {}),
    },
  })

export const BillingSubscriptionService = { update }
