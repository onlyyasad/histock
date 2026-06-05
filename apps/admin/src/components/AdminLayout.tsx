import { Outlet, useRouterState } from '@tanstack/react-router'
import { AppSidebar } from './AppSidebar'
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
  '/': 'Businesses',
  '/subscription-plans': 'Subscription Plans',
  '/audit-log': 'Audit Log',
  '/inquiries': 'Inquiries',
}

function getPageTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(prefix + '/')) {
      return title
    }
  }
  return 'Admin'
}

export function AdminLayout() {
  const { location } = useRouterState()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4 sticky top-0 bg-background z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{getPageTitle(location.pathname)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
