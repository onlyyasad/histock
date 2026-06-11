import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function fmt(amount: number) {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Props {
  data: {
    revenue: number
    cogs: number
    deliveryFees: number
    refunds: number
    profit: number
    margin: number
    orderCount: number
  }
}

export function PnlSummary({ data }: Props) {
  const isPositive = data.profit >= 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold">{fmt(data.revenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.orderCount} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">COGS</p>
            <p className="text-2xl font-bold">{fmt(data.cogs)}</p>
            <p className="text-xs text-muted-foreground mt-1">Cost of goods sold</p>
          </CardContent>
        </Card>

        <Card className={cn(isPositive ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Gross Profit</p>
            <p className={cn('text-2xl font-bold', isPositive ? 'text-success' : 'text-destructive')}>
              {fmt(data.profit)}
            </p>
            <p className={cn('text-xs', isPositive ? 'text-success/70' : 'text-destructive')}>
              {data.margin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isPositive ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Margin</p>
            <p className={cn('text-2xl font-bold', isPositive ? 'text-success' : 'text-destructive')}>
              {data.margin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {(data.deliveryFees > 0 || data.refunds > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Delivery Fees Collected</p>
              <p className="text-xl font-semibold">{fmt(data.deliveryFees)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Refunds Issued</p>
              <p className="text-xl font-semibold text-destructive">{fmt(data.refunds)}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
