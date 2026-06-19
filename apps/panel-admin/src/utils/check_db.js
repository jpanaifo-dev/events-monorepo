import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Parse .env manually
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
  console.log("Checking tables...")
  
  // Test organizations
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('*')
    .limit(1)
  console.log("organizations connection:", { success: !orgsError, error: orgsError, data: orgs })

  // Let's check if there's an organization_members, organization_users or organization_user_roles table
  const testTables = ['organization_members', 'organization_users', 'organization_user_roles', 'organization_user', 'business_user_roles', 'businesses']
  for (const table of testTables) {
    const { error } = await supabase.from(table).select('*').limit(1)
    console.log(`Table '${table}' exists:`, !error)
  }
}

test()
