import { apiSlice } from '@/store/apiSlice'

export interface Schedule {
  id: string
  businessId: string
  title: string
  scheduledAt: string
  orderId: string | null
  customerId: string | null
  isDone: boolean
  createdAt: string
}

export interface CreateScheduleInput {
  title: string
  scheduledAt: string
  orderId?: string | null
  customerId?: string | null
}

export const schedulesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSchedules: builder.query<Schedule[], { orderId?: string } | void>({
      query: (params) => ({ url: '/schedules', params: params ?? {} }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Schedule' as const, id })), 'Schedule']
          : ['Schedule'],
    }),

    createSchedule: builder.mutation<Schedule, CreateScheduleInput>({
      query: (body) => ({ url: '/schedules', method: 'POST', body }),
      invalidatesTags: ['Schedule', 'Dashboard'],
    }),

    markScheduleDone: builder.mutation<Schedule, string>({
      query: (id) => ({ url: `/schedules/${id}/done`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Schedule', id }, 'Schedule', 'Dashboard'],
    }),

    deleteSchedule: builder.mutation<void, string>({
      query: (id) => ({ url: `/schedules/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Schedule', id }, 'Schedule', 'Dashboard'],
    }),
  }),
})

export const {
  useGetSchedulesQuery,
  useCreateScheduleMutation,
  useMarkScheduleDoneMutation,
  useDeleteScheduleMutation,
} = schedulesApi
