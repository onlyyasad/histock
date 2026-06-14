import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fmtMoney } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  packed: 'Packed',
  handover_to_courier: 'With Courier',
  delivered: 'Delivered',
  delivery_failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

const STATUS_TOKEN: Record<string, string> = {
  pending: 'pending',
  processing: 'processing',
  packed: 'packed',
  handover_to_courier: 'handover',
  delivered: 'delivered',
  delivery_failed: 'failed',
  cancelled: 'pending',
  refunded: 'refunded',
}

interface Props {
  breakdown: Array<{ status: string; count: number; total: number }>
  totalOrders: number
}

export function StatusBreakdown({ breakdown, totalOrders }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">By Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {breakdown.map(({ status, count, total }) => {
          const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
          return (
            <div key={status} className="flex items-center gap-3">
              <div className="w-28 text-sm text-muted-foreground shrink-0">
                {STATUS_LABELS[status] ?? status}
              </div>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: `var(--status-${STATUS_TOKEN[status] ?? 'pending'}-fg)`,
                  }}
                />
              </div>
              <div className="text-sm font-mono tabular-nums w-8 text-right">{count}</div>
              <div className="text-xs text-muted-foreground font-mono tabular-nums w-24 text-right">
                ৳{fmtMoney(total)}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
