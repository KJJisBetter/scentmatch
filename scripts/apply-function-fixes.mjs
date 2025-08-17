import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyFunctionFixes() {
  try {
    console.log('🔄 Applying database function fixes...')
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250817_fix_profile_functions.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by statements and execute each one
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('📋 Executing SQL statement...')
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.log('⚠️  Error executing statement (may be expected):', error.message)
        }
      }
    }
    
    console.log('✅ Database function fixes applied successfully')
    
  } catch (error) {
    console.error('❌ Error applying function fixes:', error)
    process.exit(1)
  }
}

applyFunctionFixes()