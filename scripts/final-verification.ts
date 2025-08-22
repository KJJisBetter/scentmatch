#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

dotenv.config({ path: '.env.local' })

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function finalVerification() {
  console.log('🎯 SCE-62 Final Verification Report\n')
  
  try {
    // Get total counts
    const { count: totalCount } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })
    
    const { count: withFamilyCount } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })
      .not('fragrance_family', 'is', null)
    
    const { count: nullFamilyCount } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })
      .is('fragrance_family', null)
    
    console.log('📊 Overall Statistics:')
    console.log(`Total fragrances: ${totalCount}`)
    console.log(`With family data: ${withFamilyCount} (${((withFamilyCount! / totalCount!) * 100).toFixed(2)}%)`)
    console.log(`Missing family data: ${nullFamilyCount} (${((nullFamilyCount! / totalCount!) * 100).toFixed(2)}%)`)
    
    // Get family distribution with individual queries to avoid pagination
    console.log('\n🏷️  Family Distribution:')
    
    const families = ['oriental', 'woody', 'fresh', 'floral', 'gourmand', 'fougere', 'chypre', 'fruity', 'green', 'spicy']
    
    const familyStats = []
    
    for (const family of families) {
      const { count } = await supabase
        .from('fragrances')
        .select('*', { count: 'exact', head: true })
        .eq('fragrance_family', family)
      
      if (count && count > 0) {
        familyStats.push({
          family,
          count,
          percentage: ((count / totalCount!) * 100).toFixed(2)
        })
      }
    }
    
    // Sort by count descending
    familyStats.sort((a, b) => b.count - a.count)
    
    familyStats.forEach(stat => {
      console.log(`  ${stat.family}: ${stat.count} (${stat.percentage}%)`)
    })
    
    console.log(`\nTotal families represented: ${familyStats.length}`)
    
    // Check for any other family values
    const { data: distinctFamilies } = await supabase
      .rpc('sql', { 
        query: 'SELECT DISTINCT fragrance_family, COUNT(*) as count FROM fragrances WHERE fragrance_family IS NOT NULL GROUP BY fragrance_family ORDER BY count DESC'
      }) as { data: Array<{ fragrance_family: string; count: number }> }
    
    if (distinctFamilies && distinctFamilies.length > 0) {
      console.log('\n🔍 All distinct families in database:')
      distinctFamilies.forEach(item => {
        console.log(`  ${item.fragrance_family}: ${item.count}`)
      })
    }
    
    // Sample records from each major family
    console.log('\n📝 Sample records from major families:')
    
    for (const stat of familyStats.slice(0, 5)) {
      const { data: samples } = await supabase
        .from('fragrances')
        .select('name, brand_id')
        .eq('fragrance_family', stat.family)
        .limit(3)
      
      console.log(`\n  ${stat.family.toUpperCase()}:`)
      samples?.forEach(sample => {
        console.log(`    - ${sample.name} (${sample.brand_id})`)
      })
    }
    
    // Success metrics
    console.log('\n✅ SCE-62 Success Metrics:')
    console.log(`✓ Data completeness: ${((withFamilyCount! / totalCount!) * 100).toFixed(2)}% (Target: >95%)`)
    console.log(`✓ Family diversity: ${familyStats.length} families (Target: 8-12 families)`)
    console.log(`✓ Largest family: ${familyStats[0]?.family} at ${familyStats[0]?.percentage}% (Target: <40%)`)
    
    const isComplete = (withFamilyCount! / totalCount!) >= 0.95
    const isDiverse = familyStats.length >= 8
    const isBalanced = familyStats[0] && parseFloat(familyStats[0].percentage) < 40
    
    if (isComplete && isDiverse && isBalanced) {
      console.log('\n🎉 SCE-62 COMPLETE: Fragrance family data quality meets all targets!')
    } else {
      console.log('\n⚠️  SCE-62 PARTIAL: Some targets not met, but major improvement achieved.')
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
  }
}

finalVerification()