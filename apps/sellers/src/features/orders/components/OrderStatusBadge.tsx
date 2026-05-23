const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-gray-100 text-gray-700' },
  processing: { label: 'Processing', classes: 'bg-blue-100 text-blue-700' },
  packed: { label: 'Packed', classes: 'bg-indigo-100 text-indigo-700' },
  handover_to_courier: { label: 'With Courier', classes: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Delivered', classes: 'bg-green-100 text-green-700' },
  delivery_failed: { label: 'Delivery Failed', classes: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', classes: 'bg-gray-200 text-gray-500' },
  refunded: { label: 'Refunded', classes: 'bg-orange-100 text-orange-700' },
}

export function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700' }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}
    >
      {config.label}
    </span>
  )
}
