import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  variant?: 'default' | 'warning' | 'danger'
  icon?: LucideIcon
  href?: string
}

export function StatCard({ label, value, subtext, variant = 'default', icon: Icon, href }: StatCardProps) {
  const card = (
    <Card
      className={cn(
        'shadow-sm h-full',
        variant === 'warning' && 'bg-warning/10 border-warning/30',
        variant === 'danger' && 'bg-destructive/10 border-destructive/30',
        href && 'transition-colors hover:border-ring/40',
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          {Icon && <Icon className="size-4 text-muted-foreground/60 shrink-0" />}
        </div>
        <p className="text-3xl font-semibold tabular-nums mt-1">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  )
  return href ? <Link href={href} className="block h-full">{card}</Link> : card
}
