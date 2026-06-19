import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthGuard } from "./AuthGuard"
import { LoginPage } from "@/pages/LoginPage"
import { OrganizationsPage } from "@/pages/OrganizationsPage"
import { OrganizationSettingsPage } from "@/pages/OrganizationSettingsPage"
import { CreateOrganizationPage } from "@/pages/CreateOrganizationPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { EventsPage } from "@/pages/EventsPage"
import { EventDetailPage } from "@/pages/EventDetailPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { PrivateLayout } from "@/layouts/PrivateLayout"

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard Routes requiring Authentication but NO Selected Organization yet */}
        <Route
          path="/dashboard/organizations"
          element={
            <AuthGuard requireSelectedOrganization={false}>
              <OrganizationsPage />
            </AuthGuard>
          }
        />

        <Route
          path="/dashboard/organizations/new"
          element={
            <AuthGuard requireSelectedOrganization={false}>
              <CreateOrganizationPage />
            </AuthGuard>
          }
        />

        <Route
          path="/dashboard/profile"
          element={
            <AuthGuard requireSelectedOrganization={false}>
              <ProfilePage />
            </AuthGuard>
          }
        />

        {/* Protected Dashboard Routes (Requires Selected Organization) */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard requireSelectedOrganization={true}>
              <PrivateLayout />
            </AuthGuard>
          }
        >
          {/* Main organization dashboard metrics */}
          <Route index element={<DashboardPage />} />

          {/* Events Catalog */}
          <Route path="events" element={<EventsPage />} />

          {/* Event manager workspace */}
          <Route path="events/:id" element={<EventDetailPage />} />

          {/* Settings Page */}
          <Route path="settings/business" element={<OrganizationSettingsPage />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
