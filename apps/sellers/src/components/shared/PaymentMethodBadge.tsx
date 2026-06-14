import { Badge } from '@/components/ui/badge'
import { PAYMENT_METHOD_LABELS } from '@/lib/format'
import type { PaymentMethod } from '@histock/shared'

export function PaymentMethodBadge({ method, className }: { method: PaymentMethod | string; className?: string }) {
  return (
    <Badge variant="outline" className={className}>
      {PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? method}
    </Badge>
  )
}
