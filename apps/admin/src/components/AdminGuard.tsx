import { type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useGetMeQuery } from '../store/adminApiSlice'

export function AdminGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { isLoading, isError } = useGetMeQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Checking session...
      </div>
    )
  }

  if (isError) {
    navigate({ to: '/login' })
    return null
  }

  return <>{children}</>
}
