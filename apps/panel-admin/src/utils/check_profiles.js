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

async function testColumn(colName) {
  const { error } = await supabase.from('profiles').select(colName).limit(1)
  console.log(`Column '${colName}':`, !error ? "EXISTS" : `does not exist (error: ${error.message})`)
}

async function test() {
  console.log("Testing columns of profiles table...")
  const cols = [
    'id', 'full_name', 'first_name', 'last_name', 'phone', 
    'bio', 'specialty', 'avatar_url', 'institution', 'dedication', 
    'updated_at', 'created_at'
  ]
  for (const col of cols) {
    await testColumn(col)
  }
}

test()
