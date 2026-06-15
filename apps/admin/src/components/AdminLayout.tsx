import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { AppSidebar } from './AppSidebar'
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

const PAGE_TITLES: Record<string, string> = {
  '/': 'Businesses',
  '/subscription-plans': 'Subscription Plans',
  '/audit-log': 'Audit Log',
  '/inquiries': 'Inquiries',
  '/support-tickets': 'Support Tickets',
}

function getSection(pathname: string): { prefix: string; title: string } {
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(prefix + '/')) {
      return { prefix, title }
    }
  }
  return { prefix: '/', title: 'Admin' }
}

function AdminBreadcrumb({ pathname }: { pathname: string }) {
  const entity = useBreadcrumbEntity()
  const { prefix, title } = getSection(pathname)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {entity ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to={prefix} />}>{title}</BreadcrumbLink>
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

export function AdminLayout() {
  const { location } = useRouterState()

  return (
    <BreadcrumbEntityProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4 sticky top-0 bg-background z-10">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <AdminBreadcrumb pathname={location.pathname} />
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbEntityProvider>
  )
}
