'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAddOrderNoteMutation } from '../store/ordersApi'
import type { OrderResponse } from '@histock/shared'

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
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">Notes</h3>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notes.length === 0 && (
          <p className="text-sm text-gray-400">No notes yet</p>
        )}
        {notes.map((n) => (
          <div key={n.id} className="bg-gray-50 rounded p-3 text-sm">
            <p className="whitespace-pre-wrap">{n.content}</p>
            <p className="text-xs text-gray-400 mt-1">
              {n.user.name} · {new Date(n.createdAt).toLocaleString('en-BD')}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a note..."
          className="flex-1 border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  )
}
