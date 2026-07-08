'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from '../api/customersApi'
import type { CustomerAddress } from '../api/customersApi'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

interface Props {
  customerId: string
  addresses: CustomerAddress[]
}

export function AddressBook({ customerId, addresses }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [addAddress, { isLoading }] = useAddAddressMutation()
  const [updateAddress, { isLoading: updatingAddress }] = useUpdateAddressMutation()
  const [deleteAddress] = useDeleteAddressMutation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    label: '', addressLine: '', district: '', isDefault: false,
  })
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

  const handleEditOpen = (addr: CustomerAddress) => {
    setEditingId(addr.id)
    setEditForm({
      label: addr.label,
      addressLine: addr.addressLine,
      district: addr.district ?? '',
      isDefault: addr.isDefault,
    })
  }

  const handleEditSave = async (addressId: string) => {
    try {
      await updateAddress({
        customerId,
        addressId,
        label: editForm.label,
        addressLine: editForm.addressLine,
        district: editForm.district || null,
        isDefault: editForm.isDefault,
      }).unwrap()
      toast.success('Address updated')
      setEditingId(null)
    } catch {
      toast.error('Failed to update address')
    }
  }

  const handleDelete = async (addressId: string) => {
    try {
      await deleteAddress({ customerId, addressId }).unwrap()
      toast.success('Address removed')
    } catch {
      toast.error('Failed to remove address')
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
                <Checkbox
                  id="default-address"
                  checked={form.isDefault}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, isDefault: checked === true }))}
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
            {editingId === addr.id ? (
              <div className="space-y-2">
                <Input
                  value={editForm.label}
                  onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Label (e.g. Home)"
                />
                <Input
                  value={editForm.addressLine}
                  onChange={(e) => setEditForm((f) => ({ ...f, addressLine: e.target.value }))}
                  placeholder="Address line"
                />
                <Input
                  value={editForm.district}
                  onChange={(e) => setEditForm((f) => ({ ...f, district: e.target.value }))}
                  placeholder="District"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEditSave(addr.id)} disabled={updatingAddress}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{addr.label}</span>
                    {addr.isDefault && <Badge variant="secondary">Default</Badge>}
                  </div>
                  <p className="text-muted-foreground mt-1">{addr.addressLine}</p>
                  {addr.district && <p className="text-muted-foreground/60">{addr.district}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-auto py-1"
                    onClick={() => handleEditOpen(addr)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-auto py-1 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(addr.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {addresses.length === 0 && (
          <p className="text-muted-foreground text-sm">No addresses saved</p>
        )}
      </div>
    </div>
  )
}
