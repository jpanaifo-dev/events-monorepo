import { useEffect, useCallback, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { useEventStore, type EventFilters } from "@/store/event.store"
import { DynamicFilters, type FilterConfig, type FilterValues } from "@/components/ui/dynamic-filters"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Globe, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "search",
    label: "Buscar",
    type: "text",
    placeholder: "Buscar eventos...",
    isBasic: true,
  },
  {
    key: "status",
    label: "Estado",
    type: "select",
    placeholder: "Todos",
    options: [
      { value: "published", label: "Publicados" },
      { value: "draft", label: "Borradores" },
      { value: "archived", label: "Archivados" },
    ],
    isBasic: true,
  },
  {
    key: "hasEditions",
    label: "Con Ediciones",
    type: "select",
    placeholder: "Todos",
    options: [
      { value: "true", label: "Sí" },
      { value: "false", label: "No" },
    ],
    isBasic: false,
  },
]

const defaultBanner = "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60"

function EventCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="border-t border-border pt-4 flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function EventsPage() {
  const { selectedOrganization } = useAuthStore()
  const { events, isLoading, loadData } = useEventStore()
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()

  const filterValues = useMemo<FilterValues>(() => {
    const values: FilterValues = {}
    FILTER_CONFIGS.forEach((filter) => {
      const val = searchParams.get(filter.key)
      if (val !== null) {
        values[filter.key] = val
      }
    })
    return values
  }, [searchParams])

  const fetchEvents = useCallback(() => {
    if (!selectedOrganization?.id) return
    const filters: EventFilters = {}
    if (filterValues.search) filters.search = filterValues.search as string
    if (filterValues.status) filters.status = filterValues.status as string
    if (filterValues.hasEditions) filters.hasEditions = filterValues.hasEditions as string
    loadData(selectedOrganization.id, filters)
  }, [selectedOrganization?.id, filterValues, loadData])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleFiltersChange = (values: FilterValues) => {
    const newParams = new URLSearchParams(searchParams.toString())
    FILTER_CONFIGS.forEach((filter) => {
      const val = values[filter.key]
      if (val !== undefined && val !== null && val !== "" && val !== "ALL") {
        newParams.set(filter.key, String(val))
      } else {
        newParams.delete(filter.key)
      }
    })
    setSearchParams(newParams)
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

      {/* Filters */}
      <DynamicFilters
        filters={FILTER_CONFIGS}
        values={filterValues}
        onChange={handleFiltersChange}
        modalTitle="Filtros de Eventos"
      />

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-border rounded-xl bg-card space-y-4">
          <Calendar className="size-12 mx-auto text-muted-foreground" />
          <h3 className="font-bold text-lg">No hay eventos en este momento</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {filterValues.search || filterValues.status
              ? "No se encontraron eventos con los filtros aplicados."
              : "Comienza registrando un nuevo evento para publicar agendas, ponentes e inscripciones."}
          </p>
          {!filterValues.search && !filterValues.status && (
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
                  <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
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
