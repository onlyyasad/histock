import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex flex-col items-center gap-1">
        <span className="text-3xl font-bold text-primary">
          HiStock
        </span>
        <span className="text-sm text-muted-foreground">Your social commerce back-office</span>
      </div>
      {children}
    </div>
  )
}
