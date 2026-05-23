import { apiSlice } from '@/store/apiSlice'

export interface DashboardSnapshot {
  todayOrders: number
  pendingOrders: number
  processingOrders: number
  deliveredToday: number
  deliveryFailed: number
  todayRevenue: number
  lowStockProducts: number
  overdueSchedules: number
}

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardSnapshot, void>({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),
  }),
})

export const { useGetDashboardQuery } = dashboardApi
