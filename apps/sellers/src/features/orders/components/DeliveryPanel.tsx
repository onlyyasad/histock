import { formatDateTime } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  courierName: string | null
  deliveryAttempts: number
  deliveryFailedAt: string | null
}

export function DeliveryPanel({ courierName, deliveryAttempts, deliveryFailedAt }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold">Delivery</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Courier</span>
          <span>{courierName ?? 'Not assigned'}</span>
        </div>
        {deliveryAttempts > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Attempts</span>
            <span className="font-mono tabular-nums">{deliveryAttempts}</span>
          </div>
        )}
        {deliveryFailedAt && (
          <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm">
            Delivery failed {formatDateTime(deliveryFailedAt)} — attempt #{deliveryAttempts}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
