'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useGetProductQuery, useDeleteProductMutation } from './store/productsApi'
import { LogPurchaseForm } from './components/LogPurchaseForm'
import { LotHistoryTable } from './components/LotHistoryTable'
import { SocialPostButton } from './components/SocialPostButton'
import { VariantsSection } from './components/VariantsSection'
import { ProductEditForm } from './components/ProductEditForm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, fmtMoney } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function ProductDetailPage({ productId }: { productId: string }) {
  const router = useRouter()
  const { data: product, isLoading } = useGetProductQuery(productId)
  const [showLogForm, setShowLogForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation()

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>
  if (!product) return <div className="p-6 text-destructive">Product not found</div>

  const handleDelete = async () => {
    try {
      await deleteProduct(productId).unwrap()
      toast.success('Product deleted')
      router.push('/products')
    } catch {
      toast.error('Failed to delete product')
    }
  }

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
        <div className="flex items-center gap-2 shrink-0">
          <SocialPostButton productName={product.name} price={product.price} />
          <Button
            variant={showEditForm ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => setShowEditForm((v) => !v)}
          >
            {showEditForm ? 'Cancel edit' : 'Edit'}
          </Button>
          <Button
            variant={showLogForm ? 'outline' : 'default'}
            size="sm"
            onClick={() => setShowLogForm((v) => !v)}
          >
            {showLogForm ? 'Cancel' : 'Log Purchase'}
          </Button>
        </div>
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
            <p className="text-2xl font-bold">৳{fmtMoney(product.price)}</p>
          </CardContent>
        </Card>
      </div>

      {showEditForm && (
        <ProductEditForm product={product} onClose={() => setShowEditForm(false)} />
      )}

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

      <VariantsSection
        productId={productId}
        variants={(product.variants ?? []).map((v) => ({
          id: v.id,
          productId,
          name: v.name,
          sku: null,
          price: v.price,
          currentStock: v.currentStock,
          isActive: true,
        }))}
      />

      <div className="pt-4 border-t">
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" size="sm" disabled={deleting} />}>
            Delete product
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This product will be soft-deleted and removed from your inventory.
                Existing orders that include it are not affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
