import { prismaAdmin } from '../../../prisma/client'

export class DashboardService {
  async getTodaySnapshot(businessId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const result = await prismaAdmin.$queryRaw<
      [
        {
          total_orders: bigint
          pending_orders: bigint
          processing_orders: bigint
          delivered_orders: bigint
          failed_orders: bigint
          today_revenue: string
        },
      ]
    >`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= ${today} AND created_at < ${tomorrow} AND deleted_at IS NULL)
          AS total_orders,
        COUNT(*) FILTER (WHERE status = 'pending' AND deleted_at IS NULL)
          AS pending_orders,
        COUNT(*) FILTER (WHERE status = 'processing' AND deleted_at IS NULL)
          AS processing_orders,
        COUNT(*) FILTER (WHERE status = 'delivered' AND created_at >= ${today} AND created_at < ${tomorrow} AND deleted_at IS NULL)
          AS delivered_orders,
        COUNT(*) FILTER (WHERE status = 'delivery_failed' AND deleted_at IS NULL)
          AS failed_orders,
        COALESCE(SUM(total) FILTER (
          WHERE status = 'delivered'
          AND created_at >= ${today}
          AND created_at < ${tomorrow}
          AND deleted_at IS NULL
        ), 0)
          AS today_revenue
      FROM orders
      WHERE business_id = ${businessId}::uuid
    `

    const row = result[0]

    const lowStockCount = await prismaAdmin.product.count({
      where: { businessId, deletedAt: null, isActive: true, currentStock: { lt: 5 } },
    })

    return {
      todayOrders: Number(row.total_orders),
      pendingOrders: Number(row.pending_orders),
      processingOrders: Number(row.processing_orders),
      deliveredToday: Number(row.delivered_orders),
      deliveryFailed: Number(row.failed_orders),
      todayRevenue: Number(row.today_revenue),
      lowStockProducts: lowStockCount,
    }
  }
}
