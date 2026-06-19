import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { useEventStore } from "@/store/event.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { ArrowLeft, Sparkles, Globe, Video, MapPin, Repeat, Trash2 } from "lucide-react"

export function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedOrganization } = useAuthStore()
  const { events, updateEvent, deleteEvent } = useEventStore()

  const event = events.find((e) => e.id === id)

  // Form states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [fullDescription, setFullDescription] = useState("")
  const [format, setFormat] = useState<"physical" | "online" | "hybrid">("physical")
  const [meetingUrl, setMeetingUrl] = useState("")
  const [location, setLocation] = useState("")
  const [date, setDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">("WEEKLY")
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("")
  const [status, setStatus] = useState<"draft" | "published" | "finished">("draft")
  const [banner, setBanner] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Sync state when event is loaded
  useEffect(() => {
    if (event) {
      setTitle(event.title || "")
      setDescription(event.description || "")
      setFullDescription(event.fullDescription || "")
      setFormat(event.format || "physical")
      setMeetingUrl(event.meetingUrl || "")
      setLocation(event.location || "")
      setDate(event.date || "")
      setEndDate(event.endDate || "")
      setIsRecurring(!!event.isRecurring)
      setRecurrencePattern(event.recurrencePattern || "WEEKLY")
      setRecurrenceInterval(event.recurrenceInterval || 1)
      setRecurrenceEndDate(event.recurrenceEndDate || "")
      setStatus(event.status || "draft")
      setBanner(event.banner || "")
    } else {
      // If we don't have this event loaded, return to lists
      toast.error("Evento no encontrado.")
      navigate("/dashboard/events")
    }
  }, [event, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    if (!title.trim()) {
      toast.error("El título del evento es obligatorio.")
      return
    }

    setIsSubmitting(true)
    try {
      await updateEvent(id, {
        title: title.trim(),
        description: description.trim(),
        fullDescription: fullDescription.trim(),
        format,
        meetingUrl: (format === "online" || format === "hybrid") ? meetingUrl.trim() : "",
        location: (format === "physical" || format === "hybrid") ? location.trim() : "Virtual",
        date,
        endDate: endDate || "",
        isRecurring,
        recurrencePattern: isRecurring ? recurrencePattern : undefined,
        recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
        recurrenceEndDate: (isRecurring && recurrenceEndDate) ? recurrenceEndDate : "",
        status,
        banner: banner.trim()
      })

      toast.success("Evento actualizado exitosamente")
      navigate(`/dashboard/events/${id}`)
    } catch (err: any) {
      console.error(err)
      toast.error("Error al actualizar el evento. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm("¿Estás seguro de que deseas eliminar permanentemente este evento y todas sus ediciones, ponentes y actividades asociadas? Esta acción no se puede deshacer.")) {
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
      {/* Top Header Navbar */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/dashboard/events/${id}`)}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 border border-border rounded-md bg-muted/20 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            Volver al Detalle
          </button>
          <span className="font-bold text-xl text-primary tracking-tighter ml-2">
            EventHive
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <ThemeSwitch />
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg bg-muted/10 text-xs">
            <span className="font-medium text-muted-foreground">Organización Activa:</span>
            <span className="font-bold text-foreground">{selectedOrganization?.name}</span>
          </div>
        </div>
      </header>

      {/* Main Settings Form Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full pb-28">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="size-4" />
              Editar Detalles del Evento
            </div>
            <h1 className="text-3xl font-medium tracking-tight text-foreground">Editar Evento</h1>
            <p className="text-sm text-muted-foreground">
              Realiza cambios en los datos del evento, formatos de repetición o estado de publicación.
            </p>
          </div>
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            {/* Title Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-title" className="text-sm font-medium text-foreground">
                  Título del Evento <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Nombre público del evento.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="evt-title"
                  type="text"
                  required
                  placeholder="Ej. Congreso Anual de Tecnología 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            {/* Short Description */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-desc" className="text-sm font-medium text-foreground">
                  Descripción Corta <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Un resumen breve para las tarjetas del catálogo.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="evt-desc"
                  type="text"
                  required
                  placeholder="Resumen del evento..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            {/* Detailed Description */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-full-desc" className="text-sm font-medium text-foreground">
                  Descripción Detallada
                </label>
                <p className="text-xs text-muted-foreground">Detalla los objetivos, agenda, y propuesta de valor completa.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <textarea
                  id="evt-full-desc"
                  rows={4}
                  placeholder="Explica detalladamente de qué se trata el evento..."
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                />
              </div>
            </div>

            {/* Format Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Formato del Evento <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Elige cómo participarán los ponentes y asistentes.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "physical", label: "Presencial", icon: MapPin },
                    { value: "online", label: "Virtual / Streaming", icon: Video },
                    { value: "hybrid", label: "Híbrido", icon: Globe }
                  ].map((opt) => {
                    const Icon = opt.icon
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormat(opt.value as any)}
                        className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 select-none transition-all cursor-pointer ${
                          format === opt.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>

                {/* Conditional Physical Location */}
                {(format === "physical" || format === "hybrid") && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                    <label htmlFor="evt-location" className="text-xs font-bold uppercase text-muted-foreground">
                      Ubicación Física
                    </label>
                    <Input
                      id="evt-location"
                      type="text"
                      required
                      placeholder="Ej. Auditorio Principal, Hotel Sheraton"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                )}

                {/* Conditional Virtual Meeting Url */}
                {(format === "online" || format === "hybrid") && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                    <label htmlFor="evt-meeting" className="text-xs font-bold uppercase text-muted-foreground">
                      Enlace de Videoconferencia / Transmisión
                    </label>
                    <Input
                      id="evt-meeting"
                      type="url"
                      required
                      placeholder="Ej. https://zoom.us/j/123456789"
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Dates Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Fechas del Evento <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Cuándo inicia y finaliza el evento.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="evt-start-date" className="text-[10px] font-bold uppercase text-muted-foreground">
                      Inicio
                    </label>
                    <Input
                      id="evt-start-date"
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="evt-end-date" className="text-[10px] font-bold uppercase text-muted-foreground">
                      Finalización
                    </label>
                    <Input
                      id="evt-end-date"
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

            {/* Recurrence Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Repeat className="size-4 text-muted-foreground" />
                  <label htmlFor="evt-recurring" className="text-sm font-medium text-foreground cursor-pointer select-none">
                    Evento Recurrente
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">Indica si este evento se repite periódicamente.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full space-y-4">
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    id="evt-recurring"
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="accent-primary size-4"
                  />
                  <span className="text-sm text-foreground">Repetir periódicamente</span>
                </label>

                {isRecurring && (
                  <div className="p-4 border border-border rounded-xl bg-muted/20 space-y-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="evt-rec-pattern" className="text-[10px] font-bold uppercase text-muted-foreground">
                          Frecuencia
                        </label>
                        <select
                          id="evt-rec-pattern"
                          value={recurrencePattern}
                          onChange={(e: any) => setRecurrencePattern(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                        >
                          <option value="DAILY">Diario</option>
                          <option value="WEEKLY">Semanal</option>
                          <option value="MONTHLY">Mensual</option>
                          <option value="YEARLY">Anual</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="evt-rec-interval" className="text-[10px] font-bold uppercase text-muted-foreground">
                          Intervalo (cada x veces)
                        </label>
                        <Input
                          id="evt-rec-interval"
                          type="number"
                          min={1}
                          required
                          value={recurrenceInterval}
                          onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                          className="bg-background"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="evt-rec-end" className="text-[10px] font-bold uppercase text-muted-foreground">
                        Fecha final de repetición
                      </label>
                      <Input
                        id="evt-rec-end"
                        type="date"
                        required
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Banner Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-banner" className="text-sm font-medium text-foreground">
                  Banner del Evento
                </label>
                <p className="text-xs text-muted-foreground">URL de la imagen de portada.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="evt-banner"
                  type="url"
                  placeholder="https://ejemplo.com/portada.jpg"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            {/* Status Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="evt-status" className="text-sm font-medium text-foreground">
                  Estado del Evento
                </label>
                <p className="text-xs text-muted-foreground">Define si estará visible inmediatamente.</p>
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
                  <option value="finished">Finalizado</option>
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
