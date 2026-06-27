import { Request, Response } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import ApiError from '../../../errors/ApiError'
import { BusinessesService } from './businesses.service'
import { BillingSubscriptionService } from '../billing/billing.subscription.service'

const list = catchAsync(async (req: Request, res: Response) => {
  const { search, planId, page } = req.query
  const data = await BusinessesService.list({
    search: search as string | undefined,
    planId: planId as string | undefined,
    page: page ? Number(page) : 1,
  })
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Businesses retrieved', data })
})

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await BusinessesService.getById(req.params.id as string)
  if (!data) throw new ApiError(httpStatus.NOT_FOUND, 'Business not found')
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Business retrieved', data })
})

const updateSubscription = catchAsync(async (req: Request, res: Response) => {
  const data = await BillingSubscriptionService.update(req.params.id as string, req.body)
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Subscription updated', data })
})

const setIsDemo = catchAsync(async (req: Request, res: Response) => {
  const data = await BusinessesService.setIsDemo(req.params.id as string, req.body.isDemo)
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Demo flag updated', data })
})

const reseedDemo = catchAsync(async (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not available in production')
  }
  const { demoSeedQueue } = await import('../../../jobs/demoSeeder')
  await demoSeedQueue.add('manual-reseed', {}, { jobId: `manual-${Date.now()}` })
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Reseed job queued', data: null })
})

export const BusinessesController = { list, getById, updateSubscription, setIsDemo, reseedDemo }
