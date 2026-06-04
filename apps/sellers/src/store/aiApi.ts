import { apiSlice } from './apiSlice'

export interface AiUsage {
  used: number
  limit: number
  remaining: number
}

export interface AiJobResult {
  status: 'pending' | 'done'
  text?: string
  tokenCount?: number
  fallback?: boolean
}

export const aiApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAiUsage: builder.query<AiUsage, void>({
      query: () => '/ai/usage',
      providesTags: ['AiUsage'],
    }),
    generateAi: builder.mutation<
      { jobId: string },
      { type: 'product_description' | 'social_post'; payload: Record<string, string> }
    >({
      query: (body) => ({ url: '/ai/generate', method: 'POST', body }),
      invalidatesTags: ['AiUsage'],
    }),
    getAiResult: builder.query<AiJobResult, string>({
      query: (jobId) => `/ai/result/${jobId}`,
    }),
  }),
})

export const { useGetAiUsageQuery, useGenerateAiMutation, useGetAiResultQuery } = aiApi
