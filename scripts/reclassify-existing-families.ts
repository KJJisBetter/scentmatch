#!/usr/bin/env npx tsx

/**
 * Re-classify existing fragrance families with improved rules
 * This will update families that might have been incorrectly classified
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

dotenv.config({ path: '.env.local' })

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Enhanced classification rules
const FAMILY_CLASSIFICATION_RULES = {
  oriental: {
    keywords: ['amber', 'oriental', 'vanilla', 'benzoin', 'labdanum', 'oud', 'myrrh', 'frankincense', 'incense', 'spices', 'cinnamon', 'cloves', 'cardamom', 'tonka bean', 'opium', 'balsam', 'tobacco', 'leather'],
    accords: ['amber', 'oriental', 'vanilla', 'sweet', 'warm spicy', 'balsamic', 'resinous', 'powdery', 'animalic', 'smoky'],
    weight: 1.0
  },
  woody: {
    keywords: ['sandalwood', 'cedar', 'vetiver', 'patchouli', 'oakmoss', 'birch', 'pine', 'mahogany', 'rosewood', 'ebony', 'teak', 'agarwood', 'cashmere wood', 'iso e super', 'guaiac wood', 'dry woods'],
    accords: ['woody', 'cedar', 'sandalwood', 'vetiver', 'earthy', 'mossy', 'dry', 'creamy woods'],
    weight: 1.0
  },
  fresh: {
    keywords: ['citrus', 'lemon', 'bergamot', 'lime', 'grapefruit', 'orange', 'mint', 'eucalyptus', 'marine', 'aquatic', 'mandarin', 'yuzu', 'petitgrain', 'neroli', 'sea breeze', 'ozone', 'aldehydes'],
    accords: ['citrus', 'fresh', 'aquatic', 'marine', 'mint', 'aromatic', 'green', 'aldehydic', 'ozonic'],
    weight: 1.0
  },
  floral: {
    keywords: ['rose', 'jasmine', 'lily', 'peony', 'gardenia', 'tuberose', 'ylang-ylang', 'neroli', 'lavender', 'geranium', 'iris', 'violet', 'magnolia', 'freesia', 'lily of the valley', 'narcissus', 'mimosa', 'orange blossom'],
    accords: ['floral', 'rose', 'jasmine', 'white floral', 'powdery', 'romantic', 'soft', 'feminine'],
    weight: 1.0
  },
  gourmand: {
    keywords: ['chocolate', 'caramel', 'honey', 'coffee', 'almond', 'coconut', 'praline', 'cake', 'cookie', 'cream', 'sugar', 'marshmallow', 'cotton candy', 'candy', 'dessert', 'bakery', 'pastry'],
    accords: ['gourmand', 'sweet', 'chocolate', 'caramel', 'honey', 'creamy', 'edible', 'dessert'],
    weight: 1.0
  },
  fougere: {
    keywords: ['lavender', 'oakmoss', 'coumarin', 'geranium', 'fougere', 'aromatic', 'herbs', 'bergamot', 'tonka', 'hay'],
    accords: ['fougere', 'aromatic', 'lavender', 'herbal', 'masculine', 'classic'],
    weight: 0.9
  },
  chypre: {
    keywords: ['oakmoss', 'bergamot', 'labdanum', 'chypre', 'mossy', 'patchouli', 'cistus'],
    accords: ['chypre', 'mossy', 'oakmoss', 'earthy', 'sophisticated'],
    weight: 0.9
  },
  fruity: {
    keywords: ['apple', 'pear', 'peach', 'plum', 'cherry', 'strawberry', 'raspberry', 'blackberry', 'blackcurrant', 'pineapple', 'mango', 'passion fruit', 'grape', 'melon'],
    accords: ['fruity', 'sweet', 'juicy', 'tropical', 'berry', 'stone fruit'],
    weight: 0.8
  },
  green: {
    keywords: ['grass', 'leaves', 'green', 'stems', 'cucumber', 'violet leaf', 'fig leaf', 'green tea', 'bamboo', 'galbanum'],
    accords: ['green', 'leafy', 'fresh', 'crisp', 'natural'],
    weight: 0.8
  },
  spicy: {
    keywords: ['pepper', 'ginger', 'nutmeg', 'allspice', 'paprika', 'saffron', 'cumin', 'coriander', 'pink pepper'],
    accords: ['spicy', 'hot', 'warm', 'peppery', 'exotic'],
    weight: 0.7
  }
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ')
}

function extractAllNotes(fragrance: any): string[] {
  const allNotes: string[] = []
  
  if (fragrance.main_accords) allNotes.push(...fragrance.main_accords)
  if (fragrance.top_notes) allNotes.push(...fragrance.top_notes)
  if (fragrance.middle_notes) allNotes.push(...fragrance.middle_notes)
  if (fragrance.base_notes) allNotes.push(...fragrance.base_notes)
  
  return allNotes.map(note => normalizeText(note))
}

function extractDescriptionText(fragrance: any): string {
  const descriptions: string[] = []
  
  if (fragrance.full_description) descriptions.push(fragrance.full_description)
  if (fragrance.short_description) descriptions.push(fragrance.short_description)
  
  return normalizeText(descriptions.join(' '))
}

function calculateFamilyScore(fragrance: any, family: string, rules: any): number {
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
  
  // Score based on accords (more weight)
  rules.accords.forEach((accord: string) => {
    if (allText.includes(normalizeText(accord))) {
      score += rules.weight * 1.2
    }
  })
  
  // Bonus for exact accord matches
  if (fragrance.main_accords) {
    fragrance.main_accords.forEach((accord: string) => {
      const normalizedAccord = normalizeText(accord)
      if (rules.accords.some((ruleAccord: string) => normalizedAccord.includes(normalizeText(ruleAccord)))) {
        score += rules.weight * 1.5
      }
    })
  }
  
  return score
}

function inferFragranceFamily(fragrance: any): { family: string; confidence: number } | null {
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
  let confidence = Math.min(topScore / 5, 1.0)
  
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

async function main() {
  console.log('🔄 Re-classifying existing fragrance families with improved rules...\n')
  
  try {
    // Get all fragrances currently classified as the basic families
    const { data: fragrances } = await supabase
      .from('fragrances')
      .select(`
        id,
        name,
        brand_id,
        fragrance_family,
        main_accords,
        top_notes,
        middle_notes,
        base_notes,
        full_description,
        short_description
      `)
      .in('fragrance_family', ['floral', 'fresh', 'fougere', 'chypre'])
      .order('popularity_score', { ascending: false, nullsLast: true })
    
    if (!fragrances || fragrances.length === 0) {
      console.log('No fragrances to re-classify')
      return
    }
    
    console.log(`Found ${fragrances.length} fragrances to re-classify`)
    
    const reclassifications: any[] = []
    
    // Re-analyze each fragrance
    for (const fragrance of fragrances) {
      const newClassification = inferFragranceFamily(fragrance)
      
      if (newClassification && 
          newClassification.family !== fragrance.fragrance_family &&
          newClassification.confidence >= 0.7) {
        
        reclassifications.push({
          id: fragrance.id,
          name: fragrance.name,
          brand_id: fragrance.brand_id,
          oldFamily: fragrance.fragrance_family,
          newFamily: newClassification.family,
          confidence: newClassification.confidence
        })
      }
    }
    
    console.log(`\n📊 Found ${reclassifications.length} fragrances to reclassify:`)
    
    // Group by reclassification type
    const reclassificationGroups = reclassifications.reduce((acc: any, item) => {
      const key = `${item.oldFamily} → ${item.newFamily}`
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
    
    Object.entries(reclassificationGroups).forEach(([change, items]: [string, any]) => {
      console.log(`  ${change}: ${items.length} fragrances`)
    })
    
    // Show some examples
    console.log('\n📝 Sample reclassifications:')
    reclassifications.slice(0, 10).forEach(item => {
      console.log(`  ${item.name} (${item.brand_id}): ${item.oldFamily} → ${item.newFamily} (${item.confidence} confidence)`)
    })
    
    // Apply updates
    if (reclassifications.length > 0) {
      console.log(`\n🔄 Applying ${reclassifications.length} reclassifications...`)
      
      for (const update of reclassifications) {
        const { error } = await supabase
          .from('fragrances')
          .update({ fragrance_family: update.newFamily })
          .eq('id', update.id)
        
        if (error) {
          console.error(`❌ Failed to update ${update.name}:`, error.message)
        }
      }
      
      console.log('✅ Reclassification complete!')
    }
    
    // Now process remaining null families
    console.log('\n🚀 Processing remaining fragrances with null families...')
    
    const { data: nullFamilies } = await supabase
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
    
    if (nullFamilies && nullFamilies.length > 0) {
      console.log(`Found ${nullFamilies.length} fragrances with null families`)
      
      const newInferences: any[] = []
      
      for (const fragrance of nullFamilies) {
        const inference = inferFragranceFamily(fragrance)
        
        if (inference && inference.confidence >= 0.5) {
          newInferences.push({
            id: fragrance.id,
            name: fragrance.name,
            family: inference.family,
            confidence: inference.confidence
          })
        }
      }
      
      console.log(`Found ${newInferences.length} new confident inferences`)
      
      // Family distribution of new inferences
      const newFamilyDistribution = newInferences.reduce((acc: Record<string, number>, item) => {
        acc[item.family] = (acc[item.family] || 0) + 1
        return acc
      }, {})
      
      console.log('New family distribution:')
      Object.entries(newFamilyDistribution)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .forEach(([family, count]) => {
          console.log(`  ${family}: ${count}`)
        })
      
      // Apply new inferences
      if (newInferences.length > 0) {
        console.log(`\n🔄 Applying ${newInferences.length} new family assignments...`)
        
        for (const inference of newInferences) {
          const { error } = await supabase
            .from('fragrances')
            .update({ fragrance_family: inference.family })
            .eq('id', inference.id)
          
          if (error) {
            console.error(`❌ Failed to update ${inference.name}:`, error.message)
          }
        }
        
        console.log('✅ New assignments complete!')
      }
    }
    
    // Final verification
    console.log('\n🔍 Final verification...')
    const { count: totalWithFamily } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })
      .not('fragrance_family', 'is', null)
    
    const { count: totalFragrances } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })
    
    console.log(`✅ Final status: ${totalWithFamily}/${totalFragrances} fragrances now have family data (${((totalWithFamily! / totalFragrances!) * 100).toFixed(1)}%)`)
    
  } catch (error) {
    console.error('❌ Reclassification failed:', error)
    process.exit(1)
  }
}

main()