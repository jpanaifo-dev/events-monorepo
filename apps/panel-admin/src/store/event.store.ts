import { create } from "zustand"
import { supabase } from "@/utils/supabase"
import { useAuthStore } from "./auth.store"
import { uploadToR2 } from "@/utils/r2-storage"

export interface Event {
  id: string
  organizationId: string
  ownerId: string
  slug: string
  name: string
  shortDescription: string
  about: any
  logoUrl: string
  coverUrl: string
  brandColors: { primary: string; secondary: string }
  status: "draft" | "published" | "archived"
  isActive: boolean
  websiteUrl: string
  contactEmail: string
  socialLinks: { twitter: string; facebook: string; linkedin: string; instagram: string }
  settings: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Edition {
  id: string
  mainEventId: string
  slug: string
  year: number
  name: string
  description: string
  coverUrl: string
  startDate: string
  endDate: string
  isCurrent: boolean
  location: string
  modality: string
}

export interface Speaker {
  id: string
  eventId: string
  editionId: string
  profileId: string
  roleId: string
  roleSlug: string
  firstName: string
  lastName: string
  name: string
  email: string | null
  avatar: string
  talkTitle: string
  talkDescription: string
  bio: string
  checkedIn?: boolean
  identityDocumentType?: string | null
  identityDocumentNumber?: string | null
}

export interface AgendaItem {
  id: string
  /** Corresponds to event_id in DB (stores the edition id when linked to an edition) */
  eventId: string
  /** edition_id FK — direct reference to the editions table */
  editionId?: string | null
  /** parent_activity_id FK — for nested/child activities */
  parentActivityId?: string | null
  timeSlot: string
  title: string
  stage: string
  speakerId: string
  description?: string | null
  startTime?: string | null
  endTime?: string | null
  duration?: number | null
  meetingUrl?: string | null
  activityMode?: "PRESENCIAL" | "VIRTUAL" | "HIBRIDO"
  status?: "PUBLIC" | "DRAFT" | "ARCHIVED"
  orderIndex?: number
  startDate?: string | null
  endDate?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface Attendee {
  id: string
  eventId: string
  editionId: string | null
  profileId?: string | null
  fullName: string
  email: string
  ticketType: string
  registrationDate: string
  checkedIn: boolean
  avatarUrl?: string | null
  identityDocumentType?: string | null
  identityDocumentNumber?: string | null
}

export interface ParticipantRole {
  id: string
  mainEventId: string
  editionId: string | null
  slug: string
  name: Record<string, string> // e.g. { es: string, en?: string }
  badgeColor: string | null
  isActive: boolean
  createdAt: string
}

export interface ThematicLine {
  id: string
  mainEventId: string
  editionId: string | null
  name: string
  description: string | null
  iconUrl: string | null
  colorHex: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EventTicket {
  id: string
  mainEventId: string
  editionId: string | null
  name: string
  description: string | null
  price: number
  currency: string
  quantityTotal: number
  quantitySold: number
  maxPerUser: number | null
  salesStartAt: string | null
  salesEndAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AddSpeakerInput {
  eventId: string
  editionId: string
  profileId: string | null
  roleId: string
  firstName: string
  lastName: string
  email: string | null
  avatar: string
  talkTitle: string
  talkDescription: string
  bio: string
  avatarFile?: File | null
  identityDocumentType?: string | null
  identityDocumentNumber?: string | null
}

export interface EventFilters {
  search?: string
  status?: string
  hasEditions?: string
}

interface EventState {
  events: Event[]
  editions: Edition[]
  speakers: Speaker[]
  speakersTotalCount: number
  agendaItems: AgendaItem[]
  attendees: Attendee[]
  roles: ParticipantRole[]
  thematicLines: ThematicLine[]
  tickets: EventTicket[]
  isLoading: boolean

  loadData: (organizationId: string, filters?: EventFilters) => Promise<void>
  loadRoles: (mainEventId: string) => Promise<void>
  loadFilteredSpeakers: (eventId: string, filters?: { search?: string; editionId?: string; page?: number; pageSize?: number; order?: { field: "name" | "created_at"; direction: "asc" | "desc" } }) => Promise<void>
  fetchAllSpeakersForExport: (eventId: string, filters?: { search?: string; editionId?: string }) => Promise<Speaker[]>
  addRole: (role: Omit<ParticipantRole, "id" | "createdAt">) => Promise<void>
  updateRole: (id: string, updates: Partial<Omit<ParticipantRole, "id" | "createdAt">>) => Promise<void>
  deleteRole: (id: string) => Promise<void>

  loadThematicLines: (mainEventId: string) => Promise<void>
  addThematicLine: (thematicLine: Omit<ThematicLine, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateThematicLine: (id: string, updates: Partial<Omit<ThematicLine, "id" | "createdAt" | "updatedAt">>) => Promise<void>
  deleteThematicLine: (id: string) => Promise<void>

  loadTickets: (mainEventId: string) => Promise<void>
  addTicket: (ticket: Omit<EventTicket, "id" | "quantitySold" | "createdAt" | "updatedAt">) => Promise<void>
  updateTicket: (id: string, updates: Partial<Omit<EventTicket, "id" | "quantitySold" | "createdAt" | "updatedAt">>) => Promise<void>
  deleteTicket: (id: string) => Promise<void>

  addEvent: (event: Omit<Event, "id" | "createdAt" | "updatedAt" | "ownerId" | "slug"> & { id?: string; coverFile?: File | null; logoFile?: File | null }) => Promise<string>
  updateEvent: (id: string, updates: Partial<Event> & { coverFile?: File | null; logoFile?: File | null }) => Promise<void>
  deleteEvent: (id: string) => Promise<void>

  addEdition: (edition: Omit<Edition, "id" | "slug" | "year"> & { year?: number }) => Promise<void>
  updateEdition: (id: string, updates: Partial<Edition>) => Promise<void>
  deleteEdition: (id: string) => Promise<void>

  addSpeaker: (speaker: AddSpeakerInput) => Promise<string>
  updateSpeaker: (id: string, updates: Partial<AddSpeakerInput>) => Promise<void>
  deleteSpeaker: (id: string) => Promise<void>
  toggleSpeakerCheckIn: (id: string) => Promise<void>
  bulkUpsertSpeakers: (eventId: string, rows: {
    id?: string
    firstName: string
    lastName: string
    email: string | null
    talkTitle: string
    bio: string
    roleName?: string
    editionName?: string
    identityDocumentType?: string | null
    identityDocumentNumber?: string | null
  }[]) => Promise<{ createdCount: number; updatedCount: number; errors: string[] }>
  addAgendaItem: (item: Omit<AgendaItem, "id">) => Promise<void>
  updateAgendaItem: (id: string, updates: Partial<AgendaItem>) => Promise<void>
  deleteAgendaItem: (id: string) => Promise<void>

  addAttendee: (attendee: Omit<Attendee, "id"> & {
    firstName?: string
    lastName?: string
    identityDocumentType?: string | null
    identityDocumentNumber?: string | null
  }) => Promise<void>
  toggleAttendeeCheckIn: (id: string) => Promise<void>
  deleteAttendee: (id: string) => Promise<void>
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 80)
}

function mapMainEvent(row: any): Event {
  return {
    id: row.id,
    organizationId: row.organization_id,
    ownerId: row.owner_id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description || "",
    about: row.about || null,
    logoUrl: row.logo_url || "",
    coverUrl: row.cover_url || "",
    brandColors: row.brand_colors || { primary: "#000000", secondary: "#ffffff" },
    status: row.status || "draft",
    isActive: row.is_active !== false,
    websiteUrl: row.website_url || "",
    contactEmail: row.contact_email || "",
    socialLinks: row.social_links || { twitter: "", facebook: "", linkedin: "", instagram: "" },
    settings: row.settings || {},
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  }
}

function mapEdition(row: any): Edition {
  return {
    id: row.id,
    mainEventId: row.main_event_id,
    slug: row.slug,
    year: row.year || new Date().getFullYear(),
    name: typeof row.name === "string" ? row.name : (row.name?.es || row.name?.en || "Edición"),
    description: typeof row.description === "string" ? row.description : (row.description?.es || row.description?.en || ""),
    coverUrl: row.cover_url || "",
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    isCurrent: !!row.is_current,
    location: row.location || "",
    modality: row.modality || "",
  }
}

function mapParticipantRole(row: any): ParticipantRole {
  return {
    id: row.id,
    mainEventId: row.main_event_id,
    editionId: row.edition_id,
    slug: row.slug,
    name: typeof row.name === "string" ? JSON.parse(row.name) : (row.name || { es: "" }),
    badgeColor: row.badge_color,
    isActive: row.is_active !== false,
    createdAt: row.created_at || "",
  }
}

function mapThematicLine(row: any): ThematicLine {
  return {
    id: row.id,
    mainEventId: row.main_event_id,
    editionId: row.edition_id,
    name: row.name,
    description: row.description || null,
    iconUrl: row.icon_url || null,
    colorHex: row.color_hex || "#000000",
    isActive: row.is_active !== false,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  }
}

function mapEventTicket(row: any): EventTicket {
  return {
    id: row.id,
    mainEventId: row.main_event_id,
    editionId: row.edition_id,
    name: row.name,
    description: row.description || null,
    price: typeof row.price === "number" ? row.price : parseFloat(row.price || "0"),
    currency: row.currency || "USD",
    quantityTotal: row.quantity_total || 0,
    quantitySold: row.quantity_sold || 0,
    maxPerUser: row.max_per_user,
    salesStartAt: row.sales_start_at || null,
    salesEndAt: row.sales_end_at || null,
    isActive: row.is_active !== false,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  }
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  editions: [],
  speakers: [],
  speakersTotalCount: 0,
  agendaItems: [],
  attendees: [],
  roles: [],
  thematicLines: [],
  tickets: [],
  isLoading: false,

  loadData: async (organizationId, filters) => {
    set({ isLoading: true })
    try {
      let query = supabase
        .from("main_events")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`)
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status)
      }

      const { data: eventsData, error: eventsError } = await query
      if (eventsError) throw eventsError

      let formattedEvents: Event[] = (eventsData || []).map(mapMainEvent)
      const mainEventIds = formattedEvents.map((e) => e.id)

      // Fetch editions
      let formattedEditions: Edition[] = []
      if (mainEventIds.length > 0) {
        const { data: editionsData } = await supabase
          .from("editions")
          .select("*")
          .in("main_event_id", mainEventIds)
          .order("year", { ascending: false })

        if (editionsData) {
          formattedEditions = editionsData.map(mapEdition)
        }
      }

      // Filter by hasEditions (post-fetch)
      if (filters?.hasEditions === "true") {
        const idsWithEditions = new Set(formattedEditions.map((e) => e.mainEventId))
        formattedEvents = formattedEvents.filter((e) => idsWithEditions.has(e.id))
      }

      // Fetch agenda from event_activities
      let formattedAgenda: AgendaItem[] = []
      const editionIds = formattedEditions.map((ed) => ed.id)
      if (editionIds.length > 0) {
        const { data: activitiesData } = await supabase
          .from("event_activities")
          .select("*")
          .in("event_id", editionIds)

        if (activitiesData) {
          formattedAgenda = activitiesData.map((act: any) => ({
            id: act.id,
            eventId: act.event_id,
            editionId: act.edition_id || null,
            parentActivityId: act.parent_activity_id || null,
            timeSlot: `${act.start_time ? act.start_time.split("T")[1]?.substring(0, 5) : "09:00"} - ${act.end_time ? act.end_time.split("T")[1]?.substring(0, 5) : "10:00"}`,
            title: act.activity_name,
            stage: act.custom_location || "Escenario Principal",
            speakerId: act.speaker_id || "",
            description: act.description || "",
            startTime: act.start_time || null,
            endTime: act.end_time || null,
            duration: act.duration || null,
            meetingUrl: act.meeting_url || null,
            activityMode: act.activity_mode || "PRESENCIAL",
            status: act.status || "PUBLIC",
            orderIndex: act.order_index || 0,
            startDate: act.start_date || null,
            endDate: act.end_date || null,
            createdAt: act.created_at || null,
            updatedAt: act.updated_at || null,
          }))
        }
      }

      // Fetch participant roles to match role_id without postgrest join constraint issues
      let formattedRoles: ParticipantRole[] = []
      if (mainEventIds.length > 0) {
        const { data: rolesData } = await supabase
          .from("participant_roles")
          .select("*")
          .in("main_event_id", mainEventIds)
        if (rolesData) {
          formattedRoles = rolesData.map(mapParticipantRole)
        }
      }

      // Fetch speakers and attendees from event_participants
      const formattedAttendees: Attendee[] = []
      const formattedSpeakers: Speaker[] = []

      if (mainEventIds.length > 0) {
        const { data: participantsData } = await supabase
          .from("event_participants")
          .select(`
            id,
            main_event_id,
            edition_id,
            role_id,
            check_in_status,
            ticket_reference,
            created_at,
            profile:profile_id (
              id, first_name, last_name, email, avatar_url, bio, identity_document_type, identity_document_number
            )
          `)
          .in("main_event_id", mainEventIds)

        if (participantsData) {
          participantsData.forEach((part: any) => {
            const profile = part.profile || {}
            const matchedRole = formattedRoles.find((r) => r.id === part.role_id)
            const roleSlug = matchedRole?.slug || "attendee"
            const roleId = part.role_id || ""
            const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Participante"

            if (roleSlug === "speaker" || roleSlug === "keynote-speaker") {
              formattedSpeakers.push({
                id: part.id,
                eventId: part.main_event_id,
                editionId: part.edition_id,
                profileId: profile.id || "",
                roleId: roleId,
                roleSlug: roleSlug,
                firstName: profile.first_name || "",
                lastName: profile.last_name || "",
                name: fullName,
                email: profile.email || "",
                avatar: profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
                talkTitle: part.ticket_reference || "",
                talkDescription: profile.bio || "",
                bio: profile.bio || "",
                checkedIn: !!part.check_in_status,
                identityDocumentType: profile.identity_document_type || null,
                identityDocumentNumber: profile.identity_document_number || null,
              })
            } else {
              formattedAttendees.push({
                id: part.id,
                eventId: part.main_event_id,
                editionId: part.edition_id || null,
                profileId: profile.id || null,
                fullName,
                email: profile.email || "",
                ticketType: roleSlug === "vip" ? "VIP" : "General",
                registrationDate: part.created_at ? part.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
                checkedIn: !!part.check_in_status,
                avatarUrl: profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
                identityDocumentType: profile.identity_document_type || null,
                identityDocumentNumber: profile.identity_document_number || null,
              })
            }
          })
        }
      }

      // Fetch thematic lines
      let formattedThematicLines: ThematicLine[] = []
      if (mainEventIds.length > 0) {
        const { data: thematicLinesData } = await supabase
          .from("thematic_lines")
          .select("*")
          .in("main_event_id", mainEventIds)
          .order("created_at", { ascending: false })

        if (thematicLinesData) {
          formattedThematicLines = thematicLinesData.map(mapThematicLine)
        }
      }

      // Fetch event tickets
      let formattedTickets: EventTicket[] = []
      if (mainEventIds.length > 0) {
        const { data: ticketsData } = await supabase
          .from("event_tickets")
          .select("*")
          .in("main_event_id", mainEventIds)
          .order("created_at", { ascending: false })

        if (ticketsData) {
          formattedTickets = ticketsData.map(mapEventTicket)
        }
      }

      set({
        events: formattedEvents,
        editions: formattedEditions,
        speakers: formattedSpeakers,
        agendaItems: formattedAgenda,
        attendees: formattedAttendees,
        roles: formattedRoles,
        thematicLines: formattedThematicLines,
        tickets: formattedTickets
      })
    } catch (e) {
      console.error("Error loading events:", e)
    } finally {
      set({ isLoading: false })
    }
  },

  addEvent: async (eventData) => {
    const user = useAuthStore.getState().user
    const org = useAuthStore.getState().selectedOrganization
    if (!user || !org) throw new Error("No user or organization")

    const id = eventData.id || crypto.randomUUID()
    const baseSlug = slugify(eventData.name)
    const slug = `${baseSlug}-${id.substring(0, 8)}`

    const { coverFile, logoFile, ...restData } = eventData

    let coverUrl = eventData.coverUrl || ""
    let logoUrl = eventData.logoUrl || ""

    try {
      if (coverFile) {
        try {
          coverUrl = await uploadToR2(coverFile, `events/${id}`, "cover")
        } catch (uploadErr) {
          console.error("Failed to upload event cover to R2:", uploadErr)
        }
      }

      if (logoFile) {
        try {
          logoUrl = await uploadToR2(logoFile, `events/${id}`, "logo")
        } catch (uploadErr) {
          console.error("Failed to upload event logo to R2:", uploadErr)
        }
      }

      const { error } = await supabase.from("main_events").insert([{
        id,
        organization_id: org.id,
        owner_id: user.id,
        slug,
        name: restData.name,
        short_description: restData.shortDescription || null,
        about: restData.about || null,
        logo_url: logoUrl || null,
        cover_url: coverUrl || null,
        brand_colors: restData.brandColors || { primary: "#000000", secondary: "#ffffff" },
        status: restData.status || "draft",
        is_active: restData.isActive !== false,
        website_url: restData.websiteUrl || null,
        contact_email: restData.contactEmail || null,
        social_links: restData.socialLinks || { twitter: "", facebook: "", linkedin: "", instagram: "" },
        settings: restData.settings || {},
      }])

      if (error) throw error

      const newEvent: Event = {
        ...restData,
        logoUrl,
        coverUrl,
        id,
        organizationId: org.id,
        ownerId: user.id,
        slug,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      set((state) => ({
        events: [newEvent, ...state.events]
      }))

      return id
    } catch (e) {
      console.error("Error adding event:", e)
      throw e
    }
  },

  updateEvent: async (id, updates) => {
    try {
      const { coverFile, logoFile, ...restUpdates } = updates
      let coverUrl = updates.coverUrl
      let logoUrl = updates.logoUrl

      if (coverFile) {
        try {
          coverUrl = await uploadToR2(coverFile, `events/${id}`, "cover")
        } catch (err) {
          console.error("Failed to upload cover to R2:", err)
        }
      }
      if (logoFile) {
        try {
          logoUrl = await uploadToR2(logoFile, `events/${id}`, "logo")
        } catch (err) {
          console.error("Failed to upload logo to R2:", err)
        }
      }

      const mappedUpdates: any = {}
      if (restUpdates.name !== undefined) mappedUpdates.name = restUpdates.name
      if (restUpdates.shortDescription !== undefined) mappedUpdates.short_description = restUpdates.shortDescription
      if (restUpdates.about !== undefined) mappedUpdates.about = restUpdates.about
      if (logoUrl !== undefined) mappedUpdates.logo_url = logoUrl
      if (coverUrl !== undefined) mappedUpdates.cover_url = coverUrl
      if (restUpdates.brandColors !== undefined) mappedUpdates.brand_colors = restUpdates.brandColors
      if (restUpdates.status !== undefined) mappedUpdates.status = restUpdates.status
      if (restUpdates.isActive !== undefined) mappedUpdates.is_active = restUpdates.isActive
      if (restUpdates.websiteUrl !== undefined) mappedUpdates.website_url = restUpdates.websiteUrl
      if (restUpdates.contactEmail !== undefined) mappedUpdates.contact_email = restUpdates.contactEmail
      if (restUpdates.socialLinks !== undefined) mappedUpdates.social_links = restUpdates.socialLinks
      if (restUpdates.settings !== undefined) mappedUpdates.settings = restUpdates.settings
      mappedUpdates.updated_at = new Date().toISOString()

      if (Object.keys(mappedUpdates).length > 1) {
        const { error } = await supabase.from("main_events").update(mappedUpdates).eq("id", id)
        if (error) throw error
      }

      set((state) => ({
        events: state.events.map((e) => e.id === id ? {
          ...e,
          ...restUpdates,
          ...(logoUrl !== undefined ? { logoUrl } : {}),
          ...(coverUrl !== undefined ? { coverUrl } : {}),
          updatedAt: new Date().toISOString()
        } : e)
      }))
    } catch (e) {
      console.error("Error updating event:", e)
      throw e
    }
  },

  deleteEvent: async (id) => {
    try {
      const state = get()
      const editionIds = state.editions.filter((ed) => ed.mainEventId === id).map((ed) => ed.id)

      if (editionIds.length > 0) {
        await supabase.from("event_participants").delete().in("edition_id", editionIds)
        await supabase.from("event_activities").delete().in("event_id", editionIds)
      }
      await supabase.from("thematic_lines").delete().eq("main_event_id", id)
      await supabase.from("editions").delete().eq("main_event_id", id)
      await supabase.from("main_events").delete().eq("id", id)

      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        editions: state.editions.filter((ed) => ed.mainEventId !== id),
        speakers: state.speakers.filter((s) => s.eventId !== id),
        agendaItems: state.agendaItems.filter((a) => !editionIds.includes(a.eventId)),
        attendees: state.attendees.filter((at) => at.eventId !== id),
        thematicLines: state.thematicLines.filter((tl) => tl.mainEventId !== id)
      }))
    } catch (e) {
      console.error("Error deleting event:", e)
      throw e
    }
  },

  addEdition: async (editionData) => {
    const id = crypto.randomUUID()
    const baseSlug = slugify(typeof editionData.name === "string" ? editionData.name : "edicion")
    const slug = `${baseSlug}-${id.substring(0, 8)}`

    try {
      const yearVal = editionData.startDate
        ? parseInt(editionData.startDate.substring(0, 4))
        : new Date().getFullYear()

      const { error } = await supabase.from("editions").insert([{
        id,
        main_event_id: editionData.mainEventId,
        slug,
        year: yearVal,
        name: typeof editionData.name === "string" ? { es: editionData.name } : editionData.name,
        description: editionData.description ? { es: editionData.description } : null,
        cover_url: editionData.coverUrl || null,
        start_date: editionData.startDate || null,
        end_date: editionData.endDate || null,
        is_current: editionData.isCurrent,
        location: editionData.location || null,
        modality: editionData.modality || null,
      }])

      if (error) throw error

      const newEdition: Edition = {
        id,
        mainEventId: editionData.mainEventId,
        slug,
        year: yearVal,
        name: String(editionData.name),
        description: editionData.description || "",
        coverUrl: editionData.coverUrl || "",
        startDate: editionData.startDate || "",
        endDate: editionData.endDate || "",
        isCurrent: editionData.isCurrent,
        location: editionData.location || "",
        modality: editionData.modality || "",
      }

      set((state) => ({
        editions: [...state.editions, newEdition]
      }))
    } catch (e) {
      console.error("Error adding edition:", e)
      throw e
    }
  },

  updateEdition: async (id, updates) => {
    try {
      const mappedUpdates: any = {}
      if (updates.name !== undefined) mappedUpdates.name = { es: updates.name }
      if (updates.description !== undefined) mappedUpdates.description = updates.description ? { es: updates.description } : null
      if (updates.coverUrl !== undefined) mappedUpdates.cover_url = updates.coverUrl || null
      if (updates.startDate !== undefined) mappedUpdates.start_date = updates.startDate
      if (updates.endDate !== undefined) mappedUpdates.end_date = updates.endDate
      if (updates.isCurrent !== undefined) mappedUpdates.is_current = updates.isCurrent
      if (updates.location !== undefined) mappedUpdates.location = updates.location || null
      if (updates.modality !== undefined) mappedUpdates.modality = updates.modality || null
      mappedUpdates.updated_at = new Date().toISOString()

      const { error } = await supabase.from("editions").update(mappedUpdates).eq("id", id)
      if (error) throw error

      set((state) => ({
        editions: state.editions.map((ed) => ed.id === id ? { ...ed, ...updates } : ed)
      }))
    } catch (e) {
      console.error("Error updating edition:", e)
      throw e
    }
  },

  deleteEdition: async (id) => {
    try {
      await supabase.from("event_participants").delete().eq("edition_id", id)
      await supabase.from("thematic_lines").delete().eq("edition_id", id)
      await supabase.from("editions").delete().eq("id", id)

      set((state) => ({
        editions: state.editions.filter((ed) => ed.id !== id),
        thematicLines: state.thematicLines.filter((tl) => tl.editionId !== id)
      }))
    } catch (e) {
      console.error("Error deleting edition:", e)
      throw e
    }
  },

  addSpeaker: async (speakerData) => {
    try {
      let profileId = speakerData.profileId || crypto.randomUUID()
      let avatarUrl = speakerData.avatar

      if (speakerData.avatarFile) {
        try {
          avatarUrl = await uploadToR2(speakerData.avatarFile, "avatars", profileId)
        } catch (uploadErr) {
          console.error("Failed to upload speaker avatar to R2:", uploadErr)
        }
      }

      // 1. Profile handling (Insert or Update)
      const profilePayload = {
        first_name: speakerData.firstName,
        last_name: speakerData.lastName,
        email: speakerData.email || null,
        avatar_url: avatarUrl,
        bio: speakerData.bio,
        identity_document_type: speakerData.identityDocumentType || null,
        identity_document_number: speakerData.identityDocumentNumber || null,
      }

      if (speakerData.profileId) {
        // Update existing profile
        await supabase.from("profiles").update(profilePayload).eq("id", profileId)
      } else {
        // Create new profile
        await supabase.from("profiles").insert([{ id: profileId, ...profilePayload }])
      }

      // 2. Insert participant
      const participantId = crypto.randomUUID()
      await supabase.from("event_participants").insert([{
        id: participantId,
        main_event_id: speakerData.eventId,
        edition_id: speakerData.editionId,
        profile_id: profileId,
        role_id: speakerData.roleId,
        ticket_reference: speakerData.talkTitle,
      }])

      // 3. Find role slug
      const { data: roleData } = await supabase
        .from("participant_roles")
        .select("slug")
        .eq("id", speakerData.roleId)
        .maybeSingle()

      const roleSlug = roleData?.slug || "speaker"

      const fullName = `${speakerData.firstName} ${speakerData.lastName}`.trim()
      const newSpeaker: Speaker = {
        id: participantId,
        eventId: speakerData.eventId,
        editionId: speakerData.editionId,
        profileId: profileId!,
        roleId: speakerData.roleId,
        roleSlug,
        firstName: speakerData.firstName,
        lastName: speakerData.lastName,
        name: fullName,
        email: speakerData.email,
        avatar: speakerData.avatar,
        talkTitle: speakerData.talkTitle,
        talkDescription: speakerData.talkDescription,
        bio: speakerData.bio,
        checkedIn: false,
        identityDocumentType: speakerData.identityDocumentType || null,
        identityDocumentNumber: speakerData.identityDocumentNumber || null,
      }

      set((state) => ({
        speakers: [...state.speakers, newSpeaker]
      }))

      return participantId
    } catch (e) {
      console.error("Error adding speaker:", e)
      throw e
    }
  },

  updateSpeaker: async (id, updates) => {
    try {
      const current = get().speakers.find((s) => s.id === id)
      if (!current) throw new Error("Speaker not found")

      // 1. Update Profile in DB
      const profileUpdates: any = {}
      if (updates.firstName !== undefined) profileUpdates.first_name = updates.firstName
      if (updates.lastName !== undefined) profileUpdates.last_name = updates.lastName
      if (updates.email !== undefined) profileUpdates.email = updates.email || null
      if (updates.avatar !== undefined) profileUpdates.avatar_url = updates.avatar
      if (updates.bio !== undefined) profileUpdates.bio = updates.bio
      if (updates.identityDocumentType !== undefined) profileUpdates.identity_document_type = updates.identityDocumentType || null
      if (updates.identityDocumentNumber !== undefined) profileUpdates.identity_document_number = updates.identityDocumentNumber || null

      if (Object.keys(profileUpdates).length > 0) {
        await supabase.from("profiles").update(profileUpdates).eq("id", current.profileId)
      }

      // 2. Update Participant in DB
      const participantUpdates: any = {}
      if (updates.editionId !== undefined) participantUpdates.edition_id = updates.editionId
      if (updates.roleId !== undefined) participantUpdates.role_id = updates.roleId
      if (updates.talkTitle !== undefined) participantUpdates.ticket_reference = updates.talkTitle

      if (Object.keys(participantUpdates).length > 0) {
        await supabase.from("event_participants").update(participantUpdates).eq("id", id)
      }

      // 3. Update local state
      let updatedRoleSlug = current.roleSlug
      if (updates.roleId && updates.roleId !== current.roleId) {
        const { data: roleData } = await supabase
          .from("participant_roles")
          .select("slug")
          .eq("id", updates.roleId)
          .maybeSingle()
        if (roleData) updatedRoleSlug = roleData.slug
      }

      set((state) => ({
        speakers: state.speakers.map((s) => {
          if (s.id === id) {
            const { profileId, email, ...safeUpdates } = updates
            const merged = { ...s, ...safeUpdates }
            if (updates.firstName !== undefined || updates.lastName !== undefined) {
              merged.name = `${updates.firstName ?? s.firstName} ${updates.lastName ?? s.lastName}`.trim()
            }
            merged.roleSlug = updatedRoleSlug
            return merged
          }
          return s
        })
      }))
    } catch (e) {
      console.error("Error updating speaker:", e)
      throw e
    }
  },

  deleteSpeaker: async (id) => {
    try {
      const { data: partData } = await supabase
        .from("event_participants")
        .select("profile_id")
        .eq("id", id)
        .maybeSingle()

      await supabase.from("event_participants").delete().eq("id", id)
      if (partData?.profile_id) {
        await supabase.from("profiles").delete().eq("id", partData.profile_id)
      }

      set((state) => ({
        speakers: state.speakers.filter((s) => s.id !== id),
        agendaItems: state.agendaItems.map((a) => a.speakerId === id ? { ...a, speakerId: "" } : a)
      }))
    } catch (e) {
      console.error("Error deleting speaker:", e)
    }
  },

  addAgendaItem: async (itemData) => {
    const id = crypto.randomUUID()
    try {
      const { error } = await supabase.from("event_activities").insert([{
        id,
        event_id: itemData.eventId,
        edition_id: itemData.editionId || null,
        parent_activity_id: itemData.parentActivityId || null,
        activity_name: itemData.title,
        description: itemData.description || null,
        custom_location: itemData.stage,
        speaker_id: itemData.speakerId || null,
        start_time: itemData.startTime || null,
        end_time: itemData.endTime || null,
        duration: itemData.duration || null,
        meeting_url: itemData.meetingUrl || null,
        activity_mode: itemData.activityMode || "PRESENCIAL",
        status: itemData.status || "PUBLIC",
        order_index: itemData.orderIndex ?? 0,
        start_date: itemData.startDate || null,
        end_date: itemData.endDate || null,
      }])

      if (error) throw error

      set((state) => ({
        agendaItems: [...state.agendaItems, { id, ...itemData }]
      }))
    } catch (e) {
      console.error("Error adding agenda activity:", e)
      throw e
    }
  },

  updateAgendaItem: async (id, updates) => {
    try {
      const mappedUpdates: any = {}
      if (updates.title !== undefined) mappedUpdates.activity_name = updates.title
      if (updates.description !== undefined) mappedUpdates.description = updates.description
      if (updates.stage !== undefined) mappedUpdates.custom_location = updates.stage
      if (updates.speakerId !== undefined) mappedUpdates.speaker_id = updates.speakerId || null
      if (updates.startTime !== undefined) mappedUpdates.start_time = updates.startTime
      if (updates.endTime !== undefined) mappedUpdates.end_time = updates.endTime
      if (updates.duration !== undefined) mappedUpdates.duration = updates.duration
      if (updates.meetingUrl !== undefined) mappedUpdates.meeting_url = updates.meetingUrl
      if (updates.activityMode !== undefined) mappedUpdates.activity_mode = updates.activityMode
      if (updates.status !== undefined) mappedUpdates.status = updates.status
      if (updates.orderIndex !== undefined) mappedUpdates.order_index = updates.orderIndex
      if (updates.startDate !== undefined) mappedUpdates.start_date = updates.startDate
      if (updates.endDate !== undefined) mappedUpdates.end_date = updates.endDate
      if (updates.editionId !== undefined) mappedUpdates.edition_id = updates.editionId || null
      if (updates.parentActivityId !== undefined) mappedUpdates.parent_activity_id = updates.parentActivityId || null

      const { error } = await supabase.from("event_activities").update(mappedUpdates).eq("id", id)
      if (error) throw error

      set((state) => ({
        agendaItems: state.agendaItems.map((a) => a.id === id ? { ...a, ...updates } : a)
      }))
    } catch (e) {
      console.error("Error updating agenda item:", e)
      throw e
    }
  },

  deleteAgendaItem: async (id) => {
    try {
      await supabase.from("event_activities").delete().eq("id", id)
      set((state) => ({
        agendaItems: state.agendaItems.filter((a) => a.id !== id)
      }))
    } catch (e) {
      console.error("Error deleting agenda item:", e)
    }
  },

  addAttendee: async (attendeeData) => {
    try {
      const state = get()
      let targetEditionId = attendeeData.editionId

      if (targetEditionId === undefined) {
        let edition = state.editions.find((ed) => ed.mainEventId === attendeeData.eventId)

        if (!edition) {
          const editionId = crypto.randomUUID()
          const defaultEdition = {
            id: editionId,
            main_event_id: attendeeData.eventId,
            slug: `default-${editionId.substring(0, 8)}`,
            year: new Date().getFullYear(),
            name: { es: "Edición Principal" },
            start_date: new Date().toISOString().split("T")[0],
            end_date: new Date().toISOString().split("T")[0],
            is_current: true
          }
          await supabase.from("editions").insert([defaultEdition])

          const newEd: Edition = {
            id: editionId,
            mainEventId: attendeeData.eventId,
            slug: defaultEdition.slug,
            year: defaultEdition.year,
            name: "Edición Principal",
            startDate: defaultEdition.start_date,
            endDate: defaultEdition.end_date,
            isCurrent: true,
            description: "",
            coverUrl: "",
            location: "",
            modality: "presencial",
          }

          set((state) => ({
            editions: [...state.editions, newEd]
          }))
          edition = newEd
        }
        targetEditionId = edition.id
      }

      const profileId = crypto.randomUUID()
      const participantId = crypto.randomUUID()

      let firstName = attendeeData.firstName?.trim()
      let lastName = attendeeData.lastName?.trim()
      if (firstName === undefined || lastName === undefined) {
        const nameParts = attendeeData.fullName ? attendeeData.fullName.trim().split(" ") : []
        firstName = firstName ?? (nameParts[0] || "Asistente")
        lastName = lastName ?? (nameParts.slice(1).join(" ") || "")
      }

      const docType = attendeeData.identityDocumentType || null
      const docNumber = attendeeData.identityDocumentNumber?.trim() || null

      await supabase.from("profiles").insert([{
        id: profileId,
        first_name: firstName,
        last_name: lastName,
        email: attendeeData.email,
        identity_document_type: docType,
        identity_document_number: docNumber
      }])

      const ticketRole = attendeeData.ticketType.toLowerCase()
      const { data: roleData } = await supabase
        .from("participant_roles")
        .select("id")
        .eq("slug", ticketRole)
        .eq("main_event_id", attendeeData.eventId)
        .maybeSingle()

      let roleId = roleData?.id
      if (!roleId) {
        roleId = crypto.randomUUID()
        await supabase.from("participant_roles").insert([{
          id: roleId,
          main_event_id: attendeeData.eventId,
          slug: ticketRole,
          name: { es: attendeeData.ticketType }
        }])
      }

      await supabase.from("event_participants").insert([{
        id: participantId,
        main_event_id: attendeeData.eventId,
        edition_id: targetEditionId,
        profile_id: profileId,
        role_id: roleId,
        check_in_status: attendeeData.checkedIn
      }])

      const fullName = `${firstName} ${lastName}`.trim()
      const { firstName: _, lastName: __, identityDocumentType: ___, identityDocumentNumber: ____, ...cleanAttendeeData } = attendeeData

      set((state) => ({
        attendees: [...state.attendees, { 
          ...cleanAttendeeData,
          id: participantId, 
          editionId: targetEditionId, 
          profileId,
          fullName
        }]
      }))
    } catch (e) {
      console.error("Error adding attendee:", e)
    }
  },

  toggleAttendeeCheckIn: async (id) => {
    try {
      const attendee = get().attendees.find((a) => a.id === id)
      if (!attendee) return

      await supabase.from("event_participants").update({
        check_in_status: !attendee.checkedIn
      }).eq("id", id)

      set((state) => ({
        attendees: state.attendees.map((at) => at.id === id ? { ...at, checkedIn: !at.checkedIn } : at)
      }))
    } catch (e) {
      console.error("Error toggling check-in:", e)
    }
  },
  deleteAttendee: async (id) => {
    try {
      const { data: partData } = await supabase
        .from("event_participants")
        .select("profile_id")
        .eq("id", id)
        .maybeSingle()

      await supabase.from("event_participants").delete().eq("id", id)
      if (partData?.profile_id) {
        await supabase.from("profiles").delete().eq("id", partData.profile_id)
      }

      set((state) => ({
        attendees: state.attendees.filter((at) => at.id !== id)
      }))
    } catch (e) {
      console.error("Error deleting attendee:", e)
    }
  },

  loadRoles: async (mainEventId) => {
    try {
      const { data, error } = await supabase
        .from("participant_roles")
        .select("*")
        .eq("main_event_id", mainEventId)
        .order("created_at", { ascending: false })

      if (error) throw error

      set({ roles: (data || []).map(mapParticipantRole) })
    } catch (e) {
      console.error("Error loading participant roles:", e)
    }
  },

  loadFilteredSpeakers: async (eventId, filters) => {
    set({ isLoading: true })
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from("participant_roles")
        .select("*")
        .eq("main_event_id", eventId)

      if (rolesError) throw rolesError

      const formattedRoles = (rolesData || []).map(mapParticipantRole)
      const speakerRoleIds = formattedRoles
        .filter((r) => r.slug === "speaker" || r.slug === "keynote-speaker")
        .map((r) => r.id)

      let profileIds: string[] | null = null
      if (filters?.search && filters.search.trim()) {
        const searchVal = `%${filters.search.trim()}%`
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .or(`first_name.ilike.${searchVal},last_name.ilike.${searchVal},email.ilike.${searchVal}`)

        if (profileError) throw profileError
        profileIds = (profiles || []).map((p) => p.id)
      }

      if (profileIds !== null && profileIds.length === 0) {
        set((state) => {
          const otherSpeakers = state.speakers.filter((s) => s.eventId !== eventId)
          return {
            speakers: otherSpeakers,
            speakersTotalCount: 0,
            roles: formattedRoles,
            isLoading: false
          }
        })
        return
      }

      if (speakerRoleIds.length === 0) {
        set((state) => {
          const otherSpeakers = state.speakers.filter((s) => s.eventId !== eventId)
          return {
            speakers: otherSpeakers,
            speakersTotalCount: 0,
            roles: formattedRoles,
            isLoading: false
          }
        })
        return
      }

      let countQuery = supabase
        .from("event_participants")
        .select("id", { count: "exact", head: true })
        .eq("main_event_id", eventId)
        .in("role_id", speakerRoleIds)

      if (filters?.editionId && filters.editionId !== "all") {
        countQuery = countQuery.eq("edition_id", filters.editionId)
      }
      if (profileIds !== null) {
        countQuery = countQuery.in("profile_id", profileIds)
      }

      const { count, error: countError } = await countQuery
      if (countError) throw countError
      const totalCount = count || 0

      let query = supabase
        .from("event_participants")
        .select(`
          id,
          main_event_id,
          edition_id,
          role_id,
          check_in_status,
          ticket_reference,
          created_at,
          profile:profile_id (
            id, first_name, last_name, email, avatar_url, bio
          )
        `)
        .eq("main_event_id", eventId)
        .in("role_id", speakerRoleIds)

      if (filters?.editionId && filters.editionId !== "all") {
        query = query.eq("edition_id", filters.editionId)
      }
      if (profileIds !== null) {
        query = query.in("profile_id", profileIds)
      }

      const page = filters?.page || 1
      const pageSize = filters?.pageSize || 20
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      // Ordering: default is created_at desc; name sort is client-side after fetch
      // since name lives on profiles (joined), we always fetch ordered by created_at
      // and sort client-side when field === 'name'
      query = query.order("created_at", { ascending: false })

      const { data: participantsData, error: participantsError } = await query
      if (participantsError) throw participantsError

      const formattedSpeakers: Speaker[] = []
      if (participantsData) {
        participantsData.forEach((part: any) => {
          const profile = part.profile || {}
          const matchedRole = formattedRoles.find((r) => r.id === part.role_id)
          const roleSlug = matchedRole?.slug || "attendee"
          const roleId = part.role_id || ""
          const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Participante"

          formattedSpeakers.push({
            id: part.id,
            eventId: part.main_event_id,
            editionId: part.edition_id,
            profileId: profile.id || "",
            roleId: roleId,
            roleSlug: roleSlug,
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            name: fullName,
            email: profile.email || "",
            avatar: profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
            talkTitle: part.ticket_reference || "",
            talkDescription: profile.bio || "",
            bio: profile.bio || "",
            checkedIn: !!part.check_in_status,
          })
        })
      }

      // Apply name sort client-side if requested (name comes from joined profile)
      let sorted = formattedSpeakers
      if (filters?.order?.field === "name") {
        sorted = [...formattedSpeakers].sort((a, b) =>
          filters.order!.direction === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        )
      }

      set((state) => {
        const otherSpeakers = state.speakers.filter((s) => s.eventId !== eventId)
        return {
          speakers: [...otherSpeakers, ...sorted],
          speakersTotalCount: totalCount,
          roles: formattedRoles
        }
      })
    } catch (e) {
      console.error("Error loading filtered speakers:", e)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchAllSpeakersForExport: async (eventId, filters) => {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from("participant_roles")
        .select("*")
        .eq("main_event_id", eventId)

      if (rolesError) throw rolesError

      const formattedRoles = (rolesData || []).map(mapParticipantRole)
      const speakerRoleIds = formattedRoles
        .filter((r) => r.slug === "speaker" || r.slug === "keynote-speaker")
        .map((r) => r.id)

      let profileIds: string[] | null = null
      if (filters?.search && filters.search.trim()) {
        const searchVal = `%${filters.search.trim()}%`
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .or(`first_name.ilike.${searchVal},last_name.ilike.${searchVal},email.ilike.${searchVal}`)

        if (profileError) throw profileError
        profileIds = (profiles || []).map((p) => p.id)
      }

      if (profileIds !== null && profileIds.length === 0) return []
      if (speakerRoleIds.length === 0) return []

      let query = supabase
        .from("event_participants")
        .select(`
          id,
          main_event_id,
          edition_id,
          role_id,
          check_in_status,
          ticket_reference,
          created_at,
          profile:profile_id (
            id, first_name, last_name, email, avatar_url, bio, identity_document_type, identity_document_number
          )
        `)
        .eq("main_event_id", eventId)
        .in("role_id", speakerRoleIds)

      if (filters?.editionId && filters.editionId !== "all") {
        query = query.eq("edition_id", filters.editionId)
      }
      if (profileIds !== null) {
        query = query.in("profile_id", profileIds)
      }

      const { data: participantsData, error: participantsError } = await query
      if (participantsError) throw participantsError

      const formattedSpeakers: Speaker[] = []
      if (participantsData) {
        participantsData.forEach((part: any) => {
          const profile = part.profile || {}
          const matchedRole = formattedRoles.find((r) => r.id === part.role_id)
          const roleSlug = matchedRole?.slug || "attendee"
          const roleId = part.role_id || ""
          const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Participante"

          formattedSpeakers.push({
            id: part.id,
            eventId: part.main_event_id,
            editionId: part.edition_id,
            profileId: profile.id || "",
            roleId: roleId,
            roleSlug: roleSlug,
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            name: fullName,
            email: profile.email || "",
            avatar: profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
            talkTitle: part.ticket_reference || "",
            talkDescription: profile.bio || "",
            bio: profile.bio || "",
            checkedIn: !!part.check_in_status,
            identityDocumentType: profile.identity_document_type || null,
            identityDocumentNumber: profile.identity_document_number || null,
          })
        })
      }

      return formattedSpeakers
    } catch (e) {
      console.error("Error fetching all speakers for export:", e)
      return []
    }
  },

  addRole: async (roleData) => {
    try {
      const id = crypto.randomUUID()
      const newRole = {
        id,
        main_event_id: roleData.mainEventId,
        edition_id: roleData.editionId,
        slug: roleData.slug,
        name: roleData.name,
        badge_color: roleData.badgeColor,
        is_active: roleData.isActive,
      }

      const { error } = await supabase
        .from("participant_roles")
        .insert([newRole])

      if (error) throw error

      const mapped: ParticipantRole = {
        id,
        mainEventId: roleData.mainEventId,
        editionId: roleData.editionId,
        slug: roleData.slug,
        name: roleData.name,
        badgeColor: roleData.badgeColor,
        isActive: roleData.isActive,
        createdAt: new Date().toISOString(),
      }

      set((state) => ({
        roles: [mapped, ...state.roles]
      }))
    } catch (e) {
      console.error("Error adding role:", e)
      throw e
    }
  },

  updateRole: async (id, updates) => {
    try {
      const dbUpdates: any = {}
      if (updates.mainEventId !== undefined) dbUpdates.main_event_id = updates.mainEventId
      if (updates.editionId !== undefined) dbUpdates.edition_id = updates.editionId
      if (updates.slug !== undefined) dbUpdates.slug = updates.slug
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.badgeColor !== undefined) dbUpdates.badge_color = updates.badgeColor
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

      const { error } = await supabase
        .from("participant_roles")
        .update(dbUpdates)
        .eq("id", id)

      if (error) throw error

      set((state) => ({
        roles: state.roles.map((r) => r.id === id ? { ...r, ...updates } : r)
      }))
    } catch (e) {
      console.error("Error updating role:", e)
      throw e
    }
  },

  deleteRole: async (id) => {
    try {
      const { error } = await supabase
        .from("participant_roles")
        .delete()
        .eq("id", id)

      if (error) throw error

      set((state) => ({
        roles: state.roles.filter((r) => r.id !== id)
      }))
    } catch (e) {
      console.error("Error deleting role:", e)
      throw e
    }
  },

  loadThematicLines: async (mainEventId) => {
    try {
      const { data, error } = await supabase
        .from("thematic_lines")
        .select("*")
        .eq("main_event_id", mainEventId)
        .order("created_at", { ascending: false })

      if (error) throw error

      const mapped = (data || []).map(mapThematicLine)
      set((state) => {
        const others = state.thematicLines.filter((tl) => tl.mainEventId !== mainEventId)
        return { thematicLines: [...others, ...mapped] }
      })
    } catch (e) {
      console.error("Error loading thematic lines:", e)
    }
  },

  addThematicLine: async (thematicLineData) => {
    try {
      const id = crypto.randomUUID()
      const newTl = {
        id,
        main_event_id: thematicLineData.mainEventId,
        edition_id: thematicLineData.editionId,
        name: thematicLineData.name,
        description: thematicLineData.description,
        icon_url: thematicLineData.iconUrl,
        color_hex: thematicLineData.colorHex,
        is_active: thematicLineData.isActive,
      }

      const { error } = await supabase
        .from("thematic_lines")
        .insert([newTl])

      if (error) throw error

      const mapped: ThematicLine = {
        id,
        mainEventId: thematicLineData.mainEventId,
        editionId: thematicLineData.editionId,
        name: thematicLineData.name,
        description: thematicLineData.description,
        iconUrl: thematicLineData.iconUrl,
        colorHex: thematicLineData.colorHex,
        isActive: thematicLineData.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      set((state) => ({
        thematicLines: [mapped, ...state.thematicLines]
      }))
    } catch (e) {
      console.error("Error adding thematic line:", e)
      throw e
    }
  },

  updateThematicLine: async (id, updates) => {
    try {
      const dbUpdates: any = {}
      if (updates.mainEventId !== undefined) dbUpdates.main_event_id = updates.mainEventId
      if (updates.editionId !== undefined) dbUpdates.edition_id = updates.editionId
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.iconUrl !== undefined) dbUpdates.icon_url = updates.iconUrl
      if (updates.colorHex !== undefined) dbUpdates.color_hex = updates.colorHex
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
      dbUpdates.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from("thematic_lines")
        .update(dbUpdates)
        .eq("id", id)

      if (error) throw error

      set((state) => ({
        thematicLines: state.thematicLines.map((tl) =>
          tl.id === id ? { ...tl, ...updates, updatedAt: new Date().toISOString() } : tl
        )
      }))
    } catch (e) {
      console.error("Error updating thematic line:", e)
      throw e
    }
  },

  deleteThematicLine: async (id) => {
    try {
      const { error } = await supabase
        .from("thematic_lines")
        .delete()
        .eq("id", id)

      if (error) throw error

      set((state) => ({
        thematicLines: state.thematicLines.filter((tl) => tl.id !== id)
      }))
    } catch (e) {
      console.error("Error deleting thematic line:", e)
      throw e
    }
  },

  loadTickets: async (mainEventId) => {
    try {
      const { data, error } = await supabase
        .from("event_tickets")
        .select("*")
        .eq("main_event_id", mainEventId)
        .order("created_at", { ascending: false })

      if (error) throw error

      const mapped = (data || []).map(mapEventTicket)
      set((state) => {
        const others = state.tickets.filter((t) => t.mainEventId !== mainEventId)
        return { tickets: [...others, ...mapped] }
      })
    } catch (e) {
      console.error("Error loading event tickets:", e)
    }
  },

  addTicket: async (ticketData) => {
    try {
      const id = crypto.randomUUID()
      const newTicket = {
        id,
        main_event_id: ticketData.mainEventId,
        edition_id: ticketData.editionId,
        name: ticketData.name,
        description: ticketData.description,
        price: ticketData.price,
        currency: ticketData.currency,
        quantity_total: ticketData.quantityTotal,
        quantity_sold: 0,
        max_per_user: ticketData.maxPerUser,
        sales_start_at: ticketData.salesStartAt,
        sales_end_at: ticketData.salesEndAt,
        is_active: ticketData.isActive,
      }

      const { error } = await supabase
        .from("event_tickets")
        .insert([newTicket])

      if (error) throw error

      const mapped: EventTicket = {
        id,
        mainEventId: ticketData.mainEventId,
        editionId: ticketData.editionId,
        name: ticketData.name,
        description: ticketData.description,
        price: ticketData.price,
        currency: ticketData.currency,
        quantityTotal: ticketData.quantityTotal,
        quantitySold: 0,
        maxPerUser: ticketData.maxPerUser,
        salesStartAt: ticketData.salesStartAt,
        salesEndAt: ticketData.salesEndAt,
        isActive: ticketData.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      set((state) => ({
        tickets: [mapped, ...state.tickets]
      }))
    } catch (e) {
      console.error("Error adding ticket:", e)
      throw e
    }
  },

  updateTicket: async (id, updates) => {
    try {
      const dbUpdates: any = {}
      if (updates.mainEventId !== undefined) dbUpdates.main_event_id = updates.mainEventId
      if (updates.editionId !== undefined) dbUpdates.edition_id = updates.editionId
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.price !== undefined) dbUpdates.price = updates.price
      if (updates.currency !== undefined) dbUpdates.currency = updates.currency
      if (updates.quantityTotal !== undefined) dbUpdates.quantity_total = updates.quantityTotal
      if (updates.maxPerUser !== undefined) dbUpdates.max_per_user = updates.maxPerUser
      if (updates.salesStartAt !== undefined) dbUpdates.sales_start_at = updates.salesStartAt
      if (updates.salesEndAt !== undefined) dbUpdates.sales_end_at = updates.salesEndAt
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
      dbUpdates.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from("event_tickets")
        .update(dbUpdates)
        .eq("id", id)

      if (error) throw error

      set((state) => ({
        tickets: state.tickets.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        )
      }))
    } catch (e) {
      console.error("Error updating ticket:", e)
      throw e
    }
  },

  deleteTicket: async (id) => {
    try {
      const { error } = await supabase
        .from("event_tickets")
        .delete()
        .eq("id", id)

      if (error) throw error

      set((state) => ({
        tickets: state.tickets.filter((t) => t.id !== id)
      }))
    } catch (e) {
      console.error("Error deleting ticket:", e)
      throw e
    }
  },

  toggleSpeakerCheckIn: async (id) => {
    try {
      const speaker = get().speakers.find((s) => s.id === id)
      if (!speaker) return

      const { error } = await supabase
        .from("event_participants")
        .update({
          check_in_status: !speaker.checkedIn
        })
        .eq("id", id)

      if (error) throw error

      set((state) => ({
        speakers: state.speakers.map((sp) => sp.id === id ? { ...sp, checkedIn: !sp.checkedIn } : sp)
      }))
    } catch (e) {
      console.error("Error toggling speaker check-in:", e)
    }
  },

  bulkUpsertSpeakers: async (eventId, rows) => {
    let currentRoles = get().roles
    if (currentRoles.length === 0) {
      const { data } = await supabase.from("participant_roles").select("*").eq("main_event_id", eventId)
      if (data) {
        currentRoles = data.map(mapParticipantRole)
      }
    }
    let currentEditions = get().editions.filter(ed => ed.mainEventId === eventId)
    if (currentEditions.length === 0) {
      const { data } = await supabase.from("editions").select("*").eq("main_event_id", eventId)
      if (data) {
        currentEditions = data.map(mapEdition)
      }
    }

    let createdCount = 0
    let updatedCount = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        if (!row.firstName || !row.lastName) {
          errors.push(`Fila ${i + 2}: Nombre y Apellido son requeridos.`)
          continue
        }

        // Find role ID
        let roleId = ""
        if (row.roleName) {
          const matchedRole = currentRoles.find(r => 
            r.name.es?.toLowerCase() === row.roleName?.toLowerCase() ||
            r.name.en?.toLowerCase() === row.roleName?.toLowerCase() ||
            r.slug?.toLowerCase() === row.roleName?.toLowerCase()
          )
          if (matchedRole) roleId = matchedRole.id
        }
        if (!roleId) {
          const defaultRole = currentRoles.find(r => r.slug === "speaker" || r.slug === "keynote-speaker") || currentRoles[0]
          roleId = defaultRole?.id || ""
        }

        // Find edition ID
        let editionId: string | null = null
        if (row.editionName) {
          const matchedEd = currentEditions.find(ed => ed.name.toLowerCase() === row.editionName?.toLowerCase())
          if (matchedEd) editionId = matchedEd.id
        }
        if (!editionId) {
          const currentEd = currentEditions.find(ed => ed.isCurrent) || currentEditions[0]
          editionId = currentEd?.id || null
        }

        // Determine if speaker already exists in event
        let existingSpeaker = null
        if (row.id) {
          existingSpeaker = get().speakers.find(s => s.id === row.id)
        }
        if (!existingSpeaker && row.email) {
          existingSpeaker = get().speakers.find(s => s.eventId === eventId && s.email?.toLowerCase() === row.email?.toLowerCase())
        }

        if (existingSpeaker) {
          // Update speaker
          await get().updateSpeaker(existingSpeaker.id, {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            talkTitle: row.talkTitle,
            bio: row.bio,
            roleId,
            editionId: editionId || undefined,
            identityDocumentType: row.identityDocumentType,
            identityDocumentNumber: row.identityDocumentNumber,
          })
          updatedCount++
        } else {
          // Insert speaker
          await get().addSpeaker({
            eventId,
            editionId: editionId || "",
            profileId: null,
            roleId,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            avatar: "",
            talkTitle: row.talkTitle,
            talkDescription: row.bio,
            bio: row.bio,
            identityDocumentType: row.identityDocumentType,
            identityDocumentNumber: row.identityDocumentNumber,
          })
          createdCount++
        }
      } catch (err: any) {
        console.error(`Error processing row ${i + 2}:`, err)
        errors.push(`Fila ${i + 2} (${row.firstName} ${row.lastName}): ${err.message || err}`)
      }
    }

    // Refresh speakers in local state
    await get().loadFilteredSpeakers(eventId)

    return { createdCount, updatedCount, errors }
  }
}))
