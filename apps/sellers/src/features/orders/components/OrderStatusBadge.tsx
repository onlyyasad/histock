import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100' },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100' },
  packed: { label: 'Packed', className: 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
  handover_to_courier: { label: 'With Courier', className: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100' },
  delivery_failed: { label: 'Delivery Failed', className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-200 text-gray-500 border-gray-300 hover:bg-gray-200' },
  refunded: { label: 'Refunded', className: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100' },
}

export function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
