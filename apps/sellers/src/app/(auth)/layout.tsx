import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex flex-col items-center gap-1">
        <Link href="/" className="text-3xl font-bold">
          <span className="text-primary">Hi</span>Stock
        </Link>
        <span className="text-sm text-muted-foreground">Your social commerce back-office</span>
      </div>
      {children}
    </div>
  )
}
