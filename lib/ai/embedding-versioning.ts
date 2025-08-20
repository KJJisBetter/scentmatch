/**
 * Embedding Versioning and Model Migration System
 * 
 * Handles version tracking, model upgrades, and migration between 
 * different embedding models while maintaining compatibility.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getAIService } from './index';

// Types
export interface EmbeddingVersion {
  version: number;
  model: string;
  dimensions: number;
  created_at: Date;
  migration_reason?: string;
  performance_metrics?: {
    quality_score: number;
    cost_per_embedding: number;
    generation_time_ms: number;
  };
}

export interface MigrationPlan {
  from_model: string;
  to_model: string;
  from_version: number;
  to_version: number;
  affected_fragrances: number;
  estimated_cost: number;
  estimated_duration_minutes: number;
  compatibility_notes: string[];
}

export interface MigrationResult {
  success: boolean;
  migrated_count: number;
  failed_count: number;
  total_cost: number;
  duration_ms: number;
  errors: string[];
}

// Embedding Version Manager
export class EmbeddingVersionManager {
  private supabase: SupabaseClient;
  private currentVersion: number = 1;
  
  // Model specifications
  private modelSpecs = {
    'voyage-3-large': {
      dimensions: 2000, // pgvector compatibility limit
      cost_per_million: 0.18,
      quality_tier: 'premium',
      recommended_use: 'production'
    },
    'voyage-3.5': {
      dimensions: 2000, // Standardized to match
      cost_per_million: 0.06,
      quality_tier: 'standard',
      recommended_use: 'development'
    },
    'text-embedding-3-large': {
      dimensions: 2000, // Adjusted for compatibility
      cost_per_million: 0.13,
      quality_tier: 'standard',
      recommended_use: 'fallback'
    }
  };

  constructor(config: {
    supabase: SupabaseClient;
    currentVersion?: number;
  }) {
    this.supabase = config.supabase;
    this.currentVersion = config.currentVersion || 1;
  }

  async getEmbeddingVersionStats(): Promise<{
    total_embeddings: number;
    by_model: Record<string, number>;
    by_version: Record<number, number>;
    latest_version: number;
    outdated_count: number;
  }> {
    // Get all embeddings with their models and versions
    const { data: embeddings, error } = await this.supabase
      .from('fragrances')
      .select('embedding_model, embedding_version, embedding_generated_at')
      .not('embedding', 'is', null);

    if (error) {
      throw new Error(`Failed to get embedding stats: ${error.message}`);
    }

    const stats = {
      total_embeddings: embeddings?.length || 0,
      by_model: {},
      by_version: {},
      latest_version: this.currentVersion,
      outdated_count: 0
    };

    embeddings?.forEach(embedding => {
      // Count by model
      const model = embedding.embedding_model || 'unknown';
      stats.by_model[model] = (stats.by_model[model] || 0) + 1;

      // Count by version
      const version = embedding.embedding_version || 1;
      stats.by_version[version] = (stats.by_version[version] || 0) + 1;

      // Count outdated
      if (version < this.currentVersion) {
        stats.outdated_count++;
      }
    });

    return stats;
  }

  async planModelMigration(fromModel: string, toModel: string): Promise<MigrationPlan> {
    // Get fragrances using the old model
    const { data: affectedFragrances, error } = await this.supabase
      .from('fragrances')
      .select('id', { count: 'exact', head: true })
      .eq('embedding_model', fromModel);

    if (error) {
      throw new Error(`Failed to count affected fragrances: ${error.message}`);
    }

    const affectedCount = affectedFragrances || 0;
    const fromSpec = this.modelSpecs[fromModel];
    const toSpec = this.modelSpecs[toModel];

    if (!fromSpec || !toSpec) {
      throw new Error(`Unknown model specification: ${fromModel} or ${toModel}`);
    }

    // Calculate migration estimates
    const estimatedTokensPerFragrance = 30;
    const estimatedCost = affectedCount * estimatedTokensPerFragrance * (toSpec.cost_per_million / 1000000);
    const estimatedDurationMinutes = Math.ceil(affectedCount * 2 / 60); // 2 seconds per embedding

    // Check compatibility
    const compatibilityNotes = [];
    if (fromSpec.dimensions !== toSpec.dimensions) {
      compatibilityNotes.push(`Dimension change: ${fromSpec.dimensions} → ${toSpec.dimensions}`);
    }
    
    if (toSpec.cost_per_million > fromSpec.cost_per_million) {
      const costIncrease = ((toSpec.cost_per_million / fromSpec.cost_per_million - 1) * 100).toFixed(1);
      compatibilityNotes.push(`Cost increase: +${costIncrease}%`);
    }

    if (toSpec.quality_tier !== fromSpec.quality_tier) {
      compatibilityNotes.push(`Quality change: ${fromSpec.quality_tier} → ${toSpec.quality_tier}`);
    }

    return {
      from_model: fromModel,
      to_model: toModel,
      from_version: this.currentVersion,
      to_version: this.currentVersion + 1,
      affected_fragrances: affectedCount,
      estimated_cost: estimatedCost,
      estimated_duration_minutes: estimatedDurationMinutes,
      compatibility_notes: compatibilityNotes
    };
  }

  async executeMigration(plan: MigrationPlan, options: {
    dryRun?: boolean;
    batchSize?: number;
    progressCallback?: (progress: any) => void;
  } = {}): Promise<MigrationResult> {
    const startTime = Date.now();
    const batchSize = options.batchSize || 25;
    
    console.log(`🔄 ${options.dryRun ? 'DRY RUN: ' : ''}Migrating ${plan.affected_fragrances} embeddings`);
    console.log(`   From: ${plan.from_model} → ${plan.to_model}`);
    console.log(`   Estimated cost: $${plan.estimated_cost.toFixed(6)}`);
    console.log(`   Estimated time: ${plan.estimated_duration_minutes} minutes\n`);

    if (options.dryRun) {
      console.log('🧪 DRY RUN - No actual changes will be made\n');
    }

    const result: MigrationResult = {
      success: false,
      migrated_count: 0,
      failed_count: 0,
      total_cost: 0,
      duration_ms: 0,
      errors: []
    };

    try {
      const aiService = getAIService();
      let offset = 0;

      while (offset < plan.affected_fragrances) {
        console.log(`📦 Processing batch ${Math.ceil(offset / batchSize) + 1}/${Math.ceil(plan.affected_fragrances / batchSize)}`);

        // Get batch of fragrances to migrate
        const { data: fragrances, error: fetchError } = await this.supabase
          .from('fragrances')
          .select('id, name, brand_id, full_description, main_accords, fragrance_family, fragrance_brands(name)')
          .eq('embedding_model', plan.from_model)
          .range(offset, offset + batchSize - 1);

        if (fetchError) {
          result.errors.push(`Batch fetch failed: ${fetchError.message}`);
          break;
        }

        if (!fragrances || fragrances.length === 0) {
          break;
        }

        // Process each fragrance in batch
        for (const fragrance of fragrances) {
          try {
            if (!options.dryRun) {
              // Generate new embedding with target model
              const content = this.prepareFragranceContent(fragrance);
              const embeddingResult = await aiService.generateEmbedding(content);

              // Store new embedding with incremented version
              await this.storeEmbeddingVersion(fragrance.id, {
                embedding: embeddingResult.embedding,
                model: plan.to_model,
                version: plan.to_version,
                migration_reason: `Migrated from ${plan.from_model}`
              });

              result.total_cost += embeddingResult.cost || 0;
            }

            result.migrated_count++;
            console.log(`   ✅ ${fragrance.name}`);

          } catch (fragranceError) {
            result.failed_count++;
            result.errors.push(`${fragrance.name}: ${fragranceError.message}`);
            console.log(`   ❌ ${fragrance.name}: ${fragranceError.message}`);
          }
        }

        // Progress callback
        if (options.progressCallback) {
          options.progressCallback({
            processed: offset + fragrances.length,
            total: plan.affected_fragrances,
            percentage: Math.round(((offset + fragrances.length) / plan.affected_fragrances) * 100)
          });
        }

        offset += batchSize;

        // Delay between batches
        if (offset < plan.affected_fragrances && !options.dryRun) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      result.success = result.failed_count === 0;
      result.duration_ms = Date.now() - startTime;

      console.log(`\n📊 Migration ${options.dryRun ? 'Simulation ' : ''}Complete:`);
      console.log(`   ✅ Migrated: ${result.migrated_count}`);
      console.log(`   ❌ Failed: ${result.failed_count}`);
      if (!options.dryRun) {
        console.log(`   💰 Total cost: $${result.total_cost.toFixed(6)}`);
      }
      console.log(`   ⏱️  Duration: ${Math.round(result.duration_ms / 60000)} minutes`);

      return result;

    } catch (error) {
      result.errors.push(`Migration failed: ${error.message}`);
      result.duration_ms = Date.now() - startTime;
      return result;
    }
  }

  async rollbackToVersion(targetVersion: number, options: {
    dryRun?: boolean;
    reason?: string;
  } = {}): Promise<{
    success: boolean;
    affected_count: number;
    errors: string[];
  }> {
    console.log(`🔙 ${options.dryRun ? 'DRY RUN: ' : ''}Rolling back to version ${targetVersion}`);
    
    // Find embeddings newer than target version
    const { data: newerEmbeddings, error } = await this.supabase
      .from('fragrances')
      .select('id, embedding_version, embedding_model')
      .gt('embedding_version', targetVersion)
      .not('embedding', 'is', null);

    if (error) {
      return {
        success: false,
        affected_count: 0,
        errors: [`Failed to find rollback candidates: ${error.message}`]
      };
    }

    const affectedCount = newerEmbeddings?.length || 0;
    console.log(`   📊 Found ${affectedCount} embeddings to rollback`);

    if (affectedCount === 0) {
      return {
        success: true,
        affected_count: 0,
        errors: []
      };
    }

    if (options.dryRun) {
      console.log('🧪 DRY RUN - Would rollback these embeddings to version', targetVersion);
      return {
        success: true,
        affected_count: affectedCount,
        errors: []
      };
    }

    const errors = [];
    
    try {
      // Mark embeddings for regeneration at target version
      const { error: updateError } = await this.supabase
        .from('fragrances')
        .update({
          embedding_version: targetVersion,
          embedding_generated_at: new Date().toISOString()
        })
        .gt('embedding_version', targetVersion);

      if (updateError) {
        errors.push(`Rollback update failed: ${updateError.message}`);
      }

      // Log rollback reason
      await this.supabase
        .from('ai_processing_queue')
        .insert({
          task_type: 'version_rollback',
          task_data: {
            target_version: targetVersion,
            affected_count: affectedCount,
            reason: options.reason || 'Manual rollback',
            rollback_time: new Date().toISOString()
          },
          priority: 2
        });

      return {
        success: errors.length === 0,
        affected_count: affectedCount,
        errors
      };

    } catch (error) {
      return {
        success: false,
        affected_count: 0,
        errors: [`Rollback failed: ${error.message}`]
      };
    }
  }

  async getModelCompatibility(model1: string, model2: string): Promise<{
    compatible: boolean;
    dimension_match: boolean;
    quality_comparison: string;
    cost_comparison: string;
    migration_recommended: boolean;
    notes: string[];
  }> {
    const spec1 = this.modelSpecs[model1];
    const spec2 = this.modelSpecs[model2];

    if (!spec1 || !spec2) {
      return {
        compatible: false,
        dimension_match: false,
        quality_comparison: 'unknown',
        cost_comparison: 'unknown',
        migration_recommended: false,
        notes: [`Unknown model specification: ${model1} or ${model2}`]
      };
    }

    const dimensionMatch = spec1.dimensions === spec2.dimensions;
    const qualityComparison = this.compareQuality(spec1.quality_tier, spec2.quality_tier);
    const costComparison = this.compareCost(spec1.cost_per_million, spec2.cost_per_million);
    
    const migrationRecommended = 
      spec2.quality_tier === 'premium' && spec1.quality_tier !== 'premium' &&
      spec2.cost_per_million < spec1.cost_per_million * 2; // Cost increase <200%

    const notes = [];
    if (!dimensionMatch) {
      notes.push('Dimension mismatch requires vector adjustment');
    }
    
    if (spec2.cost_per_million > spec1.cost_per_million * 1.5) {
      notes.push('Significant cost increase - evaluate ROI');
    }

    return {
      compatible: dimensionMatch,
      dimension_match: dimensionMatch,
      quality_comparison: qualityComparison,
      cost_comparison: costComparison,
      migration_recommended: migrationRecommended,
      notes
    };
  }

  async createMigrationCheckpoint(description: string): Promise<string> {
    // Create a checkpoint before major changes
    const checkpointData = {
      description,
      timestamp: new Date().toISOString(),
      embedding_stats: await this.getEmbeddingVersionStats(),
      system_health: await this.getSystemHealth()
    };

    const { data: checkpoint, error } = await this.supabase
      .from('ai_processing_queue')
      .insert({
        task_type: 'migration_checkpoint',
        task_data: checkpointData,
        priority: 1
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create checkpoint: ${error.message}`);
    }

    console.log(`💾 Created migration checkpoint: ${checkpoint.id}`);
    return checkpoint.id;
  }

  async validateEmbeddingIntegrity(): Promise<{
    valid: boolean;
    total_checked: number;
    dimension_mismatches: number;
    null_embeddings: number;
    version_inconsistencies: number;
    issues: string[];
  }> {
    console.log('🔍 Validating embedding integrity...');

    const issues = [];
    let dimensionMismatches = 0;
    let nullEmbeddings = 0;
    let versionInconsistencies = 0;

    try {
      // Check for null embeddings that should exist
      const { data: nullCount } = await this.supabase
        .from('fragrances')
        .select('id', { count: 'exact', head: true })
        .is('embedding', null)
        .not('embedding_model', 'is', null); // Should have model but no embedding

      nullEmbeddings = nullCount || 0;
      if (nullEmbeddings > 0) {
        issues.push(`${nullEmbeddings} fragrances have embedding_model but null embedding`);
      }

      // Check for version inconsistencies
      const { data: versionIssues } = await this.supabase
        .from('fragrances')
        .select('id, embedding_version, embedding_model')
        .not('embedding', 'is', null)
        .or('embedding_version.is.null,embedding_version.lt.1');

      versionInconsistencies = versionIssues?.length || 0;
      if (versionInconsistencies > 0) {
        issues.push(`${versionInconsistencies} fragrances have invalid embedding versions`);
      }

      // Sample dimension check (check a few embeddings)
      const { data: sampleEmbeddings } = await this.supabase
        .from('fragrances')
        .select('id, embedding, embedding_model')
        .not('embedding', 'is', null)
        .limit(10);

      if (sampleEmbeddings) {
        sampleEmbeddings.forEach(fragrance => {
          if (fragrance.embedding) {
            const dimensions = fragrance.embedding.length || 0;
            const expectedDimensions = this.modelSpecs[fragrance.embedding_model]?.dimensions || 2000;
            
            if (dimensions !== expectedDimensions) {
              dimensionMismatches++;
            }
          }
        });

        if (dimensionMismatches > 0) {
          issues.push(`${dimensionMismatches} sampled embeddings have dimension mismatches`);
        }
      }

      const totalChecked = (sampleEmbeddings?.length || 0) + nullEmbeddings + versionInconsistencies;
      const isValid = issues.length === 0;

      return {
        valid: isValid,
        total_checked: totalChecked,
        dimension_mismatches: dimensionMismatches,
        null_embeddings: nullEmbeddings,
        version_inconsistencies: versionInconsistencies,
        issues
      };

    } catch (error) {
      return {
        valid: false,
        total_checked: 0,
        dimension_mismatches: 0,
        null_embeddings: 0,
        version_inconsistencies: 0,
        issues: [`Validation failed: ${error.message}`]
      };
    }
  }

  private async storeEmbeddingVersion(fragranceId: string, versionData: {
    embedding: number[];
    model: string;
    version: number;
    migration_reason?: string;
  }): Promise<void> {
    // Ensure 2000 dimensions for pgvector compatibility
    let finalEmbedding = versionData.embedding;
    if (finalEmbedding.length > 2000) {
      finalEmbedding = finalEmbedding.slice(0, 2000);
    } else if (finalEmbedding.length < 2000) {
      finalEmbedding = [...finalEmbedding, ...Array(2000 - finalEmbedding.length).fill(0)];
    }

    const { error } = await this.supabase
      .from('fragrances')
      .update({
        embedding: `[${finalEmbedding.join(',')}]`,
        embedding_model: versionData.model,
        embedding_version: versionData.version,
        embedding_generated_at: new Date().toISOString()
      })
      .eq('id', fragranceId);

    if (error) {
      throw new Error(`Failed to store embedding version: ${error.message}`);
    }

    // Log migration if specified
    if (versionData.migration_reason) {
      await this.supabase
        .from('ai_processing_queue')
        .insert({
          task_type: 'embedding_migration',
          task_data: {
            fragrance_id: fragranceId,
            from_version: versionData.version - 1,
            to_version: versionData.version,
            model: versionData.model,
            reason: versionData.migration_reason
          },
          priority: 8
        });
    }
  }

  private prepareFragranceContent(fragrance: any): string {
    const parts = [];
    
    const brandName = fragrance.fragrance_brands?.name || 'Unknown Brand';
    parts.push(`${brandName} ${fragrance.name}`);
    
    if (fragrance.full_description) {
      parts.push(fragrance.full_description);
    }
    
    if (fragrance.main_accords && Array.isArray(fragrance.main_accords)) {
      parts.push(`Accords: ${fragrance.main_accords.join(', ')}`);
    }
    
    if (fragrance.fragrance_family) {
      parts.push(`Family: ${fragrance.fragrance_family}`);
    }
    
    return parts.join('. ');
  }

  private compareQuality(tier1: string, tier2: string): string {
    const qualityOrder = { 'premium': 3, 'standard': 2, 'basic': 1 };
    const score1 = qualityOrder[tier1] || 1;
    const score2 = qualityOrder[tier2] || 1;

    if (score2 > score1) return 'upgrade';
    if (score2 < score1) return 'downgrade';
    return 'same';
  }

  private compareCost(cost1: number, cost2: number): string {
    const ratio = cost2 / cost1;
    
    if (ratio > 1.2) return 'significant_increase';
    if (ratio > 1.05) return 'increase';
    if (ratio < 0.8) return 'significant_decrease';
    if (ratio < 0.95) return 'decrease';
    return 'similar';
  }

  private async getSystemHealth(): Promise<any> {
    try {
      const aiService = getAIService();
      return await aiService.getSystemHealth();
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

// Batch Job Progress Tracker
export class BatchJobTracker {
  private supabase: SupabaseClient;
  private jobId: string;
  private startTime: Date;

  constructor(config: {
    supabase: SupabaseClient;
    jobId: string;
  }) {
    this.supabase = config.supabase;
    this.jobId = config.jobId;
    this.startTime = new Date();
  }

  async updateProgress(progress: {
    processed: number;
    total: number;
    successful: number;
    failed: number;
    current_cost: number;
  }): Promise<void> {
    const percentage = Math.round((progress.processed / progress.total) * 100);
    const elapsed = Date.now() - this.startTime.getTime();
    const estimatedTotal = progress.processed > 0 ? (elapsed / progress.processed) * progress.total : 0;
    const estimatedCompletion = new Date(this.startTime.getTime() + estimatedTotal);

    const progressData = {
      processed: progress.processed,
      total: progress.total,
      successful: progress.successful,
      failed: progress.failed,
      percentage: percentage,
      current_cost: progress.current_cost,
      estimated_completion: estimatedCompletion.toISOString(),
      last_updated: new Date().toISOString()
    };

    await this.supabase
      .from('ai_processing_queue')
      .update({
        task_data: progressData,
        status: percentage === 100 ? 'completed' : 'processing'
      })
      .eq('id', this.jobId);
  }

  async getProgress(): Promise<{
    job_id: string;
    percentage: number;
    status: string;
    processed: number;
    total: number;
    estimated_completion: Date;
    current_cost: number;
  }> {
    const { data: job, error } = await this.supabase
      .from('ai_processing_queue')
      .select('task_data, status')
      .eq('id', this.jobId)
      .single();

    if (error || !job) {
      throw new Error(`Job not found: ${this.jobId}`);
    }

    const progress = job.task_data || {};
    
    return {
      job_id: this.jobId,
      percentage: progress.percentage || 0,
      status: job.status,
      processed: progress.processed || 0,
      total: progress.total || 0,
      estimated_completion: progress.estimated_completion ? new Date(progress.estimated_completion) : new Date(),
      current_cost: progress.current_cost || 0
    };
  }
}

// Export for testing and use
export { EmbeddingVersionManager, BatchJobTracker };