import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthGuard } from "./AuthGuard"
import { LoginPage } from "@/pages/LoginPage"
import { OrganizationsPage } from "@/pages/OrganizationsPage"
import { OrganizationSettingsPage } from "@/pages/OrganizationSettingsPage"
import { CreateOrganizationPage } from "@/pages/CreateOrganizationPage"
import {
  ProfileLayout,
  ProfileInfoSection,
  ProfileExperienceSection,
  ProfileEducationSection,
  ProfileCertificationsSection,
} from "@/pages/profile"
import { EventsPage } from "@/pages/EventsPage"
import { EventDetailPage } from "@/pages/EventDetailPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { PrivateLayout } from "@/layouts/PrivateLayout"
import { BranchesPage } from "@/pages/BranchesPage"
import { BranchFormPage } from "@/pages/BranchFormPage"
import { MembersPage } from "@/pages/MembersPage"
import { CreateEventPage } from "@/pages/CreateEventPage"
import { EditEventPage } from "@/pages/EditEventPage"
import { CreateEditionPage } from "@/pages/CreateEditionPage"
import { EditEditionPage } from "@/pages/EditEditionPage"
import { CreateSpeakerPage } from "@/pages/CreateSpeakerPage"
import { EditSpeakerPage } from "@/pages/EditSpeakerPage"
import {
  EventInfoSection,
  EventEditionsSection,
  EventSpeakersSection,
  EventAgendaSection,
  EventAttendeesSection,
  EventRolesSection,
  EventThematicLinesSection,
  EventActivityFormPage,
  EventTicketsSection,
} from "@/pages/event-detail"
import {
  ProfilesPage,
  ProfileManageLayout,
  ProfileManageInfoSection,
  ProfileManageExperienceSection,
  ProfileManageEducationSection,
  ProfileManageCertificationsSection,
  ProfileManageDangerSection,
} from "@/pages/profiles"

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
              <ProfileLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="info" replace />} />
          <Route path="info" element={<ProfileInfoSection />} />
          <Route path="experience" element={<ProfileExperienceSection />} />
          <Route path="education" element={<ProfileEducationSection />} />
          <Route path="certifications" element={<ProfileCertificationsSection />} />
        </Route>

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

          {/* Registered Profiles Catalog */}
          <Route path="profiles" element={<ProfilesPage />} />

          {/* Settings Page */}
          <Route path="settings/business" element={<OrganizationSettingsPage />} />

          {/* Branches Pages */}
          <Route path="settings/branches" element={<BranchesPage />} />
          <Route path="settings/branches/new" element={<BranchFormPage />} />
          <Route path="settings/branches/:branchId/edit" element={<BranchFormPage />} />

          {/* Members Pages */}
          <Route path="settings/members" element={<MembersPage />} />
        </Route>

        {/* Standalone Pages (WITHOUT Sidebar/Navbar Layout) */}
        <Route
          path="/dashboard/events/new"
          element={
            <AuthGuard requireSelectedOrganization={true}>
              <CreateEventPage />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard/events/:id/edit"
          element={
            <AuthGuard requireSelectedOrganization={true}>
              <EditEventPage />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard/events/:eventId/editions/new"
          element={
            <AuthGuard requireSelectedOrganization={true}>
              <CreateEditionPage />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard/events/:eventId/editions/:editionId/edit"
          element={
            <AuthGuard requireSelectedOrganization={true}>
              <EditEditionPage />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard/events/:eventId/speakers/new"
          element={
            <AuthGuard requireSelectedOrganization={true}>
              <CreateSpeakerPage />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard/events/:eventId/speakers/:speakerId/edit"
          element={
            <AuthGuard requireSelectedOrganization={true}>
              <EditSpeakerPage />
            </AuthGuard>
          }
        />

        {/* Event Detail - Standalone (no admin layout) */}
        <Route
          path="/dashboard/events/:id"
          element={
            <AuthGuard requireSelectedOrganization={true}>
              <EventDetailPage />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="info" replace />} />
          <Route path="info" element={<EventInfoSection />} />
          <Route path="editions" element={<EventEditionsSection />} />
          <Route path="speakers" element={<EventSpeakersSection />} />
          <Route path="agenda" element={<EventAgendaSection />} />
          <Route path="agenda/new" element={<EventActivityFormPage />} />
          <Route path="agenda/:activityId/edit" element={<EventActivityFormPage />} />
          <Route path="attendees" element={<EventAttendeesSection />} />
          <Route path="roles" element={<EventRolesSection />} />
          <Route path="thematic-lines" element={<EventThematicLinesSection />} />
          <Route path="tickets" element={<EventTicketsSection />} />
        </Route>

        {/* Profiles Detail - Standalone (no admin layout) */}
        <Route
          path="/dashboard/profiles/:profileId"
          element={
            <AuthGuard requireSelectedOrganization={true}>
              <ProfileManageLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="info" replace />} />
          <Route path="info" element={<ProfileManageInfoSection />} />
          <Route path="experience" element={<ProfileManageExperienceSection />} />
          <Route path="education" element={<ProfileManageEducationSection />} />
          <Route path="certifications" element={<ProfileManageCertificationsSection />} />
          <Route path="danger" element={<ProfileManageDangerSection />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
