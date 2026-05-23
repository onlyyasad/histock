import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL as string,
  credentials: 'include',
})

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error?.status === 401) {
    window.location.href = '/login'
  }
  return result
}

export interface AdminBusiness {
  id: string
  name: string
  slug: string
  isDemo: boolean
  subscription: {
    planId: string
    status: string
    currentPeriodEnd: string | null
    plan: { id: string; name: string }
  }
  _count: { users: number; orders: number }
}

export interface AdminAuditLog {
  id: string
  adminId: string
  action: string
  method: string
  path: string
  targetBusinessId: string | null
  requestBody: Record<string, unknown> | null
  createdAt: string
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery,
  tagTypes: ['Business', 'AuditLog'],
  endpoints: (builder) => ({
    adminLogin: builder.mutation<{ ok: boolean }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),

    getMe: builder.query<{ id: string; name: string; email: string; role: string }, void>({
      query: () => '/admin/me',
    }),

    getBusinesses: builder.query<AdminBusiness[], { search?: string; planId?: string }>({
      query: (params) => ({ url: '/admin/businesses', params }),
      providesTags: ['Business'],
    }),

    getBusiness: builder.query<AdminBusiness & { users: Array<{ id: string; name: string; email: string; role: string }> }, string>({
      query: (id) => `/admin/businesses/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Business', id }],
    }),

    updateSubscription: builder.mutation<
      unknown,
      { businessId: string; planId?: string; status?: string; currentPeriodEnd?: string; adminNotes?: string }
    >({
      query: ({ businessId, ...body }) => ({
        url: `/admin/businesses/${businessId}/subscription`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Business'],
    }),

    toggleDemo: builder.mutation<unknown, { businessId: string; isDemo: boolean }>({
      query: ({ businessId, isDemo }) => ({
        url: `/admin/businesses/${businessId}/is-demo`,
        method: 'PATCH',
        body: { isDemo },
      }),
      invalidatesTags: ['Business'],
    }),

    getAuditLog: builder.query<AdminAuditLog[], { businessId?: string }>({
      query: (params) => ({ url: '/admin/audit-log', params }),
      providesTags: ['AuditLog'],
    }),

    getInquiries: builder.query<
      Array<{ id: string; status: string; businessName: string; email: string; message: string; createdAt: string }>,
      { status?: string }
    >({
      query: (params) => ({ url: '/admin/inquiries', params }),
    }),
  }),
})

export const {
  useAdminLoginMutation,
  useGetMeQuery,
  useGetBusinessesQuery,
  useGetBusinessQuery,
  useUpdateSubscriptionMutation,
  useToggleDemoMutation,
  useGetAuditLogQuery,
  useGetInquiriesQuery,
} = adminApi
