import httpStatus from 'http-status'
import { ZodError, ZodIssue } from 'zod'
import { IGenericErrorMessage, IGenericErrorResponse } from '../interfaces/error'

const handleZodError = (error: ZodError): IGenericErrorResponse => {
  const errorMessages: IGenericErrorMessage[] = error.issues.map((issue: ZodIssue) => ({
    path: issue.path[issue.path.length - 1],
    message: issue.message,
  }))

  return {
    statusCode: httpStatus.BAD_REQUEST,
    message: 'Validation Error',
    errorMessages,
  }
}

export default handleZodError
