import { Badge } from '@/components/ui/badge'

type StatusKey =
  | 'pending'
  | 'processing'
  | 'packed'
  | 'handover_to_courier'
  | 'delivered'
  | 'delivery_failed'
  | 'cancelled'
  | 'refunded'

const STATUS_CONFIG: Record<StatusKey, { label: string; bg: string; fg: string; border: string }> = {
  pending:             { label: 'Pending',         bg: 'var(--status-pending)',    fg: 'var(--status-pending-fg)',    border: 'var(--status-pending-border)' },
  processing:          { label: 'Processing',       bg: 'var(--status-processing)', fg: 'var(--status-processing-fg)', border: 'var(--status-processing-border)' },
  packed:              { label: 'Packed',           bg: 'var(--status-packed)',     fg: 'var(--status-packed-fg)',     border: 'var(--status-packed-border)' },
  handover_to_courier: { label: 'With Courier',     bg: 'var(--status-handover)',   fg: 'var(--status-handover-fg)',   border: 'var(--status-handover-border)' },
  delivered:           { label: 'Delivered',        bg: 'var(--status-delivered)',  fg: 'var(--status-delivered-fg)',  border: 'var(--status-delivered-border)' },
  delivery_failed:     { label: 'Delivery Failed',  bg: 'var(--status-failed)',     fg: 'var(--status-failed-fg)',     border: 'var(--status-failed-border)' },
  cancelled:           { label: 'Cancelled',        bg: 'var(--status-pending)',    fg: 'var(--status-pending-fg)',    border: 'var(--status-pending-border)' },
  refunded:            { label: 'Refunded',         bg: 'var(--status-refunded)',   fg: 'var(--status-refunded-fg)',   border: 'var(--status-refunded-border)' },
}

export function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as StatusKey] ?? { label: status, bg: 'var(--status-pending)', fg: 'var(--status-pending-fg)', border: 'var(--status-pending-border)' }
  return (
    <Badge
      variant="outline"
      className="text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.fg, borderColor: config.border }}
    >
      {config.label}
    </Badge>
  )
}
