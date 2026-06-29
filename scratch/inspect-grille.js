import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) env[key.trim()] = value.join('=').trim()
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase.from('grille_tarifaire').select('*')
  if (error) {
    console.error('Error fetching grille_tarifaire:', error)
  } else {
    console.log('Total rows:', data.length)
    console.log('Sample rows:', data.slice(0, 20))
    const uniqueModels = [...new Set(data.map(item => item.model))]
    console.log('Unique models in DB:', uniqueModels)
  }
}

test()
