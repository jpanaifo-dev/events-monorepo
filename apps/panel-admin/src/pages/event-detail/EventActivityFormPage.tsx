import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { z } from "zod"
import { useEventStore } from "@/store/event.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/utils/supabase"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useSEO } from "@/hooks/use-seo"
import { Calendar, Clock, MapPin, Link2, User, Sliders } from "lucide-react"
import { PageHeader } from "@/components/page-header"

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
  const [branches, setBranches] = useState<any[]>([])
  const [speakerSessions, setSpeakerSessions] = useState<any[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [timeError, setTimeError] = useState("")

  useEffect(() => {
    async function loadSpeakerSessions() {
      if (!speakerId) {
        setSpeakerSessions([])
        return
      }
      setIsLoadingSessions(true)
      try {
        const { data: pivots, error: pivotErr } = await supabase
          .from("session_speakers")
          .select("session_id")
          .eq("participant_id", speakerId)

        if (!pivotErr && pivots && pivots.length > 0) {
          const sessionIds = pivots.map((p) => p.session_id)
          const { data: sessions, error: sessionsErr } = await supabase
            .from("event_sessions")
            .select("*")
            .in("id", sessionIds)

          if (!sessionsErr && sessions) {
            setSpeakerSessions(sessions)
          } else {
            setSpeakerSessions([])
          }
        } else {
          setSpeakerSessions([])
        }
      } catch (err) {
        console.error("Error loading speaker sessions:", err)
        setSpeakerSessions([])
      } finally {
        setIsLoadingSessions(false)
      }
    }
    loadSpeakerSessions()
  }, [speakerId])

  useEffect(() => {
    if (startDate && startTime && endDate && endTime) {
      const start = new Date(`${startDate}T${startTime}`)
      const end = new Date(`${endDate}T${endTime}`)
      if (end <= start) {
        setTimeError("La hora/fecha de finalización debe ser posterior a la de inicio.")
      } else {
        setTimeError("")
      }
    } else {
      setTimeError("")
    }
  }, [startDate, startTime, endDate, endTime])

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
          const d = new Date(item.startTime)
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, "0")
            const day = String(d.getDate()).padStart(2, "0")
            setStartDate(`${year}-${month}-${day}`)
          }
        }

        if (item.startTime) {
          const d = new Date(item.startTime)
          if (!isNaN(d.getTime())) {
            const hours = String(d.getHours()).padStart(2, "0")
            const minutes = String(d.getMinutes()).padStart(2, "0")
            setStartTime(`${hours}:${minutes}`)
          }
        }

        if (item.endDate) {
          setEndDate(item.endDate)
        } else if (item.endTime) {
          const d = new Date(item.endTime)
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, "0")
            const day = String(d.getDate()).padStart(2, "0")
            setEndDate(`${year}-${month}-${day}`)
          }
        }

        if (item.endTime) {
          const d = new Date(item.endTime)
          if (!isNaN(d.getTime())) {
            const hours = String(d.getHours()).padStart(2, "0")
            const minutes = String(d.getMinutes()).padStart(2, "0")
            setEndTime(`${hours}:${minutes}`)
          }
        }
      }
    }
  }, [activityId, agendaItems, isEditMode])

  useEffect(() => {
    async function loadBranches() {
      if (!event?.organizationId) return
      try {
        const { data, error } = await supabase
          .from("organization_branches")
          .select("*")
          .eq("organization_id", event.organizationId)
          .eq("is_active", true)
        if (!error && data) {
          setBranches(data)
        }
      } catch (err) {
        console.error("Error loading branches:", err)
      }
    }
    loadBranches()
  }, [event?.organizationId])

  const eventActivitySchema = z.object({
    activityName: z.string().trim().min(1, "El nombre de la actividad es requerido."),
    description: z.string().trim().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de inicio inválida (AAAA-MM-DD)."),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora de inicio inválida (HH:MM)."),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de fin inválida (AAAA-MM-DD)."),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora de fin inválida (HH:MM)."),
    customLocation: z.string().trim().min(1, "El escenario o ubicación es requerido."),
    activityMode: z.enum(["PRESENCIAL", "VIRTUAL", "HIBRIDO"]),
    meetingUrl: z.string().url("El enlace de la reunión no es válido.").or(z.literal("")).or(z.undefined()).optional(),
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

    if (timeError) {
      toast.error(timeError)
      return
    }

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
      editionId: currentEdition?.id || null,
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

      <PageHeader
        title={isEditMode ? "Editar Sesión" : "Nueva Sesión"}
        description="Define el cronograma, ubicación y modalidad de la actividad."
        showBackButton
        onBackClick={() => navigate(`/dashboard/events/${eventId}/agenda`)}
      />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="border border-border rounded-xl bg-card overflow-hidden">

          <div className="p-6 space-y-6">

            {/* Expositor / Ponente */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="speakerSelect" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <User className="size-4 text-muted-foreground" />
                  <span>Expositor / Ponente</span>
                </label>
                <p className="text-xs text-muted-foreground">Ponente a cargo de la actividad (Opcional).</p>
              </div>
              <div className="md:w-2/3 w-full space-y-3">
                <Select
                  value={speakerId}
                  onValueChange={setSpeakerId}
                >
                  <SelectTrigger id="speakerSelect" disabled={isSubmitting}>
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

                {/* Speaker Topics Suggestions */}
                {isLoadingSessions ? (
                  <p className="text-xs text-muted-foreground italic">Cargando temas sugeridos...</p>
                ) : speakerSessions.length > 0 ? (
                  <div className="space-y-1.5 mt-2">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Temas sugeridos del ponente (Haz clic para usar como título):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {speakerSessions.map((session) => (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => {
                            setActivityName(session.title)
                            toast.info(`Título establecido: "${session.title}"`)
                          }}
                          className="inline-flex items-center text-left gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                        >
                          {session.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : speakerId && (
                  <p className="text-xs text-muted-foreground italic">El ponente no tiene temas de ponencia registrados en este evento.</p>
                )}
              </div>
            </div>

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
                {timeError && (
                  <p className="text-xs text-destructive font-medium mt-1.5 w-full">
                    {timeError}
                  </p>
                )}
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
                {branches.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className="text-[11px] font-medium text-muted-foreground">Sugerencias de sedes de la organización:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {branches.map((branch) => {
                        const val = branch.address ? `${branch.name} - ${branch.address}` : branch.name
                        return (
                          <button
                            key={branch.id}
                            type="button"
                            onClick={() => setCustomLocation(val)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
                          >
                            <MapPin className="size-3 text-muted-foreground" />
                            <span>{branch.name}</span>
                            {branch.address && (
                              <span className="text-muted-foreground/75 font-normal text-[10px]">
                                ({branch.address})
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mode & Status */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Sliders className="size-4 text-muted-foreground" />
                  <span>Configuración de la Actividad</span>
                </label>
                <p className="text-xs text-muted-foreground">Modalidad y estado de publicación.</p>
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

                  {/* Status */}
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
                </div>
              </div>
            </div>

            {/* Meeting URL (Conditional) */}
            {activityMode !== "PRESENCIAL" && (
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-2 animate-in slide-in-from-top-1 duration-200">
                <div className="md:w-1/3 space-y-1">
                  <label htmlFor="meetingUrl" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Link2 className="size-4 text-muted-foreground" />
                    <span>Enlace de Reunión <span className="text-muted-foreground font-normal text-xs">(opcional)</span></span>
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
                    disabled={isSubmitting}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Si aún no tienes el enlace, déjalo vacío. Se mostrará como <em>Aún no disponible</em>.
                  </p>
                </div>
              </div>
            )}

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
