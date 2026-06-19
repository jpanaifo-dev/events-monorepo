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
import { toast } from "sonner"

const organizationSchema = z.object({
  name: z.string().min(3, "El nombre de la organización debe tener al menos 3 caracteres"),
  type: z.string().min(2, "El tipo de organización es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  slug: z.string()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "El slug solo debe contener letras minúsculas, números y guiones"),
  description: z.string().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  documentNumber: z.string().optional(),
  brand: z.string().optional(),
  logoUrl: z.string().url("Enlace de logo inválido").or(z.literal("")).optional(),
  coverUrl: z.string().url("Enlace de portada inválido").or(z.literal("")).optional(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color hexadecimal inválido (ej. #7C3AED)").or(z.literal("")).optional(),
})

type OrganizationInput = z.infer<typeof organizationSchema>

export function CreateOrganizationPage() {
  const navigate = useNavigate()
  const { user, logout, selectOrganization } = useAuthStore()

  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [email, setEmail] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [address, setAddress] = useState("")
  const [documentNumber, setDocumentNumber] = useState("")
  const [brand, setBrand] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [primaryColor, setPrimaryColor] = useState("")

  const [errors, setErrors] = useState<Partial<Record<keyof OrganizationInput, string>>>({})
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
    setIsSubmitting(true)

    const validation = organizationSchema.safeParse({
      name,
      type,
      email,
      slug,
      description,
      contactPhone,
      address,
      documentNumber,
      brand,
      logoUrl,
      coverUrl,
      primaryColor,
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

    try {
      if (!user?.id) throw new Error("Sesión de usuario no válida.")

      // 1. Insert new organization row into database
      const { data: orgData, error: insertError } = await supabase
        .from("organizations")
        .insert([{
          organization_name: name,
          organization_type: type,
          organization_email: email,
          slug,
          description: description || null,
          contact_phone: contactPhone || null,
          address: address || null,
          document_number: documentNumber || null,
          brand: brand || null,
          logo_url: logoUrl || null,
          cover_image_url: coverUrl || null,
          primary_color: primaryColor || null,
          status: "active",
          validation_status: "pending"
        }])
        .select()
        .single()

      if (insertError) throw insertError

      // 2. Map user as follower to allow retrieval on Organizations list page
      const { error: roleError } = await supabase
        .from("organization_followers")
        .insert([{
          organization_id: orgData.id,
          user_id: user.id
        }])

      if (roleError) throw roleError

      // Format organization for Zustand store selection
      const formattedOrg = {
        id: orgData.id,
        name: orgData.organization_name,
        slug: orgData.slug,
        description: orgData.description || "",
        isActive: orgData.status === "active",
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
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold rounded-full uppercase ml-2">
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

            {/* Email Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="org-email" className="text-sm font-medium text-foreground">
                  Correo Electrónico <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Correo oficial para notificaciones y contacto de eventos.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="org-email"
                  type="email"
                  placeholder="contacto@miorganizacion.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                  disabled={isSubmitting}
                />
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

            {/* Phone Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="org-phone" className="text-sm font-medium text-foreground">Teléfono de Contacto</label>
                <p className="text-xs text-muted-foreground">Número de teléfono oficial de la organización.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="org-phone"
                  type="tel"
                  placeholder="Ej. +51 987654321"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Address Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="org-address" className="text-sm font-medium text-foreground">Dirección Física</label>
                <p className="text-xs text-muted-foreground">Ubicación de la oficina o sede principal.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="org-address"
                  type="text"
                  placeholder="Ej. Av. Larco 123, Miraflores"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Document Number Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="org-doc" className="text-sm font-medium text-foreground">Número de Documento Fiscal</label>
                <p className="text-xs text-muted-foreground">Identificación tributaria legal (RUC, NIT, RFC, etc.).</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="org-doc"
                  type="text"
                  placeholder="Ej. 20123456789"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Brand Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="org-brand" className="text-sm font-medium text-foreground">Marca comercial</label>
                <p className="text-xs text-muted-foreground">Nombre corto o marca con la que se conoce a la organización.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="org-brand"
                  type="text"
                  placeholder="Ej. TechLatam"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Logo URL Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="org-logo" className="text-sm font-medium text-foreground">URL del Logotipo</label>
                <p className="text-xs text-muted-foreground">Enlace directo a una imagen cuadrada de tu logo.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="org-logo"
                  type="url"
                  placeholder="https://ejemplo.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className={errors.logoUrl ? "border-destructive focus-visible:ring-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.logoUrl && (
                  <p className="text-xs text-destructive mt-1.5 font-medium">{errors.logoUrl}</p>
                )}
              </div>
            </div>

            {/* Cover URL Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="org-cover" className="text-sm font-medium text-foreground">URL de Imagen de Portada</label>
                <p className="text-xs text-muted-foreground">Enlace directo a una imagen de banner para tu organización.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="org-cover"
                  type="url"
                  placeholder="https://ejemplo.com/cover.png"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className={errors.coverUrl ? "border-destructive focus-visible:ring-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.coverUrl && (
                  <p className="text-xs text-destructive mt-1.5 font-medium">{errors.coverUrl}</p>
                )}
              </div>
            </div>

            {/* Primary Color Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="org-color" className="text-sm font-medium text-foreground">Color Primario de Marca</label>
                <p className="text-xs text-muted-foreground">Código de color hexadecimal representativo de la marca.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full font-mono">
                <Input
                  id="org-color"
                  type="text"
                  placeholder="Ej. #7C3AED"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className={errors.primaryColor ? "border-destructive focus-visible:ring-destructive" : ""}
                  disabled={isSubmitting}
                />
                {errors.primaryColor && (
                  <p className="text-xs text-destructive mt-1.5 font-medium">{errors.primaryColor}</p>
                )}
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
