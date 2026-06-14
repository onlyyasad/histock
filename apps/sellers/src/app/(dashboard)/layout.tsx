'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useGetMeQuery } from '@/store/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setUser, clearUser, setLoading } from '@/features/auth/store/authSlice'
import { ImpersonationBanner } from '@/features/auth/components/ImpersonationBanner'
import { ServiceWorkerRegistrar } from './components/ServiceWorkerRegistrar'
import { AppSidebar } from '@/components/AppSidebar'
import { BreadcrumbEntityProvider, useBreadcrumbEntity } from '@/components/shared/BreadcrumbEntity'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

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

function getSection(pathname: string): { prefix: string; title: string } {
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return { prefix, title }
  }
  return { prefix: '/dashboard', title: 'HiStock' }
}

function DashboardBreadcrumb({ pathname }: { pathname: string }) {
  const entity = useBreadcrumbEntity()
  const { prefix, title } = getSection(pathname)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {entity ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={prefix} />}>{title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{entity}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-3 p-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      {user.isImpersonated && user.impersonationExpiresAt && (
        <ImpersonationBanner expiresAt={user.impersonationExpiresAt} />
      )}
      <BreadcrumbEntityProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-14 items-center gap-2 border-b px-4 sticky top-0 bg-background z-10">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <DashboardBreadcrumb pathname={pathname} />
            </header>
            <main className="flex-1">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </BreadcrumbEntityProvider>
      <ServiceWorkerRegistrar />
    </>
  )
}
