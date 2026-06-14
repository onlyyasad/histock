import { RemittanceDetailPage } from '@/features/analytics/RemittanceDetailPage'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RemittanceDetailPage remittanceId={id} />
}
