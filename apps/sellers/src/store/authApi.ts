import { apiSlice } from './apiSlice'
import type { AuthUser } from '../features/auth/store/authSlice'

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<AuthUser, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
    login: builder.mutation<AuthUser, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation<
      AuthUser,
      { businessName: string; email: string; password: string; name: string }
    >({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Auth'],
    }),
    forgotPassword: builder.mutation<{ ok: boolean; message: string }, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: builder.mutation<{ ok: boolean; message: string }, { token: string; password: string }>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    startImpersonation: builder.mutation<AuthUser, { token: string }>({
      query: (body) => ({ url: '/auth/impersonate', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    endImpersonation: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/auth/impersonate/end', method: 'POST' }),
      invalidatesTags: ['Auth'],
    }),
  }),
})

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useStartImpersonationMutation,
  useEndImpersonationMutation,
} = authApi
