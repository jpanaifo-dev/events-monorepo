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
    .select('*')
    .limit(1)

  if (error) {
    console.error("Error querying organizations:", error)
    return
  }

  if (data && data[0]) {
    const org = data[0]
    console.log("Organization record keys:", Object.keys(org))
    console.log("contact_phone value:", org.contact_phone)
    console.log("contact_phone type:", typeof org.contact_phone)
    console.log("contact_phone Array.isArray:", Array.isArray(org.contact_phone))
  } else {
    console.log("No organization record found.")
  }
}

run()
