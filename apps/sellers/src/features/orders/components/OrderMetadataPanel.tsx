'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateOrderMetadataMutation } from '../store/ordersApi'
import { useGetCouriersQuery } from '@/features/financials/store/financialsApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  orderId: string
  currentCourierId: string | null
  currentTags: string[]
  currentNotes: string | null
}

export function OrderMetadataPanel({
  orderId,
  currentCourierId,
  currentTags,
  currentNotes,
}: Props) {
  const [open, setOpen] = useState(false)
  const { data: couriers = [] } = useGetCouriersQuery()
  const [updateMetadata, { isLoading }] = useUpdateOrderMetadataMutation()

  const [courierId, setCourierId] = useState<string | null>(currentCourierId)
  const [tagsInput, setTagsInput] = useState(currentTags.join(', '))
  const [notes, setNotes] = useState(currentNotes ?? '')

  const handleSave = async () => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      await updateMetadata({
        id: orderId,
        courierId: courierId || null,
        tags,
        notes: notes || null,
      }).unwrap()
      toast.success('Order updated')
      setOpen(false)
    } catch {
      toast.error('Failed to update order')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Order Details</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? 'Cancel' : 'Edit details'}
        </Button>
      </CardHeader>

      {!open && (
        <CardContent className="px-5 pb-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Courier</span>
            <span>
              {couriers.find((c) => c.id === currentCourierId)?.name ?? 'Not assigned'}
            </span>
          </div>
          {currentTags.length > 0 && (
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">Tags</span>
              <div className="flex flex-wrap justify-end gap-1">
                {currentTags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          {currentNotes && (
            <div className="pt-1">
              <p className="text-muted-foreground text-xs">Note</p>
              <p className="text-sm whitespace-pre-wrap">{currentNotes}</p>
            </div>
          )}
        </CardContent>
      )}

      {open && (
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="space-y-1">
            <Label>Courier</Label>
            <Select
              value={courierId ?? '__none__'}
              onValueChange={(v) => setCourierId(v === '__none__' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No courier assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No courier</SelectItem>
                {couriers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Tags</Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. urgent, gift, exchange"
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes..."
            />
          </div>

          <Button onClick={handleSave} disabled={isLoading} size="sm" className="w-full">
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
