#!/usr/bin/env ts-node

/**
 * Check Current Database Schema
 * Verify what tables and columns actually exist
 */

import { createServiceSupabase } from '@/lib/supabase'

async function checkCurrentSchema() {
  console.log('🔍 Checking current database schema...\n')
  
  const supabase = createServiceSupabase()
  
  try {
    // Check what tables exist
    console.log('📋 Checking existing tables...')
    
    const tablesToCheck = [
      'fragrances',
      'fragrance_brands', 
      'user_collections',
      'fragrances_canonical',
      'fragrance_variants',
      'missing_product_requests',
      'data_quality_scores'
    ]

    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
        
      if (error) {
        if (error.code === 'PGRST205') {
          console.log(`❌ Table '${table}' does not exist`)
        } else {
          console.log(`⚠️  Table '${table}' exists but query failed: ${error.message}`)
        }
      } else {
        console.log(`✅ Table '${table}' exists and accessible`)
        
        // If it's the fragrances table, check some columns
        if (table === 'fragrances' && data.length > 0) {
          const cols = Object.keys(data[0])
          console.log(`   Columns (${cols.length}): ${cols.slice(0, 10).join(', ')}${cols.length > 10 ? '...' : ''}`)
        }
      }
    }

    // Check for specific functions
    console.log('\n🔧 Checking database functions...')
    
    const functionsToCheck = [
      'search_fragrances_smart',
      'run_data_quality_checks',
      'check_extension_exists'
    ]

    for (const func of functionsToCheck) {
      const { data, error } = await supabase.rpc(func as any, {})
      
      if (error) {
        if (error.code === 'PGRST202') {
          console.log(`❌ Function '${func}' does not exist`)
        } else {
          console.log(`⚠️  Function '${func}' exists but call failed: ${error.message}`)
        }
      } else {
        console.log(`✅ Function '${func}' exists and callable`)
      }
    }

    // Check extensions
    console.log('\n🧩 Checking extensions...')
    
    const { data: extensionCheck, error: extError } = await supabase
      .rpc('check_extension_exists', { extension_name: 'pg_trgm' })
    
    if (extError) {
      console.log(`❌ Cannot check extensions: ${extError.message}`)
    } else {
      console.log(`✅ Extension check function working`)
    }

    // Get fragrance count if table exists
    const { count: fragranceCount } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })
    
    console.log(`\n📊 Database summary:`)
    console.log(`   Fragrances: ${fragranceCount || 0}`)

    const { count: brandCount } = await supabase
      .from('fragrance_brands')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   Brands: ${brandCount || 0}`)

    console.log('\n✅ Schema check completed!')

  } catch (error) {
    console.error('❌ Schema check failed:', error)
    process.exit(1)
  }
}

checkCurrentSchema()