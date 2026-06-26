import { ZodError, ZodIssue } from 'zod'
import { IGenericErrorMessage, IGenericErrorResponse } from '../interfaces/error'

const handleZodError = (error: ZodError): IGenericErrorResponse => {
  const errorMessages: IGenericErrorMessage[] = error.issues.map((issue: ZodIssue) => ({
    path: issue.path[issue.path.length - 1],
    message: issue.message,
  }))

  return {
    statusCode: 400,
    message: 'Validation Error',
    errorMessages,
  }
}

export default handleZodError
