import { useAuthStore } from "@/store/auth.store"
import { useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react"

export function TeamSwitcher() {
  const { organizations, selectedOrganization, selectOrganization } = useAuthStore()
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  if (!selectedOrganization) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" onClick={() => navigate("/dashboard/organizations")}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground font-bold text-sm">
              ?
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Sin Organización</span>
              <span className="truncate text-xs text-muted-foreground">Elegir una activa</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-border bg-muted/10">
                {selectedOrganization.logoUrl ? (
                  <img src={selectedOrganization.logoUrl} alt={selectedOrganization.name} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-primary text-white text-sm">
                    {selectedOrganization.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{selectedOrganization.name}</span>
                <div className="flex items-center mt-0.5">
                  {selectedOrganization.isActive ? (
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                      ACTIVO
                    </span>
                  ) : (
                    <span className="bg-destructive/10 text-destructive border border-destructive/20 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                      INACTIVO
                    </span>
                  )}
                </div>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
              Mis Organizaciones
            </DropdownMenuLabel>
            {organizations.map((org, index) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => selectOrganization(org)}
                className="gap-2 p-2 focus:bg-accent cursor-pointer animate-in fade-in duration-200"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border overflow-hidden bg-muted/10 text-xs">
                  {org.logoUrl ? (
                    <img src={org.logoUrl} alt={org.name} className="size-full object-cover" />
                  ) : (
                    org.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="flex-1 truncate text-sm font-medium">{org.name}</span>
                <DropdownMenuShortcut className="text-[10px] font-mono">⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2 cursor-pointer focus:bg-accent text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/dashboard/organizations")}
            >
              <div className="flex size-6 items-center justify-center rounded-md border border-border bg-transparent">
                <PlusIcon className="size-4" />
              </div>
              <div className="font-semibold text-xs">Gestionar Organizaciones</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
