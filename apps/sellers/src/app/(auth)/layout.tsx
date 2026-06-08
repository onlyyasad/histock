import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8 flex flex-col items-center gap-1">
        <span className="text-3xl font-bold text-indigo-600">
          HiStock
        </span>
        <span className="text-sm text-gray-500">Your social commerce back-office</span>
      </div>
      {children}
    </div>
  )
}
