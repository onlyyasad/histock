import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useGetInquiriesQuery } from '@/store/adminApiSlice'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type InquiryStatus = 'new' | 'in_progress' | 'resolved'

function statusVariant(status: InquiryStatus): 'default' | 'secondary' | 'outline' {
  if (status === 'resolved') return 'default'
  if (status === 'in_progress') return 'secondary'
  return 'outline'
}

function InquiriesPage() {
  const [status, setStatus] = useState<string>('')

  const { data: inquiries, isLoading } = useGetInquiriesQuery({
    status: status || undefined,
  })

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Inquiries</h1>

      <Select value={status} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries?.length === 0 && (
            <p className="text-sm text-muted-foreground">No inquiries found.</p>
          )}
          {inquiries?.map((inq) => (
            <Card key={inq.id}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-medium truncate">{inq.name}</p>
                    <p className="text-xs text-muted-foreground">{inq.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusVariant(inq.status)}>
                      {inq.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm line-clamp-2">{inq.message}</p>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link to="/inquiries/$inquiryId" params={{ inquiryId: inq.id }} />}
                >
                  View
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_protected/inquiries')({
  component: InquiriesPage,
})
