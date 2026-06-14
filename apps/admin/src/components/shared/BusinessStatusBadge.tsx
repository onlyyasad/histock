import { Badge } from '@/components/ui/badge'

const STATUS_MAP: Record<string, { className: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { variant: 'outline', className: 'border-success/30 bg-success/10 text-success' },
  trial: { variant: 'secondary', className: '' },
  grace_period: { variant: 'outline', className: 'border-warning/30 bg-warning/10 text-warning' },
  expired: { variant: 'outline', className: 'border-destructive/30 bg-destructive/10 text-destructive' },
  cancelled: { variant: 'outline', className: 'border-destructive/30 bg-destructive/10 text-destructive' },
}

export function BusinessStatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { variant: 'outline' as const, className: '' }
  return (
    <Badge variant={s.variant} className={`capitalize ${s.className}`}>
      {status.replace('_', ' ')}
    </Badge>
  )
}
