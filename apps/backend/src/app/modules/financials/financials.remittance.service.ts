import { z } from 'zod'
import { prismaAdmin } from '../../../prisma/client'
import type { prismaWithScope } from '../../../prisma/client'

type ScopedPrisma = ReturnType<typeof prismaWithScope>

export const CreateRemittanceSchema = z.object({
  courierId: z.string().uuid(),
  batchName: z.string().min(1).max(200),
  orderIds: z.array(z.string().uuid()).min(1),
})

export class RemittanceService {
  constructor(private prisma: ScopedPrisma) {}

  list() {
    return this.prisma.remittance.findMany({
      include: {
        courier: { select: { id: true, name: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  getById(remittanceId: string) {
    return this.prisma.remittance.findFirst({
      where: { id: remittanceId },
      include: {
        courier: true,
        orders: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                total: true,
                customer: { select: { name: true, phone: true } },
              },
            },
          },
        },
      },
    })
  }

  async create(businessId: string, data: z.infer<typeof CreateRemittanceSchema>) {
    const orders = await this.prisma.order.findMany({
      where: {
        id: { in: data.orderIds },
        paymentMethod: 'cod',
        status: 'delivered',
      },
    })

    if (orders.length === 0) {
      throw Object.assign(new Error('No valid COD delivered orders found'), { status: 422 })
    }

    const totalCodAmount = orders.reduce((sum, o) => sum + Number(o.total), 0)

    return (this.prisma as unknown as typeof prismaAdmin).remittance.create({
      data: {
        businessId,
        courierId: data.courierId,
        batchName: data.batchName,
        totalCodAmount: totalCodAmount,
        totalOrders: orders.length,
        orders: {
          create: orders.map((o) => ({
            orderId: o.id,
            codAmount: Number(o.total),
          })),
        },
      },
      include: {
        courier: { select: { id: true, name: true } },
        _count: { select: { orders: true } },
      },
    })
  }
}
