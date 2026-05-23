import { ProductDetailPage } from '@/features/products/ProductDetailPage'

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetailPage productId={params.id} />
}
