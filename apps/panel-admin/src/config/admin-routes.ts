import { LayoutDashboard, Calendar, Settings2, User, Users } from "lucide-react"

export interface AdminRouteItem {
  title: string
  url: string
  icon?: any
  items?: {
    title: string
    url: string
  }[]
}

export const getAdminRoutes = (_locale?: string): AdminRouteItem[] => {
  return [
    {
      title: "Inicio",
      url: `/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: "Eventos",
      url: `/dashboard/events`,
      icon: Calendar,
    },
    {
      title: "Perfiles Registrados",
      url: `/dashboard/profiles`,
      icon: Users,
    },
    {
      title: "Mi Perfil",
      url: `/dashboard/profile`,
      icon: User,
    },
    {
      title: "Ajustes",
      url: `/dashboard/settings/business`,
      icon: Settings2,
    },
  ]
}
