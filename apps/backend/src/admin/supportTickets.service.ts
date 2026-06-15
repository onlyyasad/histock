import type { TicketStatus } from '@prisma/client'
import { prismaAdmin } from '../prisma/client'
import { sseManager } from '../shared/sse/manager'

interface ListOpts {
  status?: TicketStatus
  /** When the admin session is demo, restrict to demo businesses only. */
  demoOnly?: boolean
}

export class SupportTicketService {
  list({ status, demoOnly }: ListOpts) {
    return prismaAdmin.supportTicket.findMany({
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
  }

  getById(id: string, demoOnly: boolean) {
    return prismaAdmin.supportTicket.findFirst({
      where: { id, ...(demoOnly ? { business: { isDemo: true } } : {}) },
      include: {
        business: { select: { id: true, name: true, isDemo: true } },
        submitter: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })
  }

  async reply(ticketId: string, adminId: string, body: string) {
    const ticket = await prismaAdmin.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, businessId: true, status: true },
    })
    if (!ticket) return null

    const message = await prismaAdmin.$transaction(async (tx) => {
      const m = await tx.ticketMessage.create({
        data: { ticketId, senderType: 'admin', senderId: adminId, body },
      })
      // First admin reply moves an open ticket into in_progress.
      if (ticket.status === 'open') {
        await tx.supportTicket.update({
          where: { id: ticketId },
          data: { status: 'in_progress' },
        })
      }
      return m
    })

    // Notify the seller's open SSE streams (same channel the seller listens on).
    sseManager.push(ticket.businessId, 'ticket_message', { ticketId, message })
    return message
  }

  async setStatus(ticketId: string, status: TicketStatus, demoOnly: boolean) {
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
}
