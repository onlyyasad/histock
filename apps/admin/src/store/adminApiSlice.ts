import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from './axiosBaseQuery'

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface AdminMe {
  id: string
  name: string
  email: string
  role: string
  isDemo?: boolean
}

export interface SubscriptionPlan {
  id: string
  name: string
  priceMonthly: string
  priceYearly: string
  maxUsers: number | null
  maxOrdersPerMonth: number | null
  maxProducts: number | null
  maxSkus: number | null
  aiGenerationsPerDay: number
  isActive: boolean
  displayOrder: number
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

export interface AdminBusinessDetail extends AdminBusiness {
  users: Array<{ id: string; name: string; email: string; role: string }>
}

export interface SubscriptionPayment {
  id: string
  businessId: string
  planId: string
  amountPaid: string
  paymentMethod: string
  paymentRef: string | null
  periodStart: string
  periodEnd: string
  confirmedBy: string
  confirmedAt: string
  notes: string | null
  createdAt: string
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

export interface ContactInquiryMessage {
  id: string
  inquiryId: string
  fromAdmin: boolean
  content: string
  createdAt: string
}

export interface ContactInquiry {
  id: string
  businessId: string | null
  name: string
  email: string
  phone: string | null
  message: string
  status: 'new' | 'in_progress' | 'resolved'
  createdAt: string
  updatedAt: string
  messages: ContactInquiryMessage[]
}

// ── API Slice ────────────────────────────────────────────────────────────────

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Business', 'AuditLog', 'Inquiry', 'SubscriptionPlan', 'Payment', 'Me'],
  endpoints: (builder) => ({

    // Auth
    adminLogin: builder.mutation<{ ok: boolean }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    adminLogout: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Me'],
    }),
    getMe: builder.query<AdminMe, void>({
      query: () => '/admin/me',
      providesTags: ['Me'],
    }),

    // Businesses
    getBusinesses: builder.query<AdminBusiness[], { search?: string; planId?: string; page?: number }>({
      query: (params) => ({ url: '/admin/businesses', params }),
      providesTags: ['Business'],
    }),
    getBusiness: builder.query<AdminBusinessDetail, string>({
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
      invalidatesTags: (_r, _e, { businessId }) => [{ type: 'Business', id: businessId }, 'Business'],
    }),
    toggleDemo: builder.mutation<unknown, { businessId: string; isDemo: boolean }>({
      query: ({ businessId, isDemo }) => ({
        url: `/admin/businesses/${businessId}/is-demo`,
        method: 'PATCH',
        body: { isDemo },
      }),
      invalidatesTags: ['Business'],
    }),

    // Payments
    getBusinessPayments: builder.query<SubscriptionPayment[], string>({
      query: (businessId) => `/admin/businesses/${businessId}/payments`,
      providesTags: (_r, _e, businessId) => [{ type: 'Payment', id: businessId }],
    }),
    recordPayment: builder.mutation<
      SubscriptionPayment,
      {
        businessId: string
        planId: string
        amountPaid: number
        paymentMethod: string
        paymentRef?: string
        periodStart: string
        periodEnd: string
        notes?: string
      }
    >({
      query: ({ businessId, ...body }) => ({
        url: `/admin/businesses/${businessId}/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { businessId }) => [
        { type: 'Payment', id: businessId },
        { type: 'Business', id: businessId },
        'Business',
      ],
    }),

    // Subscription plans
    getSubscriptionPlans: builder.query<SubscriptionPlan[], void>({
      query: () => '/admin/subscription-plans',
      providesTags: ['SubscriptionPlan'],
    }),
    updateSubscriptionPlan: builder.mutation<
      SubscriptionPlan,
      {
        id: string
        priceMonthly?: number
        maxUsers?: number | null
        maxOrdersPerMonth?: number | null
        maxProducts?: number | null
        maxSkus?: number | null
        isActive?: boolean
        displayOrder?: number
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/subscription-plans/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['SubscriptionPlan'],
    }),

    // Audit log
    getAuditLog: builder.query<AdminAuditLog[], { businessId?: string; page?: number }>({
      query: (params) => ({ url: '/admin/audit-log', params }),
      providesTags: ['AuditLog'],
    }),

    // Inquiries
    getInquiries: builder.query<ContactInquiry[], { status?: string }>({
      query: (params) => ({ url: '/admin/inquiries', params }),
      providesTags: ['Inquiry'],
    }),
    getInquiry: builder.query<ContactInquiry, string>({
      query: (id) => `/admin/inquiries/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Inquiry', id }],
    }),
    updateInquiry: builder.mutation<
      ContactInquiry,
      { id: string; action: 'reply' | 'resolve'; content?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/inquiries/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Inquiry', id }, 'Inquiry'],
    }),

    // Impersonation
    startImpersonation: builder.mutation<{ token: string; expiresAt: string }, string>({
      query: (businessId) => ({
        url: `/admin/impersonate/${businessId}`,
        method: 'POST',
      }),
    }),
  }),
})

export const {
  useAdminLoginMutation,
  useAdminLogoutMutation,
  useGetMeQuery,
  useGetBusinessesQuery,
  useGetBusinessQuery,
  useUpdateSubscriptionMutation,
  useToggleDemoMutation,
  useGetBusinessPaymentsQuery,
  useRecordPaymentMutation,
  useGetSubscriptionPlansQuery,
  useUpdateSubscriptionPlanMutation,
  useGetAuditLogQuery,
  useGetInquiriesQuery,
  useGetInquiryQuery,
  useUpdateInquiryMutation,
  useStartImpersonationMutation,
} = adminApi
