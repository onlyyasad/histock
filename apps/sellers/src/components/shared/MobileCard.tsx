import Link from 'next/link'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

interface MobileCardProps {
  href?: string
  title: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  meta?: ReactNode
}

export function MobileCard({ href, title, subtitle, right, meta }: MobileCardProps) {
  const body = (
    <Card className="p-4 space-y-1">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{title}</div>
          {subtitle ? <div className="text-sm text-muted-foreground truncate">{subtitle}</div> : null}
        </div>
        {right ? <div className="text-right shrink-0">{right}</div> : null}
      </div>
      {meta ? <div className="text-xs text-muted-foreground">{meta}</div> : null}
    </Card>
  )
  return href ? <Link href={href} className="block">{body}</Link> : body
}
