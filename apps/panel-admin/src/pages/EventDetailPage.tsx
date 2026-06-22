import { useEffect, useState } from "react"
import { useParams, useNavigate, NavLink, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { useEventStore } from "@/store/event.store"
import { cn } from "@/lib/utils"
import { AlertCircle, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const NAV_ITEMS = [
  { to: "info", label: "General" },
  { to: "editions", label: "Ediciones" },
  { to: "speakers", label: "Ponentes" },
  { to: "agenda", label: "Agenda" },
  { to: "attendees", label: "Participantes" },
  { to: "roles", label: "Roles" },
  { to: "thematic-lines", label: "Líneas Temáticas" },
  { to: "tickets", label: "Tickets" },
]

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedOrganization } = useAuthStore()
  const { events, editions, speakers, agendaItems, attendees, roles, thematicLines, tickets, isLoading, loadData, loadRoles } = useEventStore()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

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
  const eventThematicLines = thematicLines.filter((tl) => tl.mainEventId === id)
  const eventTickets = tickets.filter((tk) => tk.mainEventId === id)

  const counts: Record<string, number> = {
    editions: eventEditions.length,
    speakers: eventSpeakers.length,
    agenda: eventAgenda.length,
    attendees: eventAttendees.length,
    roles: eventRoles.length,
    "thematic-lines": eventThematicLines.length,
    tickets: eventTickets.length,
  }

  if (isLoading && !event) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="container mx-auto px-6 py-12 flex-1 w-full">
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
        <main className="container mx-auto px-6 py-12 flex-1 w-full">
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
  const { pathname } = useLocation()
  const isAgendaPage = pathname.includes("/agenda")
  const activeItem = NAV_ITEMS.find((item) => pathname.includes(item.to))
  const activeLabel = activeItem ? activeItem.label : "Secciones"

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col lg:flex-row">
      {/* Sidebar / Aside Navigation (Desktop) - Fixed to the left */}
      <aside className="hidden lg:flex flex-col w-60 fixed left-0 top-0 bottom-0 border-r border-border bg-card p-6 z-20 overflow-y-auto">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const toPath = `${basePath}/${item.to}`
            return (
              <NavLink
                key={item.to}
                to={toPath}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between py-2 text-sm transition-colors",
                    isActive
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground font-medium"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {counts[item.to] !== undefined && counts[item.to] > 0 && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-normal transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {counts[item.to]}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area - Shifted to the right by the fixed sidebar width on lg screens */}
      <div className="flex-1 lg:pl-60 flex flex-col min-w-0">
        <main className="container mx-auto py-12 px-6 flex-1 w-full">
          <div className="mb-8">
            <PageHeader
              title={event.name}
              description="Gestión del evento."
              showBackButton
              onBackClick={() => navigate("/dashboard/events")}
            />
          </div>

          {/* Sheet / Drawer Navigation (Mobile & Tablet) */}
          <div className="lg:hidden w-full mb-6">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full flex items-center justify-between px-4 py-2 h-10">
                  <span className="flex items-center gap-2">
                    <Menu className="size-4" />
                    <span>Navegación del Evento</span>
                  </span>
                  <span className="text-xs text-muted-foreground font-normal bg-muted px-2.5 py-0.5 rounded-full">
                    {activeLabel}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-6 flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-lg leading-none tracking-tight">Menú de Evento</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">{event.name}</p>
                </div>
                <nav className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => {
                    const toPath = `${basePath}/${item.to}`
                    return (
                      <NavLink
                        key={item.to}
                        to={toPath}
                        onClick={() => setIsSheetOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center justify-between py-2.5 text-sm transition-colors",
                            isActive
                              ? "text-primary font-bold"
                              : "text-muted-foreground hover:text-foreground font-medium"
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span>{item.label}</span>
                            {counts[item.to] !== undefined && counts[item.to] > 0 && (
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-normal transition-colors",
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {counts[item.to]}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Main Outlet Area - "el cuerpo" with max-width limit */}
          <div className={cn(
            "w-full transition-all duration-300",
            isAgendaPage ? "max-w-[98%]" : "max-w-7xl"
          )}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
