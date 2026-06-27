import { prismaAdmin } from '../../../prisma/client'

const PAGE_SIZE = 50

const list = (businessId: string | undefined, page = 1) =>
  prismaAdmin.adminAuditLog.findMany({
    where: { ...(businessId ? { targetBusinessId: businessId } : {}) },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

export const AuditService = { list }
