'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart2,
  UsersRound,
  Settings,
  HeadphonesIcon,
  Banknote,
  LogOut,
} from 'lucide-react'
import { useLogoutMutation } from '@/store/authApi'
import { toast } from 'sonner'

const PRIMARY_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
]

const SECONDARY_NAV = [
  { href: '/team', label: 'Team', icon: UsersRound },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/support', label: 'Support', icon: HeadphonesIcon },
  { href: '/remittance', label: 'Remittance', icon: Banknote },
]

export function AppSidebar() {
  const pathname = usePathname()
  const user = useAppSelector((state) => state.auth.user)
  const router = useRouter()
  const [logout] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logout().unwrap()
      router.push('/login')
    } catch {
      toast.error('Logout failed')
    }
  }

  const ALL_NAV_HREFS = [...PRIMARY_NAV, ...SECONDARY_NAV].map((n) => n.href)

  const isActive = (href: string) => {
    const matches = (h: string) => pathname === h || pathname.startsWith(h + '/')
    if (!matches(href)) return false
    // exact-match priority: another nav item that matches more specifically wins
    return !ALL_NAV_HREFS.some((other) => other !== href && other.length > href.length && matches(other))
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-3 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-primary">Hi</span>
          <span className="group-data-[collapsible=icon]:hidden">Stock</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PRIMARY_NAV.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={isActive(href)}
                    tooltip={label}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={isActive(href)}
                    tooltip={label}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1.5 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground truncate">{user?.businessName}</p>
                {user?.role && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">{user.role}</Badge>
                )}
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Sign out">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
