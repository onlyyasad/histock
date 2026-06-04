'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateVariantMutation } from '../store/productsApi'
import type { Variant } from '../store/productsApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Props {
  productId: string
  variants: Variant[]
}

export function VariantsSection({ productId, variants }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [createVariant, { isLoading }] = useCreateVariantMutation()
  const [form, setForm] = useState({ name: '', sku: '', price: '' })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price) return
    try {
      const result = await createVariant({
        productId,
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        price: Number(form.price),
      }).unwrap()

      const r = result as typeof result & { warning?: { type: string; used: number; cap: number } }
      if (r.warning?.type === 'SKU_CAP_NEAR') {
        toast.warning(`You've used ${r.warning.used} of ${r.warning.cap} SKUs on your plan.`)
      } else {
        toast.success('Variant added')
      }

      setForm({ name: '', sku: '', price: '' })
      setShowForm(false)
    } catch (err: unknown) {
      const e = err as { data?: { error?: string; code?: string } }
      if (e?.data?.code === 'SKU_CAP_REACHED') {
        toast.error(e.data.error ?? 'SKU limit reached. Upgrade your plan.')
      } else {
        toast.error('Failed to add variant')
      }
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">
          Variants{variants.length > 0 && <Badge variant="secondary" className="ml-2">{variants.length}</Badge>}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ Add Variant'}
        </Button>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-3">
        {variants.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">No variants yet. Add size, colour, etc.</p>
        )}

        {variants.map((v, i) => (
          <div key={v.id}>
            {i > 0 && <Separator className="mb-3" />}
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{v.name}</p>
                {v.sku && <p className="text-xs text-muted-foreground">SKU: {v.sku}</p>}
              </div>
              <div className="text-right">
                <p className="font-medium tabular-nums">৳{v.price.toFixed(2)}</p>
                <p className={`text-xs ${v.currentStock <= 5 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {v.currentStock} in stock
                </p>
              </div>
            </div>
          </div>
        ))}

        {showForm && (
          <form onSubmit={handleAdd} className="space-y-3 border rounded-lg p-3 bg-muted/40">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Variant name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Red / Large"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>SKU (optional)</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-1">
                <Label>Price (৳) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
              </div>
            </div>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Variant'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
