import { Request, Response } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { FinancialsService } from './financials.service'

const businessIdOf = (req: Request) => (req.user as { businessId: string }).businessId

const getDashboard = catchAsync(async (req: Request, res: Response) => {
  const data = await FinancialsService.getTodaySnapshot(businessIdOf(req))
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard snapshot retrieved',
    data,
  })
})

const getProfitLoss = catchAsync(async (req: Request, res: Response) => {
  const data = await FinancialsService.getProfitLoss(
    businessIdOf(req),
    new Date(req.query.from as string),
    new Date(req.query.to as string),
  )
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profit and loss retrieved',
    data,
  })
})

export const FinancialsController = {
  getDashboard,
  getProfitLoss,
}
