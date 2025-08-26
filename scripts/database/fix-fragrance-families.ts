/**
 * Fragrance Family Data Migration Script
 * Fixes missing and invalid fragrance family values for SCE-62
 * Spec: @.agent-os/specs/2025-08-22-beginner-experience-optimization/
 */

import { createClient } from '@supabase/supabase-js'
import { validateFragranceFamily, suggestFamilyCorrection } from '@/lib/data-validation/fragrance-data-validator'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yekstmwcgyiltxinqamf.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface MigrationStats {
  processed: number
  fixed: number
  failed: number
  skipped: number
  fixedByFamily: Record<string, number>
}

/**
 * Infer fragrance family from notes and accords
 */
function inferFamilyFromNotes(fragrance: any): string | null {
  const allNotes = [
    ...(fragrance.top_notes || []),
    ...(fragrance.middle_notes || []),
    ...(fragrance.base_notes || []),
    ...(fragrance.main_accords || [])
  ].map(note => note.toLowerCase().trim())

  // Scoring system for family inference
  const familyScores: Record<string, number> = {}

  allNotes.forEach(note => {
    // Oriental/Amber
    if (['vanilla', 'amber', 'oriental', 'incense', 'spices', 'cinnamon', 'cardamom'].some(keyword => note.includes(keyword))) {
      familyScores.oriental = (familyScores.oriental || 0) + 1
    }

    // Woody
    if (['sandalwood', 'cedar', 'wood', 'woody', 'oak', 'pine', 'vetiver', 'patchouli'].some(keyword => note.includes(keyword))) {
      familyScores.woody = (familyScores.woody || 0) + 1
    }

    // Fresh/Citrus
    if (['citrus', 'lemon', 'bergamot', 'lime', 'grapefruit', 'orange', 'fresh', 'marine', 'sea', 'ocean'].some(keyword => note.includes(keyword))) {
      familyScores.fresh = (familyScores.fresh || 0) + 1
    }

    // Floral
    if (['rose', 'jasmine', 'lily', 'flower', 'floral', 'peony', 'iris', 'tuberose', 'ylang'].some(keyword => note.includes(keyword))) {
      familyScores.floral = (familyScores.floral || 0) + 1
    }

    // Gourmand/Sweet
    if (['vanilla', 'chocolate', 'caramel', 'honey', 'sugar', 'sweet', 'gourmand', 'almond', 'coconut'].some(keyword => note.includes(keyword))) {
      familyScores.gourmand = (familyScores.gourmand || 0) + 1
    }

    // Spicy
    if (['pepper', 'spicy', 'clove', 'nutmeg', 'ginger', 'coriander', 'paprika'].some(keyword => note.includes(keyword))) {
      familyScores.spicy = (familyScores.spicy || 0) + 1
    }

    // Green/Herbal
    if (['mint', 'basil', 'green', 'herb', 'sage', 'thyme', 'rosemary', 'lavender'].some(keyword => note.includes(keyword))) {
      familyScores.green = (familyScores.green || 0) + 1
    }

    // Fruity
    if (['fruit', 'apple', 'peach', 'berry', 'cherry', 'pear', 'tropical', 'mango'].some(keyword => note.includes(keyword))) {
      familyScores.fruity = (familyScores.fruity || 0) + 1
    }
  })

  // Find family with highest score
  const topFamily = Object.entries(familyScores)
    .sort(([,a], [,b]) => b - a)[0]

  // Only return if score is significant
  if (topFamily && topFamily[1] >= 1) {
    return topFamily[0]
  }

  return null
}

/**
 * Fix fragrance families using multiple strategies
 */
async function fixFragranceFamilies(dryRun: boolean = true): Promise<MigrationStats> {
  console.log(`🔄 ${dryRun ? '[DRY RUN]' : '[LIVE]'} Starting fragrance family migration...`)
  
  const stats: MigrationStats = {
    processed: 0,
    fixed: 0,
    failed: 0,
    skipped: 0,
    fixedByFamily: {}
  }

  // Phase 1: Fix records with null/empty fragrance families
  console.log('\n📋 Phase 1: Fixing null/empty fragrance families...')
  
  const { data: nullFamilyFragrances, error: nullError } = await supabase
    .from('fragrances')
    .select('id, name, brand_id, fragrance_family, top_notes, middle_notes, base_notes, main_accords')
    .or('fragrance_family.is.null,fragrance_family.eq.')
    .limit(500) // Process in batches

  if (nullError) {
    console.error('Error fetching null family fragrances:', nullError)
    return stats
  }

  if (nullFamilyFragrances && nullFamilyFragrances.length > 0) {
    console.log(`Found ${nullFamilyFragrances.length} fragrances with missing families`)

    for (const fragrance of nullFamilyFragrances) {
      stats.processed++

      try {
        // Try to infer from notes
        const inferredFamily = inferFamilyFromNotes(fragrance)
        
        if (inferredFamily) {
          const updateData = {
            fragrance_family: inferredFamily,
            family_inference_method: 'note_analysis',
            family_inference_confidence: 0.7,
            family_last_updated: new Date().toISOString()
          }

          if (!dryRun) {
            const { error: updateError } = await supabase
              .from('fragrances')
              .update(updateData)
              .eq('id', fragrance.id)

            if (updateError) {
              console.error(`Failed to update ${fragrance.id}:`, updateError)
              stats.failed++
              continue
            }
          }

          stats.fixed++
          stats.fixedByFamily[inferredFamily] = (stats.fixedByFamily[inferredFamily] || 0) + 1
          
          if (dryRun) {
            console.log(`  ${fragrance.brand_id}/${fragrance.name} → ${inferredFamily} (inferred)`)
          }
        } else {
          stats.skipped++
        }
      } catch (error) {
        console.error(`Error processing ${fragrance.id}:`, error)
        stats.failed++
      }
    }
  }

  // Phase 2: Fix records with invalid fragrance families
  console.log('\n📋 Phase 2: Fixing invalid fragrance families...')
  
  const { data: allFragrances, error: allError } = await supabase
    .from('fragrances')
    .select('id, name, brand_id, fragrance_family')
    .not('fragrance_family', 'is', null)
    .limit(1000)

  if (allError) {
    console.error('Error fetching all fragrances:', allError)
    return stats
  }

  if (allFragrances) {
    const invalidFragrances = allFragrances.filter(f => 
      f.fragrance_family && !validateFragranceFamily(f.fragrance_family)
    )

    console.log(`Found ${invalidFragrances.length} fragrances with invalid families`)

    for (const fragrance of invalidFragrances) {
      stats.processed++

      try {
        const suggestion = suggestFamilyCorrection(fragrance.fragrance_family)
        
        if (suggestion.suggestedFamily && suggestion.confidence >= 0.8) {
          const updateData = {
            fragrance_family: suggestion.suggestedFamily,
            family_inference_method: 'pattern_correction',
            family_inference_confidence: suggestion.confidence,
            family_last_updated: new Date().toISOString()
          }

          if (!dryRun) {
            const { error: updateError } = await supabase
              .from('fragrances')
              .update(updateData)
              .eq('id', fragrance.id)

            if (updateError) {
              console.error(`Failed to update ${fragrance.id}:`, updateError)
              stats.failed++
              continue
            }
          }

          stats.fixed++
          stats.fixedByFamily[suggestion.suggestedFamily] = (stats.fixedByFamily[suggestion.suggestedFamily] || 0) + 1
          
          if (dryRun) {
            console.log(`  ${fragrance.brand_id}/${fragrance.name}: "${fragrance.fragrance_family}" → "${suggestion.suggestedFamily}" (${suggestion.reason})`)
          }
        } else {
          stats.skipped++
          if (dryRun) {
            console.log(`  SKIP: ${fragrance.brand_id}/${fragrance.name} - "${fragrance.fragrance_family}" (no suitable correction)`)
          }
        }
      } catch (error) {
        console.error(`Error processing ${fragrance.id}:`, error)
        stats.failed++
      }
    }
  }

  return stats
}

function printMigrationReport(stats: MigrationStats, dryRun: boolean): void {
  console.log('\n' + '='.repeat(50))
  console.log(`📊 FRAGRANCE FAMILY MIGRATION REPORT ${dryRun ? '(DRY RUN)' : '(LIVE)'}`)
  console.log('='.repeat(50))
  
  console.log(`\n📈 SUMMARY`)
  console.log(`Total Processed: ${stats.processed}`)
  console.log(`Successfully Fixed: ${stats.fixed}`)
  console.log(`Failed: ${stats.failed}`)
  console.log(`Skipped: ${stats.skipped}`)
  console.log(`Success Rate: ${stats.processed > 0 ? (stats.fixed / stats.processed * 100).toFixed(1) : 0}%`)

  if (Object.keys(stats.fixedByFamily).length > 0) {
    console.log(`\n🔧 FIXES BY FAMILY`)
    Object.entries(stats.fixedByFamily)
      .sort(([,a], [,b]) => b - a)
      .forEach(([family, count]) => {
        console.log(`  ${family}: ${count} records`)
      })
  }

  if (dryRun && stats.fixed > 0) {
    console.log(`\n✅ DRY RUN COMPLETE`)
    console.log(`Run with --live flag to apply ${stats.fixed} changes`)
  } else if (!dryRun && stats.fixed > 0) {
    console.log(`\n✅ MIGRATION COMPLETE`)
    console.log(`Applied ${stats.fixed} changes to database`)
  }
}

async function main(): Promise<void> {
  const dryRun = !process.argv.includes('--live')
  
  if (!dryRun) {
    console.log('⚠️  WARNING: This will modify the database!')
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...')
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  try {
    const stats = await fixFragranceFamilies(dryRun)
    printMigrationReport(stats, dryRun)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration if called directly
if (require.main === module) {
  main()
}

export { fixFragranceFamilies }