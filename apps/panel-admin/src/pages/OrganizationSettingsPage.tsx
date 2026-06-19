import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview"
import { X } from "lucide-react"

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
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  documentNumber: z.string().optional(),
  brand: z.string().optional(),
  logoUrl: z.string().url("Enlace de logo inválido").or(z.literal("")).optional(),
  coverUrl: z.string().url("Enlace de portada inválido").or(z.literal("")).optional(),
  faviconUrl: z.string().url("Enlace de favicon inválido").or(z.literal("")).optional(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color hexadecimal inválido (ej. #7C3AED)").or(z.literal("")).optional(),
})

type OrganizationInput = z.infer<typeof organizationSchema>

export function OrganizationSettingsPage() {
  const navigate = useNavigate()
  const { selectedOrganization, selectOrganization, setOrganizations, organizations } = useAuthStore()

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
  const [contactPhone, setContactPhone] = useState("")
  const [address, setAddress] = useState("")
  const [documentNumber, setDocumentNumber] = useState("")
  const [brand, setBrand] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [faviconUrl, setFaviconUrl] = useState("")
  const [primaryColor, setPrimaryColor] = useState("")
  const [branches, setBranches] = useState<any[]>([])

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
          let loadedEmails: string[] = []
          if (Array.isArray(data.organization_email)) {
            loadedEmails = data.organization_email.filter(Boolean)
          } else if (typeof data.organization_email === "string") {
            loadedEmails = data.organization_email.split(",").map((e: string) => e.trim()).filter(Boolean)
          }
          setEmails(loadedEmails)
          setSlug(data.slug || "")
          setDescription(data.description || "")
          setContactPhone(data.contact_phone || "")
          setAddress(data.address || "")
          setDocumentNumber(data.document_number || "")
          setBrand(data.brand || "")
          setLogoUrl(data.logo_url || "")
          setCoverUrl(data.cover_image_url || "")
          setFaviconUrl(data.favicon_url || "")
          setPrimaryColor(data.primary_color || "")
        }

        // Fetch branches for this organization
        const { data: branchesData, error: branchesError } = await supabase
          .from("organization_branches")
          .select("*")
          .eq("organization_id", selectedOrganization.id)
          .order("is_main", { ascending: false })
          .order("created_at", { ascending: true })

        if (!branchesError) {
          setBranches(branchesData || [])
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
      contactPhone,
      address,
      documentNumber,
      brand,
      logoUrl,
      coverUrl,
      faviconUrl,
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
          organization_email: currentEmails,
          slug,
          description: description || null,
          contact_phone: contactPhone || null,
          address: address || null,
          document_number: documentNumber || null,
          brand: brand || null,
          logo_url: logoUrl || null,
          cover_image_url: coverUrl || null,
          favicon_url: faviconUrl || null,
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
        type,
        logoUrl,
        coverUrl,
        faviconUrl,
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
              />
              {errors.logoUrl && (
                <p className="text-xs text-destructive mt-1.5 font-medium">{errors.logoUrl}</p>
              )}
            </div>
          </div>

          {/* Cover URL Row */}
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
              />
              {errors.coverUrl && (
                <p className="text-xs text-destructive mt-1.5 font-medium">{errors.coverUrl}</p>
              )}
            </div>
          </div>

          {/* Favicon URL Row */}
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
              />
              {errors.faviconUrl && (
                <p className="text-xs text-destructive mt-1.5 font-medium">{errors.faviconUrl}</p>
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

      {/* Branches Section */}
      <div className="mt-10 space-y-4">
        {/* Section title above card container matching the image */}
        <h3 className="text-xl tracking-tight text-foreground font-sans">
          Sedes de la organización
        </h3>

        {/* Card Container faithful to the mockup */}
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
          {/* Header Row */}
          <div className="p-6 flex items-center justify-between gap-4 border-b border-border bg-card">
            <div className="space-y-1">
              <h4 className="font-semibold text-base text-foreground font-sans">
                Acceso a Sedes
              </h4>
              <p className="text-xs text-muted-foreground font-sans">
                Todas las sucursales, oficinas y ubicaciones físicas autorizadas en esta organización.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/dashboard/settings/branches")}
              className="border border-border hover:bg-muted text-foreground px-3.5 py-2 rounded-lg text-xs font-semibold select-none transition-colors cursor-pointer outline-none font-sans"
            >
              Gestionar sedes
            </button>
          </div>

          {/* List of sedes like members in mockup */}
          {branches.length > 0 ? (
            <div className="w-full">
              {/* Sub-Header Column Labels */}
              <div className="grid grid-cols-2 px-6 py-3 border-b border-border bg-muted/15 text-[10px] font-bold tracking-wider text-muted-foreground/80 font-mono uppercase">
                <div>Sede</div>
                <div className="text-right">Ubicación / Rol</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border/60">
                {branches.map((branch) => (
                  <div key={branch.id} className="grid grid-cols-2 px-6 py-4 items-center text-sm hover:bg-muted/5 transition-colors font-sans">
                    {/* Left details */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{branch.name}</span>
                      {branch.is_main && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-bold uppercase tracking-wider font-sans">
                          Principal
                        </span>
                      )}
                      {!branch.is_active && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted border border-border text-muted-foreground font-bold uppercase tracking-wider font-sans">
                          Inactivo
                        </span>
                      )}
                    </div>

                    {/* Right details */}
                    <div className="text-right text-muted-foreground text-xs font-normal">
                      {branch.address ? (
                        <span>
                          {branch.address}
                          {(branch.district || branch.province) && " ("}
                          {[branch.district, branch.province].filter(Boolean).join(", ")}
                          {(branch.district || branch.province) && ")"}
                        </span>
                      ) : (
                        <span>{[branch.district, branch.province, branch.department].filter(Boolean).join(", ") || "Sin ubicación"}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground italic font-sans">
              No hay sedes registradas para esta organización. Haz clic en "Gestionar sedes" para añadir una.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
