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
  console.log("Testing organization insert...")
  
  // Try inserting a dummy organization matching columns
  const orgPayload = {
    organization_name: "Test Organization Insert",
    organization_type: "Tech",
    organization_email: `test-${Date.now()}@example.com`,
    slug: `test-org-${Date.now()}`
  }

  const { data, error } = await supabase
    .from('organizations')
    .insert([orgPayload])
    .select()

  console.log("Insert result:", { success: !error, error, data })

  if (!error && data && data.length > 0) {
    // Delete it so we don't pollute the db
    const { error: delError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', data[0].id)
    console.log("Clean up deleted organization:", !delError)
  }
}

test()
