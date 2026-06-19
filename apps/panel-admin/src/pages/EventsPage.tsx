import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { useEventStore } from "@/store/event.store"
import { Search, Plus, Calendar, MapPin, Globe, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"

export function EventsPage() {
  const { selectedOrganization } = useAuthStore()
  const { events } = useEventStore()
  const navigate = useNavigate()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredEvents = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || e.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getFormatBadge = (fmt: string) => {
    switch (fmt) {
      case "online":
        return <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs px-2 py-0.5 rounded-md flex items-center gap-1"><Video className="size-3.5" /> Online</span>
      case "hybrid":
        return <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs px-2 py-0.5 rounded-md flex items-center gap-1"><Globe className="size-3.5" /> Híbrido</span>
      default:
        return <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-md flex items-center gap-1"><MapPin className="size-3.5" /> Presencial</span>
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "published":
        return <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Publicado</span>
      case "finished":
        return <span className="bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Finalizado</span>
      default:
        return <span className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Borrador</span>
    }
  }

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
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        {/* Status filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none transition-colors shrink-0 ${statusFilter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter("published")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none transition-colors shrink-0 ${statusFilter === "published" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Publicados
          </button>
          <button
            onClick={() => setStatusFilter("draft")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none transition-colors shrink-0 ${statusFilter === "draft" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Borradores
          </button>
          <button
            onClick={() => setStatusFilter("finished")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none transition-colors shrink-0 ${statusFilter === "finished" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Finalizados
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-border rounded-xl bg-card space-y-4">
          <Calendar className="size-12 mx-auto text-muted-foreground" />
          <h3 className="font-bold text-lg">No hay eventos en este momento</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Comienza registrando un nuevo evento para publicar agendas, ponentes e inscripciones.
          </p>
          <Button onClick={() => navigate("/dashboard/events/new")} variant="outline">
            Crear Evento
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => navigate(`/dashboard/events/${event.id}`)}
              className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md cursor-pointer transition-all flex flex-col h-full"
            >
              {/* Image banner */}
              <div className="h-44 w-full overflow-hidden bg-muted relative">
                <img
                  src={event.banner}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 z-10">
                  {getStatusBadge(event.status)}
                </div>
              </div>

              {/* Body info */}
              <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {getFormatBadge(event.format)}
                    <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Calendar className="size-3" />
                      {event.date || "Fecha por definir"}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {event.description || "Sin descripción proporcionada."}
                  </p>
                </div>
                
                <div className="border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate max-w-[200px] flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0 text-muted-foreground/60" />
                    {event.location || "Ubicación por definir"}
                  </span>
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
