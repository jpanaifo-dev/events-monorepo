// Database TypeScript Type Definitions matching Supabase schema

export type EventStatus = "DRAFT" | "PUBLISHED" | "FINISHED" | string
export type EventMode = "PHYSICAL" | "ONLINE" | "HYBRID" | string
export type PlaceDifficultyLevel = "easy" | "moderate" | "hard" | "extreme"
export type SubscriptionPlanType = "free" | "basic" | "premium" | "enterprise"
export type MainEventStatus = "draft" | "published" | "archived"
export type AttendanceMode = "in_person" | "virtual" | "hybrid"
export type CallApplicationStatus = "draft" | "submitted" | "under_review" | "accepted" | "rejected"
export type SubmissionStatus = "draft" | "submitted" | "in_review" | "approved" | "rejected"
export type ReviewerStatus = "pending" | "accepted_to_review" | "declined" | "completed"
export type ReviewerRecommendation = "approve" | "approve_with_changes" | "reject"

export interface Interest {
  id: string
  user_id: string | null
  interests: string[]
  event_types: string[]
  created_at: string | null
  updated_at: string | null
}

export interface NotificationSettings {
  id: string
  user_id: string | null
  email_notifications: boolean | null
  push_notifications: boolean | null
  event_reminders: boolean | null
  weekly_digest: boolean | null
  profile_visibility: string | null
  show_location: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface AdminNotification {
  id: string
  notification_type: string
  content: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
}

export interface DatabaseEvent {
  id: string
  event_name: string
  description: string | null
  start_date: string
  end_date: string | null
  created_at: string | null
  updated_at: string | null
  organization_id: string | null
  user_id: string | null
  status: EventStatus | null
  category: number | null
  author_id: string | null
  address_id: string | null
  time: string | null
  duration: number | null
  is_recurring: boolean
  recurrence_pattern: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null
  recurrence_interval: number | null
  recurrence_end_date: string | null
  meeting_url: string | null
  custom_location: string | null
  event_mode: EventMode | null
  full_description: string | null
}

export interface EventDetails {
  id: number
  created_at: string
  social_links: Record<string, any> | null
  media: Record<string, any> | null
  sponsors: Record<string, any> | null
  faqs: Record<string, any> | null
  content: string | null
  event_id: string
}

export interface Address {
  id: string
  created_at: string
  street: string | null
  district: string | null
  province: string | null
  department: string | null
  postal_code: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  place_name: string | null
  reference: string | null
  access_code: string | null
}

export interface Place {
  id: string
  created_at: string
  updated_at: string | null
  name: string
  description: string | null
  short_description: string | null
  type: string
  cover_image_url: string | null
  gallery_urls: string[] | Record<string, any> | null
  video_url: string | null
  website_url: string | null
  contact_phone: string | null
  contact_email: string | null
  social_links: Record<string, any> | null
  opening_hours: Record<string, any> | null
  admission_fees: Record<string, any> | null
  features: Record<string, any> | null
  tags: string[] | null
  average_rating: number | null
  review_count: number | null
  popularity_score: number | null
  status: string | null
  verified: boolean | null
  address_id: string | null
  organization_id: string | null
  author_id: string | null
  is_featured: boolean | null
  is_recommended: boolean | null
  is_tourist_attraction: boolean | null
  difficulty_level: PlaceDifficultyLevel | null
  transport_details: Record<string, any> | any[] | null
  google_maps_link: string | null
  waze_link: string | null
  visit_tips: string[] | null
  best_visit_time: string | null
  cost_level: number | null
  slug: string | null
}

export interface EventActivity {
  id: string
  event_id: string
  parent_activity_id: string | null
  activity_name: string
  description: string | null
  start_time: string
  end_time: string
  duration: number | null
  meeting_url: string | null
  custom_location: string | null
  activity_mode: string | null
  status: EventStatus | null
  order_index: number | null
  created_at: string | null
  updated_at: string | null
  start_date: string | null
  end_date: string | null
}

export interface EventTicket {
  id: string
  event_id: string
  name: string
  description: string | null
  price: number
  currency: string
  quantity_total: number
  quantity_sold: number
  max_per_user: number | null
  sales_start_at: string | null
  sales_end_at: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface EventMap {
  id: string
  event_id: string
  background_image_url: string | null
  width: number
  height: number
  created_at: string | null
  name: string
  config: Record<string, any> | null
}

export interface EventMapZone {
  id: string
  map_id: string
  ticket_id: string | null
  element_type: string
  label: string | null
  geometry_data: Record<string, any>
  created_at: string | null
}

export interface UserFavorite {
  id: string
  user_id: string
  created_at: string | null
  event_id: string | null
  place_id: string | null
  organization_id: string | null
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_type: SubscriptionPlanType
  max_events: number
  events_created_count: number
  events_limit_per_month: number | null
  start_date: string
  end_date: string | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

export interface EventImage {
  id: string
  event_id: string
  image_url: string
  is_main: boolean | null
  created_at: string | null
}

export interface GlobalSettings {
  id: number
  app_name: string
  social_networks: {
    youtube?: string
    facebook?: string
    linkedin?: string
    instagram?: string
    [key: string]: any
  } | null
  format_summary_url: string | null
  updated_at: string | null
}

export interface Category {
  id: number
  name: string
  description: string | null
  icon: string | null
  created_at: string
}

export interface InterestCategory {
  id: string
  name: string
  name_es: string | null
  description: string | null
  description_es: string | null
  created_at: string
}

export interface ParticipantRole {
  id: string
  slug: string
  name: Record<string, string>
  badge_color: string | null
  is_active: boolean | null
  created_at: string | null
}

export interface Sponsor {
  id: number
  name: string | null
  image: string | null
  is_active: boolean
  created_at: string
}

export interface Module {
  id: string
  code: string
  name: string
  description: string | null
  url_prod: string
  url_local: string | null
  path: string
  icon_name: string
  color_class: string
  is_active: boolean
  created_at: string | null
}

export interface Permission {
  id: string
  module_id: string
  action: string
  created_at: string | null
}

export interface Role {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface RolePermission {
  role_id: string
  permission_id: string
  assigned_at: string | null
}

export interface DatabaseOrganization {
  id: string
  organization_name: string
  organization_type: string
  organization_email: string
  description: string | null
  contact_phone: string | null
  address: string | null
  document_number: string | null
  brand: string | null
  logo_url: string | null
  cover_image_url: string | null
  primary_color: string | null
  social_media: Record<string, any> | null
  status: string | null
  validation_status: string | null
  slug: string | null
  followers_count: number | null
  created_at: string | null
  updated_at: string | null
}

export interface RegistrationRequest {
  id: string
  organization_uuid: string | null
  organization_name: string
  organization_type: string
  contact_email: string
  contact_phone: string | null
  contact_person: string | null
  documents: Record<string, any> | null
  request_status: string | null
  created_at: string | null
  updated_at: string | null
}

export interface DatabaseProfile {
  id: string
  auth_id: string | null
  first_name: string
  last_name: string
  email: string | null
  identity_document_type: string | null
  identity_document_number: string | null
  phone: string | null
  birth_date: string | null
  sex: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  institution: string | null
  dedication: string | null
  research_interests: string | null
  areas_of_interest: string[] | null
  expertise_areas: string[] | null
  social_links: Record<string, any> | any[] | null
  additional_emails: Record<string, any> | any[] | null
  is_public: boolean | null
  onboarding_completed: boolean | null
  account_type: string | null
  global_role: string | null
  created_at: string
  updated_at: string
}

export interface AuthTicket {
  id: string
  profile_id: string
  metadata: Record<string, any> | null
  expires_at: string
  created_at: string | null
  used_at: string | null
}

export interface UserRoleRelation {
  id: string
  profile_id: string
  role_id: string
  module_id: string | null
  assigned_at: string
  assigned_by: string | null
}

export interface Education {
  id: string
  user_id: string
  institution: string
  title: string
  field_of_study: string | null
  degree: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
  city: string | null
  country: string | null
  status: string
  visibility: string
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface EmploymentHistory {
  id: string
  user_id: string
  organization: string
  role: string
  start_date: string
  end_date: string | null
  is_current: boolean
  city: string | null
  country: string | null
  visibility: string
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface Certification {
  id: string
  user_id: string
  name: string
  issuing_organization: string
  issue_date: string
  expiration_date: string | null
  credential_id: string | null
  credential_url: string | null
  is_favorite: boolean
  created_at: string
}

export interface OrganizationFollower {
  id: string
  user_id: string
  organization_id: string
  created_at: string | null
}

export interface Page {
  id: string
  slug: string
  name: Record<string, string>
  is_active: boolean | null
  order_index: number | null
}

export interface DynamicSection {
  id: string
  page_slug: string | null
  component_type: string
  order_index: number | null
  content: Record<string, any>
  is_active: boolean | null
  created_at: string | null
}

export interface FacilityType {
  id: string
  slug: string
  name: string
  description: string | null
  created_at: string | null
}

export interface Facility {
  id: string
  type_id: string
  slug: string
  name: string
  description: string | null
  address: string | null
  schedule_info: string | null
  contact_email: string | null
  metadata: Record<string, any> | null
  is_active: boolean | null
  gallery_images: string[] | Record<string, any> | null
  created_at: string | null
}

export interface MainEvent {
  id: string
  organization_id: string
  owner_id: string
  slug: string
  name: string
  short_description: string | null
  about: Record<string, any> | null
  logo_url: string | null
  cover_url: string | null
  brand_colors: {
    primary?: string
    secondary?: string
    [key: string]: any
  } | null
  status: MainEventStatus | null
  is_active: boolean | null
  website_url: string | null
  contact_email: string | null
  social_links: {
    twitter?: string
    facebook?: string
    linkedin?: string
    instagram?: string
    [key: string]: any
  } | null
  settings: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface Edition {
  id: string
  main_event_id: string
  slug: string
  year: number
  name: Record<string, string>
  description: Record<string, any> | null
  cover_url: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface ThematicLine {
  id: string
  main_event_id: string
  edition_id: string | null
  name: string
  description: string | null
  icon_url: string | null
  color_hex: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface EventCall {
  id: string
  main_event_id: string
  edition_id: string
  role_id: string
  title: string
  description: string | null
  content: Record<string, any> | null
  start_date: string
  end_date: string
  max_capacity: number | null
  form_schema: Record<string, any> | any[] | null
  auto_approve: boolean | null
  is_active: boolean | null
  created_at: string | null
}

export interface EventParticipant {
  id: string
  main_event_id: string
  edition_id: string
  profile_id: string
  role_id: string
  check_in_status: boolean | null
  requires_certificate: boolean | null
  ticket_reference: string | null
  attendance_mode: AttendanceMode | null
  created_at: string | null
}

export interface CallApplication {
  id: string
  call_id: string
  profile_id: string
  resulting_participant_id: string | null
  status: CallApplicationStatus | null
  submitted_data: Record<string, any> | null
  submitted_at: string | null
  reviewed_by: string | null
  reviewer_notes: string | null
  created_at: string | null
  updated_at: string | null
}

export interface EventSubmission {
  id: string
  profile_id: string
  edition_id: string
  call_id: string | null
  thematic_line_id: string
  title: string
  status: SubmissionStatus | null
  metadata: Record<string, any> | null
  is_admin_upload: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface SubmissionFile {
  id: string
  submission_id: string
  file_name: string
  file_url: string
  document_type: string | null
  mime_type: string | null
  size_bytes: number | null
  created_at: string | null
}

export interface SubmissionReviewer {
  id: string
  submission_id: string
  reviewer_profile_id: string
  assigned_at: string | null
  status: ReviewerStatus | null
  score: number | null
  recommendation: ReviewerRecommendation | null
  private_notes: string | null
  public_notes: string | null
}

export interface EventSession {
  id: string
  edition_id: string
  submission_id: string | null
  facility_id: string | null
  title: string
  short_description: string | null
  custom_content: string | null
  session_date: string | null
  start_time: string | null
  end_time: string | null
  session_type: string | null
  is_online: boolean | null
  stream_platform: string | null
  stream_url: string | null
  banner_url: string | null
  is_active: boolean
  created_at: string
}

export interface SessionSpeaker {
  session_id: string
  participant_id: string
  is_main_speaker: boolean | null
  order_index: number | null
  created_at: string | null
}
