import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { OrganizationMemberRole } from "@/types/auth.types"
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
import { ChevronsUpDown, LogOut, ArrowLeft, X } from "lucide-react"
import { toast } from "sonner"
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview"

const organizationSchema = z.object({
  name: z.string().min(3, "El nombre de la organización debe tener al menos 3 caracteres"),
  type: z.string().min(2, "El tipo de organización es requerido"),
  email: z.string().refine((val) => {
    if (!val) return true;
    const parts = val.split(",").map(p => p.trim());
    return parts.every(p => !p || /\S+@\S+\.\S+/.test(p));
  }, "Uno o más correos son inválidos").optional(),
  slug: z.string()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "El slug solo debe contener letras minúsculas, números y guiones"),
  description: z.string().optional(),
  logoUrl: z.string().url("Enlace de logo inválido").or(z.literal("")).optional(),
  coverUrl: z.string().url("Enlace de portada inválido").or(z.literal("")).optional(),
  faviconUrl: z.string().url("Enlace de favicon inválido").or(z.literal("")).optional(),
})

type OrganizationInput = z.infer<typeof organizationSchema>

export function CreateOrganizationPage() {
  const navigate = useNavigate()
  const { user, logout, selectOrganization } = useAuthStore()

  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [emails, setEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")

  const addEmail = (e: React.MouseEvent) => {
    e.preventDefault()
    const parts = newEmail.split(/[\s,;]+/).map(p => p.trim()).filter(Boolean)
    if (parts.length === 0) return

    const invalidParts = parts.filter(p => !/\S+@\S+\.\S+/.test(p))
    if (invalidParts.length > 0) {
      toast.error(`Uno o más correos son inválidos: ${invalidParts.join(", ")}`)
      return
    }

    const uniqueNew = parts.filter(p => !emails.includes(p))
    if (uniqueNew.length > 0) {
      setEmails([...emails, ...uniqueNew])
    }
    setNewEmail("")
  }

  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index))
  }
  const [logoUrl, setLogoUrl] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [faviconUrl, setFaviconUrl] = useState("")

  const [errors, setErrors] = useState<Partial<Record<keyof OrganizationInput, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")

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

  // Real-time slug availability check
  useEffect(() => {
    if (slug.length < 3) {
      setSlugStatus("idle")
      return
    }

    setSlugStatus("checking")
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("organizations")
          .select("id")
          .eq("slug", slug)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setSlugStatus("taken")
        } else {
          setSlugStatus("available")
        }
      } catch (err) {
        console.error("Error checking slug availability:", err)
        setSlugStatus("idle")
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [slug])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate("/login", { replace: true })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsSubmitting(true)

    let currentEmails = [...emails]
    if (newEmail.trim()) {
      const parts = newEmail.split(/[\s,;]+/).map(p => p.trim()).filter(Boolean)
      const invalidParts = parts.filter(p => !/\S+@\S+\.\S+/.test(p))
      if (invalidParts.length > 0) {
        toast.error(`Uno o más correos en el campo de entrada son inválidos: ${invalidParts.join(", ")}`)
        setIsSubmitting(false)
        return
      }
      parts.forEach(p => {
        if (!currentEmails.includes(p)) {
          currentEmails.push(p)
        }
      })
      setEmails(currentEmails)
      setNewEmail("")
    }

    const validation = organizationSchema.safeParse({
      name,
      type,
      email: currentEmails.join(", "),
      slug,
      description,
      logoUrl,
      coverUrl,
      faviconUrl,
    })

    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof OrganizationInput, string>> = {}
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof OrganizationInput] = err.message
        }
      })
      setErrors(fieldErrors)
      setIsSubmitting(false)
      toast.error("Por favor, corrige los errores en el formulario.")
      return
    }

    if (slugStatus === "taken") {
      toast.error("El slug seleccionado ya está en uso por otra organización.")
      setIsSubmitting(false)
      return
    }

    try {
      if (!user?.id) throw new Error("Sesión de usuario no válida.")

      // 1. Insert new organization row into database
      const { data: orgData, error: insertError } = await supabase
        .from("organizations")
        .insert([{
          organization_name: name,
          organization_type: type,
          organization_email: currentEmails,
          slug,
          description: description || null,
          logo_url: logoUrl || null,
          cover_image_url: coverUrl || null,
          favicon_url: faviconUrl || null,
          status: "active",
          validation_status: "pending"
        }])
        .select()
        .single()

      if (insertError) throw insertError

      // Assign the creator as Owner of the organization in organization_members
      try {
        const { error: memberError } = await supabase
          .from("organization_members")
          .insert({
            organization_id: orgData.id,
            profile_id: user.id,
            role: OrganizationMemberRole.OWNER,
            is_active: true
          })

        if (memberError) {
          if (memberError.code === "P0001" || memberError.message.includes("does not exist")) {
            console.warn("organization_members table does not exist, creating local fallback mock member.")
            const storedKey = `mock_members_${orgData.id}`
            const defaultMember = [
              {
                id: "fallback-member-id",
                role: OrganizationMemberRole.OWNER,
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
            localStorage.setItem(storedKey, JSON.stringify(defaultMember))
          } else {
            throw memberError
          }
        }
      } catch (memErr: any) {
        console.error("Failed to assign creator as Owner in DB:", memErr)
        toast.warning("Organización creada, pero no se pudo registrar su rol de Dueño automáticamente.")
      }

      // Format organization for Zustand store selection
      const formattedOrg = {
        id: orgData.id,
        name: orgData.organization_name,
        slug: orgData.slug,
        description: orgData.description || "",
        isActive: orgData.status === "active",
        type: orgData.organization_type,
        logoUrl: orgData.logo_url || "",
        coverUrl: orgData.cover_image_url || "",
        faviconUrl: orgData.favicon_url || "",
        plan: "Free Plan",
        projectsCount: 0
      }

      // Auto-select the newly created organization
      selectOrganization(formattedOrg)
      toast.success("Organización creada exitosamente")

      // Redirect directly to the dashboard
      navigate("/dashboard", { replace: true })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error al crear la organización. Inténtalo de nuevo.")
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
            onClick={() => navigate("/dashboard/organizations")}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 border border-border rounded-md bg-muted/20 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            Volver
          </button>
          <span className="font-bold text-xl text-primary tracking-tighter ml-2">
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
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Crear una nueva organización</h1>
          <p className="text-sm text-muted-foreground">
            Tu organización tendrá su propio espacio de trabajo dedicado para administrar eventos, agenda, ponentes y asistentes de forma profesional.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            {/* Owner Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">Administrador</label>
                <p className="text-xs text-muted-foreground">Tú serás el propietario principal de este espacio de trabajo.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <div className="flex items-stretch rounded-md border border-input bg-muted/30 overflow-hidden text-sm px-3 py-2 select-none text-muted-foreground">
                  <span className="flex-1 truncate">Organización de {user?.full_name || user?.email}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary font-semibold rounded-full uppercase ml-2">
                    Free
                  </span>
                </div>
              </div>
            </div>

            {/* Name Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="org-name" className="text-sm font-medium text-foreground">
                  Nombre de la Organización <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">El nombre comercial o institucional de tu espacio de trabajo.</p>
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

            {/* Type Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="org-type" className="text-sm font-medium text-foreground">
                  Tipo de Organización <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">El sector o enfoque al que pertenece (ej. Educación, Tecnología).</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="org-type"
                  type="text"
                  placeholder="Ej. Tecnología, Educación, Corporación"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={errors.type ? "border-destructive focus-visible:ring-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.type && (
                  <p className="text-xs text-destructive mt-1.5 font-medium">{errors.type}</p>
                )}
              </div>
            </div>

            {/* Email Row (Optional) */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Correos Electrónicos
                </label>
                <p className="text-xs text-muted-foreground">Correos oficiales para notificaciones y contacto de eventos.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ej. contacto@miorganizacion.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value.trim())}
                    disabled={isSubmitting}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail(e as any))}
                  />
                  <Button type="button" variant="outline" onClick={addEmail} disabled={isSubmitting} className="cursor-pointer">
                    Agregar
                  </Button>
                </div>
                {/* Render email chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {emails.map((email, index) => (
                    <span
                      key={index}
                      className="bg-muted border border-border text-foreground text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium animate-in zoom-in-95 duration-100"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(index)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer outline-none"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {emails.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">No hay correos registrados.</span>
                  )}
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1.5 font-medium">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Slug Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="org-slug" className="text-sm font-medium text-foreground">
                  Identificador URL (Slug) <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Dirección única para acceder a tu panel de eventos.</p>
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
                    className="flex-1 px-3 py-2 text-sm bg-transparent border-0 outline-none text-foreground"
                    disabled={isSubmitting}
                  />
                </div>
                {slug.length >= 3 && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-medium">
                    {slugStatus === "checking" && (
                      <span className="text-muted-foreground animate-pulse">Verificando disponibilidad...</span>
                    )}
                    {slugStatus === "available" && (
                      <span className="text-primary flex items-center gap-1">
                        <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        {slug} está disponible.
                      </span>
                    )}
                    {slugStatus === "taken" && (
                      <span className="text-destructive flex items-center gap-1">
                        <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                        {slug} ya está en uso.
                      </span>
                    )}
                  </div>
                )}
                {errors.slug && (
                  <p className="text-xs text-destructive mt-1.5 font-medium">{errors.slug}</p>
                )}
              </div>
            </div>

            {/* Description Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="org-desc" className="text-sm font-medium text-foreground">Descripción</label>
                <p className="text-xs text-muted-foreground">Una reseña corta del propósito o actividades de tu organización.</p>
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

            {/* Logo Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">Logotipo de la Organización</label>
                <p className="text-xs text-muted-foreground">Imagen representativa de la organización.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <ImageUploadWithPreview
                  label=""
                  value={logoUrl}
                  onChange={setLogoUrl}
                  aspectRatio="square"
                  placeholder="Arrastra tu logotipo aquí, o pega un enlace"
                  folder="organizations"
                  identifier={`${slug || "temp"}-logo`}
                />
              </div>
            </div>

            {/* Cover Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">Portada / Banner</label>
                <p className="text-xs text-muted-foreground">Banner de fondo que se mostrará en los eventos y portal.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <ImageUploadWithPreview
                  label=""
                  value={coverUrl}
                  onChange={setCoverUrl}
                  aspectRatio="banner"
                  placeholder="Arrastra tu banner de portada aquí, o pega un enlace"
                  folder="organizations"
                  identifier={`${slug || "temp"}-cover`}
                />
              </div>
            </div>

            {/* Favicon Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">Favicon</label>
                <p className="text-xs text-muted-foreground">Icono de página web pequeño (generalmente 1:1).</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <ImageUploadWithPreview
                  label=""
                  value={faviconUrl}
                  onChange={setFaviconUrl}
                  aspectRatio="favicon"
                  placeholder="Arrastra tu favicon aquí, o pega un enlace"
                  folder="organizations"
                  identifier={`${slug || "temp"}-favicon`}
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
                className="font-medium px-5 transition-colors"
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
