import { SupportTicketDetailPage } from '@/features/support/SupportTicketDetailPage'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SupportTicketDetailPage ticketId={id} />
}
