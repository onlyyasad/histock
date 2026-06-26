import { Prisma } from '@prisma/client'

// Columns returned by the ticket list endpoint.
export const ticketListSelect = {
  id: true,
  title: true,
  type: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SupportTicketSelect

// SSE event name pushed when a ticket gains a message.
export const TICKET_MESSAGE_EVENT = 'ticket_message'

// Sender type recorded for seller-authored messages.
export const SENDER_TYPE_SELLER = 'seller'
