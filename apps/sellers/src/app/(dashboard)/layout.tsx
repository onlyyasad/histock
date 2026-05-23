'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGetMeQuery } from '@/store/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setUser, clearUser, setLoading } from '@/features/auth/store/authSlice'
import { ImpersonationBanner } from '@/features/auth/components/ImpersonationBanner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { data: user, isLoading, isError } = useGetMeQuery()

  useEffect(() => {
    if (isLoading) {
      dispatch(setLoading(true))
      return
    }
    if (isError || !user) {
      dispatch(clearUser())
      router.push('/login')
      return
    }
    dispatch(setUser(user))
  }, [user, isLoading, isError, dispatch, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div>
      {user.isImpersonated && user.impersonationExpiresAt && (
        <ImpersonationBanner expiresAt={user.impersonationExpiresAt} />
      )}
      {children}
    </div>
  )
}
