import { Badge } from '@/components/ui/badge'

const STATUS_STYLES: Record<string, { variant: 'default' | 'secondary' | 'outline'; className?: string }> = {
  new: { variant: 'outline', className: 'border-warning/30 bg-warning/10 text-warning' },
  in_progress: { variant: 'secondary' },
  resolved: { variant: 'outline', className: 'border-success/30 bg-success/10 text-success' },
}

export function InquiryStatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { variant: 'outline' as const }
  return (
    <Badge variant={s.variant} className={`capitalize ${s.className ?? ''}`}>
      {status.replace('_', ' ')}
    </Badge>
  )
}
