import { useEffect } from "react"
import { useNavigate, useParams, NavLink, Outlet } from "react-router-dom"
import { useAdminProfilesStore } from "@/store/admin-profiles.store"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { ZynqroLogo } from "@/components/zynqro-logo"
import { PageHeader } from "@/components/page-header"

export function ProfileManageLayout() {
  const { profileId } = useParams<{ profileId: string }>()
  const navigate = useNavigate()
  const { profiles, loadAllProfiles, loadProfileDetails } = useAdminProfilesStore()

  useEffect(() => {
    if (profiles.length === 0) {
      loadAllProfiles()
    }
  }, [profiles.length, loadAllProfiles])

  useEffect(() => {
    if (profileId) {
      loadProfileDetails(profileId)
    }
  }, [profileId, loadProfileDetails])

  const targetProfile = profiles.find((p) => p.id === profileId)

  const navItems = [
    { to: "info", label: "Datos Generales" },
    { to: "account", label: "Cuenta" },
    { to: "experience", label: "Experiencia Profesional" },
    { to: "education", label: "Estudios" },
    { to: "certifications", label: "Certificaciones" },
    { to: "danger", label: "Zona de Peligro" },
  ]

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors shrink-0 ${isActive
      ? "border-primary text-primary font-bold"
      : "border-transparent text-muted-foreground hover:text-foreground"
    }`

  const fullName = targetProfile ? `${targetProfile.firstName} ${targetProfile.lastName}`.trim() : "Usuario"

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Top Header Navbar */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 flex-shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 ml-2">
            <ZynqroLogo className="h-8 w-auto" />
            <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider mt-0.5">
              Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <ThemeSwitch />
        </div>
      </header>

      {/* Main Settings Form Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <PageHeader
            title={fullName}
            description={targetProfile?.email || "Sin dirección de correo"}
            showBackButton
            onBackClick={() => navigate("/dashboard/profiles")}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-border overflow-x-auto select-none no-scrollbar mb-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={getLinkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Routable Outlet */}
        <div className="mt-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
