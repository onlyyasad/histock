import { apiSlice } from '@/core/store/apiSlice'

export type PermissionMap = Record<string, Record<string, boolean>>

export const permissionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query<PermissionMap, void>({
      query: () => '/team/permissions',
      providesTags: ['Permission'],
    }),

    updatePermission: builder.mutation<
      void,
      { role: 'manager' | 'staff'; permission: string; granted: boolean }
    >({
      query: (body) => ({ url: '/team/permissions', method: 'PATCH', body }),
      invalidatesTags: ['Permission'],
    }),
  }),
})

export const { useGetPermissionsQuery, useUpdatePermissionMutation } = permissionsApi
