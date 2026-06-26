type ApiErrorOptions = {
  code?: string
  stack?: string
}

class ApiError extends Error {
  statusCode: number
  // Optional machine-readable code surfaced to clients (e.g. 'PRODUCT_CAP_REACHED').
  code?: string

  constructor(statusCode: number, message?: string, options: ApiErrorOptions = {}) {
    super(message)
    this.statusCode = statusCode
    if (options.code) {
      this.code = options.code
    }
    if (options.stack) {
      this.stack = options.stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export default ApiError
