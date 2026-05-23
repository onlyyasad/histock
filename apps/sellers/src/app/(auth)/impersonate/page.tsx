'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useStartImpersonationMutation } from '@/store/authApi'

export default function ImpersonatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [startImpersonation] = useStartImpersonationMutation()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const token = searchParams.get('token')
    if (!token) {
      toast.error('Invalid impersonation link')
      router.replace('/login')
      return
    }

    startImpersonation({ token })
      .unwrap()
      .then(() => {
        router.replace('/dashboard')
      })
      .catch(() => {
        toast.error('Impersonation token is invalid or expired')
        router.replace('/login')
      })
  }, [searchParams, router, startImpersonation])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Starting impersonation session...</p>
    </div>
  )
}
