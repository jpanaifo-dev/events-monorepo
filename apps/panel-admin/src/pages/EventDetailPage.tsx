import { useEffect } from "react"
import { useParams, useNavigate, NavLink, Outlet } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { useEventStore } from "@/store/event.store"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"

const NAV_ITEMS = [
  { to: "info", label: "General" },
  { to: "editions", label: "Ediciones" },
  { to: "speakers", label: "Ponentes" },
  { to: "agenda", label: "Agenda" },
  { to: "attendees", label: "Participantes" },
  { to: "roles", label: "Roles" },
]

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedOrganization } = useAuthStore()
  const { events, editions, speakers, agendaItems, attendees, roles, isLoading, loadData, loadRoles } = useEventStore()

  useEffect(() => {
    if (selectedOrganization?.id) {
      loadData(selectedOrganization.id)
    }
  }, [selectedOrganization?.id, loadData])

  useEffect(() => {
    if (id) {
      loadRoles(id)
    }
  }, [id, loadRoles])

  const event = events.find((e) => e.id === id)

  const eventEditions = editions.filter((ed) => ed.mainEventId === id)
  const eventSpeakers = speakers.filter((sp) => sp.eventId === id)
  const eventAgenda = agendaItems.filter((ag) => ag.eventId === id)
  const eventAttendees = attendees.filter((at) => at.eventId === id)
  const eventRoles = roles.filter((r) => r.mainEventId === id)

  const counts: Record<string, number> = {
    editions: eventEditions.length,
    speakers: eventSpeakers.length,
    agenda: eventAgenda.length,
    attendees: eventAttendees.length,
    roles: eventRoles.length,
  }

  if (isLoading && !event) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full">
          <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </main>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full">
          <div className="p-8 text-center border border-border bg-card rounded-xl space-y-4">
            <AlertCircle className="size-12 mx-auto text-destructive" />
            <h3 className="font-bold text-lg">Evento no encontrado</h3>
            <p className="text-sm text-muted-foreground">El evento seleccionado no existe o pertenece a otra organización.</p>
            <Button onClick={() => navigate("/dashboard/events")} variant="outline">
              Volver a Eventos
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const basePath = `/dashboard/events/${event.id}`

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors shrink-0 ${isActive
      ? "border-primary text-primary font-bold"
      : "border-transparent text-muted-foreground hover:text-foreground"
    }`

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="mb-8">
          <PageHeader
            title={event.name}
            description="Gestión del evento."
            showBackButton
            onBackClick={() => navigate("/dashboard/events")}
          />
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 border-b border-border overflow-x-auto select-none no-scrollbar mb-8">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={`${basePath}/${item.to}`}
              className={getLinkClass}
            >
              {item.label}
              {counts[item.to] !== undefined && counts[item.to] > 0 && (
                <span className="text-[10px] text-muted-foreground ml-1">
                  ({counts[item.to]})
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Content via Outlet */}
        <Outlet />
      </main>
    </div>
  )
}
