import { Request, Response } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { BillingPaymentService } from './billing.payment.service'

const list = catchAsync(async (req: Request, res: Response) => {
  const data = await BillingPaymentService.list(req.params.id as string)
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Payments retrieved', data })
})

const record = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req.user as { id: string }).id
  const data = await BillingPaymentService.record(req.params.id as string, adminId, req.body)
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: 'Payment recorded', data })
})

export const BillingPaymentController = { list, record }
