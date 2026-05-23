import { RequestHandler } from 'express'

// Architecture: there is NO generic `requireAuth` middleware — by design.
// Every route must explicitly declare which role it accepts to prevent
// seller/admin cross-contamination.

export const requireSeller: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated?.()) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const user = req.user as Record<string, unknown>
  if (!user?.businessId) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  // Kick sessions that were issued before a password reset.
  // issuedAt is stored in the serialized passport session (Unix seconds).
  if (user.passwordChangedAt) {
    const serialized = (req.session as unknown as { passport?: { user?: { issuedAt?: number } } }).passport?.user
    if (serialized?.issuedAt) {
      const changedAtMs = new Date(user.passwordChangedAt as string).getTime()
      const issuedAtMs = serialized.issuedAt * 1000
      if (changedAtMs > issuedAtMs) {
        req.session.destroy(() => {})
        return res.status(401).json({ error: 'Session expired. Please log in again.' })
      }
    }
  }
  // Expire impersonation sessions that have passed their time limit
  const session = req.session as unknown as Record<string, unknown>
  const impersonation = session.impersonation as { expiresAt?: string } | undefined
  if (impersonation?.expiresAt && new Date(impersonation.expiresAt) < new Date()) {
    req.session.destroy(() => {})
    return res.status(401).json({ error: 'Impersonation session expired' })
  }
  next()
}

export const requireRole = (...roles: string[]): RequestHandler =>
  (req, res, next) => {
    if (!req.isAuthenticated?.()) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const user = req.user as Record<string, unknown>
    if (!roles.includes(user.role as string)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated?.()) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const user = req.user as Record<string, unknown>
  if (user?.role !== 'platform_admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}
