import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Search, X, UserPlus } from "lucide-react"

export function MembersPage() {
  const navigate = useNavigate()
  const { user, selectedOrganization } = useAuthStore()

  const [members, setMembers] = useState<any[]>([])
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [filterText, setFilterText] = useState("")
  const [isDemoMode, setIsDemoMode] = useState(false)

  // Invite modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"Owner" | "Administrator" | "Developer">("Developer")
  const [isInviting, setIsInviting] = useState(false)

  // Search profiles modal states (inside invite modal)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchingProfiles, setIsSearchingProfiles] = useState(false)

  // Fetch members of organization with optional search filter
  const fetchMembers = async (searchVal: string = "") => {
    if (!selectedOrganization?.id) return
    setIsLoadingList(true)
    try {
      if (isDemoMode) {
        const stored = localStorage.getItem(`mock_members_${selectedOrganization.id}`)
        if (stored) {
          const list = JSON.parse(stored)
          if (searchVal.trim()) {
            const query = searchVal.toLowerCase()
            setMembers(list.filter((m: any) =>
              (m.profile?.first_name?.toLowerCase().includes(query)) ||
              (m.profile?.last_name?.toLowerCase().includes(query)) ||
              (m.profile?.email?.toLowerCase().includes(query)) ||
              (m.role?.toLowerCase().includes(query))
            ))
          } else {
            setMembers(list)
          }
        }
        setIsLoadingList(false)
        return
      }

      // Supabase Query
      let queryBuilder = supabase
        .from("organization_members")
        .select(`
          id,
          role,
          is_active,
          profile_id,
          profile:profiles (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq("organization_id", selectedOrganization.id)

      const { data, error } = await queryBuilder

      if (error) {
        if (error.code === "P0001" || error.message.includes("does not exist")) {
          setIsDemoMode(true)
          // Run again in Demo Mode
          const stored = localStorage.getItem(`mock_members_${selectedOrganization.id}`)
          if (stored) {
            const list = JSON.parse(stored)
            setMembers(list)
          }
          setIsLoadingList(false)
          return
        }
        throw error
      }

      // Filter locally or from profiles
      let list = data || []
      if (searchVal.trim()) {
        const query = searchVal.toLowerCase()
        list = list.filter((m: any) =>
          (m.profile?.first_name?.toLowerCase().includes(query)) ||
          (m.profile?.last_name?.toLowerCase().includes(query)) ||
          (m.profile?.email?.toLowerCase().includes(query)) ||
          (m.role?.toLowerCase().includes(query))
        )
      }
      setMembers(list)
    } catch (err) {
      console.error("Error loading members:", err)
    } finally {
      setIsLoadingList(false)
    }
  }

  // Load initially
  useEffect(() => {
    fetchMembers(filterText)
  }, [selectedOrganization, isDemoMode])

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFilterText(val)
    fetchMembers(val)
  };

  const handleSearchProfiles = async (val: string) => {
    setSearchQuery(val)
    if (!val.trim()) {
      setSearchResults([])
      return
    }
    setIsSearchingProfiles(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url")
        .or(`first_name.ilike.%${val}%,last_name.ilike.%${val}%,email.ilike.%${val}%`)
        .limit(8)

      if (error) throw error
      setSearchResults(data || [])
    } catch (e) {
      console.error("Error searching profiles:", e)
    } finally {
      setIsSearchingProfiles(false)
    }
  }

  const handleSelectProfile = (selectedProfile: any) => {
    setInviteEmail(selectedProfile.email)
    setIsSearchModalOpen(false)
    setSearchQuery("")
    setSearchResults([])
    toast.success(`Usuario seleccionado: ${selectedProfile.email}`)
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrganization?.id || !inviteEmail.trim()) return

    setIsInviting(true)
    try {
      // 1. Search profile by email
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url")
        .eq("email", inviteEmail.trim())
        .maybeSingle()

      if (profileError) throw profileError

      if (!profileData) {
        toast.error("No se encontró ningún usuario registrado con ese correo.")
        setIsInviting(false)
        return
      }

      // If demo mode is active, simulate insert using localStorage
      if (isDemoMode) {
        const storedKey = `mock_members_${selectedOrganization.id}`
        let storedMembers: any[] = []
        const stored = localStorage.getItem(storedKey)
        if (stored) {
          storedMembers = JSON.parse(stored)
        } else if (user) {
          storedMembers = [
            {
              id: "fallback-member-id",
              role: "Owner",
              is_active: true,
              profile_id: user.id,
              profile: {
                id: user.id,
                first_name: user.full_name?.split(" ")[0] || "",
                last_name: user.full_name?.split(" ").slice(1).join(" ") || "",
                email: user.email,
                avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.full_name || user.email || "U")}`
              }
            }
          ]
        }

        // Check if already member
        if (storedMembers.some(m => m.profile_id === profileData.id)) {
          throw new Error("El usuario ya es miembro de esta organización.")
        }

        const newMock = {
          id: `mock-member-${Date.now()}`,
          role: inviteRole,
          is_active: true,
          profile_id: profileData.id,
          profile: profileData
        }

        storedMembers.push(newMock)
        localStorage.setItem(storedKey, JSON.stringify(storedMembers))
        toast.success(`Miembro agregado (Modo Demo): ${profileData.email}`)
        setIsInviteModalOpen(false)
        setInviteEmail("")
        fetchMembers(filterText)
        return
      }

      // 2. Insert into organization_members
      const { error: insertError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: selectedOrganization.id,
          profile_id: profileData.id,
          role: inviteRole,
          is_active: true
        })

      if (insertError) {
        if (insertError.message?.includes("unique_organization_profile") || insertError.code === "23505") {
          throw new Error("El usuario ya es miembro de esta organización.")
        }
        throw insertError
      }

      toast.success(`Invitación enviada con éxito a ${inviteEmail}`)
      setIsInviteModalOpen(false)
      setInviteEmail("")
      fetchMembers(filterText)
    } catch (err: any) {
      console.error("Error inviting member:", err)
      toast.error(err.message || "Error al enviar la invitación.")
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!selectedOrganization?.id) return

    // Check if they are trying to remove themselves
    const member = members.find(m => m.id === memberId)
    if (member && member.profile_id === user?.id) {
      toast.error("No puedes eliminarte a ti mismo de la organización.")
      return
    }

    if (!confirm(`¿Estás seguro de que deseas remover a ${email} de la organización?`)) {
      return
    }

    try {
      if (isDemoMode || memberId.startsWith("mock-member-")) {
        const storedKey = `mock_members_${selectedOrganization.id}`
        const stored = localStorage.getItem(storedKey)
        if (stored) {
          const list = JSON.parse(stored)
          const filtered = list.filter((m: any) => m.id !== memberId)
          localStorage.setItem(storedKey, JSON.stringify(filtered))
        }
        toast.success(`Miembro removido (Modo Demo): ${email}`)
        fetchMembers(filterText)
        return
      }

      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", memberId)

      if (error) throw error

      toast.success(`Miembro removido con éxito: ${email}`)
      fetchMembers(filterText)
    } catch (err: any) {
      console.error("Error removing member:", err)
      toast.error(err.message || "Error al remover al miembro.")
    }
  }

  return (
    <div className="container mx-auto px-6 py-12 w-full font-sans">
      <div className="mb-10">
        <PageHeader
          title="Miembros de la Organización"
          showBackButton
          onBackClick={() => navigate("/dashboard/settings/business")}
          description="Administra los niveles de acceso, permisos y colaboradores en tu espacio de trabajo."
        />
      </div>

      {isDemoMode && (
        <div className="mb-6 p-4 border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 rounded-xl text-xs">
          <strong>Modo Demo Activo</strong>: Las operaciones de adición o eliminación se guardarán en el almacenamiento local de tu navegador.
        </div>
      )}

      {/* Card Container for List */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm animate-in fade-in duration-300">
        {/* Header Row with Filter & Invite Action */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border bg-card">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filtrar miembros..."
              value={filterText}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 border border-input rounded-lg text-xs bg-background outline-none focus:ring-1 focus:ring-primary/50 text-foreground"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold select-none transition-colors cursor-pointer outline-none flex items-center gap-1.5"
            >
              <UserPlus className="size-3.5" />
              Invitar miembros
            </button>
          </div>
        </div>

        {/* List render grid */}
        {isLoadingList ? (
          <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
            Cargando miembros de la organización...
          </div>
        ) : members.length > 0 ? (
          <div className="w-full">
            {/* Column labels */}
            <div className="grid grid-cols-3 px-6 py-3 border-b border-border bg-muted/15 text-[10px] font-bold tracking-wider text-muted-foreground/80 font-mono uppercase">
              <div>Miembro</div>
              <div>MFA</div>
              <div className="text-right">Rol / Acciones</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/60">
              {members.map((member) => (
                <div key={member.id} className="grid grid-cols-3 px-6 py-4 items-center text-sm hover:bg-muted/5 transition-colors">
                  {/* Left Details */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="size-8 rounded-full overflow-hidden border border-border shrink-0 bg-muted/40">
                      {member.profile?.avatar_url ? (
                        <img src={member.profile.avatar_url} alt="Avatar" className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                          {(member.profile?.first_name || member.profile?.email || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="grid leading-tight min-w-0">
                      <span className="font-semibold text-foreground truncate">
                        {[member.profile?.first_name, member.profile?.last_name].filter(Boolean).join(" ") || member.profile?.email.split("@")[0]}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-muted-foreground truncate">{member.profile?.email}</span>
                        {member.profile_id === user?.id && (
                          <span className="text-[8px] font-bold tracking-wider uppercase px-1 rounded bg-muted text-muted-foreground select-none shrink-0 font-sans">
                            TÚ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Details: MFA */}
                  <div className="text-xs text-muted-foreground/90 font-medium flex items-center gap-1">
                    <span>Desactivado</span>
                    <X className="size-3.5 text-muted-foreground/50" />
                  </div>

                  {/* Right Details */}
                  <div className="flex items-center justify-end gap-4">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted border border-border text-foreground capitalize select-none">
                      {member.role || "Developer"}
                    </span>
                    {member.profile_id === user?.id ? (
                      <button
                        type="button"
                        disabled
                        className="text-xs text-muted-foreground font-medium py-1.5 px-3 rounded-lg border border-border bg-muted/50 cursor-not-allowed select-none"
                      >
                        Salir
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id, member.profile?.email || "")}
                        className="text-xs text-destructive hover:bg-destructive/10 font-medium py-1.5 px-3 rounded-lg border border-transparent hover:border-destructive/20 transition-all cursor-pointer"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground italic">
            No se encontraron miembros registrados para esta organización.
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 bg-muted/5 border-t border-border/60 text-xs text-muted-foreground font-medium">
          {members.length} {members.length === 1 ? "miembro" : "miembros"}
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">
                  Invitar miembros al equipo
                </h3>
                <p className="text-xs text-muted-foreground">
                  Envía invitaciones y elige el nivel de acceso para tu organización.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsInviteModalOpen(false)
                  setInviteEmail("")
                }}
                className="text-muted-foreground hover:text-foreground cursor-pointer outline-none"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-5">
              {/* Role Option list */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Rol del miembro
                </label>
                <div className="space-y-2">
                  {[
                    {
                      value: "Owner",
                      label: "Owner (Dueño)",
                      desc: "Acceso total, incluyendo la eliminación de la organización e invitación de otros administradores."
                    },
                    {
                      value: "Administrator",
                      label: "Administrator (Administrador)",
                      desc: "Administra miembros, sedes y configuración del proyecto. No puede eliminar dueños o la organización."
                    },
                    {
                      value: "Developer",
                      label: "Developer (Desarrollador)",
                      desc: "Administra el contenido del proyecto (eventos, actividades). No puede cambiar la configuración comercial."
                    }
                  ].map((roleOpt) => (
                    <label
                      key={roleOpt.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${inviteRole === roleOpt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="invite-role"
                        value={roleOpt.value}
                        checked={inviteRole === roleOpt.value}
                        onChange={() => setInviteRole(roleOpt.value as any)}
                        className="mt-1 accent-primary"
                      />
                      <div className="grid leading-tight">
                        <span className="font-semibold text-sm text-foreground">{roleOpt.label}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">{roleOpt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Email and Search triggers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="invite-email" className="text-xs font-semibold text-muted-foreground block">
                    Dirección de correo electrónico
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSearchModalOpen(true)}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Search className="size-3.5" />
                    Buscar usuario existente
                  </button>
                </div>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="nombre@ejemplo.com"
                  className="bg-card"
                  disabled={isInviting}
                  autoComplete="off"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsInviteModalOpen(false)
                    setInviteEmail("")
                  }}
                  disabled={isInviting}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="cursor-pointer font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isInviting ? "Invitando..." : "Enviar invitación"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">
                  Buscar usuarios existentes
                </h3>
                <p className="text-xs text-muted-foreground">
                  Escribe el nombre o correo del usuario para buscar en la plataforma.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSearchModalOpen(false)
                  setSearchQuery("")
                  setSearchResults([])
                }}
                className="text-muted-foreground hover:text-foreground cursor-pointer outline-none"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Nombre, apellido o correo..."
                  value={searchQuery}
                  onChange={(e) => handleSearchProfiles(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-input rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  autoFocus
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 divide-y divide-border/40">
                {isSearchingProfiles ? (
                  <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">
                    Buscando usuarios...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((prof) => (
                    <div
                      key={prof.id}
                      onClick={() => handleSelectProfile(prof)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/60 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-full overflow-hidden border border-border shrink-0 bg-muted/55 flex items-center justify-center text-xs font-bold text-primary">
                          {prof.avatar_url ? (
                            <img src={prof.avatar_url} alt="Avatar" className="size-full object-cover" />
                          ) : (
                            (prof.first_name || prof.email).charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="grid leading-tight min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {[prof.first_name, prof.last_name].filter(Boolean).join(" ") || "Usuario"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">{prof.email}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-primary px-2 py-1 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20 shrink-0">
                        Seleccionar
                      </span>
                    </div>
                  ))
                ) : searchQuery ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground italic">
                    Escribe para buscar...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
