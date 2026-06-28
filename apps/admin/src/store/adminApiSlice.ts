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
  adminUserId: string | null
  adminEmail: string
  action: string
  targetBusinessId: string | null
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
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

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface SupportTicketMessage {
  id: string
  ticketId: string
  senderType: 'seller' | 'admin'
  senderId: string
  body: string
  createdAt: string
}

export interface SupportTicketSummary {
  id: string
  title: string
  type: 'bug_report' | 'feature_request' | 'question'
  status: TicketStatus
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  business: { id: string; name: string; isDemo: boolean }
  _count: { messages: number }
}

export interface SupportTicketDetail extends Omit<SupportTicketSummary, '_count'> {
  description: string
  submitter: { id: string; name: string; email: string }
  messages: SupportTicketMessage[]
}

// ── API Slice ────────────────────────────────────────────────────────────────

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Business', 'AuditLog', 'Inquiry', 'SubscriptionPlan', 'Payment', 'Me', 'SupportTicket'],
  endpoints: (builder) => ({

    // Auth
    adminLogin: builder.mutation<void, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    adminLogout: builder.mutation<void, void>({
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

    // Support Tickets
    getSupportTickets: builder.query<SupportTicketSummary[], { status?: string }>({
      query: (params) => ({ url: '/admin/support-tickets', params }),
      providesTags: ['SupportTicket'],
    }),
    getSupportTicket: builder.query<SupportTicketDetail, string>({
      query: (id) => `/admin/support-tickets/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'SupportTicket', id }],
    }),
    replySupportTicket: builder.mutation<SupportTicketMessage, { id: string; body: string }>({
      query: ({ id, body }) => ({ url: `/admin/support-tickets/${id}/messages`, method: 'POST', body: { body } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'SupportTicket', id }, 'SupportTicket'],
    }),
    updateSupportTicketStatus: builder.mutation<SupportTicketSummary, { id: string; status: TicketStatus }>({
      query: ({ id, status }) => ({ url: `/admin/support-tickets/${id}`, method: 'PATCH', body: { status } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'SupportTicket', id }, 'SupportTicket'],
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
  useGetSupportTicketsQuery,
  useGetSupportTicketQuery,
  useReplySupportTicketMutation,
  useUpdateSupportTicketStatusMutation,
  useStartImpersonationMutation,
} = adminApi
