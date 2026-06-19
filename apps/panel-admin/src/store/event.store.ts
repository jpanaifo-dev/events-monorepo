import { create } from "zustand"
import { supabase } from "@/utils/supabase"
import { useAuthStore } from "./auth.store"

export interface Event {
  id: string
  organizationId: string
  title: string
  description: string
  date: string
  location: string
  format: "online" | "hybrid" | "physical"
  status: "draft" | "published" | "finished"
  banner: string
}

export interface Edition {
  id: string
  eventId: string
  name: string
  startDate: string
  endDate: string
  status: "active" | "completed" | "planned"
}

export interface Speaker {
  id: string
  eventId: string
  name: string
  avatar: string
  talkTitle: string
  talkDescription: string
  bio: string
}

export interface AgendaItem {
  id: string
  eventId: string
  timeSlot: string
  title: string
  stage: string
  speakerId: string
}

export interface Attendee {
  id: string
  eventId: string
  fullName: string
  email: string
  ticketType: "General" | "VIP" | "Speaker"
  registrationDate: string
  checkedIn: boolean
}

interface EventState {
  events: Event[]
  editions: Edition[]
  speakers: Speaker[]
  agendaItems: AgendaItem[]
  attendees: Attendee[]
  isLoading: boolean
  
  // Actions
  loadData: (organizationId: string) => Promise<void>
  
  addEvent: (event: Omit<Event, "id">) => Promise<void>
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  
  addEdition: (edition: Omit<Edition, "id">) => Promise<void>
  updateEdition: (id: string, updates: Partial<Edition>) => Promise<void>
  deleteEdition: (id: string) => Promise<void>
  
  addSpeaker: (speaker: Omit<Speaker, "id">) => Promise<void>
  updateSpeaker: (id: string, updates: Partial<Speaker>) => Promise<void>
  deleteSpeaker: (id: string) => Promise<void>
  
  addAgendaItem: (item: Omit<AgendaItem, "id">) => Promise<void>
  updateAgendaItem: (id: string, updates: Partial<AgendaItem>) => Promise<void>
  deleteAgendaItem: (id: string) => Promise<void>
  
  addAttendee: (attendee: Omit<Attendee, "id">) => Promise<void>
  toggleAttendeeCheckIn: (id: string) => Promise<void>
  deleteAttendee: (id: string) => Promise<void>
}

export const useEventStore = create<EventState>((set) => ({
  events: [],
  editions: [],
  speakers: [],
  agendaItems: [],
  attendees: [],
  isLoading: false,

  loadData: async (organizationId: string) => {
    set({ isLoading: true })
    try {
      // 1. Fetch Events
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("organization_id", organizationId)

      if (eventsError) throw eventsError

      // Fetch all banners for these events
      const eventIds = (eventsData || []).map((e) => e.id)
      const imagesMap: Record<string, string> = {}
      
      if (eventIds.length > 0) {
        const { data: imagesData } = await supabase
          .from("event_images")
          .select("event_id, image_url")
          .in("event_id", eventIds)
          .eq("is_main", true)
          
        if (imagesData) {
          imagesData.forEach((img) => {
            imagesMap[img.event_id] = img.image_url
          })
        }
      }

      const formattedEvents: Event[] = (eventsData || []).map((e) => ({
        id: e.id,
        organizationId: e.organization_id || organizationId,
        title: e.event_name,
        description: e.description || "",
        date: e.start_date ? e.start_date.split("T")[0] : "",
        location: e.custom_location || "",
        format: ((e.event_mode || "physical").toLowerCase() as any),
        status: e.status === "PUBLIC" ? "published" : ((e.status || "draft").toLowerCase() as any),
        banner: imagesMap[e.id] || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60"
      }))

      // 2. Fetch Editions
      const { data: mainEventsData } = await supabase
        .from("main_events")
        .select("id")
        .eq("organization_id", organizationId)
        
      const mainEventIds = (mainEventsData || []).map((m) => m.id)
      let formattedEditions: Edition[] = []
      
      if (mainEventIds.length > 0) {
        const { data: editionsData } = await supabase
          .from("editions")
          .select("*")
          .in("main_event_id", mainEventIds)
          
        if (editionsData) {
          formattedEditions = editionsData.map((ed) => ({
            id: ed.id,
            eventId: ed.main_event_id,
            name: typeof ed.name === "string" ? ed.name : (ed.name?.es || ed.name?.en || "Edición"),
            startDate: ed.start_date || "",
            endDate: ed.end_date || "",
            status: ed.is_current ? "active" : "planned"
          }))
        }
      }

      // 3. Fetch Agenda items from event_activities
      let formattedAgenda: AgendaItem[] = []
      if (eventIds.length > 0) {
        const { data: activitiesData } = await supabase
          .from("event_activities")
          .select("*")
          .in("event_id", eventIds)
          
        if (activitiesData) {
          formattedAgenda = activitiesData.map((act) => ({
            id: act.id,
            eventId: act.event_id,
            timeSlot: act.description || `${act.start_time ? act.start_time.split("T")[1].substring(0, 5) : "09:00"} - ${act.end_time ? act.end_time.split("T")[1].substring(0, 5) : "10:00"}`,
            title: act.activity_name,
            stage: act.custom_location || "Escenario Principal",
            speakerId: act.parent_activity_id || ""
          }))
        }
      }

      // 4. Fetch Attendees and Speakers from event_participants
      const editionIds = formattedEditions.map((ed) => ed.id)
      const formattedAttendees: Attendee[] = []
      const formattedSpeakers: Speaker[] = []
      
      if (editionIds.length > 0) {
        const { data: participantsData } = await supabase
          .from("event_participants")
          .select(`
            id,
            main_event_id,
            edition_id,
            check_in_status,
            ticket_reference,
            created_at,
            profile:profile_id (
              id,
              first_name,
              last_name,
              email,
              avatar_url,
              bio
            ),
            role:role_id (
              slug
            )
          `)
          .in("edition_id", editionIds)

        if (participantsData) {
          participantsData.forEach((part: any) => {
            const profile = part.profile || {}
            const roleSlug = part.role?.slug || "attendee"
            const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Participante"
            
            if (roleSlug === "speaker") {
              formattedSpeakers.push({
                id: part.id,
                eventId: part.main_event_id,
                name: fullName,
                avatar: profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
                talkTitle: part.ticket_reference || "Presentación Especial",
                talkDescription: profile.bio || "",
                bio: profile.bio || ""
              })
            } else {
              formattedAttendees.push({
                id: part.id,
                eventId: part.main_event_id,
                fullName,
                email: profile.email || "",
                ticketType: roleSlug === "vip" ? "VIP" : "General",
                registrationDate: part.created_at ? part.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
                checkedIn: !!part.check_in_status
              })
            }
          })
        }
      }

      set({
        events: formattedEvents,
        editions: formattedEditions,
        speakers: formattedSpeakers,
        agendaItems: formattedAgenda,
        attendees: formattedAttendees
      })
    } catch (e) {
      console.error("Error loading events database:", e)
    } finally {
      set({ isLoading: false })
    }
  },

  addEvent: async (eventData) => {
    const user = useAuthStore.getState().user
    if (!user) return

    const id = crypto.randomUUID()
    try {
      // 1. Insert main event first to satisfy foreign key for editions
      await supabase.from("main_events").insert([{
        id,
        organization_id: eventData.organizationId,
        owner_id: user.id,
        slug: id,
        name: eventData.title,
        status: "draft"
      }])

      // 2. Insert into events
      const dbStatus = eventData.status === "published" ? "PUBLIC" : eventData.status.toUpperCase()
      const { error } = await supabase.from("events").insert([{
        id,
        organization_id: eventData.organizationId,
        event_name: eventData.title,
        description: eventData.description,
        start_date: eventData.date ? `${eventData.date}T09:00:00Z` : new Date().toISOString(),
        end_date: eventData.date ? `${eventData.date}T18:00:00Z` : new Date().toISOString(),
        custom_location: eventData.location,
        event_mode: eventData.format.toUpperCase(),
        status: dbStatus
      }])

      if (error) throw error

      // 3. Insert banner in event_images
      if (eventData.banner) {
        await supabase.from("event_images").insert([{
          event_id: id,
          image_url: eventData.banner,
          is_main: true
        }])
      }

      const newEvent: Event = {
        id,
        ...eventData
      }
      set((state) => ({
        events: [...state.events, newEvent]
      }))
    } catch (e) {
      console.error("Error adding event:", e)
    }
  },

  updateEvent: async (id, updates) => {
    try {
      const mappedUpdates: any = {}
      if (updates.title !== undefined) mappedUpdates.event_name = updates.title
      if (updates.description !== undefined) mappedUpdates.description = updates.description
      if (updates.location !== undefined) mappedUpdates.custom_location = updates.location
      if (updates.format !== undefined) mappedUpdates.event_mode = updates.format.toUpperCase()
      if (updates.status !== undefined) {
        mappedUpdates.status = updates.status === "published" ? "PUBLIC" : updates.status.toUpperCase()
      }
      if (updates.date !== undefined) {
        mappedUpdates.start_date = `${updates.date}T09:00:00Z`
        mappedUpdates.end_date = `${updates.date}T18:00:00Z`
      }

      if (Object.keys(mappedUpdates).length > 0) {
        await supabase.from("events").update(mappedUpdates).eq("id", id)
      }

      if (updates.banner !== undefined) {
        await supabase.from("event_images").delete().eq("event_id", id).eq("is_main", true)
        if (updates.banner) {
          await supabase.from("event_images").insert([{
            event_id: id,
            image_url: updates.banner,
            is_main: true
          }])
        }
      }

      set((state) => ({
        events: state.events.map((e) => e.id === id ? { ...e, ...updates } : e)
      }))
    } catch (e) {
      console.error("Error updating event:", e)
    }
  },

  deleteEvent: async (id) => {
    try {
      await supabase.from("event_images").delete().eq("event_id", id)
      await supabase.from("event_activities").delete().eq("event_id", id)
      await supabase.from("editions").delete().eq("main_event_id", id)
      await supabase.from("events").delete().eq("id", id)
      await supabase.from("main_events").delete().eq("id", id)

      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        editions: state.editions.filter((ed) => ed.eventId !== id),
        speakers: state.speakers.filter((s) => s.eventId !== id),
        agendaItems: state.agendaItems.filter((a) => a.eventId !== id),
        attendees: state.attendees.filter((at) => at.eventId !== id)
      }))
    } catch (e) {
      console.error("Error deleting event:", e)
    }
  },

  addEdition: async (editionData) => {
    const id = crypto.randomUUID()
    try {
      const yearVal = editionData.startDate ? parseInt(editionData.startDate.substring(0, 4)) : new Date().getFullYear()
      const { error } = await supabase.from("editions").insert([{
        id,
        main_event_id: editionData.eventId,
        slug: id,
        year: yearVal,
        name: { es: editionData.name },
        start_date: editionData.startDate || null,
        end_date: editionData.endDate || null,
        is_current: editionData.status === "active"
      }])

      if (error) throw error

      const newEdition: Edition = {
        id,
        ...editionData
      }

      set((state) => ({
        editions: [...state.editions, newEdition]
      }))
    } catch (e) {
      console.error("Error adding edition:", e)
    }
  },

  updateEdition: async (id, updates) => {
    try {
      const mappedUpdates: any = {}
      if (updates.name !== undefined) mappedUpdates.name = { es: updates.name }
      if (updates.startDate !== undefined) mappedUpdates.start_date = updates.startDate
      if (updates.endDate !== undefined) mappedUpdates.end_date = updates.endDate
      if (updates.status !== undefined) mappedUpdates.is_current = updates.status === "active"

      await supabase.from("editions").update(mappedUpdates).eq("id", id)

      set((state) => ({
        editions: state.editions.map((ed) => ed.id === id ? { ...ed, ...updates } : ed)
      }))
    } catch (e) {
      console.error("Error updating edition:", e)
    }
  },

  deleteEdition: async (id) => {
    try {
      await supabase.from("event_participants").delete().eq("edition_id", id)
      await supabase.from("editions").delete().eq("id", id)

      set((state) => ({
        editions: state.editions.filter((ed) => ed.id !== id)
      }))
    } catch (e) {
      console.error("Error deleting edition:", e)
    }
  },

  addSpeaker: async (speakerData) => {
    try {
      const state = useEventStore.getState()
      let edition = state.editions.find((ed) => ed.eventId === speakerData.eventId)
      
      if (!edition) {
        const editionId = crypto.randomUUID()
        const defaultEdition = {
          id: editionId,
          main_event_id: speakerData.eventId,
          slug: editionId,
          year: new Date().getFullYear(),
          name: { es: "Edición Principal" },
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date().toISOString().split("T")[0],
          is_current: true
        }
        await supabase.from("editions").insert([defaultEdition])
        
        const newEd: Edition = {
          id: editionId,
          eventId: speakerData.eventId,
          name: "Edición Principal",
          startDate: defaultEdition.start_date,
          endDate: defaultEdition.end_date,
          status: "active"
        }
        
        set((state) => ({
          editions: [...state.editions, newEd]
        }))
        edition = newEd
      }

      const profileId = crypto.randomUUID()
      const participantId = crypto.randomUUID()
      const nameParts = speakerData.name.trim().split(" ")
      const firstName = nameParts[0] || "Ponente"
      const lastName = nameParts.slice(1).join(" ") || ""

      // 1. Create Profile
      await supabase.from("profiles").insert([{
        id: profileId,
        first_name: firstName,
        last_name: lastName,
        avatar_url: speakerData.avatar,
        bio: speakerData.bio
      }])

      // 2. Fetch/Insert Speaker Role
      const { data: roleData } = await supabase
        .from("participant_roles")
        .select("id")
        .eq("slug", "speaker")
        .maybeSingle()
        
      let roleId = roleData?.id
      if (!roleId) {
        roleId = crypto.randomUUID()
        await supabase.from("participant_roles").insert([{
          id: roleId,
          slug: "speaker",
          name: { es: "Ponente" }
        }])
      }

      // 3. Insert Participant
      await supabase.from("event_participants").insert([{
        id: participantId,
        main_event_id: speakerData.eventId,
        edition_id: edition.id,
        profile_id: profileId,
        role_id: roleId,
        ticket_reference: speakerData.talkTitle
      }])

      const newSpeaker: Speaker = {
        id: participantId,
        ...speakerData
      }

      set((state) => ({
        speakers: [...state.speakers, newSpeaker]
      }))
    } catch (e) {
      console.error("Error adding speaker:", e)
    }
  },

  updateSpeaker: async (id, updates) => {
    try {
      const { data: partData } = await supabase
        .from("event_participants")
        .select("profile_id")
        .eq("id", id)
        .maybeSingle()

      if (partData?.profile_id) {
        const profileUpdates: any = {}
        if (updates.name !== undefined) {
          const nameParts = updates.name.trim().split(" ")
          profileUpdates.first_name = nameParts[0] || ""
          profileUpdates.last_name = nameParts.slice(1).join(" ") || ""
        }
        if (updates.avatar !== undefined) profileUpdates.avatar_url = updates.avatar
        if (updates.bio !== undefined) profileUpdates.bio = updates.bio

        if (Object.keys(profileUpdates).length > 0) {
          await supabase.from("profiles").update(profileUpdates).eq("id", partData.profile_id)
        }
      }

      if (updates.talkTitle !== undefined) {
        await supabase.from("event_participants").update({
          ticket_reference: updates.talkTitle
        }).eq("id", id)
      }

      set((state) => ({
        speakers: state.speakers.map((s) => s.id === id ? { ...s, ...updates } : s)
      }))
    } catch (e) {
      console.error("Error updating speaker:", e)
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
        activity_name: itemData.title,
        description: itemData.timeSlot,
        custom_location: itemData.stage,
        parent_activity_id: itemData.speakerId || null,
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString()
      }])

      if (error) throw error

      const newItem: AgendaItem = {
        id,
        ...itemData
      }

      set((state) => ({
        agendaItems: [...state.agendaItems, newItem]
      }))
    } catch (e) {
      console.error("Error adding agenda activity:", e)
    }
  },

  updateAgendaItem: async (id, updates) => {
    try {
      const mappedUpdates: any = {}
      if (updates.title !== undefined) mappedUpdates.activity_name = updates.title
      if (updates.timeSlot !== undefined) mappedUpdates.description = updates.timeSlot
      if (updates.stage !== undefined) mappedUpdates.custom_location = updates.stage
      if (updates.speakerId !== undefined) mappedUpdates.parent_activity_id = updates.speakerId || null

      await supabase.from("event_activities").update(mappedUpdates).eq("id", id)

      set((state) => ({
        agendaItems: state.agendaItems.map((a) => a.id === id ? { ...a, ...updates } : a)
      }))
    } catch (e) {
      console.error("Error updating agenda item:", e)
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
      const state = useEventStore.getState()
      let edition = state.editions.find((ed) => ed.eventId === attendeeData.eventId)
      
      if (!edition) {
        const editionId = crypto.randomUUID()
        const defaultEdition = {
          id: editionId,
          main_event_id: attendeeData.eventId,
          slug: editionId,
          year: new Date().getFullYear(),
          name: { es: "Edición Principal" },
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date().toISOString().split("T")[0],
          is_current: true
        }
        await supabase.from("editions").insert([defaultEdition])
        
        const newEd: Edition = {
          id: editionId,
          eventId: attendeeData.eventId,
          name: "Edición Principal",
          startDate: defaultEdition.start_date,
          endDate: defaultEdition.end_date,
          status: "active"
        }
        
        set((state) => ({
          editions: [...state.editions, newEd]
        }))
        edition = newEd
      }

      const profileId = crypto.randomUUID()
      const participantId = crypto.randomUUID()
      const nameParts = attendeeData.fullName.trim().split(" ")
      const firstName = nameParts[0] || "Asistente"
      const lastName = nameParts.slice(1).join(" ") || ""

      // 1. Create Profile
      await supabase.from("profiles").insert([{
        id: profileId,
        first_name: firstName,
        last_name: lastName,
        email: attendeeData.email
      }])

      // 2. Fetch/Insert Ticket Role
      const ticketRole = attendeeData.ticketType.toLowerCase()
      const { data: roleData } = await supabase
        .from("participant_roles")
        .select("id")
        .eq("slug", ticketRole)
        .maybeSingle()
        
      let roleId = roleData?.id
      if (!roleId) {
        roleId = crypto.randomUUID()
        await supabase.from("participant_roles").insert([{
          id: roleId,
          slug: ticketRole,
          name: { es: attendeeData.ticketType }
        }])
      }

      // 3. Insert Participant
      await supabase.from("event_participants").insert([{
        id: participantId,
        main_event_id: attendeeData.eventId,
        edition_id: edition.id,
        profile_id: profileId,
        role_id: roleId,
        check_in_status: attendeeData.checkedIn
      }])

      const newAttendee: Attendee = {
        id: participantId,
        ...attendeeData
      }

      set((state) => ({
        attendees: [...state.attendees, newAttendee]
      }))
    } catch (e) {
      console.error("Error adding attendee:", e)
    }
  },

  toggleAttendeeCheckIn: async (id) => {
    try {
      const attendee = useEventStore.getState().attendees.find((a) => a.id === id)
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
  }
}))
