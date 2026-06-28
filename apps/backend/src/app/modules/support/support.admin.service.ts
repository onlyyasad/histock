import type { TicketStatus } from '@prisma/client'
import { prismaAdmin } from '../../../prisma/client'
import { sseManager } from '../../../shared/sse/manager'

type ListOpts = { status?: TicketStatus; demoOnly?: boolean }

const list = ({ status, demoOnly }: ListOpts) =>
  prismaAdmin.supportTicket.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(demoOnly ? { business: { isDemo: true } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      priority: true,
      createdAt: true,
      updatedAt: true,
      business: { select: { id: true, name: true, isDemo: true } },
      _count: { select: { messages: true } },
    },
  })

const getById = (id: string, demoOnly: boolean) =>
  prismaAdmin.supportTicket.findFirst({
    where: { id, ...(demoOnly ? { business: { isDemo: true } } : {}) },
    include: {
      business: { select: { id: true, name: true, isDemo: true } },
      submitter: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

const reply = async (ticketId: string, adminId: string, body: string) => {
  const ticket = await prismaAdmin.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, businessId: true, status: true },
  })
  if (!ticket) return null

  const message = await prismaAdmin.$transaction(async (tx) => {
    const m = await tx.ticketMessage.create({
      data: { ticketId, senderType: 'admin', senderId: adminId, body },
    })
    if (ticket.status === 'open') {
      await tx.supportTicket.update({ where: { id: ticketId }, data: { status: 'in_progress' } })
    }
    return m
  })

  sseManager.push(ticket.businessId, 'ticket_message', { ticketId, message })
  return message
}

const setStatus = async (ticketId: string, status: TicketStatus, demoOnly: boolean) => {
  const ticket = await prismaAdmin.supportTicket.findFirst({
    where: { id: ticketId, ...(demoOnly ? { business: { isDemo: true } } : {}) },
    select: { id: true, businessId: true },
  })
  if (!ticket) return null

  const updated = await prismaAdmin.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      ...(status === 'resolved' ? { resolvedAt: new Date() } : {}),
      ...(status === 'closed' ? { closedAt: new Date() } : {}),
    },
  })
  sseManager.push(ticket.businessId, 'ticket_status', { ticketId, status })
  return updated
}

export const SupportAdminService = { list, getById, reply, setStatus }
