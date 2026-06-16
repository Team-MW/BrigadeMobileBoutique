import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) env[key.trim()] = value.join('=').trim()
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function run() {
  const { data, error } = await supabase.from('stock_ecran').select('*')
  if (error) {
    console.error('Error fetching stock_ecran:', error)
  } else {
    console.log('stock_ecran rows:', JSON.stringify(data, null, 2))
  }
}

run()
