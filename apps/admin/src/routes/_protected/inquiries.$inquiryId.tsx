import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useGetInquiryQuery,
  useUpdateInquiryMutation,
  type ContactInquiry,
  type ContactInquiryMessage,
} from '@/store/adminApiSlice'
import { useSetBreadcrumbEntity } from '@/components/shared/BreadcrumbEntity'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type InquiryStatus = 'new' | 'in_progress' | 'resolved'

function statusVariant(status: InquiryStatus): 'default' | 'secondary' | 'outline' {
  if (status === 'resolved') return 'default'
  if (status === 'in_progress') return 'secondary'
  return 'outline'
}

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
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!inquiry) {
    return <div className="p-6 text-destructive">Inquiry not found</div>
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{inquiry.name}</h1>
          <p className="text-sm text-muted-foreground">{inquiry.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(inquiry.status)}>
            {inquiry.status.replace('_', ' ')}
          </Badge>
          {inquiry.status !== 'resolved' && (
            <Button variant="outline" size="sm" onClick={handleResolve}>
              Mark Resolved
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Message</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(inquiry.createdAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {messages.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Thread</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('space-y-1', msg.fromAdmin ? 'text-right' : '')}
              >
                <p className="text-xs text-muted-foreground">
                  {msg.fromAdmin ? 'Admin' : inquiry.name} · {new Date(msg.createdAt).toLocaleString()}
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
