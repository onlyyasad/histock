'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Plus, LifeBuoy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { TicketStatusBadge } from './components/TicketStatusBadge'
import { formatDate } from '@/lib/format'
import { useGetTicketsQuery, useCreateTicketMutation } from './store/supportApi'
import type { CreateTicketInput } from './store/supportApi'

const TYPE_LABELS: Record<string, string> = {
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  question: 'Question',
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
            <Select
              value={form.type}
              onValueChange={(value) => setForm((f) => ({ ...f, type: value as CreateTicketInput['type'] }))}
            >
              <SelectTrigger id="ticket-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="bug_report">Bug Report</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
              </SelectContent>
            </Select>
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
            <Textarea
              id="ticket-desc"
              rows={4}
              placeholder="Describe the issue or question in detail..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
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
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title="Support"
        description="Questions, bugs, and feature requests."
        actions={!showForm ? <Button size="sm" onClick={() => setShowForm(true)}><Plus />New request</Button> : undefined}
      />

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
        <EmptyState
          icon={LifeBuoy}
          title="No support requests yet"
          description="Need help? Open a request and we'll get back to you."
          action={<Button size="sm" onClick={() => setShowForm(true)}>New request</Button>}
        />
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
                  {TYPE_LABELS[ticket.type]} · {formatDate(ticket.createdAt)}
                </p>
              </div>
              <TicketStatusBadge status={ticket.status} />
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}
