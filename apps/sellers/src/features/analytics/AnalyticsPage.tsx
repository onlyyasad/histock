'use client'

import { useState } from 'react'
import { DateRangePicker } from './components/DateRangePicker'
import { PnlSummary } from './components/PnlSummary'
import { StatusBreakdown } from './components/StatusBreakdown'
import { useGetPnlQuery } from './store/analyticsApi'

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export function AnalyticsPage() {
  const [range, setRange] = useState({
    from: daysAgo(30),
    to: new Date().toISOString().slice(0, 10),
  })

  const { data, isLoading, isFetching } = useGetPnlQuery(range)

  const totalOrders = data?.statusBreakdown.reduce((sum, s) => sum + s.count, 0) ?? 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        {isFetching && !isLoading && (
          <span className="text-xs text-muted-foreground">Refreshing...</span>
        )}
      </div>

      <DateRangePicker from={range.from} to={range.to} onChange={setRange} />

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {data && (
        <>
          <PnlSummary data={data} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatusBreakdown breakdown={data.statusBreakdown} totalOrders={totalOrders} />
          </div>
        </>
      )}
    </div>
  )
}
