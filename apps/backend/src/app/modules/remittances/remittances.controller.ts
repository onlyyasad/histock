import { Request, Response } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import ApiError from '../../../errors/ApiError'
import { prismaWithScope } from '../../../prisma/client'
import { RemittancesService } from './remittances.service'

const scoped = (req: Request) => prismaWithScope((req.user as { businessId: string }).businessId)
const businessIdOf = (req: Request) => (req.user as { businessId: string }).businessId

const list = catchAsync(async (req: Request, res: Response) => {
  const data = await RemittancesService.list(scoped(req))
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Remittances retrieved',
    data,
  })
})

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await RemittancesService.getById(scoped(req), req.params.id as string)
  if (!data) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Remittance not found')
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Remittance retrieved',
    data,
  })
})

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await RemittancesService.create(scoped(req), businessIdOf(req), req.body)
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Remittance created',
    data,
  })
})

const importBatch = catchAsync(async (req: Request, res: Response) => {
  const data = await RemittancesService.importBatch(businessIdOf(req), req.body)
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Remittance imported',
    data,
  })
})

export const RemittancesController = {
  list,
  getById,
  create,
  importBatch,
}
