import { SupportTicketDetailPage } from '@/features/support/SupportTicketDetailPage'

export default function Page({ params }: { params: { id: string } }) {
  return <SupportTicketDetailPage ticketId={params.id} />
}
