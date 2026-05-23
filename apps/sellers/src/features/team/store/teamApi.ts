import { apiSlice } from '@/store/apiSlice'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'manager' | 'staff'
  createdAt: string
}

interface TeamInvite {
  id: string
  email: string
  role: 'manager' | 'staff'
  expiresAt: string
  createdAt: string
}

export const teamApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTeamMembers: builder.query<TeamMember[], void>({
      query: () => '/team/members',
      providesTags: ['Team'],
    }),

    getTeamInvites: builder.query<TeamInvite[], void>({
      query: () => '/team/invites',
      providesTags: ['Team'],
    }),

    sendTeamInvite: builder.mutation<
      { id: string; email: string; role: string; token: string },
      { email: string; role: 'manager' | 'staff' }
    >({
      query: (body) => ({ url: '/team/invites', method: 'POST', body }),
      invalidatesTags: ['Team'],
    }),

    removeTeamMember: builder.mutation<{ ok: boolean }, string>({
      query: (userId) => ({ url: `/team/members/${userId}`, method: 'DELETE' }),
      invalidatesTags: ['Team'],
    }),
  }),
})

export const {
  useGetTeamMembersQuery,
  useGetTeamInvitesQuery,
  useSendTeamInviteMutation,
  useRemoveTeamMemberMutation,
} = teamApi
