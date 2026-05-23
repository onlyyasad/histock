'use client'

import { useGetDashboardQuery } from './store/dashboardApi'
import { StatCard } from './components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Coming in phase 1.11 — orders frontend.</p>
        </CardContent>
      </Card>
    </div>
  )
}
