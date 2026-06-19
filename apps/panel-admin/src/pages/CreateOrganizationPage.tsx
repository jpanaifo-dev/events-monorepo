import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
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

const organizationSchema = z.object({
  name: z.string().min(3, "El nombre de la organización debe tener al menos 3 caracteres"),
  slug: z.string()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "El slug solo debe contener letras minúsculas, números y guiones"),
  description: z.string().optional(),
})

type OrganizationInput = z.infer<typeof organizationSchema>

export function CreateOrganizationPage() {
  const navigate = useNavigate()
  const { user, logout, selectOrganization } = useAuthStore()

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Partial<Record<keyof OrganizationInput, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-generate slug from name
  useEffect(() => {
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "")     // Keep only alphanumeric, spaces, and hyphens
      .replace(/\s+/g, "-")            // Replace spaces with hyphens
      .replace(/-+/g, "-")             // Deduplicate hyphens

    setSlug(generatedSlug)
  }, [name])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate("/login", { replace: true })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setFormError(null)
    setIsSubmitting(true)

    const result = organizationSchema.safeParse({ name, slug, description })

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof OrganizationInput, string>> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof OrganizationInput] = err.message
        }
      })
      setErrors(fieldErrors)
      setIsSubmitting(false)
      return
    }

    try {
      if (!user?.id) throw new Error("Sesión de usuario no válida.")

      // Insert new business row into database (treats it as organization)
      const { data: orgData, error: insertError } = await supabase
        .from("businesses")
        .insert([{ name, description }])
        .select()
        .single()

      if (insertError) throw insertError

      // Assign user role OWNER to the newly created organization in Supabase
      const { error: roleError } = await supabase
        .from("business_user_roles")
        .insert([{
          business_id: orgData.id,
          user_id: user.id,
          role: "OWNER"
        }])

      if (roleError) throw roleError

      // Format the organization for selection in the store
      const formattedOrg = {
        id: orgData.id,
        name: orgData.name,
        slug: orgData.name.toLowerCase().replace(/\s+/g, "-"),
        description: orgData.description || "",
        isActive: orgData.is_active ?? true,
        plan: "Free Plan",
        projectsCount: 0
      }

      // Auto-select the newly created organization
      selectOrganization(formattedOrg)

      // Redirect directly to the dashboard
      navigate("/dashboard", { replace: true })
    } catch (err: any) {
      console.error(err)
      setFormError(err.message || "Error al crear la organización. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Top Header Navbar */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard/organizations")}
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

      {/* Main Settings Form Container */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-1 mb-10">
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Crear una nueva organización</h1>
          <p className="text-sm text-muted-foreground">
            Tu organización tendrá su propio espacio de trabajo dedicado para administrar eventos, agenda, ponentes y asistentes de forma profesional.
          </p>
        </div>

        {formError && (
          <div className="mb-6 p-4 border border-destructive/20 bg-destructive/10 text-destructive text-sm font-medium rounded-lg">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            {/* Owner Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3">
                <label className="text-sm font-medium text-foreground">Administrador</label>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <div className="flex items-stretch rounded-md border border-input bg-muted/30 overflow-hidden text-sm px-3 py-2 select-none text-muted-foreground">
                  <span className="flex-1 truncate">Organización de {user?.full_name || user?.email}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold rounded-full uppercase ml-2">
                    Free
                  </span>
                </div>
              </div>
            </div>

            {/* Name Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3">
                <label htmlFor="org-name" className="text-sm font-medium text-foreground">Nombre de la Organización</label>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="org-name"
                  type="text"
                  placeholder="Ej. Tech Latam, Eventos Globales"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1.5 font-medium">{errors.name}</p>
                )}
              </div>
            </div>

            {/* Slug Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="org-slug" className="text-sm font-medium text-foreground">Identificador URL (Slug)</label>
                <p className="text-xs text-muted-foreground">Dirección única para acceder a tu panel</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <div className="flex items-stretch rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring/50">
                  <span className="bg-muted px-3 border-r border-border text-xs text-muted-foreground flex items-center font-mono select-none">
                    /
                  </span>
                  <input
                    id="org-slug"
                    type="text"
                    placeholder="ej-org"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    className="flex-1 px-3 py-2 text-sm bg-transparent border-0 outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.slug && (
                  <p className="text-xs text-destructive mt-1.5 font-medium">{errors.slug}</p>
                )}
              </div>
            </div>

            {/* Description Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3">
                <label htmlFor="org-desc" className="text-sm font-medium text-foreground">Descripción (Opcional)</label>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <textarea
                  id="org-desc"
                  rows={4}
                  placeholder="Describe el enfoque de los eventos que organiza tu espacio de trabajo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring/50 text-foreground"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Actions Row */}
            <div className="bg-muted/10 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard/organizations")}
                className="px-4 py-2 border border-border text-sm font-semibold rounded-md hover:bg-muted transition-colors cursor-pointer"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 rounded-lg border-0 shadow-none transition-colors"
              >
                {isSubmitting ? "Creando..." : "Crear Organización"}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
