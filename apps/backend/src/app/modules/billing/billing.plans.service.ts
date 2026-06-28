import { prismaAdmin } from '../../../prisma/client'
import type { IUpdatePlanInput } from './billing.interface'

const list = () => prismaAdmin.subscriptionPlan.findMany({ orderBy: { displayOrder: 'asc' } })

const update = (id: string, data: IUpdatePlanInput) =>
  prismaAdmin.subscriptionPlan.update({ where: { id }, data })

export const BillingPlansService = { list, update }
