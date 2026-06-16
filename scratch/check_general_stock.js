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
  const { data, error } = await supabase.from('stock').select('*')
  if (error) {
    console.error('Error fetching stock:', error)
  } else {
    console.log('stock rows:', JSON.stringify(data, null, 2))
    const categories = new Set(data.map(item => item.category || 'Non classé'))
    console.log('Categories:', Array.from(categories))
  }
}

run()
