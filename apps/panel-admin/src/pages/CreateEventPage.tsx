import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { useAuthStore } from "@/store/auth.store"
import { useEventStore } from "@/store/event.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { CalendarDays } from "lucide-react"
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview"

import { useSEO } from "@/hooks/use-seo"

export function CreateEventPage() {
  const navigate = useNavigate()
  const { selectedOrganization } = useAuthStore()
  const { addEvent, addEdition } = useEventStore()

  useSEO({
    title: "Crear Evento",
    description: "Registra y configura un nuevo evento con su información básica, redes sociales y detalles generales en Zynqro ."
  })

  const [name, setName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [about, setAbout] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [brandPrimary, setBrandPrimary] = useState("#000000")
  const [brandSecondary, setBrandSecondary] = useState("#ffffff")
  const [socialTwitter, setSocialTwitter] = useState("")
  const [socialFacebook, setSocialFacebook] = useState("")
  const [socialLinkedin, setSocialLinkedin] = useState("")
  const [socialInstagram, setSocialInstagram] = useState("")

  const [createEdition, setCreateEdition] = useState(false)
  const [editionName, setEditionName] = useState("")
  const [editionStartDate, setEditionStartDate] = useState("")
  const [editionEndDate, setEditionEndDate] = useState("")
  const [editionIsCurrent, setEditionIsCurrent] = useState(true)
  const [editionLocation, setEditionLocation] = useState("")
  const [editionModality, setEditionModality] = useState("presencial")

  const [isSubmitting, setIsSubmitting] = useState(false)

  const createEventSchema = z.object({
    name: z.string().trim().min(1, "El nombre del evento es obligatorio."),
    shortDescription: z.string().trim().min(1, "La descripcion corta es obligatoria."),
    contactEmail: z.string().trim().email("El correo de contacto no es valido.").or(z.literal("")).optional(),
    websiteUrl: z.string().trim().url("El sitio web no es valido (debe empezar con http:// o https://).").or(z.literal("")).optional(),
    socialTwitter: z.string().trim().url("El enlace de Twitter/X no es valido (debe empezar con http:// o https://).").or(z.literal("")).optional(),
    socialFacebook: z.string().trim().url("El enlace de Facebook no es valido (debe empezar con http:// o https://).").or(z.literal("")).optional(),
    socialLinkedin: z.string().trim().url("El enlace de LinkedIn no es valido (debe empezar con http:// o https://).").or(z.literal("")).optional(),
    socialInstagram: z.string().trim().url("El enlace de Instagram no es valido (debe empezar con http:// o https://).").or(z.literal("")).optional(),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrganization?.id) {
      toast.error("No se ha seleccionado ninguna organizacion activa.")
      return
    }

    const validation = createEventSchema.safeParse({
      name,
      shortDescription,
      contactEmail,
      websiteUrl,
      socialTwitter,
      socialFacebook,
      socialLinkedin,
      socialInstagram,
    })

    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    if (createEdition && !editionName.trim()) {
      toast.error("El nombre de la edicion es obligatorio.")
      return
    }

    setIsSubmitting(true)
    try {
      const eventId = await addEvent({
        organizationId: selectedOrganization.id,
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        about: about.trim() ? { es: about.trim() } : "",
        coverUrl: coverUrl.trim() || "",
        logoUrl: logoUrl.trim() || "",
        brandColors: { primary: brandPrimary, secondary: brandSecondary },
        status,
        isActive: true,
        websiteUrl: websiteUrl.trim() || "",
        contactEmail: contactEmail.trim() || "",
        socialLinks: {
          twitter: socialTwitter.trim(),
          facebook: socialFacebook.trim(),
          linkedin: socialLinkedin.trim(),
          instagram: socialInstagram.trim(),
        },
        settings: {},
        coverFile,
        logoFile,
      })

      const createdEvent = useEventStore.getState().events.find((e) => e.id === eventId)
      const finalCoverUrl = createdEvent?.coverUrl || ""

      if (createEdition && editionName.trim()) {
        await addEdition({
          mainEventId: eventId,
          name: editionName.trim(),
          description: "",
          coverUrl: finalCoverUrl,
          startDate: editionStartDate || "",
          endDate: editionEndDate || "",
          isCurrent: editionIsCurrent,
          location: editionLocation,
          modality: editionModality,
        })
      }

      toast.success("Evento creado exitosamente")
      navigate("/dashboard/events")
    } catch (err: any) {
      console.error(err)
      toast.error("Error al crear el evento. Intentalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full pb-28">
        <div className="mb-10">
          <PageHeader
            title="Crear un Nuevo Evento"
            description="Registra una nueva conferencia, taller o congreso con toda la informacion correspondiente para tus asistentes."
            showBackButton
            onBackClick={() => navigate("/dashboard/events")}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Informacion Basica</h2>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-name" className="text-sm font-medium text-foreground">
                  Nombre del Evento <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Nombre publico del evento.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="evt-name"
                  type="text"
                  required
                  placeholder="Ej. Congreso Anual de Tecnologia 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-short-desc" className="text-sm font-medium text-foreground">
                  Descripcion Corta <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Un resumen breve para las tarjetas del catalogo.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="evt-short-desc"
                  type="text"
                  required
                  placeholder="Resumen del evento en un par de frases..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-about" className="text-sm font-medium text-foreground">
                  Descripcion Detallada
                </label>
                <p className="text-xs text-muted-foreground">Detalla los objetivos, agenda y propuesta de valor.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <textarea
                  id="evt-about"
                  rows={4}
                  placeholder="Explica detalladamente de que se trata el evento..."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">Portada del Evento</label>
                <p className="text-xs text-muted-foreground">Sube la portada oficial o pega un enlace directo.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <ImageUploadWithPreview
                  value={coverUrl}
                  onChange={(newVal) => {
                    setCoverUrl(newVal)
                    if (!newVal) setCoverFile(null)
                  }}
                  onFileSelect={setCoverFile}
                  label=""
                  aspectRatio="banner"
                  folder="events/temp"
                  identifier="cover"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">Logo del Evento</label>
                <p className="text-xs text-muted-foreground">Sube el logo de la marca o pega un enlace directo.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <ImageUploadWithPreview
                  value={logoUrl}
                  onChange={(newVal) => {
                    setLogoUrl(newVal)
                    if (!newVal) setLogoFile(null)
                  }}
                  onFileSelect={setLogoFile}
                  label=""
                  aspectRatio="square"
                  folder="events/temp"
                  identifier="logo"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-status" className="text-sm font-medium text-foreground">
                  Estado Inicial
                </label>
                <p className="text-xs text-muted-foreground">Define si estara visible inmediatamente.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <select
                  id="evt-status"
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                >
                  <option value="draft">Borrador (Oculto)</option>
                  <option value="published">Publicado (Visible)</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact & Links */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Contacto y Enlaces</h2>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-email" className="text-sm font-medium text-foreground">
                  Email de Contacto
                </label>
                <p className="text-xs text-muted-foreground">Correo para consultas del evento.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="evt-email"
                  type="email"
                  placeholder="contacto@evento.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-website" className="text-sm font-medium text-foreground">
                  Sitio Web
                </label>
                <p className="text-xs text-muted-foreground">URL del sitio oficial del evento.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="evt-website"
                  type="url"
                  placeholder="https://evento.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="p-6 space-y-4">
              <label className="text-sm font-medium text-foreground">Redes Sociales</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="url"
                  placeholder="Twitter / X URL"
                  value={socialTwitter}
                  onChange={(e) => setSocialTwitter(e.target.value)}
                  className="bg-background"
                />
                <Input
                  type="url"
                  placeholder="Facebook URL"
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  className="bg-background"
                />
                <Input
                  type="url"
                  placeholder="LinkedIn URL"
                  value={socialLinkedin}
                  onChange={(e) => setSocialLinkedin(e.target.value)}
                  className="bg-background"
                />
                <Input
                  type="url"
                  placeholder="Instagram URL"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Colores de Marca</h2>
            </div>
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Primario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandPrimary}
                    onChange={(e) => setBrandPrimary(e.target.value)}
                    className="size-8 rounded border border-border cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={brandPrimary}
                    onChange={(e) => setBrandPrimary(e.target.value)}
                    className="w-24 bg-background text-xs font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Secundario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandSecondary}
                    onChange={(e) => setBrandSecondary(e.target.value)}
                    className="size-8 rounded border border-border cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={brandSecondary}
                    onChange={(e) => setBrandSecondary(e.target.value)}
                    className="w-24 bg-background text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Optional First Edition */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createEdition}
                  onChange={(e) => setCreateEdition(e.target.checked)}
                  className="accent-primary size-4"
                />
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Crear primera edicion ahora</span>
                </div>
              </label>
              <p className="text-xs text-muted-foreground mt-1 ml-7">
                Opcional: configura la primera edicion (ano, fechas) junto con el evento.
              </p>
            </div>

            {createEdition && (
              <div className="space-y-0 animate-in slide-in-from-top-1 duration-200">
                <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
                  <div className="md:w-1/3 space-y-1">
                    <label htmlFor="ed-name" className="text-sm font-medium text-foreground">
                      Nombre de la Edicion <span className="text-destructive">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground">Ej. Edicion 2026</p>
                  </div>
                  <div className="md:w-2/3 max-w-md w-full">
                    <Input
                      id="ed-name"
                      type="text"
                      required={createEdition}
                      placeholder="Ej. Edicion 2026"
                      value={editionName}
                      onChange={(e) => setEditionName(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
                  <div className="md:w-1/3 space-y-1">
                    <label className="text-sm font-medium text-foreground">Fechas de la Edicion</label>
                    <p className="text-xs text-muted-foreground">Cuando se lleva a cabo esta edicion.</p>
                  </div>
                  <div className="md:w-2/3 max-w-md w-full">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Inicio</label>
                        <Input
                          type="date"
                          value={editionStartDate}
                          onChange={(e) => setEditionStartDate(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Fin</label>
                        <Input
                          type="date"
                          value={editionEndDate}
                          onChange={(e) => setEditionEndDate(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
                    <div className="md:w-1/3 space-y-1">
                      <label className="text-sm font-medium text-foreground">Modalidad de la Edición</label>
                      <p className="text-xs text-muted-foreground">Formato de realización de esta edición.</p>
                    </div>
                    <div className="md:w-2/3 max-w-md w-full">
                      <select
                        id="ed-modality"
                        value={editionModality}
                        onChange={(e) => setEditionModality(e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                      >
                        <option value="presencial">Presencial</option>
                        <option value="virtual">Virtual</option>
                        <option value="hibrido">Híbrido</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
                    <div className="md:w-1/3 space-y-1">
                      <label className="text-sm font-medium text-foreground">Ubicación o Enlace</label>
                      <p className="text-xs text-muted-foreground">Lugar físico, ciudad o enlace de transmisión.</p>
                    </div>
                    <div className="md:w-2/3 max-w-md w-full">
                      <Input
                        id="ed-location"
                        type="text"
                        placeholder="Ej. Hotel Savoy o Zoom Link"
                        value={editionLocation}
                        onChange={(e) => setEditionLocation(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4">
                  <div className="md:w-1/3 space-y-1">
                    <label className="text-sm font-medium text-foreground">Edicion Activa</label>
                    <p className="text-xs text-muted-foreground">Marcar como edicion actual y vigente.</p>
                  </div>
                  <div className="md:w-2/3 max-w-md w-full">
                    <label className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={editionIsCurrent}
                        onChange={(e) => setEditionIsCurrent(e.target.checked)}
                        className="accent-primary size-4"
                      />
                      <span className="text-sm text-foreground">Es la edicion actual</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Action Footer */}
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/80 px-8 py-4 backdrop-blur-md">
            <div className="max-w-4xl mx-auto flex justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/events")}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer font-semibold"
              >
                {isSubmitting ? "Guardando..." : "Crear Evento"}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
