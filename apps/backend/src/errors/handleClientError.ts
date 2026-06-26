import httpStatus from 'http-status'
import { Prisma } from '@prisma/client'
import { IGenericErrorMessage, IGenericErrorResponse } from '../interfaces/error'

const handleClientError = (
  error: Prisma.PrismaClientKnownRequestError,
): IGenericErrorResponse => {
  let statusCode: number = httpStatus.BAD_REQUEST
  let message = error.message
  let errorMessages: IGenericErrorMessage[] = [{ path: '', message }]

  if (error.code === 'P2025') {
    statusCode = httpStatus.NOT_FOUND
    message = (error.meta?.cause as string) || 'Record not found'
    errorMessages = [{ path: '', message }]
  } else if (error.code === 'P2002') {
    statusCode = httpStatus.CONFLICT
    const target = (error.meta?.target as string[] | undefined)?.join(', ') ?? 'field'
    message = `Duplicate value for unique ${target}`
    errorMessages = [{ path: target, message }]
  } else if (error.code === 'P2003') {
    message = (error.meta?.field_name as string) || 'Foreign key constraint failed'
    errorMessages = [{ path: '', message }]
  }

  return { statusCode, message, errorMessages }
}

export default handleClientError
