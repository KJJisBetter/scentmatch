#!/usr/bin/env node

/**
 * Task 4.2: Brand Import Script
 * 
 * Imports brand data from /data/brands.json into the fragrance_brands table.
 * Must import brands first due to foreign key constraints in fragrances table.
 * 
 * Performance target: < 5 seconds for 40 brand records
 * 
 * Usage: npm run import:brands
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Types based on source data structure
interface BrandSourceData {
  id: string
  name: string
  slug: string
  itemCount?: number
}

interface BrandDbData {
  id: string
  name: string
  slug: string
  item_count: number
  description: string | null
  website_url: string | null
  popularity_score: number
}

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BRANDS_FILE_PATH = path.join(process.cwd(), 'data', 'brands.json')
const BATCH_SIZE = 20 // Small batch size for brands

// Validation
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Normalize brand name using same logic as fragrance validation
 */
function normalizeBrand(s: string): string {
  return s.normalize('NFKC').trim().replace(/\s+/g, ' ')
}

/**
 * Transform source brand data to database schema
 */
function transformBrandData(source: BrandSourceData): BrandDbData {
  return {
    id: source.id,
    name: normalizeBrand(source.name),
    slug: source.slug,
    item_count: source.itemCount || 0,
    description: null, // Will be populated later if available
    website_url: null, // Will be populated later if available
    popularity_score: source.itemCount || 0 // Use item count as initial popularity score
  }
}

/**
 * Validate brand data against expected schema
 */
function validateBrandData(brand: BrandSourceData): string[] {
  const errors: string[] = []
  
  if (!brand.id || typeof brand.id !== 'string') {
    errors.push('Missing or invalid id')
  }
  
  if (!brand.name || typeof brand.name !== 'string') {
    errors.push('Missing or invalid name')
  }
  
  if (!brand.slug || typeof brand.slug !== 'string') {
    errors.push('Missing or invalid slug')
  }
  
  if (brand.itemCount !== undefined && typeof brand.itemCount !== 'number') {
    errors.push('Invalid itemCount type')
  }
  
  return errors
}

/**
 * Process brands in batches with progress tracking
 */
async function processBrandsInBatches(brands: BrandSourceData[]): Promise<void> {
  const totalBrands = brands.length
  let processedCount = 0
  let successCount = 0
  let errorCount = 0
  
  console.log(`📦 Processing ${totalBrands} brands in batches of ${BATCH_SIZE}`)
  
  for (let i = 0; i < brands.length; i += BATCH_SIZE) {
    const batch = brands.slice(i, i + BATCH_SIZE)
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(brands.length / BATCH_SIZE)
    
    console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} brands)`)
    
    try {
      // Transform batch data
      const transformedBatch: BrandDbData[] = batch.map(transformBrandData)
      
      // Insert batch with upsert to handle duplicates
      const { data, error } = await supabase
        .from('fragrance_brands')
        .upsert(transformedBatch, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select('id')
      
      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
      
      successCount += batch.length
      processedCount += batch.length
      
      console.log(`✅ Batch ${batchNumber} complete: ${batch.length} brands inserted/updated`)
      
      // Progress update
      const progress = ((processedCount / totalBrands) * 100).toFixed(1)
      console.log(`📊 Progress: ${processedCount}/${totalBrands} (${progress}%)`)
      
    } catch (error) {
      errorCount += batch.length
      processedCount += batch.length
      
      console.error(`❌ Batch ${batchNumber} failed:`, error)
      
      // Log individual brand IDs for debugging
      console.error(`Failed brand IDs: ${batch.map(b => b.id).join(', ')}`)
      
      // Continue with next batch instead of failing completely
      console.log('⚠️  Continuing with next batch...')
    }
  }
  
  // Final summary
  console.log('\n📋 Import Summary:')
  console.log(`Total processed: ${processedCount}`)
  console.log(`Successful: ${successCount}`)
  console.log(`Failed: ${errorCount}`)
  console.log(`Success rate: ${((successCount / totalBrands) * 100).toFixed(1)}%`)
}

/**
 * Verify import completeness
 */
async function verifyImport(expectedCount: number): Promise<void> {
  console.log('\n🔍 Verifying import completeness...')
  
  const { count, error } = await supabase
    .from('fragrance_brands')
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    throw new Error(`Verification failed: ${error.message}`)
  }
  
  console.log(`📊 Expected brands: ${expectedCount}`)
  console.log(`📊 Imported brands: ${count}`)
  
  if (count === expectedCount) {
    console.log('✅ Import verification successful!')
  } else {
    console.log(`⚠️  Import incomplete: ${expectedCount - (count || 0)} brands missing`)
  }
}

/**
 * Main import function
 */
async function importBrands(): Promise<void> {
  const startTime = Date.now()
  
  try {
    console.log('🚀 Starting brand import...')
    console.log(`📁 Reading brands from: ${BRANDS_FILE_PATH}`)
    
    // Read and parse JSON file
    const fileContent = await fs.readFile(BRANDS_FILE_PATH, 'utf-8')
    const brandsData: BrandSourceData[] = JSON.parse(fileContent)
    
    console.log(`📊 Found ${brandsData.length} brands in source file`)
    
    // Validate data structure
    if (!Array.isArray(brandsData)) {
      throw new Error('Invalid data format: expected array of brands')
    }
    
    // Validate each brand
    let validationErrors = 0
    for (let i = 0; i < brandsData.length; i++) {
      const brand = brandsData[i]
      const errors = validateBrandData(brand)
      
      if (errors.length > 0) {
        console.error(`❌ Validation error for brand ${i + 1} (${brand.id || 'unknown'}):`)
        errors.forEach(error => console.error(`   - ${error}`))
        validationErrors++
      }
    }
    
    if (validationErrors > 0) {
      throw new Error(`Validation failed: ${validationErrors} brands have errors`)
    }
    
    console.log('✅ All brands passed validation')
    
    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from('fragrance_brands')
      .select('count')
      .limit(1)
    
    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`)
    }
    
    console.log('✅ Database connection verified')
    
    // Process import
    await processBrandsInBatches(brandsData)
    
    // Verify results
    await verifyImport(brandsData.length)
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n🎉 Brand import completed in ${duration} seconds`)
    
    // Check performance target
    if (parseFloat(duration) > 5) {
      console.log('⚠️  Performance warning: Import took longer than 5 second target')
    } else {
      console.log('🚀 Performance target met: < 5 seconds')
    }
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.error(`\n💥 Brand import failed after ${duration} seconds:`)
    console.error(error)
    process.exit(1)
  }
}

// Execute if called directly
if (require.main === module) {
  importBrands()
}

export { importBrands, transformBrandData, validateBrandData, normalizeBrand }