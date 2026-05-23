import type { Request, Response, NextFunction } from 'express'
import { prismaAdmin } from '../../prisma/client'

export async function demoGuard(req: Request, res: Response, next: NextFunction) {
  const mutationMethods = ['POST', 'PATCH', 'PUT', 'DELETE']
  if (!mutationMethods.includes(req.method)) return next()

  const user = req.user as { businessId?: string } | undefined
  const businessId = user?.businessId
  if (!businessId) return next()

  const business = await prismaAdmin.business.findUnique({
    where: { id: businessId },
    select: { isDemo: true },
  })

  if (business?.isDemo) {
    return res.status(403).json({
      error: 'Write operations are disabled for demo accounts. Data resets nightly at 18:00 UTC.',
      code: 'DEMO_READONLY',
    })
  }

  next()
}
