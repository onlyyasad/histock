import type { SubscriptionStatus } from '@prisma/client'
import { prismaAdmin } from '../prisma/client'

export class AdminBusinessService {
  list(query: { search?: string; planId?: string; page?: number }) {
    const { search, planId, page = 1 } = query
    const limit = 30

    return prismaAdmin.business.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(planId ? { subscription: { planId } } : {}),
      },
      include: {
        subscription: { include: { plan: { select: { id: true, name: true } } } },
        _count: { select: { users: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })
  }

  getById(businessId: string) {
    return prismaAdmin.business.findUnique({
      where: { id: businessId },
      include: {
        subscription: { include: { plan: true } },
        users: {
          where: { businessId: { not: null } },
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        },
        _count: { select: { orders: true, customers: true, products: true } },
      },
    })
  }

  updateSubscription(
    businessId: string,
    data: {
      planId?: string
      status?: SubscriptionStatus
      currentPeriodEnd?: string
      adminNotes?: string
    },
  ) {
    return prismaAdmin.subscription.update({
      where: { businessId },
      data: {
        ...(data.planId ? { planId: data.planId } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.currentPeriodEnd ? { currentPeriodEnd: new Date(data.currentPeriodEnd) } : {}),
        ...(data.adminNotes !== undefined ? { adminNotes: data.adminNotes } : {}),
      },
    })
  }

  setIsDemo(businessId: string, isDemo: boolean) {
    return prismaAdmin.business.update({ where: { id: businessId }, data: { isDemo } })
  }
}
