'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useGetMeQuery } from '@/store/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setUser, clearUser, setLoading } from '@/features/auth/store/authSlice'
import { ImpersonationBanner } from '@/features/auth/components/ImpersonationBanner'
import { ServiceWorkerRegistrar } from './components/ServiceWorkerRegistrar'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/orders', icon: '📦', label: 'Orders' },
  { href: '/products', icon: '🛍️', label: 'Products' },
  { href: '/customers', icon: '👤', label: 'Customers' },
  { href: '/analytics', icon: '📈', label: 'Analytics' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
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
    <div className="min-h-screen">
      {user.isImpersonated && user.impersonationExpiresAt && (
        <ImpersonationBanner expiresAt={user.impersonationExpiresAt} />
      )}

      {/* Main content — padded bottom on mobile for bottom nav */}
      <main className="pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex z-50">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center min-h-[56px] text-xs gap-0.5',
                active ? 'text-gray-900 font-medium' : 'text-gray-400',
              )}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <ServiceWorkerRegistrar />
    </div>
  )
}
