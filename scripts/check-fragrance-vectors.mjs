import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkFragranceVectors() {
  try {
    console.log('🔍 Checking fragrance metadata vectors...')
    
    // Count total fragrances
    const { count: totalCount, error: countError } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error counting fragrances:', countError)
      return
    }
    
    console.log(`📊 Total fragrances: ${totalCount}`)
    
    // Count fragrances with metadata vectors
    const { count: vectorCount, error: vectorError } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })
      .not('metadata_vector', 'is', null)
    
    if (vectorError) {
      console.error('❌ Error counting fragrances with vectors:', vectorError)
      return
    }
    
    console.log(`📈 Fragrances with metadata vectors: ${vectorCount || 0}`)
    
    // Count fragrances with personality tags
    const { count: tagsCount, error: tagsError } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })
      .not('personality_tags', 'is', null)
    
    if (tagsError) {
      console.error('❌ Error counting fragrances with personality tags:', tagsError)
      return
    }
    
    console.log(`🏷️  Fragrances with personality tags: ${tagsCount || 0}`)
    
    // Show sample of fragrances without vectors
    const { data: sampleData, error: sampleError } = await supabase
      .from('fragrances')
      .select('id, name, brand_name, metadata_vector, personality_tags')
      .is('metadata_vector', null)
      .limit(5)
    
    if (sampleError) {
      console.error('❌ Error getting sample data:', sampleError)
      return
    }
    
    console.log('\n📝 Sample fragrances without metadata vectors:')
    sampleData?.forEach((fragrance, index) => {
      console.log(`${index + 1}. ${fragrance.name} by ${fragrance.brand_name}`)
    })
    
    const percentage = totalCount > 0 ? ((vectorCount || 0) / totalCount * 100).toFixed(1) : '0'
    console.log(`\n📊 Vector population: ${percentage}% (${vectorCount || 0}/${totalCount})`)
    
    if ((vectorCount || 0) === 0) {
      console.log('\n🚨 No fragrances have metadata vectors!')
      console.log('   This is required for the advanced quiz system to work')
    } else if ((vectorCount || 0) < totalCount) {
      console.log('\n⚠️  Some fragrances missing metadata vectors')
      console.log('   Consider running vector population script')
    } else {
      console.log('\n✅ All fragrances have metadata vectors!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkFragranceVectors()