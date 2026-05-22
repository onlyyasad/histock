'use client'

import { useGetDashboardQuery } from './store/dashboardApi'
import { StatCard } from './components/StatCard'

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
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6 text-red-600">
        Could not load dashboard. Check your connection and try again.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Today&apos;s Snapshot</h1>
        <p className="text-sm text-gray-400">Auto-refreshes every 30s</p>
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
      </div>

      <div className="bg-white rounded-lg border p-5">
        <h2 className="font-semibold mb-4">Recent Orders</h2>
        <p className="text-sm text-gray-400">Coming in phase 1.11 — orders frontend.</p>
      </div>
    </div>
  )
}
