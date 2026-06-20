import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Trash2 } from "lucide-react"

import { useSEO } from "@/hooks/use-seo"

export function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { events, updateEvent, deleteEvent } = useEventStore()

  const event = events.find((e) => e.id === id)

  useSEO({
    title: event ? `Editar: ${event.name}` : "Editar Evento",
    description: "Modifica los datos generales, descripción, imagen de portada, redes sociales y colores corporativos de tu evento en EventHive."
  })

  const [name, setName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [about, setAbout] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft")
  const [isActive, setIsActive] = useState(true)
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [brandPrimary, setBrandPrimary] = useState("#000000")
  const [brandSecondary, setBrandSecondary] = useState("#ffffff")
  const [socialTwitter, setSocialTwitter] = useState("")
  const [socialFacebook, setSocialFacebook] = useState("")
  const [socialLinkedin, setSocialLinkedin] = useState("")
  const [socialInstagram, setSocialInstagram] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (event) {
      setName(event.name || "")
      setShortDescription(event.shortDescription || "")
      setAbout(typeof event.about === "object" && event.about?.es ? event.about.es : "")
      setCoverUrl(event.coverUrl || "")
      setLogoUrl(event.logoUrl || "")
      setStatus(event.status || "draft")
      setIsActive(event.isActive !== false)
      setWebsiteUrl(event.websiteUrl || "")
      setContactEmail(event.contactEmail || "")
      setBrandPrimary(event.brandColors?.primary || "#000000")
      setBrandSecondary(event.brandColors?.secondary || "#ffffff")
      setSocialTwitter(event.socialLinks?.twitter || "")
      setSocialFacebook(event.socialLinks?.facebook || "")
      setSocialLinkedin(event.socialLinks?.linkedin || "")
      setSocialInstagram(event.socialLinks?.instagram || "")
    } else {
      toast.error("Evento no encontrado.")
      navigate("/dashboard/events")
    }
  }, [event, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    if (!name.trim()) {
      toast.error("El nombre del evento es obligatorio.")
      return
    }

    setIsSubmitting(true)
    try {
      await updateEvent(id, {
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        about: about.trim() ? { es: about.trim() } : "",
        coverUrl: coverUrl.trim() || "",
        logoUrl: logoUrl.trim() || "",
        status,
        isActive,
        websiteUrl: websiteUrl.trim() || "",
        contactEmail: contactEmail.trim() || "",
        brandColors: { primary: brandPrimary, secondary: brandSecondary },
        socialLinks: {
          twitter: socialTwitter.trim(),
          facebook: socialFacebook.trim(),
          linkedin: socialLinkedin.trim(),
          instagram: socialInstagram.trim(),
        },
      })

      toast.success("Evento actualizado exitosamente")
      navigate(`/dashboard/events/${id}`)
    } catch (err: any) {
      console.error(err)
      toast.error("Error al actualizar el evento. Intentalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm("Estas seguro de que deseas eliminar permanentemente este evento y todas sus ediciones, ponentes y actividades asociadas? Esta accion no se puede deshacer.")) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteEvent(id)
      toast.success("Evento eliminado exitosamente")
      navigate("/dashboard/events")
    } catch (err) {
      console.error(err)
      toast.error("Error al eliminar el evento.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full pb-28">
        <div className="mb-10">
          <PageHeader
            title="Editar Evento"
            description="Realiza cambios en los datos del evento o estado de publicacion."
            showBackButton
            onBackClick={() => navigate(`/dashboard/events/${id}`)}
            actionButton={
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="cursor-pointer gap-2 shrink-0 border border-destructive/20 hover:bg-destructive text-destructive-foreground transition-all"
              >
                <Trash2 className="size-4" />
                Eliminar Evento
              </Button>
            }
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
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="evt-name"
                  type="text"
                  required
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
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="evt-short-desc"
                  type="text"
                  required
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
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <textarea
                  id="evt-about"
                  rows={4}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-cover" className="text-sm font-medium text-foreground">URL de Portada</label>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input id="evt-cover" type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="bg-background" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-logo" className="text-sm font-medium text-foreground">URL del Logo</label>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input id="evt-logo" type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="bg-background" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-status" className="text-sm font-medium text-foreground">Estado</label>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <select
                  id="evt-status"
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
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
                <label htmlFor="evt-email" className="text-sm font-medium text-foreground">Email de Contacto</label>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input id="evt-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="bg-background" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-website" className="text-sm font-medium text-foreground">Sitio Web</label>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input id="evt-website" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="bg-background" />
              </div>
            </div>

            <div className="p-6 space-y-4">
              <label className="text-sm font-medium text-foreground">Redes Sociales</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input type="url" placeholder="Twitter / X" value={socialTwitter} onChange={(e) => setSocialTwitter(e.target.value)} className="bg-background" />
                <Input type="url" placeholder="Facebook" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} className="bg-background" />
                <Input type="url" placeholder="LinkedIn" value={socialLinkedin} onChange={(e) => setSocialLinkedin(e.target.value)} className="bg-background" />
                <Input type="url" placeholder="Instagram" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} className="bg-background" />
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
                  <input type="color" value={brandPrimary} onChange={(e) => setBrandPrimary(e.target.value)} className="size-8 rounded border border-border cursor-pointer" />
                  <Input type="text" value={brandPrimary} onChange={(e) => setBrandPrimary(e.target.value)} className="w-24 bg-background text-xs font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Secundario</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={brandSecondary} onChange={(e) => setBrandSecondary(e.target.value)} className="size-8 rounded border border-border cursor-pointer" />
                  <Input type="text" value={brandSecondary} onChange={(e) => setBrandSecondary(e.target.value)} className="w-24 bg-background text-xs font-mono" />
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Footer */}
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/80 px-8 py-4 backdrop-blur-md">
            <div className="max-w-4xl mx-auto flex justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/events/${id}`)}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="cursor-pointer font-semibold"
              >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
