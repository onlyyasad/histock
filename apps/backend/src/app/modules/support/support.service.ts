import httpStatus from 'http-status'
import { prismaAdmin } from '../../../prisma/client'
import type { ScopedPrisma } from '../../../prisma/types'
import ApiError from '../../../errors/ApiError'
import { sseManager } from '../../../shared/sse/manager'
import { ticketListSelect, TICKET_MESSAGE_EVENT, SENDER_TYPE_SELLER } from './support.constants'
import type { ICreateTicketInput } from './support.interface'

const list = (db: ScopedPrisma) =>
  db.supportTicket.findMany({ orderBy: { createdAt: 'desc' }, select: ticketListSelect })

const create = (db: ScopedPrisma, businessId: string, userId: string, input: ICreateTicketInput) =>
  prismaAdmin.supportTicket.create({
    data: { businessId, submittedBy: userId, ...input },
  })

const getById = (db: ScopedPrisma, ticketId: string) =>
  db.supportTicket.findFirst({
    where: { id: ticketId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })

const addMessage = async (
  db: ScopedPrisma,
  businessId: string,
  userId: string,
  ticketId: string,
  body: string,
) => {
  const ticket = await db.supportTicket.findFirst({ where: { id: ticketId } })
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found')
  }

  const message = await prismaAdmin.ticketMessage.create({
    data: { ticketId: ticket.id, senderType: SENDER_TYPE_SELLER, senderId: userId, body },
  })

  // Notify any open SSE streams for this business.
  sseManager.push(businessId, TICKET_MESSAGE_EVENT, { ticketId: ticket.id, message })

  return message
}

export const SupportService = {
  list,
  create,
  getById,
  addMessage,
}
