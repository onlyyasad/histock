'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useGetTicketsQuery, useCreateTicketMutation } from './store/supportApi'
import type { CreateTicketInput } from './store/supportApi'

const TYPE_LABELS: Record<string, string> = {
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  question: 'Question',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  open: 'default',
  in_progress: 'default',
  resolved: 'secondary',
  closed: 'outline',
}

function NewTicketForm({ onSuccess }: { onSuccess: () => void }) {
  const [createTicket, { isLoading }] = useCreateTicketMutation()
  const [form, setForm] = useState<CreateTicketInput>({
    title: '',
    description: '',
    type: 'question',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) return
    try {
      await createTicket(form).unwrap()
      toast.success('Ticket submitted')
      onSuccess()
    } catch {
      toast.error('Failed to submit ticket')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold">New Support Request</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="ticket-type">Type</Label>
            <select
              id="ticket-type"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CreateTicketInput['type'] }))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="question">Question</option>
              <option value="bug_report">Bug Report</option>
              <option value="feature_request">Feature Request</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ticket-title">Title</Label>
            <Input
              id="ticket-title"
              placeholder="Brief summary of your issue"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ticket-desc">Description</Label>
            <textarea
              id="ticket-desc"
              rows={4}
              placeholder="Describe the issue or question in detail..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit'}
            </Button>
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function SupportPage() {
  const { data: tickets = [], isLoading } = useGetTicketsQuery()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support</h1>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + New Request
          </Button>
        )}
      </div>

      {showForm && (
        <NewTicketForm onSuccess={() => setShowForm(false)} />
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && tickets.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No support requests yet. Click &quot;New Request&quot; if you need help.
          </CardContent>
        </Card>
      )}

      {tickets.map((ticket, i) => (
        <div key={ticket.id}>
          {i > 0 && <Separator />}
          <Link
            href={`/support/${ticket.id}`}
            className={cn('block hover:bg-muted/50 rounded-lg p-3 -mx-1 transition-colors')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <p className="font-medium truncate">{ticket.title}</p>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABELS[ticket.type]} · {new Date(ticket.createdAt).toLocaleDateString('en-BD')}
                </p>
              </div>
              <Badge variant={STATUS_VARIANTS[ticket.status] ?? 'secondary'} className="shrink-0 capitalize text-xs">
                {ticket.status.replace('_', ' ')}
              </Badge>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}
