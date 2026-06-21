import { create } from "zustand"
import { supabase } from "@/utils/supabase"
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

  loadAllProfiles: () => Promise<void>
  loadProfileDetails: (profileId: string) => Promise<void>
  updateProfile: (profileId: string, updates: Partial<Profile>) => Promise<void>
  deleteProfile: (profileId: string) => Promise<void>

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
    authId: row.auth_id || null,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    email: row.email || null,
    identityDocumentType: row.identity_document_type || null,
    identityDocumentNumber: row.identity_document_number || null,
    phone: row.phone || null,
    birthDate: row.birth_date || null,
    sex: row.sex || null,
    avatarUrl: row.avatar_url || null,
    bio: row.bio || null,
    location: row.location || null,
    institution: row.institution || null,
    dedication: row.dedication || null,
    researchInterests: row.research_interests || null,
    areasOfInterest: row.areas_of_interest || [],
    expertiseAreas: row.expertise_areas || [],
    socialLinks: row.social_links || [],
    additionalEmails: row.additional_emails || [],
    isPublic: !!row.is_public,
    onboardingCompleted: !!row.onboarding_completed,
    accountType: row.account_type || "basic",
    globalRole: row.global_role || "user",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
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

  loadAllProfiles: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
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
      // 1. Fetch education
      const { data: eduData, error: eduError } = await supabase
        .from("education")
        .select("*")
        .eq("user_id", profileId)
        .order("start_date", { ascending: false })
      if (eduError) throw eduError

      // 2. Fetch employment
      const { data: empData, error: empError } = await supabase
        .from("employment_history")
        .select("*")
        .eq("user_id", profileId)
        .order("start_date", { ascending: false })
      if (empError) throw empError

      // 3. Fetch certifications
      const { data: certData, error: certError } = await supabase
        .from("certifications")
        .select("*")
        .eq("user_id", profileId)
        .order("issue_date", { ascending: false })
      if (certError) throw certError

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
      const dbUpdates: any = {}
      if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName
      if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl
      if (updates.institution !== undefined) dbUpdates.institution = updates.institution
      if (updates.dedication !== undefined) dbUpdates.dedication = updates.dedication
      if (updates.identityDocumentType !== undefined) dbUpdates.identity_document_type = updates.identityDocumentType
      if (updates.identityDocumentNumber !== undefined) dbUpdates.identity_document_number = updates.identityDocumentNumber
      if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic
      if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted
      if (updates.accountType !== undefined) dbUpdates.account_type = updates.accountType
      if (updates.globalRole !== undefined) dbUpdates.global_role = updates.globalRole
      dbUpdates.updated_at = new Date().toISOString()

      const { error } = await supabase.from("profiles").update(dbUpdates).eq("id", profileId)
      if (error) throw error

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
      // Clear education, employment history, and certifications first (due to foreign keys)
      await supabase.from("education").delete().eq("user_id", profileId)
      await supabase.from("employment_history").delete().eq("user_id", profileId)
      await supabase.from("certifications").delete().eq("user_id", profileId)

      // Finally delete the profile
      const { error } = await supabase.from("profiles").delete().eq("id", profileId)
      if (error) throw error

      set((state) => ({
        profiles: state.profiles.filter((p) => p.id !== profileId)
      }))
    } catch (e) {
      console.error("Error deleting profile:", e)
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

      const { error } = await supabase.from("education").insert([newRow])
      if (error) throw error

      const mapped = mapEducation({
        ...newRow,
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

      const { error } = await supabase.from("education").update(dbUpdates).eq("id", id)
      if (error) throw error

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
      const { error } = await supabase.from("education").delete().eq("id", id)
      if (error) throw error

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

      const { error } = await supabase.from("employment_history").insert([newRow])
      if (error) throw error

      const mapped = mapEmployment({
        ...newRow,
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

      const { error } = await supabase.from("employment_history").update(dbUpdates).eq("id", id)
      if (error) throw error

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
      const { error } = await supabase.from("employment_history").delete().eq("id", id)
      if (error) throw error

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

      const { error } = await supabase.from("certifications").insert([newRow])
      if (error) throw error

      const mapped = mapCertification({
        ...newRow,
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

      const { error } = await supabase.from("certifications").update(dbUpdates).eq("id", id)
      if (error) throw error

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
      const { error } = await supabase.from("certifications").delete().eq("id", id)
      if (error) throw error

      set((state) => ({
        selectedProfileCertifications: state.selectedProfileCertifications.filter((c) => c.id !== id)
      }))
    } catch (e) {
      console.error("Error deleting certification:", e)
      throw e
    }
  }
}))
