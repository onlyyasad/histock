import { prismaAdmin } from '../../../prisma/client'
import type { prismaWithScope } from '../../../prisma/client'

type ScopedPrisma = ReturnType<typeof prismaWithScope>

export class CustomersService {
  constructor(private prisma: ScopedPrisma) {}

  list(query: { search?: string }) {
    const { search } = query
    return this.prisma.customer.findMany({
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
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        totalOrders: true,
        totalSpent: true,
        isFlagged: true,
        flagReason: true,
        createdAt: true,
      },
    })
  }

  getById(customerId: string) {
    return this.prisma.customer.findFirst({
      where: { id: customerId },
      include: {
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        },
        orders: {
          where: { deletedAt: null },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })
  }

  lookupByPhone(phone: string) {
    return this.prisma.customer.findFirst({
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
  }

  create(businessId: string, data: { name: string; phone: string; email?: string | null }) {
    return this.prisma.customer.create({
      data: { ...data, businessId },
    })
  }

  update(customerId: string, data: { name?: string; phone?: string; email?: string | null }) {
    return (this.prisma as unknown as typeof prismaAdmin).customer.update({
      where: { id: customerId },
      data,
    })
  }

  softDelete(customerId: string) {
    return (this.prisma as unknown as typeof prismaAdmin).customer.update({
      where: { id: customerId },
      data: { deletedAt: new Date() },
    })
  }

  async addAddress(
    businessId: string,
    customerId: string,
    data: {
      label: string
      addressLine: string
      district?: string
      division?: string
      isDefault: boolean
    },
  ) {
    if (data.isDefault) {
      await (this.prisma as unknown as typeof prismaAdmin).customerAddress.updateMany({
        where: { customerId, businessId },
        data: { isDefault: false },
      })
    }
    return (this.prisma as unknown as typeof prismaAdmin).customerAddress.create({
      data: { ...data, customerId, businessId },
    })
  }

  async updateAddress(
    businessId: string,
    customerId: string,
    addressId: string,
    data: Partial<{
      label: string
      addressLine: string
      district: string
      division: string
      isDefault: boolean
    }>,
  ) {
    if (data.isDefault) {
      await (this.prisma as unknown as typeof prismaAdmin).customerAddress.updateMany({
        where: { customerId, businessId },
        data: { isDefault: false },
      })
    }
    return (this.prisma as unknown as typeof prismaAdmin).customerAddress.update({
      where: { id: addressId },
      data,
    })
  }

  flag(customerId: string, reason: string) {
    return (this.prisma as unknown as typeof prismaAdmin).customer.update({
      where: { id: customerId },
      data: { isFlagged: true, flagReason: reason },
    })
  }

  unflag(customerId: string) {
    return (this.prisma as unknown as typeof prismaAdmin).customer.update({
      where: { id: customerId },
      data: { isFlagged: false, flagReason: null },
    })
  }

  // Called by OrderService after order creation — must be inside the same transaction.
  static async incrementOrderCounters(
    tx: typeof prismaAdmin,
    customerId: string,
    businessId: string,
    amount: number,
  ) {
    await tx.customer.update({
      where: { id: customerId, businessId },
      data: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: amount },
      },
    })
  }

  // Called by OrderService on cancellation — must be inside the same transaction.
  static async decrementOrderCounters(
    tx: typeof prismaAdmin,
    customerId: string,
    businessId: string,
    amount: number,
  ) {
    await tx.customer.update({
      where: { id: customerId, businessId },
      data: {
        totalOrders: { decrement: 1 },
        totalSpent: { decrement: amount },
      },
    })
  }
}
