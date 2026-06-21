import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { createPortal } from "react-dom"
import { z } from "zod"
import { useEventStore } from "@/store/event.store"
import type { AgendaItem } from "@/store/event.store"
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  List,
  MapPin,
  User,
  Video,
  Eye,
  EyeOff,
  Clock,
  Lock,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
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
import { toast } from "sonner"
import { useSEO } from "@/hooks/use-seo"

// Custom Modal Component using React Portal for bulletproof rendering
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export function EventAgendaSection() {
  const { id: eventId } = useParams<{ id: string }>()
  const {
    events,
    agendaItems,
    speakers,
    editions,
    deleteAgendaItem,
    addAgendaItem,
    updateAgendaItem
  } = useEventStore()

  const [selectedEditionId, setSelectedEditionId] = useState<string>("")

  const event = events.find((e) => e.id === eventId)
  const currentEdition = useMemo(() => {
    const eventEditions = editions.filter((ed) => ed.mainEventId === eventId)
    if (selectedEditionId) {
      return eventEditions.find((ed) => ed.id === selectedEditionId) || eventEditions[0]
    }
    return eventEditions.find((ed) => ed.isCurrent) || eventEditions[0]
  }, [editions, eventId, selectedEditionId])
  const eventAgenda = useMemo(() => {
    const targetId = currentEdition?.id || eventId
    return agendaItems.filter((ag) => ag.eventId === targetId)
  }, [agendaItems, eventId, currentEdition])
  const eventSpeakers = useMemo(() => speakers.filter((sp) => sp.eventId === eventId), [speakers, eventId])

  useSEO({
    title: event ? `${event.name} - Cronograma` : "Cronograma de Evento",
    description: `Administra las actividades del cronograma del evento ${event?.name || ""}.`
  })

  // View mode switcher: 'dia' | 'agenda' | 'list' using URL search parameters
  const [searchParams, setSearchParams] = useSearchParams()

  const viewMode = useMemo(() => {
    const val = searchParams.get("view")
    if (val === "dia" || val === "agenda" || val === "list") {
      return val
    }
    return "dia"
  }, [searchParams])

  const setViewMode = (mode: "dia" | "agenda" | "list") => {
    const params = new URLSearchParams(searchParams)
    params.set("view", mode)
    setSearchParams(params)
  }

  // Current local time tracker for timeline indicator line
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const todayStr = useMemo(() => {
    const year = currentTime.getFullYear()
    const month = String(currentTime.getMonth() + 1).padStart(2, "0")
    const day = String(currentTime.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }, [currentTime])

  const orderedHours = useMemo(() => {
    const currentHour = currentTime.getHours()
    const hours = []
    for (let i = 0; i < 24; i++) {
      hours.push((currentHour + i) % 24)
    }
    return hours
  }, [currentTime])



  // Group activities by date
  const groupedAgenda = useMemo(() => {
    return eventAgenda.reduce<Record<string, AgendaItem[]>>((acc, item) => {
      const dateKey = item.startDate || (item.startTime ? item.startTime.split("T")[0] : "Sin fecha")
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(item)
      return acc
    }, {})
  }, [eventAgenda])

  // Sort dates chronologically
  const sortedDates = useMemo(() => Object.keys(groupedAgenda).sort(), [groupedAgenda])

  // Generate all dates within the edition range
  const editionDates = useMemo(() => {
    if (!currentEdition?.startDate || !currentEdition?.endDate) return []
    const dates = []
    let curr = new Date(`${currentEdition.startDate}T00:00:00`)
    const end = new Date(`${currentEdition.endDate}T00:00:00`)

    while (curr <= end) {
      const year = curr.getFullYear()
      const month = String(curr.getMonth() + 1).padStart(2, "0")
      const day = String(curr.getDate()).padStart(2, "0")
      dates.push(`${year}-${month}-${day}`)
      curr.setDate(curr.getDate() + 1)
    }
    return dates
  }, [currentEdition])

  // Combine edition dates and sortedDates as a fallback
  const switcherDates = useMemo(() => {
    return editionDates.length > 0 ? editionDates : sortedDates
  }, [editionDates, sortedDates])

  // Sort items within each date by orderIndex or startTime
  useEffect(() => {
    switcherDates.forEach((dateKey) => {
      if (groupedAgenda[dateKey]) {
        groupedAgenda[dateKey].sort((a, b) => {
          if (a.orderIndex !== b.orderIndex) {
            return (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
          }
          const timeA = a.startTime ? a.startTime.split("T")[1] || "" : ""
          const timeB = b.startTime ? b.startTime.split("T")[1] || "" : ""
          return timeA.localeCompare(timeB)
        })
      }
    })
  }, [switcherDates, groupedAgenda])

  // Selected date for Agenda Mode
  const [selectedDate, setSelectedDate] = useState<string>("")

  useEffect(() => {
    if (switcherDates.length > 0 && (!selectedDate || !switcherDates.includes(selectedDate))) {
      setSelectedDate(switcherDates[0])
    }
  }, [switcherDates, selectedDate])

  const timelineGridRef = useRef<HTMLDivElement>(null)

  // Scroll window to top of the grid on timeline load
  useEffect(() => {
    if (viewMode === "dia" && timelineGridRef.current) {
      setTimeout(() => {
        if (!timelineGridRef.current) return
        const elementTop = timelineGridRef.current.getBoundingClientRect().top + window.scrollY
        window.scrollTo({
          top: elementTop - 120, // offset slightly to align nicely
          behavior: "smooth"
        })
      }, 200)
    }
  }, [viewMode, selectedDate])

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [dragCurrent, setDragCurrent] = useState(0)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const decimalHour = y / rowHeight
    const snap = 0.25 // snap to 15 min
    const snappedHour = Math.max(0, Math.min(24, Math.floor(decimalHour / snap) * snap))

    setDragStart(snappedHour)
    setDragCurrent(snappedHour)
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const decimalHour = y / rowHeight
    const snap = 0.25
    const snappedHour = Math.max(0, Math.min(24, Math.floor(decimalHour / snap) * snap))

    setDragCurrent(snappedHour)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)

    const h1 = Math.min(dragStart, dragCurrent)
    const h2 = Math.max(dragStart, dragCurrent)
    const startHourVal = h1
    const endHourVal = h2 - h1 < 0.25 ? h1 + 1 : h2

    const startAbs = (orderedHours[0] + startHourVal) % 24
    const endAbs = (orderedHours[0] + endHourVal) % 24

    handleOpenCreate(selectedDate)
    setStartTime(formatHourDecimal(startAbs))
    setEndTime(formatHourDecimal(endAbs))

    if (endAbs < startAbs) {
      const d = new Date(`${selectedDate}T00:00:00`)
      d.setDate(d.getDate() + 1)
      const nextDayStr = d.toISOString().split("T")[0]
      setEndDate(nextDayStr)
    } else {
      setEndDate(selectedDate)
    }
  }

  const handlePrevDay = () => {
    const idx = switcherDates.indexOf(selectedDate)
    if (idx > 0) {
      setSelectedDate(switcherDates[idx - 1])
    }
  }

  const handleNextDay = () => {
    const idx = switcherDates.indexOf(selectedDate)
    if (idx < switcherDates.length - 1) {
      setSelectedDate(switcherDates[idx + 1])
    }
  }

  const getTopOffset = (item: AgendaItem) => {
    if (!item.startTime) return 0
    const d = new Date(item.startTime)
    const hour = d.getHours()
    const minute = d.getMinutes()
    const startHour = orderedHours[0]
    let relativeHour = hour - startHour
    if (relativeHour < 0) relativeHour += 24
    return (relativeHour + minute / 60) * rowHeight
  }

  const getHeight = (item: AgendaItem) => {
    if (!item.startTime || !item.endTime) return rowHeight
    const start = new Date(item.startTime)
    const end = new Date(item.endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = diffMs / 60000
    return Math.max((diffMins / 60) * rowHeight, 32)
  }

  const formatSelectedDateDisplay = (dateStr: string) => {
    if (!dateStr || dateStr === "Sin fecha") return ""
    const d = new Date(`${dateStr}T00:00:00`)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  }

  const selectedDateActivities = useMemo(() => {
    return groupedAgenda[selectedDate] || []
  }, [groupedAgenda, selectedDate])

  const sortedSelectedActivities = useMemo(() => {
    return [...selectedDateActivities].sort((a, b) => {
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0
      return timeA - timeB
    })
  }, [selectedDateActivities])

  const activityLayouts = useMemo(() => {
    return computeActivityLayouts(selectedDateActivities)
  }, [selectedDateActivities])

  // --- Modal & Form Logic ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null)

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
    return end > start
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

  const handleOpenCreate = (prefilledDate?: string) => {
    setEditingItem(null)
    setActivityName("")
    setDescription("")
    setCustomLocation("Escenario Principal")
    setSpeakerId("")
    setActivityMode("PRESENCIAL")
    setMeetingUrl("")
    setStatus("PUBLIC")
    setOrderIndex(0)
    setStartTime("09:00")
    setEndTime("10:00")

    if (prefilledDate) {
      setStartDate(prefilledDate)
      setEndDate(prefilledDate)
    } else if (currentEdition?.startDate) {
      setStartDate(currentEdition.startDate)
      setEndDate(currentEdition.startDate)
    } else {
      const todayStr = new Date().toISOString().split("T")[0]
      setStartDate(todayStr)
      setEndDate(todayStr)
    }
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: AgendaItem) => {
    setEditingItem(item)
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
    setIsModalOpen(true)
  }

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
      if (editingItem) {
        await updateAgendaItem(editingItem.id, payload)
        toast.success("Actividad actualizada correctamente")
      } else {
        await addAgendaItem(payload)
        toast.success("Actividad creada y agendada correctamente")
      }
      setIsModalOpen(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error al guardar la actividad")
    } finally {
      setIsSubmitting(false)
    }
  }



  const formatDateDisplay = (dateStr: string) => {
    if (dateStr === "Sin fecha" || !dateStr) return "Por Asignar"
    const d = new Date(`${dateStr}T00:00:00`)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "short",
    })
  }

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case "VIRTUAL":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-semibold text-[10px]">Virtual</Badge>
      case "HIBRIDO":
        return <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20 font-semibold text-[10px]">Híbrido</Badge>
      default:
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-semibold text-[10px]">Presencial</Badge>
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-medium">
            <Lock className="size-3" />
            Borrador
          </span>
        )
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
            <EyeOff className="size-3" />
            Archivado
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
            <Eye className="size-3" />
            Público
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* View Switcher & Title Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Planificador del Cronograma</h3>
            <p className="text-xs text-muted-foreground">Estructura las ponencias, talleres e itinerarios principales.</p>
          </div>
          
          {/* Edition Select Dropdown in header */}
          {currentEdition && (
            <div className="flex items-center gap-2 bg-muted/20 border border-border/60 px-3 py-1 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Edición:</span>
              <Select
                value={currentEdition.id}
                onValueChange={(val) => {
                  setSelectedEditionId(val)
                  const selected = editions.find((ed) => ed.id === val)
                  if (selected && selected.startDate) {
                    setSelectedDate(selected.startDate)
                  }
                }}
              >
                <SelectTrigger className="w-[180px] h-7 text-xs border-none bg-transparent shadow-none focus:ring-0 p-0 pr-2 cursor-pointer">
                  <SelectValue placeholder="Seleccionar edición" />
                </SelectTrigger>
                <SelectContent>
                  {editions
                    .filter((ed) => ed.mainEventId === eventId)
                    .map((ed) => (
                      <SelectItem key={ed.id} value={ed.id} className="text-xs">
                        {ed.name && typeof ed.name === "object"
                          ? (ed.name as any).es || (ed.name as any).en || JSON.stringify(ed.name)
                          : (ed.name || "")}
                        {ed.isCurrent ? " (Actual)" : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* 3-View Toggle Switcher */}
          <div className="flex items-center bg-muted/40 border border-border p-1 rounded-lg">
            <button
              onClick={() => setViewMode("dia")}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium ${viewMode === "dia"
                ? "bg-card text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Clock className="size-3.5" />
              Día
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium ${viewMode === "agenda"
                ? "bg-card text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Calendar className="size-3.5" />
              Agenda
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium ${viewMode === "list"
                ? "bg-card text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <List className="size-3.5" />
              Lista
            </button>
          </div>

          <Button
            onClick={() => handleOpenCreate()}
            className="text-xs px-3.5 py-1.5 h-9 font-semibold"
          >
            <Plus className="size-4 mr-1.5" />
            Nueva Actividad
          </Button>
        </div>
      </div>

      {(eventAgenda.length === 0 && viewMode === "list") || (viewMode === "dia" && switcherDates.length === 0) || (viewMode === "agenda" && switcherDates.length === 0) ? (
        <div className="p-16 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/20 space-y-3">
          <Calendar className="size-10 mx-auto opacity-30" />
          <div>
            <p className="font-semibold text-lg text-foreground">No hay actividades programadas</p>
            <p className="text-xs text-muted-foreground">
              Comienza agregando ponencias, talleres o bloques de bienvenida en el cronograma.
            </p>
          </div>
          <Button
            onClick={() => handleOpenCreate()}
            variant="outline"
            className="text-xs h-8 font-semibold mt-2"
          >
            Agregar Primera Actividad
          </Button>
        </div>
      ) : (
        <>
          {/* VIEW: DIA (Vertical 24-Hour Timeline Grid with Drag Selection) */}
          {viewMode === "dia" && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Horizontal Navigation */}
              {selectedDate && (
                <div className="flex flex-row items-center justify-center select-none bg-card border border-border px-6 py-3 rounded-xl shadow-xs">
                  {/* Left Side: Day Switcher Navigation: ChevronLeft - DayText - ChevronRight */}
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handlePrevDay}
                      disabled={switcherDates.indexOf(selectedDate) <= 0}
                      variant="outline"
                      className="size-8 p-0 cursor-pointer hover:bg-muted rounded-full"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm font-bold text-foreground capitalize min-w-[200px] text-center">
                      {formatSelectedDateDisplay(selectedDate)}
                    </span>
                    <Button
                      onClick={handleNextDay}
                      disabled={switcherDates.indexOf(selectedDate) >= switcherDates.length - 1}
                      variant="outline"
                      className="size-8 p-0 cursor-pointer hover:bg-muted rounded-full"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Vertical 24-Hour Timeline Grid with Drag Selection (Y-axis scrolling disabled, expands naturally) */}
              {selectedDate && (
                <div
                  ref={timelineGridRef}
                  className="border border-border rounded-xl bg-card shadow-xs relative select-none"
                >
                  <div
                    className="relative flex cursor-crosshair"
                    style={{ height: `${24 * rowHeight}px` }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  >
                    {/* Left Column: Hour Labels */}
                    <div className="w-20 border-r border-border bg-muted/[0.02] shrink-0 flex flex-col pointer-events-none">
                      {orderedHours.map((h) => (
                        <div
                          key={h}
                          className="text-right pr-4 text-[10px] font-bold text-muted-foreground"
                          style={{
                            height: `${rowHeight}px`,
                            paddingTop: "6px"
                          }}
                        >
                          {formatHourLabel(h)}
                        </div>
                      ))}
                    </div>

                    {/* Right Column: Grid and Cards */}
                    <div className="flex-1 relative">
                      {/* Horizontal Grid lines */}
                      {orderedHours.map((h, index) => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 border-t border-border/40 pointer-events-none"
                          style={{ top: `${index * rowHeight}px`, height: `${rowHeight}px` }}
                        />
                      ))}

                      {/* Dragging Highlight Overlay */}
                      {isDragging && (
                        <div
                          className="absolute left-4 right-4 bg-primary/10 border border-primary border-dashed rounded-xl pointer-events-none z-20 flex items-center justify-center animate-pulse"
                          style={{
                            top: `${Math.min(dragStart, dragCurrent) * rowHeight}px`,
                            height: `${Math.abs(dragCurrent - dragStart) * rowHeight || 2}px`
                          }}
                        >
                          <div className="bg-primary text-primary-foreground font-semibold text-[10px] px-2 py-0.5 rounded shadow-sm">
                            {formatHourDecimal((orderedHours[0] + Math.min(dragStart, dragCurrent)) % 24)} - {formatHourDecimal((orderedHours[0] + Math.max(dragStart, dragCurrent)) % 24)}
                          </div>
                        </div>
                      )}

                      {/* Live Time Indicator Line */}
                      {selectedDate === todayStr && (
                        <div
                          className="absolute left-0 right-0 border-t-2 border-red-500 z-30 pointer-events-none"
                          style={{ top: `${(currentTime.getMinutes() / 60) * rowHeight}px` }}
                        >
                          <div className="absolute left-2 -translate-y-1/2 bg-red-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm">
                            {currentTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="absolute left-0 -translate-y-1/2 size-2 rounded-full bg-red-500" />
                        </div>
                      )}

                      {/* Render Activity Cards */}
                      {selectedDateActivities.length > 0 ? (
                        selectedDateActivities.map((item) => {
                          const top = getTopOffset(item)
                          const height = getHeight(item)
                          const sp = eventSpeakers.find((s) => s.id === item.speakerId)
                          const isVirtual = item.activityMode === "VIRTUAL"
                          const isHybrid = item.activityMode === "HIBRIDO"

                          const layout = activityLayouts.get(item.id) || { left: "0%", width: "100%" }

                          return (
                            <div
                              key={item.id}
                              onMouseDown={(e) => e.stopPropagation()}
                              onMouseUp={(e) => e.stopPropagation()}
                              onClick={() => handleOpenEdit(item)}
                              className={`absolute p-2.5 rounded-xl border shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between group/card ${isVirtual
                                ? "bg-blue-500 hover:bg-blue-600 border-none text-white"
                                : isHybrid
                                  ? "bg-violet-500 hover:bg-violet-600 border-none text-white"
                                  : "bg-emerald-500 hover:bg-emerald-600 border-none text-white"
                                }`}
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                left: `calc(${layout.left} + 8px)`,
                                width: `calc(${layout.width} - 16px)`
                              }}
                            >
                              {/* Content inside Activity Card */}
                              <div className="flex flex-col justify-between h-full min-w-0">
                                <div className="min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-xs truncate leading-snug">
                                      {item.title}
                                    </span>
                                    <span className="text-[9px] opacity-80 shrink-0 font-medium ml-1 bg-white/20 px-1.5 py-0.5 rounded">
                                      {formatTimeOnly(item.startTime)} - {formatTimeOnly(item.endTime)}
                                    </span>
                                  </div>
                                  {height >= 60 && item.description && (
                                    <p className="text-[10px] opacity-80 mt-0.5 line-clamp-2 leading-tight">
                                      {item.description}
                                    </p>
                                  )}
                                </div>

                                {height >= 85 && (
                                  <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-white/10 text-[9px] font-bold">
                                    {sp ? (
                                      <div className="flex items-center gap-1">
                                        <img src={sp.avatar} className="size-4 rounded-full border border-white/20 object-cover" />
                                        <span className="truncate max-w-[120px]">{sp.name}</span>
                                      </div>
                                    ) : (
                                      <span className="opacity-70 font-semibold">{item.stage}</span>
                                    )}

                                    <div className="flex items-center gap-1.5">
                                      <span className="bg-white/25 text-white px-1.5 py-0.5 rounded text-[8px]">
                                        {item.activityMode}
                                      </span>

                                      {/* Action Buttons for quick Edit/Delete */}
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleOpenEdit(item)
                                          }}
                                          className="p-1 rounded bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                                        >
                                          <Edit2 className="size-2.5" />
                                        </button>

                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <button
                                              className="p-1 rounded bg-white/20 hover:bg-red-600 hover:text-white text-white cursor-pointer"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <Trash2 className="size-2.5" />
                                            </button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                ¿Seguro que deseas eliminar "{item.title}"? Esta acción borrará la sesión permanentemente.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => deleteAgendaItem(item.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              >
                                                Sí, eliminar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>

                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/30 text-xs font-medium">
                          Arrastra verticalmente para seleccionar un horario
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: AGENDA (Boceto / Table View) */}
          {viewMode === "agenda" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Day Switcher Navigation */}
              {selectedDate && (
                <div className="flex flex-row items-center justify-center select-none bg-card border border-border px-6 py-3 rounded-xl shadow-xs">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handlePrevDay}
                      disabled={switcherDates.indexOf(selectedDate) <= 0}
                      variant="outline"
                      className="size-8 p-0 cursor-pointer hover:bg-muted rounded-full"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm font-bold text-foreground capitalize min-w-[200px] text-center">
                      {formatSelectedDateDisplay(selectedDate)}
                    </span>
                    <Button
                      onClick={handleNextDay}
                      disabled={switcherDates.indexOf(selectedDate) >= switcherDates.length - 1}
                      variant="outline"
                      className="size-8 p-0 cursor-pointer hover:bg-muted rounded-full"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Table Container */}
              {selectedDate && (
                <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/40 text-xs font-bold text-muted-foreground border-b border-border uppercase">
                        <th className="p-4 w-[160px] border-r border-border">Horario</th>
                        <th className="p-4 border-r border-border">Actividades</th>
                        <th className="p-4">Ponente y Tema</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {sortedSelectedActivities.length > 0 ? (
                        sortedSelectedActivities.map((item) => {
                          const sp = eventSpeakers.find((s) => s.id === item.speakerId)
                          const [hStart, hEnd] = item.timeSlot ? item.timeSlot.split(" - ") : ["09:00", "10:00"]
                          
                          const titleLower = (item.title || "").toLowerCase()
                          const isSpecial = 
                            titleLower.includes("receso") ||
                            titleLower.includes("break") ||
                            titleLower.includes("refrigerio") ||
                            titleLower.includes("presentación") ||
                            titleLower.includes("presentacion") ||
                            titleLower.includes("preguntas") ||
                            titleLower.includes("apertura") ||
                            titleLower.includes("ingreso")
                          
                          return (
                            <tr 
                              key={item.id} 
                              onClick={() => handleOpenEdit(item)}
                              className="hover:bg-muted/5 transition-colors cursor-pointer group"
                            >
                              {/* Horario */}
                              <td className="p-4 font-semibold text-foreground border-r border-border whitespace-nowrap">
                                {hStart} - {hEnd}
                              </td>

                              {/* Actividad */}
                              <td className="p-4 border-r border-border">
                                <span className={isSpecial ? "text-red-500 font-semibold" : "font-semibold text-foreground"}>
                                  {item.title}
                                </span>
                              </td>

                              {/* Ponente y Tema */}
                              <td className="p-4">
                                <div className="space-y-1.5">
                                  {sp && (
                                    <div className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-l-2 border-emerald-500 font-semibold text-xs px-2.5 py-1 rounded-md inline-block">
                                      {sp.name}
                                    </div>
                                  )}
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-muted-foreground text-xs font-medium">
                            No hay actividades programadas para este día.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}


          {/* VIEW: LIST */}
          {viewMode === "list" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {sortedDates.map((dateKey) => (
                <div key={dateKey} className="space-y-3">
                  {/* Day Date Header */}
                  <h4 className="text-sm font-bold text-foreground border-l-2 border-primary pl-2.5 capitalize">
                    {formatDateDisplay(dateKey)}
                  </h4>

                  {/* Day Activities Table */}
                  <div className="overflow-x-auto border border-border rounded-xl bg-card/10 backdrop-blur-xs">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/40 text-xs font-bold text-muted-foreground border-b border-border uppercase">
                          <th className="p-4 w-[140px]">Horario</th>
                          <th className="p-4">Actividad / Tema</th>
                          <th className="p-4">Expositor</th>
                          <th className="p-4">Escenario</th>
                          <th className="p-4">Modalidad</th>
                          <th className="p-4">Estado</th>
                          <th className="p-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {groupedAgenda[dateKey].map((item) => {
                          const sp = eventSpeakers.find((s) => s.id === item.speakerId)
                          const [hStart, hEnd] = item.timeSlot ? item.timeSlot.split(" - ") : ["09:00", "10:00"]

                          return (
                            <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                              <td className="p-4 font-semibold text-primary whitespace-nowrap">
                                {hStart} - {hEnd}
                              </td>
                              <td className="p-4">
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-foreground leading-snug">{item.title}</p>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                {sp ? (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={sp.avatar}
                                      alt={sp.name}
                                      className="size-5 rounded-full object-cover border border-border"
                                    />
                                    <span className="text-xs text-foreground font-medium">{sp.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Sin asignar</span>
                                )}
                              </td>
                              <td className="p-4 text-xs font-medium text-muted-foreground">
                                {item.stage}
                              </td>
                              <td className="p-4">
                                {getModeBadge(item.activityMode || "PRESENCIAL")}
                              </td>
                              <td className="p-4">
                                {getStatusIcon(item.status)}
                              </td>
                              <td className="p-4 text-right">
                                <div className="inline-flex items-center gap-1 justify-end">
                                  <Button
                                    onClick={() => handleOpenEdit(item)}
                                    variant="outline"
                                    className="size-8 p-0 cursor-pointer"
                                  >
                                    <Edit2 className="size-3.5" />
                                  </Button>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="size-8 p-0 text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/30 cursor-pointer"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          ¿Seguro que deseas eliminar "{item.title}"? Esta acción borrará permanentemente la sesión.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteAgendaItem(item.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Sí, eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* QUICK FORM DIALOG MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Editar Sesión de la Agenda" : "Agregar Actividad al Cronograma"}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-4">

            {/* Name input */}
            <div className="space-y-1.5">
              <label htmlFor="modalActivityName" className="text-xs font-semibold text-foreground">
                Título de la Actividad <span className="text-destructive">*</span>
              </label>
              <Input
                id="modalActivityName"
                placeholder="Ej. Keynote: Futuro de la Inteligencia Artificial"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="modalDescription" className="text-xs font-semibold text-foreground">
                Descripción
              </label>
              <textarea
                id="modalDescription"
                rows={3}
                placeholder="Escribe un breve resumen de los temas o desarrollo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-20 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                disabled={isSubmitting}
              />
            </div>

            {/* Grid of Dates & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Start date & time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <span>Inicio de Actividad</span>
                </label>
                <div className="flex gap-2">
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
                  <div className="w-[100px]">
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

              {/* End date & time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span>Fin de Actividad</span>
                </label>
                <div className="flex gap-2">
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
                  <div className="w-[100px]">
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

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Custom location */}
              <div className="space-y-1.5">
                <label htmlFor="modalLocation" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  <span>Escenario / Sala</span>
                </label>
                <Input
                  id="modalLocation"
                  placeholder="Ej. Escenario Principal o Sala A"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Speaker Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <User className="size-3.5 text-muted-foreground" />
                  <span>Expositor Asignado</span>
                </label>
                <Select
                  value={speakerId}
                  onValueChange={setSpeakerId}
                >
                  <SelectTrigger disabled={isSubmitting}>
                    <SelectValue placeholder="Sin expositor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin expositor</SelectItem>
                    {eventSpeakers.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Activity Mode */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Modalidad:</span>
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

              {/* Publication Status */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Estado de Publicación:</span>
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

            {/* Conditionally rendered Zoom/Meet link */}
            {activityMode !== "PRESENCIAL" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                <label htmlFor="modalMeetingUrl" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Video className="size-3.5 text-muted-foreground" />
                  <span>Enlace de Videollamada</span>
                </label>
                <Input
                  id="modalMeetingUrl"
                  type="url"
                  placeholder="https://zoom.us/j/12345678"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Order index */}
            <div className="space-y-1.5">
              <label htmlFor="modalOrderIndex" className="text-xs font-semibold text-foreground">Índice de Ordenación Visual</label>
              <Input
                id="modalOrderIndex"
                type="number"
                min={0}
                value={orderIndex}
                onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                disabled={isSubmitting}
              />
            </div>

          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="text-xs h-9 font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs h-9 font-semibold"
            >
              {isSubmitting ? "Guardando..." : "Guardar Actividad"}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}

const rowHeight = 64; // px

const formatHourLabel = (h: number) => {
  if (h === 0) return "12 AM"
  if (h === 12) return "12 PM"
  if (h < 12) return `${h} AM`
  return `${h - 12} PM`
}

const formatHourDecimal = (hDec: number) => {
  const h = Math.floor(hDec)
  const m = Math.round((hDec - h) * 60)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

const formatTimeOnly = (isoStr?: string | null) => {
  if (!isoStr) return ""
  const d = new Date(isoStr)
  let h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, "0")
  const ampm = h >= 12 ? "pm" : "am"
  h = h % 12
  h = h ? h : 12
  return `${h}:${m}${ampm}`
}

const computeActivityLayouts = (activities: any[]) => {
  const sorted = [...activities].sort((a, b) => {
    const timeA = a.startTime ? new Date(a.startTime).getTime() : 0
    const timeB = b.startTime ? new Date(b.startTime).getTime() : 0
    return timeA - timeB
  })

  const clusters: any[][] = []
  let currentCluster: any[] = []
  let clusterEnd = 0

  for (const act of sorted) {
    const start = act.startTime ? new Date(act.startTime).getTime() : 0
    const end = act.endTime ? new Date(act.endTime).getTime() : 0

    if (start >= clusterEnd) {
      if (currentCluster.length > 0) {
        clusters.push(currentCluster)
      }
      currentCluster = [act]
      clusterEnd = end
    } else {
      currentCluster.push(act)
      clusterEnd = Math.max(clusterEnd, end)
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster)
  }

  const layouts = new Map<string, { left: string; width: string }>()

  for (const cluster of clusters) {
    const columns: any[][] = []
    for (const act of cluster) {
      let placed = false
      const actStart = act.startTime ? new Date(act.startTime).getTime() : 0

      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        const col = columns[colIdx]
        const lastAct = col[col.length - 1]
        const lastEnd = lastAct.endTime ? new Date(lastAct.endTime).getTime() : 0

        if (actStart >= lastEnd) {
          col.push(act)
          placed = true
          break
        }
      }
      if (!placed) {
        columns.push([act])
      }
    }

    const colCount = columns.length
    for (let colIdx = 0; colIdx < colCount; colIdx++) {
      const col = columns[colIdx]
      for (const act of col) {
        layouts.set(act.id, {
          left: `${(colIdx * 100) / colCount}%`,
          width: `${100 / colCount}%`
        })
      }
    }
  }

  return layouts
}

