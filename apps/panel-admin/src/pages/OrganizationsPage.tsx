import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { useEventStore } from "@/store/event.store"
import { supabase } from "@/utils/supabase"
import { Search, Plus, Layers, ChevronsUpDown, LogOut, User } from "lucide-react"
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
import { Card } from "@/components/ui/card"

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
  console.log(user)
  const { loadData } = useEventStore()
  const navigate = useNavigate()

  const [search, setSearch] = useState("")
  const [isLoadingList, setIsLoadingList] = useState(true)

  const fetchOrganizations = async () => {
    if (!user?.id) return
    setIsLoadingList(true)
    try {
      // 1. Fetch organization memberships for the current user profile
      const { data: memberData, error: memberError } = await supabase
        .from("organization_members")
        .select(`
          role,
          organization:organizations (
            id,
            organization_name,
            organization_type,
            organization_email,
            description,
            status,
            slug,
            logo_url
          )
        `)
        .eq("profile_id", user.id)

      if (memberError) {
        // Fallback to fetching all organizations if organization_members table does not exist
        if (memberError.code === "P0001" || memberError.message.includes("does not exist")) {
          console.warn("organization_members table does not exist, falling back to all organizations.")
          const { data: orgsData, error: orgsError } = await supabase
            .from("organizations")
            .select(`
              id,
              organization_name,
              organization_type,
              organization_email,
              description,
              status,
              slug,
              logo_url
            `)
          if (orgsError) throw orgsError

          const formatted = (orgsData || []).map((org: any) => ({
            id: org.id,
            name: org.organization_name,
            slug: org.slug || org.organization_name.toLowerCase().replace(/\s+/g, "-"),
            description: org.description || "",
            isActive: org.status === "active",
            type: org.organization_type || "Organización",
            logoUrl: org.logo_url || "",
            plan: org.organization_type || "Free Plan",
            projectsCount: 0
          }))
          setOrganizations(formatted)
          return
        }
        throw memberError
      }

      // Map to Organization model
      const orgs = (memberData || [])
        .map((item: any) => item.organization)
        .filter(Boolean)

      const formatted = orgs.map((org: any) => ({
        id: org.id,
        name: org.organization_name,
        slug: org.slug || org.organization_name.toLowerCase().replace(/\s+/g, "-"),
        description: org.description || "",
        isActive: org.status === "active",
        type: org.organization_type || "Organización",
        logoUrl: org.logo_url || "",
        plan: org.organization_type || "Free Plan",
        projectsCount: 0
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
          <span className="font-bold text-xl text-primary tracking-tighter flex items-center gap-1.5">
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
              <DropdownMenuItem
                onClick={() => navigate("/dashboard/profile")}
                className="gap-2 p-2 cursor-pointer focus:bg-muted"
              >
                <User className="size-4" />
                Editar Perfil
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
      <main className="flex-1 container w-full mx-auto p-8 md:p-16 space-y-12 animate-in fade-in duration-300">
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
              <Card
                key={org.id}
                onClick={() => handleSelect(org)}
                className="group p-6 hover:shadow-md cursor-pointer transition-all flex items-start gap-4 min-h-36 bg-card border border-border"
              >
                {/* Left logo icon or avatar fallback */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-border bg-muted/10 group-hover:border-primary transition-colors">
                  {org.logoUrl ? (
                    <img src={org.logoUrl} alt={org.name} className="size-full object-cover" />
                  ) : (
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(org.name)}`} alt={org.name} />
                      <AvatarFallback className="rounded-none bg-primary/10 text-primary font-bold text-sm">
                        {org.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                {/* Metadata */}
                <div className="overflow-hidden flex-1 flex flex-col gap-2">
                  <div>
                    {org.isActive ? (
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        ACTIVO
                      </span>
                    ) : (
                      <span className="bg-destructive/10 text-destructive border border-destructive/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        INACTIVO
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium  line-clamp-3 group-hover:underline transition-colors break-words">
                    {org.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="font-medium bg-muted px-2 py-0.5 rounded-md text-primary capitalize">{org.type}</span>
                  </div>
                  {org.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{org.description}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
