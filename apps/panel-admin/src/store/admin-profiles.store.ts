import { create } from "zustand"
import { api } from "@/api/client"
import type { Education, EmploymentHistory, Certification } from "./profile.store"

export interface Profile {
  id: string
  authId: string | null
  firstName: string
  lastName: string
  email: string | null
  identityDocumentType: string | null
  identityDocumentNumber: string | null
  phone: string | null
  birthDate: string | null
  sex: string | null
  avatarUrl: string | null
  bio: string | null
  location: string | null
  institution: string | null
  dedication: string | null
  researchInterests: string | null
  areasOfInterest: string[]
  expertiseAreas: string[]
  socialLinks: any[]
  additionalEmails: any[]
  isPublic: boolean
  onboardingCompleted: boolean
  accountType: string
  globalRole: string
  createdAt: string
  updatedAt: string
}

interface AdminProfilesState {
  profiles: Profile[]
  selectedProfileEducation: Education[]
  selectedProfileEmployment: EmploymentHistory[]
  selectedProfileCertifications: Certification[]
  isLoading: boolean

  loadAllProfiles: (organizationId?: string) => Promise<void>
  loadProfileDetails: (profileId: string) => Promise<void>
  updateProfile: (profileId: string, updates: Partial<Profile>) => Promise<void>
  deleteProfile: (profileId: string) => Promise<void>
  createProfile: (profile: Partial<Profile> & { firstName: string; lastName: string }) => Promise<string>

  // Education CRUD
  addEducation: (profileId: string, data: Omit<Education, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<void>
  updateEducation: (id: string, updates: Partial<Omit<Education, "id" | "userId" | "createdAt" | "updatedAt">>) => Promise<void>
  deleteEducation: (id: string) => Promise<void>

  // Employment CRUD
  addEmploymentHistory: (profileId: string, data: Omit<EmploymentHistory, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<void>
  updateEmploymentHistory: (id: string, updates: Partial<Omit<EmploymentHistory, "id" | "userId" | "createdAt" | "updatedAt">>) => Promise<void>
  deleteEmploymentHistory: (id: string) => Promise<void>

  // Certification CRUD
  addCertification: (profileId: string, data: Omit<Certification, "id" | "userId" | "createdAt">) => Promise<void>
  updateCertification: (id: string, updates: Partial<Omit<Certification, "id" | "userId" | "createdAt">>) => Promise<void>
  deleteCertification: (id: string) => Promise<void>
}

function mapProfile(row: any): Profile {
  return {
    id: row.id,
    authId: row.authId || row.auth_id || null,
    firstName: row.firstName || row.first_name || "",
    lastName: row.lastName || row.last_name || "",
    email: row.email || row.authUser?.email || null,
    identityDocumentType: row.identityDocumentType || row.identity_document_type || null,
    identityDocumentNumber: row.identityDocumentNumber || row.identity_document_number || null,
    phone: row.phone || null,
    birthDate: row.birthDate || row.birth_date || null,
    sex: row.sex || null,
    avatarUrl: row.avatarUrl || row.avatar_url || null,
    bio: row.bio || null,
    location: row.location || null,
    institution: row.institution || null,
    dedication: row.dedication || null,
    researchInterests: row.researchInterests || row.research_interests || null,
    areasOfInterest: row.areasOfInterest || row.areas_of_interest || [],
    expertiseAreas: row.expertiseAreas || row.expertise_areas || [],
    socialLinks: row.socialLinks || row.social_links || [],
    additionalEmails: row.additionalEmails || row.additional_emails || [],
    isPublic: row.isPublic ?? row.is_public ?? false,
    onboardingCompleted: row.onboardingCompleted ?? row.onboarding_completed ?? false,
    accountType: row.accountType || row.account_type || "FREE",
    globalRole: row.globalRole || row.global_role || "USER",
    createdAt: row.createdAt || row.created_at || "",
    updatedAt: row.updatedAt || row.updated_at || "",
  }
}

function mapEducation(row: any): Education {
  return {
    id: row.id,
    userId: row.user_id,
    institution: row.institution,
    title: row.title,
    fieldOfStudy: row.field_of_study || null,
    degree: row.degree || null,
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    isCurrent: !!row.is_current,
    city: row.city || null,
    country: row.country || null,
    status: row.status || "completed",
    visibility: row.visibility || "public",
    isFavorite: !!row.is_favorite,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  }
}

function mapEmployment(row: any): EmploymentHistory {
  return {
    id: row.id,
    userId: row.user_id,
    organization: row.organization,
    role: row.role,
    startDate: row.start_date,
    endDate: row.end_date || null,
    isCurrent: !!row.is_current,
    city: row.city || null,
    country: row.country || null,
    visibility: row.visibility || "public",
    isFavorite: !!row.is_favorite,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  }
}

function mapCertification(row: any): Certification {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    issuingOrganization: row.issuing_organization,
    issueDate: row.issue_date,
    expirationDate: row.expiration_date || null,
    credentialId: row.credential_id || null,
    credentialUrl: row.credential_url || null,
    isFavorite: !!row.is_favorite,
    createdAt: row.created_at || "",
  }
}

export const useAdminProfilesStore = create<AdminProfilesState>((set) => ({
  profiles: [],
  selectedProfileEducation: [],
  selectedProfileEmployment: [],
  selectedProfileCertifications: [],
  isLoading: false,

  loadAllProfiles: async (organizationId) => {
    set({ isLoading: true })
    try {
      const data = await api.profiles.list(organizationId)
      set({ profiles: (data || []).map(mapProfile) })
    } catch (e) {
      console.error("Error loading all profiles:", e)
    } finally {
      set({ isLoading: false })
    }
  },

  loadProfileDetails: async (profileId) => {
    set({ isLoading: true })
    try {
      const [eduData, empData, certData] = await Promise.all([api.profiles.education(profileId), api.profiles.employment(profileId), api.profiles.certifications(profileId)])

      set({
        selectedProfileEducation: (eduData || []).map(mapEducation),
        selectedProfileEmployment: (empData || []).map(mapEmployment),
        selectedProfileCertifications: (certData || []).map(mapCertification)
      })
    } catch (e) {
      console.error("Error loading profile details:", e)
    } finally {
      set({ isLoading: false })
    }
  },

  updateProfile: async (profileId, updates) => {
    try {
      const profileUpdates = { ...updates }
      delete profileUpdates.accountType
      delete profileUpdates.globalRole
      delete profileUpdates.authId
      delete profileUpdates.email
      await api.profiles.update(profileId, profileUpdates)

      set((state) => ({
        profiles: state.profiles.map((p) =>
          p.id === profileId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        )
      }))
    } catch (e) {
      console.error("Error updating profile:", e)
      throw e
    }
  },

  deleteProfile: async (profileId) => {
    try {
      await api.profiles.remove(profileId)

      set((state) => ({
        profiles: state.profiles.filter((p) => p.id !== profileId)
      }))
    } catch (e) {
      console.error("Error deleting profile:", e)
      throw e
    }
  },

  createProfile: async (profileData) => {
    try {
      const id = crypto.randomUUID()
      const newProfile = {
        id,
        auth_id: profileData.authId || null,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email || null,
        identity_document_type: profileData.identityDocumentType || null,
        identity_document_number: profileData.identityDocumentNumber || null,
        phone: profileData.phone || null,
        bio: profileData.bio || null,
        avatar_url: profileData.avatarUrl || null,
        institution: profileData.institution || null,
        dedication: profileData.dedication || null,
        global_role: profileData.globalRole || "user",
        account_type: profileData.accountType || "basic",
        is_public: !!profileData.isPublic,
        onboarding_completed: !!profileData.onboardingCompleted,
        areas_of_interest: profileData.areasOfInterest || [],
        expertise_areas: profileData.expertiseAreas || [],
        social_links: profileData.socialLinks || [],
        additional_emails: profileData.additionalEmails || [],
      }
      void newProfile

      const created = await api.profiles.create({ id, firstName: profileData.firstName, lastName: profileData.lastName, email: profileData.email || undefined, phone: profileData.phone || undefined, bio: profileData.bio || undefined })

      const mapped = mapProfile({
        ...created,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      set((state) => ({
        profiles: [mapped, ...state.profiles]
      }))
      return id
    } catch (e) {
      console.error("Error creating profile:", e)
      throw e
    }
  },

  addEducation: async (profileId, data) => {
    try {
      const id = crypto.randomUUID()
      const newRow = {
        id,
        user_id: profileId,
        institution: data.institution,
        title: data.title,
        field_of_study: data.fieldOfStudy || null,
        degree: data.degree || null,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        is_current: data.isCurrent,
        city: data.city || null,
        country: data.country || null,
        status: data.status || "completed",
        visibility: data.visibility || "public",
        is_favorite: data.isFavorite,
      }
      void newRow

      const created = await api.profiles.addEducation(profileId, { institution: data.institution, degree: data.degree, startDate: data.startDate, endDate: data.endDate })

      const mapped = mapEducation({
        ...created,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      set((state) => ({
        selectedProfileEducation: [mapped, ...state.selectedProfileEducation]
      }))
    } catch (e) {
      console.error("Error adding education:", e)
      throw e
    }
  },

  updateEducation: async (id, updates) => {
    try {
      const dbUpdates: any = {}
      if (updates.institution !== undefined) dbUpdates.institution = updates.institution
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.fieldOfStudy !== undefined) dbUpdates.field_of_study = updates.fieldOfStudy
      if (updates.degree !== undefined) dbUpdates.degree = updates.degree
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate
      if (updates.isCurrent !== undefined) dbUpdates.is_current = updates.isCurrent
      if (updates.city !== undefined) dbUpdates.city = updates.city
      if (updates.country !== undefined) dbUpdates.country = updates.country
      if (updates.status !== undefined) dbUpdates.status = updates.status
      if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility
      if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite
      dbUpdates.updated_at = new Date().toISOString()

      await api.profiles.updateEducation(id, dbUpdates)

      set((state) => ({
        selectedProfileEducation: state.selectedProfileEducation.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
        )
      }))
    } catch (e) {
      console.error("Error updating education:", e)
      throw e
    }
  },

  deleteEducation: async (id) => {
    try {
      await api.profiles.removeEducation(id)

      set((state) => ({
        selectedProfileEducation: state.selectedProfileEducation.filter((e) => e.id !== id)
      }))
    } catch (e) {
      console.error("Error deleting education:", e)
      throw e
    }
  },

  addEmploymentHistory: async (profileId, data) => {
    try {
      const id = crypto.randomUUID()
      const newRow = {
        id,
        user_id: profileId,
        organization: data.organization,
        role: data.role,
        start_date: data.startDate,
        end_date: data.endDate || null,
        is_current: data.isCurrent,
        city: data.city || null,
        country: data.country || null,
        visibility: data.visibility || "public",
        is_favorite: data.isFavorite,
      }
      void newRow

      const created = await api.profiles.addEmployment(profileId, { company: data.organization, position: data.role, startDate: data.startDate, endDate: data.endDate || undefined })

      const mapped = mapEmployment({
        ...created,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      set((state) => ({
        selectedProfileEmployment: [mapped, ...state.selectedProfileEmployment]
      }))
    } catch (e) {
      console.error("Error adding employment history:", e)
      throw e
    }
  },

  updateEmploymentHistory: async (id, updates) => {
    try {
      const dbUpdates: any = {}
      if (updates.organization !== undefined) dbUpdates.organization = updates.organization
      if (updates.role !== undefined) dbUpdates.role = updates.role
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate
      if (updates.isCurrent !== undefined) dbUpdates.is_current = updates.isCurrent
      if (updates.city !== undefined) dbUpdates.city = updates.city
      if (updates.country !== undefined) dbUpdates.country = updates.country
      if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility
      if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite
      dbUpdates.updated_at = new Date().toISOString()

      await api.profiles.updateEmployment(id, dbUpdates)

      set((state) => ({
        selectedProfileEmployment: state.selectedProfileEmployment.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
        )
      }))
    } catch (e) {
      console.error("Error updating employment history:", e)
      throw e
    }
  },

  deleteEmploymentHistory: async (id) => {
    try {
      await api.profiles.removeEmployment(id)

      set((state) => ({
        selectedProfileEmployment: state.selectedProfileEmployment.filter((e) => e.id !== id)
      }))
    } catch (e) {
      console.error("Error deleting employment history:", e)
      throw e
    }
  },

  addCertification: async (profileId, data) => {
    try {
      const id = crypto.randomUUID()
      const newRow = {
        id,
        user_id: profileId,
        name: data.name,
        issuing_organization: data.issuingOrganization,
        issue_date: data.issueDate,
        expiration_date: data.expirationDate || null,
        credential_id: data.credentialId || null,
        credential_url: data.credentialUrl || null,
        is_favorite: data.isFavorite,
      }
      void newRow

      const created = await api.profiles.addCertification(profileId, { name: data.name, issuer: data.issuingOrganization, issuedAt: data.issueDate })

      const mapped = mapCertification({
        ...created,
        created_at: new Date().toISOString()
      })

      set((state) => ({
        selectedProfileCertifications: [mapped, ...state.selectedProfileCertifications]
      }))
    } catch (e) {
      console.error("Error adding certification:", e)
      throw e
    }
  },

  updateCertification: async (id, updates) => {
    try {
      const dbUpdates: any = {}
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.issuingOrganization !== undefined) dbUpdates.issuing_organization = updates.issuingOrganization
      if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate
      if (updates.expirationDate !== undefined) dbUpdates.expiration_date = updates.expirationDate
      if (updates.credentialId !== undefined) dbUpdates.credential_id = updates.credentialId
      if (updates.credentialUrl !== undefined) dbUpdates.credential_url = updates.credentialUrl
      if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite

      await api.profiles.updateCertification(id, dbUpdates)

      set((state) => ({
        selectedProfileCertifications: state.selectedProfileCertifications.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        )
      }))
    } catch (e) {
      console.error("Error updating certification:", e)
      throw e
    }
  },

  deleteCertification: async (id) => {
    try {
      await api.profiles.removeCertification(id)

      set((state) => ({
        selectedProfileCertifications: state.selectedProfileCertifications.filter((c) => c.id !== id)
      }))
    } catch (e) {
      console.error("Error deleting certification:", e)
      throw e
    }
  }
}))
