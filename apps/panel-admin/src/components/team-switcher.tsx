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
  const { services, selectedService, selectService } = useAuthStore()
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  if (!selectedService) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" onClick={() => navigate("/dashboard/settings/business")}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground font-bold text-sm">
              ?
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Sin Negocio</span>
              <span className="truncate text-xs text-muted-foreground">Registrar uno nuevo</span>
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
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
                {selectedService.name.charAt(0).toUpperCase()}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{selectedService.name}</span>
                <span className="truncate text-xs text-muted-foreground">Negocio Activo</span>
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
              Mis Negocios
            </DropdownMenuLabel>
            {services.map((biz, index) => (
              <DropdownMenuItem
                key={biz.id}
                onClick={() => selectService(biz)}
                className="gap-2 p-2 focus:bg-accent cursor-pointer"
              >
                <div className="flex size-6 items-center justify-center rounded-md border border-border bg-muted text-xs font-bold">
                  {biz.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 truncate text-sm font-medium">{biz.name}</span>
                <DropdownMenuShortcut className="text-[10px] font-mono">⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 p-2 cursor-pointer focus:bg-accent text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/dashboard/settings/business")}
            >
              <div className="flex size-6 items-center justify-center rounded-md border border-border bg-transparent">
                <PlusIcon className="size-4" />
              </div>
              <div className="font-semibold text-xs">Gestionar Negocios</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
