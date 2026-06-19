import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronsUpDown, LogOut, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout, setUser, selectedOrganization } = useAuthStore()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [institution, setInstitution] = useState("")
  const [dedication, setDedication] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return
      setIsLoadingProfile(true)
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setFirstName(data.first_name || "")
          setLastName(data.last_name || "")
          setPhone(data.phone || "")
          setBio(data.bio || "")
          setInstitution(data.institution || "")
          setDedication(data.dedication || "")
          setAvatarUrl(data.avatar_url || "")
        }
      } catch (err) {
        console.error("Error loading user profile:", err)
        toast.error("Error al cargar la información del perfil.")
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()
  }, [user?.id])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate("/login", { replace: true })
  }

  const handleBack = () => {
    if (selectedOrganization) {
      navigate("/dashboard")
    } else {
      navigate("/dashboard/organizations")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone,
          bio,
          institution,
          dedication,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (error) throw error

      // Update auth store user details
      setUser({
        ...user,
        full_name: `${firstName} ${lastName}`.trim() || null,
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        bio: bio || null,
        specialty: dedication || null
      })

      toast.success("Perfil actualizado con éxito")
      handleBack()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error al guardar los cambios.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Top Header Navbar */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 border border-border rounded-md bg-muted/20 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            Volver
          </button>
          <span className="font-bold text-xl text-emerald-600 dark:text-emerald-500 tracking-tighter ml-2">
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

      {/* Main Settings Form Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="space-y-1 mb-10">
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Mi Perfil</h1>
          <p className="text-sm text-muted-foreground">
            Actualiza tus datos personales y profesionales asociados a tu cuenta.
          </p>
        </div>

        {isLoadingProfile ? (
          <div className="border border-border rounded-xl bg-card p-12 text-center flex flex-col items-center justify-center space-y-4">
            <svg
              className="animate-spin h-8 w-8 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-muted-foreground">Cargando perfil...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              {/* Email Row (Disabled) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
                <div className="md:w-1/3">
                  <label className="text-sm font-medium text-foreground">Correo Electrónico</label>
                </div>
                <div className="md:w-2/3 max-w-md w-full">
                  <div className="flex items-stretch rounded-md border border-input bg-muted/35 overflow-hidden text-sm px-3 py-2 select-none text-muted-foreground">
                    <span className="flex-1 truncate">{user?.email}</span>
                  </div>
                </div>
              </div>

              {/* Name Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
                <div className="md:w-1/3">
                  <label htmlFor="first-name" className="text-sm font-medium text-foreground">Nombre</label>
                </div>
                <div className="md:w-2/3 max-w-md w-full">
                  <Input
                    id="first-name"
                    type="text"
                    placeholder="Ej. Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Last Name Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
                <div className="md:w-1/3">
                  <label htmlFor="last-name" className="text-sm font-medium text-foreground">Apellido</label>
                </div>
                <div className="md:w-2/3 max-w-md w-full">
                  <Input
                    id="last-name"
                    type="text"
                    placeholder="Ej. Pérez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Phone Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
                <div className="md:w-1/3">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">Teléfono</label>
                </div>
                <div className="md:w-2/3 max-w-md w-full">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ej. +51 987654321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Avatar URL Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
                <div className="md:w-1/3">
                  <label htmlFor="avatar-url" className="text-sm font-medium text-foreground">Enlace del Avatar (URL)</label>
                </div>
                <div className="md:w-2/3 max-w-md w-full">
                  <Input
                    id="avatar-url"
                    type="url"
                    placeholder="https://ejemplo.com/foto.png"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Institution Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
                <div className="md:w-1/3">
                  <label htmlFor="institution" className="text-sm font-medium text-foreground">Institución</label>
                </div>
                <div className="md:w-2/3 max-w-md w-full">
                  <Input
                    id="institution"
                    type="text"
                    placeholder="Ej. Universidad o Empresa"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Dedication Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
                <div className="md:w-1/3">
                  <label htmlFor="dedication" className="text-sm font-medium text-foreground">Dedicación / Rol Profesional</label>
                </div>
                <div className="md:w-2/3 max-w-md w-full">
                  <Input
                    id="dedication"
                    type="text"
                    placeholder="Ej. Desarrollador, Diseñador, Investigador"
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Bio Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
                <div className="md:w-1/3">
                  <label htmlFor="bio" className="text-sm font-medium text-foreground">Biografía</label>
                </div>
                <div className="md:w-2/3 max-w-md w-full">
                  <textarea
                    id="bio"
                    rows={4}
                    placeholder="Escribe algo sobre ti..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring/50 text-foreground"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Actions Row */}
              <div className="bg-muted/10 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 border border-border text-sm font-semibold rounded-md hover:bg-muted transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="font-medium px-5 transition-colors"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
