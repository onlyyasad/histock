import { CustomerDetailPage } from '@/features/customers/components/CustomerDetailPage'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CustomerDetailPage customerId={id} />
}
