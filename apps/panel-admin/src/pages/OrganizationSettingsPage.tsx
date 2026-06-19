import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"

const organizationSchema = z.object({
  name: z.string().min(3, "El nombre de la organización debe tener al menos 3 caracteres"),
  type: z.string().min(2, "El tipo de organización es requerido"),
  email: z.string().email("Correo electrónico inválido").or(z.literal("")).optional(),
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

export function OrganizationSettingsPage() {
  const navigate = useNavigate()
  const { selectedOrganization, selectOrganization, setOrganizations, organizations } = useAuthStore()

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
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")

  useEffect(() => {
    async function loadOrgDetails() {
      if (!selectedOrganization?.id) {
        navigate("/dashboard/organizations")
        return
      }
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", selectedOrganization.id)
          .single()

        if (error) throw error

        if (data) {
          setName(data.organization_name || "")
          setType(data.organization_type || "")
          setEmail(data.organization_email || "")
          setSlug(data.slug || "")
          setDescription(data.description || "")
          setContactPhone(data.contact_phone || "")
          setAddress(data.address || "")
          setDocumentNumber(data.document_number || "")
          setBrand(data.brand || "")
          setLogoUrl(data.logo_url || "")
          setCoverUrl(data.cover_image_url || "")
          setPrimaryColor(data.primary_color || "")
        }
      } catch (err) {
        console.error("Error loading organization settings:", err)
        toast.error("Error al cargar la información de la organización.")
      } finally {
        setIsLoading(false)
      }
    }

    loadOrgDetails()
  }, [selectedOrganization?.id, navigate])

  // Real-time slug availability check (excluding current organization)
  useEffect(() => {
    if (!slug || slug.length < 3 || !selectedOrganization?.id) {
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
          .neq("id", selectedOrganization.id)
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
  }, [slug, selectedOrganization?.id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrganization?.id) return

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

    if (slugStatus === "taken") {
      toast.error("El slug seleccionado ya está en uso por otra organización.")
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          organization_name: name,
          organization_type: type,
          organization_email: email || null,
          slug,
          description: description || null,
          contact_phone: contactPhone || null,
          address: address || null,
          document_number: documentNumber || null,
          brand: brand || null,
          logo_url: logoUrl || null,
          cover_image_url: coverUrl || null,
          primary_color: primaryColor || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedOrganization.id)

      if (error) throw error

      // Update auth store
      const updatedOrg = {
        ...selectedOrganization,
        name,
        slug,
        description: description || "",
      }
      selectOrganization(updatedOrg)

      const updatedList = organizations.map((org) =>
        org.id === selectedOrganization.id ? updatedOrg : org
      )
      setOrganizations(updatedList)

      toast.success("Organización actualizada con éxito")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error al actualizar la organización. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 w-full animate-pulse space-y-6">
        <div className="space-y-2 mb-10">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
        </div>
        <div className="border border-border rounded-xl bg-card p-6 space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-border gap-4">
              <div className="md:w-1/3 space-y-1">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted/60 rounded w-3/4" />
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <div className="h-10 bg-muted rounded w-full" />
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-4">
            <div className="h-10 w-24 bg-muted rounded" />
            <div className="h-10 w-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 w-full">
      <div className="mb-10">
        <PageHeader
          title="Ajustes de la Organización"
          description="Administra los datos públicos, comerciales y de contacto de tu organización."
        />
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="border border-border rounded-xl bg-card overflow-hidden">
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
              <label htmlFor="org-email" className="text-sm font-medium text-foreground">
                Correo Electrónico
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
              {slug.length >= 3 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs font-medium">
                  {slugStatus === "checking" && (
                    <span className="text-muted-foreground animate-pulse">Verificando disponibilidad...</span>
                  )}
                  {slugStatus === "available" && (
                    <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
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

          {/* Brand Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3 space-y-1">
              <label htmlFor="org-brand" className="text-sm font-medium text-foreground">Marca comercial</label>
              <p className="text-xs text-muted-foreground">Nombre corto o marca con la que se conoce a la organización. (Ej. TechLatam)</p>
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
              <p className="text-xs text-muted-foreground">Enlace directo a una imagen cuadrada de tu logo. (Ej. https://ejemplo.com/logo.png)</p>
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
              <p className="text-xs text-muted-foreground">Enlace directo a una imagen de banner para tu organización. (Ej. https://ejemplo.com/cover.png)</p>
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
              <p className="text-xs text-muted-foreground">Código de color hexadecimal representativo de la marca. (Ej. #7C3AED)</p>
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

          {/* Phone Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3 space-y-1">
              <label htmlFor="org-phone" className="text-sm font-medium text-foreground">Teléfono de Contacto</label>
              <p className="text-xs text-muted-foreground">Número de teléfono oficial de la organización. (Ej. +51 987654321)</p>
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

          {/* Actions Row */}
          <div className="bg-muted/10 px-6 py-4 flex justify-end gap-3">
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
    </div>
  )
}
