'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useEndImpersonationMutation } from '@/store/authApi'

function useCountdown(expiresAt: string) {
  const [remaining, setRemaining] = useState(() => {
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function ImpersonationBanner({
  expiresAt,
}: {
  expiresAt: string
}) {
  const router = useRouter()
  const [endImpersonation, { isLoading }] = useEndImpersonationMutation()
  const countdown = useCountdown(expiresAt)

  const handleEnd = async () => {
    try {
      await endImpersonation().unwrap()
      toast.success('Impersonation session ended')
      router.push('/login')
    } catch {
      toast.error('Failed to end session')
    }
  }

  return (
    <div className="w-full bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between text-sm">
      <span className="font-medium">
        Admin impersonation session active — expires in {countdown}
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-amber-700 text-amber-900 hover:bg-amber-600"
        onClick={handleEnd}
        disabled={isLoading}
      >
        End Session
      </Button>
    </div>
  )
}
