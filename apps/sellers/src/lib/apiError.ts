// The error envelope the backend returns (with legacy fields tolerated).
type ApiErrorBody = {
  message?: string
  error?: string
  code?: string
  errorMessages?: { path: string | number; message: string }[]
}

const DEFAULT_ERROR_MESSAGE = 'Something went wrong'

// RTK Query errors from axiosBaseQuery look like { status?: number; data?: unknown }.
const getErrorBody = (err: unknown): ApiErrorBody | undefined => {
  if (!err || typeof err !== 'object' || !('data' in err)) {
    return undefined
  }
  const data = (err as { data?: unknown }).data
  if (typeof data === 'string') {
    return { message: data }
  }
  if (data && typeof data === 'object') {
    return data as ApiErrorBody
  }
  return undefined
}

export const getErrorMessage = (err: unknown, fallback = DEFAULT_ERROR_MESSAGE): string => {
  const body = getErrorBody(err)
  return body?.message ?? body?.error ?? fallback
}

export const getErrorCode = (err: unknown): string | undefined => {
  return getErrorBody(err)?.code
}
