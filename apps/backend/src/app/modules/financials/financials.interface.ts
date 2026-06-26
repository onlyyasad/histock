export type ITodaySnapshot = {
  todayOrders: number
  pendingOrders: number
  processingOrders: number
  deliveredToday: number
  deliveryFailed: number
  todayRevenue: number
  lowStockProducts: number
  overdueSchedules: number
}

export type IStatusBreakdownRow = {
  status: string
  count: number
  total: number
}

export type IProfitLoss = {
  from: string
  to: string
  revenue: number
  cogs: number
  deliveryFees: number
  refunds: number
  profit: number
  margin: number
  orderCount: number
  statusBreakdown: IStatusBreakdownRow[]
}
