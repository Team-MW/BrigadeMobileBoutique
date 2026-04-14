import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Manual parsing of .env
const envFile = fs.readFileSync('.env', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) env[key.trim()] = value.join('=').trim()
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

console.log('--- DB CONNECTION TEST ---')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: URL or Key missing in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  try {
    console.log('Testing connection to table "sales"...')
    const { data, error, status } = await supabase.from('sales').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Connection Failed! ❌')
      console.error('Status:', status)
      console.error('Error Message:', error.message)
    } else {
      console.log('Connection Successful! ✅')
      console.log('Total rows in "sales":', data)
    }
    
    console.log('Testing connection to table "invoices"...')
    const { error: invError } = await supabase.from('invoices').select('count', { count: 'exact', head: true })
    if (invError) console.error('Table "invoices" check failed:', invError.message)
    else console.log('Table "invoices" accessible! ✅')

  } catch (err) {
    console.error('Unexpected Error:', err.message)
  }
}

test()
