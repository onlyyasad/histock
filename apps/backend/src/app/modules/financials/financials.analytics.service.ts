import { prismaAdmin } from '../../../prisma/client'

export class AnalyticsService {
  async getProfitLoss(businessId: string, from: Date, to: Date) {
    const revenueResult = await prismaAdmin.$queryRaw<[{ revenue: string }]>`
      SELECT COALESCE(SUM(total), 0) AS revenue
      FROM orders
      WHERE business_id = ${businessId}::uuid
        AND status IN ('delivered', 'refunded')
        AND created_at >= ${from}
        AND created_at < ${to}
        AND deleted_at IS NULL
    `

    const costResult = await prismaAdmin.$queryRaw<[{ cost: string }]>`
      SELECT COALESCE(SUM(oca.total_cost), 0) AS cost
      FROM order_cost_allocations oca
      JOIN order_items oi ON oca.order_item_id = oi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.business_id = ${businessId}::uuid
        AND o.status = 'delivered'
        AND o.created_at >= ${from}
        AND o.created_at < ${to}
        AND o.deleted_at IS NULL
    `

    const breakdown = await prismaAdmin.$queryRaw<
      Array<{ status: string; count: bigint; total: string }>
    >`
      SELECT status, COUNT(*) AS count, COALESCE(SUM(total), 0) AS total
      FROM orders
      WHERE business_id = ${businessId}::uuid
        AND created_at >= ${from}
        AND created_at < ${to}
        AND deleted_at IS NULL
      GROUP BY status
    `

    const revenue = Number(revenueResult[0].revenue)
    const cost = Number(costResult[0].cost)

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      revenue,
      cost,
      profit: Number((revenue - cost).toFixed(2)),
      margin: revenue > 0 ? Math.round(((revenue - cost) / revenue) * 100 * 100) / 100 : 0,
      statusBreakdown: breakdown.map((r) => ({
        status: r.status,
        count: Number(r.count),
        total: Number(r.total),
      })),
    }
  }
}
