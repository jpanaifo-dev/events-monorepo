import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs"

export function PrivateLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen bg-background overflow-hidden text-foreground">
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          {/* Top Header */}
          <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 flex-shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="h-4 w-[1px] bg-border" />
              <DynamicBreadcrumbs />
            </div>
            <div className="flex items-center gap-6 text-sm">
              <ThemeSwitch />
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground font-medium">Entorno de Producción</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </header>

          {/* Dynamic viewport layout */}
          <main className="flex-1 overflow-y-auto p-8 bg-muted/5">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
