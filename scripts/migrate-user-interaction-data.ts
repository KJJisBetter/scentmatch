/**
 * Migrate User Interaction Data to AI Tracking System
 * 
 * Migrates existing user collection and interaction data to the new
 * AI-powered tracking system while preserving all historical data.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

interface MigrationStats {
  migration_id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  tables_migrated: string[];
  records_processed: {
    user_collections: number;
    user_fragrance_interactions: number;
    total_migrated_interactions: number;
  };
  user_stats: {
    total_users_processed: number;
    authenticated_users: number;
    guest_sessions: number;
    users_with_ratings: number;
    users_with_collections: number;
  };
  errors: MigrationError[];
  performance: {
    duration_ms: number;
    records_per_second: number;
    peak_memory_mb: number;
  };
}

interface MigrationError {
  table: string;
  record_id: string;
  error_type: string;
  error_message: string;
  timestamp: string;
  retry_count: number;
}

interface LegacyUserCollection {
  id: number;
  user_id: string | null;
  guest_session_id: string | null;
  fragrance_id: string;
  collection_type: 'saved' | 'owned' | 'wishlist' | 'tried';
  rating: number | null;
  notes: string | null;
  purchase_date: string | null;
  sample_tried: boolean;
  created_at: string;
  updated_at: string;
}

interface LegacyUserInteraction {
  id: number;
  user_id: string | null;
  guest_session_id: string | null;
  fragrance_id: string;
  interaction_type: 'view' | 'like' | 'sample_order' | 'full_purchase' | 'review';
  interaction_data: any;
  session_context: any;
  created_at: string;
}

export class UserInteractionMigration {
  private supabase: ReturnType<typeof createClient<Database>>;
  private migrationId: string;
  private stats: MigrationStats;
  private batchSize = 100;
  private maxRetries = 3;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.migrationId = `migration_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    this.stats = this.initializeStats();
  }

  private initializeStats(): MigrationStats {
    return {
      migration_id: this.migrationId,
      started_at: new Date().toISOString(),
      status: 'running',
      tables_migrated: [],
      records_processed: {
        user_collections: 0,
        user_fragrance_interactions: 0,
        total_migrated_interactions: 0
      },
      user_stats: {
        total_users_processed: 0,
        authenticated_users: 0,
        guest_sessions: 0,
        users_with_ratings: 0,
        users_with_collections: 0
      },
      errors: [],
      performance: {
        duration_ms: 0,
        records_per_second: 0,
        peak_memory_mb: 0
      }
    };
  }

  /**
   * Execute complete migration
   */
  async executeMigration(): Promise<MigrationStats> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Starting user interaction data migration: ${this.migrationId}`);
      
      // Step 1: Validate prerequisites
      await this.validatePrerequisites();
      
      // Step 2: Migrate user collections to new interaction tracking
      await this.migrateUserCollections();
      
      // Step 3: Migrate existing fragrance interactions
      await this.migrateFragranceInteractions();
      
      // Step 4: Generate session data for guest users
      await this.processGuestSessions();
      
      // Step 5: Validate migration results
      await this.validateMigrationResults();
      
      // Complete migration
      this.stats.status = 'completed';
      this.stats.completed_at = new Date().toISOString();
      this.stats.performance.duration_ms = Date.now() - startTime;
      this.stats.performance.records_per_second = this.stats.records_processed.total_migrated_interactions / (this.stats.performance.duration_ms / 1000);
      
      // Log migration to AI processing queue
      await this.logMigrationCompletion();
      
      console.log(`✅ Migration completed successfully!`);
      this.printMigrationSummary();
      
      return this.stats;
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.stats.status = 'failed';
      this.stats.completed_at = new Date().toISOString();
      this.recordError('migration', 'general', 'migration_failed', error instanceof Error ? error.message : String(error));
      
      throw error;
    }
  }

  /**
   * Validate migration prerequisites
   */
  private async validatePrerequisites(): Promise<void> {
    console.log('🔍 Validating migration prerequisites...');
    
    // Check that AI enhancement tables exist
    const requiredTables = ['user_preferences', 'user_interactions', 'ai_processing_queue'];
    
    for (const table of requiredTables) {
      const { data: tableExists, error } = await this.supabase
        .from(table as any)
        .select('id')
        .limit(1);
        
      if (error) {
        throw new Error(`Required table '${table}' not found or accessible: ${error.message}`);
      }
    }
    
    // Check that source tables exist and are accessible
    const sourceTables = ['user_collections', 'user_fragrance_interactions'];
    
    for (const table of sourceTables) {
      const { data: tableExists, error } = await this.supabase
        .from(table as any)
        .select('id')
        .limit(1);
        
      if (error) {
        console.warn(`⚠️ Source table '${table}' not accessible, will skip: ${error.message}`);
      }
    }
    
    console.log('✅ Prerequisites validated');
  }

  /**
   * Migrate user collections to new interaction tracking system
   */
  private async migrateUserCollections(): Promise<void> {
    console.log('📦 Migrating user collections...');
    
    try {
      let offset = 0;
      let totalMigrated = 0;
      let hasMore = true;

      while (hasMore) {
        // Get batch of user collections
        const { data: collections, error } = await this.supabase
          .from('user_collections' as any)
          .select('*')
          .range(offset, offset + this.batchSize - 1)
          .order('created_at');

        if (error) {
          console.warn(`⚠️ Could not access user_collections: ${error.message}`);
          break;
        }

        if (!collections || collections.length === 0) {
          hasMore = false;
          break;
        }

        // Process batch
        const migratedCount = await this.processCollectionBatch(collections as LegacyUserCollection[]);
        totalMigrated += migratedCount;
        offset += this.batchSize;

        console.log(`   Processed ${collections.length} collections (${totalMigrated} total)`);
        
        // Update memory usage estimate
        this.updateMemoryUsage();
      }

      this.stats.records_processed.user_collections = totalMigrated;
      this.stats.tables_migrated.push('user_collections');
      
      console.log(`✅ Migrated ${totalMigrated} user collection entries`);
      
    } catch (error) {
      this.recordError('user_collections', 'batch', 'migration_failed', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private async processCollectionBatch(collections: LegacyUserCollection[]): Promise<number> {
    const interactions: any[] = [];
    const processedUsers = new Set<string>();
    
    for (const collection of collections) {
      try {
        const userId = collection.user_id || collection.guest_session_id || 'anonymous';
        processedUsers.add(userId);
        
        // Create collection_add interaction
        interactions.push({
          user_id: userId,
          fragrance_id: collection.fragrance_id,
          interaction_type: 'collection_add',
          interaction_value: 1,
          interaction_context: {
            collection_type: collection.collection_type,
            migration_source: 'user_collections',
            original_id: collection.id,
            original_created_at: collection.created_at,
            sample_tried: collection.sample_tried,
            purchase_date: collection.purchase_date
          },
          session_id: this.generateSessionId(userId, collection.created_at),
          created_at: collection.created_at
        });

        // Create rating interaction if rating exists
        if (collection.rating) {
          interactions.push({
            user_id: userId,
            fragrance_id: collection.fragrance_id,
            interaction_type: 'rating',
            interaction_value: collection.rating,
            interaction_context: {
              notes: collection.notes,
              collection_type: collection.collection_type,
              migration_source: 'user_collections',
              original_id: collection.id
            },
            session_id: this.generateSessionId(userId, collection.created_at),
            created_at: collection.created_at
          });
          
          this.stats.user_stats.users_with_ratings++;
        }

        // Create specific interactions based on collection type
        if (collection.collection_type === 'owned' && collection.purchase_date) {
          interactions.push({
            user_id: userId,
            fragrance_id: collection.fragrance_id,
            interaction_type: 'purchase_intent',
            interaction_value: 1,
            interaction_context: {
              purchase_date: collection.purchase_date,
              migration_source: 'user_collections'
            },
            session_id: this.generateSessionId(userId, collection.purchase_date),
            created_at: collection.purchase_date
          });
        }

        if (collection.collection_type === 'tried' && collection.sample_tried) {
          interactions.push({
            user_id: userId,
            fragrance_id: collection.fragrance_id,
            interaction_type: 'sample_tried',
            interaction_value: 1,
            interaction_context: {
              migration_source: 'user_collections',
              led_to_purchase: collection.collection_type === 'owned'
            },
            session_id: this.generateSessionId(userId, collection.created_at),
            created_at: collection.created_at
          });
        }

      } catch (error) {
        this.recordError('user_collections', String(collection.id), 'processing_failed', error instanceof Error ? error.message : String(error));
      }
    }

    // Batch insert interactions
    if (interactions.length > 0) {
      const { error } = await this.supabase
        .from('user_interactions')
        .insert(interactions);

      if (error) {
        this.recordError('user_collections', 'batch_insert', 'insert_failed', error.message);
        throw error;
      }
    }

    // Update user stats
    this.stats.user_stats.total_users_processed += processedUsers.size;
    this.stats.user_stats.users_with_collections += collections.length;
    this.stats.records_processed.total_migrated_interactions += interactions.length;

    return interactions.length;
  }

  /**
   * Migrate existing fragrance interactions
   */
  private async migrateFragranceInteractions(): Promise<void> {
    console.log('🔄 Migrating fragrance interactions...');
    
    try {
      let offset = 0;
      let totalMigrated = 0;
      let hasMore = true;

      while (hasMore) {
        // Get batch of interactions
        const { data: interactions, error } = await this.supabase
          .from('user_fragrance_interactions' as any)
          .select('*')
          .range(offset, offset + this.batchSize - 1)
          .order('created_at');

        if (error) {
          console.warn(`⚠️ Could not access user_fragrance_interactions: ${error.message}`);
          break;
        }

        if (!interactions || interactions.length === 0) {
          hasMore = false;
          break;
        }

        // Process batch
        const migratedCount = await this.processInteractionBatch(interactions as LegacyUserInteraction[]);
        totalMigrated += migratedCount;
        offset += this.batchSize;

        console.log(`   Processed ${interactions.length} interactions (${totalMigrated} total)`);
      }

      this.stats.records_processed.user_fragrance_interactions = totalMigrated;
      this.stats.tables_migrated.push('user_fragrance_interactions');
      
      console.log(`✅ Migrated ${totalMigrated} fragrance interaction entries`);
      
    } catch (error) {
      this.recordError('user_fragrance_interactions', 'batch', 'migration_failed', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private async processInteractionBatch(interactions: LegacyUserInteraction[]): Promise<number> {
    const newInteractions: any[] = [];
    const processedUsers = new Set<string>();
    
    for (const interaction of interactions) {
      try {
        const userId = interaction.user_id || interaction.guest_session_id || 'anonymous';
        processedUsers.add(userId);
        
        // Map legacy interaction types to new tracking system
        const mappedInteraction = this.mapLegacyInteraction(interaction);
        if (mappedInteraction) {
          newInteractions.push(mappedInteraction);
        }

      } catch (error) {
        this.recordError('user_fragrance_interactions', String(interaction.id), 'mapping_failed', error instanceof Error ? error.message : String(error));
      }
    }

    // Batch insert new interactions
    if (newInteractions.length > 0) {
      const { error } = await this.supabase
        .from('user_interactions')
        .insert(newInteractions);

      if (error) {
        this.recordError('user_fragrance_interactions', 'batch_insert', 'insert_failed', error.message);
        throw error;
      }
    }

    // Update user stats
    this.stats.user_stats.total_users_processed += processedUsers.size;
    this.stats.records_processed.total_migrated_interactions += newInteractions.length;

    return newInteractions.length;
  }

  private mapLegacyInteraction(legacy: LegacyUserInteraction): any | null {
    const userId = legacy.user_id || legacy.guest_session_id || 'anonymous';
    
    // Map interaction types
    const interactionTypeMap: Record<string, string> = {
      'view': 'view',
      'like': 'favorite',
      'sample_order': 'sample_order',
      'full_purchase': 'purchase_intent',
      'review': 'rating'
    };

    const newInteractionType = interactionTypeMap[legacy.interaction_type];
    if (!newInteractionType) {
      return null; // Skip unknown interaction types
    }

    // Calculate interaction value based on type
    let interactionValue = 1;
    if (legacy.interaction_type === 'view') {
      interactionValue = legacy.interaction_data?.duration || 1000; // Default 1 second
    } else if (legacy.interaction_type === 'review' && legacy.interaction_data?.rating) {
      interactionValue = legacy.interaction_data.rating;
    }

    return {
      user_id: userId,
      fragrance_id: legacy.fragrance_id,
      interaction_type: newInteractionType,
      interaction_value: interactionValue,
      interaction_context: {
        ...legacy.interaction_data,
        session_context: legacy.session_context,
        migration_source: 'user_fragrance_interactions',
        original_id: legacy.id,
        original_interaction_type: legacy.interaction_type
      },
      session_id: this.generateSessionId(userId, legacy.created_at),
      created_at: legacy.created_at
    };
  }

  /**
   * Process guest sessions to create pseudo-user preference models
   */
  private async processGuestSessions(): Promise<void> {
    console.log('👻 Processing guest session data...');
    
    try {
      // Get unique guest sessions
      const { data: guestSessions, error } = await this.supabase
        .from('user_interactions')
        .select('user_id')
        .like('user_id', 'guest_%')
        .neq('user_id', 'anonymous');

      if (error) throw error;

      const uniqueGuestSessions = new Set(guestSessions?.map(i => i.user_id) || []);
      
      for (const guestId of uniqueGuestSessions) {
        try {
          await this.createGuestPreferenceModel(guestId);
          this.stats.user_stats.guest_sessions++;
        } catch (error) {
          this.recordError('guest_sessions', guestId, 'preference_model_failed', error instanceof Error ? error.message : String(error));
        }
      }
      
      console.log(`✅ Processed ${uniqueGuestSessions.size} guest sessions`);
      
    } catch (error) {
      this.recordError('guest_sessions', 'batch', 'processing_failed', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private async createGuestPreferenceModel(guestId: string): Promise<void> {
    // Get guest's interactions
    const { data: interactions, error } = await this.supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', guestId);

    if (error || !interactions || interactions.length === 0) return;

    // Simple preference model for guests based on their interactions
    const preferenceStrength = Math.min(interactions.length / 10, 0.8); // Cap at 0.8 for guests
    
    const { error: insertError } = await this.supabase
      .from('user_preferences')
      .insert({
        user_id: guestId,
        user_embedding: null, // Will be calculated later
        preference_strength: preferenceStrength,
        interaction_count: interactions.length,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (insertError && !insertError.message.includes('duplicate')) {
      throw insertError;
    }
  }

  /**
   * Validate migration results
   */
  private async validateMigrationResults(): Promise<void> {
    console.log('✅ Validating migration results...');
    
    try {
      // Count migrated interactions
      const { count: totalInteractions, error: countError } = await this.supabase
        .from('user_interactions')
        .select('*', { count: 'exact', head: true })
        .ilike('interaction_context->>migration_source', '%user_%');

      if (countError) throw countError;

      // Count unique users with interactions
      const { data: uniqueUsers, error: usersError } = await this.supabase
        .from('user_interactions')
        .select('user_id')
        .ilike('interaction_context->>migration_source', '%user_%');

      if (usersError) throw usersError;

      const uniqueUserCount = new Set(uniqueUsers?.map(u => u.user_id) || []).size;

      // Validate key metrics
      if ((totalInteractions || 0) < this.stats.records_processed.total_migrated_interactions * 0.9) {
        throw new Error(`Migration validation failed: Expected ${this.stats.records_processed.total_migrated_interactions} interactions, found ${totalInteractions}`);
      }

      // Update stats
      this.stats.user_stats.total_users_processed = uniqueUserCount;
      this.stats.user_stats.authenticated_users = uniqueUserCount - this.stats.user_stats.guest_sessions;

      console.log(`✅ Migration validation passed:`);
      console.log(`   - Total interactions: ${totalInteractions}`);
      console.log(`   - Unique users: ${uniqueUserCount}`);
      console.log(`   - Guest sessions: ${this.stats.user_stats.guest_sessions}`);
      
    } catch (error) {
      this.recordError('validation', 'general', 'validation_failed', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Generate session ID for historical data
   */
  private generateSessionId(userId: string, timestamp: string): string {
    const date = new Date(timestamp);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const hour = date.getHours();
    
    // Group interactions within 4-hour windows as same session
    const sessionWindow = Math.floor(hour / 4);
    
    return `migration_${userId}_${dateStr}_${sessionWindow}`;
  }

  /**
   * Log migration completion to AI processing queue
   */
  private async logMigrationCompletion(): Promise<void> {
    try {
      await this.supabase
        .from('ai_processing_queue')
        .insert({
          task_type: 'migration_complete',
          task_data: {
            migration_id: this.migrationId,
            migration_type: 'user_interaction_data',
            stats: this.stats,
            completion_timestamp: new Date().toISOString()
          },
          priority: 10,
          status: 'completed'
        });
    } catch (error) {
      console.warn('⚠️ Failed to log migration completion:', error);
    }
  }

  private recordError(table: string, recordId: string, errorType: string, errorMessage: string): void {
    this.stats.errors.push({
      table,
      record_id: recordId,
      error_type: errorType,
      error_message: errorMessage,
      timestamp: new Date().toISOString(),
      retry_count: 0
    });
  }

  private updateMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const memMB = memUsage.heapUsed / 1024 / 1024;
      this.stats.performance.peak_memory_mb = Math.max(this.stats.performance.peak_memory_mb, memMB);
    }
  }

  private printMigrationSummary(): void {
    console.log('\n📊 Migration Summary:');
    console.log('=====================================');
    console.log(`Migration ID: ${this.stats.migration_id}`);
    console.log(`Status: ${this.stats.status}`);
    console.log(`Duration: ${(this.stats.performance.duration_ms / 1000).toFixed(2)}s`);
    console.log(`Records/second: ${this.stats.performance.records_per_second.toFixed(2)}`);
    console.log(`\nRecords Processed:`);
    console.log(`  - User Collections: ${this.stats.records_processed.user_collections}`);
    console.log(`  - User Interactions: ${this.stats.records_processed.user_fragrance_interactions}`);
    console.log(`  - Total Migrated: ${this.stats.records_processed.total_migrated_interactions}`);
    console.log(`\nUser Statistics:`);
    console.log(`  - Total Users: ${this.stats.user_stats.total_users_processed}`);
    console.log(`  - Authenticated: ${this.stats.user_stats.authenticated_users}`);
    console.log(`  - Guest Sessions: ${this.stats.user_stats.guest_sessions}`);
    console.log(`  - Users with Ratings: ${this.stats.user_stats.users_with_ratings}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  Errors Encountered: ${this.stats.errors.length}`);
      this.stats.errors.slice(0, 5).forEach(error => {
        console.log(`  - ${error.table}:${error.record_id} - ${error.error_type}`);
      });
    }
    console.log('=====================================\n');
  }

  /**
   * Create migration rollback plan
   */
  async createRollbackPlan(): Promise<any> {
    const rollbackPlan = {
      rollback_id: `rollback_${this.migrationId}`,
      migration_id: this.migrationId,
      created_at: new Date().toISOString(),
      rollback_steps: [
        {
          step: 1,
          description: 'Remove migrated interactions',
          sql: `DELETE FROM user_interactions WHERE interaction_context->>'migration_source' LIKE 'user_%'`,
          estimated_records: this.stats.records_processed.total_migrated_interactions
        },
        {
          step: 2,
          description: 'Remove guest session preference models',
          sql: `DELETE FROM user_preferences WHERE user_id LIKE 'guest_%'`,
          estimated_records: this.stats.user_stats.guest_sessions
        },
        {
          step: 3,
          description: 'Clean up migration log entries',
          sql: `DELETE FROM ai_processing_queue WHERE task_data->>'migration_id' = '${this.migrationId}'`,
          estimated_records: 1
        }
      ],
      total_records_to_remove: this.stats.records_processed.total_migrated_interactions + this.stats.user_stats.guest_sessions + 1
    };

    // Save rollback plan
    const fs = require('fs');
    const path = require('path');
    const rollbackPath = path.join(process.cwd(), 'backups', `rollback_${this.migrationId}.json`);
    fs.writeFileSync(rollbackPath, JSON.stringify(rollbackPlan, null, 2));

    console.log(`📋 Rollback plan created: ${rollbackPath}`);
    return rollbackPlan;
  }

  /**
   * Execute rollback (for testing or recovery)
   */
  async executeRollback(rollbackPlanPath: string): Promise<boolean> {
    try {
      const fs = require('fs');
      const rollbackPlan = JSON.parse(fs.readFileSync(rollbackPlanPath, 'utf8'));
      
      console.log(`🔄 Executing rollback for migration: ${rollbackPlan.migration_id}`);
      
      for (const step of rollbackPlan.rollback_steps) {
        console.log(`   Step ${step.step}: ${step.description}`);
        
        const { error } = await this.supabase.rpc('execute_sql', { query: step.sql });
        
        if (error) {
          console.error(`❌ Rollback step ${step.step} failed:`, error);
          return false;
        }
        
        console.log(`   ✅ Removed ~${step.estimated_records} records`);
      }
      
      console.log(`✅ Rollback completed successfully`);
      return true;
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return false;
    }
  }

  /**
   * Get migration statistics
   */
  getStats(): MigrationStats {
    return { ...this.stats };
  }
}

/**
 * Utility functions for migration
 */
export class MigrationUtilities {
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Verify migration prerequisites
   */
  async verifyMigrationPrerequisites(): Promise<{
    ready: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check if AI enhancement migration was applied
      const { data: fragranceColumns, error: columnError } = await this.supabase.rpc('get_table_columns', {
        table_name: 'fragrances'
      });

      if (columnError || !fragranceColumns?.some(c => c.column_name === 'embedding')) {
        issues.push('AI enhancement database migration not applied');
        recommendations.push('Run: npm run migrate:ai-enhancement');
      }

      // Check embedding coverage
      const { data: embeddingStats, error: embeddingError } = await this.supabase
        .from('fragrances')
        .select('id, embedding')
        .limit(100);

      if (embeddingError) {
        issues.push('Cannot access fragrance embeddings');
      } else {
        const withEmbeddings = embeddingStats?.filter(f => f.embedding).length || 0;
        const total = embeddingStats?.length || 0;
        const coverage = total > 0 ? withEmbeddings / total : 0;

        if (coverage < 0.9) {
          issues.push(`Low embedding coverage: ${(coverage * 100).toFixed(1)}%`);
          recommendations.push('Run embedding regeneration first');
        }
      }

      // Check for existing migration data
      const { data: existingMigrations, error: migrationError } = await this.supabase
        .from('ai_processing_queue')
        .select('*')
        .eq('task_type', 'migration_complete')
        .ilike('task_data->>migration_type', '%user_interaction%');

      if (migrationError) {
        issues.push('Cannot check existing migration status');
      } else if (existingMigrations && existingMigrations.length > 0) {
        recommendations.push('User interaction migration may have already been performed - check logs');
      }

      return {
        ready: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      return {
        ready: false,
        issues: ['Failed to verify prerequisites: ' + (error instanceof Error ? error.message : String(error))],
        recommendations: ['Check database connectivity and permissions']
      };
    }
  }

  /**
   * Estimate migration scope
   */
  async estimateMigrationScope(): Promise<{
    estimated_records: number;
    estimated_duration_minutes: number;
    estimated_new_interactions: number;
    user_breakdown: {
      total_users: number;
      authenticated_users: number;
      guest_sessions: number;
    };
  }> {
    try {
      // Count source records
      const [collectionsResult, interactionsResult] = await Promise.allSettled([
        this.supabase.from('user_collections' as any).select('*', { count: 'exact', head: true }),
        this.supabase.from('user_fragrance_interactions' as any).select('*', { count: 'exact', head: true })
      ]);

      const collectionsCount = collectionsResult.status === 'fulfilled' ? collectionsResult.value.count || 0 : 0;
      const interactionsCount = interactionsResult.status === 'fulfilled' ? interactionsResult.value.count || 0 : 0;

      // Estimate new interactions (collections generate 1-3 interactions each)
      const estimatedNewInteractions = (collectionsCount * 2) + interactionsCount;

      // Estimate duration (based on processing ~50 records/second)
      const estimatedDurationMinutes = Math.ceil(estimatedNewInteractions / 50 / 60);

      return {
        estimated_records: collectionsCount + interactionsCount,
        estimated_duration_minutes: estimatedDurationMinutes,
        estimated_new_interactions: estimatedNewInteractions,
        user_breakdown: {
          total_users: 0, // Would need to query for actual count
          authenticated_users: 0,
          guest_sessions: 0
        }
      };

    } catch (error) {
      return {
        estimated_records: 0,
        estimated_duration_minutes: 0,
        estimated_new_interactions: 0,
        user_breakdown: {
          total_users: 0,
          authenticated_users: 0,
          guest_sessions: 0
        }
      };
    }
  }
}

// Export factory functions
export const createUserInteractionMigration = (supabaseUrl?: string, supabaseKey?: string) => {
  return new UserInteractionMigration(supabaseUrl, supabaseKey);
};

export const createMigrationUtilities = (supabaseUrl?: string, supabaseKey?: string) => {
  return new MigrationUtilities(supabaseUrl, supabaseKey);
};

// CLI interface
if (require.main === module) {
  (async () => {
    try {
      const migration = createUserInteractionMigration();
      
      console.log('🔍 Checking migration prerequisites...');
      const utils = createMigrationUtilities();
      const prerequisites = await utils.verifyMigrationPrerequisites();
      
      if (!prerequisites.ready) {
        console.error('❌ Migration prerequisites not met:');
        prerequisites.issues.forEach(issue => console.error(`   - ${issue}`));
        console.log('\n💡 Recommendations:');
        prerequisites.recommendations.forEach(rec => console.log(`   - ${rec}`));
        process.exit(1);
      }
      
      console.log('✅ Prerequisites verified');
      
      // Get migration estimate
      const estimate = await utils.estimateMigrationScope();
      console.log('\n📊 Migration Estimate:');
      console.log(`   - Records to process: ${estimate.estimated_records}`);
      console.log(`   - New interactions: ${estimate.estimated_new_interactions}`);
      console.log(`   - Estimated duration: ${estimate.estimated_duration_minutes} minutes`);
      
      // Execute migration
      console.log('\n🚀 Starting migration...');
      const stats = await migration.executeMigration();
      
      // Create rollback plan
      await migration.createRollbackPlan();
      
      console.log('\n🎉 Migration completed successfully!');
      
    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    }
  })();
}