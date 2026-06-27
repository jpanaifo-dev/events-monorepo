import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/utils/supabase"
import type { Speaker, ParticipantRole } from "@/store/event.store"

export interface FetchSpeakersParams {
  search?: string
  editionId?: string
  page?: number
  pageSize?: number
  sort?: string // "name_asc" | "name_desc" | ""
}

export interface FetchSpeakersResult {
  speakers: Speaker[]
  totalCount: number
  roles: ParticipantRole[]
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

export async function fetchEventSpeakers(
  eventId: string,
  params: FetchSpeakersParams
): Promise<FetchSpeakersResult> {
  // 1. Fetch roles
  const { data: rolesData, error: rolesError } = await supabase
    .from("participant_roles")
    .select("*")
    .eq("main_event_id", eventId)

  if (rolesError) throw rolesError

  const formattedRoles = (rolesData || []).map(mapParticipantRole)
  const speakerRoleIds = formattedRoles
    .filter((r) => r.slug === "speaker" || r.slug === "keynote-speaker")
    .map((r) => r.id)

  if (speakerRoleIds.length === 0) {
    return { speakers: [], totalCount: 0, roles: formattedRoles }
  }

  // 2. Search profile IDs if search term is provided
  let profileIds: string[] | null = null
  if (params.search && params.search.trim()) {
    const searchVal = `%${params.search.trim()}%`
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .or(`first_name.ilike.${searchVal},last_name.ilike.${searchVal},email.ilike.${searchVal}`)

    if (profileError) throw profileError
    profileIds = (profiles || []).map((p) => p.id)
    if (profileIds.length === 0) {
      return { speakers: [], totalCount: 0, roles: formattedRoles }
    }
  }

  // 3. Count query
  let countQuery = supabase
    .from("event_participants")
    .select("id", { count: "exact", head: true })
    .eq("main_event_id", eventId)
    .in("role_id", speakerRoleIds)

  if (params.editionId && params.editionId !== "all") {
    countQuery = countQuery.eq("edition_id", params.editionId)
  }
  if (profileIds !== null) {
    countQuery = countQuery.in("profile_id", profileIds)
  }

  const { count, error: countError } = await countQuery
  if (countError) throw countError
  const totalCount = count || 0

  // 4. Fetch actual speakers for the page range
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
        id, first_name, last_name, email, avatar_url, bio, identity_document_type, identity_document_number, institution
      )
    `)
    .eq("main_event_id", eventId)
    .in("role_id", speakerRoleIds)

  if (params.editionId && params.editionId !== "all") {
    query = query.eq("edition_id", params.editionId)
  }
  if (profileIds !== null) {
    query = query.in("profile_id", profileIds)
  }

  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)
  query = query.order("created_at", { ascending: false })

  const { data: participantsData, error: participantsError } = await query
  if (participantsError) throw participantsError

  const speakers: Speaker[] = []
  if (participantsData) {
    participantsData.forEach((part: any) => {
      const profile = part.profile || {}
      const matchedRole = formattedRoles.find((r) => r.id === part.role_id)
      const roleSlug = matchedRole?.slug || "attendee"
      const roleId = part.role_id || ""
      const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Participante"

      speakers.push({
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
        institution: profile.institution || "",
      })
    })
  }

  // Client-side sort by name if requested
  if (params.sort === "name_asc") {
    speakers.sort((a, b) => a.name.localeCompare(b.name))
  } else if (params.sort === "name_desc") {
    speakers.sort((a, b) => b.name.localeCompare(a.name))
  }

  return { speakers, totalCount, roles: formattedRoles }
}

export function useSpeakers(eventId: string, params: FetchSpeakersParams) {
  return useQuery({
    queryKey: ["speakers", eventId, params],
    queryFn: () => fetchEventSpeakers(eventId, params),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60, // 1 minute stale time
  })
}
