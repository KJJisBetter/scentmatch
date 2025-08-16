#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Supabase configuration
const supabaseUrl = 'https://yekstmwcgyiltxinqamf.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlla3N0bXdjZ3lpbHR4aW5xYW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNzc3MzEsImV4cCI6MjA0OTg1MzczMX0.nR1UlCkn_rXGWzKaOrvnW_vMHfJM5LfJ6Yap1AO0wCA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function importRealData() {
  console.log('🚀 Starting real data import...')
  
  try {
    // Read JSON files
    const brandsData = JSON.parse(readFileSync(join(process.cwd(), 'data', 'brands.json'), 'utf8'))
    const fragrancesData = JSON.parse(readFileSync(join(process.cwd(), 'data', 'fragrances.json'), 'utf8'))
    
    console.log(`📊 Data loaded: ${brandsData.length} brands, ${fragrancesData.length} fragrances`)
    
    // Import brands first
    console.log('📦 Importing brands...')
    const { data: brandsResult, error: brandsError } = await supabase
      .rpc('import_brands', { brands_data: brandsData })
    
    if (brandsError) throw brandsError
    console.log(`✅ Imported ${brandsResult} brands`)
    
    // Import fragrances in batches to avoid memory issues
    const batchSize = 100
    let totalImported = 0
    
    console.log('🧴 Importing fragrances in batches...')
    for (let i = 0; i < fragrancesData.length; i += batchSize) {
      const batch = fragrancesData.slice(i, i + batchSize)
      console.log(`   Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(fragrancesData.length/batchSize)}: ${batch.length} fragrances`)
      
      const { data: batchResult, error: batchError } = await supabase
        .rpc('import_fragrances', { fragrances_data: batch })
      
      if (batchError) {
        console.error(`❌ Error in batch ${Math.floor(i/batchSize) + 1}:`, batchError)
        continue
      }
      
      totalImported += batchResult
    }
    
    console.log(`✅ Imported ${totalImported} fragrances`)
    
    // Get final statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_import_stats')
    
    if (statsError) throw statsError
    
    console.log('📈 Import Statistics:')
    console.log(`   Brands: ${stats[0].brands_count}`)
    console.log(`   Fragrances: ${stats[0].fragrances_count}`)
    console.log(`   Average Rating: ${stats[0].avg_rating}`)
    console.log(`   Total Reviews: ${stats[0].total_reviews}`)
    
    console.log('🎉 Data import completed successfully!')
    
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  }
}

// Run the import
importRealData()