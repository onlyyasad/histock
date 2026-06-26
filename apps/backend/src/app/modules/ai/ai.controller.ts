import { Request, Response } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { AiService } from './ai.service'

const businessIdOf = (req: Request) => (req.user as { businessId: string }).businessId

const getUsage = catchAsync(async (req: Request, res: Response) => {
  const data = await AiService.getUsageSummary(businessIdOf(req))
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'AI usage retrieved',
    data,
  })
})

const generate = catchAsync(async (req: Request, res: Response) => {
  const data = await AiService.generate(businessIdOf(req), req.body)
  sendResponse(res, {
    statusCode: httpStatus.ACCEPTED,
    success: true,
    message: 'AI generation queued',
    data,
  })
})

const getResult = catchAsync(async (req: Request, res: Response) => {
  const data = await AiService.getResult(req.params.jobId as string)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'AI result',
    data,
  })
})

export const AiController = {
  getUsage,
  generate,
  getResult,
}
