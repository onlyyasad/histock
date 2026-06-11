import { prismaAdmin } from '../../../prisma/client'

// prismaAdmin is used here for $queryRaw only. businessId is always explicitly
// in the SQL WHERE clause on every query — data isolation is enforced in SQL,
// not via the Prisma scope extension (which only covers ORM model methods).

export class AnalyticsService {
  async getProfitLoss(businessId: string, from: Date, to: Date) {
    // Single compound query — revenue, COGS, delivery fees, refunds in one pass.
    // Excludes: cancelled, pending, delivery_failed orders from revenue/COGS.
    // delivery_failed orders appear in statusBreakdown but not P&L totals.
    const [summary] = await prismaAdmin.$queryRaw<
      Array<{
        revenue: string
        cogs: string
        delivery_fees: string
        refunds: string
        order_count: bigint
      }>
    >`
      SELECT
        COALESCE(SUM(CASE
          WHEN o.status = 'delivered' THEN o.total ELSE 0
        END), 0)::text                                             AS revenue,
        COALESCE(SUM(CASE
          WHEN o.status = 'delivered' THEN COALESCE(oca_agg.total_cost, 0) ELSE 0
        END), 0)::text                                             AS cogs,
        COALESCE(SUM(CASE
          WHEN o.status = 'delivered' THEN o.delivery_fee ELSE 0
        END), 0)::text                                             AS delivery_fees,
        COALESCE(SUM(CASE
          WHEN o.status = 'refunded' THEN o.total ELSE 0
        END), 0)::text                                             AS refunds,
        COUNT(CASE
          WHEN o.status NOT IN ('cancelled', 'pending', 'delivery_failed') THEN 1
        END)                                                       AS order_count
      FROM orders o
      LEFT JOIN (
        SELECT oi.order_id, SUM(oca.total_cost) AS total_cost
        FROM order_cost_allocations oca
        JOIN order_items oi ON oca.order_item_id = oi.id
        GROUP BY oi.order_id
      ) oca_agg ON oca_agg.order_id = o.id
      WHERE o.business_id = ${businessId}
        AND o.created_at >= ${from}
        AND o.created_at < ${to}
        AND o.deleted_at IS NULL
    `

    const breakdown = await prismaAdmin.$queryRaw<
      Array<{ status: string; count: bigint; total: string }>
    >`
      SELECT
        status,
        COUNT(*)::bigint                       AS count,
        COALESCE(SUM(total), 0)::text          AS total
      FROM orders
      WHERE business_id = ${businessId}
        AND created_at >= ${from}
        AND created_at < ${to}
        AND deleted_at IS NULL
      GROUP BY status
    `

    const revenue = Number(summary.revenue)
    const cogs = Number(summary.cogs)
    const deliveryFees = Number(summary.delivery_fees)
    const refunds = Number(summary.refunds)
    const profit = Number((revenue - cogs).toFixed(2))

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      revenue,
      cogs,
      deliveryFees,
      refunds,
      profit,
      margin: revenue > 0 ? Math.round(((revenue - cogs) / revenue) * 10000) / 100 : 0,
      orderCount: Number(summary.order_count),
      statusBreakdown: breakdown.map((r) => ({
        status: r.status,
        count: Number(r.count),
        total: Number(r.total),
      })),
    }
  }
}
