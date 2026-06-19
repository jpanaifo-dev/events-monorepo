import { useAuthStore } from "@/store/auth.store"
import { useEventStore } from "@/store/event.store"
import { Users, Calendar, Settings, Plus, BookOpen, Clock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/page-header"

export function DashboardPage() {
  const { selectedOrganization } = useAuthStore()
  const { events, speakers, attendees } = useEventStore()
  const navigate = useNavigate()

  // Calculate statistics for the active organization
  const totalEvents = events.length
  const totalSpeakers = speakers.length
  const totalAttendees = attendees.length
  
  // Calculate upcoming events
  const upcomingEvents = events.filter(e => e.status === "published" || e.status === "draft").slice(0, 3)

  const stats = [
    {
      title: "Eventos Registrados",
      value: String(totalEvents),
      desc: "Borradores y publicados",
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Ponentes e Invitados",
      value: String(totalSpeakers),
      desc: "Expositores confirmados",
      icon: BookOpen,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Participantes Inscritos",
      value: String(totalAttendees),
      desc: "Registrados totales",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="¡Hola de nuevo, admin!"
        description={selectedOrganization 
          ? `Administrando el panel para: ${selectedOrganization.name}.` 
          : "No tienes una organización activa seleccionada."}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.title} className="p-6 bg-card rounded-xl border border-border flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
              <p className="text-[10px] font-medium text-muted-foreground">{stat.desc}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`size-5 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Left Card: Upcoming Events list */}
        <div className="col-span-1 md:col-span-2 p-6 bg-card rounded-xl border border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              <h3 className="font-bold text-base">Próximos Eventos</h3>
            </div>
            <span onClick={() => navigate("/dashboard/events")} className="text-xs text-primary hover:underline cursor-pointer">Ver todos</span>
          </div>
          
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No hay eventos registrados en esta organización.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {upcomingEvents.map((evt) => (
                <div 
                  key={evt.id} 
                  onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                  className="py-3 flex items-center justify-between group cursor-pointer hover:bg-muted/10 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{evt.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{evt.date}</span>
                      <span>•</span>
                      <span className="capitalize">{evt.location}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    evt.status === "published" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600"
                  }`}>
                    {evt.status === "published" ? "Publicado" : "Borrador"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Card: Quick Actions */}
        <div className="p-6 bg-card rounded-xl border border-border space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Settings className="size-5 text-primary" />
            <h3 className="font-bold text-base">Accesos Rápidos</h3>
          </div>
          <ul className="space-y-2 text-sm font-medium">
            <li>
              <button 
                onClick={() => navigate("/dashboard/events")} 
                className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg transition-colors group text-left"
              >
                <span className="text-muted-foreground group-hover:text-foreground">Ver todos los eventos</span>
                <Plus className="size-4 text-muted-foreground group-hover:text-primary" />
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate("/dashboard/organizations")} 
                className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg transition-colors group text-left"
              >
                <span className="text-muted-foreground group-hover:text-foreground">Cambiar de organización</span>
                <Clock className="size-4 text-muted-foreground group-hover:text-primary" />
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate("/dashboard/settings/business")} 
                className="flex items-center justify-between w-full p-2 hover:bg-muted/50 rounded-lg transition-colors group text-left"
              >
                <span className="text-muted-foreground group-hover:text-foreground">Ajustes de organización</span>
                <Settings className="size-4 text-muted-foreground group-hover:text-primary" />
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
