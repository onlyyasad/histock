import { Request, Response } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { prismaWithScope } from '../../../prisma/client'
import { SchedulesService } from './schedules.service'

const scoped = (req: Request) => prismaWithScope((req.user as { businessId: string }).businessId)
const businessIdOf = (req: Request) => (req.user as { businessId: string }).businessId

const list = catchAsync(async (req: Request, res: Response) => {
  const data = await SchedulesService.list(scoped(req), req.query.orderId as string | undefined)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Schedules retrieved',
    data,
  })
})

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await SchedulesService.create(scoped(req), businessIdOf(req), req.body)
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Schedule created',
    data,
  })
})

const markDone = catchAsync(async (req: Request, res: Response) => {
  const data = await SchedulesService.markDone(scoped(req), req.params.id as string)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Schedule marked done',
    data,
  })
})

const remove = catchAsync(async (req: Request, res: Response) => {
  await SchedulesService.remove(scoped(req), req.params.id as string)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Schedule deleted',
    data: null,
  })
})

export const SchedulesController = {
  list,
  create,
  markDone,
  remove,
}
