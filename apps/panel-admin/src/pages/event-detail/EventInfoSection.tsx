import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import { Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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

export function EventInfoSection() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { events, updateEvent, deleteEvent } = useEventStore()
  const event = events.find((e) => e.id === id)

  const [name, setName] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (event) {
      setName(event.name)
      setShortDescription(event.shortDescription)
      setContactEmail(event.contactEmail)
      setWebsiteUrl(event.websiteUrl)
      setStatus(event.status)
    }
  }, [event])

  if (!event) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateEvent(event.id, {
        name,
        shortDescription,
        contactEmail,
        websiteUrl,
        status,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    deleteEvent(event.id)
    navigate("/dashboard/events")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-border pb-3">
        <h3 className="text-lg font-bold">Editar Evento</h3>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="evName">Nombre del Evento</FieldLabel>
            <Input
              id="evName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="evDesc">Descripción Corta</FieldLabel>
            <textarea
              id="evDesc"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="evEmail">Email de Contacto</FieldLabel>
              <Input
                id="evEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="evWebsite">Sitio Web</FieldLabel>
              <Input
                id="evWebsite"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="evStatus">Estado</FieldLabel>
            <select
              id="evStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published" | "archived")}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm outline-none"
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </Field>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" className="text-xs h-9" size="sm">
                  <Trash2 className="size-3.5 mr-1.5" />
                  Eliminar Evento
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar este evento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará permanentemente "{event.name}" y todas sus ediciones, ponentes, agenda y participantes. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button type="submit" disabled={isSaving} className="font-semibold">
              <Save className="size-4 mr-1.5" />
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
