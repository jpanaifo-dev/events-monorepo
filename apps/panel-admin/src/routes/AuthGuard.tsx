import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../store/auth.store"
import type { UserRole } from "../types/auth.types"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireSelectedOrganization?: boolean
}

export function AuthGuard({
  children,
  allowedRoles,
  requireSelectedOrganization = true,
}: AuthGuardProps) {
  const { isAuthenticated, user, selectedOrganization, isLoading } = useAuthStore()
  const location = useLocation()

  // Show a clean SVG loading spinner while checking auth session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin h-8 w-8 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm font-medium tracking-tight text-muted-foreground animate-pulse">
            Verificando credenciales...
          </p>
        </div>
      </div>
    )
  }

  // 1. If not logged in, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 2. Redirect to organization selection if none chosen (and they are not already navigating to it)
  if (
    requireSelectedOrganization &&
    !selectedOrganization &&
    location.pathname !== "/dashboard/organizations"
  ) {
    return <Navigate to="/dashboard/organizations" replace />
  }

  // 3. Check role restrictions if applicable
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
