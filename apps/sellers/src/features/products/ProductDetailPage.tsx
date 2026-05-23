'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useGetProductQuery } from './store/productsApi'
import { LogPurchaseForm } from './components/LogPurchaseForm'
import { LotHistoryTable } from './components/LotHistoryTable'

export function ProductDetailPage({ productId }: { productId: string }) {
  const { data: product, isLoading } = useGetProductQuery(productId)
  const [showLogForm, setShowLogForm] = useState(false)

  if (isLoading) return <div className="p-6 text-gray-400">Loading...</div>
  if (!product) return <div className="p-6 text-red-500">Product not found</div>

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/products" className="text-sm text-gray-400 hover:underline mb-1 block">
            ← Products
          </Link>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.sku && <p className="text-gray-400 text-sm mt-0.5">SKU: {product.sku}</p>}
          {product.description && (
            <p className="text-gray-500 text-sm mt-1">{product.description}</p>
          )}
        </div>
        <button
          onClick={() => setShowLogForm((v) => !v)}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium shrink-0"
        >
          {showLogForm ? 'Cancel' : 'Log Purchase'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">In Stock</p>
          <p
            className={`text-2xl font-bold ${
              product.currentStock <= 5 ? 'text-red-600' : ''
            }`}
          >
            {product.currentStock} units
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Selling Price</p>
          <p className="text-2xl font-bold">৳{product.price.toFixed(2)}</p>
        </div>
      </div>

      {showLogForm && (
        <LogPurchaseForm
          productId={productId}
          onSuccess={() => setShowLogForm(false)}
        />
      )}

      <div>
        <h2 className="font-semibold mb-3">Purchase History</h2>
        <LotHistoryTable entries={product.costEntries ?? []} />
      </div>
    </div>
  )
}
