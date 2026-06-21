import { create } from "zustand"
import { supabase } from "@/utils/supabase"

export interface Education {
  id: string
  userId: string
  institution: string
  title: string
  fieldOfStudy: string | null
  degree: string | null
  startDate: string | null
  endDate: string | null
  isCurrent: boolean
  city: string | null
  country: string | null
  status: string
  visibility: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export interface EmploymentHistory {
  id: string
  userId: string
  organization: string
  role: string
  startDate: string
  endDate: string | null
  isCurrent: boolean
  city: string | null
  country: string | null
  visibility: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export interface Certification {
  id: string
  userId: string
  name: string
  issuingOrganization: string
  issueDate: string
  expirationDate: string | null
  credentialId: string | null
  credentialUrl: string | null
  isFavorite: boolean
  createdAt: string
}

interface ProfileState {
  education: Education[]
  employmentHistory: EmploymentHistory[]
  certifications: Certification[]
  isLoading: boolean

  loadProfileData: (userId: string) => Promise<void>

  addEducation: (userId: string, data: Omit<Education, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<void>
  updateEducation: (id: string, updates: Partial<Omit<Education, "id" | "userId" | "createdAt" | "updatedAt">>) => Promise<void>
  deleteEducation: (id: string) => Promise<void>

  addEmploymentHistory: (userId: string, data: Omit<EmploymentHistory, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<void>
  updateEmploymentHistory: (id: string, updates: Partial<Omit<EmploymentHistory, "id" | "userId" | "createdAt" | "updatedAt">>) => Promise<void>
  deleteEmploymentHistory: (id: string) => Promise<void>

  addCertification: (userId: string, data: Omit<Certification, "id" | "userId" | "createdAt">) => Promise<void>
  updateCertification: (id: string, updates: Partial<Omit<Certification, "id" | "userId" | "createdAt">>) => Promise<void>
  deleteCertification: (id: string) => Promise<void>
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

export const useProfileStore = create<ProfileState>((set) => ({
  education: [],
  employmentHistory: [],
  certifications: [],
  isLoading: false,

  loadProfileData: async (userId) => {
    set({ isLoading: true })
    try {
      // 1. Fetch education
      const { data: eduData, error: eduError } = await supabase
        .from("education")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false })
      if (eduError) throw eduError

      // 2. Fetch employment history
      const { data: empData, error: empError } = await supabase
        .from("employment_history")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false })
      if (empError) throw empError

      // 3. Fetch certifications
      const { data: certData, error: certError } = await supabase
        .from("certifications")
        .select("*")
        .eq("user_id", userId)
        .order("issue_date", { ascending: false })
      if (certError) throw certError

      set({
        education: (eduData || []).map(mapEducation),
        employmentHistory: (empData || []).map(mapEmployment),
        certifications: (certData || []).map(mapCertification)
      })
    } catch (e) {
      console.error("Error loading profile data:", e)
    } finally {
      set({ isLoading: false })
    }
  },

  addEducation: async (userId, data) => {
    try {
      const id = crypto.randomUUID()
      const newRow = {
        id,
        user_id: userId,
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
        education: [mapped, ...state.education]
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
        education: state.education.map((e) =>
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
        education: state.education.filter((e) => e.id !== id)
      }))
    } catch (e) {
      console.error("Error deleting education:", e)
      throw e
    }
  },

  addEmploymentHistory: async (userId, data) => {
    try {
      const id = crypto.randomUUID()
      const newRow = {
        id,
        user_id: userId,
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
        employmentHistory: [mapped, ...state.employmentHistory]
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
        employmentHistory: state.employmentHistory.map((e) =>
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
        employmentHistory: state.employmentHistory.filter((e) => e.id !== id)
      }))
    } catch (e) {
      console.error("Error deleting employment history:", e)
      throw e
    }
  },

  addCertification: async (userId, data) => {
    try {
      const id = crypto.randomUUID()
      const newRow = {
        id,
        user_id: userId,
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
        certifications: [mapped, ...state.certifications]
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
        certifications: state.certifications.map((c) =>
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
        certifications: state.certifications.filter((c) => c.id !== id)
      }))
    } catch (e) {
      console.error("Error deleting certification:", e)
      throw e
    }
  }
}))
