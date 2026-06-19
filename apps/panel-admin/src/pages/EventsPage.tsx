import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { useEventStore, type EventFilters } from "@/store/event.store"
import { Search, Plus, Calendar, Globe, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"

export function EventsPage() {
  const { selectedOrganization } = useAuthStore()
  const { events, isLoading, loadData } = useEventStore()
  const navigate = useNavigate()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const fetchEvents = useCallback(() => {
    if (!selectedOrganization?.id) return
    const filters: EventFilters = {}
    if (debouncedSearch) filters.search = debouncedSearch
    if (statusFilter !== "all") filters.status = statusFilter
    loadData(selectedOrganization.id, filters)
  }, [selectedOrganization?.id, debouncedSearch, statusFilter, loadData])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "published":
        return <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Publicado</span>
      case "archived":
        return <span className="bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Archivado</span>
      default:
        return <span className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Borrador</span>
    }
  }

  const defaultBanner = "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60"

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title="Eventos"
        description={`Administra el catálogo de conferencias y congresos para ${selectedOrganization?.name}.`}
        actionButton={
          <Button
            onClick={() => navigate("/dashboard/events/new")}
            className="flex items-center gap-2"
          >
            <Plus className="size-4" />
            Nuevo Evento
          </Button>
        }
      />

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { value: "all", label: "Todos" },
            { value: "published", label: "Publicados" },
            { value: "draft", label: "Borradores" },
            { value: "archived", label: "Archivados" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none transition-colors shrink-0 ${statusFilter === opt.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="p-16 text-center border border-dashed border-border rounded-xl bg-card space-y-4">
          <Loader2 className="size-8 mx-auto text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando eventos...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-border rounded-xl bg-card space-y-4">
          <Calendar className="size-12 mx-auto text-muted-foreground" />
          <h3 className="font-bold text-lg">No hay eventos en este momento</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {search || statusFilter !== "all"
              ? "No se encontraron eventos con los filtros aplicados."
              : "Comienza registrando un nuevo evento para publicar agendas, ponentes e inscripciones."}
          </p>
          {!search && statusFilter === "all" && (
            <Button onClick={() => navigate("/dashboard/events/new")} variant="outline">
              Crear Evento
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => navigate(`/dashboard/events/${event.id}`)}
              className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md cursor-pointer transition-all flex flex-col h-full"
            >
              <div className="h-44 w-full overflow-hidden bg-muted relative">
                <img
                  src={event.coverUrl || defaultBanner}
                  alt={event.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 z-10">
                  {getStatusBadge(event.status)}
                </div>
                {!event.isActive && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Inactivo</span>
                  </div>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {event.contactEmail && (
                      <span className="text-[10px] text-muted-foreground font-semibold truncate max-w-[150px]">
                        {event.contactEmail}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 shrink-0">
                      <Calendar className="size-3" />
                      {event.createdAt ? new Date(event.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "short" }) : ""}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                    {event.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {event.shortDescription || "Sin descripción proporcionada."}
                  </p>
                </div>

                <div className="border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {event.websiteUrl && (
                      <a
                        href={event.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Globe className="size-3.5" />
                        Web
                      </a>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                    Administrar
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
