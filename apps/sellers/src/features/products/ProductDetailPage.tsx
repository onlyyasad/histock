'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useGetProductQuery } from './store/productsApi'
import { LogPurchaseForm } from './components/LogPurchaseForm'
import { LotHistoryTable } from './components/LotHistoryTable'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ProductDetailPage({ productId }: { productId: string }) {
  const { data: product, isLoading } = useGetProductQuery(productId)
  const [showLogForm, setShowLogForm] = useState(false)

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>
  if (!product) return <div className="p-6 text-destructive">Product not found</div>

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/products" className="text-sm text-muted-foreground hover:underline mb-1 block">
            ← Products
          </Link>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.sku && <p className="text-muted-foreground text-sm mt-0.5">SKU: {product.sku}</p>}
          {product.description && (
            <p className="text-muted-foreground text-sm mt-1">{product.description}</p>
          )}
        </div>
        <Button
          variant={showLogForm ? 'outline' : 'default'}
          size="sm"
          onClick={() => setShowLogForm((v) => !v)}
          className="shrink-0"
        >
          {showLogForm ? 'Cancel' : 'Log Purchase'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">In Stock</p>
            <p
              className={cn(
                'text-2xl font-bold',
                product.currentStock <= 5 && 'text-destructive',
              )}
            >
              {product.currentStock} units
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Selling Price</p>
            <p className="text-2xl font-bold">৳{product.price.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {showLogForm && (
        <LogPurchaseForm
          productId={productId}
          onSuccess={() => setShowLogForm(false)}
        />
      )}

      <div>
        <h2 className="font-semibold mb-3">Purchase History</h2>
        {(product.costEntries ?? []).length === 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-3">
            Log a purchase above to track cost of goods and see margin data.
          </div>
        )}
        <LotHistoryTable entries={product.costEntries ?? []} />
      </div>
    </div>
  )
}
