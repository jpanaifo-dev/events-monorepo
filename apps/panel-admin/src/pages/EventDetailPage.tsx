import { useParams, useNavigate, NavLink, Outlet } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import { AlertCircle, Edit2, Settings, Layers, BookOpen, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"

const NAV_ITEMS = [
  { to: "info", label: "General", icon: Settings },
  { to: "editions", label: "Ediciones", icon: Layers },
  { to: "speakers", label: "Ponentes", icon: BookOpen },
  { to: "agenda", label: "Agenda", icon: Clock },
  { to: "attendees", label: "Participantes", icon: Users },
]

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { events, editions, speakers, agendaItems, attendees, isLoading } = useEventStore()

  const event = events.find((e) => e.id === id)

  const eventEditions = editions.filter((ed) => ed.mainEventId === id)
  const eventSpeakers = speakers.filter((sp) => sp.eventId === id)
  const eventAgenda = agendaItems.filter((ag) => ag.eventId === id)
  const eventAttendees = attendees.filter((at) => at.eventId === id)

  const counts: Record<string, number> = {
    editions: eventEditions.length,
    speakers: eventSpeakers.length,
    agenda: eventAgenda.length,
    attendees: eventAttendees.length,
  }

  if (isLoading && !event) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

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

  const basePath = `/dashboard/events/${event.id}`

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors rounded-r-md ${
      isActive
        ? "text-primary bg-primary/5 border-l-2 border-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent"
    }`

  const getTabClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors shrink-0 ${
      isActive
        ? "border-primary text-primary font-bold"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={event.name}
        description="Detalle y gestión del evento."
        showBackButton
        onBackClick={() => navigate("/dashboard/events")}
        actionButton={
          <Button
            onClick={() => navigate(`${basePath}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit2 className="size-4" />
            Editar Evento
          </Button>
        }
      />

      {/* Banner */}
      <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col md:flex-row relative">
        <div className="h-44 md:h-auto md:w-80 shrink-0 bg-muted relative">
          <img
            src={event.coverUrl || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60"}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {!event.isActive && (
                <span className="bg-red-500/10 text-red-600 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Inactivo
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{event.name}</h1>
            <p className="text-sm text-muted-foreground line-clamp-2">{event.shortDescription || "Sin descripción."}</p>
          </div>
        </div>
      </div>

      {/* Mobile: Tabs */}
      <div className="lg:hidden flex items-center gap-1 border-b border-border overflow-x-auto select-none no-scrollbar">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={`${basePath}/${item.to}`}
            className={getTabClass}
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Desktop: Aside + Content */}
      <div className="flex gap-6 items-start">
        {/* Aside Navigation (lg:) - Minimalista */}
        <aside className="hidden lg:block w-48 shrink-0 sticky top-20">
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={`${basePath}/${item.to}`}
                className={getLinkClass}
              >
                <item.icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                {counts[item.to] !== undefined && counts[item.to] > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {counts[item.to]}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content via Outlet */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
