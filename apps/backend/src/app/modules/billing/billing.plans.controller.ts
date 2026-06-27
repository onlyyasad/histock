import { Request, Response } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { BillingPlansService } from './billing.plans.service'

const list = catchAsync(async (_req: Request, res: Response) => {
  const data = await BillingPlansService.list()
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Plans retrieved', data })
})

const update = catchAsync(async (req: Request, res: Response) => {
  const data = await BillingPlansService.update(req.params.id as string, req.body)
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Plan updated', data })
})

export const BillingPlansController = { list, update }
