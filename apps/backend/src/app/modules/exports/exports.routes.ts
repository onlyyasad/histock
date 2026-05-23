import { Router } from 'express'
import { requireSeller } from '../../middlewares/auth'
import { prismaWithScope } from '../../../prisma/client'
import { streamCsv } from '../../../shared/csvStream'

const router = Router()

// GET /api/v1/exports/orders?from=YYYY-MM-DD&to=YYYY-MM-DD&status=delivered
router.get('/orders', requireSeller, async (req, res, next) => {
  try {
    const user = req.user as { businessId: string }
    const { from, to, status } = req.query as Record<string, string>

    const orders = await prismaWithScope(user.businessId).order.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
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

    const today = new Date().toISOString().slice(0, 10)
    const rows = orders.map((o) => ({
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

    streamCsv(
      res,
      rows,
      [
        { key: 'order_number', header: 'Order Number' },
        { key: 'created_at', header: 'Date' },
        { key: 'customer_name', header: 'Customer' },
        { key: 'customer_phone', header: 'Phone' },
        { key: 'courier', header: 'Courier' },
        { key: 'status', header: 'Status' },
        { key: 'payment_method', header: 'Payment' },
        { key: 'total', header: 'Total (BDT)' },
        { key: 'delivery_fee', header: 'Delivery Fee (BDT)' },
      ],
      `orders-export-${today}`,
    )
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/exports/customers
router.get('/customers', requireSeller, async (req, res, next) => {
  try {
    const user = req.user as { businessId: string }

    const customers = await prismaWithScope(user.businessId).customer.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const today = new Date().toISOString().slice(0, 10)
    const rows = customers.map((c) => ({
      name: c.name,
      phone: c.phone,
      email: c.email ?? '',
      total_orders: c.totalOrders,
      total_spent: Number(c.totalSpent).toFixed(2),
      is_flagged: c.isFlagged ? 'Yes' : 'No',
      flag_reason: c.flagReason ?? '',
      joined: c.createdAt.toISOString().slice(0, 10),
    }))

    streamCsv(
      res,
      rows,
      [
        { key: 'name', header: 'Name' },
        { key: 'phone', header: 'Phone' },
        { key: 'email', header: 'Email' },
        { key: 'total_orders', header: 'Total Orders' },
        { key: 'total_spent', header: 'Total Spent (BDT)' },
        { key: 'is_flagged', header: 'Flagged' },
        { key: 'flag_reason', header: 'Flag Reason' },
        { key: 'joined', header: 'Joined' },
      ],
      `customers-export-${today}`,
    )
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/exports/products
router.get('/products', requireSeller, async (req, res, next) => {
  try {
    const user = req.user as { businessId: string }

    const products = await prismaWithScope(user.businessId).product.findMany({
      orderBy: { name: 'asc' },
    })

    const today = new Date().toISOString().slice(0, 10)
    const rows = products.map((p) => ({
      name: p.name,
      sku: p.sku ?? '',
      price: Number(p.price).toFixed(2),
      current_stock: p.currentStock,
      description: p.description ?? '',
      created_at: p.createdAt.toISOString().slice(0, 10),
    }))

    streamCsv(
      res,
      rows,
      [
        { key: 'name', header: 'Product Name' },
        { key: 'sku', header: 'SKU' },
        { key: 'price', header: 'Price (BDT)' },
        { key: 'current_stock', header: 'Stock' },
        { key: 'description', header: 'Description' },
        { key: 'created_at', header: 'Created' },
      ],
      `products-export-${today}`,
    )
  } catch (err) {
    next(err)
  }
})

export { router as exportsRoutes }
