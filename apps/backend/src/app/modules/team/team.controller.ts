import { Request, Response } from 'express'
import httpStatus from 'http-status'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { prismaWithScope } from '../../../prisma/client'
import { TeamService } from './team.service'

const scoped = (req: Request) => prismaWithScope((req.user as { businessId: string }).businessId)
const businessIdOf = (req: Request) => (req.user as { businessId: string }).businessId
const userIdOf = (req: Request) => (req.user as { id: string }).id

const listMembers = catchAsync(async (req: Request, res: Response) => {
  const data = await TeamService.listMembers(scoped(req))
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Team members retrieved',
    data,
  })
})

const listInvites = catchAsync(async (req: Request, res: Response) => {
  const data = await TeamService.listInvites(scoped(req))
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Invites retrieved',
    data,
  })
})

const createInvite = catchAsync(async (req: Request, res: Response) => {
  const data = await TeamService.createInvite(scoped(req), businessIdOf(req), userIdOf(req), req.body)
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Invite created',
    data,
  })
})

const acceptInvite = catchAsync(async (req: Request, res: Response) => {
  await TeamService.acceptInvite(req.params.token as string, req.body)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Invite accepted',
    data: null,
  })
})

const removeMember = catchAsync(async (req: Request, res: Response) => {
  await TeamService.removeMember(scoped(req), userIdOf(req), req.params.userId as string)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Team member removed',
    data: null,
  })
})

const updateRole = catchAsync(async (req: Request, res: Response) => {
  const data = await TeamService.updateMemberRole(
    scoped(req),
    userIdOf(req),
    req.params.userId as string,
    req.body.role,
  )
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Member role updated',
    data,
  })
})

const getPermissions = catchAsync(async (req: Request, res: Response) => {
  const data = await TeamService.getPermissions(scoped(req))
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Permissions retrieved',
    data,
  })
})

const updatePermission = catchAsync(async (req: Request, res: Response) => {
  await TeamService.updatePermission(businessIdOf(req), req.body)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Permission updated',
    data: null,
  })
})

export const TeamController = {
  listMembers,
  listInvites,
  createInvite,
  acceptInvite,
  removeMember,
  updateRole,
  getPermissions,
  updatePermission,
}
