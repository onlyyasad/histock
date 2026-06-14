'use client'

import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-sm w-full">
        <CardContent className="pt-6 text-center space-y-3">
          <WifiOff className="size-10 text-muted-foreground/50 mx-auto" />
          <h1 className="text-2xl font-semibold text-foreground">You're offline</h1>
          <p className="text-muted-foreground">
            Check your internet connection and try again. Your data is safe and will sync when
            you're back online.
          </p>
          <Button className="mt-2" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
