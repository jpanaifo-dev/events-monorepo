export type UserRole = "SAAS_ADMIN" | "SERVICE_OWNER"

export interface User {
  id: string
  email: string
  full_name: string | null
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  phone: string | null
  bio: string | null
  specialty: string | null
  role: UserRole
}

export interface TenantService {
  id: string
  name: string
  slug: string
  description?: string
  isActive?: boolean
  isIndependent?: boolean | null
}

export interface AuthState {
  user: User | null
  services: TenantService[]
  selectedService: TenantService | null
  isAuthenticated: boolean
  isProfileComplete: boolean
  isLoading: boolean
  login: (user: User, services: TenantService[]) => void
  logout: () => void
  selectService: (service: TenantService | null) => void
  setProfileComplete: (isComplete: boolean) => void
  setUser: (user: User | null) => void
  setLoading: (isLoading: boolean) => void
  setServices: (services: TenantService[]) => void
}
