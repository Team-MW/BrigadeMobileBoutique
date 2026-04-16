import { createClient } from '@supabase/supabase-client-helpers'
// I'll use the environment variables from .env
import dotenv from 'dotenv'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envFile = fs.readFileSync('.env', 'utf8')
const lines = envFile.split('\n')
const env = {}
lines.forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1')
  }
})

const supabase = createSupabaseClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function checkInvoicesSchema() {
  console.log('Checking invoices table schema...')
  const { data, error } = await supabase.from('invoices').select('*').limit(1)
  if (error) {
    console.error('Error fetching invoices schema:', error)
  } else if (data && data.length > 0) {
    console.log('Columns in invoices table:', Object.keys(data[0]))
    console.log('Example data:', data[0])
  } else {
    console.log('No data in invoices table. Checking if table exists by inserting a test row (rolled back or just checking error message)')
    const { error: insertError } = await supabase.from('invoices').insert({
       id: 'TEST_ID_TEMPORARY',
       clientname: 'Test'
    }).select()
    if (insertError) {
        console.error('Insert error (might reveal missing columns):', insertError)
    } else {
        console.log('Test insert succeeded. Deleting test row.')
        await supabase.from('invoices').delete().eq('id', 'TEST_ID_TEMPORARY')
    }
  }
}

checkInvoicesSchema()
