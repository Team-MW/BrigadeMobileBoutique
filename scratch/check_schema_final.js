import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

async function checkInvoicesSchema() {
  try {
    const envFile = fs.readFileSync('.env', 'utf8')
    const env = Object.fromEntries(
      envFile.split('\n')
        .filter(line => line.includes('='))
        .map(line => {
          const [key, ...rest] = line.split('=')
          return [key.trim(), rest.join('=').trim().replace(/^"(.*)"$/, '$1')]
        })
    )

    const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

    console.log('--- Checking INVOICES table ---')
    const { data, error } = await supabase.from('invoices').select('*').limit(1)
    
    if (error) {
      console.error('Error fetching invoices:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('Columns found:', Object.keys(data[0]))
      console.log('Sample row:', data[0])
    } else {
      console.log('No data in invoices table. Attempting to get column names via empty select.')
      const { data: cols, error: colError } = await supabase.from('invoices').select().limit(0)
      if (colError) {
          console.error('Column check error:', colError)
      } else {
          console.log('Columns (empty select):', cols)
      }
    }

    console.log('\n--- Checking SALES table for comparison ---')
    const { data: salesData } = await supabase.from('sales').select('*').limit(1)
    if (salesData && salesData.length > 0) {
      console.log('Columns found in sales:', Object.keys(salesData[0]))
    }

  } catch (err) {
    console.error('Script error:', err)
  }
}

checkInvoicesSchema()
