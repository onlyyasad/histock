import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { fmtMoney } from '@/lib/utils'

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
            <p className="text-2xl font-semibold font-mono tabular-nums">৳{fmtMoney(data.revenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.orderCount} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">COGS</p>
            <p className="text-2xl font-semibold font-mono tabular-nums">৳{fmtMoney(data.cogs)}</p>
            <p className="text-xs text-muted-foreground mt-1">Cost of goods sold</p>
          </CardContent>
        </Card>

        <Card className={cn(isPositive ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Profit</p>
            <p className={cn('text-2xl font-semibold font-mono tabular-nums', isPositive ? 'text-success' : 'text-destructive')}>
              ৳{fmtMoney(data.profit)}
            </p>
            <p className={cn('text-xs', isPositive ? 'text-success/70' : 'text-destructive/70')}>
              {data.margin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card className={cn(data.refunds > 0 && 'bg-destructive/10 border-destructive/30')}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Refunds</p>
            <p className={cn('text-2xl font-semibold font-mono tabular-nums', data.refunds > 0 ? 'text-destructive' : '')}>
              ৳{fmtMoney(data.refunds)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Refunds issued</p>
          </CardContent>
        </Card>
      </div>

      {data.deliveryFees > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Delivery fees collected</p>
              <p className="text-xl font-semibold font-mono tabular-nums">৳{fmtMoney(data.deliveryFees)}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
