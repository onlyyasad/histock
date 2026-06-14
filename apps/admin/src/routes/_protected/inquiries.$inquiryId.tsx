import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDateTime, formatRelative } from '@/lib/format'
import {
  useGetInquiryQuery,
  useUpdateInquiryMutation,
  type ContactInquiry,
  type ContactInquiryMessage,
} from '@/store/adminApiSlice'
import { useSetBreadcrumbEntity } from '@/components/shared/BreadcrumbEntity'
import { PageHeader } from '@/components/shared/PageHeader'
import { InquiryStatusBadge } from '@/components/shared/InquiryStatusBadge'
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

function InquiryDetailPage({ inquiryId }: { inquiryId: string }) {
  const { data: inquiry, isLoading, refetch } = useGetInquiryQuery(inquiryId)
  const [updateInquiry, { isLoading: submitting }] = useUpdateInquiryMutation()
  const [reply, setReply] = useState('')
  const [messages, setMessages] = useState<ContactInquiryMessage[]>([])

  useSetBreadcrumbEntity(inquiry?.name ?? null)

  useEffect(() => {
    if (inquiry?.messages) {
      setMessages(inquiry.messages)
    }
  }, [inquiry?.messages])

  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_URL as string).replace('/api/v1', '')
    const url = `${apiBase}/api/v1/admin/inquiries/${inquiryId}/stream`
    const es = new EventSource(url, { withCredentials: true })

    es.addEventListener('init', (e) => {
      const data = JSON.parse(e.data) as ContactInquiry
      if (data.messages) setMessages(data.messages)
    })

    es.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data) as ContactInquiryMessage
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })

    es.addEventListener('close', () => es.close())

    return () => es.close()
  }, [inquiryId])

  const handleReply = async () => {
    if (!reply.trim()) return
    try {
      await updateInquiry({ id: inquiryId, action: 'reply', content: reply }).unwrap()
      setReply('')
      refetch()
    } catch {
      toast.error('Failed to send reply')
    }
  }

  const handleResolve = async () => {
    try {
      await updateInquiry({ id: inquiryId, action: 'resolve' }).unwrap()
      toast.success('Inquiry marked as resolved')
      refetch()
    } catch {
      toast.error('Failed to resolve')
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

  if (!inquiry) {
    return <div className="p-4 md:p-6 text-destructive">Inquiry not found</div>
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <PageHeader
        title={inquiry.name}
        description={inquiry.email}
        actions={
          <div className="flex items-center gap-2">
            <InquiryStatusBadge status={inquiry.status} />
            {inquiry.status !== 'resolved' && (
              <Button variant="outline" size="sm" onClick={handleResolve}>
                Mark Resolved
              </Button>
            )}
          </div>
        }
      />

      {/* Contact + message in one card */}
      <Card>
        <CardHeader><CardTitle>Message</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {inquiry.name}</p>
            <p>
              <span className="text-muted-foreground">Email:</span>{' '}
              <a href={`mailto:${inquiry.email}`} className="hover:underline">{inquiry.email}</a>
            </p>
            {inquiry.phone && (
              <p><span className="text-muted-foreground">Phone:</span> {inquiry.phone}</p>
            )}
            <p className="text-xs text-muted-foreground">
              <span title={formatDateTime(inquiry.createdAt)}>{formatRelative(inquiry.createdAt)}</span>
            </p>
          </div>
          <Separator />
          <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
        </CardContent>
      </Card>

      {messages.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Thread</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'rounded-lg px-4 py-3',
                  msg.fromAdmin ? 'bg-primary/5' : 'bg-muted'
                )}
              >
                <p className="text-xs text-muted-foreground mb-1">
                  {msg.fromAdmin ? 'Admin' : inquiry.name}{' '}
                  · <span title={formatDateTime(msg.createdAt)}>{formatRelative(msg.createdAt)}</span>
                </p>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {inquiry.status !== 'resolved' && (
        <Card>
          <CardHeader><CardTitle>Reply</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply…"
              rows={4}
            />
            <Button
              onClick={handleReply}
              disabled={submitting || !reply.trim()}
            >
              {submitting ? 'Sending…' : 'Send Reply'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export const Route = createFileRoute('/_protected/inquiries/$inquiryId')({
  component: () => {
    const { inquiryId } = Route.useParams()
    return <InquiryDetailPage inquiryId={inquiryId} />
  },
})
