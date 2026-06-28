import { apiSlice } from '@/core/store/apiSlice'

export interface TicketSummary {
  id: string
  title: string
  type: 'bug_report' | 'feature_request' | 'question'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

export interface TicketMessage {
  id: string
  ticketId: string
  senderType: 'seller' | 'admin'
  senderId: string
  body: string
  createdAt: string
}

export interface TicketDetail extends TicketSummary {
  description: string
  messages: TicketMessage[]
}

export interface CreateTicketInput {
  title: string
  description: string
  type: 'bug_report' | 'feature_request' | 'question'
}

export const supportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query<TicketSummary[], void>({
      query: () => '/support',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Ticket' as const, id })), 'Ticket']
          : ['Ticket'],
    }),

    getTicket: builder.query<TicketDetail, string>({
      query: (id) => `/support/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Ticket', id }],
    }),

    createTicket: builder.mutation<TicketDetail, CreateTicketInput>({
      query: (body) => ({ url: '/support', method: 'POST', body }),
      invalidatesTags: ['Ticket'],
    }),

    addTicketMessage: builder.mutation<TicketMessage, { id: string; body: string }>({
      query: ({ id, body }) => ({ url: `/support/${id}/messages`, method: 'POST', body: { body } }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Ticket', id }],
    }),
  }),
})

export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useAddTicketMessageMutation,
} = supportApi
