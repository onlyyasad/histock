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
      return { data: result.data }
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
