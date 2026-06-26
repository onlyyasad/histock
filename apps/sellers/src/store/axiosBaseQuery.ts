import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import type { AxiosRequestConfig, AxiosError } from 'axios'
import { axiosInstance } from '@/lib/axiosInstance'

export type AxiosBaseQueryArgs =
  | string
  | {
      url: string
      method?: AxiosRequestConfig['method']
      body?: unknown
      params?: unknown
      headers?: Record<string, string>
    }

// The standard success envelope returned by every refactored seller endpoint.
type ApiEnvelope = { success: boolean; data: unknown }

const isEnvelope = (value: unknown): value is ApiEnvelope =>
  !!value && typeof value === 'object' && 'success' in value && 'data' in value

export const axiosBaseQuery = (): BaseQueryFn<
  AxiosBaseQueryArgs,
  unknown,
  { status?: number; data?: unknown }
> =>
  async (args) => {
    const { url, method = 'GET', body, params, headers } =
      typeof args === 'string' ? { url: args } : args
    try {
      const result = await axiosInstance({ url, method, data: body, params, headers })
      // Unwrap the standard envelope so endpoints keep their existing payload types.
      // Non-enveloped responses (defensive) pass through unchanged.
      const payload = result.data
      return { data: isEnvelope(payload) ? payload.data : payload }
    } catch (axiosError) {
      const err = axiosError as AxiosError
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data ?? err.message,
        },
      }
    }
  }
