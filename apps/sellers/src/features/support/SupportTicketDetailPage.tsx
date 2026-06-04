'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useSse } from '@/hooks/useSse'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGetTicketQuery, useAddTicketMessageMutation } from './store/supportApi'

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  open: 'default',
  in_progress: 'default',
  resolved: 'secondary',
  closed: 'outline',
}

export function SupportTicketDetailPage({ ticketId }: { ticketId: string }) {
  const { data: ticket, isLoading, refetch } = useGetTicketQuery(ticketId, {
    refetchOnFocus: true,
  })
  const [addMessage, { isLoading: sending }] = useAddTicketMessageMutation()
  const [body, setBody] = useState('')

  const handleSseEvent = useCallback(
    (type: string, data: unknown) => {
      if (type === 'ticket_message') {
        const d = data as { ticketId?: string }
        if (d.ticketId === ticketId) {
          void refetch()
        }
      }
    },
    [refetch, ticketId],
  )

  useSse(handleSseEvent)

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>
  if (!ticket) return <div className="p-6 text-destructive">Ticket not found</div>

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    try {
      await addMessage({ id: ticketId, body: body.trim() }).unwrap()
      setBody('')
    } catch {
      toast.error('Failed to send message')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <Link href="/support" className="text-sm text-muted-foreground hover:underline mb-1 block">
          ← Support
        </Link>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold">{ticket.title}</h1>
          <Badge variant={STATUS_VARIANTS[ticket.status] ?? 'secondary'} className="shrink-0 capitalize text-xs">
            {ticket.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          {ticket.type.replace('_', ' ')} · {new Date(ticket.createdAt).toLocaleDateString('en-BD')}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold">Description</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      {ticket.messages.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Conversation</p>
          {ticket.messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg px-4 py-3 text-sm ${
                msg.senderType === 'seller'
                  ? 'bg-primary/10 ml-8'
                  : 'bg-muted mr-8'
              }`}
            >
              <p className="text-xs text-muted-foreground mb-1">
                {msg.senderType === 'seller' ? 'You' : 'HiStock Support'} ·{' '}
                {new Date(msg.createdAt).toLocaleString('en-BD')}
              </p>
              <p className="whitespace-pre-wrap">{msg.body}</p>
            </div>
          ))}
        </div>
      )}

      {ticket.status !== 'closed' && (
        <form onSubmit={handleSend} className="space-y-2">
          <textarea
            rows={3}
            placeholder="Add a message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button type="submit" size="sm" disabled={sending || !body.trim()}>
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      )}
    </div>
  )
}
