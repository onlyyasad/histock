'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  useGetSchedulesQuery,
  useCreateScheduleMutation,
  useMarkScheduleDoneMutation,
  useDeleteScheduleMutation,
} from '../store/schedulesApi'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isOverdue(scheduledAt: string) {
  return new Date(scheduledAt) < new Date()
}

export function SchedulePanel({ orderId }: { orderId: string }) {
  const { data: schedules = [], isLoading } = useGetSchedulesQuery({ orderId })
  const [createSchedule, { isLoading: creating }] = useCreateScheduleMutation()
  const [markDone] = useMarkScheduleDoneMutation()
  const [deleteSchedule] = useDeleteScheduleMutation()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !scheduledAt) return
    try {
      await createSchedule({ title: title.trim(), scheduledAt: new Date(scheduledAt).toISOString(), orderId }).unwrap()
      toast.success('Reminder set')
      setTitle('')
      setScheduledAt('')
      setShowForm(false)
    } catch {
      toast.error('Failed to create reminder')
    }
  }

  const handleMarkDone = async (id: string) => {
    try {
      await markDone(id).unwrap()
      toast.success('Marked done')
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSchedule(id).unwrap()
      toast.success('Reminder deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const pending = schedules.filter((s) => !s.isDone)
  const done = schedules.filter((s) => s.isDone)

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Reminders</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add Reminder'}
        </Button>
      </CardHeader>
      <CardContent className="px-5 pb-4 space-y-3">
        {showForm && (
          <form onSubmit={handleCreate} className="space-y-3 border rounded-lg p-3 bg-muted/40">
            <div className="space-y-1">
              <Label htmlFor="sched-title">Title</Label>
              <Input
                id="sched-title"
                placeholder="e.g. Follow up with customer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sched-at">Date & Time</Label>
              <Input
                id="sched-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? 'Saving...' : 'Save Reminder'}
            </Button>
          </form>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

        {!isLoading && pending.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">No reminders for this order.</p>
        )}

        {pending.map((s) => (
          <div key={s.id} className="flex items-start justify-between gap-2 text-sm">
            <div className="space-y-0.5">
              <p className="font-medium">{s.title}</p>
              <p className={isOverdue(s.scheduledAt) ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}>
                {isOverdue(s.scheduledAt) ? '⚠ Overdue — ' : ''}{formatDateTime(s.scheduledAt)}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="outline" onClick={() => handleMarkDone(s.id)}>Done</Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(s.id)}>×</Button>
            </div>
          </div>
        ))}

        {done.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground text-xs select-none">
              {done.length} completed reminder{done.length > 1 ? 's' : ''}
            </summary>
            <div className="mt-2 space-y-2">
              {done.map((s) => (
                <div key={s.id} className="flex items-start justify-between gap-2 opacity-60">
                  <div className="space-y-0.5">
                    <p className="line-through">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(s.scheduledAt)}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">Done</Badge>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}
