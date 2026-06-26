import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import ApiError from '../../../errors/ApiError'
import { prismaWithScope } from '../../../prisma/client'
import { CustomersService } from './customers.service'

// Business-scoped client + businessId from the authenticated session.
const scoped = (req: Request) => prismaWithScope((req.user as { businessId: string }).businessId)
const businessIdOf = (req: Request) => (req.user as { businessId: string }).businessId

const list = catchAsync(async (req: Request, res: Response) => {
  const data = await CustomersService.list(scoped(req), {
    search: req.query.search as string | undefined,
  })
  sendResponse(res, { statusCode: 200, success: true, message: 'Customers retrieved', data })
})

const lookupByPhone = catchAsync(async (req: Request, res: Response) => {
  const data = await CustomersService.lookupByPhone(scoped(req), req.query.phone as string)
  sendResponse(res, { statusCode: 200, success: true, message: 'Customer lookup result', data: data ?? null })
})

const getById = catchAsync(async (req: Request, res: Response) => {
  const data = await CustomersService.getById(scoped(req), req.params.id as string)
  if (!data) {
    throw new ApiError(404, 'Customer not found')
  }
  sendResponse(res, { statusCode: 200, success: true, message: 'Customer retrieved', data })
})

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await CustomersService.create(scoped(req), businessIdOf(req), req.body)
  sendResponse(res, { statusCode: 201, success: true, message: 'Customer created', data })
})

const update = catchAsync(async (req: Request, res: Response) => {
  const data = await CustomersService.update(scoped(req), req.params.id as string, req.body)
  sendResponse(res, { statusCode: 200, success: true, message: 'Customer updated', data })
})

const remove = catchAsync(async (req: Request, res: Response) => {
  await CustomersService.softDelete(scoped(req), req.params.id as string)
  sendResponse(res, { statusCode: 200, success: true, message: 'Customer deleted', data: null })
})

const addAddress = catchAsync(async (req: Request, res: Response) => {
  const data = await CustomersService.addAddress(
    scoped(req),
    businessIdOf(req),
    req.params.id as string,
    req.body,
  )
  sendResponse(res, { statusCode: 201, success: true, message: 'Address added', data })
})

const updateAddress = catchAsync(async (req: Request, res: Response) => {
  const data = await CustomersService.updateAddress(
    scoped(req),
    businessIdOf(req),
    req.params.id as string,
    req.params.addressId as string,
    req.body,
  )
  sendResponse(res, { statusCode: 200, success: true, message: 'Address updated', data })
})

const flag = catchAsync(async (req: Request, res: Response) => {
  const data = await CustomersService.flag(scoped(req), req.params.id as string, req.body.reason)
  sendResponse(res, { statusCode: 200, success: true, message: 'Customer flagged', data })
})

const unflag = catchAsync(async (req: Request, res: Response) => {
  const data = await CustomersService.unflag(scoped(req), req.params.id as string)
  sendResponse(res, { statusCode: 200, success: true, message: 'Customer unflagged', data })
})

export const CustomersController = {
  list,
  lookupByPhone,
  getById,
  create,
  update,
  remove,
  addAddress,
  updateAddress,
  flag,
  unflag,
}
