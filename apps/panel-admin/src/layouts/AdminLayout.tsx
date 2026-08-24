import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarTrigger, Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs"
import { NavAdmin } from "@/components/nav-admin"
import { NavUser } from "@/components/nav-user"
import { useAuthStore } from "@/store/auth.store"
import { ZynqroLogo } from "@/components/zynqro-logo"
import { Building2, CreditCard, LayoutDashboard, Settings2, ShieldCheck, Users } from "lucide-react"

const adminRoutes = [
  { title: "Resumen", url: "/admin", icon: LayoutDashboard },
  { title: "Instituciones", url: "/admin/organizations", icon: Building2 },
  { title: "Usuarios y permisos", url: "/admin/users", icon: Users },
  { title: "Planes y cuentas", url: "/admin/plans", icon: ShieldCheck },
  { title: "Pagos", url: "/admin/payments", icon: CreditCard },
  { title: "Configuración", url: "/admin/settings", icon: Settings2 },
]

export function AdminLayout() {
  const user = useAuthStore((state) => state.user)
  const formattedUser = { name: user?.full_name || user?.email || "Administrador", email: user?.email || "", avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.full_name || user?.email || "A")}` }
  return <SidebarProvider>
    <div className="flex h-screen w-screen bg-background overflow-hidden text-foreground">
      <Sidebar collapsible="icon">
        <SidebarHeader><div className="flex h-12 items-center justify-center px-2"><ZynqroLogo className="h-8 w-auto" /></div></SidebarHeader>
        <SidebarContent><NavAdmin items={adminRoutes} label="Administración global" /></SidebarContent>
        <SidebarFooter><NavUser user={formattedUser} /></SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-4"><SidebarTrigger /><div className="h-4 w-px bg-border" /><DynamicBreadcrumbs /></div>
          <div className="flex items-center gap-6 text-sm"><ThemeSwitch /></div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-muted/5"><Outlet /></main>
      </div>
    </div>
  </SidebarProvider>
}
