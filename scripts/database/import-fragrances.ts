#!/usr/bin/env node

/**
 * Task 4.3: Fragrance Import Script
 * 
 * Imports fragrance data from /data/fragrances.json into the fragrances table.
 * Requires brands to be imported first for foreign key constraints.
 * 
 * Performance target: < 30 seconds for 1,467 fragrance records
 * 
 * Usage: npm run import:fragrances
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'
import { normalizeBrand, normalizeName, normalizeConc, canonicalKey } from '../../lib/data-validation/fragrance-schema'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Types based on source data structure
interface FragranceSourceData {
  id: string
  brandId: string
  brandName: string
  name: string
  slug: string
  ratingValue?: number
  ratingCount?: number
  score?: number
  gender?: string
  accords?: string[]
  perfumers?: string[]
  url?: string
}

interface FragranceDbData {
  id: string
  brand_id: string
  brand_name: string
  name: string
  slug: string
  rating_value: number | null
  rating_count: number
  score: number | null
  gender: string | null
  accords: string[]
  perfumers: string[]
  fragrantica_url: string | null
  embedding: null // Will be populated later by AI system
  search_vector: null // Will be populated by trigger
}

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const FRAGRANCES_FILE_PATH = path.join(process.cwd(), 'data', 'fragrances.json')
const BATCH_SIZE = 100 // Optimized batch size for fragrances

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
 * Transform source fragrance data to database schema
 */
function transformFragranceData(source: FragranceSourceData): FragranceDbData {
  return {
    id: source.id,
    brand_id: source.brandId,
    brand_name: normalizeBrand(source.brandName),
    name: normalizeName(source.name),
    slug: source.slug,
    rating_value: source.ratingValue || null,
    rating_count: source.ratingCount || 0,
    score: source.score || null,
    gender: source.gender || null,
    accords: source.accords || [],
    perfumers: source.perfumers || [],
    fragrantica_url: source.url || null,
    embedding: null,
    search_vector: null
  }
}

/**
 * Validate fragrance data against expected schema
 */
function validateFragranceData(fragrance: FragranceSourceData): string[] {
  const errors: string[] = []
  
  if (!fragrance.id || typeof fragrance.id !== 'string') {
    errors.push('Missing or invalid id')
  }
  
  if (!fragrance.brandId || typeof fragrance.brandId !== 'string') {
    errors.push('Missing or invalid brandId')
  }
  
  if (!fragrance.brandName || typeof fragrance.brandName !== 'string') {
    errors.push('Missing or invalid brandName')
  }
  
  if (!fragrance.name || typeof fragrance.name !== 'string') {
    errors.push('Missing or invalid name')
  }
  
  if (!fragrance.slug || typeof fragrance.slug !== 'string') {
    errors.push('Missing or invalid slug')
  }
  
  if (fragrance.ratingValue !== undefined && 
      (typeof fragrance.ratingValue !== 'number' || fragrance.ratingValue < 0 || fragrance.ratingValue > 5)) {
    errors.push('Invalid ratingValue: must be number between 0-5')
  }
  
  if (fragrance.ratingCount !== undefined && 
      (typeof fragrance.ratingCount !== 'number' || fragrance.ratingCount < 0)) {
    errors.push('Invalid ratingCount: must be non-negative number')
  }
  
  if (fragrance.gender !== undefined && 
      !['for women', 'for men', 'unisex', 'for women and men'].includes(fragrance.gender)) {
    errors.push(`Invalid gender value: ${fragrance.gender}`)
  }
  
  if (fragrance.accords !== undefined && !Array.isArray(fragrance.accords)) {
    errors.push('Invalid accords: must be array')
  }
  
  if (fragrance.perfumers !== undefined && !Array.isArray(fragrance.perfumers)) {
    errors.push('Invalid perfumers: must be array')
  }
  
  if (fragrance.url !== undefined && fragrance.url && 
      !/^https?:\/\//.test(fragrance.url)) {
    errors.push('Invalid URL format')
  }
  
  return errors
}

/**
 * Verify all brands exist before importing fragrances
 */
async function verifyBrandDependencies(fragrances: FragranceSourceData[]): Promise<void> {
  console.log('🔍 Verifying brand dependencies...')
  
  // Get unique brand IDs from fragrances
  const uniqueBrandIds = [...new Set(fragrances.map(f => f.brandId))]
  console.log(`📊 Found ${uniqueBrandIds.length} unique brands referenced in fragrances`)
  
  // Query existing brands
  const { data: existingBrands, error } = await supabase
    .from('fragrance_brands')
    .select('id')
    .in('id', uniqueBrandIds)
  
  if (error) {
    throw new Error(`Failed to query brands: ${error.message}`)
  }
  
  const existingBrandIds = new Set(existingBrands?.map(b => b.id) || [])
  const missingBrandIds = uniqueBrandIds.filter(id => !existingBrandIds.has(id))
  
  if (missingBrandIds.length > 0) {
    console.error(`❌ Missing brands in database: ${missingBrandIds.join(', ')}`)
    throw new Error(`${missingBrandIds.length} referenced brands not found in database. Import brands first.`)
  }
  
  console.log('✅ All brand dependencies verified')
}

/**
 * Detect duplicate fragrances using canonical key
 */
function detectDuplicates(fragrances: FragranceSourceData[]): Map<string, FragranceSourceData[]> {
  const duplicates = new Map<string, FragranceSourceData[]>()
  
  for (const fragrance of fragrances) {
    // Create canonical key for duplicate detection
    const key = canonicalKey({
      brand: fragrance.brandName,
      name: fragrance.name,
      concentration: normalizeConc() // Default since concentration not in source data
    })
    
    if (!duplicates.has(key)) {
      duplicates.set(key, [])
    }
    duplicates.get(key)!.push(fragrance)
  }
  
  // Filter to only actual duplicates
  const actualDuplicates = new Map<string, FragranceSourceData[]>()
  for (const [key, frags] of duplicates.entries()) {
    if (frags.length > 1) {
      actualDuplicates.set(key, frags)
    }
  }
  
  return actualDuplicates
}

/**
 * Process fragrances in batches with progress tracking and error handling
 */
async function processFragrancesInBatches(fragrances: FragranceSourceData[]): Promise<void> {
  const totalFragrances = fragrances.length
  let processedCount = 0
  let successCount = 0
  let errorCount = 0
  const errorDetails: Array<{ batch: number, error: string, fragranceIds: string[] }> = []
  
  console.log(`📦 Processing ${totalFragrances} fragrances in batches of ${BATCH_SIZE}`)
  
  for (let i = 0; i < fragrances.length; i += BATCH_SIZE) {
    const batch = fragrances.slice(i, i + BATCH_SIZE)
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(fragrances.length / BATCH_SIZE)
    
    console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} fragrances)`)
    
    try {
      // Transform batch data
      const transformedBatch: FragranceDbData[] = batch.map(transformFragranceData)
      
      // Insert batch with upsert to handle duplicates
      const { data, error } = await supabase
        .from('fragrances')
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
      
      console.log(`✅ Batch ${batchNumber} complete: ${batch.length} fragrances inserted/updated`)
      
      // Progress update with ETA calculation
      const progress = ((processedCount / totalFragrances) * 100).toFixed(1)
      const elapsedTime = Date.now() - startTime
      const avgTimePerRecord = elapsedTime / processedCount
      const remainingRecords = totalFragrances - processedCount
      const etaMs = remainingRecords * avgTimePerRecord
      const etaSeconds = Math.round(etaMs / 1000)
      
      console.log(`📊 Progress: ${processedCount}/${totalFragrances} (${progress}%) - ETA: ${etaSeconds}s`)
      
    } catch (error) {
      errorCount += batch.length
      processedCount += batch.length
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ Batch ${batchNumber} failed: ${errorMessage}`)
      
      // Log error details for later analysis
      errorDetails.push({
        batch: batchNumber,
        error: errorMessage,
        fragranceIds: batch.map(f => f.id)
      })
      
      // Continue with next batch instead of failing completely
      console.log('⚠️  Continuing with next batch...')
    }
  }
  
  // Final summary
  console.log('\n📋 Import Summary:')
  console.log(`Total processed: ${processedCount}`)
  console.log(`Successful: ${successCount}`)
  console.log(`Failed: ${errorCount}`)
  console.log(`Success rate: ${((successCount / totalFragrances) * 100).toFixed(1)}%`)
  
  // Report errors if any
  if (errorDetails.length > 0) {
    console.log('\n❌ Error Details:')
    errorDetails.forEach(({ batch, error, fragranceIds }) => {
      console.log(`Batch ${batch}: ${error}`)
      console.log(`  Affected IDs: ${fragranceIds.slice(0, 5).join(', ')}${fragranceIds.length > 5 ? '...' : ''}`)
    })
  }
}

/**
 * Verify import completeness and data integrity
 */
async function verifyImport(expectedCount: number): Promise<void> {
  console.log('\n🔍 Verifying import completeness...')
  
  // Count total fragrances
  const { count, error } = await supabase
    .from('fragrances')
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    throw new Error(`Verification failed: ${error.message}`)
  }
  
  console.log(`📊 Expected fragrances: ${expectedCount}`)
  console.log(`📊 Imported fragrances: ${count}`)
  
  if (count === expectedCount) {
    console.log('✅ Import verification successful!')
  } else {
    console.log(`⚠️  Import incomplete: ${expectedCount - (count || 0)} fragrances missing`)
  }
  
  // Verify brand relationships
  console.log('\n🔍 Verifying brand relationships...')
  const { data: orphanedFragrances, error: orphanError } = await supabase
    .from('fragrances')
    .select('id, brand_id')
    .not('brand_id', 'in', `(SELECT id FROM fragrance_brands)`)
    .limit(10)
  
  if (orphanError) {
    console.warn(`Warning: Could not verify brand relationships: ${orphanError.message}`)
  } else if (orphanedFragrances && orphanedFragrances.length > 0) {
    console.error(`❌ Found ${orphanedFragrances.length} orphaned fragrances without valid brand references`)
    orphanedFragrances.forEach(f => console.error(`  - ${f.id} → ${f.brand_id}`))
  } else {
    console.log('✅ All brand relationships verified')
  }
}

// Track start time globally for ETA calculations
let startTime: number

/**
 * Main import function
 */
async function importFragrances(): Promise<void> {
  startTime = Date.now()
  
  try {
    console.log('🚀 Starting fragrance import...')
    console.log(`📁 Reading fragrances from: ${FRAGRANCES_FILE_PATH}`)
    
    // Read and parse JSON file
    const fileContent = await fs.readFile(FRAGRANCES_FILE_PATH, 'utf-8')
    const fragrancesData: FragranceSourceData[] = JSON.parse(fileContent)
    
    console.log(`📊 Found ${fragrancesData.length} fragrances in source file`)
    
    // Validate data structure
    if (!Array.isArray(fragrancesData)) {
      throw new Error('Invalid data format: expected array of fragrances')
    }
    
    // Check for duplicates
    const duplicates = detectDuplicates(fragrancesData)
    if (duplicates.size > 0) {
      console.log(`⚠️  Found ${duplicates.size} duplicate fragrance groups:`)
      let count = 0
      for (const [key, frags] of duplicates.entries()) {
        if (count < 5) { // Show first 5 duplicates
          console.log(`  - ${key}: ${frags.length} variants`)
        }
        count++
      }
      if (count > 5) {
        console.log(`  ... and ${count - 5} more duplicate groups`)
      }
      console.log('ℹ️  Duplicates will be handled via upsert')
    }
    
    // Validate sample of fragrances (first 100 for performance)
    const sampleSize = Math.min(100, fragrancesData.length)
    let validationErrors = 0
    
    console.log(`🔍 Validating sample of ${sampleSize} fragrances...`)
    
    for (let i = 0; i < sampleSize; i++) {
      const fragrance = fragrancesData[i]
      const errors = validateFragranceData(fragrance)
      
      if (errors.length > 0) {
        console.error(`❌ Validation error for fragrance ${i + 1} (${fragrance.id || 'unknown'}):`)
        errors.forEach(error => console.error(`   - ${error}`))
        validationErrors++
        
        // Stop after 10 validation errors to avoid spam
        if (validationErrors >= 10) {
          console.error('❌ Too many validation errors. Stopping validation.')
          break
        }
      }
    }
    
    if (validationErrors > 0) {
      throw new Error(`Validation failed: ${validationErrors} fragrances have errors in sample`)
    }
    
    console.log('✅ Sample validation passed')
    
    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from('fragrances')
      .select('count')
      .limit(1)
    
    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`)
    }
    
    console.log('✅ Database connection verified')
    
    // Verify brand dependencies
    await verifyBrandDependencies(fragrancesData)
    
    // Process import
    await processFragrancesInBatches(fragrancesData)
    
    // Verify results
    await verifyImport(fragrancesData.length)
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n🎉 Fragrance import completed in ${duration} seconds`)
    
    // Check performance target
    if (parseFloat(duration) > 30) {
      console.log('⚠️  Performance warning: Import took longer than 30 second target')
    } else {
      console.log('🚀 Performance target met: < 30 seconds')
    }
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.error(`\n💥 Fragrance import failed after ${duration} seconds:`)
    console.error(error)
    process.exit(1)
  }
}

// Execute if called directly
if (require.main === module) {
  importFragrances()
}

export { 
  importFragrances, 
  transformFragranceData, 
  validateFragranceData, 
  verifyBrandDependencies,
  detectDuplicates
}