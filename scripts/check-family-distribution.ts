#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

dotenv.config({ path: '.env.local' })

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkFamilyDistribution() {
  console.log('🔍 Checking family distribution...\n')
  
  // Get all distinct families
  const { data: allFamilies } = await supabase
    .from('fragrances')
    .select('fragrance_family')
    .not('fragrance_family', 'is', null)
    .neq('fragrance_family', '')
    .limit(2000) // Get all records
  
  console.log('Raw family data sample:', allFamilies?.slice(0, 20))
  
  // Count by family
  const familyCounts = allFamilies?.reduce((acc: Record<string, number>, item) => {
    const family = item.fragrance_family?.toLowerCase() || 'unknown'
    acc[family] = (acc[family] || 0) + 1
    return acc
  }, {}) || {}
  
  console.log('\nFamily distribution:')
  Object.entries(familyCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .forEach(([family, count]) => {
      console.log(`  ${family}: ${count}`)
    })
  
  console.log(`\nTotal unique families: ${Object.keys(familyCounts).length}`)
  console.log(`Total fragrances with families: ${allFamilies?.length}`)
}

checkFamilyDistribution()