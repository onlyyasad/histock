import { type ReactNode, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useGetMeQuery } from '@/store/adminApiSlice'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { isLoading, isError } = useGetMeQuery()

  useEffect(() => {
    if (isError) {
      navigate({ to: '/login' })
    }
  }, [isError, navigate])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError) return null

  return <>{children}</>
}
