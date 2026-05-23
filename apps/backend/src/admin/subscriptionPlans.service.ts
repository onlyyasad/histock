import { prismaAdmin } from '../prisma/client'

export function getAllPlans() {
  return prismaAdmin.subscriptionPlan.findMany({ orderBy: { displayOrder: 'asc' } })
}

export function updatePlan(
  id: string,
  data: {
    priceMonthly?: number
    maxUsers?: number | null
    maxOrdersPerMonth?: number | null
    maxProducts?: number | null
    maxSkus?: number | null
    isActive?: boolean
    displayOrder?: number
  },
) {
  return prismaAdmin.subscriptionPlan.update({ where: { id }, data })
}
