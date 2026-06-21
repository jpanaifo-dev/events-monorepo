export type UserRole = "SAAS_ADMIN" | "SERVICE_OWNER"

export type OrganizationMemberRole = "Owner" | "Administrator" | "Developer"

export const OrganizationMemberRole = {
  OWNER: "Owner" as const,
  ADMINISTRATOR: "Administrator" as const,
  DEVELOPER: "Developer" as const
} as const



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
  identity_document_type?: string | null
  identity_document_number?: string | null
  role: UserRole
}

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  isActive?: boolean
  isIndependent?: boolean | null
  plan?: string
  type?: string
  logoUrl?: string
  coverUrl?: string
  faviconUrl?: string
  projectsCount?: number
}

export interface AuthState {
  user: User | null
  organizations: Organization[]
  selectedOrganization: Organization | null
  isAuthenticated: boolean
  isProfileComplete: boolean
  isLoading: boolean
  login: (user: User, organizations: Organization[]) => void
  logout: () => void
  selectOrganization: (organization: Organization | null) => void
  setProfileComplete: (isComplete: boolean) => void
  setUser: (user: User | null) => void
  setLoading: (isLoading: boolean) => void
  setOrganizations: (organizations: Organization[]) => void
}
