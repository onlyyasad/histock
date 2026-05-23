'use client'

import { useGetOrderCostBreakdownQuery } from '../store/ordersApi'

function fmt(amount: number) {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Props {
  orderId: string
}

export function CostBreakdownPanel({ orderId }: Props) {
  const { data, isLoading } = useGetOrderCostBreakdownQuery(orderId)

  if (isLoading) {
    return (
      <div className="bg-white border rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const isPositive = data.profit >= 0

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">Cost Breakdown</h3>

      {data.note && <p className="text-xs text-gray-400 italic">{data.note}</p>}

      {data.allocations.length > 0 && (
        <div className="space-y-1">
          {data.allocations.map((a, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-500">
                {a.productName} × {a.quantity}
              </span>
              <span className="tabular-nums">{fmt(a.totalCost)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Revenue (excl. delivery)</span>
          <span className="tabular-nums">{fmt(data.totalRevenue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">COGS</span>
          <span className="tabular-nums">{fmt(data.totalCost)}</span>
        </div>
        <div
          className={`flex justify-between font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}
        >
          <span>Profit</span>
          <span className="tabular-nums">
            {fmt(data.profit)} ({data.margin.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  )
}
