import { useAuthStore } from "@/store/auth.store"
import { LayoutDashboard, Users, Calendar, Settings, DollarSign } from "lucide-react"

export function DashboardPage() {
  const { user, selectedService } = useAuthStore()

  // Simple statistics cards
  const stats = [
    {
      title: "Reservas Totales",
      value: "24",
      change: "+12% este mes",
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Clientes Activos",
      value: "148",
      change: "+8% esta semana",
      icon: Users,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Ingresos Estimados",
      value: "$1,240.00",
      change: "+22% vs mes anterior",
      icon: DollarSign,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          ¡Hola, {user?.full_name || user?.email || "Administrador"}!
        </h1>
        <p className="text-muted-foreground text-sm">
          {selectedService 
            ? `Gestionando el panel para el negocio: ${selectedService.name}.` 
            : "No tienes un negocio activo seleccionado. Ve a Ajustes para configurar uno."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.title} className="p-6 bg-card rounded-xl border border-border flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
              <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">{stat.change}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`size-5 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Left Card: Summary description */}
        <div className="col-span-1 md:col-span-2 p-6 bg-card rounded-xl border border-border space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <LayoutDashboard className="size-5 text-primary" />
            <h3 className="font-bold text-base">Información General del Negocio</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">Nombre:</span>
              <span className="col-span-2 font-medium">{selectedService?.name || "N/A"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">Slug/Identificador:</span>
              <span className="col-span-2 font-mono text-xs">{selectedService?.slug || "N/A"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">Descripción:</span>
              <span className="col-span-2 text-muted-foreground">{selectedService?.description || "Sin descripción proporcionada."}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Quick Actions */}
        <div className="p-6 bg-card rounded-xl border border-border space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Settings className="size-5 text-primary" />
            <h3 className="font-bold text-base">Accesos Rápidos</h3>
          </div>
          <ul className="space-y-2 text-sm font-medium">
            <li>
              <a href="/dashboard/services" className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors group">
                <span className="text-muted-foreground group-hover:text-foreground">Catálogo de servicios</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Ir</span>
              </a>
            </li>
            <li>
              <a href="/dashboard/agenda/calendar" className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors group">
                <span className="text-muted-foreground group-hover:text-foreground">Calendario de citas</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Ir</span>
              </a>
            </li>
            <li>
              <a href="/dashboard/settings/business" className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors group">
                <span className="text-muted-foreground group-hover:text-foreground">Configurar negocio</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Ir</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
