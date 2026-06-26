import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { createPortal } from "react-dom"
import { z } from "zod"
import { useEventStore } from "@/store/event.store"
import type { AgendaItem } from "@/store/event.store"
import { supabase } from "@/utils/supabase"
import {
  Plus,
  Edit,
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
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
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
      <div className="relative w-full max-w-2xl lg:max-w-3xl bg-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
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
  const zoomLevel = useMemo(() => {
    const val = searchParams.get("zoom")
    if (val === '1h' || val === '30min' || val === '15min') return val
    return '30min' as const
  }, [searchParams])

  const setZoomLevel = (val: '1h' | '30min' | '15min' | ((prev: '1h' | '30min' | '15min') => '1h' | '30min' | '15min')) => {
    const next = typeof val === 'function' ? val(zoomLevel) : val
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set('zoom', next)
      return p
    })
  }

  const rowHeight = zoomLevel === '15min' ? 200 : zoomLevel === '30min' ? 120 : 64

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

  const agendaColumns: ColumnDef<any>[] = [
    {
      header: "Horario",
      className: "p-4 font-semibold text-foreground border-r border-border whitespace-nowrap",
      headerClassName: "p-4 w-[160px] border-r border-border",
      cell: (item) => {
        const [hStart, hEnd] = item.timeSlot ? item.timeSlot.split(" - ") : ["09:00", "10:00"]
        return `${hStart} - ${hEnd}`
      }
    },
    {
      header: "Actividades",
      className: "p-4 border-r border-border",
      headerClassName: "p-4 border-r border-border",
      cell: (item) => {
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
          <span className={isSpecial ? "text-red-500 font-semibold" : "font-semibold text-foreground"}>
            {item.title}
          </span>
        )
      }
    },
    {
      header: "Ponente y Tema",
      className: "p-4",
      headerClassName: "p-4",
      cell: (item) => {
        const sp = eventSpeakers.find((s) => s.id === item.speakerId)
        return (
          <div className="space-y-1">
            {sp ? (
              <>
                <p className="text-sm font-semibold text-foreground leading-snug">{sp.name}</p>
                {sp.talkTitle && (
                  <p className="text-xs text-muted-foreground leading-snug">{sp.talkTitle}</p>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground italic">Sin ponente asignado</span>
            )}
            {item.description && (
              <p className="text-xs text-muted-foreground/70 leading-relaxed mt-1">
                {item.description}
              </p>
            )}
          </div>
        )
      }
    }
  ]

  const listColumns: ColumnDef<any>[] = [
    {
      header: "Horario",
      className: "p-4 font-semibold text-primary whitespace-nowrap",
      headerClassName: "p-4 w-[140px]",
      cell: (item) => {
        const [hStart, hEnd] = item.timeSlot ? item.timeSlot.split(" - ") : ["09:00", "10:00"]
        return `${hStart} - ${hEnd}`
      }
    },
    {
      header: "Actividad / Tema",
      className: "p-4",
      headerClassName: "p-4",
      cell: (item) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground leading-snug">{item.title}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
              {item.description}
            </p>
          )}
        </div>
      )
    },
    {
      header: "Expositor",
      className: "p-4",
      headerClassName: "p-4",
      cell: (item) => {
        const sp = eventSpeakers.find((s) => s.id === item.speakerId)
        return sp ? (
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
        )
      }
    },
    {
      header: "Escenario",
      className: "p-4 text-xs font-medium text-muted-foreground",
      headerClassName: "p-4",
      accessorKey: "stage"
    },
    {
      header: "Modalidad",
      className: "p-4",
      headerClassName: "p-4",
      cell: (item) => getModeBadge(item.activityMode || "PRESENCIAL")
    },
    {
      header: "Estado",
      className: "p-4",
      headerClassName: "p-4",
      cell: (item) => getStatusIcon(item.status)
    },
    {
      header: "Acciones",
      headerClassName: "text-right p-4",
      className: "text-right p-4",
      cell: (item) => (
        <div className="inline-flex items-center gap-1 justify-end">
          <Button
            onClick={() => handleOpenEdit(item)}
            variant="outline"
            className="size-8 p-0 cursor-pointer"
          >
            <Edit className="size-3.5" />
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
      )
    }
  ]

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

    const isoStart = new Date(`${startDate}T${startTime}:00`).toISOString()
    const isoEnd = new Date(`${endDate}T${endTime}:00`).toISOString()

    const payload = {
      eventId: currentEdition?.id || eventId!,
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

      <PageHeader
        title="Planificador del Cronograma"
        description="Estructura las ponencias, talleres e itinerarios principales."
        actionButton={
          <div className="flex flex-wrap items-center gap-3">
            {/* Edition Select Dropdown in header */}
            {currentEdition && (
              <div className="flex items-center gap-2 bg-muted/20 border border-border/60 px-3 py-1 rounded-lg h-9">
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
                  <SelectTrigger className="w-[150px] h-7 text-xs border-none bg-transparent shadow-none focus:ring-0 p-0 pr-2 cursor-pointer">
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
              className="text-xs px-3.5 py-1.5 h-9 font-semibold font-sans"
            >
              <Plus className="size-4 mr-1.5" />
              Nueva Actividad
            </Button>
          </div>
        }
      />

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
                  {/* Zoom controls inside the grid top-right */}
                  <div className="absolute top-2 right-2 z-40 flex items-center gap-1 bg-card/90 backdrop-blur-xs border border-border/60 rounded-lg px-1.5 py-1 shadow-xs">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-1">Zoom</span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel('1h')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors cursor-pointer ${zoomLevel === '1h' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      title="1 fila = 1 hora"
                    >1h</button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel('30min')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors cursor-pointer ${zoomLevel === '30min' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      title="1 fila = 30 minutos"
                    >30m</button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel('15min')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors cursor-pointer ${zoomLevel === '15min' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      title="1 fila = 15 minutos"
                    >15m</button>
                    <div className="w-px h-3.5 bg-border/60 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => setZoomLevel(z => z === '1h' ? '30min' : z === '30min' ? '15min' : '15min')}
                      disabled={zoomLevel === '15min'}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Acercar"
                    ><ZoomIn className="size-3" /></button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(z => z === '15min' ? '30min' : z === '30min' ? '1h' : '1h')}
                      disabled={zoomLevel === '1h'}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Alejar"
                    ><ZoomOut className="size-3" /></button>
                  </div>
                  <div
                    className="relative flex cursor-crosshair"
                    style={{ height: `${24 * rowHeight}px` }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  >
                    {/* Left Column: Hour Labels */}
                    <div className="w-20 border-r border-border bg-muted/[0.02] shrink-0 flex flex-col pointer-events-none relative">
                      {orderedHours.map((h) => (
                        <div
                          key={h}
                          className="relative shrink-0"
                          style={{ height: `${rowHeight}px` }}
                        >
                          {/* Full hour label */}
                          <span className="absolute top-1.5 right-3 text-[11px] font-bold text-muted-foreground leading-none">
                            {formatHourLabel(h)}
                          </span>
                          {/* 30-min sub-label */}
                          {(zoomLevel === '30min' || zoomLevel === '15min') && (
                            <span
                              className="absolute right-3 text-[9px] font-medium text-muted-foreground/50 leading-none"
                              style={{ top: `${rowHeight / 2 + 1}px` }}
                            >
                              :{String(30).padStart(2, '0')}
                            </span>
                          )}
                          {/* 15-min sub-labels */}
                          {zoomLevel === '15min' && (
                            <>
                              <span
                                className="absolute right-3 text-[9px] font-medium text-muted-foreground/40 leading-none"
                                style={{ top: `${rowHeight * 0.25 + 1}px` }}
                              >:15</span>
                              <span
                                className="absolute right-3 text-[9px] font-medium text-muted-foreground/40 leading-none"
                                style={{ top: `${rowHeight * 0.75 + 1}px` }}
                              >:45</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Right Column: Grid and Cards */}
                    <div className="flex-1 relative">
                      {/* Horizontal Grid lines - full hours (solid) */}
                      {orderedHours.map((h, index) => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 border-t border-border/40 pointer-events-none"
                          style={{ top: `${index * rowHeight}px`, height: `${rowHeight}px` }}
                        />
                      ))}
                      {/* Sub-grid lines: 30-min intervals */}
                      {(zoomLevel === '30min' || zoomLevel === '15min') && orderedHours.map((_, index) => (
                        <div
                          key={`sub30-${index}`}
                          className="absolute left-0 right-0 border-t border-border/25 border-dashed pointer-events-none"
                          style={{ top: `${index * rowHeight + rowHeight / 2}px` }}
                        />
                      ))}
                      {/* Sub-grid lines: 15-min intervals */}
                      {zoomLevel === '15min' && orderedHours.map((_, index) => (
                        <>
                          <div
                            key={`sub15a-${index}`}
                            className="absolute left-0 right-0 border-t border-border/15 pointer-events-none"
                            style={{ top: `${index * rowHeight + rowHeight * 0.25}px` }}
                          />
                          <div
                            key={`sub15b-${index}`}
                            className="absolute left-0 right-0 border-t border-border/15 pointer-events-none"
                            style={{ top: `${index * rowHeight + rowHeight * 0.75}px` }}
                          />
                        </>
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
                                          <Edit className="size-2.5" />
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

              {selectedDate && (
                <DataTable
                  columns={agendaColumns}
                  data={sortedSelectedActivities}
                  containerClassName="border border-border rounded-xl bg-card overflow-hidden shadow-xs"
                  tbodyClassName="divide-y divide-border/60"
                  onRowClick={(item) => handleOpenEdit(item)}
                  emptyState={
                    <div className="p-8 text-center text-muted-foreground text-xs font-medium border border-border bg-card rounded-xl">
                      No hay actividades programadas para este día.
                    </div>
                  }
                />
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

                  <DataTable
                    columns={listColumns}
                    data={groupedAgenda[dateKey]}
                    containerClassName="overflow-x-auto border border-border rounded-xl bg-card/10 backdrop-blur-xs"
                    tbodyClassName="divide-y divide-border/50"
                  />
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

            {/* 1. Expositor Asignado (Full Width) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <User className="size-3.5 text-muted-foreground" />
                <span>Expositor Asignado (Opcional)</span>
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

              {/* Speaker Topics Suggestions */}
              {isLoadingSessions ? (
                <p className="text-[10px] text-muted-foreground italic">Cargando temas sugeridos...</p>
              ) : speakerSessions.length > 0 ? (
                <div className="space-y-1 mt-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground block">
                    Temas sugeridos del ponente (Haz clic para usar como título):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {speakerSessions.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => {
                          setActivityName(session.title)
                          toast.info(`Título establecido: "${session.title}"`)
                        }}
                        className="inline-flex items-center text-left gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                      >
                        {session.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : speakerId && (
                <p className="text-[10px] text-muted-foreground italic">El ponente no tiene temas de ponencia registrados en este evento.</p>
              )}
            </div>

            {/* 2. Título de la Actividad */}
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

            {/* 3. Descripción */}
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

            {/* 4. Fechas y Horas */}
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
                      key={`start-time-${editingItem?.id ?? 'new'}`}
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
                      key={`end-time-${editingItem?.id ?? 'new'}`}
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                {timeError && (
                  <p className="text-[10px] text-destructive font-medium mt-1">
                    {timeError}
                  </p>
                )}
              </div>
            </div>

            {/* 5. Custom location (Escenario / Sala) (Full Width) */}
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
              {branches.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[10px] font-medium text-muted-foreground">Sugerencias de sedes:</span>
                  <div className="flex flex-wrap gap-1">
                    {branches.map((branch) => {
                      const val = branch.address ? `${branch.name} - ${branch.address}` : branch.name
                      return (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => setCustomLocation(val)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
                        >
                          <MapPin className="size-2.5 text-muted-foreground" />
                          <span>{branch.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 6. Modalidad y Estado */}
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
                  <span>Enlace de Videollamada <span className="text-muted-foreground font-normal">(opcional)</span></span>
                </label>
                <Input
                  id="modalMeetingUrl"
                  type="url"
                  placeholder="https://zoom.us/j/12345678"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-[10px] text-muted-foreground">
                  Si aún no tienes el enlace, puedes dejarlo vacío. Se mostrará como <em>Aún no disponible</em>.
                </p>
              </div>
            )}

            {/* Order index removed from JSX layout to simplify form */}

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

// NOTE: rowHeight is now dynamic state inside EventAgendaSection (zoomLevel-based).
// Kept here only for reference — not used at module level anymore.
// const rowHeight = 64

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

