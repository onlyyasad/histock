import httpStatus from 'http-status'
import { prismaAdmin } from '../../../prisma/client'
import type { ScopedPrisma, AdminPrisma } from '../../../prisma/types'
import ApiError from '../../../errors/ApiError'
import {
  remittanceListInclude,
  remittanceDetailInclude,
  remittanceCreateInclude,
} from './remittances.constants'
import type { ICreateRemittanceInput, IImportRemittanceInput } from './remittances.interface'

// create is not intercepted by the scoped client — reach it through the writable
// (admin-typed) view. Preserves existing behavior exactly.
const writable = (db: ScopedPrisma) => db as unknown as AdminPrisma

const list = (db: ScopedPrisma) =>
  db.remittance.findMany({ include: remittanceListInclude, orderBy: { createdAt: 'desc' } })

const getById = (db: ScopedPrisma, remittanceId: string) =>
  db.remittance.findFirst({ where: { id: remittanceId }, include: remittanceDetailInclude })

// Build a remittance batch from manually-selected COD delivered orders.
const create = async (db: ScopedPrisma, businessId: string, data: ICreateRemittanceInput) => {
  const orders = await db.order.findMany({
    where: { id: { in: data.orderIds }, paymentMethod: 'cod', status: 'delivered' },
  })

  if (orders.length === 0) {
    throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'No valid COD delivered orders found')
  }

  const totalCodAmount = orders.reduce((sum, o) => sum + Number(o.total), 0)

  return writable(db).remittance.create({
    data: {
      businessId,
      courierId: data.courierId,
      batchName: data.batchName,
      totalCodAmount,
      totalOrders: orders.length,
      orders: { create: orders.map((o) => ({ orderId: o.id, codAmount: Number(o.total) })) },
    },
    include: remittanceCreateInclude,
  })
}

// Build a remittance batch from CSV-matched orders, recording the import in the same TX.
const importBatch = async (businessId: string, data: IImportRemittanceInput) => {
  const { courierId, batchName, fileName, orders, unmatchedCount } = data
  const totalCodAmount = orders.reduce((sum, o) => sum + o.codAmount, 0)

  return prismaAdmin.$transaction(async (tx) => {
    const batch = await tx.remittance.create({
      data: {
        businessId,
        courierId,
        batchName,
        totalCodAmount,
        totalOrders: orders.length,
        orders: { create: orders.map((o) => ({ orderId: o.orderId, codAmount: o.codAmount })) },
      },
      include: { courier: { select: { id: true, name: true } } },
    })

    await tx.remittanceImport.create({
      data: { businessId, fileName, matchedCount: orders.length, unmatchedCount },
    })

    return batch
  })
}

export const RemittancesService = {
  list,
  getById,
  create,
  importBatch,
}
