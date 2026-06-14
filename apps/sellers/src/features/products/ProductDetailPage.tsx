'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useGetProductQuery, useDeleteProductMutation } from './store/productsApi'
import { LogPurchaseForm } from './components/LogPurchaseForm'
import { LotHistoryTable } from './components/LotHistoryTable'
import { SocialPostButton } from './components/SocialPostButton'
import { VariantsSection } from './components/VariantsSection'
import { ProductEditForm } from './components/ProductEditForm'
import { StockBadge } from './components/StockBadge'
import { useSetBreadcrumbEntity } from '@/components/shared/BreadcrumbEntity'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ListSkeleton } from '@/components/shared/TableSkeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtMoney } from '@/lib/utils'

export function ProductDetailPage({ productId }: { productId: string }) {
  const router = useRouter()
  const { data: product, isLoading } = useGetProductQuery(productId)
  const [showLogForm, setShowLogForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation()

  useSetBreadcrumbEntity(product?.name ?? null)

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <ListSkeleton rows={4} />
      </div>
    )
  }
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

  const descParts = [
    product.sku ? `SKU: ${product.sku}` : '',
    product.description ?? '',
  ].filter(Boolean)
  const headerDescription = descParts.join(' · ') || undefined

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <PageHeader
        title={product.name}
        description={headerDescription}
        actions={
          <>
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
              {showLogForm ? 'Cancel' : 'Log purchase'}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">In Stock</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-semibold">{product.currentStock}</p>
              <StockBadge stock={product.currentStock} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Selling Price</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1">
              ৳{fmtMoney(product.price)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Inventory Value</p>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1">
              ৳{fmtMoney(product.price * product.currentStock)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">price × stock</p>
          </CardContent>
        </Card>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-6 lg:space-y-0">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
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
            <h2 className="text-sm font-semibold mb-3">Purchase history</h2>
            {(product.costEntries ?? []).length === 0 && (
              <Alert className="mb-3 border-warning/30 bg-warning/10 text-warning">
                Log a purchase above to track cost of goods and see margin data.
              </Alert>
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
        </div>

        {/* Rail column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold text-destructive">Danger zone</p>
              <p className="text-xs text-muted-foreground">
                Deleting this product is permanent and cannot be undone from the UI.
              </p>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={() => setDeleteOpen(true)}
              >
                Delete product
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${product.name}?`}
        description="This product will be soft-deleted and removed from your inventory. Existing orders that include it are not affected."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
