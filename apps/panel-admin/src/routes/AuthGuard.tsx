import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../store/auth.store"
import type { UserRole } from "../types/auth.types"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireSelectedService?: boolean
  requireCompleteProfile?: boolean
  allowIncompleteProfileOnly?: boolean
}

export function AuthGuard({
  children,
  allowedRoles,
  requireSelectedService = false,
  requireCompleteProfile = false, // Made false by default since onboarding page might not exist or be needed yet
  allowIncompleteProfileOnly = false,
}: AuthGuardProps) {
  const { isAuthenticated, isProfileComplete, user, selectedService, isLoading } = useAuthStore()
  const location = useLocation()

  // Show a clean SVG loading spinner while checking auth session/profile
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

  // 2. If logged in but profile is incomplete
  if (!isProfileComplete) {
    if (requireCompleteProfile && !allowIncompleteProfileOnly) {
      // If we require onboarding but haven't implemented it in panel-admin yet, we can skip it,
      // or redirect if onboarding is implemented. Since requireCompleteProfile is false by default,
      // this won't trigger unless explicitly requested.
      return <Navigate to="/dashboard" replace />
    }
  } else {
    if (allowIncompleteProfileOnly) {
      return <Navigate to="/dashboard" replace />
    }
  }

  // 3. Check role restrictions
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  // 4. Check active service selection if required
  if (requireSelectedService && !selectedService) {
    // If a service selection is required but none is active, we can either redirect to business list
    // or keep it simple. Let's just render the children or redirect to dashboard.
    // For now, let's keep it simple.
  }

  return <>{children}</>
}
