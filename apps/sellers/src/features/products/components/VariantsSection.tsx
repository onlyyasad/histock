'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateVariantMutation } from '../store/productsApi'
import type { Variant } from '../store/productsApi'
import { StockBadge } from './StockBadge'
import { fmtMoney } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getErrorMessage, getErrorCode } from '@/lib/apiError'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
      if (getErrorCode(err) === 'SKU_CAP_REACHED') {
        toast.error(getErrorMessage(err, 'SKU limit reached. Upgrade your plan.'))
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
          {showForm ? 'Cancel' : 'Add variant'}
        </Button>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-3">
        {variants.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">No variants yet. Add size, colour, etc.</p>
        )}

        {variants.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        ৳{fmtMoney(v.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <StockBadge stock={v.currentStock} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile rows */}
            <div className="md:hidden divide-y">
              {variants.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-sm py-2">
                  <span>{v.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums">৳{fmtMoney(v.price)}</span>
                    <StockBadge stock={v.currentStock} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

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
