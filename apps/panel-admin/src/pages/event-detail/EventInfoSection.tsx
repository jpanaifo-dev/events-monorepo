import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { z } from "zod"
import { useEventStore } from "@/store/event.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

import { useSEO } from "@/hooks/use-seo"
import { PageHeader } from "@/components/page-header"
import { api } from "@/api/client"

export function EventInfoSection() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { events, updateEvent, deleteEvent } = useEventStore()
  const event = events.find((e) => e.id === id)

  useSEO({
    title: event ? `${event.name} - General` : "Detalle de Evento",
    description: event?.shortDescription || "Gestiona la información principal, colores de marca y estado del evento en Zynqro ."
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
  const [eventMode, setEventMode] = useState("")
  const [venueAddress, setVenueAddress] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [contacts, setContacts] = useState<any[]>([])
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", role: "" })
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [brandPrimary, setBrandPrimary] = useState("#000000")
  const [brandSecondary, setBrandSecondary] = useState("#ffffff")
  const [socialTwitter, setSocialTwitter] = useState("")
  const [socialFacebook, setSocialFacebook] = useState("")
  const [socialLinkedin, setSocialLinkedin] = useState("")
  const [socialInstagram, setSocialInstagram] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")

  useEffect(() => {
    if (event) {
      setName(event.name || "")
      setShortDescription(event.shortDescription || "")
      setAbout(typeof event.about === "object" && event.about?.es ? event.about.es : typeof event.about === "string" ? event.about : "")
      setCoverUrl(event.coverUrl || "")
      setLogoUrl(event.logoUrl || "")
      setStatus(event.status || "draft")
      setIsActive(event.isActive !== false)
      setWebsiteUrl(event.websiteUrl || "")
      setContactEmail(event.contactEmail || "")
      setEventMode(event.eventMode || "")
      setVenueAddress(event.venueAddress || "")
      setLatitude(event.latitude?.toString() || "")
      setLongitude(event.longitude?.toString() || "")
      setBrandPrimary(event.brandColors?.primary || "#000000")
      setBrandSecondary(event.brandColors?.secondary || "#ffffff")
      setSocialTwitter(event.socialLinks?.twitter || "")
      setSocialFacebook(event.socialLinks?.facebook || "")
      setSocialLinkedin(event.socialLinks?.linkedin || "")
      setSocialInstagram(event.socialLinks?.instagram || "")
    }
  }, [event])
  useEffect(() => { if (event?.id) api.events.contacts(event.id).then(setContacts).catch(() => setContacts([])) }, [event?.id])

  if (!event) return null

  const editEventSchema = z.object({
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

    const validation = editEventSchema.safeParse({
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
    setIsSubmitting(true)
    try {
      await updateEvent(event.id, {
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        about: about.trim() ? { es: about.trim() } : "",
        coverUrl: coverUrl.trim() || "",
        logoUrl: logoUrl.trim() || "",
        status,
        isActive,
        websiteUrl: websiteUrl.trim() || "",
        contactEmail: contactEmail.trim() || "",
        eventMode,
        venueAddress: venueAddress.trim() || "",
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        brandColors: { primary: brandPrimary, secondary: brandSecondary },
        socialLinks: {
          twitter: socialTwitter.trim(),
          facebook: socialFacebook.trim(),
          linkedin: socialLinkedin.trim(),
          instagram: socialInstagram.trim(),
        },
      })
      toast.success("Evento actualizado exitosamente")
    } catch (err) {
      console.error(err)
      toast.error("Error al actualizar el evento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteEvent(event.id)
      toast.success("Evento eliminado exitosamente")
      navigate("/dashboard/events")
    } catch {
      toast.error("Error al eliminar el evento.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        title="Información General"
        description="Gestiona la información básica, portada, logo, colores de marca y visibilidad del evento."
      />
      {/* Informacion Basica */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="evt-name" className="text-sm font-medium text-foreground">
              Nombre del Evento <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground">Nombre publico del evento.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input id="evt-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="bg-background" />
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
            <Input id="evt-short-desc" type="text" required value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="bg-background" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="evt-about" className="text-sm font-medium text-foreground">Descripcion Detallada</label>
            <p className="text-xs text-muted-foreground">Detalla los objetivos, agenda y propuesta de valor.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <textarea id="evt-about" rows={4} value={about} onChange={(e) => setAbout(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="evt-cover" className="text-sm font-medium text-foreground">Portada del Evento</label>
            <p className="text-xs text-muted-foreground">Imagen de portada del evento.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <ImageUploadWithPreview
              value={coverUrl}
              onChange={setCoverUrl}
              label=""
              aspectRatio="banner"
              folder={`events/${event.id}`}
              identifier="cover"
              placeholder="Arrastra o pega una imagen de portada"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="evt-logo" className="text-sm font-medium text-foreground">Logo del Evento</label>
            <p className="text-xs text-muted-foreground">Logo o marca del evento.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <ImageUploadWithPreview
              value={logoUrl}
              onChange={setLogoUrl}
              label=""
              aspectRatio="square"
              folder={`events/${event.id}`}
              identifier="logo"
              placeholder="Arrastra o pega el logo"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="evt-status" className="text-sm font-medium text-foreground">Estado</label>
            <p className="text-xs text-muted-foreground">Define si estara visible inmediatamente.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <select id="evt-status" value={status} onChange={(e: any) => setStatus(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground">
              <option value="draft">Borrador (Oculto)</option>
              <option value="published">Publicado (Visible)</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
        </div>
      </div>

      <h2 className="text-lg">Contactos</h2>
      <div className="border border-border rounded-xl bg-card p-6 space-y-4 mb-6">
        <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{contacts.length ? `${contacts.length} contacto${contacts.length === 1 ? "" : "s"} añadido${contacts.length === 1 ? "" : "s"}` : "Ningún contacto añadido"}</p><AlertDialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}><AlertDialogTrigger asChild><Button type="button">Añadir contacto</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Añadir contacto</AlertDialogTitle><AlertDialogDescription>Registra una persona de contacto para consultas y coordinación del evento.</AlertDialogDescription></AlertDialogHeader><div className="grid gap-3 py-4"><Input placeholder="Nombre" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} /><Input placeholder="Correo" type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} /><Input placeholder="Teléfono" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} /><Input placeholder="Cargo" value={newContact.role} onChange={(e) => setNewContact({ ...newContact, role: e.target.value })} /></div><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><Button type="button" onClick={async () => { if (!newContact.name.trim()) return; const created = await api.events.addContact(event.id, newContact); setContacts([...contacts, created]); setNewContact({ name: "", email: "", phone: "", role: "" }); setContactDialogOpen(false) }}>Guardar contacto</Button></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
        <div className="overflow-hidden rounded-md border"><div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground"><span>Contacto</span><span>Correo</span><span>Teléfono</span><span>Acciones</span></div>{contacts.length === 0 ? <div className="px-4 py-8 text-center text-sm text-muted-foreground">Ningún contacto añadido</div> : contacts.map((contact) => <div key={contact.id} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-3 border-b px-4 py-3 text-sm last:border-0"><span className="font-medium">{contact.name}{contact.role ? <small className="ml-2 text-muted-foreground">{contact.role}</small> : null}</span><span className="text-muted-foreground">{contact.email || "—"}</span><span className="text-muted-foreground">{contact.phone || "—"}</span><Button type="button" variant="ghost" size="sm" onClick={async () => { await api.events.removeContact(contact.id); setContacts(contacts.filter((item) => item.id !== contact.id)) }}>Eliminar</Button></div>)}</div>
      </div>

      <h2 className="text-lg">Modalidad y ubicación</h2>
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm mb-6">
        <div className="p-6 space-y-4">
          <div><label className="text-sm font-medium">Tipo de evento</label><select value={eventMode} onChange={(e) => setEventMode(e.target.value)} className="mt-2 w-full max-w-md h-9 rounded-md border bg-background px-3 text-sm"><option value="">Selecciona una modalidad</option><option value="PHYSICAL">Presencial</option><option value="ONLINE">Virtual</option><option value="HYBRID">Híbrido</option></select></div>
          {eventMode !== "ONLINE" && eventMode && <><div><label className="text-sm font-medium">Dirección</label><Input className="mt-2 max-w-md bg-background" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} placeholder="Dirección del evento" /></div><div className="grid max-w-md grid-cols-2 gap-3"><Input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitud" /><Input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitud" /></div><iframe title="Ubicación del evento" className="h-48 w-full max-w-2xl rounded-md border" src={`https://www.openstreetmap.org/export/embed.html?layer=mapnik${latitude && longitude ? `&marker=${latitude}%2C${longitude}` : ""}`} /></>}
          <p className="text-xs text-muted-foreground">La ubicación se guarda junto con la información general del evento.</p>
        </div>
      </div>

      <h2 className="text-lg">Contacto y Enlaces</h2>
      {/* Contacto y Enlaces */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        {false && <>
        </>}
        <div style={{ display: "none" }} className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="evt-email" className="text-sm font-medium text-foreground">Email de Contacto</label>
            <p className="text-xs text-muted-foreground">Correo para consultas del evento.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input id="evt-email" type="email" placeholder="contacto@evento.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="bg-background" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="evt-website" className="text-sm font-medium text-foreground">Sitio Web</label>
            <p className="text-xs text-muted-foreground">URL del sitio oficial del evento.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input id="evt-website" type="url" placeholder="https://evento.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="bg-background" />
          </div>
        </div>

        <div className="p-6 space-y-4">
          <label className="text-sm font-medium text-foreground">Redes Sociales</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="url" placeholder="Twitter / X URL" value={socialTwitter} onChange={(e) => setSocialTwitter(e.target.value)} className="bg-background" />
            <Input type="url" placeholder="Facebook URL" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} className="bg-background" />
            <Input type="url" placeholder="LinkedIn URL" value={socialLinkedin} onChange={(e) => setSocialLinkedin(e.target.value)} className="bg-background" />
            <Input type="url" placeholder="Instagram URL" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} className="bg-background" />
          </div>
        </div>
      </div>

      <h2 style={{ display: "none" }} className="text-lg">Colores del Evento</h2>
      {/* Colores de Marca */}
      <div style={{ display: "none" }} className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
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

      {/* Zona de Peligro */}
      <div className="border border-destructive/30 rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="p-6 border-b border-destructive/20 bg-destructive/5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-destructive">Zona de Peligro</h2>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
          <div className="md:w-2/3 space-y-1">
            <p className="text-sm font-medium text-foreground">Eliminar este evento</p>
            <p className="text-xs text-muted-foreground">Se eliminaran todas sus ediciones, ponentes, agenda y participantes. Esta accion no se puede deshacer.</p>
          </div>
          <div className="md:w-1/3 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm" disabled={isDeleting} className="cursor-pointer gap-2">
                  <Trash2 className="size-4" />
                  Eliminar Evento
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estas seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará permanentemente "{event.name}" y todos sus datos asociados. Esta accion no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <Input value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="Escribe ELIMINAR" />
                  <AlertDialogAction disabled={deleteConfirmation !== "ELIMINAR"} onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Footer fijo */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/80 px-8 py-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-end gap-3 w-full">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard/events")} disabled={isSubmitting} className="cursor-pointer">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || isDeleting} className="cursor-pointer font-semibold">
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </form>
  )
}
