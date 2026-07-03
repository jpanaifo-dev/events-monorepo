import { create } from "zustand"
import { supabase } from "@/utils/supabase"
import type {
  CertificateTemplate,
  ParticipantCertificate,
  CertificateTrackingLog,
  CertificateActionType
} from "@/types/database.types"

interface CertificateState {
  templates: CertificateTemplate[]
  certificates: ParticipantCertificate[]
  logs: CertificateTrackingLog[]
  isLoading: boolean

  loadTemplatesForEditions: (editionIds: string[]) => Promise<void>
  loadCertificatesForParticipants: (participantIds: string[]) => Promise<void>
  loadLogsForCertificates: (certificateIds: string[]) => Promise<void>
  loadGlobalData: (organizationId: string) => Promise<void>
  
  addTemplate: (template: Omit<CertificateTemplate, "id" | "created_at" | "updated_at">) => Promise<string>
  updateTemplate: (id: string, updates: Partial<CertificateTemplate>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  
  issueCertificates: (
    templateId: string,
    participants: { id: string; name: string }[],
    sessionId?: string | null
  ) => Promise<{ successCount: number; errors: string[] }>
  
  toggleRevocation: (certificateId: string, isRevoked: boolean) => Promise<void>
  incrementDownloads: (certificateId: string, metadata?: { ipAddress?: string; userAgent?: string }) => Promise<void>
  incrementValidations: (certificateId: string, metadata?: { ipAddress?: string; userAgent?: string }) => Promise<void>
  createTrackingLog: (certificateId: string, actionType: CertificateActionType, ipAddress?: string, userAgent?: string) => Promise<void>
}

export const useCertificateStore = create<CertificateState>((set, get) => ({
  templates: [],
  certificates: [],
  logs: [],
  isLoading: false,

  loadTemplatesForEditions: async (editionIds) => {
    if (editionIds.length === 0) {
      set({ templates: [] })
      return
    }
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("*")
        .in("edition_id", editionIds)
        .order("created_at", { ascending: false })

      if (error) throw error
      set({ templates: data || [] })
    } catch (err) {
      console.error("Error loading certificate templates:", err)
    } finally {
      set({ isLoading: false })
    }
  },

  loadCertificatesForParticipants: async (participantIds) => {
    if (participantIds.length === 0) {
      set({ certificates: [] })
      return
    }
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from("participant_certificates")
        .select("*")
        .in("participant_id", participantIds)
        .order("issued_at", { ascending: false })

      if (error) throw error
      set({ certificates: data || [] })
    } catch (err) {
      console.error("Error loading participant certificates:", err)
    } finally {
      set({ isLoading: false })
    }
  },

  loadLogsForCertificates: async (certificateIds) => {
    if (certificateIds.length === 0) {
      set({ logs: [] })
      return
    }
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from("certificate_tracking_logs")
        .select("*")
        .in("certificate_id", certificateIds)
        .order("created_at", { ascending: false })

      if (error) throw error
      set({ logs: data || [] })
    } catch (err) {
      console.error("Error loading certificate tracking logs:", err)
    } finally {
      set({ isLoading: false })
    }
  },

  loadGlobalData: async (organizationId) => {
    set({ isLoading: true })
    try {
      // 1. Get events for this organization
      const { data: eventsData, error: eventsError } = await supabase
        .from("main_events")
        .select("id")
        .eq("organization_id", organizationId)

      if (eventsError) throw eventsError
      const eventIds = (eventsData || []).map((e) => e.id)
      if (eventIds.length === 0) {
        set({ templates: [], certificates: [], logs: [] })
        return
      }

      // 2. Get editions for these events
      const { data: editionsData, error: editionsError } = await supabase
        .from("editions")
        .select("id")
        .in("main_event_id", eventIds)

      if (editionsError) throw editionsError
      const editionIds = (editionsData || []).map((ed) => ed.id)
      if (editionIds.length === 0) {
        set({ templates: [], certificates: [], logs: [] })
        return
      }

      // 3. Get all templates for these editions
      const { data: templatesData, error: templatesError } = await supabase
        .from("certificate_templates")
        .select("*")
        .in("edition_id", editionIds)

      if (templatesError) throw templatesError

      // 4. Get all participants of these editions to find certificates
      const { data: participantsData, error: participantsError } = await supabase
        .from("event_participants")
        .select("id")
        .in("edition_id", editionIds)

      if (participantsError) throw participantsError
      const participantIds = (participantsData || []).map((p) => p.id)

      let certificatesData: any[] = []
      let logsData: any[] = []

      if (participantIds.length > 0) {
        const { data: certs, error: certsError } = await supabase
          .from("participant_certificates")
          .select("*")
          .in("participant_id", participantIds)

        if (certsError) throw certsError
        certificatesData = certs || []

        const certIds = certificatesData.map((c) => c.id)
        if (certIds.length > 0) {
          const { data: trackLogs, error: trackLogsError } = await supabase
            .from("certificate_tracking_logs")
            .select("*")
            .in("certificate_id", certIds)
            .order("created_at", { ascending: false })

          if (trackLogsError) throw trackLogsError
          logsData = trackLogs || []
        }
      }

      set({
        templates: templatesData || [],
        certificates: certificatesData,
        logs: logsData
      })
    } catch (err) {
      console.error("Error loading global certificate data:", err)
    } finally {
      set({ isLoading: false })
    }
  },

  addTemplate: async (template) => {
    const { data, error } = await supabase
      .from("certificate_templates")
      .insert([template])
      .select()

    if (error) throw error
    const newTemplate = data[0] as CertificateTemplate
    set((state) => ({
      templates: [newTemplate, ...state.templates]
    }))
    return newTemplate.id
  },

  updateTemplate: async (id, updates) => {
    const cleanUpdates = {
      ...updates,
      updated_at: new Date().toISOString()
    }
    // Remove metadata fields that might trigger db constraint errors if modified directly
    delete (cleanUpdates as any).id
    delete (cleanUpdates as any).created_at

    const { error } = await supabase
      .from("certificate_templates")
      .update(cleanUpdates)
      .eq("id", id)

    if (error) throw error

    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...updates, updated_at: cleanUpdates.updated_at } : t
      )
    }))
  },

  deleteTemplate: async (id) => {
    const { error } = await supabase
      .from("certificate_templates")
      .delete()
      .eq("id", id)

    if (error) throw error

    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id)
    }))
  },

  issueCertificates: async (templateId, participants, sessionId = null) => {
    const errors: string[] = []
    let successCount = 0
    const newCertificates: ParticipantCertificate[] = []

    for (const part of participants) {
      // Check if participant already has a certificate for this template/session combo
      const existing = get().certificates.find(
        (c) => c.participant_id === part.id && c.template_id === templateId && c.session_id === sessionId
      )
      if (existing) {
        errors.push(`El participante ${part.name} ya tiene un certificado emitido para esta plantilla.`)
        continue
      }

      const validationCode = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      const validationUrl = `/validar/${validationCode}`

      const payload = {
        participant_id: part.id,
        template_id: templateId,
        session_id: sessionId || null,
        validation_code: validationCode,
        validation_url: validationUrl,
        is_revoked: false,
        downloads_count: 0,
        validations_count: 0,
        pdf_file_url: null,
      }

      try {
        const { data, error } = await supabase
          .from("participant_certificates")
          .insert([payload])
          .select()

        if (error) throw error
        if (data && data[0]) {
          newCertificates.push(data[0] as ParticipantCertificate)
          successCount++
        }
      } catch (err: any) {
        console.error(`Error issuing certificate to ${part.name}:`, err)
        errors.push(`Error al emitir para ${part.name}: ${err.message || err}`)
      }
    }

    if (newCertificates.length > 0) {
      set((state) => ({
        certificates: [...newCertificates, ...state.certificates]
      }))
    }

    return { successCount, errors }
  },

  toggleRevocation: async (certificateId, isRevoked) => {
    const { error } = await supabase
      .from("participant_certificates")
      .update({ is_revoked: isRevoked })
      .eq("id", certificateId)

    if (error) throw error

    set((state) => ({
      certificates: state.certificates.map((c) =>
        c.id === certificateId ? { ...c, is_revoked: isRevoked } : c
      )
    }))
  },

  incrementDownloads: async (certificateId, metadata) => {
    // 1. Get current count
    const cert = get().certificates.find((c) => c.id === certificateId)
    if (!cert) return

    const newCount = (cert.downloads_count || 0) + 1

    const { error } = await supabase
      .from("participant_certificates")
      .update({ downloads_count: newCount })
      .eq("id", certificateId)

    if (error) throw error

    // Update local state count
    set((state) => ({
      certificates: state.certificates.map((c) =>
        c.id === certificateId ? { ...c, downloads_count: newCount } : c
      )
    }))

    // Add tracking log
    await get().createTrackingLog(
      certificateId,
      "download",
      metadata?.ipAddress || "127.0.0.1",
      metadata?.userAgent || "browser"
    )
  },

  incrementValidations: async (certificateId, metadata) => {
    const cert = get().certificates.find((c) => c.id === certificateId)
    if (!cert) return

    const newCount = (cert.validations_count || 0) + 1

    const { error } = await supabase
      .from("participant_certificates")
      .update({ validations_count: newCount })
      .eq("id", certificateId)

    if (error) throw error

    // Update local state count
    set((state) => ({
      certificates: state.certificates.map((c) =>
        c.id === certificateId ? { ...c, validations_count: newCount } : c
      )
    }))

    // Add tracking log
    await get().createTrackingLog(
      certificateId,
      "validation",
      metadata?.ipAddress || "127.0.0.1",
      metadata?.userAgent || "browser"
    )
  },

  createTrackingLog: async (certificateId, actionType, ipAddress = "127.0.0.1", userAgent = "browser") => {
    const payload = {
      certificate_id: certificateId,
      action_type: actionType,
      ip_address: ipAddress,
      user_agent: userAgent
    }

    const { data, error } = await supabase
      .from("certificate_tracking_logs")
      .insert([payload])
      .select()

    if (error) throw error

    if (data && data[0]) {
      set((state) => ({
        logs: [data[0] as CertificateTrackingLog, ...state.logs]
      }))
    }
  }
}))
