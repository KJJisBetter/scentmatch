#!/usr/bin/env npx tsx

/**
 * SCE-62: Fragrance Family Inference Solution
 * 
 * This script infers missing fragrance family data using:
 * 1. Note-based pattern matching
 * 2. Accord analysis 
 * 3. Description keywords
 * 4. Brand/name patterns
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

// Fragrance family classification rules based on notes and accords
const FAMILY_CLASSIFICATION_RULES = {
  // Oriental/Amber families
  oriental: {
    keywords: ['amber', 'oriental', 'vanilla', 'benzoin', 'labdanum', 'oud', 'myrrh', 'frankincense', 'incense', 'spices', 'cinnamon', 'cloves', 'cardamom', 'tonka bean', 'opium', 'balsam', 'tobacco', 'leather'],
    accords: ['amber', 'oriental', 'vanilla', 'sweet', 'warm spicy', 'balsamic', 'resinous', 'powdery', 'animalic', 'smoky'],
    weight: 1.0
  },
  
  // Woody families
  woody: {
    keywords: ['sandalwood', 'cedar', 'vetiver', 'patchouli', 'oakmoss', 'birch', 'pine', 'mahogany', 'rosewood', 'ebony', 'teak', 'agarwood', 'cashmere wood', 'iso e super', 'guaiac wood', 'dry woods'],
    accords: ['woody', 'cedar', 'sandalwood', 'vetiver', 'earthy', 'mossy', 'dry', 'creamy woods'],
    weight: 1.0
  },
  
  // Fresh families
  fresh: {
    keywords: ['citrus', 'lemon', 'bergamot', 'lime', 'grapefruit', 'orange', 'mint', 'eucalyptus', 'marine', 'aquatic', 'mandarin', 'yuzu', 'petitgrain', 'neroli', 'sea breeze', 'ozone', 'aldehydes'],
    accords: ['citrus', 'fresh', 'aquatic', 'marine', 'mint', 'aromatic', 'green', 'aldehydic', 'ozonic'],
    weight: 1.0
  },
  
  // Floral families
  floral: {
    keywords: ['rose', 'jasmine', 'lily', 'peony', 'gardenia', 'tuberose', 'ylang-ylang', 'neroli', 'lavender', 'geranium', 'iris', 'violet', 'magnolia', 'freesia', 'lily of the valley', 'narcissus', 'mimosa', 'orange blossom'],
    accords: ['floral', 'rose', 'jasmine', 'white floral', 'powdery', 'romantic', 'soft', 'feminine'],
    weight: 1.0
  },
  
  // Gourmand families
  gourmand: {
    keywords: ['chocolate', 'caramel', 'honey', 'coffee', 'almond', 'coconut', 'praline', 'cake', 'cookie', 'cream', 'sugar', 'marshmallow', 'cotton candy', 'candy', 'dessert', 'bakery', 'pastry'],
    accords: ['gourmand', 'sweet', 'chocolate', 'caramel', 'honey', 'creamy', 'edible', 'dessert'],
    weight: 1.0
  },
  
  // Fougere families
  fougere: {
    keywords: ['lavender', 'oakmoss', 'coumarin', 'geranium', 'fougere', 'aromatic', 'herbs', 'bergamot', 'tonka', 'hay'],
    accords: ['fougere', 'aromatic', 'lavender', 'herbal', 'masculine', 'classic'],
    weight: 0.9
  },
  
  // Chypre families
  chypre: {
    keywords: ['oakmoss', 'bergamot', 'labdanum', 'chypre', 'mossy', 'patchouli', 'cistus'],
    accords: ['chypre', 'mossy', 'oakmoss', 'earthy', 'sophisticated'],
    weight: 0.9
  },
  
  // Fruity families
  fruity: {
    keywords: ['apple', 'pear', 'peach', 'plum', 'cherry', 'strawberry', 'raspberry', 'blackberry', 'blackcurrant', 'pineapple', 'mango', 'passion fruit', 'grape', 'melon'],
    accords: ['fruity', 'sweet', 'juicy', 'tropical', 'berry', 'stone fruit'],
    weight: 0.8
  },
  
  // Green families
  green: {
    keywords: ['grass', 'leaves', 'green', 'stems', 'cucumber', 'violet leaf', 'fig leaf', 'green tea', 'bamboo', 'galbanum'],
    accords: ['green', 'leafy', 'fresh', 'crisp', 'natural'],
    weight: 0.8
  },
  
  // Spicy families
  spicy: {
    keywords: ['pepper', 'ginger', 'nutmeg', 'allspice', 'paprika', 'saffron', 'cumin', 'coriander', 'pink pepper'],
    accords: ['spicy', 'hot', 'warm', 'peppery', 'exotic'],
    weight: 0.7
  }
}

interface FragranceData {
  id: string
  name: string
  brand_id: string
  main_accords: string[] | null
  top_notes: string[] | null
  middle_notes: string[] | null
  base_notes: string[] | null
  full_description: string | null
  short_description: string | null
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')
}

function extractAllNotes(fragrance: FragranceData): string[] {
  const allNotes: string[] = []
  
  if (fragrance.main_accords) allNotes.push(...fragrance.main_accords)
  if (fragrance.top_notes) allNotes.push(...fragrance.top_notes)
  if (fragrance.middle_notes) allNotes.push(...fragrance.middle_notes)
  if (fragrance.base_notes) allNotes.push(...fragrance.base_notes)
  
  return allNotes.map(note => normalizeText(note))
}

function extractDescriptionText(fragrance: FragranceData): string {
  const descriptions: string[] = []
  
  if (fragrance.full_description) descriptions.push(fragrance.full_description)
  if (fragrance.short_description) descriptions.push(fragrance.short_description)
  
  return normalizeText(descriptions.join(' '))
}

function calculateFamilyScore(fragrance: FragranceData, family: string, rules: any): number {
  let score = 0
  const allNotes = extractAllNotes(fragrance)
  const descriptionText = extractDescriptionText(fragrance)
  const allText = [...allNotes, descriptionText].join(' ')
  
  // Score based on note keywords
  rules.keywords.forEach((keyword: string) => {
    if (allText.includes(normalizeText(keyword))) {
      score += rules.weight
    }
  })
  
  // Score based on accords
  rules.accords.forEach((accord: string) => {
    if (allText.includes(normalizeText(accord))) {
      score += rules.weight * 1.2 // Accords are more reliable
    }
  })
  
  // Bonus for exact accord matches
  if (fragrance.main_accords) {
    fragrance.main_accords.forEach(accord => {
      const normalizedAccord = normalizeText(accord)
      if (rules.accords.some((ruleAccord: string) => normalizedAccord.includes(normalizeText(ruleAccord)))) {
        score += rules.weight * 1.5
      }
    })
  }
  
  return score
}

function inferFragranceFamily(fragrance: FragranceData): { family: string; confidence: number } | null {
  const familyScores: Record<string, number> = {}
  
  // Calculate scores for each family
  Object.entries(FAMILY_CLASSIFICATION_RULES).forEach(([family, rules]) => {
    familyScores[family] = calculateFamilyScore(fragrance, family, rules)
  })
  
  // Find the highest scoring family
  const sortedFamilies = Object.entries(familyScores)
    .sort(([,a], [,b]) => b - a)
    .filter(([,score]) => score > 0)
  
  if (sortedFamilies.length === 0) {
    return null
  }
  
  const [topFamily, topScore] = sortedFamilies[0]
  const [secondFamily, secondScore] = sortedFamilies[1] || [null, 0]
  
  // Calculate confidence based on score difference
  let confidence = Math.min(topScore / 5, 1.0) // Max confidence at score 5+
  
  // Reduce confidence if second place is close
  if (secondScore > 0 && topScore - secondScore < 1) {
    confidence *= 0.7
  }
  
  // Minimum confidence threshold
  if (confidence < 0.3 || topScore < 1) {
    return null
  }
  
  return {
    family: topFamily,
    confidence: Math.round(confidence * 100) / 100
  }
}

async function processFragranceBatch(fragrances: FragranceData[]): Promise<any[]> {
  const updates: any[] = []
  
  for (const fragrance of fragrances) {
    const inference = inferFragranceFamily(fragrance)
    
    if (inference && inference.confidence >= 0.5) {
      updates.push({
        id: fragrance.id,
        name: fragrance.name,
        brand_id: fragrance.brand_id,
        inferred_family: inference.family,
        confidence: inference.confidence,
        update_sql: {
          fragrance_family: inference.family
        }
      })
    }
  }
  
  return updates
}

async function updateFragranceFamilies(updates: any[]): Promise<void> {
  console.log(`\n🔄 Updating ${updates.length} fragrances with inferred families...`)
  
  const batchSize = 50
  let processed = 0
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize)
    
    try {
      // Update each fragrance in the batch
      for (const update of batch) {
        const { error } = await supabase
          .from('fragrances')
          .update({ fragrance_family: update.inferred_family })
          .eq('id', update.id)
        
        if (error) {
          console.error(`❌ Failed to update ${update.name}:`, error.message)
        } else {
          processed++
          if (processed % 10 === 0) {
            console.log(`  ✅ Updated ${processed}/${updates.length} fragrances`)
          }
        }
      }
    } catch (error) {
      console.error(`❌ Batch update error:`, error)
    }
  }
  
  console.log(`✅ Successfully updated ${processed} fragrances`)
}

async function main() {
  console.log('🚀 Starting fragrance family inference process...\n')
  
  try {
    // Get all fragrances with missing family data
    console.log('📊 Fetching fragrances with missing family data...')
    const { data: fragrances, error } = await supabase
      .from('fragrances')
      .select(`
        id,
        name,
        brand_id,
        main_accords,
        top_notes,
        middle_notes,
        base_notes,
        full_description,
        short_description
      `)
      .is('fragrance_family', null)
      .order('popularity_score', { ascending: false, nullsLast: true })
      .limit(2000) // Process up to 2000 at a time
    
    if (error) {
      throw new Error(`Failed to fetch fragrances: ${error.message}`)
    }
    
    if (!fragrances || fragrances.length === 0) {
      console.log('✅ No fragrances with missing family data found!')
      return
    }
    
    console.log(`Found ${fragrances.length} fragrances with missing family data`)
    
    // Process in batches for memory efficiency
    console.log('\n🧠 Analyzing fragrance characteristics...')
    const batchSize = 100
    const allUpdates: any[] = []
    
    for (let i = 0; i < fragrances.length; i += batchSize) {
      const batch = fragrances.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(fragrances.length / batchSize)}...`)
      
      const batchUpdates = await processFragranceBatch(batch)
      allUpdates.push(...batchUpdates)
      
      console.log(`  Found ${batchUpdates.length} confident inferences in this batch`)
    }
    
    // Summary of inference results
    console.log('\n📋 Inference Summary:')
    console.log(`Total fragrances analyzed: ${fragrances.length}`)
    console.log(`Confident inferences: ${allUpdates.length} (${((allUpdates.length / fragrances.length) * 100).toFixed(1)}%)`)
    
    // Family distribution of inferences
    const familyDistribution = allUpdates.reduce((acc: Record<string, number>, update) => {
      acc[update.inferred_family] = (acc[update.inferred_family] || 0) + 1
      return acc
    }, {})
    
    console.log('\nInferred family distribution:')
    Object.entries(familyDistribution)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .forEach(([family, count]) => {
        console.log(`  ${family}: ${count}`)
      })
    
    // Show some examples
    console.log('\n📝 Sample inferences:')
    allUpdates.slice(0, 10).forEach(update => {
      console.log(`  ${update.name} (${update.brand_id}) → ${update.inferred_family} (${update.confidence} confidence)`)
    })
    
    // Ask for confirmation before updating
    console.log(`\n❓ Ready to update ${allUpdates.length} fragrances?`)
    console.log('This will set the fragrance_family column for these records.')
    
    // For automated execution, you can uncomment the following:
    await updateFragranceFamilies(allUpdates)
    
    // Final verification
    console.log('\n🔍 Verifying updates...')
    const { count: updatedCount } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })
      .not('fragrance_family', 'is', null)
    
    const { count: totalCount } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })
    
    console.log(`✅ Final status: ${updatedCount}/${totalCount} fragrances now have family data (${((updatedCount! / totalCount!) * 100).toFixed(1)}%)`)
    
  } catch (error) {
    console.error('❌ Process failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}