#!/usr/bin/env npx tsx

/**
 * SCE-62: Fragrance Family Data Quality Analysis
 * 
 * This script analyzes the current state of fragrance family data
 * to understand the scope of missing/unknown family classifications
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Supabase client with service role for full access
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AnalysisResults {
  schemaAnalysis: any
  dataQuality: any
  sampleRecords: any[]
  brandPatterns: any[]
  noteAnalysis: any[]
  summary: any
}

async function analyzeFragranceFamilyData(): Promise<AnalysisResults> {
  console.log('🔍 Starting fragrance family data analysis...\n')

  // 1. Check current schema structure
  console.log('📋 Step 1: Analyzing database schema...')
  const { data: schemaInfo } = await supabase
    .from('fragrances')
    .select('*')
    .limit(1)

  console.log('Schema columns available:', Object.keys(schemaInfo?.[0] || {}))
  
  // 2. Get total counts and data quality metrics
  console.log('\n📊 Step 2: Analyzing data quality...')
  
  // Check if using scent_family or fragrance_family
  const hasScentFamily = schemaInfo?.[0]?.hasOwnProperty('scent_family')
  const hasFragranceFamily = schemaInfo?.[0]?.hasOwnProperty('fragrance_family')
  const familyColumn = hasFragranceFamily ? 'fragrance_family' : 'scent_family'
  
  console.log(`Using column: ${familyColumn}`)

  // Total count
  const { count: totalCount } = await supabase
    .from('fragrances')
    .select('*', { count: 'exact', head: true })

  // Missing/null family data
  const { count: nullFamilyCount } = await supabase
    .from('fragrances')
    .select('*', { count: 'exact', head: true })
    .is(familyColumn as any, null)

  // Empty string family data  
  const { count: emptyFamilyCount } = await supabase
    .from('fragrances')
    .select('*', { count: 'exact', head: true })
    .eq(familyColumn as any, '')

  // "Unknown" family data
  const { count: unknownFamilyCount } = await supabase
    .from('fragrances')
    .select('*', { count: 'exact', head: true })
    .ilike(familyColumn as any, 'unknown')

  const dataQuality = {
    totalFragrances: totalCount || 0,
    nullFamily: nullFamilyCount || 0,
    emptyFamily: emptyFamilyCount || 0,
    unknownFamily: unknownFamilyCount || 0,
    missingTotal: (nullFamilyCount || 0) + (emptyFamilyCount || 0) + (unknownFamilyCount || 0),
    familyColumn
  }

  console.log(`Total fragrances: ${dataQuality.totalFragrances}`)
  console.log(`Missing family data: ${dataQuality.missingTotal} (${((dataQuality.missingTotal / dataQuality.totalFragrances) * 100).toFixed(2)}%)`)
  console.log(`  - NULL values: ${dataQuality.nullFamily}`)
  console.log(`  - Empty strings: ${dataQuality.emptyFamily}`)
  console.log(`  - "Unknown" values: ${dataQuality.unknownFamily}`)

  // 3. Get family distribution for valid data
  console.log('\n📈 Step 3: Valid family distribution...')
  const { data: familyDistribution } = await supabase
    .from('fragrances')
    .select(`${familyColumn}`)
    .not(familyColumn as any, 'is', null)
    .neq(familyColumn as any, '')
    .not(familyColumn as any, 'ilike', 'unknown')

  const familyCounts = familyDistribution?.reduce((acc: Record<string, number>, item: any) => {
    const family = item[familyColumn]
    acc[family] = (acc[family] || 0) + 1
    return acc
  }, {}) || {}

  console.log('Top families:')
  Object.entries(familyCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .forEach(([family, count]) => {
      const percentage = ((count as number / dataQuality.totalFragrances) * 100).toFixed(2)
      console.log(`  ${family}: ${count} (${percentage}%)`)
    })

  // 4. Sample records with missing family data
  console.log('\n📝 Step 4: Sample records with missing family data...')
  
  const { data: sampleRecords } = await supabase
    .from('fragrances')
    .select(`
      id, 
      name, 
      brand_id,
      ${familyColumn},
      notes,
      description,
      popularity_score
    `)
    .or(`${familyColumn}.is.null,${familyColumn}.eq.,${familyColumn}.ilike.unknown`)
    .order('popularity_score', { ascending: false, nullsLast: true })
    .limit(10)

  console.log('Sample records:')
  sampleRecords?.forEach((record, i) => {
    console.log(`  ${i + 1}. ${record.name} (${record.brand_id})`)
    console.log(`     Family: ${record[familyColumn as keyof typeof record] || 'NULL'}`)
    console.log(`     Notes: ${Array.isArray(record.notes) ? record.notes.slice(0, 3).join(', ') : 'None'}`)
    console.log(`     Description: ${record.description?.substring(0, 100) || 'None'}...`)
    console.log('')
  })

  // 5. Brand analysis
  console.log('\n🏢 Step 5: Brand pattern analysis...')
  
  const { data: brandAnalysis } = await supabase
    .from('fragrances')
    .select(`
      brand_id,
      ${familyColumn}
    `)

  const brandPatterns = brandAnalysis?.reduce((acc: Record<string, any>, item: any) => {
    const brandId = item.brand_id
    if (!acc[brandId]) {
      acc[brandId] = { total: 0, missing: 0 }
    }
    acc[brandId].total++
    
    const family = item[familyColumn]
    if (!family || family === '' || family.toLowerCase() === 'unknown') {
      acc[brandId].missing++
    }
    return acc
  }, {}) || {}

  const brandPatternsArray = Object.entries(brandPatterns)
    .map(([brandId, stats]: [string, any]) => ({
      brandId,
      total: stats.total,
      missing: stats.missing,
      missingPercentage: (stats.missing / stats.total) * 100
    }))
    .filter(brand => brand.missing > 0)
    .sort((a, b) => b.missing - a.missing)
    .slice(0, 15)

  console.log('Brands with most missing family data:')
  brandPatternsArray.forEach(brand => {
    console.log(`  ${brand.brandId}: ${brand.missing}/${brand.total} missing (${brand.missingPercentage.toFixed(1)}%)`)
  })

  // 6. Note-based inference potential
  console.log('\n🔬 Step 6: Note-based inference potential...')
  
  const { data: noteAnalysis } = await supabase
    .from('fragrances')
    .select(`
      id,
      name,
      brand_id,
      ${familyColumn},
      notes
    `)
    .or(`${familyColumn}.is.null,${familyColumn}.eq.,${familyColumn}.ilike.unknown`)
    .not('notes', 'is', null)
    .limit(20)

  const notesAvailable = noteAnalysis?.filter(record => 
    Array.isArray(record.notes) && record.notes.length > 0
  ) || []

  console.log(`Fragrances with missing family but available notes: ${notesAvailable.length}`)
  notesAvailable.slice(0, 5).forEach(record => {
    console.log(`  ${record.name}: ${Array.isArray(record.notes) ? record.notes.slice(0, 5).join(', ') : 'No notes'}`)
  })

  // 7. Summary and recommendations
  const summary = {
    dataQualityScore: ((dataQuality.totalFragrances - dataQuality.missingTotal) / dataQuality.totalFragrances) * 100,
    topMissingBrands: brandPatternsArray.slice(0, 5).map(b => b.brandId),
    inferenceOpportunities: notesAvailable.length,
    totalFamilies: Object.keys(familyCounts).length
  }

  console.log('\n📋 Summary:')
  console.log(`Data Quality Score: ${summary.dataQualityScore.toFixed(2)}%`)
  console.log(`Total Unique Families: ${summary.totalFamilies}`)
  console.log(`Inference Opportunities: ${summary.inferenceOpportunities} fragrances with notes but no family`)
  console.log(`Top Problematic Brands: ${summary.topMissingBrands.join(', ')}`)

  return {
    schemaAnalysis: { familyColumn, hasScentFamily, hasFragranceFamily },
    dataQuality,
    sampleRecords: sampleRecords || [],
    brandPatterns: brandPatternsArray,
    noteAnalysis: notesAvailable,
    summary
  }
}

async function main() {
  try {
    const results = await analyzeFragranceFamilyData()
    
    console.log('\n🎯 Recommendations:')
    
    if (results.dataQuality.missingTotal > 0) {
      console.log('1. Implement note-based family classification for missing data')
      console.log('2. Create data validation rules for future imports')
      console.log('3. Consider AI-powered family inference using existing notes/descriptions')
    }
    
    if (results.brandPatterns.length > 0) {
      console.log('4. Focus on top problematic brands for manual data cleanup')
      console.log('5. Implement brand-specific import validation')
    }
    
    if (results.noteAnalysis.length > 0) {
      console.log('6. Prioritize inference for fragrances with rich note data')
    }

    console.log('\n✅ Analysis complete!')
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}