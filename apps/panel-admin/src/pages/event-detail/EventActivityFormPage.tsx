import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { z } from "zod"
import { useEventStore } from "@/store/event.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useSEO } from "@/hooks/use-seo"
import { Calendar, Clock, MapPin, Link2, User, Sliders, ArrowLeft } from "lucide-react"

export function EventActivityFormPage() {
  const { id: eventId, activityId } = useParams<{ id: string; activityId?: string }>()
  const navigate = useNavigate()
  const {
    events,
    editions,
    agendaItems,
    speakers,
    addAgendaItem,
    updateAgendaItem
  } = useEventStore()

  const event = events.find((e) => e.id === eventId)
  const eventSpeakers = speakers.filter((sp) => sp.eventId === eventId)
  const currentEdition = editions.find((ed) => ed.mainEventId === eventId && ed.isCurrent) || editions.find((ed) => ed.mainEventId === eventId)

  const isEditMode = !!activityId

  useSEO({
    title: isEditMode ? "Editar Actividad" : "Nueva Actividad",
    description: "Configura los detalles de la actividad del cronograma del evento."
  })

  // Form states
  const [activityName, setActivityName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("10:00")
  const [customLocation, setCustomLocation] = useState("")
  const [activityMode, setActivityMode] = useState<"PRESENCIAL" | "VIRTUAL" | "HIBRIDO">("PRESENCIAL")
  const [meetingUrl, setMeetingUrl] = useState("")
  const [speakerId, setSpeakerId] = useState("")
  const [status, setStatus] = useState<"PUBLIC" | "DRAFT" | "ARCHIVED">("PUBLIC")
  const [orderIndex, setOrderIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize dates from current/first edition or today
  useEffect(() => {
    if (!isEditMode && editions.length > 0) {
      const currentEdition = editions.find((ed) => ed.mainEventId === eventId && ed.isCurrent) || editions.find((ed) => ed.mainEventId === eventId)
      if (currentEdition?.startDate) {
        setStartDate(currentEdition.startDate)
        setEndDate(currentEdition.startDate)
      } else {
        const todayStr = new Date().toISOString().split("T")[0]
        setStartDate(todayStr)
        setEndDate(todayStr)
      }
    }
  }, [eventId, editions, isEditMode])

  // Load existing details in Edit Mode
  useEffect(() => {
    if (isEditMode && agendaItems.length > 0) {
      const item = agendaItems.find((a) => a.id === activityId)
      if (item) {
        setActivityName(item.title || "")
        setDescription(item.description || "")
        setCustomLocation(item.stage || "")
        setSpeakerId(item.speakerId || "")
        setActivityMode(item.activityMode || "PRESENCIAL")
        setMeetingUrl(item.meetingUrl || "")
        setStatus(item.status || "PUBLIC")
        setOrderIndex(item.orderIndex ?? 0)

        if (item.startDate) {
          setStartDate(item.startDate)
        } else if (item.startTime) {
          setStartDate(item.startTime.split("T")[0])
        }

        if (item.startTime) {
          const parts = item.startTime.split("T")
          if (parts[1]) setStartTime(parts[1].substring(0, 5))
        }

        if (item.endDate) {
          setEndDate(item.endDate)
        } else if (item.endTime) {
          setEndDate(item.endTime.split("T")[0])
        }

        if (item.endTime) {
          const parts = item.endTime.split("T")
          if (parts[1]) setEndTime(parts[1].substring(0, 5))
        }
      }
    }
  }, [activityId, agendaItems, isEditMode])

  const eventActivitySchema = z.object({
    activityName: z.string().trim().min(1, "El nombre de la actividad es requerido."),
    description: z.string().trim().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de inicio inválida (AAAA-MM-DD)."),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora de inicio inválida (HH:MM)."),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de fin inválida (AAAA-MM-DD)."),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora de fin inválida (HH:MM)."),
    customLocation: z.string().trim().min(1, "El escenario o ubicación es requerido."),
    activityMode: z.enum(["PRESENCIAL", "VIRTUAL", "HIBRIDO"]),
    meetingUrl: z.string().url("El enlace de la reunión no es válido.").or(z.literal("")).optional(),
    speakerId: z.string().uuid("Seleccione un ponente válido o deje vacío.").or(z.literal("")).optional(),
    status: z.enum(["PUBLIC", "DRAFT", "ARCHIVED"]),
    orderIndex: z.number().int().min(0, "El índice de orden debe ser un número entero positivo.").default(0),
  }).refine((data) => {
    const start = new Date(`${data.startDate}T${data.startTime}`)
    const end = new Date(`${data.endDate}T${data.endTime}`)
    return end > start;
  }, {
    message: "La fecha/hora de finalización debe ser posterior a la de inicio.",
    path: ["endTime"],
  }).refine((data) => {
    if (currentEdition?.startDate && currentEdition?.endDate) {
      return data.startDate >= currentEdition.startDate && data.startDate <= currentEdition.endDate
    }
    return true
  }, {
    message: `La fecha de inicio debe estar dentro del rango del evento (${currentEdition?.startDate || ""} al ${currentEdition?.endDate || ""}).`,
    path: ["startDate"]
  }).refine((data) => {
    if (currentEdition?.startDate && currentEdition?.endDate) {
      return data.endDate >= currentEdition.startDate && data.endDate <= currentEdition.endDate
    }
    return true
  }, {
    message: `La fecha de finalización debe estar dentro del rango del evento (${currentEdition?.startDate || ""} al ${currentEdition?.endDate || ""}).`,
    path: ["endDate"]
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId) return

    const validation = eventActivitySchema.safeParse({
      activityName,
      description,
      startDate,
      startTime,
      endDate,
      endTime,
      customLocation,
      activityMode,
      meetingUrl,
      speakerId: speakerId || undefined,
      status,
      orderIndex,
    })

    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    setIsSubmitting(true)

    // Build ISO timestamp with time zone offset
    const isoStart = new Date(`${startDate}T${startTime}:00`).toISOString()
    const isoEnd = new Date(`${endDate}T${endTime}:00`).toISOString()

    const payload = {
      eventId: currentEdition?.id || eventId,
      title: activityName,
      description: description || null,
      stage: customLocation,
      speakerId: speakerId || "",
      startTime: isoStart,
      endTime: isoEnd,
      meetingUrl: activityMode !== "PRESENCIAL" ? (meetingUrl || null) : null,
      activityMode,
      status,
      orderIndex,
      startDate,
      endDate,
      timeSlot: `${startTime} - ${endTime}`
    }

    try {
      if (isEditMode && activityId) {
        await updateAgendaItem(activityId, payload)
        toast.success("Actividad actualizada correctamente")
      } else {
        await addAgendaItem(payload)
        toast.success("Actividad creada y agendada correctamente")
      }
      navigate(`/dashboard/events/${eventId}/agenda`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error al guardar la actividad")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!event) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
        Cargando datos del evento...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Back button header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/dashboard/events/${eventId}/agenda`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 border border-border rounded-md bg-muted/20 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            Volver a Agenda
          </button>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              {isEditMode ? "Editar Sesión" : "Nueva Sesión"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Define el cronograma, ubicación y modalidad de la actividad.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          
          <div className="p-6 space-y-6">
            
            {/* Title / Name */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="activityName" className="text-sm font-semibold text-foreground">
                  Título de la Actividad <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Nombre principal de la ponencia o taller.</p>
              </div>
              <div className="md:w-2/3 w-full">
                <Input
                  id="activityName"
                  placeholder="Ej. Apertura y Bienvenida o Keynote: Innovación AI"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="description" className="text-sm font-semibold text-foreground">
                  Descripción
                </label>
                <p className="text-xs text-muted-foreground">Breve resumen de los temas a tratar o agenda interna.</p>
              </div>
              <div className="md:w-2/3 w-full">
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Escribe detalles breves de la sesión..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-24 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Start Date & Time */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>Inicio de Actividad</span>
                </label>
                <p className="text-xs text-muted-foreground">Fecha y hora en la que inicia la actividad.</p>
              </div>
              <div className="md:w-2/3 w-full flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={currentEdition?.startDate || undefined}
                    max={currentEdition?.endDate || undefined}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="w-full sm:w-[150px]">
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* End Date & Time */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>Fin de Actividad</span>
                </label>
                <p className="text-xs text-muted-foreground">Fecha y hora en la que culmina la actividad.</p>
              </div>
              <div className="md:w-2/3 w-full flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={currentEdition?.startDate || undefined}
                    max={currentEdition?.endDate || undefined}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="w-full sm:w-[150px]">
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Location (Stage) */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="customLocation" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>Ubicación / Escenario</span>
                </label>
                <p className="text-xs text-muted-foreground">Escenario, sala o salón donde se llevará a cabo.</p>
              </div>
              <div className="md:w-2/3 w-full">
                <Input
                  id="customLocation"
                  placeholder="Ej. Salón de Actos, Escenario Principal, Sala B"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Mode & Speaker */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <User className="size-4 text-muted-foreground" />
                  <span>Modalidad y Expositor</span>
                </label>
                <p className="text-xs text-muted-foreground">Detalles de la sesión y ponente a cargo.</p>
              </div>
              <div className="md:w-2/3 w-full space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Mode */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Modalidad:</span>
                    <Select
                      value={activityMode}
                      onValueChange={(val: any) => setActivityMode(val)}
                    >
                      <SelectTrigger disabled={isSubmitting}>
                        <SelectValue placeholder="Seleccione modalidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                        <SelectItem value="VIRTUAL">Virtual</SelectItem>
                        <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Speaker */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Expositor / Ponente:</span>
                    <Select
                      value={speakerId}
                      onValueChange={setSpeakerId}
                    >
                      <SelectTrigger disabled={isSubmitting}>
                        <SelectValue placeholder="Sin expositor asignado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin expositor asignado</SelectItem>
                        {eventSpeakers.map((sp) => (
                          <SelectItem key={sp.id} value={sp.id}>
                            {sp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                </div>

              </div>
            </div>

            {/* Meeting URL (Conditional) */}
            {activityMode !== "PRESENCIAL" && (
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6 animate-in slide-in-from-top-1 duration-200">
                <div className="md:w-1/3 space-y-1">
                  <label htmlFor="meetingUrl" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Link2 className="size-4 text-muted-foreground" />
                    <span>Enlace de Reunión</span>
                  </label>
                  <p className="text-xs text-muted-foreground">URL de Zoom, Teams, Meet o Streaming.</p>
                </div>
                <div className="md:w-2/3 w-full">
                  <Input
                    id="meetingUrl"
                    type="url"
                    placeholder="https://zoom.us/j/123456789"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            {/* Status & Index Order */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-2">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Sliders className="size-4 text-muted-foreground" />
                  <span>Configuración Adicional</span>
                </label>
                <p className="text-xs text-muted-foreground">Estado de publicación y orden visual.</p>
              </div>
              <div className="md:w-2/3 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Publication Status */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Estado:</span>
                  <Select
                    value={status}
                    onValueChange={(val: any) => setStatus(val)}
                  >
                    <SelectTrigger disabled={isSubmitting}>
                      <SelectValue placeholder="Seleccione estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Público</SelectItem>
                      <SelectItem value="DRAFT">Borrador</SelectItem>
                      <SelectItem value="ARCHIVED">Archivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Index Order */}
                <div className="space-y-1">
                  <label htmlFor="orderIndex" className="text-xs text-muted-foreground font-medium">Orden de Visualización:</label>
                  <Input
                    id="orderIndex"
                    type="number"
                    min={0}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                    disabled={isSubmitting}
                  />
                </div>

              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="bg-muted/10 px-6 py-4 flex justify-end gap-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/dashboard/events/${eventId}/agenda`)}
              disabled={isSubmitting}
              className="text-xs h-9 px-4 font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs h-9 px-4 font-semibold"
            >
              {isSubmitting ? "Guardando..." : "Guardar Actividad"}
            </Button>
          </div>

        </div>
      </form>

    </div>
  )
}
