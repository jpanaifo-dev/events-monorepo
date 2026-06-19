import * as React from "react"
import { useAuthStore } from "@/store/auth.store"
import { getAdminRoutes } from "@/config/admin-routes"
import { NavAdmin } from "@/components/nav-admin"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore()
  const adminRoutes = getAdminRoutes()

  const formattedUser = {
    name: user?.full_name || user?.email || "Usuario EventHive",
    email: user?.email || "",
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      user?.full_name || user?.email || "E"
    )}`,
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavAdmin items={adminRoutes} label="Panel de Control" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={formattedUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
