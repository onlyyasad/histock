'use client'

import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-6xl">📵</span>
      <h1 className="text-2xl font-semibold text-foreground">You're offline</h1>
      <p className="text-muted-foreground max-w-xs">
        Check your internet connection and try again. Your data is safe and will sync when you're
        back online.
      </p>
      <Button className="mt-2" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </div>
  )
}
