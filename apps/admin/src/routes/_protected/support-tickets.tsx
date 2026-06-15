import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { LifeBuoy } from 'lucide-react'
import { useGetSupportTicketsQuery } from '@/store/adminApiSlice'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { TicketStatusBadge } from '@/components/shared/TicketStatusBadge'
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
import { formatDateTime, formatRelative } from '@/lib/format'

function SupportTicketsPage() {
  const [status, setStatus] = useState<string>('')

  const { data: tickets, isLoading } = useGetSupportTicketsQuery({
    status: status || undefined,
  })

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="Support Tickets" description="Seller-submitted support requests." />

      <Select value={status} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : tickets?.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title={status ? `No ${status.replace('_', ' ')} tickets` : 'No support tickets yet'}
          description={status ? 'Try another status filter.' : 'Seller support requests will appear here.'}
        />
      ) : (
        <div className="space-y-3">
          {tickets?.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-medium truncate">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ticket.business.name}
                      {ticket.business.isDemo && (
                        <Badge variant="outline" className="ml-1.5 text-[10px] border-warning/30 bg-warning/10 text-warning">
                          Demo
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <TicketStatusBadge status={ticket.status} />
                    <span
                      className="text-xs text-muted-foreground"
                      title={formatDateTime(ticket.createdAt)}
                    >
                      {formatRelative(ticket.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground capitalize">
                    {ticket.type.replace('_', ' ')} · {ticket._count.messages} message
                    {ticket._count.messages === 1 ? '' : 's'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link to="/support-tickets/$ticketId" params={{ ticketId: ticket.id }} />}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_protected/support-tickets')({
  component: SupportTicketsPage,
})
