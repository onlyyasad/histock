import { Badge } from '@/components/ui/badge'

export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
        Out
      </Badge>
    )
  }
  if (stock <= 5) {
    return (
      <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning tabular-nums">
        Low · {stock}
      </Badge>
    )
  }
  return <span className="tabular-nums">{stock}</span>
}
