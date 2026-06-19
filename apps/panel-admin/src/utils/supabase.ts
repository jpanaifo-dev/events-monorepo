import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: Supabase environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not loaded! Please check your .env file and restart your Vite dev server.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);