import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

const routeMap: Record<string, string> = {
  // Main sections
  dashboard: "Inicio",
  services: "Servicios",
  agenda: "Agenda",
  bookings: "Reservas",
  settings: "Ajustes",
  business: "Negocio",
  billing: "Facturación",
  categories: "Categorías",
  promotions: "Promociones",
  hours: "Horarios de Atención",
  locations: "Ubicaciones",
  team: "Equipo",
  invite: "Invitar",
  "admin-settings": "Administración",

  // Operations/Actions
  new: "Nuevo",
  edit: "Editar",
  clients: "Clientes",
  login: "Iniciar Sesión",
};

const routeRewrites: Record<string, string> = {
  "/dashboard/settings": "/dashboard/settings/business",
  "/dashboard/agenda": "/dashboard/agenda/hours",
};

const validRoutes = new Set([
  "/dashboard",
  "/dashboard/services",
  "/dashboard/services/categories",
  "/dashboard/agenda/hours",
  "/dashboard/agenda/locations",
  "/dashboard/settings/business",
  "/dashboard/settings/business/team",
]);

export function DynamicBreadcrumbs() {
  const { pathname } = useLocation();
  const pathSegments = pathname.split("/").filter((v) => v);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {pathSegments.map((segment, index) => {
          const originalHref = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          
          const rewrittenHref = routeRewrites[originalHref] || originalHref;
          const isClickable = !isLast && (validRoutes.has(originalHref) || routeRewrites[originalHref] !== undefined);

          const isUuidOrId = /^[0-9a-fA-F-]+$/.test(segment) || /^\d+$/.test(segment);
          const label = routeMap[segment] || (isUuidOrId ? "Detalle" : segment.length > 20 ? segment.substring(0, 8) + "..." : segment);

          return (
            <React.Fragment key={originalHref}>
              <BreadcrumbItem>
                {!isClickable ? (
                  <BreadcrumbPage className="text-xs font-semibold text-foreground capitalize">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={rewrittenHref} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors capitalize">
                      {label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="h-3 w-3 opacity-40" />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
