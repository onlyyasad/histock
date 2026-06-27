type ApiErrorShape = {
  status?: number
  data?: { message?: string; error?: string; code?: string } | string
}

export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const e = err as ApiErrorShape
  if (typeof e?.data === 'string') return e.data || fallback
  return e?.data?.message ?? e?.data?.error ?? fallback
}

export function getErrorCode(err: unknown): string | undefined {
  const e = err as ApiErrorShape
  if (typeof e?.data === 'string') return undefined
  return e?.data?.code
}
