import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import type { Speaker, Edition, AgendaItem } from "@/store/event.store"
import {
  Calendar, MapPin, Users, Settings, UserCheck, Layers, BookOpen, Clock,
  Plus, Edit2, Trash2, CheckCircle2, AlertCircle, X, Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { PageHeader } from "@/components/page-header"

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    events, editions, speakers, agendaItems, attendees,
    updateEvent, deleteEvent,
    addEdition, updateEdition, deleteEdition,
    addSpeaker, updateSpeaker, deleteSpeaker,
    addAgendaItem, updateAgendaItem, deleteAgendaItem,
    addAttendee, toggleAttendeeCheckIn, deleteAttendee
  } = useEventStore()

  const event = events.find((e) => e.id === id)

  // Sub-navigation state
  const [activeTab, setActiveTab] = useState<"overview" | "editions" | "speakers" | "agenda" | "attendees">("overview")

  // Overview edit states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [location, setLocation] = useState("")
  const [format, setFormat] = useState<"online" | "hybrid" | "physical">("physical")
  const [status, setStatus] = useState<"draft" | "published" | "finished">("draft")
  const [banner, setBanner] = useState("")
  const [isSavedAlertOpen, setIsSavedAlertOpen] = useState(false)

  // Modals visibility states
  const [isEditionModalOpen, setIsEditionModalOpen] = useState(false)
  const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState(false)
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false)
  const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false)

  // Creation/Edit States for child items
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  // -- Edition creation states
  const [edName, setEdName] = useState("")
  const [edStart, setEdStart] = useState("")
  const [edEnd, setEdEnd] = useState("")
  const [edStatus, setEdStatus] = useState<"active" | "completed" | "planned">("planned")

  // -- Speaker creation states
  const [spName, setSpName] = useState("")
  const [spAvatar, setSpAvatar] = useState("")
  const [spTalkTitle, setSpTalkTitle] = useState("")
  const [spTalkDesc, setSpTalkDesc] = useState("")
  const [spBio, setSpBio] = useState("")

  // -- Agenda item creation states
  const [agTime, setAgTime] = useState("")
  const [agTitle, setAgTitle] = useState("")
  const [agStage, setAgStage] = useState("")
  const [agSpeakerId, setAgSpeakerId] = useState("")

  // -- Attendee creation states
  const [atName, setAtName] = useState("")
  const [atEmail, setAtEmail] = useState("")
  const [atTicket, setAtTicket] = useState<"General" | "VIP" | "Speaker">("General")

  // Synchronize state when event changes
  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description)
      setDate(event.date)
      setLocation(event.location)
      setFormat(event.format)
      setStatus(event.status)
      setBanner(event.banner)
    }
  }, [event])

  if (!event) {
    return (
      <div className="p-8 text-center border border-border bg-card rounded-xl space-y-4">
        <AlertCircle className="size-12 mx-auto text-destructive" />
        <h3 className="font-bold text-lg">Evento no encontrado</h3>
        <p className="text-sm text-muted-foreground">El evento seleccionado no existe o pertenece a otra organización.</p>
        <Button onClick={() => navigate("/dashboard/events")} variant="outline">
          Volver a Eventos
        </Button>
      </div>
    )
  }

  // Filter child items to only belong to this event
  const eventEditions = editions.filter((ed) => ed.eventId === event.id)
  const eventSpeakers = speakers.filter((sp) => sp.eventId === event.id)
  const eventAgenda = agendaItems.filter((ag) => ag.eventId === event.id)
  const eventAttendees = attendees.filter((at) => at.eventId === event.id)

  // Calculations for attendees tab
  const checkedInCount = eventAttendees.filter(a => a.checkedIn).length
  const vipCount = eventAttendees.filter(a => a.ticketType === "VIP").length
  const attendanceRate = eventAttendees.length > 0 ? Math.round((checkedInCount / eventAttendees.length) * 100) : 0

  // Event handlers
  const handleUpdateOverview = (e: React.FormEvent) => {
    e.preventDefault()
    updateEvent(event.id, {
      title,
      description,
      date,
      location,
      format,
      status,
      banner
    })
    setIsSavedAlertOpen(true)
    setTimeout(() => setIsSavedAlertOpen(false), 3000)
  }

  const handleDeleteEvent = () => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el evento "${event.title}"? Esta acción no se puede deshacer.`)) {
      deleteEvent(event.id)
      navigate("/dashboard/events")
    }
  }

  // Editions Crud Action
  const handleSaveEdition = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItemId) {
      updateEdition(editingItemId, {
        name: edName,
        startDate: edStart,
        endDate: edEnd,
        status: edStatus
      })
    } else {
      addEdition({
        eventId: event.id,
        name: edName,
        startDate: edStart,
        endDate: edEnd,
        status: edStatus
      })
    }
    closeEditionModal()
  }

  const handleEditEdition = (ed: Edition) => {
    setEditingItemId(ed.id)
    setEdName(ed.name)
    setEdStart(ed.startDate)
    setEdEnd(ed.endDate)
    setEdStatus(ed.status)
    setIsEditionModalOpen(true)
  }

  const closeEditionModal = () => {
    setIsEditionModalOpen(false)
    setEditingItemId(null)
    setEdName("")
    setEdStart("")
    setEdEnd("")
    setEdStatus("planned")
  }

  // Speakers Crud Action
  const handleSaveSpeaker = (e: React.FormEvent) => {
    e.preventDefault()
    const defaultAvatar = spAvatar.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(spName)}`

    if (editingItemId) {
      updateSpeaker(editingItemId, {
        name: spName,
        avatar: defaultAvatar,
        talkTitle: spTalkTitle,
        talkDescription: spTalkDesc,
        bio: spBio
      })
    } else {
      addSpeaker({
        eventId: event.id,
        name: spName,
        avatar: defaultAvatar,
        talkTitle: spTalkTitle,
        talkDescription: spTalkDesc,
        bio: spBio
      })
    }
    closeSpeakerModal()
  }

  const handleEditSpeaker = (sp: Speaker) => {
    setEditingItemId(sp.id)
    setSpName(sp.name)
    setSpAvatar(sp.avatar)
    setSpTalkTitle(sp.talkTitle)
    setSpTalkDesc(sp.talkDescription)
    setSpBio(sp.bio)
    setIsSpeakerModalOpen(true)
  }

  const closeSpeakerModal = () => {
    setIsSpeakerModalOpen(false)
    setEditingItemId(null)
    setSpName("")
    setSpAvatar("")
    setSpTalkTitle("")
    setSpTalkDesc("")
    setSpBio("")
  }

  // Agenda Crud Action
  const handleSaveAgendaItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItemId) {
      updateAgendaItem(editingItemId, {
        timeSlot: agTime,
        title: agTitle,
        stage: agStage,
        speakerId: agSpeakerId
      })
    } else {
      addAgendaItem({
        eventId: event.id,
        timeSlot: agTime,
        title: agTitle,
        stage: agStage,
        speakerId: agSpeakerId
      })
    }
    closeAgendaModal()
  }

  const handleEditAgendaItem = (item: AgendaItem) => {
    setEditingItemId(item.id)
    setAgTime(item.timeSlot)
    setAgTitle(item.title)
    setAgStage(item.stage)
    setAgSpeakerId(item.speakerId)
    setIsAgendaModalOpen(true)
  }

  const closeAgendaModal = () => {
    setIsAgendaModalOpen(false)
    setEditingItemId(null)
    setAgTime("")
    setAgTitle("")
    setAgStage("")
    setAgSpeakerId("")
  }

  // Attendee Action
  const handleSaveAttendee = (e: React.FormEvent) => {
    e.preventDefault()
    addAttendee({
      eventId: event.id,
      fullName: atName,
      email: atEmail,
      ticketType: atTicket,
      registrationDate: new Date().toISOString().split("T")[0],
      checkedIn: false
    })
    closeAttendeeModal()
  }

  const closeAttendeeModal = () => {
    setIsAttendeeModalOpen(false)
    setAtName("")
    setAtEmail("")
    setAtTicket("General")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={title}
        description="Detalle y gestión del evento, ediciones, ponentes, agenda y asistentes."
        showBackButton
        onBackClick={() => navigate("/dashboard/events")}
      />

      {/* Main Banner Board */}
      <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col md:flex-row relative">
        <div className="h-44 md:h-auto md:w-80 shrink-0 bg-muted relative">
          <img src={banner} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {status === "published" ? "Publicado" : status === "finished" ? "Finalizado" : "Borrador"}
              </span>
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-md font-semibold capitalize">
                {format === "physical" ? "Presencial" : format === "online" ? "Online" : "Híbrido"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground line-clamp-2">{description || "Sin descripción."}</p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="size-4 text-primary" /> {date || "Definir"}</span>
            <span className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" /> {location || "Definir"}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto select-none no-scrollbar">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors shrink-0 ${activeTab === "overview" ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <Settings className="size-4" />
          General
        </button>
        <button
          onClick={() => setActiveTab("editions")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors shrink-0 ${activeTab === "editions" ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <Layers className="size-4" />
          Ediciones ({eventEditions.length})
        </button>
        <button
          onClick={() => setActiveTab("speakers")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors shrink-0 ${activeTab === "speakers" ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <BookOpen className="size-4" />
          Ponentes ({eventSpeakers.length})
        </button>
        <button
          onClick={() => setActiveTab("agenda")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors shrink-0 ${activeTab === "agenda" ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <Clock className="size-4" />
          Agenda ({eventAgenda.length})
        </button>
        <button
          onClick={() => setActiveTab("attendees")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors shrink-0 ${activeTab === "attendees" ? "border-primary text-primary font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <Users className="size-4" />
          Participantes ({eventAttendees.length})
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">

        {/* -- TAB: OVERVIEW -- */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold border-b border-border pb-2">Información del Evento</h3>

            {isSavedAlertOpen && (
              <div className="p-3 text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                Los cambios se guardaron con éxito en base de datos.
              </div>
            )}

            <form onSubmit={handleUpdateOverview} className="space-y-4 max-w-2xl">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="title">Título del Evento</FieldLabel>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">Descripción</FieldLabel>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="date">Fecha</FieldLabel>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="format">Formato</FieldLabel>
                    <select
                      id="format"
                      value={format}
                      onChange={(e: any) => setFormat(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="physical">Presencial</option>
                      <option value="online">Online</option>
                      <option value="hybrid">Híbrido</option>
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="location">Ubicación / Plataforma</FieldLabel>
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="status">Estado de Publicación</FieldLabel>
                    <select
                      id="status"
                      value={status}
                      onChange={(e: any) => setStatus(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="draft">Borrador</option>
                      <option value="published">Publicado</option>
                      <option value="finished">Finalizado</option>
                    </select>
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="banner">URL del Banner del Evento</FieldLabel>
                  <Input id="banner" value={banner} onChange={(e) => setBanner(e.target.value)} required />
                </Field>

                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <Button type="button" onClick={handleDeleteEvent} variant="destructive" className="font-semibold">
                    <Trash2 className="size-4 mr-2" />
                    Eliminar Evento
                  </Button>
                  <Button type="submit" className="font-semibold">
                    Guardar Cambios
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </div>
        )}

        {/* -- TAB: EDITIONS -- */}
        {activeTab === "editions" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold">Ediciones / Ciclos de Evento</h3>
              <Button onClick={() => setIsEditionModalOpen(true)} className="text-xs px-3 py-1.5 h-8">
                <Plus className="size-4 mr-1.5" />
                Agregar Edición
              </Button>
            </div>

            {eventEditions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No hay ediciones programadas. Crea una para rastrear este ciclo de evento.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {eventEditions.map((ed) => (
                  <div key={orgEventId(ed.id)} className="p-4 bg-background border border-border rounded-lg flex items-center justify-between shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{ed.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${ed.status === "active" ? "bg-emerald-500/10 text-emerald-600" : ed.status === "completed" ? "bg-muted text-muted-foreground" : "bg-amber-500/10 text-amber-600"
                          }`}>
                          {ed.status === "active" ? "Activo" : ed.status === "completed" ? "Completado" : "Planeado"}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Duración: {ed.startDate} al {ed.endDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => handleEditEdition(ed)} variant="ghost" className="size-7 p-0"><Edit2 className="size-3.5" /></Button>
                      <Button onClick={() => deleteEdition(ed.id)} variant="ghost" className="size-7 p-0 text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -- TAB: SPEAKERS -- */}
        {activeTab === "speakers" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold">Ponentes del Evento</h3>
              <Button onClick={() => setIsSpeakerModalOpen(true)} className="text-xs px-3 py-1.5 h-8">
                <Plus className="size-4 mr-1.5" />
                Agregar Ponente
              </Button>
            </div>

            {eventSpeakers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No hay ponentes registrados para esta conferencia.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {eventSpeakers.map((sp) => (
                  <div key={orgEventId(sp.id)} className="p-5 bg-background border border-border rounded-xl flex items-start gap-4 shadow-xs relative group">
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button onClick={() => handleEditSpeaker(sp)} variant="ghost" className="size-7 p-0"><Edit2 className="size-3.5" /></Button>
                      <Button onClick={() => deleteSpeaker(sp.id)} variant="ghost" className="size-7 p-0 text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></Button>
                    </div>

                    <img src={sp.avatar} alt={sp.name} className="size-12 rounded-full bg-muted object-cover" />

                    <div className="space-y-2 flex-1">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-sm leading-none flex items-center gap-1.5">
                          {sp.name}
                        </h4>
                        <span className="text-[10px] text-muted-foreground block line-clamp-1">{sp.bio}</span>
                      </div>

                      <div className="p-3 bg-muted/40 border border-border/60 rounded-lg space-y-1">
                        <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider">Ponencia</span>
                        <p className="text-xs font-semibold leading-snug">{sp.talkTitle}</p>
                        <p className="text-[10px] text-muted-foreground leading-normal line-clamp-2">{sp.talkDescription}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -- TAB: AGENDA -- */}
        {activeTab === "agenda" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold">Cronograma de Sesiones</h3>
              <Button onClick={() => setIsAgendaModalOpen(true)} className="text-xs px-3 py-1.5 h-8">
                <Plus className="size-4 mr-1.5" />
                Programar Sesión
              </Button>
            </div>

            {eventAgenda.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No hay sesiones programadas en la agenda.
              </div>
            ) : (
              <div className="relative border-l-2 border-border ml-3 pl-6 space-y-6 py-2">
                {eventAgenda.map((item) => {
                  const sp = eventSpeakers.find(s => s.id === item.speakerId)
                  return (
                    <div key={orgEventId(item.id)} className="relative group bg-background border border-border p-4 rounded-xl shadow-xs">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-5 size-4 bg-emerald-500 rounded-full border-4 border-card" />

                      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button onClick={() => handleEditAgendaItem(item)} variant="ghost" className="size-7 p-0"><Edit2 className="size-3.5" /></Button>
                        <Button onClick={() => deleteAgendaItem(item.id)} variant="ghost" className="size-7 p-0 text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                          <span className="flex items-center gap-1 text-primary"><Clock className="size-3.5" /> {item.timeSlot}</span>
                          <span>•</span>
                          <span className="bg-muted px-2 py-0.5 rounded-md">{item.stage}</span>
                        </div>

                        <h4 className="font-bold text-base leading-snug">{item.title}</h4>

                        {sp && (
                          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                            <img src={sp.avatar} alt={sp.name} className="size-5 rounded-full" />
                            <span className="text-[11px] font-medium">Expositor: {sp.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* -- TAB: ATTENDEES -- */}
        {activeTab === "attendees" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold">Participantes Registrados</h3>
              <Button onClick={() => setIsAttendeeModalOpen(true)} className="text-xs px-3 py-1.5 h-8">
                <Plus className="size-4 mr-1.5" />
                Registrar Participante
              </Button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/40 border border-border/80 rounded-xl text-center">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Registrados</p>
                <p className="text-xl font-bold">{eventAttendees.length}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Tickets VIP</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-500">{vipCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Asistencia (Check-in)</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-500">{attendanceRate}%</p>
              </div>
            </div>

            {eventAttendees.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No hay participantes inscritos en este momento.
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/60 text-xs font-bold text-muted-foreground border-b border-border uppercase">
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Correo</th>
                      <th className="p-3">Ticket</th>
                      <th className="p-3 text-center">Check-In</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {eventAttendees.map((at) => (
                      <tr key={orgEventId(at.id)} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3 font-semibold">{at.fullName}</td>
                        <td className="p-3 text-xs text-muted-foreground">{at.email}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${at.ticketType === "VIP" ? "bg-amber-500/10 text-amber-600" : at.ticketType === "Speaker" ? "bg-indigo-500/10 text-indigo-600" : "bg-muted text-muted-foreground"
                            }`}>
                            {at.ticketType}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleAttendeeCheckIn(at.id)}
                            className={`p-1.5 rounded-full border transition-colors inline-flex ${at.checkedIn
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                                : "bg-muted/40 border-border/80 text-muted-foreground/60 hover:text-foreground"
                              }`}
                          >
                            {at.checkedIn ? <UserCheck className="size-4" /> : <Check className="size-4" />}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <Button onClick={() => deleteAttendee(at.id)} variant="ghost" className="size-7 p-0 text-destructive hover:bg-destructive/10">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- ADD EDITION MODAL --- */}
      {isEditionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-xl w-full max-w-md relative shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
            <button onClick={closeEditionModal} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground outline-none"><X className="size-4" /></button>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{editingItemId ? "Editar Edición" : "Agregar Edición"}</h3>
              <p className="text-xs text-muted-foreground">Ingresa el título del ciclo, y los rangos de fecha de realización.</p>
            </div>

            <form onSubmit={handleSaveEdition} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="edName">Nombre de la Edición</FieldLabel>
                  <Input id="edName" value={edName} onChange={(e) => setEdName(e.target.value)} placeholder="Ej. Edición Anual 2026, Summer Edition" required />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="edStart">Fecha Inicio</FieldLabel>
                    <Input id="edStart" type="date" value={edStart} onChange={(e) => setEdStart(e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="edEnd">Fecha Cierre</FieldLabel>
                    <Input id="edEnd" type="date" value={edEnd} onChange={(e) => setEdEnd(e.target.value)} required />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="edStatus">Estado de la Edición</FieldLabel>
                  <select
                    id="edStatus"
                    value={edStatus}
                    onChange={(e: any) => setEdStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm outline-none"
                  >
                    <option value="planned">Planificada</option>
                    <option value="active">Activa (En curso)</option>
                    <option value="completed">Completada</option>
                  </select>
                </Field>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeEditionModal}>Cancelar</Button>
                  <Button type="submit" className="font-semibold">Guardar Edición</Button>
                </div>
              </FieldGroup>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD SPEAKER MODAL --- */}
      {isSpeakerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-xl w-full max-w-lg relative shadow-xl space-y-6 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <button onClick={closeSpeakerModal} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground outline-none"><X className="size-4" /></button>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{editingItemId ? "Editar Ponente" : "Agregar Ponente"}</h3>
              <p className="text-xs text-muted-foreground">Ingresa los datos personales y el título de la charla del expositor.</p>
            </div>

            <form onSubmit={handleSaveSpeaker} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="spName">Nombre del Ponente</FieldLabel>
                  <Input id="spName" value={spName} onChange={(e) => setSpName(e.target.value)} placeholder="Ej. Dr. Alex Rivera" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="spAvatar">URL de Foto/Avatar (Opcional)</FieldLabel>
                  <Input id="spAvatar" value={spAvatar} onChange={(e) => setSpAvatar(e.target.value)} placeholder="https://ejemplo.com/foto.png" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="spBio">Breve Biografía / Institución</FieldLabel>
                  <Input id="spBio" value={spBio} onChange={(e) => setSpBio(e.target.value)} placeholder="Ej. Arquitecto de Software en Microsoft, 10 años de Exp." required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="spTalkTitle">Título de la Charla / Conferencia</FieldLabel>
                  <Input id="spTalkTitle" value={spTalkTitle} onChange={(e) => setSpTalkTitle(e.target.value)} placeholder="Ej. El impacto de ChatGPT en el desarrollo frontend" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="spTalkDesc">Resumen de la Ponencia</FieldLabel>
                  <textarea
                    id="spTalkDesc"
                    value={spTalkDesc}
                    onChange={(e) => setSpTalkDesc(e.target.value)}
                    placeholder="Describe los tópicos principales de la exposición..."
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </Field>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeSpeakerModal}>Cancelar</Button>
                  <Button type="submit" className="font-semibold">Guardar Ponente</Button>
                </div>
              </FieldGroup>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD AGENDA MODAL --- */}
      {isAgendaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-xl w-full max-w-md relative shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
            <button onClick={closeAgendaModal} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground outline-none"><X className="size-4" /></button>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{editingItemId ? "Editar Sesión" : "Programar Sesión"}</h3>
              <p className="text-xs text-muted-foreground">Define el bloque de hora, el título del taller y el expositor correspondiente.</p>
            </div>

            <form onSubmit={handleSaveAgendaItem} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="agTime">Horario (Bloque de Tiempo)</FieldLabel>
                  <Input id="agTime" value={agTime} onChange={(e) => setAgTime(e.target.value)} placeholder="Ej. 09:00 AM - 10:00 AM" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="agTitle">Nombre de la Sesión / Taller</FieldLabel>
                  <Input id="agTitle" value={agTitle} onChange={(e) => setAgTitle(e.target.value)} placeholder="Ej. Keynote Apertura e Inauguración" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="agStage">Escenario / Aula</FieldLabel>
                  <Input id="agStage" value={agStage} onChange={(e) => setAgStage(e.target.value)} placeholder="Ej. Main Stage, Sala de Taller B" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="agSpeakerId">Expositor Asignado (Opcional)</FieldLabel>
                  <select
                    id="agSpeakerId"
                    value={agSpeakerId}
                    onChange={(e) => setAgSpeakerId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm outline-none"
                  >
                    <option value="">Sin ponente asignado</option>
                    {eventSpeakers.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.name}</option>
                    ))}
                  </select>
                </Field>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeAgendaModal}>Cancelar</Button>
                  <Button type="submit" className="font-semibold">Guardar Sesión</Button>
                </div>
              </FieldGroup>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD ATTENDEE MODAL --- */}
      {isAttendeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-xl w-full max-w-md relative shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
            <button onClick={closeAttendeeModal} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground outline-none"><X className="size-4" /></button>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Inscribir Participante</h3>
              <p className="text-xs text-muted-foreground">Ingresa los datos del boleto del asistente.</p>
            </div>

            <form onSubmit={handleSaveAttendee} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="atName">Nombre Completo</FieldLabel>
                  <Input id="atName" value={atName} onChange={(e) => setAtName(e.target.value)} placeholder="Ej. Jefferson Santos" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="atEmail">Correo Electrónico</FieldLabel>
                  <Input id="atEmail" type="email" value={atEmail} onChange={(e) => setAtEmail(e.target.value)} placeholder="jefferson@example.com" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="atTicket">Tipo de Entrada (Boleto)</FieldLabel>
                  <select
                    id="atTicket"
                    value={atTicket}
                    onChange={(e: any) => setAtTicket(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm outline-none"
                  >
                    <option value="General">Boleto General</option>
                    <option value="VIP">Pase VIP</option>
                    <option value="Speaker">Ponente / Invitado Especial</option>
                  </select>
                </Field>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeAttendeeModal}>Cancelar</Button>
                  <Button type="submit" className="font-semibold">Registrar Participante</Button>
                </div>
              </FieldGroup>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function orgEventId(id: string) {
  return id
}
