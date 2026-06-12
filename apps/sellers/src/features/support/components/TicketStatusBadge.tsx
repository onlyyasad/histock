import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, { variant: 'default' | 'outline'; className?: string }> = {
  open: { variant: 'default' },
  in_progress: { variant: 'outline', className: 'border-warning/30 bg-warning/10 text-warning' },
  resolved: { variant: 'outline', className: 'border-success/30 bg-success/10 text-success' },
  closed: { variant: 'outline' },
}

export function TicketStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STATUS_STYLES[status] ?? { variant: 'outline' as const }
  return (
    <Badge variant={s.variant} className={cn('capitalize text-xs shrink-0', s.className, className)}>
      {status.replace('_', ' ')}
    </Badge>
  )
}
