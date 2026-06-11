import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginatorProps {
  page: number
  onPageChange: (page: number) => void
  hasNext: boolean
  className?: string
}

export function Paginator({ page, onPageChange, hasNext, className }: PaginatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">Page {page}</span>
      <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
    </div>
  )
}
