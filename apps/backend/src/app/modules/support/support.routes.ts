import { Router } from 'express'
import { z } from 'zod'
import { requireSeller } from '../../middlewares/auth'
import { prismaAdmin, prismaWithScope } from '../../../prisma/client'
import { sseManager } from '../../../shared/sse/manager'

const router = Router()

function getUser(req: Express.Request) {
  return req.user as { businessId: string; id: string }
}

const CreateTicketSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  type: z.enum(['bug_report', 'feature_request', 'question']),
})

// GET /api/v1/support — list seller's own tickets
router.get('/', requireSeller, async (req, res, next) => {
  try {
    const { businessId } = getUser(req)
    const tickets = await prismaWithScope(businessId).supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    res.json(tickets)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/support — submit a new ticket
router.post('/', requireSeller, async (req, res, next) => {
  try {
    const { businessId, id: userId } = getUser(req)
    const parsed = CreateTicketSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const ticket = await prismaAdmin.supportTicket.create({
      data: {
        businessId,
        submittedBy: userId,
        ...parsed.data,
      },
    })

    res.status(201).json(ticket)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/support/:id — ticket detail with messages
router.get('/:id', requireSeller, async (req, res, next) => {
  try {
    const { businessId } = getUser(req)
    const ticket = await prismaWithScope(businessId).supportTicket.findFirst({
      where: { id: req.params.id as string },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!ticket) return res.status(404).json({ error: 'Not found' })
    res.json(ticket)
  } catch (err) {
    next(err)
  }
})

const AddMessageSchema = z.object({ body: z.string().min(1) })

// POST /api/v1/support/:id/messages — seller adds message to their ticket
router.post('/:id/messages', requireSeller, async (req, res, next) => {
  try {
    const { businessId, id: userId } = getUser(req)

    const ticket = await prismaWithScope(businessId).supportTicket.findFirst({
      where: { id: req.params.id as string },
    })
    if (!ticket) return res.status(404).json({ error: 'Not found' })

    const parsed = AddMessageSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() })

    const message = await prismaAdmin.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderType: 'seller',
        senderId: userId,
        body: parsed.data.body,
      },
    })

    // Notify any open SSE streams for this business
    sseManager.push(businessId, 'ticket_message', { ticketId: ticket.id, message })

    res.status(201).json(message)
  } catch (err) {
    next(err)
  }
})

export { router as supportRoutes }
