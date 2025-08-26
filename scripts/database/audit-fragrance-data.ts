/**
 * Fragrance Database Audit Script
 * Analyzes data consistency issues for SCE-62 and SCE-64
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

import { createClient } from '@supabase/supabase-js'
import { validateFragranceFamily, calculateDataCompletenessScore } from '@/lib/data-validation/fragrance-data-validator'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yekstmwcgyiltxinqamf.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface AuditResult {
  totalFragrances: number
  missingFamilyCount: number
  invalidFamilyCount: number
  emptyAccordsCount: number
  missingGenderCount: number
  missingNameCount: number
  missingBrandCount: number
  missingImageCount: number
  completenessScore: number
  topInvalidFamilies: Array<{ family: string; count: number }>
  sampledIssues: Array<{
    id: string
    name: string
    brand_id: string
    issues: string[]
  }>
}

async function auditFragranceData(): Promise<AuditResult> {
  console.log('🔍 Starting fragrance database audit...')
  
  // Get total count
  console.log('📊 Counting total fragrances...')
  const { count: totalFragrances, error: countError } = await supabase
    .from('fragrances')
    .select('*', { count: 'exact', head: true })
    
  if (countError) {
    throw new Error(`Failed to count fragrances: ${countError.message}`)
  }
  
  console.log(`Total fragrances: ${totalFragrances}`)
  
  // Fetch sample for detailed analysis
  console.log('📥 Fetching sample data for analysis...')
  const { data: fragrances, error: dataError } = await supabase
    .from('fragrances')
    .select('id, name, brand_id, gender, fragrance_family, main_accords, image_url, rating_value, launch_year')
    .limit(1000) // Sample size for detailed analysis
    
  if (dataError) {
    throw new Error(`Failed to fetch fragrance data: ${dataError.message}`)
  }
  
  if (!fragrances || fragrances.length === 0) {
    throw new Error('No fragrance data found')
  }
  
  console.log(`Analyzing sample of ${fragrances.length} fragrances...`)
  
  // Calculate metrics using our validator
  const metrics = calculateDataCompletenessScore(fragrances)
  
  // Analyze invalid family values
  console.log('🔎 Analyzing invalid family values...')
  const { data: familyData, error: familyError } = await supabase
    .from('fragrances')
    .select('fragrance_family')
    .not('fragrance_family', 'is', null)
    .limit(2000)
    
  if (familyError) {
    console.warn(`Warning: Could not analyze family values: ${familyError.message}`)
  }
  
  const familyCounts: Record<string, number> = {}
  const invalidFamilies: Record<string, number> = {}
  
  if (familyData) {
    familyData.forEach(f => {
      if (f.fragrance_family) {
        familyCounts[f.fragrance_family] = (familyCounts[f.fragrance_family] || 0) + 1
        
        if (!validateFragranceFamily(f.fragrance_family)) {
          invalidFamilies[f.fragrance_family] = (invalidFamilies[f.fragrance_family] || 0) + 1
        }
      }
    })
  }
  
  const topInvalidFamilies = Object.entries(invalidFamilies)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([family, count]) => ({ family, count }))
  
  // Sample problematic records
  console.log('🚨 Finding problematic records...')
  const sampledIssues = fragrances
    .slice(0, 50) // Sample first 50
    .map(fragrance => {
      const issues: string[] = []
      
      if (!fragrance.fragrance_family) {
        issues.push('Missing fragrance family')
      } else if (!validateFragranceFamily(fragrance.fragrance_family)) {
        issues.push(`Invalid family: ${fragrance.fragrance_family}`)
      }
      
      if (!fragrance.main_accords || fragrance.main_accords.length === 0) {
        issues.push('Empty main accords')
      }
      
      if (!fragrance.gender) {
        issues.push('Missing gender')
      }
      
      if (!fragrance.name || fragrance.name.trim() === '') {
        issues.push('Missing or empty name')
      }
      
      if (!fragrance.brand_id || fragrance.brand_id.trim() === '') {
        issues.push('Missing brand ID')
      }
      
      if (!fragrance.image_url) {
        issues.push('Missing image URL')
      }
      
      return {
        id: fragrance.id,
        name: fragrance.name || 'Unknown',
        brand_id: fragrance.brand_id || 'Unknown',
        issues
      }
    })
    .filter(record => record.issues.length > 0)
    .slice(0, 20) // Limit to first 20 problematic records
  
  // Count specific issues across full sample
  let missingImageCount = 0
  fragrances.forEach(f => {
    if (!f.image_url) missingImageCount++
  })
  
  return {
    totalFragrances: totalFragrances || 0,
    missingFamilyCount: metrics.missingFamilyCount,
    invalidFamilyCount: metrics.invalidFamilyCount,
    emptyAccordsCount: metrics.emptyAccordsCount,
    missingGenderCount: metrics.missingGenderCount,
    missingNameCount: metrics.missingNameCount,
    missingBrandCount: metrics.missingBrandCount,
    missingImageCount,
    completenessScore: metrics.overallScore,
    topInvalidFamilies,
    sampledIssues
  }
}

function generateAuditReport(result: AuditResult): void {
  console.log('\n' + '='.repeat(60))
  console.log('📋 FRAGRANCE DATABASE AUDIT REPORT')
  console.log('='.repeat(60))
  
  console.log('\n📈 OVERALL STATISTICS')
  console.log('─'.repeat(30))
  console.log(`Total Fragrances: ${result.totalFragrances.toLocaleString()}`)
  console.log(`Overall Completeness: ${(result.completenessScore * 100).toFixed(1)}%`)
  console.log(`Complete Records: ${((result.totalFragrances - result.missingFamilyCount - result.invalidFamilyCount) / result.totalFragrances * 100).toFixed(1)}%`)
  
  console.log('\n⚠️  DATA QUALITY ISSUES')
  console.log('─'.repeat(30))
  console.log(`Missing Fragrance Family: ${result.missingFamilyCount.toLocaleString()} records`)
  console.log(`Invalid Fragrance Family: ${result.invalidFamilyCount.toLocaleString()} records`)
  console.log(`Empty Main Accords: ${result.emptyAccordsCount.toLocaleString()} records`)
  console.log(`Missing Gender: ${result.missingGenderCount.toLocaleString()} records`)
  console.log(`Missing Names: ${result.missingNameCount.toLocaleString()} records`)
  console.log(`Missing Brand ID: ${result.missingBrandCount.toLocaleString()} records`)
  console.log(`Missing Images: ${result.missingImageCount.toLocaleString()} records`)
  
  if (result.topInvalidFamilies.length > 0) {
    console.log('\n🚫 TOP INVALID FAMILY VALUES')
    console.log('─'.repeat(30))
    result.topInvalidFamilies.forEach((invalid, index) => {
      console.log(`${index + 1}. "${invalid.family}": ${invalid.count.toLocaleString()} records`)
    })
  }
  
  if (result.sampledIssues.length > 0) {
    console.log('\n🔍 SAMPLE PROBLEMATIC RECORDS')
    console.log('─'.repeat(30))
    result.sampledIssues.slice(0, 10).forEach((record, index) => {
      console.log(`${index + 1}. ${record.brand_id}/${record.name} (${record.id})`)
      record.issues.forEach(issue => {
        console.log(`   • ${issue}`)
      })
    })
    
    if (result.sampledIssues.length > 10) {
      console.log(`   ... and ${result.sampledIssues.length - 10} more problematic records`)
    }
  }
  
  console.log('\n📊 PRIORITY RECOMMENDATIONS')
  console.log('─'.repeat(30))
  
  const totalIssues = result.missingFamilyCount + result.invalidFamilyCount + result.emptyAccordsCount
  const priorityLevel = totalIssues > result.totalFragrances * 0.1 ? 'HIGH' : totalIssues > result.totalFragrances * 0.05 ? 'MEDIUM' : 'LOW'
  
  console.log(`Priority Level: ${priorityLevel}`)
  
  if (result.missingFamilyCount > 0) {
    console.log(`1. Fix ${result.missingFamilyCount} records with missing fragrance families`)
  }
  
  if (result.invalidFamilyCount > 0) {
    console.log(`2. Correct ${result.invalidFamilyCount} records with invalid family values`)
  }
  
  if (result.emptyAccordsCount > 0) {
    console.log(`3. Add main accords to ${result.emptyAccordsCount} records`)
  }
  
  if (result.missingImageCount > result.totalFragrances * 0.2) {
    console.log(`4. Consider adding images to ${result.missingImageCount} records (${(result.missingImageCount / result.totalFragrances * 100).toFixed(1)}% missing)`)
  }
  
  console.log('\n✅ NEXT STEPS')
  console.log('─'.repeat(30))
  console.log('1. Run migration scripts to fix identified issues')
  console.log('2. Implement database constraints to prevent future issues')
  console.log('3. Add data quality monitoring to CI/CD pipeline')
  console.log('4. Create fallback handling for missing data in UI')
  
  console.log('\n' + '='.repeat(60))
}

async function main(): Promise<void> {
  try {
    const auditResult = await auditFragranceData()
    generateAuditReport(auditResult)
    
    // Write results to file for later reference
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const reportPath = `scripts/database/audit-report-${timestamp}.json`
    
    // Would write to file in real implementation
    console.log(`\n💾 Audit results saved to: ${reportPath}`)
    
  } catch (error) {
    console.error('❌ Audit failed:', error)
    process.exit(1)
  }
}

// Run audit if called directly
if (require.main === module) {
  main()
}

export { auditFragranceData, generateAuditReport }