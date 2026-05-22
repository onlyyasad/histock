'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useGetProductsQuery } from './store/productsApi'

export function ProductsListPage() {
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const { data: products, isLoading } = useGetProductsQuery({
    search: search || undefined,
    lowStock: lowStockOnly || undefined,
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium"
        >
          + New Product
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1 max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Low stock only
        </label>
      </div>

      {isLoading && <p className="text-gray-400">Loading...</p>}

      <table className="w-full text-sm">
        <thead className="text-left text-gray-500 border-b">
          <tr>
            <th className="pb-2">Name</th>
            <th className="pb-2">SKU</th>
            <th className="pb-2">Price</th>
            <th className="pb-2 text-right">In Stock</th>
          </tr>
        </thead>
        <tbody>
          {products?.map((p) => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="py-3">
                <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                  {p.name}
                </Link>
              </td>
              <td className="py-3 text-gray-400">{p.sku ?? '—'}</td>
              <td className="py-3 tabular-nums">৳{p.price.toFixed(2)}</td>
              <td
                className={`py-3 text-right tabular-nums ${
                  p.currentStock <= 5 ? 'text-red-600 font-medium' : ''
                }`}
              >
                {p.currentStock}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
