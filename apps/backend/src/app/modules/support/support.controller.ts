import { Request, Response } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import ApiError from '../../../errors/ApiError'
import { prismaWithScope } from '../../../prisma/client'
import { SupportService } from './support.service'

const scoped = (req: Request) => prismaWithScope((req.user as { businessId: string }).businessId)
const businessIdOf = (req: Request) => (req.user as { businessId: string }).businessId
const userIdOf = (req: Request) => (req.user as { id: string }).id

const list = catchAsync(async (req: Request, res: Response) => {
  const data = await SupportService.list(scoped(req))
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tickets retrieved',
    data,
  })
})

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await SupportService.create(scoped(req), businessIdOf(req), userIdOf(req), req.body)
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Ticket created',
    data,
  })
})

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await SupportService.getById(scoped(req), req.params.id as string)
  if (!data) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found')
  }
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Ticket retrieved',
    data,
  })
})

const addMessage = catchAsync(async (req: Request, res: Response) => {
  const data = await SupportService.addMessage(
    scoped(req),
    businessIdOf(req),
    userIdOf(req),
    req.params.id as string,
    req.body.body,
  )
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Message added',
    data,
  })
})

export const SupportController = {
  list,
  create,
  getById,
  addMessage,
}
