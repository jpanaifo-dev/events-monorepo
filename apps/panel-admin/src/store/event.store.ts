import { create } from "zustand"

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
  
  // Actions
  loadData: (organizationId: string) => void
  
  addEvent: (event: Omit<Event, "id">) => void
  updateEvent: (id: string, updates: Partial<Event>) => void
  deleteEvent: (id: string) => void
  
  addEdition: (edition: Omit<Edition, "id">) => void
  updateEdition: (id: string, updates: Partial<Edition>) => void
  deleteEdition: (id: string) => void
  
  addSpeaker: (speaker: Omit<Speaker, "id">) => void
  updateSpeaker: (id: string, updates: Partial<Speaker>) => void
  deleteSpeaker: (id: string) => void
  
  addAgendaItem: (item: Omit<AgendaItem, "id">) => void
  updateAgendaItem: (id: string, updates: Partial<AgendaItem>) => void
  deleteAgendaItem: (id: string) => void
  
  addAttendee: (attendee: Omit<Attendee, "id">) => void
  toggleAttendeeCheckIn: (id: string) => void
  deleteAttendee: (id: string) => void
}

// Helpers to load/save from localStorage
const STORAGE_KEY = "eventhive_local_db"

interface StorageSchema {
  events: Event[]
  editions: Edition[]
  speakers: Speaker[]
  agendaItems: AgendaItem[]
  attendees: Attendee[]
}

function getStoredData(): StorageSchema {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    // Return sample events, editions, speakers, schedule, attendees for quick display
    return {
      events: [],
      editions: [],
      speakers: [],
      agendaItems: [],
      attendees: []
    }
  }
  try {
    return JSON.parse(stored)
  } catch (e) {
    return { events: [], editions: [], speakers: [], agendaItems: [], attendees: [] }
  }
}

function saveStoredData(data: StorageSchema) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const useEventStore = create<EventState>((set) => ({
  events: [],
  editions: [],
  speakers: [],
  agendaItems: [],
  attendees: [],

  loadData: (organizationId: string) => {
    const data = getStoredData()
    
    // If empty for this org, pre-fill mock data for demonstrating the robust setup immediately
    const orgEvents = data.events.filter(e => e.organizationId === organizationId)
    if (orgEvents.length === 0) {
      const mockEventId = crypto.randomUUID()
      const mockSpeakerId1 = crypto.randomUUID()
      const mockSpeakerId2 = crypto.randomUUID()
      
      const newMockEvents: Event[] = [
        {
          id: mockEventId,
          organizationId,
          title: "Tech Summit 2026",
          description: "La conferencia tecnológica más grande del año con ponencias de vanguardia sobre IA, Web3 y DevOps.",
          date: "2026-10-15",
          location: "Centro de Convenciones Metropolitano / Online",
          format: "hybrid",
          status: "published",
          banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60"
        }
      ]
      
      const newMockEditions: Edition[] = [
        {
          id: crypto.randomUUID(),
          eventId: mockEventId,
          name: "Edición Anual 2026",
          startDate: "2026-10-15",
          endDate: "2026-10-17",
          status: "active"
        },
        {
          id: crypto.randomUUID(),
          eventId: mockEventId,
          name: "Edición Anterior 2025",
          startDate: "2025-10-10",
          endDate: "2025-10-12",
          status: "completed"
        }
      ]
      
      const newMockSpeakers: Speaker[] = [
        {
          id: mockSpeakerId1,
          eventId: mockEventId,
          name: "Dr. Alex Rivera",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
          talkTitle: "El Futuro de la IA Generativa en Enterprise",
          talkDescription: "Cómo escalar modelos LLM localmente y mitigar riesgos de seguridad.",
          bio: "Científico de datos e Investigador principal con más de 12 años de trayectoria."
        },
        {
          id: mockSpeakerId2,
          eventId: mockEventId,
          name: "Diana Prince",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana",
          talkTitle: "Arquitectura Microfrontends con Tailwind CSS v4",
          talkDescription: "Patrones prácticos para estructurar componentes modulares rápidos.",
          bio: "Arquitecta de Software Senior y Colaboradora Open Source."
        }
      ]
      
      const newMockAgenda: AgendaItem[] = [
        {
          id: crypto.randomUUID(),
          eventId: mockEventId,
          timeSlot: "09:00 AM - 10:00 AM",
          title: "Ceremonia de Apertura e Keynote Principal",
          stage: "Main Stage",
          speakerId: mockSpeakerId1
        },
        {
          id: crypto.randomUUID(),
          eventId: mockEventId,
          timeSlot: "10:30 AM - 11:30 AM",
          title: "Microfrontends Modernos",
          stage: "Room A",
          speakerId: mockSpeakerId2
        }
      ]
      
      const newMockAttendees: Attendee[] = [
        {
          id: crypto.randomUUID(),
          eventId: mockEventId,
          fullName: "Jefferson Santos",
          email: "jefferson@example.com",
          ticketType: "VIP",
          registrationDate: "2026-06-10",
          checkedIn: true
        },
        {
          id: crypto.randomUUID(),
          eventId: mockEventId,
          fullName: "Maria Lopez",
          email: "maria@example.com",
          ticketType: "General",
          registrationDate: "2026-06-12",
          checkedIn: false
        }
      ]
      
      data.events.push(...newMockEvents)
      data.editions.push(...newMockEditions)
      data.speakers.push(...newMockSpeakers)
      data.agendaItems.push(...newMockAgenda)
      data.attendees.push(...newMockAttendees)
      saveStoredData(data)
    }
    
    set({
      events: data.events.filter(e => e.organizationId === organizationId),
      editions: data.editions.filter(ed => data.events.some(e => e.id === ed.eventId && e.organizationId === organizationId)),
      speakers: data.speakers.filter(s => data.events.some(e => e.id === s.eventId && e.organizationId === organizationId)),
      agendaItems: data.agendaItems.filter(a => data.events.some(e => e.id === a.eventId && e.organizationId === organizationId)),
      attendees: data.attendees.filter(at => data.events.some(e => e.id === at.eventId && e.organizationId === organizationId))
    })
  },

  addEvent: (eventData) => {
    const id = crypto.randomUUID()
    const newEvent: Event = { ...eventData, id }
    const allData = getStoredData()
    allData.events.push(newEvent)
    saveStoredData(allData)
    
    set((state) => ({
      events: [...state.events, newEvent]
    }))
  },

  updateEvent: (id, updates) => {
    const allData = getStoredData()
    allData.events = allData.events.map(e => e.id === id ? { ...e, ...updates } : e)
    saveStoredData(allData)

    set((state) => ({
      events: state.events.map(e => e.id === id ? { ...e, ...updates } : e)
    }))
  },

  deleteEvent: (id) => {
    const allData = getStoredData()
    allData.events = allData.events.filter(e => e.id !== id)
    allData.editions = allData.editions.filter(ed => ed.eventId !== id)
    allData.speakers = allData.speakers.filter(s => s.eventId !== id)
    allData.agendaItems = allData.agendaItems.filter(a => a.eventId !== id)
    allData.attendees = allData.attendees.filter(at => at.eventId !== id)
    saveStoredData(allData)

    set((state) => ({
      events: state.events.filter(e => e.id !== id),
      editions: state.editions.filter(ed => ed.eventId !== id),
      speakers: state.speakers.filter(s => s.eventId !== id),
      agendaItems: state.agendaItems.filter(a => a.eventId !== id),
      attendees: state.attendees.filter(at => at.eventId !== id)
    }))
  },

  addEdition: (editionData) => {
    const id = crypto.randomUUID()
    const newEdition: Edition = { ...editionData, id }
    const allData = getStoredData()
    allData.editions.push(newEdition)
    saveStoredData(allData)

    set((state) => ({
      editions: [...state.editions, newEdition]
    }))
  },

  updateEdition: (id, updates) => {
    const allData = getStoredData()
    allData.editions = allData.editions.map(ed => ed.id === id ? { ...ed, ...updates } : ed)
    saveStoredData(allData)

    set((state) => ({
      editions: state.editions.map(ed => ed.id === id ? { ...ed, ...updates } : ed)
    }))
  },

  deleteEdition: (id) => {
    const allData = getStoredData()
    allData.editions = allData.editions.filter(ed => ed.id !== id)
    saveStoredData(allData)

    set((state) => ({
      editions: state.editions.filter(ed => ed.id !== id)
    }))
  },

  addSpeaker: (speakerData) => {
    const id = crypto.randomUUID()
    const newSpeaker: Speaker = { ...speakerData, id }
    const allData = getStoredData()
    allData.speakers.push(newSpeaker)
    saveStoredData(allData)

    set((state) => ({
      speakers: [...state.speakers, newSpeaker]
    }))
  },

  updateSpeaker: (id, updates) => {
    const allData = getStoredData()
    allData.speakers = allData.speakers.map(s => s.id === id ? { ...s, ...updates } : s)
    saveStoredData(allData)

    set((state) => ({
      speakers: state.speakers.map(s => s.id === id ? { ...s, ...updates } : s)
    }))
  },

  deleteSpeaker: (id) => {
    const allData = getStoredData()
    allData.speakers = allData.speakers.filter(s => s.id !== id)
    allData.agendaItems = allData.agendaItems.map(a => a.speakerId === id ? { ...a, speakerId: "" } : a)
    saveStoredData(allData)

    set((state) => ({
      speakers: state.speakers.filter(s => s.id !== id),
      agendaItems: state.agendaItems.map(a => a.speakerId === id ? { ...a, speakerId: "" } : a)
    }))
  },

  addAgendaItem: (itemData) => {
    const id = crypto.randomUUID()
    const newItem: AgendaItem = { ...itemData, id }
    const allData = getStoredData()
    allData.agendaItems.push(newItem)
    saveStoredData(allData)

    set((state) => ({
      agendaItems: [...state.agendaItems, newItem]
    }))
  },

  updateAgendaItem: (id, updates) => {
    const allData = getStoredData()
    allData.agendaItems = allData.agendaItems.map(a => a.id === id ? { ...a, ...updates } : a)
    saveStoredData(allData)

    set((state) => ({
      agendaItems: state.agendaItems.map(a => a.id === id ? { ...a, ...updates } : a)
    }))
  },

  deleteAgendaItem: (id) => {
    const allData = getStoredData()
    allData.agendaItems = allData.agendaItems.filter(a => a.id !== id)
    saveStoredData(allData)

    set((state) => ({
      agendaItems: state.agendaItems.filter(a => a.id !== id)
    }))
  },

  addAttendee: (attendeeData) => {
    const id = crypto.randomUUID()
    const newAttendee: Attendee = { ...attendeeData, id }
    const allData = getStoredData()
    allData.attendees.push(newAttendee)
    saveStoredData(allData)

    set((state) => ({
      attendees: [...state.attendees, newAttendee]
    }))
  },

  toggleAttendeeCheckIn: (id) => {
    const allData = getStoredData()
    allData.attendees = allData.attendees.map(at => at.id === id ? { ...at, checkedIn: !at.checkedIn } : at)
    saveStoredData(allData)

    set((state) => ({
      attendees: state.attendees.map(at => at.id === id ? { ...at, checkedIn: !at.checkedIn } : at)
    }))
  },

  deleteAttendee: (id) => {
    const allData = getStoredData()
    allData.attendees = allData.attendees.filter(at => at.id !== id)
    saveStoredData(allData)

    set((state) => ({
      attendees: state.attendees.filter(at => at.id !== id)
    }))
  }
}))
