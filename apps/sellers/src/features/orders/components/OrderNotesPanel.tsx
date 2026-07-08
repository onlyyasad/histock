'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAddOrderNoteMutation } from '../api/ordersApi'
import type { OrderResponse } from '@histock/shared'
import { formatDateTime } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface Props {
  orderId: string
  notes: NonNullable<OrderResponse['orderNotes']>
}

export function OrderNotesPanel({ orderId, notes }: Props) {
  const [text, setText] = useState('')
  const [addNote, { isLoading }] = useAddOrderNoteMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    try {
      await addNote({ orderId, content: trimmed }).unwrap()
      setText('')
    } catch {
      toast.error('Failed to add note')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">Notes</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notes.length === 0 && (
            <p className="text-sm text-muted-foreground">No notes yet</p>
          )}
          {notes.map((n) => (
            <div key={n.id} className="bg-muted/50 rounded-md p-3 text-sm">
              <p className="whitespace-pre-wrap">{n.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {n.user.name} · {formatDateTime(n.createdAt)}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <Textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 resize-none"
          />
          <Button type="submit" variant="outline" size="sm" disabled={isLoading || !text.trim()}>
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
