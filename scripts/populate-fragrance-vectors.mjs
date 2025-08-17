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

// Simple vector generation based on personality tags and fragrance properties
function generateMetadataVector(fragrance) {
  const vector = new Array(256).fill(0.0)
  
  // Encode personality tags (dimensions 1-80)
  const personalityTags = fragrance.personality_tags || []
  const personalityEncoding = {
    'sophisticated': { start: 0, value: 0.8 },
    'casual': { start: 10, value: 0.7 },
    'confident': { start: 20, value: 0.9 },
    'romantic': { start: 30, value: 0.8 },
    'fresh': { start: 40, value: 0.6 },
    'warm': { start: 50, value: 0.7 },
    'evening': { start: 60, value: 0.8 },
    'daytime': { start: 70, value: 0.6 }
  }
  
  personalityTags.forEach(tag => {
    const encoding = personalityEncoding[tag.toLowerCase()]
    if (encoding) {
      for (let i = 0; i < 10; i++) {
        vector[encoding.start + i] = encoding.value + (Math.random() - 0.5) * 0.2
      }
    }
  })
  
  // Encode brand characteristics (dimensions 81-120)
  const brandName = fragrance.brand_name?.toLowerCase() || ''
  let brandFactor = 0.5
  
  // High-end brands
  if (['chanel', 'dior', 'tom ford', 'creed', 'maison margiela'].some(b => brandName.includes(b))) {
    brandFactor = 0.9
  }
  // Designer brands
  else if (['calvin klein', 'hugo boss', 'versace', 'armani'].some(b => brandName.includes(b))) {
    brandFactor = 0.7
  }
  // Celebrity/mass market
  else if (['ariana grande', 'britney spears', 'jennifer lopez'].some(b => brandName.includes(b))) {
    brandFactor = 0.4
  }
  
  for (let i = 81; i < 121; i++) {
    vector[i] = brandFactor + (Math.random() - 0.5) * 0.3
  }
  
  // Encode name characteristics (dimensions 121-200)
  const name = fragrance.name?.toLowerCase() || ''
  const nameFeatures = {
    'night': 0.8,
    'day': 0.3,
    'summer': 0.2,
    'winter': 0.8,
    'fresh': 0.2,
    'intense': 0.9,
    'light': 0.3,
    'dark': 0.8,
    'sweet': 0.6,
    'spicy': 0.7,
    'floral': 0.5,
    'woody': 0.7,
    'citrus': 0.3,
    'vanilla': 0.6,
    'amber': 0.8
  }
  
  Object.entries(nameFeatures).forEach(([keyword, value], index) => {
    if (name.includes(keyword) && 121 + index * 5 < 200) {
      for (let i = 0; i < 5; i++) {
        vector[121 + index * 5 + i] = value + (Math.random() - 0.5) * 0.2
      }
    }
  })
  
  // Fill remaining dimensions with small random values
  for (let i = 201; i < 256; i++) {
    vector[i] = (Math.random() - 0.5) * 0.1
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] = vector[i] / magnitude
    }
  }
  
  return vector
}

async function populateFragranceVectors() {
  try {
    console.log('🔄 Starting fragrance metadata vector population...')
    
    // Get all fragrances without metadata vectors
    console.log('📊 Fetching fragrances without metadata vectors...')
    
    const { data: fragrances, error: fetchError } = await supabase
      .from('fragrances')
      .select('id, name, brand_name, personality_tags, metadata_vector')
      .is('metadata_vector', null)
      .limit(100) // Process in batches
    
    if (fetchError) {
      console.error('❌ Error fetching fragrances:', fetchError)
      return
    }
    
    if (!fragrances || fragrances.length === 0) {
      console.log('✅ All fragrances already have metadata vectors!')
      return
    }
    
    console.log(`📈 Found ${fragrances.length} fragrances to process`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < fragrances.length; i++) {
      const fragrance = fragrances[i]
      
      console.log(`⚙️  Processing ${i + 1}/${fragrances.length}: ${fragrance.name}`)
      
      try {
        // Generate metadata vector
        const metadataVector = generateMetadataVector(fragrance)
        
        // Update the fragrance with the metadata vector
        const { error: updateError } = await supabase
          .from('fragrances')
          .update({ metadata_vector: metadataVector })
          .eq('id', fragrance.id)
        
        if (updateError) {
          console.error(`❌ Error updating ${fragrance.name}:`, updateError.message)
          errorCount++
        } else {
          successCount++
          if (i % 10 === 0) {
            console.log(`   ✅ Progress: ${successCount}/${i + 1} successful`)
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${fragrance.name}:`, error.message)
        errorCount++
      }
    }
    
    console.log('\n📊 Population Results:')
    console.log(`   ✅ Successfully updated: ${successCount}`)
    console.log(`   ❌ Failed: ${errorCount}`)
    console.log(`   📁 Total processed: ${fragrances.length}`)
    
    if (errorCount === 0) {
      console.log('\n🎉 Metadata vector population completed successfully!')
      console.log('   Run the script again to process more fragrances if needed')
    } else {
      console.log('\n⚠️  Population completed with some errors')
    }
    
  } catch (error) {
    console.error('❌ Error in population script:', error)
  }
}

populateFragranceVectors()