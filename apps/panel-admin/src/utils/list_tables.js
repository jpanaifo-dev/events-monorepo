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
  console.log("Inspecting schema tables...")
  
  // Since we cannot run custom SQL easily unless there is an RPC, we can query some known tables
  // or query schemas if we have access. Let's see if we can query pg_catalog or use another table.
  // Wait! In PostgreSQL/Supabase, we can check table existence by attempting to select from them.
  // Let's test a list of potential linkage tables:
  const tables = [
    'organization_user_roles', 'organization_users', 'organization_members', 
    'user_organizations', 'profile_organizations', 'organization_profiles',
    'organization_user_relations', 'user_roles', 'user_global_roles'
  ]
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (!error) {
      console.log(`- TABLE '${table}' exists! Columns:`, data.length > 0 ? Object.keys(data[0]) : "unknown")
    }
  }

  // Let's inspect the first organization's columns if any exist
  const { data: orgs, error: orgsError } = await supabase.from('organizations').select('*').limit(1)
  if (!orgsError) {
    console.log("organizations table columns:", orgs.length > 0 ? Object.keys(orgs[0]) : "No rows in table")
  }
}

test()
