import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { useEventStore } from "@/store/event.store"
import { supabase } from "@/utils/supabase"
import { Search, Plus, Layers, ChevronsUpDown, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { PageHeader } from "@/components/page-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const OrganizationCardSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-6 h-[140px] animate-pulse flex items-start gap-4">
    <div className="size-10 bg-muted rounded-lg shrink-0" />
    <div className="space-y-2 flex-1">
      <div className="h-4 bg-muted rounded w-1/3" />
      <div className="h-3 bg-muted rounded w-1/4" />
      <div className="h-3 bg-muted/60 rounded w-3/4 mt-2" />
    </div>
  </div>
)

export function OrganizationsPage() {
  const { user, organizations, selectOrganization, setOrganizations, logout } = useAuthStore()
  const { loadData } = useEventStore()
  const navigate = useNavigate()

  const [search, setSearch] = useState("")
  const [isLoadingList, setIsLoadingList] = useState(true)

  const fetchOrganizations = async () => {
    if (!user?.id) return
    setIsLoadingList(true)
    try {
      const { data, error } = await supabase
        .from("business_user_roles")
        .select(`
          business_id,
          businesses:business_id (
            id,
            name,
            description,
            is_active
          )
        `)
        .eq("user_id", user.id)

      if (error) throw error

      const formatted = (data || [])
        .map((row: any) => row.businesses)
        .filter(Boolean)
        .map((b: any) => ({
          id: b.id,
          name: b.name,
          slug: b.name.toLowerCase().replace(/\s+/g, "-"),
          description: b.description || "",
          isActive: b.is_active ?? true,
          plan: "Free Plan",
          projectsCount: 0 // Will compute dynamically if events store counts match
        }))
      setOrganizations(formatted)
    } catch (err) {
      console.error("Error loading organizations:", err)
    } finally {
      setIsLoadingList(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [user])

  const handleSelect = (org: any) => {
    selectOrganization(org)
    loadData(org.id) // Load events for this organization
    navigate("/dashboard")
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate("/login", { replace: true })
  }

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Top Header Navbar */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-6">
          <span className="font-bold text-xl text-emerald-600 dark:text-emerald-500 tracking-tighter flex items-center gap-1.5">
            EventHive
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <ThemeSwitch />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 outline-none p-1.5 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border cursor-pointer">
                <Avatar className="h-8 w-8 rounded-lg border border-border">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.full_name || user?.email || "E")}`} alt={user?.full_name || ""} />
                  <AvatarFallback className="rounded-lg">US</AvatarFallback>
                </Avatar>
                <div className="hidden md:grid text-left text-xs leading-tight">
                  <span className="truncate font-semibold text-sm text-foreground">{user?.full_name || "Usuario"}</span>
                  <span className="truncate text-[10px] text-muted-foreground">{user?.email}</span>
                </div>
                <ChevronsUpDown className="ml-1 size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" sideOffset={4}>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg border border-border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.full_name || user?.email || "E")}`} alt={user?.full_name || ""} />
                    <AvatarFallback className="rounded-lg">US</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.full_name || "Usuario"}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 p-2" disabled>
                <span className="text-xs text-muted-foreground">Configuración en desarrollo</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="gap-2 p-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 md:p-16 space-y-12 animate-in fade-in duration-300">
        <PageHeader
          title="Hola, estas son tus organizaciones"
          description="Selecciona o crea una organización para administrar tus eventos."
        />

        {/* Control Bar */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar organización..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
            <Button
              onClick={() => navigate("/dashboard/organizations/new")}
              className="w-full md:w-auto flex items-center gap-2"
            >
              <Plus className="size-4" />
              Nueva organización
            </Button>
          </div>
        </div>

        {/* Content Render Grid */}
        {isLoadingList ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <OrganizationCardSkeleton />
            <OrganizationCardSkeleton />
            <OrganizationCardSkeleton />
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card space-y-4">
            <Layers className="size-12 mx-auto text-muted-foreground" />
            <h3 className="font-bold text-lg">No se encontraron organizaciones</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {search ? "Intenta con otro término de búsqueda o" : "Registra tu primera organización para"} empezar a publicar eventos.
            </p>
            {!search && (
              <Button onClick={() => navigate("/dashboard/organizations/new")} variant="outline" className="cursor-pointer">
                Crear Organización
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrgs.map((org) => (
              <div
                key={org.id}
                onClick={() => handleSelect(org)}
                className="group p-6 bg-card border border-border rounded-xl hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all flex items-start gap-4"
              >
                {/* Left logo icon */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 font-bold text-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                {/* Metadata */}
                <div className="space-y-1 overflow-hidden flex-1">
                  <h3 className="font-semibold text-base truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {org.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="font-medium bg-muted px-2 py-0.5 rounded-md">{org.plan || "Free Plan"}</span>
                  </div>
                  {org.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{org.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
