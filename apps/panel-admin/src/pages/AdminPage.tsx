import { useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Building2, CreditCard, Plus, ShieldCheck, Users } from "lucide-react"
import { api } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const titles: Record<string, { title: string; description: string }> = {
  "/admin": { title: "Resumen global", description: "Supervisa instituciones, cuentas y operación de la plataforma." },
  "/admin/organizations": { title: "Instituciones", description: "Gestiona todas las instituciones registradas en la plataforma." },
  "/admin/users": { title: "Usuarios y permisos", description: "Administra cuentas globales y sus niveles de acceso." },
  "/admin/plans": { title: "Planes y cuentas", description: "Configura planes gratis, profesionales y el estado de cada cuenta." },
  "/admin/payments": { title: "Pagos", description: "Consulta la operación de pagos y suscripciones." },
  "/admin/settings": { title: "Configuración", description: "Preferencias generales, seguridad y parámetros de la plataforma." },
}

export function AdminPage() {
  const location = useLocation()
  const [organizations, setOrganizations] = useState<any[]>([])
  const meta = titles[location.pathname] || titles["/admin"]
  useEffect(() => { api.organizations.list().then(setOrganizations).catch(() => setOrganizations([])) }, [])
  const stats = useMemo(() => ({ institutions: organizations.length, events: organizations.reduce((sum, item) => sum + (item._count?.events || 0), 0), members: organizations.reduce((sum, item) => sum + (item._count?.members || 0), 0) }), [organizations])

  return <div className="max-w-7xl mx-auto space-y-8">
    <header><p className="text-sm text-primary font-medium">Panel global</p><h2 className="text-3xl font-bold tracking-tight">{meta.title}</h2><p className="text-muted-foreground mt-2">{meta.description}</p></header>
    {location.pathname === "/admin" && <div className="grid gap-4 md:grid-cols-3"><Metric icon={Building2} label="Instituciones" value={stats.institutions} /><Metric icon={Users} label="Eventos activos" value={stats.events} /><Metric icon={CreditCard} label="Cuentas profesionales" value="Próximamente" /></div>}
    {location.pathname === "/admin/organizations" ? <section className="space-y-4"><div className="flex justify-end"><Link to="/dashboard/organizations/new"><Button><Plus className="size-4 mr-2" />Crear institución</Button></Link></div><Card className="divide-y divide-border">{organizations.length === 0 ? <p className="p-6 text-muted-foreground">No hay instituciones registradas.</p> : organizations.map((org) => <div key={org.id} className="p-5 flex items-center justify-between"><div><p className="font-semibold">{org.name}</p><p className="text-sm text-muted-foreground">{org.slug} · {org._count?.members || 0} miembros · {org._count?.events || 0} eventos</p></div><Link className="text-sm text-primary hover:underline" to={`/dashboard/organizations`}>Administrar</Link></div>)}</Card></section> : location.pathname !== "/admin" && <Card className="p-8"><div className="flex items-start gap-4"><ShieldCheck className="size-6 text-primary" /><div><h3 className="font-semibold">Módulo preparado</h3><p className="text-sm text-muted-foreground mt-1">La sección está creada dentro del área global. Conectaremos sus operaciones específicas al backend administrativo en el siguiente bloque.</p></div></div></Card>}
  </div>
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) { return <Card className="p-5"><Icon className="size-5 text-primary mb-4" /><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></Card> }
