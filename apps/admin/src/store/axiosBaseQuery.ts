import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import type { AxiosRequestConfig, AxiosError } from 'axios'
import { axiosInstance } from '@/lib/axiosInstance'

type Envelope = { success: boolean; message: string; data: unknown }

const isEnvelope = (payload: unknown): payload is Envelope =>
  typeof payload === 'object' &&
  payload !== null &&
  'success' in payload &&
  'data' in payload &&
  typeof (payload as { success: unknown }).success === 'boolean'

export type AxiosBaseQueryArgs =
  | string
  | {
      url: string
      method?: AxiosRequestConfig['method']
      body?: unknown
      params?: unknown
      headers?: Record<string, string>
    }

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
