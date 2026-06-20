import React, { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { z } from "zod"
import { useEventStore } from "@/store/event.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"

import { useSEO } from "@/hooks/use-seo"

export function CreateEditionPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { events, addEdition } = useEventStore()

  const event = events.find((e) => e.id === eventId)

  useSEO({
    title: "Nueva Edición",
    description: event 
      ? `Añade una nueva edición anual o periódica para el evento ${event.name} en EventHive.`
      : "Crea una nueva edición de evento."
  })

  // Form states
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState<"active" | "planned">("planned")

  const [isSubmitting, setIsSubmitting] = useState(false)

  const editionSchema = z.object({
    name: z.string().trim().min(1, "El nombre de la edición es obligatorio."),
    coverUrl: z.string().trim().url("El enlace de portada no es válido.").or(z.literal("")).optional(),
    startDate: z.string().min(1, "La fecha de inicio es requerida."),
    endDate: z.string().min(1, "La fecha de fin es requerida."),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId) return

    const validation = editionSchema.safeParse({
      name,
      coverUrl,
      startDate,
      endDate,
    })

    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    setIsSubmitting(true)
    try {
      await addEdition({
        mainEventId: eventId,
        name: name.trim(),
        description: description.trim(),
        coverUrl: coverUrl.trim() || "",
        startDate: startDate || "",
        endDate: endDate || "",
        isCurrent: false,
      })

      toast.success("Edición creada exitosamente")
      navigate(`/dashboard/events/${eventId}`)
    } catch (err: any) {
      console.error(err)
      toast.error("Error al crear la edición. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <h3 className="font-bold text-lg">Evento no encontrado</h3>
          <p className="text-sm text-muted-foreground">El evento al cual deseas añadir una edición no existe.</p>
          <Button onClick={() => navigate("/dashboard/events")} variant="outline" className="w-full">
            Volver a Eventos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Main Settings Form Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full pb-28">
        <div className="mb-10">
          <PageHeader
            title="Crear una Nueva Edición"
            description={`Añade una edición anual, periódica o especial vinculada a ${event.name}.`}
            showBackButton
            onBackClick={() => navigate(`/dashboard/events/${eventId}`)}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            {/* Name Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="ed-name" className="text-sm font-medium text-foreground">
                  Nombre de la Edición <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Ej. Primera Edición, Edición 2026</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="ed-name"
                  type="text"
                  required
                  placeholder="Ej. Edición 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            {/* Description Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="ed-desc" className="text-sm font-medium text-foreground">
                  Descripción
                </label>
                <p className="text-xs text-muted-foreground">Resumen explicativo sobre los objetivos o enfoque de esta edición.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <textarea
                  id="ed-desc"
                  rows={3}
                  placeholder="Temática principal, lema de la edición..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                />
              </div>
            </div>

            {/* Cover Url Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="ed-cover" className="text-sm font-medium text-foreground">
                  Imagen de Portada
                </label>
                <p className="text-xs text-muted-foreground">Enlace de la imagen específica de esta edición.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="ed-cover"
                  type="url"
                  placeholder="https://ejemplo.com/edicion-cover.jpg"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            {/* Dates Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Fechas de la Edición <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Cuándo se llevará a cabo esta edición.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="ed-start" className="text-[10px] font-bold uppercase text-muted-foreground">
                      Fecha Inicio
                    </label>
                    <Input
                      id="ed-start"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="ed-end" className="text-[10px] font-bold uppercase text-muted-foreground">
                      Fecha Fin
                    </label>
                    <Input
                      id="ed-end"
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="ed-status" className="text-sm font-medium text-foreground">
                  Estado de la Edición
                </label>
                <p className="text-xs text-muted-foreground">Define si es la edición actual y activa para registrarse.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <select
                  id="ed-status"
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                >
                  <option value="planned">Planificada (No Vigente)</option>
                  <option value="active">Activa (Vigente / Actual)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Action Footer */}
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/80 px-8 py-4 backdrop-blur-md">
            <div className="max-w-4xl mx-auto flex justify-end gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/events/${eventId}`)}
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
                {isSubmitting ? "Guardando..." : "Crear Edición"}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
