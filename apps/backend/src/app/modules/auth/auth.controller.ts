import { Request, Response, NextFunction } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import ApiError from '../../../errors/ApiError'
import { passport } from './passport'
import { clearLoginAttempts } from '../../middlewares/bruteForce'
import { AuthService } from './auth.service'
import { SESSION_COOKIE_NAME } from './auth.constants'

// Promisified req.login (Passport's callback form) for use inside async handlers.
const loginSession = (req: Request, user: Express.User) =>
  new Promise<void>((resolve, reject) => req.login(user, (err) => (err ? reject(err) : resolve())))

const register = catchAsync(async (req: Request, res: Response) => {
  const { user, business } = await AuthService.registerBusiness(req.body)
  await loginSession(req, user as Express.User)
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Account created',
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: business.id,
      businessName: business.name,
    },
  })
})

// Not catchAsync — Passport uses a custom callback.
const login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    'local',
    (err: unknown, user: Record<string, unknown> | false, info: { message?: string }) => {
      if (err) return next(err)
      if (!user) return next(new ApiError(httpStatus.UNAUTHORIZED, info?.message ?? 'Invalid credentials'))

      req.login(user as Express.User, async (loginErr) => {
        if (loginErr) return next(loginErr)
        try {
          await clearLoginAttempts(req.ip ?? '', req.body.email ?? '')
          sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Logged in',
            data: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              businessId: user.businessId,
              businessName: (user.business as Record<string, unknown> | null)?.name ?? null,
            },
          })
        } catch (e) {
          next(e)
        }
      })
    },
  )(req, res, next)
}

const logout = (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err)
    req.session.destroy(() => {
      res.clearCookie(SESSION_COOKIE_NAME)
      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Logged out',
        data: null,
      })
    })
  })
}

const me = (req: Request, res: Response) => {
  const user = req.user as Record<string, unknown>
  const business = user.business as Record<string, unknown> | null
  const session = req.session as unknown as Record<string, unknown>
  const impersonation = session.impersonation as
    | { adminId?: string; expiresAt?: string }
    | undefined

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Current user',
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
      businessName: business?.name ?? null,
      isDemo: business?.isDemo ?? false,
      isImpersonated: !!impersonation,
      impersonatedBy: impersonation?.adminId ?? null,
      impersonationExpiresAt: impersonation?.expiresAt ?? null,
    },
  })
}

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.requestPasswordReset(req.body.email)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'If that email is registered, a reset link has been sent.',
    data: null,
  })
})

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body.token, req.body.password)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password updated. You can now log in.',
    data: null,
  })
})

const impersonate = catchAsync(async (req: Request, res: Response) => {
  const { owner, record } = await AuthService.consumeImpersonationToken(req.body.token)

  await loginSession(req, owner as Express.User)
  ;(req.session as unknown as Record<string, unknown>).impersonation = {
    adminId: record.adminId,
    expiresAt: record.expiresAt.toISOString(),
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Impersonation started',
    data: {
      id: owner.id,
      email: owner.email,
      name: owner.name,
      role: owner.role,
      businessId: owner.businessId,
      businessName: record.business.name,
      isImpersonated: true,
      impersonatedBy: record.adminId,
      impersonationExpiresAt: record.expiresAt.toISOString(),
    },
  })
})

const endImpersonation = (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err)
    req.session.destroy(() => {
      res.clearCookie(SESSION_COOKIE_NAME)
      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Impersonation ended',
        data: null,
      })
    })
  })
}

export const AuthController = {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  impersonate,
  endImpersonation,
}
