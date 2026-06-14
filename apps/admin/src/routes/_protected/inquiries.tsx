import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useGetInquiriesQuery } from '@/store/adminApiSlice'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { InquiryStatusBadge } from '@/components/shared/InquiryStatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDateTime, formatRelative } from '@/lib/format'

function InquiriesPage() {
  const [status, setStatus] = useState<string>('')

  const { data: inquiries, isLoading } = useGetInquiriesQuery({
    status: status || undefined,
  })

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Inquiries" description="Contact Sales requests and replies." />

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
      ) : inquiries?.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={status ? `No ${status.replace('_', ' ')} inquiries` : 'No inquiries yet'}
          description={status ? 'Try another status filter.' : 'Contact Sales submissions will appear here.'}
        />
      ) : (
        <div className="space-y-3">
          {inquiries?.map((inq) => (
            <Card key={inq.id}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-medium truncate">{inq.name}</p>
                    <a
                      href={`mailto:${inq.email}`}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      {inq.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <InquiryStatusBadge status={inq.status} />
                    <span
                      className="text-xs text-muted-foreground"
                      title={formatDateTime(inq.createdAt)}
                    >
                      {formatRelative(inq.createdAt)}
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
