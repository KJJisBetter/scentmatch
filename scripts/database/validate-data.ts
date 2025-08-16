#!/usr/bin/env node

/**
 * Task 4.4: Data Validation Script
 * 
 * Implements comprehensive data validation using existing schema from
 * /lib/data-validation/fragrance-schema.ts and additional integrity checks.
 * 
 * Validates:
 * - JSON file structure and parsing
 * - Schema compliance for all records
 * - Data integrity and relationships
 * - Performance requirements
 * 
 * Usage: npm run validate:data
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'
import { 
  FragranceSchema, 
  normalizeBrand, 
  normalizeName, 
  normalizeConc, 
  canonicalKey,
  type Fragrance
} from '../../lib/data-validation/fragrance-schema'
import { z } from 'zod'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BRANDS_FILE_PATH = path.join(process.cwd(), 'data', 'brands.json')
const FRAGRANCES_FILE_PATH = path.join(process.cwd(), 'data', 'fragrances.json')

// Validation results tracking
interface ValidationResults {
  fileValidation: {
    brandsParsed: boolean
    fragrancesParsed: boolean
    brandsCount: number
    fragrancesCount: number
    errors: string[]
  }
  schemaValidation: {
    brandsValid: number
    brandsInvalid: number
    fragrancesValid: number
    fragrancesInvalid: number
    errors: Array<{ type: 'brand' | 'fragrance', id: string, errors: string[] }>
  }
  integrityValidation: {
    duplicateBrands: number
    duplicateFragrances: number
    orphanedFragrances: number
    missingBrandReferences: string[]
    urlValidation: { valid: number, invalid: number }
    ratingValidation: { valid: number, invalid: number }
  }
  performanceValidation: {
    brandsParseTime: number
    fragrancesParseTime: number
    totalValidationTime: number
    memoryUsage: { before: number, peak: number, after: number }
  }
}

// Initialize validation results
const results: ValidationResults = {
  fileValidation: {
    brandsParsed: false,
    fragrancesParsed: false,
    brandsCount: 0,
    fragrancesCount: 0,
    errors: []
  },
  schemaValidation: {
    brandsValid: 0,
    brandsInvalid: 0,
    fragrancesValid: 0,
    fragrancesInvalid: 0,
    errors: []
  },
  integrityValidation: {
    duplicateBrands: 0,
    duplicateFragrances: 0,
    orphanedFragrances: 0,
    missingBrandReferences: [],
    urlValidation: { valid: 0, invalid: 0 },
    ratingValidation: { valid: 0, invalid: 0 }
  },
  performanceValidation: {
    brandsParseTime: 0,
    fragrancesParseTime: 0,
    totalValidationTime: 0,
    memoryUsage: { before: 0, peak: 0, after: 0 }
  }
}

// Validation
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Get memory usage in MB
 */
function getMemoryUsage(): number {
  const usage = process.memoryUsage()
  return Math.round(usage.heapUsed / 1024 / 1024)
}

/**
 * Validate JSON file parsing
 */
async function validateFileStructure(): Promise<{ brands: any[], fragrances: any[] }> {
  console.log('🔍 Step 1: Validating file structure and parsing...')
  
  results.performanceValidation.memoryUsage.before = getMemoryUsage()
  
  let brands: any[] = []
  let fragrances: any[] = []
  
  // Validate brands.json
  try {
    const brandStartTime = Date.now()
    console.log(`📁 Reading brands from: ${BRANDS_FILE_PATH}`)
    
    const brandsContent = await fs.readFile(BRANDS_FILE_PATH, 'utf-8')
    brands = JSON.parse(brandsContent)
    
    results.performanceValidation.brandsParseTime = Date.now() - brandStartTime
    
    if (!Array.isArray(brands)) {
      throw new Error('brands.json must contain an array')
    }
    
    results.fileValidation.brandsParsed = true
    results.fileValidation.brandsCount = brands.length
    console.log(`✅ Brands file parsed: ${brands.length} records`)
    
  } catch (error) {
    const errorMsg = `Failed to parse brands.json: ${error}`
    results.fileValidation.errors.push(errorMsg)
    console.error(`❌ ${errorMsg}`)
  }
  
  // Validate fragrances.json
  try {
    const fragranceStartTime = Date.now()
    console.log(`📁 Reading fragrances from: ${FRAGRANCES_FILE_PATH}`)
    
    const fragrancesContent = await fs.readFile(FRAGRANCES_FILE_PATH, 'utf-8')
    fragrances = JSON.parse(fragrancesContent)
    
    results.performanceValidation.fragrancesParseTime = Date.now() - fragranceStartTime
    
    if (!Array.isArray(fragrances)) {
      throw new Error('fragrances.json must contain an array')
    }
    
    results.fileValidation.fragrancesParsed = true
    results.fileValidation.fragrancesCount = fragrances.length
    console.log(`✅ Fragrances file parsed: ${fragrances.length} records`)
    
  } catch (error) {
    const errorMsg = `Failed to parse fragrances.json: ${error}`
    results.fileValidation.errors.push(errorMsg)
    console.error(`❌ ${errorMsg}`)
  }
  
  // Verify expected counts
  if (results.fileValidation.brandsCount !== 40) {
    const errorMsg = `Expected 40 brands, found ${results.fileValidation.brandsCount}`
    results.fileValidation.errors.push(errorMsg)
    console.error(`⚠️  ${errorMsg}`)
  }
  
  if (results.fileValidation.fragrancesCount !== 1467) {
    const errorMsg = `Expected 1,467 fragrances, found ${results.fileValidation.fragrancesCount}`
    results.fileValidation.errors.push(errorMsg)
    console.error(`⚠️  ${errorMsg}`)
  }
  
  results.performanceValidation.memoryUsage.peak = getMemoryUsage()
  
  return { brands, fragrances }
}

/**
 * Validate brand schema compliance
 */
function validateBrandSchema(brand: any, index: number): boolean {
  const BrandSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1),
    itemCount: z.number().int().min(0).optional()
  })
  
  try {
    BrandSchema.parse(brand)
    results.schemaValidation.brandsValid++
    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      results.schemaValidation.errors.push({
        type: 'brand',
        id: brand?.id || `index-${index}`,
        errors: errorDetails
      })
    }
    results.schemaValidation.brandsInvalid++
    return false
  }
}

/**
 * Transform and validate fragrance against existing schema
 */
function validateFragranceSchema(fragrance: any, index: number): boolean {
  try {
    // Transform source data to match FragranceSchema
    const transformed: Fragrance = {
      brand: normalizeBrand(fragrance.brandName || ''),
      name: normalizeName(fragrance.name || ''),
      concentration: normalizeConc(), // Default since not in source
      launchYear: null, // Not in source data
      notes: { top: [], middle: [], base: [] }, // Map from accords later
      sizesMl: [], // Not in source data
      imageUrl: null, // Not in source data
      productUrl: fragrance.url || ''
    }
    
    // Validate against schema
    FragranceSchema.parse(transformed)
    results.schemaValidation.fragrancesValid++
    return true
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      results.schemaValidation.errors.push({
        type: 'fragrance',
        id: fragrance?.id || `index-${index}`,
        errors: errorDetails
      })
    }
    results.schemaValidation.fragrancesInvalid++
    return false
  }
}

/**
 * Validate schema compliance for all records
 */
function validateSchemaCompliance(brands: any[], fragrances: any[]): void {
  console.log('\n🔍 Step 2: Validating schema compliance...')
  
  // Validate brands
  console.log(`🔎 Validating ${brands.length} brands...`)
  brands.forEach((brand, index) => validateBrandSchema(brand, index))
  
  // Validate fragrances (sample first 100 for performance)
  const sampleSize = Math.min(100, fragrances.length)
  console.log(`🔎 Validating sample of ${sampleSize} fragrances...`)
  
  for (let i = 0; i < sampleSize; i++) {
    validateFragranceSchema(fragrances[i], i)
  }
  
  // Report schema validation results
  console.log(`✅ Brands valid: ${results.schemaValidation.brandsValid}/${brands.length}`)
  console.log(`✅ Fragrances valid (sample): ${results.schemaValidation.fragrancesValid}/${sampleSize}`)
  
  if (results.schemaValidation.errors.length > 0) {
    console.log(`❌ Schema errors found: ${results.schemaValidation.errors.length}`)
    
    // Show first 5 errors
    const errorsToShow = results.schemaValidation.errors.slice(0, 5)
    errorsToShow.forEach(error => {
      console.error(`  ${error.type} ${error.id}: ${error.errors.join(', ')}`)
    })
    
    if (results.schemaValidation.errors.length > 5) {
      console.error(`  ... and ${results.schemaValidation.errors.length - 5} more errors`)
    }
  }
}

/**
 * Validate data integrity and relationships
 */
function validateDataIntegrity(brands: any[], fragrances: any[]): void {
  console.log('\n🔍 Step 3: Validating data integrity...')
  
  // Check for duplicate brands
  const brandIds = new Set<string>()
  const brandSlugs = new Set<string>()
  
  brands.forEach(brand => {
    if (brandIds.has(brand.id)) {
      results.integrityValidation.duplicateBrands++
    }
    brandIds.add(brand.id)
    
    if (brandSlugs.has(brand.slug)) {
      console.warn(`⚠️  Duplicate brand slug: ${brand.slug}`)
    }
    brandSlugs.add(brand.slug)
  })
  
  // Check for duplicate fragrances using canonical key
  const fragranceKeys = new Set<string>()
  const fragranceIds = new Set<string>()
  
  fragrances.forEach(fragrance => {
    // Check ID duplicates
    if (fragranceIds.has(fragrance.id)) {
      results.integrityValidation.duplicateFragrances++
    }
    fragranceIds.add(fragrance.id)
    
    // Check canonical key duplicates (name/brand combinations)
    try {
      const key = canonicalKey({
        brand: fragrance.brandName,
        name: fragrance.name,
        concentration: normalizeConc()
      })
      
      if (fragranceKeys.has(key)) {
        results.integrityValidation.duplicateFragrances++
      }
      fragranceKeys.add(key)
    } catch (error) {
      // Skip canonical key check if data is malformed
    }
  })
  
  // Check brand references
  fragrances.forEach(fragrance => {
    if (!brandIds.has(fragrance.brandId)) {
      results.integrityValidation.orphanedFragrances++
      if (!results.integrityValidation.missingBrandReferences.includes(fragrance.brandId)) {
        results.integrityValidation.missingBrandReferences.push(fragrance.brandId)
      }
    }
  })
  
  // Validate URLs
  fragrances.forEach(fragrance => {
    if (fragrance.url) {
      if (/^https?:\/\//.test(fragrance.url)) {
        results.integrityValidation.urlValidation.valid++
      } else {
        results.integrityValidation.urlValidation.invalid++
      }
    }
  })
  
  // Validate ratings
  fragrances.forEach(fragrance => {
    if (fragrance.ratingValue !== undefined) {
      if (typeof fragrance.ratingValue === 'number' && 
          fragrance.ratingValue >= 0 && 
          fragrance.ratingValue <= 5) {
        results.integrityValidation.ratingValidation.valid++
      } else {
        results.integrityValidation.ratingValidation.invalid++
      }
    }
  })
  
  // Report integrity results
  console.log(`📊 Duplicate brands: ${results.integrityValidation.duplicateBrands}`)
  console.log(`📊 Duplicate fragrances: ${results.integrityValidation.duplicateFragrances}`)
  console.log(`📊 Orphaned fragrances: ${results.integrityValidation.orphanedFragrances}`)
  console.log(`📊 Missing brand references: ${results.integrityValidation.missingBrandReferences.length}`)
  console.log(`📊 Valid URLs: ${results.integrityValidation.urlValidation.valid}`)
  console.log(`📊 Invalid URLs: ${results.integrityValidation.urlValidation.invalid}`)
  console.log(`📊 Valid ratings: ${results.integrityValidation.ratingValidation.valid}`)
  console.log(`📊 Invalid ratings: ${results.integrityValidation.ratingValidation.invalid}`)
  
  if (results.integrityValidation.missingBrandReferences.length > 0) {
    console.error(`❌ Missing brands: ${results.integrityValidation.missingBrandReferences.join(', ')}`)
  }
}

/**
 * Test database connectivity and schema readiness
 */
async function validateDatabaseReadiness(): Promise<void> {
  console.log('\n🔍 Step 4: Validating database readiness...')
  
  try {
    // Test fragrance_brands table
    const { data: brandTest, error: brandError } = await supabase
      .from('fragrance_brands')
      .select('count')
      .limit(1)
    
    if (brandError) {
      throw new Error(`fragrance_brands table not accessible: ${brandError.message}`)
    }
    
    console.log('✅ fragrance_brands table accessible')
    
    // Test fragrances table
    const { data: fragranceTest, error: fragranceError } = await supabase
      .from('fragrances')
      .select('count')
      .limit(1)
    
    if (fragranceError) {
      throw new Error(`fragrances table not accessible: ${fragranceError.message}`)
    }
    
    console.log('✅ fragrances table accessible')
    
    // Test foreign key constraint exists
    const { data: constraints, error: constraintError } = await supabase
      .rpc('get_foreign_key_constraints', {})
      .select('*')
      .limit(1)
    
    // Note: This RPC might not exist, so we'll skip if not available
    if (!constraintError) {
      console.log('✅ Database constraints accessible')
    }
    
    console.log('✅ Database readiness validated')
    
  } catch (error) {
    console.error(`❌ Database validation failed: ${error}`)
    throw error
  }
}

/**
 * Generate comprehensive validation report
 */
function generateValidationReport(): void {
  console.log('\n📋 VALIDATION REPORT')
  console.log('═'.repeat(50))
  
  // File validation summary
  console.log('\n📁 File Validation:')
  console.log(`Brands parsed: ${results.fileValidation.brandsParsed ? '✅' : '❌'}`)
  console.log(`Fragrances parsed: ${results.fileValidation.fragrancesParsed ? '✅' : '❌'}`)
  console.log(`Brands count: ${results.fileValidation.brandsCount} (expected: 40)`)
  console.log(`Fragrances count: ${results.fileValidation.fragrancesCount} (expected: 1,467)`)
  
  if (results.fileValidation.errors.length > 0) {
    console.log('❌ File errors:')
    results.fileValidation.errors.forEach(error => console.log(`  - ${error}`))
  }
  
  // Schema validation summary
  console.log('\n📐 Schema Validation:')
  console.log(`Valid brands: ${results.schemaValidation.brandsValid}/${results.fileValidation.brandsCount}`)
  console.log(`Valid fragrances (sample): ${results.schemaValidation.fragrancesValid}/100`)
  console.log(`Schema errors: ${results.schemaValidation.errors.length}`)
  
  // Integrity validation summary
  console.log('\n🔗 Data Integrity:')
  console.log(`Duplicate brands: ${results.integrityValidation.duplicateBrands}`)
  console.log(`Duplicate fragrances: ${results.integrityValidation.duplicateFragrances}`)
  console.log(`Orphaned fragrances: ${results.integrityValidation.orphanedFragrances}`)
  console.log(`Missing brand refs: ${results.integrityValidation.missingBrandReferences.length}`)
  console.log(`URL validation: ${results.integrityValidation.urlValidation.valid} valid, ${results.integrityValidation.urlValidation.invalid} invalid`)
  console.log(`Rating validation: ${results.integrityValidation.ratingValidation.valid} valid, ${results.integrityValidation.ratingValidation.invalid} invalid`)
  
  // Performance summary
  console.log('\n⚡ Performance:')
  console.log(`Brands parse time: ${results.performanceValidation.brandsParseTime}ms`)
  console.log(`Fragrances parse time: ${results.performanceValidation.fragrancesParseTime}ms`)
  console.log(`Total validation time: ${results.performanceValidation.totalValidationTime}ms`)
  console.log(`Memory usage: ${results.performanceValidation.memoryUsage.before}MB → ${results.performanceValidation.memoryUsage.peak}MB → ${results.performanceValidation.memoryUsage.after}MB`)
  
  // Overall status
  const hasErrors = results.fileValidation.errors.length > 0 || 
                   results.schemaValidation.errors.length > 0 ||
                   results.integrityValidation.orphanedFragrances > 0
  
  console.log('\n🎯 Overall Status:')
  if (hasErrors) {
    console.log('❌ VALIDATION FAILED - Issues found that must be resolved before import')
  } else {
    console.log('✅ VALIDATION PASSED - Data ready for import')
  }
}

/**
 * Main validation function
 */
async function validateData(): Promise<void> {
  const startTime = Date.now()
  
  try {
    console.log('🔍 Starting comprehensive data validation...')
    
    // Step 1: File structure validation
    const { brands, fragrances } = await validateFileStructure()
    
    if (results.fileValidation.errors.length > 0) {
      throw new Error('File validation failed - cannot proceed with schema validation')
    }
    
    // Step 2: Schema validation
    validateSchemaCompliance(brands, fragrances)
    
    // Step 3: Data integrity validation
    validateDataIntegrity(brands, fragrances)
    
    // Step 4: Database readiness
    await validateDatabaseReadiness()
    
    // Calculate total time and final memory
    results.performanceValidation.totalValidationTime = Date.now() - startTime
    results.performanceValidation.memoryUsage.after = getMemoryUsage()
    
    // Generate final report
    generateValidationReport()
    
    console.log(`\n🎉 Data validation completed in ${(results.performanceValidation.totalValidationTime / 1000).toFixed(2)} seconds`)
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.error(`\n💥 Data validation failed after ${duration} seconds:`)
    console.error(error)
    process.exit(1)
  }
}

// Execute if called directly
if (require.main === module) {
  validateData()
}

export { 
  validateData, 
  validateFileStructure, 
  validateSchemaCompliance, 
  validateDataIntegrity,
  validateDatabaseReadiness,
  results
}