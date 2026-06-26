import type { ScopedPrisma, AdminPrisma } from '../../../prisma/types'
import { customerListSelect } from './customers.constants'
import type {
  ICustomerFilters,
  ICreateCustomerInput,
  IUpdateCustomerInput,
  ICreateAddressInput,
  IUpdateAddressInput,
} from './customers.interface'

// The scoped client intercepts find* to inject businessId. create/update/updateMany
// are NOT intercepted, so they are reached through the writable (admin-typed) view.
// This preserves the existing behavior exactly — do not change it here.
const writable = (db: ScopedPrisma) => db as unknown as AdminPrisma

const list = (db: ScopedPrisma, filters: ICustomerFilters) => {
  const { search } = filters
  return db.customer.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: customerListSelect,
  })
}

const getById = (db: ScopedPrisma, customerId: string) =>
  db.customer.findFirst({
    where: { id: customerId },
    include: {
      addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] },
      orders: {
        where: { deletedAt: null },
        select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

const lookupByPhone = (db: ScopedPrisma, phone: string) =>
  db.customer.findFirst({
    where: { phone },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      addresses: {
        where: { isDefault: true },
        take: 1,
        select: { id: true, label: true, addressLine: true, district: true },
      },
    },
  })

const create = (db: ScopedPrisma, businessId: string, data: ICreateCustomerInput) =>
  db.customer.create({ data: { ...data, businessId } })

const update = (db: ScopedPrisma, customerId: string, data: IUpdateCustomerInput) =>
  writable(db).customer.update({ where: { id: customerId }, data })

const softDelete = (db: ScopedPrisma, customerId: string) =>
  writable(db).customer.update({ where: { id: customerId }, data: { deletedAt: new Date() } })

const addAddress = async (
  db: ScopedPrisma,
  businessId: string,
  customerId: string,
  data: ICreateAddressInput,
) => {
  if (data.isDefault) {
    await writable(db).customerAddress.updateMany({
      where: { customerId, businessId },
      data: { isDefault: false },
    })
  }
  return writable(db).customerAddress.create({ data: { ...data, customerId, businessId } })
}

const updateAddress = async (
  db: ScopedPrisma,
  businessId: string,
  customerId: string,
  addressId: string,
  data: IUpdateAddressInput,
) => {
  if (data.isDefault) {
    await writable(db).customerAddress.updateMany({
      where: { customerId, businessId },
      data: { isDefault: false },
    })
  }
  return writable(db).customerAddress.update({ where: { id: addressId }, data })
}

const flag = (db: ScopedPrisma, customerId: string, reason: string) =>
  writable(db).customer.update({
    where: { id: customerId },
    data: { isFlagged: true, flagReason: reason },
  })

const unflag = (db: ScopedPrisma, customerId: string) =>
  writable(db).customer.update({
    where: { id: customerId },
    data: { isFlagged: false, flagReason: null },
  })

// Called by the orders module inside a transaction — signatures preserved verbatim.
const incrementOrderCounters = async (
  tx: AdminPrisma,
  customerId: string,
  businessId: string,
  amount: number,
) => {
  await tx.customer.update({
    where: { id: customerId, businessId },
    data: { totalOrders: { increment: 1 }, totalSpent: { increment: amount } },
  })
}

const decrementOrderCounters = async (
  tx: AdminPrisma,
  customerId: string,
  businessId: string,
  amount: number,
) => {
  await tx.customer.update({
    where: { id: customerId, businessId },
    data: { totalOrders: { decrement: 1 }, totalSpent: { decrement: amount } },
  })
}

export const CustomersService = {
  list,
  getById,
  lookupByPhone,
  create,
  update,
  softDelete,
  addAddress,
  updateAddress,
  flag,
  unflag,
  incrementOrderCounters,
  decrementOrderCounters,
}
