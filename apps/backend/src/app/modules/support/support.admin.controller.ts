import { Request, Response } from 'express'
import httpStatus from 'http-status'
import type { TicketStatus } from '@prisma/client'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import ApiError from '../../../errors/ApiError'
import { SupportAdminService } from './support.admin.service'

const isDemoAdmin = (req: Request) => Boolean((req.user as { isDemo?: boolean }).isDemo)

const list = catchAsync(async (req: Request, res: Response) => {
  const data = await SupportAdminService.list({
    status: req.query.status as TicketStatus | undefined,
    demoOnly: isDemoAdmin(req),
  })
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Tickets retrieved', data })
})

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await SupportAdminService.getById(req.params.id as string, isDemoAdmin(req))
  if (!data) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found')
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Ticket retrieved', data })
})

const addMessage = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req.user as { id: string }).id
  if (isDemoAdmin(req) && !(await SupportAdminService.getById(req.params.id as string, true))) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found')
  }
  const data = await SupportAdminService.reply(req.params.id as string, adminId, req.body.body)
  if (!data) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found')
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: 'Reply sent', data })
})

const setStatus = catchAsync(async (req: Request, res: Response) => {
  const data = await SupportAdminService.setStatus(
    req.params.id as string,
    req.body.status as TicketStatus,
    isDemoAdmin(req),
  )
  if (!data) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found')
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Ticket updated', data })
})

export const SupportAdminController = { list, getById, addMessage, setStatus }
