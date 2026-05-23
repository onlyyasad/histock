import type { RequestHandler, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prismaAdmin } from '../prisma/client'

const LOGGED_METHODS = ['POST', 'PATCH', 'DELETE']

export const auditMiddleware: RequestHandler = async (req, res, next) => {
  if (!LOGGED_METHODS.includes(req.method)) return next()

  const user = req.user as { id?: string; userEmail?: string } | undefined
  const adminUserId = user?.id ?? null
  const adminEmail = user?.userEmail ?? 'unknown'
  const targetBusinessId = (req.params as Record<string, string>).id ?? null

  const originalJson = (res as Response).json.bind(res)
  let responseBody: unknown

  ;(res as Response).json = (body: unknown) => {
    responseBody = body
    return originalJson(body)
  }

  res.on('finish', () => {
    if (res.statusCode >= 400) return
    prismaAdmin.adminAuditLog
      .create({
        data: {
          adminUserId,
          adminEmail,
          action: `${req.method} ${req.path}`,
          targetBusinessId,
          oldValue: Prisma.JsonNull,
          newValue:
            responseBody && typeof responseBody === 'object'
              ? (responseBody as Prisma.InputJsonValue)
              : Prisma.JsonNull,
        },
      })
      .catch(() => {})
  })

  next()
}
