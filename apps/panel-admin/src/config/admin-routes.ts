import { LayoutDashboard, Layers, Map, ClipboardList, Settings2 } from "lucide-react"

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
      title: "Servicios",
      url: "#",
      icon: Layers,
      items: [
        {
          title: "Catálogo de Servicios",
          url: `/dashboard/services`,
        },
        {
          title: "Categorías",
          url: `/dashboard/services/categories`,
        },
        {
          title: "Descuentos y Ofertas",
          url: `/dashboard/services/promotions`,
        },
      ],
    },
    {
      title: "Agenda y Horarios",
      url: "#",
      icon: Map,
      items: [
        {
          title: "Calendario",
          url: `/dashboard/agenda/calendar`,
        },
        {
          title: "Horarios de Atención",
          url: `/dashboard/agenda/hours`,
        },
        {
          title: "Ubicaciones de Atención",
          url: `/dashboard/agenda/locations`,
        },
      ],
    },
    {
      title: "Reservas",
      url: "#",
      icon: ClipboardList,
      items: [
        {
          title: "Nueva Reserva",
          url: `/dashboard/bookings/new`,
        },
        {
          title: "Historial de Reservas",
          url: `/dashboard/bookings`,
        },
        {
          title: "Lista de Clientes",
          url: `/dashboard/bookings/clients`,
        },
      ],
    },
    {
      title: "Ajustes",
      url: `/dashboard/settings/business`,
      icon: Settings2,
    },
  ]
}
