import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDateTime, formatRelative } from '@/lib/format'
import {
  useGetSupportTicketQuery,
  useReplySupportTicketMutation,
  useUpdateSupportTicketStatusMutation,
  type TicketStatus,
} from '@/store/adminApiSlice'
import { useSetBreadcrumbEntity } from '@/components/shared/BreadcrumbEntity'
import { PageHeader } from '@/components/shared/PageHeader'
import { TicketStatusBadge } from '@/components/shared/TicketStatusBadge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

function SupportTicketDetailPage({ ticketId }: { ticketId: string }) {
  const { data: ticket, isLoading } = useGetSupportTicketQuery(ticketId)
  const [replyTicket, { isLoading: submitting }] = useReplySupportTicketMutation()
  const [updateStatus] = useUpdateSupportTicketStatusMutation()
  const [reply, setReply] = useState('')

  useSetBreadcrumbEntity(ticket?.title ?? null)

  const handleReply = async () => {
    if (!reply.trim()) return
    try {
      await replyTicket({ id: ticketId, body: reply }).unwrap()
      setReply('')
    } catch {
      toast.error('Failed to send reply')
    }
  }

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus({ id: ticketId, status: status as TicketStatus }).unwrap()
      toast.success(`Status updated to ${status.replace('_', ' ')}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!ticket) {
    return <div className="p-4 md:p-6 text-destructive">Ticket not found</div>
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <PageHeader
        title={ticket.title}
        description={`${ticket.business.name} · ${ticket.submitter.name}`}
        actions={
          <div className="flex items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            <Select value={ticket.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-36" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Card>
        <CardHeader><CardTitle>Request</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1 text-sm">
            <p className="capitalize">
              <span className="text-muted-foreground">Type:</span> {ticket.type.replace('_', ' ')}
            </p>
            <p>
              <span className="text-muted-foreground">From:</span> {ticket.submitter.name}{' '}
              <a href={`mailto:${ticket.submitter.email}`} className="hover:underline">
                ({ticket.submitter.email})
              </a>
            </p>
            <p className="text-xs text-muted-foreground">
              <span title={formatDateTime(ticket.createdAt)}>{formatRelative(ticket.createdAt)}</span>
            </p>
          </div>
          <Separator />
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      {ticket.messages.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Thread</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {ticket.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'rounded-lg px-4 py-3',
                  msg.senderType === 'admin' ? 'bg-primary/5' : 'bg-muted'
                )}
              >
                <p className="text-xs text-muted-foreground mb-1">
                  {msg.senderType === 'admin' ? 'Admin' : ticket.submitter.name}{' '}
                  · <span title={formatDateTime(msg.createdAt)}>{formatRelative(msg.createdAt)}</span>
                </p>
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {ticket.status !== 'closed' && (
        <Card>
          <CardHeader><CardTitle>Reply</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply…"
              rows={4}
            />
            <Button onClick={handleReply} disabled={submitting || !reply.trim()}>
              {submitting ? 'Sending…' : 'Send Reply'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_protected/support-tickets/$ticketId')({
  component: () => {
    const { ticketId } = Route.useParams()
    return <SupportTicketDetailPage ticketId={ticketId} />
  },
})
