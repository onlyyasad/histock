import { prismaAdmin } from '../../../prisma/client'
import { LOW_STOCK_THRESHOLD } from './financials.constants'
import type { ITodaySnapshot, IProfitLoss } from './financials.interface'

// prismaAdmin + $queryRaw only. business_id is always in the SQL WHERE clause —
// isolation is enforced in SQL, not via the Prisma scope extension.

// --- dashboard -------------------------------------------------------------

type SnapshotRow = {
  total_orders: bigint
  pending_orders: bigint
  processing_orders: bigint
  delivered_orders: bigint
  failed_orders: bigint
  today_revenue: string
}

// Single compound query (locked): all six counters in one pass.
const querySnapshotRow = async (businessId: string, today: Date, tomorrow: Date) => {
  const result = await prismaAdmin.$queryRaw<[SnapshotRow]>`
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
    WHERE business_id = ${businessId}
  `
  return result[0]
}

const countLowStock = (businessId: string) =>
  prismaAdmin.product.count({
    where: { businessId, deletedAt: null, isActive: true, currentStock: { lt: LOW_STOCK_THRESHOLD } },
  })

const countOverdueSchedules = (businessId: string) =>
  prismaAdmin.schedule.count({
    where: { businessId, isDone: false, scheduledAt: { lt: new Date() } },
  })

const getTodaySnapshot = async (businessId: string): Promise<ITodaySnapshot> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [row, lowStockProducts, overdueSchedules] = await Promise.all([
    querySnapshotRow(businessId, today, tomorrow),
    countLowStock(businessId),
    countOverdueSchedules(businessId),
  ])

  return {
    todayOrders: Number(row.total_orders),
    pendingOrders: Number(row.pending_orders),
    processingOrders: Number(row.processing_orders),
    deliveredToday: Number(row.delivered_orders),
    deliveryFailed: Number(row.failed_orders),
    todayRevenue: Number(row.today_revenue),
    lowStockProducts,
    overdueSchedules,
  }
}

// --- profit & loss ---------------------------------------------------------

type PnlSummaryRow = {
  revenue: string
  cogs: string
  delivery_fees: string
  refunds: string
  order_count: bigint
}

type StatusBreakdownSqlRow = { status: string; count: bigint; total: string }

// Single compound query — revenue, COGS, delivery fees, refunds, order count in one pass.
const queryPnlSummary = async (businessId: string, from: Date, to: Date) => {
  const [summary] = await prismaAdmin.$queryRaw<PnlSummaryRow[]>`
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
  return summary
}

const queryStatusBreakdown = (businessId: string, from: Date, to: Date) =>
  prismaAdmin.$queryRaw<StatusBreakdownSqlRow[]>`
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

const getProfitLoss = async (businessId: string, from: Date, to: Date): Promise<IProfitLoss> => {
  const [summary, breakdown] = await Promise.all([
    queryPnlSummary(businessId, from, to),
    queryStatusBreakdown(businessId, from, to),
  ])

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

export const FinancialsService = {
  getTodaySnapshot,
  getProfitLoss,
}
