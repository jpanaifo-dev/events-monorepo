import { LayoutDashboard, Calendar, Settings2 } from "lucide-react"

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
      title: "Ajustes",
      url: `/dashboard/settings/business`,
      icon: Settings2,
    },
  ]
}
