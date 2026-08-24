import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { Building2, CreditCard, LayoutDashboard, LogOut, Settings2, ShieldCheck, Users } from "lucide-react"
import { useAuthStore } from "@/store/auth.store"

const items = [
  { label: "Resumen", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Instituciones", path: "/admin/organizations", icon: Building2 },
  { label: "Usuarios y permisos", path: "/admin/users", icon: Users },
  { label: "Planes y cuentas", path: "/admin/plans", icon: ShieldCheck },
  { label: "Pagos", path: "/admin/payments", icon: CreditCard },
  { label: "Configuración", path: "/admin/settings", icon: Settings2 },
]

export function AdminLayout() {
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  return (
    <div className="min-h-screen bg-muted/5 text-foreground flex">
      <aside className="w-72 bg-card border-r border-border p-5 flex flex-col">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Administración global</p>
          <h1 className="text-xl font-bold mt-1">Events Control</h1>
        </div>
        <nav className="space-y-1 flex-1">
          {items.map(({ label, path, icon: Icon, end }) => (
            <NavLink key={path} to={path} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Icon className="size-4" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border pt-4 space-y-3">
          <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          <button onClick={() => { logout(); navigate("/login", { replace: true }) }} className="flex items-center gap-2 text-sm text-destructive hover:underline">
            <LogOut className="size-4" />Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8"><Outlet /></main>
    </div>
  )
}
