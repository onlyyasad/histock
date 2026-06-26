import type { OrderStatus } from '@prisma/client'
import type { ScopedPrisma } from '../../../prisma/types'
import type { IOrderExportFilters } from './exports.interface'

type ExportRow = Record<string, string | number>

const getOrderRows = async (
  db: ScopedPrisma,
  filters: IOrderExportFilters,
): Promise<ExportRow[]> => {
  const { from, to, status } = filters

  const orders = await db.order.findMany({
    where: {
      ...(status ? { status: status as OrderStatus } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59Z`) } : {}),
            },
          }
        : {}),
    },
    include: {
      customer: { select: { name: true, phone: true } },
      courier: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return orders.map((o) => ({
    order_number: `ORD-${String(o.orderNumber).padStart(6, '0')}`,
    created_at: o.createdAt.toISOString().slice(0, 10),
    customer_name: o.customer.name,
    customer_phone: o.customer.phone,
    courier: o.courier?.name ?? '',
    status: o.status,
    payment_method: o.paymentMethod,
    total: Number(o.total).toFixed(2),
    delivery_fee: Number(o.deliveryFee).toFixed(2),
  }))
}

const getCustomerRows = async (db: ScopedPrisma): Promise<ExportRow[]> => {
  const customers = await db.customer.findMany({ orderBy: { createdAt: 'desc' } })
  return customers.map((c) => ({
    name: c.name,
    phone: c.phone,
    email: c.email ?? '',
    total_orders: c.totalOrders,
    total_spent: Number(c.totalSpent).toFixed(2),
    is_flagged: c.isFlagged ? 'Yes' : 'No',
    flag_reason: c.flagReason ?? '',
    joined: c.createdAt.toISOString().slice(0, 10),
  }))
}

const getProductRows = async (db: ScopedPrisma): Promise<ExportRow[]> => {
  const products = await db.product.findMany({ orderBy: { name: 'asc' } })
  return products.map((p) => ({
    name: p.name,
    sku: p.sku ?? '',
    price: Number(p.price).toFixed(2),
    current_stock: p.currentStock,
    description: p.description ?? '',
    created_at: p.createdAt.toISOString().slice(0, 10),
  }))
}

export const ExportsService = {
  getOrderRows,
  getCustomerRows,
  getProductRows,
}
