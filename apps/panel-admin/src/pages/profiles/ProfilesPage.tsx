import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAdminProfilesStore } from "@/store/admin-profiles.store"
import { Search, SlidersHorizontal, UserCheck, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useSEO } from "@/hooks/use-seo"

export function ProfilesPage() {
  const navigate = useNavigate()
  const { profiles, isLoading, loadAllProfiles } = useAdminProfilesStore()

  useSEO({
    title: "Directorio de Perfiles Registrados",
    description: "Busca, filtra y gestiona los roles, privilegios y estado de todos los perfiles de usuario registrados en la plataforma."
  })

  useEffect(() => {
    loadAllProfiles()
  }, [loadAllProfiles])

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [accountTypeFilter, setAccountTypeFilter] = useState("all")

  // Filter logic
  const filteredProfiles = profiles.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase()
    const email = (p.email || "").toLowerCase()
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === "all" || p.globalRole === roleFilter
    const matchesAccount = accountTypeFilter === "all" || p.accountType === accountTypeFilter

    return matchesSearch && matchesRole && matchesAccount
  })

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold">Admin</Badge>
      case "developer":
        return <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20 font-bold">Developer</Badge>
      default:
        return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">Usuario</Badge>
    }
  }

  const getAccountBadge = (type: string) => {
    switch (type) {
      case "enterprise":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold">Enterprise</Badge>
      case "premium":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold">Premium</Badge>
      default:
        return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">Gratuito</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Perfiles Registrados"
        description="Explora, busca y administra las cuentas, accesos y privilegios globales de los usuarios de la plataforma."
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-xl border border-border/80">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apellido o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal className="size-4 text-muted-foreground mr-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Rol:</span>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Todos los roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="developer">Developer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Cuenta:</span>
            <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Todas las cuentas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las cuentas</SelectItem>
                <SelectItem value="basic">Gratuito</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Profiles list table */}
      {isLoading ? (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="p-4 bg-muted/20 border-b border-border h-12 animate-pulse" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 border-b border-border/50 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3 w-1/3">
                <div className="size-9 rounded-lg bg-muted shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="h-6 bg-muted rounded w-20" />
              <div className="h-6 bg-muted rounded w-20" />
              <div className="h-8 bg-muted rounded w-24" />
            </div>
          ))}
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="p-16 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/20 space-y-3">
          <UserCheck className="size-10 mx-auto opacity-30" />
          <div>
            <p className="font-semibold text-lg text-foreground">No se encontraron perfiles</p>
            <p className="text-xs text-muted-foreground">
              Intenta cambiar los términos de búsqueda o los filtros aplicados.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl bg-card/10 backdrop-blur-xs">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 text-xs font-bold text-muted-foreground border-b border-border uppercase">
                <th className="p-4">Usuario</th>
                <th className="p-4">Rol Global</th>
                <th className="p-4">Plan / Cuenta</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Registro</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredProfiles.map((p) => {
                const fullName = `${p.firstName} ${p.lastName}`.trim() || "Usuario sin nombre"
                const avatarSeed = encodeURIComponent(fullName || p.email || "User")

                return (
                  <tr key={p.id} className="hover:bg-muted/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}`}
                          alt={fullName}
                          className="size-9 rounded-lg object-cover border border-border/80"
                        />
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm text-foreground">{fullName}</p>
                          <p className="text-xs text-muted-foreground">{p.email || "Sin correo"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getRoleBadge(p.globalRole)}
                    </td>
                    <td className="p-4">
                      {getAccountBadge(p.accountType)}
                    </td>
                    <td className="p-4">
                      {p.isPublic ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                          <Eye className="size-3.5" />
                          Público
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                          <EyeOff className="size-3.5" />
                          Privado
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        onClick={() => navigate(`/dashboard/profiles/${p.id}/info`)}
                        variant="outline"
                        className="text-xs h-8 px-3 font-semibold"
                      >
                        Gestionar
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
