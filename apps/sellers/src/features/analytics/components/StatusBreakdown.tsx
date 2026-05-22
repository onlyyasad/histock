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

interface Props {
  breakdown: Array<{ status: string; count: number; total: number }>
  totalOrders: number
}

export function StatusBreakdown({ breakdown, totalOrders }: Props) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-4">By Status</h3>
      <div className="space-y-2">
        {breakdown.map(({ status, count, total }) => {
          const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
          return (
            <div key={status} className="flex items-center gap-3">
              <div className="w-28 text-sm text-gray-500 shrink-0">
                {STATUS_LABELS[status] ?? status}
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-sm tabular-nums w-8 text-right">{count}</div>
              <div className="text-xs text-gray-400 tabular-nums w-24 text-right">
                ৳{Number(total).toFixed(0)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
