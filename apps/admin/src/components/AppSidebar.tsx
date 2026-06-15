import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Building2, ClipboardList, FileText, MessageSquare, LifeBuoy, LogOut } from 'lucide-react'
import { toast } from 'sonner'
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
import { useGetMeQuery, useAdminLogoutMutation } from '@/store/adminApiSlice'

const NAV = [
  { to: '/', label: 'Businesses', icon: Building2 },
  { to: '/subscription-plans', label: 'Plans', icon: FileText },
  { to: '/audit-log', label: 'Audit Log', icon: ClipboardList },
  { to: '/inquiries', label: 'Inquiries', icon: MessageSquare },
  { to: '/support-tickets', label: 'Support', icon: LifeBuoy },
] as const

export function AppSidebar() {
  const { data: me } = useGetMeQuery()
  const [logout] = useAdminLogoutMutation()
  const navigate = useNavigate()
  const { location } = useRouterState()

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

  const handleLogout = async () => {
    try {
      await logout().unwrap()
      navigate({ to: '/login' })
    } catch {
      toast.error('Logout failed')
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-3 border-b">
        <span className="font-bold text-lg">
          <span className="text-primary">Hi</span>
          <span className="group-data-[collapsible=icon]:hidden">Stock Admin</span>
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    render={<Link to={to} />}
                    isActive={isActive(to)}
                    tooltip={label}
                  >
                    <Icon />
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
              <p className="text-sm font-medium truncate">{me?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{me?.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="secondary" className="text-xs">Platform admin</Badge>
                {me?.isDemo && (
                  <Badge variant="outline" className="text-xs border-warning/30 bg-warning/10 text-warning">Demo</Badge>
                )}
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Sign out">
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
