import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) env[key.trim()] = value.join('=').trim()
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

async function testDeep() {
  console.log('--- DEEP SECURITY TEST ---')
  
  // 1. Try to Insert
  console.log('Inserting test row...')
  const { data: insData, error: insError } = await supabase
    .from('sales')
    .insert([{ 
      client: 'TEST DEBUG', 
      phone: 'DEBUG', 
      service: 'TEST', 
      type: 'Vente', 
      price: 1, 
      date: new Date().toISOString().split('T')[0] 
    }])
    .select()
  
  if (insError) {
    console.error('❌ INSERT FAILED:', insError.message)
  } else {
    console.log('✅ INSERT SUCCESSFUL!')
    console.log('New Row ID:', insData[0].id)
    
    // 2. Try to Select
    console.log('Fetching rows...')
    const { data: selData, error: selError } = await supabase.from('sales').select('*')
    if (selError) {
      console.error('❌ SELECT FAILED:', selError.message)
    } else {
      console.log('✅ SELECT SUCCESSFUL!')
      console.log('Found', selData.length, 'rows.')
      
      // 3. Cleanup
      console.log('Cleaning up test row...')
      await supabase.from('sales').delete().eq('client', 'TEST DEBUG')
    }
  }
}

testDeep()
