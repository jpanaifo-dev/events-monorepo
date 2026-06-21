import { useAuthStore } from "@/store/auth.store"
import { useEventStore } from "@/store/event.store"
import {
  Users,
  Calendar,
  Settings,
  Plus,
  BookOpen,
  Clock,
  CheckCircle,
  ArrowRight,
  UserPlus,
  Building,
  Tag,
  Mail,
  ChevronRight,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useSEO } from "@/hooks/use-seo"

// Helper to display elapsed time in Spanish
function formatTimeAgo(dateString: string): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "Hace unos momentos"

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Hace ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days} d`

  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" })
}

// Color badges for ticket types
function getTicketBadgeClass(ticketType: string): string {
  const type = (ticketType || "").toLowerCase()
  if (type.includes("vip")) {
    return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
  }
  if (type.includes("gratis") || type.includes("free")) {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
  }
  if (type.includes("ponente") || type.includes("speaker")) {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
  }
  return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
}

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
  const checkedInCount = attendees.filter(a => a.checkedIn).length
  const checkInPercentage = totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0

  // Filter published or draft events sorted chronologically (newest first)
  const upcomingEvents = [...events]
    .filter(e => e.status === "published" || e.status === "draft")
    .slice(0, 3)

  // Real-time activity feed: last 5 registrations
  const recentAttendees = [...attendees]
    .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
    .slice(0, 5)

  // Initial avatar generator
  const getInitials = (name: string) => {
    if (!name) return "US"
    return name
      .split(" ")
      .map(part => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Consistent background hues for initials avatars
  const getAvatarBg = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const h = Math.abs(hash % 360)
    return `hsl(${h}, 60%, 45%)`
  }

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Accreditation Progress Card */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Acreditación</span>
              <h3 className="text-3xl font-bold tracking-tight">{checkInPercentage}%</h3>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="size-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${checkInPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>{checkedInCount} Asistieron</span>
              <span>{totalAttendees} Totales</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left Column: Upcoming Events & Live Feed */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upcoming Events Container */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="size-4.5 text-indigo-500" />
                <h2 className="font-bold text-base text-foreground">Gestión de Próximos Eventos</h2>
              </div>
              <button
                onClick={() => navigate("/dashboard/events")}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ver catálogo completo
                <ArrowRight className="size-3" />
              </button>
            </div>

            <div className="p-6">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <Calendar className="size-12 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No tienes eventos creados en esta organización.</p>
                  <button
                    onClick={() => navigate("/dashboard/events/new")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/95 transition-colors cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    Registrar Primer Evento
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {upcomingEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between group cursor-pointer hover:bg-muted/10 px-3 -mx-3 rounded-lg transition-colors"
                    >
                      <div className="space-y-1.5 overflow-hidden flex-1 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {evt.name}
                          </h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${evt.status === "published"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/25"
                            }`}>
                            {evt.status === "published" ? "Publicado" : "Borrador"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" />
                            {evt.createdAt ? new Date(evt.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" }) : "Sin fecha"}
                          </span>
                          {evt.contactEmail && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="size-3.5" />
                              {evt.contactEmail}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-4.5 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Inscriptions Activity Feed */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <h2 className="font-bold text-base text-foreground ml-1">Inscripciones Recientes</h2>
              </div>
              <button
                onClick={() => navigate("/dashboard/profiles")}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Directorio completo
                <ArrowRight className="size-3" />
              </button>
            </div>

            <div className="p-6">
              {recentAttendees.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <Users className="size-12 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Aún no se registran participantes en tus eventos.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {recentAttendees.map((at) => (
                    <div
                      key={at.id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Styled Initials Avatar */}
                        <div
                          className="size-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-xs border border-white/10"
                          style={{ backgroundColor: getAvatarBg(at.fullName) }}
                        >
                          {getInitials(at.fullName)}
                        </div>

                        <div className="space-y-0.5 overflow-hidden">
                          <h5 className="font-semibold text-sm text-foreground truncate">{at.fullName}</h5>
                          <span className="text-xs text-muted-foreground block truncate">{at.email}</span>
                        </div>
                      </div>

                      {/* Ticket category, time ago & checkin badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full uppercase tracking-wider ${getTicketBadgeClass(at.ticketType)}`}>
                          {at.ticketType || "General"}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${at.checkedIn
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                          }`}>
                          {at.checkedIn ? "Acreditado" : "Pendiente"}
                        </span>

                        <span className="text-[10px] font-medium text-muted-foreground hidden sm:inline-block">
                          {formatTimeAgo(at.registrationDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Actions & WorkSpace breakdown */}
        <div className="space-y-6">

          {/* Quick Actions Hub */}
          <div className="bg-card border border-border rounded-xl shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Settings className="size-4.5 text-indigo-500" />
              <h3 className="font-bold text-base text-foreground">Accesos Rápidos</h3>
            </div>

            <div className="grid gap-2">
              {/* Add Event */}
              <button
                onClick={() => navigate("/dashboard/events/new")}
                className="group flex items-start gap-3 w-full p-3 hover:bg-muted/40 border border-border/40 hover:border-indigo-500/25 rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <Plus className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold text-sm text-foreground block group-hover:text-primary transition-colors">Nuevo Evento</span>
                  <span className="text-xs text-muted-foreground block">Registra una nueva conferencia o taller</span>
                </div>
              </button>

              {/* Add Profile */}
              <button
                onClick={() => navigate("/dashboard/profiles/new")}
                className="group flex items-start gap-3 w-full p-3 hover:bg-muted/40 border border-border/40 hover:border-cyan-500/25 rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5">
                  <UserPlus className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold text-sm text-foreground block group-hover:text-primary transition-colors">Registrar Perfil</span>
                  <span className="text-xs text-muted-foreground block">Añade participantes de forma directa</span>
                </div>
              </button>

              {/* Sede Settings */}
              <button
                onClick={() => navigate("/dashboard/settings/branches")}
                className="group flex items-start gap-3 w-full p-3 hover:bg-muted/40 border border-border/40 hover:border-border rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
                  <Building className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold text-sm text-foreground block group-hover:text-primary transition-colors">Sedes y Direcciones</span>
                  <span className="text-xs text-muted-foreground block">Edita las ubicaciones de tus conferencias</span>
                </div>
              </button>

              {/* Members Settings */}
              <button
                onClick={() => navigate("/dashboard/settings/members")}
                className="group flex items-start gap-3 w-full p-3 hover:bg-muted/40 border border-border/40 hover:border-border rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0 mt-0.5">
                  <Users className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold text-sm text-foreground block group-hover:text-primary transition-colors">Colaboradores</span>
                  <span className="text-xs text-muted-foreground block">Administra el equipo organizador</span>
                </div>
              </button>
            </div>
          </div>

          {/* Event Status distribution breakdown */}
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

        </div>

      </div>
    </div>
  )
}
