import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  variant?: 'default' | 'warning' | 'danger'
}

export function StatCard({ label, value, subtext, variant = 'default' }: StatCardProps) {
  return (
    <Card
      className={cn(
        'shadow-sm',
        variant === 'warning' && 'bg-amber-50 border-amber-200',
        variant === 'danger' && 'bg-red-50 border-red-200',
      )}
    >
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  )
}
