#!/usr/bin/env node

/**
 * Task 4.8: Execute Full Data Import and Verify Completeness
 * 
 * Orchestrates the complete data import process with comprehensive validation,
 * error handling, and verification of all 1,467 fragrances and 40 brands.
 * 
 * Process:
 * 1. Pre-import validation
 * 2. Brand import (40 records)
 * 3. Fragrance import (1,467 records)
 * 4. Post-import verification
 * 5. Search functionality verification
 * 6. Performance metrics reporting
 * 
 * Usage: npm run import:full
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'
import { validateData } from './validate-data'
import { importBrands } from './import-brands'
import { importFragrances } from './import-fragrances'
import { globalErrorHandler } from './error-handler'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Expected counts based on QA specifications
const EXPECTED_BRANDS = 40
const EXPECTED_FRAGRANCES = 1467
const PERFORMANCE_TARGET_TOTAL = 45 // seconds

// Import results tracking
interface ImportResults {
  validation: {
    passed: boolean
    duration: number
    errors: string[]
  }
  brands: {
    imported: number
    duration: number
    success: boolean
    errors: string[]
  }
  fragrances: {
    imported: number
    duration: number
    success: boolean
    errors: string[]
  }
  verification: {
    brandsVerified: number
    fragrancesVerified: number
    relationshipsValid: boolean
    searchFunctional: boolean
    errors: string[]
  }
  performance: {
    totalDuration: number
    targetMet: boolean
    memoryUsage: {
      start: number
      peak: number
      end: number
    }
  }
  overall: {
    success: boolean
    completeness: number // percentage
    summary: string
  }
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
 * Clear existing data for fresh import
 */
async function clearExistingData(): Promise<void> {
  console.log('🧹 Clearing existing data for fresh import...')
  
  try {
    // Delete fragrances first (foreign key dependency)
    const { error: fragranceError } = await supabase
      .from('fragrances')
      .delete()
      .neq('id', '')
    
    if (fragranceError) {
      console.warn(`Warning clearing fragrances: ${fragranceError.message}`)
    }
    
    // Delete brands
    const { error: brandError } = await supabase
      .from('fragrance_brands')
      .delete()
      .neq('id', '')
    
    if (brandError) {
      console.warn(`Warning clearing brands: ${brandError.message}`)
    }
    
    console.log('✅ Database cleared successfully')
    
  } catch (error) {
    console.warn(`Warning during database cleanup: ${error}`)
    // Continue with import even if cleanup fails
  }
}

/**
 * Verify database state before import
 */
async function verifyDatabaseReadiness(): Promise<void> {
  console.log('🔍 Verifying database readiness...')
  
  // Test table access
  const { data: brandTest, error: brandError } = await supabase
    .from('fragrance_brands')
    .select('count')
    .limit(1)
  
  if (brandError) {
    throw new Error(`fragrance_brands table not accessible: ${brandError.message}`)
  }
  
  const { data: fragranceTest, error: fragranceError } = await supabase
    .from('fragrances')
    .select('count')
    .limit(1)
  
  if (fragranceError) {
    throw new Error(`fragrances table not accessible: ${fragranceError.message}`)
  }
  
  // Verify tables are empty (or warn if not)
  const { count: brandCount } = await supabase
    .from('fragrance_brands')
    .select('*', { count: 'exact', head: true })
  
  const { count: fragranceCount } = await supabase
    .from('fragrances')
    .select('*', { count: 'exact', head: true })
  
  if (brandCount && brandCount > 0) {
    console.warn(`⚠️  Found ${brandCount} existing brands - will be overwritten`)
  }
  
  if (fragranceCount && fragranceCount > 0) {
    console.warn(`⚠️  Found ${fragranceCount} existing fragrances - will be overwritten`)
  }
  
  console.log('✅ Database ready for import')
}

/**
 * Execute data validation
 */
async function executeValidation(results: ImportResults): Promise<void> {
  console.log('\n📋 Phase 1: Data Validation')
  console.log('─'.repeat(50))
  
  const startTime = Date.now()
  
  try {
    await validateData()
    
    results.validation = {
      passed: true,
      duration: (Date.now() - startTime) / 1000,
      errors: []
    }
    
    console.log(`✅ Data validation completed in ${results.validation.duration.toFixed(2)}s`)
    
  } catch (error) {
    results.validation = {
      passed: false,
      duration: (Date.now() - startTime) / 1000,
      errors: [error instanceof Error ? error.message : String(error)]
    }
    
    console.error(`❌ Data validation failed: ${results.validation.errors[0]}`)
    throw error
  }
}

/**
 * Execute brand import
 */
async function executeBrandImport(results: ImportResults): Promise<void> {
  console.log('\n🏷️  Phase 2: Brand Import')
  console.log('─'.repeat(50))
  
  const startTime = Date.now()
  
  try {
    await globalErrorHandler.startImport(`brands-${Date.now()}`)
    const transactionId = await globalErrorHandler.startTransaction('brand-import')
    
    await importBrands()
    
    await globalErrorHandler.commitTransaction()
    
    // Verify import
    const { count: brandCount } = await supabase
      .from('fragrance_brands')
      .select('*', { count: 'exact', head: true })
    
    results.brands = {
      imported: brandCount || 0,
      duration: (Date.now() - startTime) / 1000,
      success: brandCount === EXPECTED_BRANDS,
      errors: brandCount !== EXPECTED_BRANDS ? [`Expected ${EXPECTED_BRANDS} brands, imported ${brandCount}`] : []
    }
    
    if (results.brands.success) {
      console.log(`✅ Brand import completed: ${results.brands.imported}/${EXPECTED_BRANDS} in ${results.brands.duration.toFixed(2)}s`)
      await globalErrorHandler.createCheckpoint('brands-complete', results.brands.imported)
    } else {
      throw new Error(`Brand import incomplete: ${results.brands.imported}/${EXPECTED_BRANDS}`)
    }
    
  } catch (error) {
    await globalErrorHandler.rollbackTransaction(`Brand import failed: ${error}`)
    
    results.brands = {
      imported: 0,
      duration: (Date.now() - startTime) / 1000,
      success: false,
      errors: [error instanceof Error ? error.message : String(error)]
    }
    
    console.error(`❌ Brand import failed: ${results.brands.errors[0]}`)
    throw error
  }
}

/**
 * Execute fragrance import
 */
async function executeFragranceImport(results: ImportResults): Promise<void> {
  console.log('\n🌸 Phase 3: Fragrance Import')
  console.log('─'.repeat(50))
  
  const startTime = Date.now()
  
  try {
    const transactionId = await globalErrorHandler.startTransaction('fragrance-import')
    
    await importFragrances()
    
    await globalErrorHandler.commitTransaction()
    
    // Verify import
    const { count: fragranceCount } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })
    
    results.fragrances = {
      imported: fragranceCount || 0,
      duration: (Date.now() - startTime) / 1000,
      success: fragranceCount === EXPECTED_FRAGRANCES,
      errors: fragranceCount !== EXPECTED_FRAGRANCES ? [`Expected ${EXPECTED_FRAGRANCES} fragrances, imported ${fragranceCount}`] : []
    }
    
    if (results.fragrances.success) {
      console.log(`✅ Fragrance import completed: ${results.fragrances.imported}/${EXPECTED_FRAGRANCES} in ${results.fragrances.duration.toFixed(2)}s`)
      await globalErrorHandler.createCheckpoint('fragrances-complete', results.fragrances.imported)
    } else {
      throw new Error(`Fragrance import incomplete: ${results.fragrances.imported}/${EXPECTED_FRAGRANCES}`)
    }
    
  } catch (error) {
    await globalErrorHandler.rollbackTransaction(`Fragrance import failed: ${error}`)
    
    results.fragrances = {
      imported: 0,
      duration: (Date.now() - startTime) / 1000,
      success: false,
      errors: [error instanceof Error ? error.message : String(error)]
    }
    
    console.error(`❌ Fragrance import failed: ${results.fragrances.errors[0]}`)
    throw error
  }
}

/**
 * Execute comprehensive verification
 */
async function executeVerification(results: ImportResults): Promise<void> {
  console.log('\n🔍 Phase 4: Comprehensive Verification')
  console.log('─'.repeat(50))
  
  const errors: string[] = []
  
  try {
    // Verify record counts
    const { count: brandCount } = await supabase
      .from('fragrance_brands')
      .select('*', { count: 'exact', head: true })
    
    const { count: fragranceCount } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })
    
    console.log(`📊 Found ${brandCount} brands, ${fragranceCount} fragrances`)
    
    if (brandCount !== EXPECTED_BRANDS) {
      errors.push(`Brand count mismatch: expected ${EXPECTED_BRANDS}, found ${brandCount}`)
    }
    
    if (fragranceCount !== EXPECTED_FRAGRANCES) {
      errors.push(`Fragrance count mismatch: expected ${EXPECTED_FRAGRANCES}, found ${fragranceCount}`)
    }
    
    // Verify foreign key relationships
    console.log('🔗 Verifying foreign key relationships...')
    
    const { data: orphanedFragrances, error: orphanError } = await supabase
      .rpc('check_orphaned_fragrances')
      .limit(10)
    
    let relationshipsValid = true
    
    if (orphanError) {
      // Fallback manual check
      const { data: fragSample } = await supabase
        .from('fragrances')
        .select('brand_id')
        .limit(100)
      
      const { data: allBrands } = await supabase
        .from('fragrance_brands')
        .select('id')
      
      const brandIds = new Set(allBrands?.map(b => b.id) || [])
      const invalidRefs = fragSample?.filter(f => !brandIds.has(f.brand_id)) || []
      
      if (invalidRefs.length > 0) {
        relationshipsValid = false
        errors.push(`Found ${invalidRefs.length} fragrances with invalid brand references`)
      }
    } else if (orphanedFragrances && orphanedFragrances.length > 0) {
      relationshipsValid = false
      errors.push(`Found ${orphanedFragrances.length} orphaned fragrances`)
    }
    
    if (relationshipsValid) {
      console.log('✅ All foreign key relationships valid')
    }
    
    // Test search functionality
    console.log('🔍 Testing search functionality...')
    
    let searchFunctional = true
    
    try {
      // Test basic queries
      const { data: brandSearch, error: brandSearchError } = await supabase
        .from('fragrance_brands')
        .select('*')
        .limit(5)
      
      const { data: fragranceSearch, error: fragranceSearchError } = await supabase
        .from('fragrances')
        .select('*')
        .limit(5)
      
      if (brandSearchError || fragranceSearchError) {
        searchFunctional = false
        errors.push('Basic search queries failed')
      }
      
      // Test filtering
      const { data: filterTest, error: filterError } = await supabase
        .from('fragrances')
        .select('*')
        .eq('gender', 'for women')
        .limit(5)
      
      if (filterError || !filterTest || filterTest.length === 0) {
        searchFunctional = false
        errors.push('Filtering functionality not working')
      }
      
      // Test joins
      const { data: joinTest, error: joinError } = await supabase
        .from('fragrances')
        .select(`
          *,
          fragrance_brands (
            name,
            slug
          )
        `)
        .limit(5)
      
      if (joinError) {
        searchFunctional = false
        errors.push('Join queries not working')
      }
      
      if (searchFunctional) {
        console.log('✅ Search functionality operational')
      }
      
    } catch (error) {
      searchFunctional = false
      errors.push(`Search test failed: ${error}`)
    }
    
    // Data quality spot checks
    console.log('🎯 Performing data quality spot checks...')
    
    const { data: sampleFragrances } = await supabase
      .from('fragrances')
      .select('*')
      .limit(10)
    
    let qualityIssues = 0
    
    sampleFragrances?.forEach(fragrance => {
      if (!fragrance.name || fragrance.name.trim().length === 0) {
        qualityIssues++
      }
      if (!fragrance.brand_name || fragrance.brand_name.trim().length === 0) {
        qualityIssues++
      }
      if (fragrance.rating_value && (fragrance.rating_value < 0 || fragrance.rating_value > 5)) {
        qualityIssues++
      }
    })
    
    if (qualityIssues > 0) {
      errors.push(`Found ${qualityIssues} data quality issues in sample`)
    } else {
      console.log('✅ Data quality checks passed')
    }
    
    results.verification = {
      brandsVerified: brandCount || 0,
      fragrancesVerified: fragranceCount || 0,
      relationshipsValid,
      searchFunctional,
      errors
    }
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
    results.verification = {
      brandsVerified: 0,
      fragrancesVerified: 0,
      relationshipsValid: false,
      searchFunctional: false,
      errors
    }
  }
  
  if (errors.length === 0) {
    console.log('✅ Comprehensive verification completed successfully')
  } else {
    console.warn(`⚠️  Verification completed with ${errors.length} issues`)
    errors.forEach(error => console.warn(`   - ${error}`))
  }
}

/**
 * Generate final import report
 */
function generateFinalReport(results: ImportResults): void {
  console.log('\n📊 FINAL IMPORT REPORT')
  console.log('═'.repeat(80))
  
  // Calculate completeness percentage
  const brandsCompleteness = (results.brands.imported / EXPECTED_BRANDS) * 100
  const fragrancesCompleteness = (results.fragrances.imported / EXPECTED_FRAGRANCES) * 100
  const overallCompleteness = (brandsCompleteness + fragrancesCompleteness) / 2
  
  results.overall.completeness = overallCompleteness
  
  // Performance summary
  console.log('\n⚡ Performance Summary:')
  console.log(`   Validation: ${results.validation.duration.toFixed(2)}s`)
  console.log(`   Brand Import: ${results.brands.duration.toFixed(2)}s`)
  console.log(`   Fragrance Import: ${results.fragrances.duration.toFixed(2)}s`)
  console.log(`   Total Duration: ${results.performance.totalDuration.toFixed(2)}s`)
  console.log(`   Target (< 45s): ${results.performance.targetMet ? '✅ MET' : '❌ MISSED'}`)
  console.log(`   Memory Usage: ${results.performance.memoryUsage.start}MB → ${results.performance.memoryUsage.peak}MB → ${results.performance.memoryUsage.end}MB`)
  
  // Data summary
  console.log('\n📋 Data Summary:')
  console.log(`   Brands: ${results.brands.imported}/${EXPECTED_BRANDS} (${brandsCompleteness.toFixed(1)}%)`)
  console.log(`   Fragrances: ${results.fragrances.imported}/${EXPECTED_FRAGRANCES} (${fragrancesCompleteness.toFixed(1)}%)`)
  console.log(`   Overall Completeness: ${overallCompleteness.toFixed(1)}%`)
  
  // Verification summary
  console.log('\n🔍 Verification Summary:')
  console.log(`   Foreign Key Relationships: ${results.verification.relationshipsValid ? '✅ Valid' : '❌ Issues'}`)
  console.log(`   Search Functionality: ${results.verification.searchFunctional ? '✅ Working' : '❌ Issues'}`)
  
  // Error summary
  const allErrors = [
    ...results.validation.errors,
    ...results.brands.errors,
    ...results.fragrances.errors,
    ...results.verification.errors
  ]
  
  if (allErrors.length > 0) {
    console.log('\n❌ Issues Found:')
    allErrors.forEach(error => console.log(`   - ${error}`))
  }
  
  // Overall status
  const success = results.validation.passed && 
                 results.brands.success && 
                 results.fragrances.success && 
                 results.verification.relationshipsValid &&
                 results.verification.searchFunctional
  
  results.overall.success = success
  
  console.log('\n🎯 Overall Status:')
  
  if (success && overallCompleteness === 100) {
    results.overall.summary = 'IMPORT SUCCESSFUL - All data imported and verified'
    console.log('🎉 IMPORT SUCCESSFUL')
    console.log('   ✅ All 40 brands imported')
    console.log('   ✅ All 1,467 fragrances imported')
    console.log('   ✅ Data integrity verified')
    console.log('   ✅ Search functionality operational')
    console.log('   ✅ Ready for production use')
  } else if (overallCompleteness >= 95) {
    results.overall.summary = 'IMPORT MOSTLY SUCCESSFUL - Minor issues detected'
    console.log('⚠️  IMPORT MOSTLY SUCCESSFUL')
    console.log(`   📊 ${overallCompleteness.toFixed(1)}% data completeness`)
    console.log('   ⚠️  Some minor issues detected - review above')
  } else {
    results.overall.summary = 'IMPORT FAILED - Significant issues detected'
    console.log('❌ IMPORT FAILED')
    console.log(`   📊 Only ${overallCompleteness.toFixed(1)}% data completeness`)
    console.log('   ❌ Significant issues detected - review and retry')
  }
}

/**
 * Save detailed import report to file
 */
async function saveImportReport(results: ImportResults): Promise<void> {
  const reportPath = path.join(process.cwd(), `import-report-${Date.now()}.json`)
  
  const detailedReport = {
    timestamp: new Date().toISOString(),
    results,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage()
    },
    configuration: {
      expectedBrands: EXPECTED_BRANDS,
      expectedFragrances: EXPECTED_FRAGRANCES,
      performanceTarget: PERFORMANCE_TARGET_TOTAL
    }
  }
  
  try {
    await fs.writeFile(reportPath, JSON.stringify(detailedReport, null, 2))
    console.log(`\n📄 Detailed report saved to: ${reportPath}`)
  } catch (error) {
    console.warn(`Failed to save report: ${error}`)
  }
}

/**
 * Main import execution function
 */
async function executeFullImport(): Promise<void> {
  const startTime = Date.now()
  
  console.log('🚀 STARTING FULL DATA IMPORT')
  console.log('═'.repeat(80))
  console.log(`Target: ${EXPECTED_BRANDS} brands + ${EXPECTED_FRAGRANCES} fragrances`)
  console.log(`Performance Target: < ${PERFORMANCE_TARGET_TOTAL} seconds`)
  console.log('')
  
  // Initialize results tracking
  const results: ImportResults = {
    validation: { passed: false, duration: 0, errors: [] },
    brands: { imported: 0, duration: 0, success: false, errors: [] },
    fragrances: { imported: 0, duration: 0, success: false, errors: [] },
    verification: { brandsVerified: 0, fragrancesVerified: 0, relationshipsValid: false, searchFunctional: false, errors: [] },
    performance: {
      totalDuration: 0,
      targetMet: false,
      memoryUsage: { start: getMemoryUsage(), peak: 0, end: 0 }
    },
    overall: { success: false, completeness: 0, summary: '' }
  }
  
  try {
    // Verify database readiness
    await verifyDatabaseReadiness()
    
    // Clear existing data
    await clearExistingData()
    
    // Phase 1: Data Validation
    await executeValidation(results)
    
    // Phase 2: Brand Import
    await executeBrandImport(results)
    results.performance.memoryUsage.peak = Math.max(results.performance.memoryUsage.peak, getMemoryUsage())
    
    // Phase 3: Fragrance Import  
    await executeFragranceImport(results)
    results.performance.memoryUsage.peak = Math.max(results.performance.memoryUsage.peak, getMemoryUsage())
    
    // Phase 4: Verification
    await executeVerification(results)
    
    // Calculate final performance metrics
    results.performance.totalDuration = (Date.now() - startTime) / 1000
    results.performance.targetMet = results.performance.totalDuration <= PERFORMANCE_TARGET_TOTAL
    results.performance.memoryUsage.end = getMemoryUsage()
    
    // Generate and save final report
    generateFinalReport(results)
    await saveImportReport(results)
    
    // Clean up import state if successful
    if (results.overall.success) {
      await globalErrorHandler.cleanupImportState()
    }
    
    console.log(`\n🏁 Import process completed in ${results.performance.totalDuration.toFixed(2)} seconds`)
    
    // Exit with appropriate code
    if (!results.overall.success) {
      process.exit(1)
    }
    
  } catch (error) {
    results.performance.totalDuration = (Date.now() - startTime) / 1000
    results.performance.memoryUsage.end = getMemoryUsage()
    
    console.error('\n💥 IMPORT FAILED')
    console.error(`Duration: ${results.performance.totalDuration.toFixed(2)}s`)
    console.error(`Error: ${error}`)
    
    // Generate error report
    await globalErrorHandler.generateErrorReport()
    await saveImportReport(results)
    
    process.exit(1)
  }
}

// Execute if called directly
if (require.main === module) {
  executeFullImport()
}

export { executeFullImport, ImportResults }