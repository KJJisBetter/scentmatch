#!/usr/bin/env ts-node

/**
 * Apply Database Migration Script
 * Reads and executes SQL migration files directly
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function applyMigration() {
  try {
    console.log('🚀 Applying fragrance data quality system migration...\n')

    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20250820000010_fragrance_data_quality_system.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration file loaded, executing SQL...')

    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Migration applied successfully!')
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables were created...')
    
    const tables = [
      'fragrances_canonical',
      'fragrance_variants', 
      'missing_product_requests',
      'data_quality_scores',
      'data_quality_issues',
      'fragrance_migration_log'
    ]

    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1)
        
      if (tableError && tableError.code === 'PGRST205') {
        console.log(`❌ Table ${table} not found`)
      } else {
        console.log(`✅ Table ${table} verified`)
      }
    }

    // Test functions
    console.log('\n🔍 Testing database functions...')
    
    const { error: funcError } = await supabase.rpc('check_extension_exists', { extension_name: 'pg_trgm' })
    if (funcError) {
      console.log(`❌ Function check_extension_exists failed: ${funcError.message}`)
    } else {
      console.log(`✅ Function check_extension_exists working`)
    }

    console.log('\n🎉 Migration verification complete!')

  } catch (error) {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  }
}

applyMigration()