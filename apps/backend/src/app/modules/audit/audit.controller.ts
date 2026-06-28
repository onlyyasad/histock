import { Request, Response } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { AuditService } from './audit.service'

const list = catchAsync(async (req: Request, res: Response) => {
  const { businessId, page } = req.query
  const data = await AuditService.list(
    businessId as string | undefined,
    page ? Number(page) : 1,
  )
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Audit log retrieved', data })
})

export const AuditController = { list }
