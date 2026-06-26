import { Request, Response } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { CouriersService } from './couriers.service'

const list = catchAsync(async (_req: Request, res: Response) => {
  const data = await CouriersService.listActive()
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Couriers retrieved',
    data,
  })
})

export const CouriersController = {
  list,
}
