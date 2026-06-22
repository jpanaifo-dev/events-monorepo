import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

export const createSessionlessClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured")
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}
