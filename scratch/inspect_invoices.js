import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) env[key.trim()] = value.join('=').trim()
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function check() {
  const { data, error } = await supabase.from('invoices').select('*').limit(1)
  if (error) {
    console.error('Error:', error.message)
    return
  }
  if (data && data.length > 0) {
    console.log('Invoice columns:', Object.keys(data[0]))
    console.log('Sample data:', data[0])
  } else {
    console.log('No invoices found in table.')
  }
}

check()
