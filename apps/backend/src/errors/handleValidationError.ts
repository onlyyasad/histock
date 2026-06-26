import httpStatus from 'http-status'
import { Prisma } from '@prisma/client'
import { IGenericErrorMessage, IGenericErrorResponse } from '../interfaces/error'

const handleValidationError = (
  error: Prisma.PrismaClientValidationError,
): IGenericErrorResponse => {
  const errorMessages: IGenericErrorMessage[] = [{ path: '', message: error.message }]

  return {
    statusCode: httpStatus.BAD_REQUEST,
    message: 'Validation Error',
    errorMessages,
  }
}

export default handleValidationError
