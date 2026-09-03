import { create } from "zustand"
import { api } from "@/api/client"
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
      const data = await api.certificates.templates()
      set({ templates: data as CertificateTemplate[] })
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
      const data = (await Promise.all(participantIds.map((id) => api.certificates.list(id)))).flat()
      set({ certificates: data as ParticipantCertificate[] })
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
      const data = (await Promise.all(certificateIds.map((id) => api.certificates.logs(id)))).flat()
      set({ logs: data as CertificateTrackingLog[] })
    } catch (err) {
      console.error("Error loading certificate tracking logs:", err)
    } finally {
      set({ isLoading: false })
    }
  },

  loadGlobalData: async (organizationId) => {
    set({ isLoading: true })
    try {
      const eventsData = await api.events.list(organizationId)
      const editionsData = (await Promise.all((eventsData || []).map((event: any) => api.editions.list(event.id)))).flat()
      const templatesData = await api.certificates.templates()
      const participantsData = (await Promise.all((editionsData || []).map((edition: any) => api.participants.list(edition.id)))).flat()
      const certificatesData = (await Promise.all(participantsData.map((participant: any) => api.certificates.list(participant.id)))).flat()
      const logsData = (await Promise.all(certificatesData.map((certificate: any) => api.certificates.logs(certificate.id)))).flat()

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
    const newTemplate = await api.certificates.createTemplate(template) as CertificateTemplate
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

    await api.certificates.updateTemplate(id, cleanUpdates)

    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...updates, updated_at: cleanUpdates.updated_at } : t
      )
    }))
  },

  deleteTemplate: async (id) => {
    await api.certificates.removeTemplate(id)

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
      void payload

      try {
        const created = await api.certificates.issue(part.id, templateId)
        if (created) {
          newCertificates.push(created as ParticipantCertificate)
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
    await api.certificates.update(certificateId, { status: isRevoked ? "REVOKED" : "ISSUED" })

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
    void userAgent
    const created = await api.certificates.addLog(certificateId, { action: actionType, ipAddress })
    if (created) {
      set((state) => ({
        logs: [created as CertificateTrackingLog, ...state.logs]
      }))
    }
  }
}))
