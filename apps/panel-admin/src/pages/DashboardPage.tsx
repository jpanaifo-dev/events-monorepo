import { useAuthStore } from "@/store/auth.store"
import { useEventStore } from "@/store/event.store"
import {
  Users,
  Calendar,
  Settings,
  Plus,
  BookOpen,
  UserPlus,
  Building,
  Tag,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useSEO } from "@/hooks/use-seo"

export function DashboardPage() {
  const { user, selectedOrganization } = useAuthStore()
  const { events, speakers, attendees } = useEventStore()
  const navigate = useNavigate()

  useSEO({
    title: "Panel Principal",
    description: selectedOrganization
      ? `Consola de administración y analíticas para la organización ${selectedOrganization.name}.`
      : "Consola de control principal de eventos."
  })

  // Dynamic greetings based on system hour
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return "Buenos días"
    if (hour >= 12 && hour < 19) return "Buenas tardes"
    return "Buenas noches"
  }

  const adminName = user?.first_name || user?.full_name?.split(" ")[0] || "Administrador"

  // Statistics calculation
  const totalEvents = events.length
  const publishedEvents = events.filter(e => e.status === "published").length
  const draftEvents = events.filter(e => e.status === "draft").length
  const archivedEvents = events.filter(e => e.status === "archived").length

  const totalSpeakers = speakers.length
  const totalAttendees = attendees.length

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Top Banner / Time Greeting */}
      <div className="rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 p-5 border border-indigo-100/40 dark:border-indigo-900/30">
        <div className="space-y-1.5">
          <div className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-100/60 dark:bg-indigo-900/40 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 tracking-wider uppercase">
            Resumen del Entorno
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            {getGreeting()}, {adminName} 👋
          </h1>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-3xl">
            Bienvenido al centro de operaciones de <strong className="font-medium text-foreground">{selectedOrganization?.name || "tu organización"}</strong>. Gestiona tus conferencias, ponentes e inscritos de forma unificada.
          </p>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Events Card */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Eventos Activos</span>
              <h3 className="text-3xl font-bold tracking-tight">{totalEvents}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Calendar className="size-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 flex justify-between items-center text-xs text-muted-foreground">
            <span>{publishedEvents} Publicados</span>
            <span>•</span>
            <span>{draftEvents} Borradores</span>
          </div>
        </div>

        {/* Speakers Card */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ponentes</span>
              <h3 className="text-3xl font-bold tracking-tight">{totalSpeakers}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BookOpen className="size-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
            Expositores y panelistas confirmados
          </div>
        </div>

        {/* Attendees Card */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Participantes</span>
              <h3 className="text-3xl font-bold tracking-tight">{totalAttendees}</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
            Total de inscritos en la plataforma
          </div>
        </div>
      </div>

      {/* Two Column Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left Column: Accesos Rápidos (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-xs p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Settings className="size-4.5 text-indigo-500" />
              <h3 className="font-bold text-base text-foreground">Accesos Rápidos</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Add Event */}
              <button
                onClick={() => navigate("/dashboard/events/new")}
                className="group flex items-start gap-3 w-full p-4 hover:bg-muted/40 border border-border/40 hover:border-indigo-500/25 rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Plus className="size-5" />
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-sm text-foreground block group-hover:text-primary transition-colors">Nuevo Evento</span>
                  <span className="text-xs text-muted-foreground block leading-relaxed">Registra una nueva conferencia o taller</span>
                </div>
              </button>

              {/* Add Profile */}
              <button
                onClick={() => navigate("/dashboard/profiles/new")}
                className="group flex items-start gap-3 w-full p-4 hover:bg-muted/40 border border-border/40 hover:border-cyan-500/25 rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5">
                  <UserPlus className="size-5" />
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-sm text-foreground block group-hover:text-primary transition-colors">Registrar Perfil</span>
                  <span className="text-xs text-muted-foreground block leading-relaxed">Añade participantes de forma directa</span>
                </div>
              </button>

              {/* Sede Settings */}
              <button
                onClick={() => navigate("/dashboard/settings/branches")}
                className="group flex items-start gap-3 w-full p-4 hover:bg-muted/40 border border-border/40 hover:border-border rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
                  <Building className="size-5" />
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-sm text-foreground block group-hover:text-primary transition-colors">Sedes y Direcciones</span>
                  <span className="text-xs text-muted-foreground block leading-relaxed">Edita las ubicaciones de tus conferencias</span>
                </div>
              </button>

              {/* Members Settings */}
              <button
                onClick={() => navigate("/dashboard/settings/members")}
                className="group flex items-start gap-3 w-full p-4 hover:bg-muted/40 border border-border/40 hover:border-border rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="p-2.5 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
                  <Users className="size-5" />
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-sm text-foreground block group-hover:text-primary transition-colors">Colaboradores</span>
                  <span className="text-xs text-muted-foreground block leading-relaxed">Administra el equipo organizador</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Aside): Event Status distribution breakdown */}
        <aside className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Tag className="size-4.5 text-indigo-500" />
              <h3 className="font-bold text-base text-foreground">Distribución de Eventos</h3>
            </div>

            {totalEvents === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">Sin datos de distribución.</p>
            ) : (
              <div className="space-y-4">
                {/* Published bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Publicados</span>
                    <span className="text-foreground">{publishedEvents} ({totalEvents > 0 ? Math.round((publishedEvents / totalEvents) * 100) : 0}%)</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${totalEvents > 0 ? (publishedEvents / totalEvents) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Drafts bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Borradores</span>
                    <span className="text-foreground">{draftEvents} ({totalEvents > 0 ? Math.round((draftEvents / totalEvents) * 100) : 0}%)</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${totalEvents > 0 ? (draftEvents / totalEvents) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Archived bar */}
                {archivedEvents > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Archivados</span>
                      <span className="text-foreground">{archivedEvents} ({totalEvents > 0 ? Math.round((archivedEvents / totalEvents) * 100) : 0}%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-300"
                        style={{ width: `${totalEvents > 0 ? (archivedEvents / totalEvents) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  )
}
