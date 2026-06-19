import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.resolve(__dirname, '../.env')
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

async function run() {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, organization_name, organization_email')
    .limit(5)

  if (error) {
    console.error("Error querying organizations:", error)
    return
  }

  console.log("Organizations query results:")
  data.forEach(org => {
    console.log(`ID: ${org.id}`)
    console.log(`Name: ${org.organization_name}`)
    console.log(`Email value:`, org.organization_email)
    console.log(`Email typeof:`, typeof org.organization_email)
    console.log(`Email Array.isArray:`, Array.isArray(org.organization_email))
    console.log("---")
  })
}

run()
