import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim()
  }
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Probing for mapping tables...")
  const tables = [
    'members', 'organization_followers', 'organization_admins', 'organization_owners',
    'organization_profiles', 'profile_organizations', 'user_organizations', 
    'user_organization_roles', 'organization_user_roles', 'organization_users', 
    'organization_members', 'organization_user_relations', 'user_roles',
    'user_global_roles'
  ]

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (!error) {
      console.log(`- TABLE '${table}' exists! Details:`, data)
    }
  }
}

test()
