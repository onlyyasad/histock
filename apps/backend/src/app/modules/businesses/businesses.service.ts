import { prismaAdmin } from '../../../prisma/client'
import type { IListBusinessesQuery } from './businesses.interface'

const PAGE_SIZE = 30

const list = ({ search, planId, page = 1 }: IListBusinessesQuery) =>
  prismaAdmin.business.findMany({
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
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

const getById = (businessId: string) =>
  prismaAdmin.business.findUnique({
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

const setIsDemo = (businessId: string, isDemo: boolean) =>
  prismaAdmin.business.update({ where: { id: businessId }, data: { isDemo } })

export const BusinessesService = { list, getById, setIsDemo }
