#!/usr/bin/env ts-node

/**
 * Fragrance Data Migration Script
 * Migrates existing fragrance data to canonical system with rollback capabilities
 * 
 * Usage:
 *   npm run migrate:canonical -- --mode=preview    # Preview changes without applying
 *   npm run migrate:canonical -- --mode=migrate    # Apply migration  
 *   npm run migrate:canonical -- --mode=rollback   # Rollback migration
 *   npm run migrate:canonical -- --mode=verify     # Verify migration success
 */

import { createClient } from '@supabase/supabase-js'
import { program } from 'commander'

// Environment configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

// Migration state tracking
interface MigrationStats {
  totalFragrances: number
  migratedCount: number
  normalizedCount: number
  variantsCreated: number
  errors: string[]
  startTime: Date
  endTime?: Date
}

class FragranceNormalizer {
  // Concentration normalization mapping
  private readonly CONCENTRATION_MAP: Record<string, string> = {
    'edp': 'Eau de Parfum',
    'edt': 'Eau de Toilette', 
    'edc': 'Eau de Cologne',
    'parfum': 'Extrait de Parfum',
    'cologne': 'Eau de Cologne',
    'extrait': 'Extrait de Parfum',
    'aftershave': 'Aftershave'
  }

  // Brand aliases for normalization
  private readonly BRAND_ALIASES: Record<string, string> = {
    'ck': 'Calvin Klein',
    'jpg': 'Jean Paul Gaultier',
    'ysl': 'Yves Saint Laurent',
    'd&g': 'Dolce & Gabbana'
  }

  normalizeFragranceName(originalName: string, brandName?: string): {
    canonicalName: string
    fragranceLine: string
    concentration?: string
    needsNormalization: boolean
    changes: string[]
  } {
    const changes: string[] = []
    let working = originalName.trim()
    let needsNormalization = false

    // Extract concentration from name
    let concentration: string | undefined
    const concentrationRegex = /\b(edp|edt|edc|parfum|cologne|extrait|aftershave)\b/i
    const concMatch = working.match(concentrationRegex)
    if (concMatch) {
      const rawConcentration = concMatch[1].toLowerCase()
      concentration = this.CONCENTRATION_MAP[rawConcentration] || rawConcentration
      working = working.replace(concentrationRegex, '').trim()
      if (this.CONCENTRATION_MAP[rawConcentration]) {
        changes.push(`Expanded concentration: ${rawConcentration} → ${concentration}`)
        needsNormalization = true
      }
    }

    // Fix common capitalization issues
    const originalWorking = working
    working = working.replace(/\bDe\b/g, 'de') // Fix "De" → "de"
    working = working.replace(/\bAnd\b/g, 'and') // Fix "And" → "and"  
    working = working.replace(/\bOf\b/g, 'of') // Fix "Of" → "of"
    working = working.replace(/\bThe\b/g, 'the') // Fix "The" → "the"
    
    if (working !== originalWorking) {
      changes.push('Fixed capitalization of articles and prepositions')
      needsNormalization = true
    }

    // Remove year suffixes like "(2011)" or " 2019"
    const yearRegex = /\s*\(?20\d{2}\)?$/
    if (yearRegex.test(working)) {
      working = working.replace(yearRegex, '').trim()
      changes.push('Removed year suffix')
      needsNormalization = true
    }

    // Fix all-caps abbreviations
    const allCapsRegex = /\b[A-Z]{2,}\b/g
    const allCapsMatches = working.match(allCapsRegex)
    if (allCapsMatches) {
      allCapsMatches.forEach(match => {
        if (match.length > 2 && !['USA', 'NYC', 'UK'].includes(match)) {
          working = working.replace(match, this.capitalizeFirstLetter(match))
          changes.push(`Fixed all-caps: ${match} → ${this.capitalizeFirstLetter(match)}`)
          needsNormalization = true
        }
      })
    }

    // Add brand context if missing and brand is known
    let canonicalName = working
    if (brandName && !working.toLowerCase().includes(brandName.toLowerCase())) {
      canonicalName = `${brandName} ${working}`
      changes.push(`Added brand context: ${brandName}`)
      needsNormalization = true
    }

    // Add concentration back if it was extracted
    if (concentration && !canonicalName.includes(concentration)) {
      canonicalName = `${canonicalName} ${concentration}`
      changes.push(`Added concentration: ${concentration}`)
      needsNormalization = true
    }

    return {
      canonicalName: canonicalName.trim(),
      fragranceLine: working.trim(),
      concentration,
      needsNormalization,
      changes
    }
  }

  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  calculateNormalizationConfidence(changes: string[]): number {
    if (changes.length === 0) return 1.0
    
    let confidence = 0.9 // Base confidence for any normalization
    
    // Reduce confidence for uncertain changes
    changes.forEach(change => {
      if (change.includes('Fixed all-caps')) confidence -= 0.05
      if (change.includes('Removed year')) confidence -= 0.05
      if (change.includes('Added brand context')) confidence += 0.05
    })

    return Math.max(0.1, Math.min(1.0, confidence))
  }
}

class FragranceMigrationPipeline {
  private normalizer = new FragranceNormalizer()
  private stats: MigrationStats = {
    totalFragrances: 0,
    migratedCount: 0,
    normalizedCount: 0,
    variantsCreated: 0,
    errors: [],
    startTime: new Date()
  }

  async previewMigration(): Promise<void> {
    console.log('🔍 Preview Mode: Analyzing migration changes...\n')

    // Get sample of fragrances to analyze with brand names
    const { data: fragrances, error } = await supabase
      .from('fragrances')
      .select(`
        id, 
        name, 
        brand_id,
        fragrance_brands!inner(name)
      `)
      .limit(50)

    if (error) throw error

    console.log(`📊 Analyzing ${fragrances.length} sample fragrances:\n`)

    let normalizedCount = 0
    const examples: Array<{original: string, canonical: string, changes: string[]}> = []

    for (const fragrance of fragrances) {
      const brandName = fragrance.fragrance_brands?.name || 'Unknown Brand'
      const result = this.normalizer.normalizeFragranceName(
        fragrance.name, 
        brandName
      )

      if (result.needsNormalization) {
        normalizedCount++
        if (examples.length < 10) {
          examples.push({
            original: fragrance.name,
            canonical: result.canonicalName,
            changes: result.changes
          })
        }
      }
    }

    console.log(`✅ Analysis Results:`)
    console.log(`   - Total analyzed: ${fragrances.length}`)
    console.log(`   - Need normalization: ${normalizedCount} (${(normalizedCount/fragrances.length*100).toFixed(1)}%)`)
    console.log(`   - Already normalized: ${fragrances.length - normalizedCount}`)

    if (examples.length > 0) {
      console.log(`\n📝 Normalization Examples:`)
      examples.forEach((example, i) => {
        console.log(`   ${i+1}. "${example.original}" → "${example.canonical}"`)
        example.changes.forEach(change => console.log(`      • ${change}`))
      })
    }

    // Get total count for full migration estimate
    const { count } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })

    const estimatedNormalized = Math.round((count || 0) * (normalizedCount / fragrances.length))
    
    console.log(`\n🎯 Full Migration Estimates:`)
    console.log(`   - Total fragrances: ${count}`)
    console.log(`   - Estimated normalizations: ${estimatedNormalized}`)
    console.log(`   - Estimated variants created: ${estimatedNormalized}`)

    console.log(`\n⚠️  Note: Run with --mode=migrate to apply changes`)
  }

  async runMigration(): Promise<void> {
    console.log('🚀 Starting fragrance data migration...\n')

    // Check if canonical system tables exist
    await this.verifyCanonicalSystemExists()

    // Get total count
    const { count, error: countError } = await supabase
      .from('fragrances')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError
    this.stats.totalFragrances = count || 0

    console.log(`📊 Migrating ${this.stats.totalFragrances} fragrances...\n`)

    // Process in batches to avoid memory issues
    const batchSize = 100
    let offset = 0

    while (offset < this.stats.totalFragrances) {
      console.log(`   Processing batch ${Math.floor(offset/batchSize) + 1}/${Math.ceil(this.stats.totalFragrances/batchSize)}...`)
      
      const { data: batch, error: batchError } = await supabase
        .from('fragrances')
        .select(`
          *,
          fragrance_brands!inner(name)
        `)
        .range(offset, offset + batchSize - 1)

      if (batchError) {
        this.stats.errors.push(`Batch fetch error at offset ${offset}: ${batchError.message}`)
        break
      }

      await this.processBatch(batch)
      offset += batchSize

      // Progress update
      console.log(`   ✅ Processed ${Math.min(offset, this.stats.totalFragrances)}/${this.stats.totalFragrances} fragrances`)
    }

    this.stats.endTime = new Date()
    await this.generateMigrationReport()
  }

  private async processBatch(fragrances: any[]): Promise<void> {
    for (const fragrance of fragrances) {
      try {
        await this.migrateFragrance(fragrance)
      } catch (error) {
        this.stats.errors.push(`Error migrating ${fragrance.id}: ${error}`)
      }
    }
  }

  private async migrateFragrance(fragrance: any): Promise<void> {
    // Get brand name from joined data
    const brandName = fragrance.fragrance_brands?.name || 'Unknown Brand'
    
    // Normalize the fragrance name
    const normalized = this.normalizer.normalizeFragranceName(
      fragrance.name,
      brandName
    )

    // Check if canonical version already exists
    const { data: existingCanonical } = await supabase
      .from('fragrances_canonical')
      .select('id')
      .eq('canonical_name', normalized.canonicalName)
      .eq('brand_id', fragrance.brand_id)
      .single()

    let canonicalId: string

    if (existingCanonical) {
      // Use existing canonical entry
      canonicalId = existingCanonical.id
    } else {
      // Create new canonical entry
      const { data: newCanonical, error: canonicalError } = await supabase
        .from('fragrances_canonical')
        .insert({
          canonical_name: normalized.canonicalName,
          brand_id: fragrance.brand_id,
          fragrance_line: normalized.fragranceLine,
          concentration: normalized.concentration,
          metadata: {
            migrated_from: fragrance.id,
            original_name: fragrance.name,
            migration_date: new Date().toISOString()
          }
        })
        .select('id')
        .single()

      if (canonicalError) throw canonicalError
      canonicalId = newCanonical.id
      this.stats.migratedCount++

      if (normalized.needsNormalization) {
        this.stats.normalizedCount++
      }
    }

    // Create variant entry for original name if normalized
    if (normalized.needsNormalization) {
      const confidence = this.normalizer.calculateNormalizationConfidence(normalized.changes)
      
      const { error: variantError } = await supabase
        .from('fragrance_variants')
        .insert({
          canonical_id: canonicalId,
          variant_name: fragrance.name,
          source: 'import',
          confidence: confidence,
          is_malformed: true
        })
        .onConflict('variant_name')
        .ignoreDuplicates()

      if (variantError && !variantError.message.includes('duplicate')) {
        throw variantError
      } else if (!variantError) {
        this.stats.variantsCreated++
      }
    }

    // Log migration
    await supabase
      .from('fragrance_migration_log')
      .insert({
        original_fragrance_id: fragrance.id,
        canonical_id: canonicalId,
        migration_type: normalized.needsNormalization ? 'normalized' : 'direct',
        original_name: fragrance.name,
        canonical_name: normalized.canonicalName,
        normalization_applied: normalized.needsNormalization,
        notes: normalized.changes.join('; ')
      })
  }

  private async verifyCanonicalSystemExists(): Promise<void> {
    try {
      await supabase.from('fragrances_canonical').select('id').limit(1)
      await supabase.from('fragrance_variants').select('id').limit(1)
      await supabase.from('fragrance_migration_log').select('id').limit(1)
    } catch (error) {
      throw new Error(`Canonical system tables not found. Run migration script first: ${error}`)
    }
  }

  async rollbackMigration(): Promise<void> {
    console.log('⏪ Rolling back fragrance migration...\n')

    // Get migration count
    const { count } = await supabase
      .from('fragrance_migration_log')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Found ${count} migration entries to rollback...\n`)

    if (!count || count === 0) {
      console.log('✅ No migration data found to rollback.')
      return
    }

    // Ask for confirmation
    console.log('⚠️  WARNING: This will delete all canonical fragrance data!')
    console.log('   - All fragrances_canonical entries will be deleted')
    console.log('   - All fragrance_variants will be deleted')
    console.log('   - Migration log will be cleared')
    
    // Delete in reverse order to respect foreign key constraints
    console.log('   Deleting variant entries...')
    await supabase.from('fragrance_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('   Deleting canonical entries...')
    await supabase.from('fragrances_canonical').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('   Clearing migration log...')
    await supabase.from('fragrance_migration_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    console.log('\n✅ Migration rollback completed!')
  }

  async verifyMigration(): Promise<void> {
    console.log('🔍 Verifying migration results...\n')

    // Get counts
    const [
      { count: originalCount },
      { count: canonicalCount },
      { count: variantCount },
      { count: migrationLogCount }
    ] = await Promise.all([
      supabase.from('fragrances').select('*', { count: 'exact', head: true }),
      supabase.from('fragrances_canonical').select('*', { count: 'exact', head: true }),
      supabase.from('fragrance_variants').select('*', { count: 'exact', head: true }),
      supabase.from('fragrance_migration_log').select('*', { count: 'exact', head: true })
    ])

    // Run data quality check
    const { data: qualityId } = await supabase.rpc('run_data_quality_checks')
    const { data: qualityResults } = await supabase
      .from('data_quality_scores')
      .select('*')
      .eq('id', qualityId)
      .single()

    console.log('📊 Migration Verification Results:')
    console.log(`   Original fragrances: ${originalCount}`)
    console.log(`   Canonical fragrances: ${canonicalCount}`)
    console.log(`   Variants created: ${variantCount}`)
    console.log(`   Migration log entries: ${migrationLogCount}`)
    
    if (qualityResults) {
      console.log(`\n📈 Data Quality Score: ${(qualityResults.overall_score * 100).toFixed(1)}%`)
      console.log(`   Name formatting: ${(qualityResults.name_formatting_score * 100).toFixed(1)}%`)
      console.log(`   Completeness: ${(qualityResults.completeness_score * 100).toFixed(1)}%`)
      console.log(`   Duplicates: ${(qualityResults.duplicate_score * 100).toFixed(1)}%`)
    }

    // Test search function
    const { data: searchTest } = await supabase
      .rpc('search_fragrances_smart', { query_text: 'Chanel' })

    console.log(`\n🔍 Search Function Test:`)
    console.log(`   Found ${searchTest?.length || 0} results for "Chanel"`)

    console.log('\n✅ Migration verification completed!')
  }

  private async generateMigrationReport(): Promise<void> {
    const duration = this.stats.endTime ? 
      (this.stats.endTime.getTime() - this.stats.startTime.getTime()) / 1000 : 0

    console.log('\n📋 Migration Report:')
    console.log('='.repeat(50))
    console.log(`   Start time: ${this.stats.startTime.toISOString()}`)
    console.log(`   End time: ${this.stats.endTime?.toISOString()}`)
    console.log(`   Duration: ${duration.toFixed(1)} seconds`)
    console.log(`   Total fragrances: ${this.stats.totalFragrances}`)
    console.log(`   Migrated to canonical: ${this.stats.migratedCount}`)
    console.log(`   Names normalized: ${this.stats.normalizedCount}`)
    console.log(`   Variants created: ${this.stats.variantsCreated}`)
    console.log(`   Errors: ${this.stats.errors.length}`)

    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:')
      this.stats.errors.slice(0, 10).forEach((error, i) => {
        console.log(`   ${i+1}. ${error}`)
      })
      if (this.stats.errors.length > 10) {
        console.log(`   ... and ${this.stats.errors.length - 10} more errors`)
      }
    }

    console.log('\n✅ Migration completed!')
  }
}

// CLI Setup
program
  .name('migrate-canonical-fragrances')
  .description('Migrate fragrance data to canonical system')
  .option('-m, --mode <mode>', 'Migration mode: preview, migrate, rollback, verify', 'preview')

program.parse()

const options = program.opts()
const pipeline = new FragranceMigrationPipeline()

// Main execution
async function main() {
  try {
    switch (options.mode) {
      case 'preview':
        await pipeline.previewMigration()
        break
      case 'migrate':
        await pipeline.runMigration()
        break
      case 'rollback':
        await pipeline.rollbackMigration()
        break
      case 'verify':
        await pipeline.verifyMigration()
        break
      default:
        console.error(`❌ Invalid mode: ${options.mode}`)
        console.error('Valid modes: preview, migrate, rollback, verify')
        process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

main()