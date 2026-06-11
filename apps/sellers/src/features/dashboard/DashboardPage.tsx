'use client'

import Link from 'next/link'
import { useGetDashboardQuery } from './store/dashboardApi'
import { useGetOrdersQuery } from '@/features/orders/store/ordersApi'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { formatOrderNumber } from '@/lib/format'
import { StatCard } from './components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { fmtMoney } from '@/lib/utils'

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function DashboardPage() {
  const { data, isLoading, isError } = useGetDashboardQuery(undefined, {
    pollingInterval: 30_000,
    refetchOnFocus: true,
  })
  const { data: recentOrders } = useGetOrdersQuery({ page: 1, limit: 5 })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6 text-destructive">
        Could not load dashboard. Check your connection and try again.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Today&apos;s Snapshot</h1>
        <p className="text-sm text-muted-foreground">Auto-refreshes every 30s</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Orders" value={data.todayOrders} />
        <StatCard
          label="Pending"
          value={data.pendingOrders}
          variant={data.pendingOrders > 10 ? 'warning' : 'default'}
        />
        <StatCard label="Processing" value={data.processingOrders} />
        <StatCard label="Delivered Today" value={data.deliveredToday} />
        <StatCard
          label="Delivery Failed"
          value={data.deliveryFailed}
          variant={data.deliveryFailed > 0 ? 'danger' : 'default'}
          subtext={data.deliveryFailed > 0 ? 'Needs attention' : undefined}
        />
        <StatCard label="Today's Revenue" value={formatMoney(data.todayRevenue)} />
        <StatCard
          label="Low Stock Products"
          value={data.lowStockProducts}
          variant={data.lowStockProducts > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Overdue Reminders"
          value={data.overdueSchedules ?? 0}
          variant={(data.overdueSchedules ?? 0) > 0 ? 'danger' : 'default'}
          subtext={(data.overdueSchedules ?? 0) > 0 ? 'Action needed' : undefined}
        />
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Link href="/orders" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {(!recentOrders || recentOrders.length === 0) && (
            <p className="text-sm text-muted-foreground px-6 pb-4">No orders yet.</p>
          )}
          {recentOrders?.map((order, i) => (
            <div key={order.id}>
              {i > 0 && <Separator />}
              <Link
                href={`/orders/${order.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{formatOrderNumber(order.orderNumber)}</p>
                  <p className="text-xs text-muted-foreground">{order.customer.name}</p>
                </div>
                <div className="text-right space-y-1">
                  <OrderStatusBadge status={order.status} />
                  <p className="text-xs font-medium">৳{fmtMoney(order.total)}</p>
                </div>
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
