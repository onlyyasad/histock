'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useGetMeQuery } from '@/store/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setUser, clearUser, setLoading } from '@/features/auth/store/authSlice'
import { ImpersonationBanner } from '@/features/auth/components/ImpersonationBanner'
import { ServiceWorkerRegistrar } from './components/ServiceWorkerRegistrar'
import { AppSidebar } from '@/components/AppSidebar'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/orders': 'Orders',
  '/products': 'Products',
  '/customers': 'Customers',
  '/analytics': 'Analytics',
  '/team': 'Team',
  '/settings': 'Settings',
  '/support': 'Support',
  '/remittance': 'Remittance',
}

function getPageTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return title
  }
  return 'HiStock'
}

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
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      {user.isImpersonated && user.impersonationExpiresAt && (
        <ImpersonationBanner expiresAt={user.impersonationExpiresAt} />
      )}
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4 sticky top-0 bg-background z-10">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{getPageTitle(pathname)}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <ServiceWorkerRegistrar />
    </>
  )
}
