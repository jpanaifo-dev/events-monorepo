import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthGuard } from "./AuthGuard"
import { LoginPage } from "../pages/LoginPage"
import { DashboardPage } from "../pages/DashboardPage"
import { PrivateLayout } from "../layouts/PrivateLayout"

// Basic placeholders for secondary sub-pages to match sidebar paths
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-6 bg-card rounded-lg border border-border">
    <h2 className="text-xl font-bold mb-2">{title}</h2>
    <p className="text-muted-foreground">Esta sección está en desarrollo para el Panel de Administración.</p>
  </div>
)

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <PrivateLayout />
            </AuthGuard>
          }
        >
          {/* Main admin dashboard view */}
          <Route index element={<DashboardPage />} />

          {/* Catalog & Categories */}
          <Route path="services" element={<PlaceholderPage title="Catálogo de Servicios" />} />
          <Route path="services/categories" element={<PlaceholderPage title="Categorías de Servicios" />} />
          <Route path="services/promotions" element={<PlaceholderPage title="Descuentos y Ofertas" />} />

          {/* Agenda & Bookings */}
          <Route path="agenda/calendar" element={<PlaceholderPage title="Calendario" />} />
          <Route path="agenda/hours" element={<PlaceholderPage title="Horarios de Atención" />} />
          <Route path="agenda/locations" element={<PlaceholderPage title="Ubicaciones de Atención" />} />
          <Route path="bookings/new" element={<PlaceholderPage title="Nueva Reserva" />} />
          <Route path="bookings" element={<PlaceholderPage title="Historial de Reservas" />} />
          <Route path="bookings/clients" element={<PlaceholderPage title="Lista de Clientes" />} />

          {/* Settings */}
          <Route path="settings/business" element={<PlaceholderPage title="Ajustes de Negocio" />} />
          <Route path="settings/business/team" element={<PlaceholderPage title="Miembros del Equipo" />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
