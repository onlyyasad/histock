'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAddAddressMutation } from '../store/customersApi'
import type { CustomerAddress } from '../store/customersApi'

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
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-3 space-y-2 bg-gray-50">
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Label (e.g. Home)"
            className="w-full border rounded px-3 py-2 text-sm"
            required
          />
          <input
            value={form.addressLine}
            onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
            placeholder="Full address"
            className="w-full border rounded px-3 py-2 text-sm"
            required
          />
          <input
            value={form.district}
            onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
            placeholder="District (optional)"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Set as default
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border px-4 py-1.5 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {addresses.map((addr) => (
          <div key={addr.id} className="bg-white border rounded p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{addr.label}</span>
              {addr.isDefault && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Default
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-1">{addr.addressLine}</p>
            {addr.district && <p className="text-gray-400">{addr.district}</p>}
          </div>
        ))}
        {addresses.length === 0 && (
          <p className="text-gray-400 text-sm">No addresses saved</p>
        )}
      </div>
    </div>
  )
}
