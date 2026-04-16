import { supabase } from './src/lib/supabase.js'

async function checkSchema() {
  const { data, error } = await supabase.from('sales').select('*').limit(1)
  if (error) {
    console.error('Error fetching schema:', error)
  } else if (data && data.length > 0) {
    console.log('Columns in sales table:', Object.keys(data[0]))
  } else {
    console.log('No data in sales table to check columns.')
  }
}

checkSchema()
