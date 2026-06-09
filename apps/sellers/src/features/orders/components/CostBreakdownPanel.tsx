'use client'

import { useGetOrderCostBreakdownQuery } from '../store/ordersApi'
import { fmtMoney } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function fmt(amount: number) {
  return `৳${fmtMoney(amount)}`
}

interface Props {
  orderId: string
}

export function CostBreakdownPanel({ orderId }: Props) {
  const { data, isLoading } = useGetOrderCostBreakdownQuery(orderId)

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4 space-y-2">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const isPositive = data.profit >= 0

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {data.note && <p className="text-xs text-muted-foreground italic">{data.note}</p>}

        {data.allocations.length > 0 && (
          <div className="space-y-1">
            {data.allocations.map((a, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {a.productName} × {a.quantity}
                </span>
                <span className="tabular-nums">{fmt(a.totalCost)}</span>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Revenue (excl. delivery)</span>
            <span className="tabular-nums">{fmt(data.totalRevenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">COGS</span>
            <span className="tabular-nums">{fmt(data.totalCost)}</span>
          </div>
          <div className={`flex justify-between font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
            <span>Profit</span>
            <span className="tabular-nums">
              {fmt(data.profit)} ({data.margin.toFixed(1)}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
