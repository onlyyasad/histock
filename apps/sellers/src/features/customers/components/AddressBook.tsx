'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAddAddressMutation } from '../store/customersApi'
import type { CustomerAddress } from '../store/customersApi'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  customerId: string
  addresses: CustomerAddress[]
}

export function AddressBook({ customerId, addresses }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [addAddress, { isLoading }] = useAddAddressMutation()
  const [form, setForm] = useState({
    label: '',
    addressLine: '',
    district: '',
    isDefault: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addAddress({ customerId, ...form }).unwrap()
      toast.success('Address added')
      setShowForm(false)
      setForm({ label: '', addressLine: '', district: '', isDefault: false })
    } catch {
      toast.error('Failed to add address')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Addresses</h2>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
          + Add
        </Button>
      </div>

      {showForm && (
        <Card className="mb-3">
          <CardContent className="pt-4 space-y-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="addr-label">Label</Label>
                <Input
                  id="addr-label"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Home"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="addr-line">Full address</Label>
                <Input
                  id="addr-line"
                  value={form.addressLine}
                  onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
                  placeholder="Full address"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="addr-district">District (optional)</Label>
                <Input
                  id="addr-district"
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                  placeholder="District"
                />
              </div>
              <Label className="flex items-center gap-2 font-normal cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  className="rounded"
                />
                Set as default
              </Label>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isLoading}>
                  Save
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {addresses.map((addr) => (
          <div key={addr.id} className="border rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{addr.label}</span>
              {addr.isDefault && <Badge variant="secondary">Default</Badge>}
            </div>
            <p className="text-muted-foreground mt-1">{addr.addressLine}</p>
            {addr.district && <p className="text-muted-foreground/60">{addr.district}</p>}
          </div>
        ))}
        {addresses.length === 0 && (
          <p className="text-muted-foreground text-sm">No addresses saved</p>
        )}
      </div>
    </div>
  )
}
