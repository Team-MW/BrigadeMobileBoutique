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
  let report = '--- DB SCHEMA REPORT ---\n\n'
  
  // Check sales
  const { data: s, error: se } = await supabase.from('sales').select('*').limit(1)
  report += 'TABLE: sales\n'
  if (se) report += 'Error: ' + se.message + '\n'
  else report += 'Columns: ' + (s?.[0] ? Object.keys(s[0]).join(', ') : 'No data') + '\n\n'
  
  // Check invoices
  const { data: i, error: ie } = await supabase.from('invoices').select('*').limit(1)
  report += 'TABLE: invoices\n'
  if (ie) report += 'Error: ' + ie.message + '\n'
  else report += 'Columns: ' + (i?.[0] ? Object.keys(i[0]).join(', ') : 'No data') + '\n\n'
  
  fs.writeFileSync('scratch/db_report.txt', report)
  console.log('Report generated in scratch/db_report.txt')
}

run()
