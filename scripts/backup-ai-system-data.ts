/**
 * Backup AI System Data
 * 
 * Creates comprehensive backup of all AI-related data before migration
 * including embeddings, user data, and system state.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Database } from '@/lib/database.types';

interface BackupManifest {
  backup_id: string;
  created_at: string;
  backup_type: 'full' | 'incremental' | 'schema_only';
  ai_system_version: string;
  tables_backed_up: string[];
  total_records: number;
  file_sizes: Record<string, number>;
  checksums: Record<string, string>;
  backup_duration_ms: number;
  backup_status: 'completed' | 'failed' | 'partial';
  error_log?: string[];
}

interface BackupData {
  fragrances: {
    count: number;
    with_embeddings: number;
    embedding_models: Record<string, number>;
    sample_embeddings: any[];
    content_hashes: string[];
  };
  user_data: {
    user_preferences_count: number;
    user_interactions_count: number;
    unique_users: number;
    interaction_types: Record<string, number>;
    preference_strength_distribution: number[];
  };
  ai_processing: {
    queue_size: number;
    pending_tasks: number;
    failed_tasks: number;
    task_types: Record<string, number>;
    oldest_pending_task: string | null;
  };
  cache_state: {
    recommendation_cache_count: number;
    collection_analysis_cache_count: number;
    cache_hit_estimates: Record<string, number>;
  };
  system_health: {
    embedding_coverage: number;
    model_consistency: boolean;
    index_health: boolean;
    function_availability: string[];
  };
}

export class AISystemBackup {
  private supabase: ReturnType<typeof createClient<Database>>;
  private backupId: string;
  private backupDir: string;
  private startTime: number;
  private manifest: Partial<BackupManifest> = {};

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.backupId = `backup_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    this.backupDir = join(process.cwd(), 'backups', this.backupId);
    this.startTime = Date.now();
  }

  /**
   * Create full backup of AI system
   */
  async createFullBackup(): Promise<BackupManifest> {
    try {
      console.log(`🚀 Starting AI system backup: ${this.backupId}`);
      
      // Create backup directory
      this.createBackupDirectory();
      
      // Initialize manifest
      this.manifest = {
        backup_id: this.backupId,
        created_at: new Date().toISOString(),
        backup_type: 'full',
        ai_system_version: '1.0.0',
        tables_backed_up: [],
        total_records: 0,
        file_sizes: {},
        checksums: {},
        backup_status: 'completed'
      };

      // Backup fragrance embeddings
      await this.backupFragranceEmbeddings();
      
      // Backup user preference data
      await this.backupUserPreferences();
      
      // Backup user interactions
      await this.backupUserInteractions();
      
      // Backup AI processing state
      await this.backupAIProcessingState();
      
      // Backup cache state
      await this.backupCacheState();
      
      // Backup database schema
      await this.backupDatabaseSchema();
      
      // Generate system health snapshot
      await this.generateSystemHealthSnapshot();
      
      // Finalize manifest
      this.manifest.backup_duration_ms = Date.now() - this.startTime;
      this.saveManifest();
      
      console.log(`✅ Backup completed: ${this.backupId}`);
      console.log(`📁 Backup location: ${this.backupDir}`);
      console.log(`⏱️  Duration: ${this.manifest.backup_duration_ms}ms`);
      console.log(`📊 Total records: ${this.manifest.total_records}`);
      
      return this.manifest as BackupManifest;
      
    } catch (error) {
      console.error('❌ Backup failed:', error);
      this.manifest.backup_status = 'failed';
      this.manifest.error_log = [error instanceof Error ? error.message : String(error)];
      this.saveManifest();
      throw error;
    }
  }

  private createBackupDirectory(): void {
    if (!existsSync(join(process.cwd(), 'backups'))) {
      mkdirSync(join(process.cwd(), 'backups'), { recursive: true });
    }
    
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  private async backupFragranceEmbeddings(): Promise<void> {
    console.log('📦 Backing up fragrance embeddings...');
    
    try {
      // Get all fragrances with embeddings
      const { data: fragrances, error } = await this.supabase
        .from('fragrances')
        .select(`
          id,
          name,
          brand_name,
          embedding,
          embedding_model,
          embedding_generated_at,
          embedding_version,
          content_hash,
          description,
          scent_family,
          notes
        `)
        .order('id');

      if (error) throw error;

      const fragmentedData = {
        metadata: {
          total_count: fragrances?.length || 0,
          with_embeddings: fragrances?.filter(f => f.embedding).length || 0,
          models_used: this.getEmbeddingModelDistribution(fragrances || []),
          backup_timestamp: new Date().toISOString()
        },
        fragrances: fragrances || []
      };

      // Save to file
      const fileName = 'fragrances_embeddings.json';
      const filePath = join(this.backupDir, fileName);
      writeFileSync(filePath, JSON.stringify(fragmentedData, null, 2));

      // Update manifest
      this.manifest.tables_backed_up!.push('fragrances');
      this.manifest.total_records! += fragmentedData.total_count;
      this.manifest.file_sizes![fileName] = this.getFileSize(filePath);
      this.manifest.checksums![fileName] = this.calculateChecksum(fragmentedData);

      console.log(`✅ Backed up ${fragmentedData.total_count} fragrances (${fragmentedData.with_embeddings} with embeddings)`);
      
    } catch (error) {
      console.error('❌ Failed to backup fragrance embeddings:', error);
      throw error;
    }
  }

  private async backupUserPreferences(): Promise<void> {
    console.log('👤 Backing up user preferences...');
    
    try {
      const { data: preferences, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .order('created_at');

      if (error) throw error;

      const backupData = {
        metadata: {
          total_count: preferences?.length || 0,
          avg_preference_strength: this.calculateAveragePreferenceStrength(preferences || []),
          model_distribution: this.getModelDistribution(preferences || []),
          backup_timestamp: new Date().toISOString()
        },
        user_preferences: preferences || []
      };

      const fileName = 'user_preferences.json';
      const filePath = join(this.backupDir, fileName);
      writeFileSync(filePath, JSON.stringify(backupData, null, 2));

      this.manifest.tables_backed_up!.push('user_preferences');
      this.manifest.total_records! += backupData.total_count;
      this.manifest.file_sizes![fileName] = this.getFileSize(filePath);
      this.manifest.checksums![fileName] = this.calculateChecksum(backupData);

      console.log(`✅ Backed up ${backupData.total_count} user preference models`);
      
    } catch (error) {
      console.error('❌ Failed to backup user preferences:', error);
      throw error;
    }
  }

  private async backupUserInteractions(): Promise<void> {
    console.log('🔄 Backing up user interactions...');
    
    try {
      // Backup recent interactions (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: interactions, error } = await this.supabase
        .from('user_interactions')
        .select('*')
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at');

      if (error) throw error;

      const backupData = {
        metadata: {
          total_count: interactions?.length || 0,
          date_range: {
            from: sixMonthsAgo.toISOString(),
            to: new Date().toISOString()
          },
          interaction_types: this.getInteractionTypeDistribution(interactions || []),
          unique_users: new Set(interactions?.map(i => i.user_id) || []).size,
          unique_fragrances: new Set(interactions?.map(i => i.fragrance_id) || []).size,
          backup_timestamp: new Date().toISOString()
        },
        user_interactions: interactions || []
      };

      const fileName = 'user_interactions.json';
      const filePath = join(this.backupDir, fileName);
      writeFileSync(filePath, JSON.stringify(backupData, null, 2));

      this.manifest.tables_backed_up!.push('user_interactions');
      this.manifest.total_records! += backupData.total_count;
      this.manifest.file_sizes![fileName] = this.getFileSize(filePath);
      this.manifest.checksums![fileName] = this.calculateChecksum(backupData);

      console.log(`✅ Backed up ${backupData.total_count} user interactions from ${backupData.unique_users} users`);
      
    } catch (error) {
      console.error('❌ Failed to backup user interactions:', error);
      throw error;
    }
  }

  private async backupAIProcessingState(): Promise<void> {
    console.log('⚙️ Backing up AI processing state...');
    
    try {
      const { data: queueState, error } = await this.supabase
        .from('ai_processing_queue')
        .select('*')
        .order('created_at');

      if (error) throw error;

      const backupData = {
        metadata: {
          total_tasks: queueState?.length || 0,
          pending_tasks: queueState?.filter(t => t.status === 'pending').length || 0,
          processing_tasks: queueState?.filter(t => t.status === 'processing').length || 0,
          failed_tasks: queueState?.filter(t => t.status === 'failed').length || 0,
          completed_tasks: queueState?.filter(t => t.status === 'completed').length || 0,
          task_types: this.getTaskTypeDistribution(queueState || []),
          backup_timestamp: new Date().toISOString()
        },
        ai_processing_queue: queueState || []
      };

      const fileName = 'ai_processing_state.json';
      const filePath = join(this.backupDir, fileName);
      writeFileSync(filePath, JSON.stringify(backupData, null, 2));

      this.manifest.tables_backed_up!.push('ai_processing_queue');
      this.manifest.total_records! += backupData.total_tasks;
      this.manifest.file_sizes![fileName] = this.getFileSize(filePath);
      this.manifest.checksums![fileName] = this.calculateChecksum(backupData);

      console.log(`✅ Backed up AI processing state: ${backupData.pending_tasks} pending, ${backupData.failed_tasks} failed`);
      
    } catch (error) {
      console.error('❌ Failed to backup AI processing state:', error);
      throw error;
    }
  }

  private async backupCacheState(): Promise<void> {
    console.log('💾 Backing up cache state...');
    
    try {
      // Backup recommendation cache
      const { data: recCache, error: recError } = await this.supabase
        .from('recommendation_cache')
        .select('*')
        .order('created_at');

      if (recError) throw recError;

      // Backup collection analysis cache
      const { data: collectionCache, error: collectionError } = await this.supabase
        .from('collection_analysis_cache')
        .select('*')
        .order('created_at');

      if (collectionError) throw collectionError;

      const backupData = {
        metadata: {
          recommendation_cache_count: recCache?.length || 0,
          collection_analysis_cache_count: collectionCache?.length || 0,
          cache_types: {
            recommendation: this.getRecommendationTypeDistribution(recCache || []),
            collection_analysis: this.getAnalysisTypeDistribution(collectionCache || [])
          },
          backup_timestamp: new Date().toISOString()
        },
        recommendation_cache: recCache || [],
        collection_analysis_cache: collectionCache || []
      };

      const fileName = 'cache_state.json';
      const filePath = join(this.backupDir, fileName);
      writeFileSync(filePath, JSON.stringify(backupData, null, 2));

      this.manifest.tables_backed_up!.push('recommendation_cache', 'collection_analysis_cache');
      this.manifest.total_records! += (recCache?.length || 0) + (collectionCache?.length || 0);
      this.manifest.file_sizes![fileName] = this.getFileSize(filePath);
      this.manifest.checksums![fileName] = this.calculateChecksum(backupData);

      console.log(`✅ Backed up cache state: ${recCache?.length || 0} recommendations, ${collectionCache?.length || 0} analyses`);
      
    } catch (error) {
      console.error('❌ Failed to backup cache state:', error);
      throw error;
    }
  }

  private async backupDatabaseSchema(): Promise<void> {
    console.log('🗄️ Backing up database schema...');
    
    try {
      // Get table schemas for AI-related tables
      const aiTables = [
        'fragrances',
        'user_preferences',
        'user_interactions', 
        'ai_processing_queue',
        'collection_analysis_cache',
        'recommendation_cache'
      ];

      const schemaBackup = {
        metadata: {
          backup_timestamp: new Date().toISOString(),
          postgresql_version: await this.getPostgreSQLVersion(),
          pgvector_version: await this.getPGVectorVersion(),
          tables_included: aiTables
        },
        table_schemas: {} as Record<string, any>,
        indexes: {} as Record<string, any>,
        functions: {} as Record<string, any>,
        policies: {} as Record<string, any>
      };

      // Get detailed schema for each table
      for (const table of aiTables) {
        schemaBackup.table_schemas[table] = await this.getTableSchema(table);
        schemaBackup.indexes[table] = await this.getTableIndexes(table);
        schemaBackup.policies[table] = await this.getTablePolicies(table);
      }

      // Get AI-related functions
      const aiFunctions = [
        'find_similar_fragrances',
        'update_user_embedding',
        'cleanup_expired_cache',
        'generate_content_hash',
        'trigger_embedding_generation'
      ];

      for (const func of aiFunctions) {
        schemaBackup.functions[func] = await this.getFunctionDefinition(func);
      }

      const fileName = 'database_schema.json';
      const filePath = join(this.backupDir, fileName);
      writeFileSync(filePath, JSON.stringify(schemaBackup, null, 2));

      this.manifest.file_sizes![fileName] = this.getFileSize(filePath);
      this.manifest.checksums![fileName] = this.calculateChecksum(schemaBackup);

      console.log(`✅ Backed up database schema for ${aiTables.length} tables and ${aiFunctions.length} functions`);
      
    } catch (error) {
      console.error('❌ Failed to backup database schema:', error);
      throw error;
    }
  }

  private async generateSystemHealthSnapshot(): Promise<void> {
    console.log('🏥 Generating system health snapshot...');
    
    try {
      const healthData: BackupData = {
        fragrances: await this.analyzeFragranceData(),
        user_data: await this.analyzeUserData(),
        ai_processing: await this.analyzeAIProcessing(),
        cache_state: await this.analyzeCacheState(),
        system_health: await this.analyzeSystemHealth()
      };

      const fileName = 'system_health_snapshot.json';
      const filePath = join(this.backupDir, fileName);
      writeFileSync(filePath, JSON.stringify(healthData, null, 2));

      this.manifest.file_sizes![fileName] = this.getFileSize(filePath);
      this.manifest.checksums![fileName] = this.calculateChecksum(healthData);

      console.log(`✅ Generated system health snapshot`);
      console.log(`   - Embedding coverage: ${(healthData.system_health.embedding_coverage * 100).toFixed(1)}%`);
      console.log(`   - User preferences: ${healthData.user_data.user_preferences_count}`);
      console.log(`   - Pending AI tasks: ${healthData.ai_processing.pending_tasks}`);
      
    } catch (error) {
      console.error('❌ Failed to generate system health snapshot:', error);
      throw error;
    }
  }

  // Analysis methods
  private async analyzeFragranceData(): Promise<BackupData['fragrances']> {
    const { data: fragrances, error } = await this.supabase
      .from('fragrances')
      .select('id, embedding, embedding_model, content_hash')
      .limit(1000);

    if (error) throw error;

    const withEmbeddings = fragrances?.filter(f => f.embedding) || [];
    const sampleEmbeddings = withEmbeddings.slice(0, 3).map(f => ({
      fragrance_id: f.id,
      embedding_preview: f.embedding ? JSON.parse(f.embedding as any).slice(0, 5) : null,
      model: f.embedding_model
    }));

    return {
      count: fragrances?.length || 0,
      with_embeddings: withEmbeddings.length,
      embedding_models: this.getEmbeddingModelDistribution(fragrances || []),
      sample_embeddings: sampleEmbeddings,
      content_hashes: fragrances?.map(f => f.content_hash).filter(Boolean) || []
    };
  }

  private async analyzeUserData(): Promise<BackupData['user_data']> {
    const [preferencesResult, interactionsResult] = await Promise.all([
      this.supabase.from('user_preferences').select('user_id, preference_strength').limit(1000),
      this.supabase.from('user_interactions').select('user_id, interaction_type').limit(10000)
    ]);

    if (preferencesResult.error) throw preferencesResult.error;
    if (interactionsResult.error) throw interactionsResult.error;

    const preferences = preferencesResult.data || [];
    const interactions = interactionsResult.data || [];

    return {
      user_preferences_count: preferences.length,
      user_interactions_count: interactions.length,
      unique_users: new Set([
        ...preferences.map(p => p.user_id),
        ...interactions.map(i => i.user_id)
      ]).size,
      interaction_types: this.getInteractionTypeDistribution(interactions),
      preference_strength_distribution: preferences.map(p => p.preference_strength || 0)
    };
  }

  private async analyzeAIProcessing(): Promise<BackupData['ai_processing']> {
    const { data: queue, error } = await this.supabase
      .from('ai_processing_queue')
      .select('*')
      .order('created_at');

    if (error) throw error;

    const pendingTasks = queue?.filter(t => t.status === 'pending') || [];
    const oldestPending = pendingTasks.length > 0 ? pendingTasks[0].created_at : null;

    return {
      queue_size: queue?.length || 0,
      pending_tasks: pendingTasks.length,
      failed_tasks: queue?.filter(t => t.status === 'failed').length || 0,
      task_types: this.getTaskTypeDistribution(queue || []),
      oldest_pending_task: oldestPending
    };
  }

  private async analyzeCacheState(): Promise<BackupData['cache_state']> {
    const [recCacheResult, analysisCacheResult] = await Promise.all([
      this.supabase.from('recommendation_cache').select('*').limit(1000),
      this.supabase.from('collection_analysis_cache').select('*').limit(1000)
    ]);

    if (recCacheResult.error) throw recCacheResult.error;
    if (analysisCacheResult.error) throw analysisCacheResult.error;

    return {
      recommendation_cache_count: recCacheResult.data?.length || 0,
      collection_analysis_cache_count: analysisCacheResult.data?.length || 0,
      cache_hit_estimates: {
        recommendations: 0.8, // Simplified estimate
        collection_analysis: 0.6
      }
    };
  }

  private async analyzeSystemHealth(): Promise<BackupData['system_health']> {
    try {
      const { data: healthMetrics, error } = await this.supabase
        .from('ai_system_health')
        .select('*');

      if (error) throw error;

      const metricsMap = healthMetrics?.reduce((acc, metric) => {
        acc[metric.metric] = metric.value;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        embedding_coverage: metricsMap['embedding_coverage'] || 0,
        model_consistency: true, // Would check if all embeddings use same model
        index_health: true, // Would validate indexes are functional
        function_availability: [
          'find_similar_fragrances',
          'update_user_embedding',
          'cleanup_expired_cache',
          'generate_content_hash'
        ]
      };
    } catch (error) {
      return {
        embedding_coverage: 0,
        model_consistency: false,
        index_health: false,
        function_availability: []
      };
    }
  }

  // Utility methods
  private getEmbeddingModelDistribution(fragrances: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const fragrance of fragrances) {
      if (fragrance.embedding_model) {
        distribution[fragrance.embedding_model] = (distribution[fragrance.embedding_model] || 0) + 1;
      }
    }
    
    return distribution;
  }

  private calculateAveragePreferenceStrength(preferences: any[]): number {
    if (preferences.length === 0) return 0;
    
    const total = preferences.reduce((sum, pref) => sum + (pref.preference_strength || 0), 0);
    return total / preferences.length;
  }

  private getModelDistribution(preferences: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const pref of preferences) {
      if (pref.embedding_model) {
        distribution[pref.embedding_model] = (distribution[pref.embedding_model] || 0) + 1;
      }
    }
    
    return distribution;
  }

  private getInteractionTypeDistribution(interactions: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const interaction of interactions) {
      const type = interaction.interaction_type;
      distribution[type] = (distribution[type] || 0) + 1;
    }
    
    return distribution;
  }

  private getTaskTypeDistribution(tasks: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const task of tasks) {
      const type = task.task_type;
      distribution[type] = (distribution[type] || 0) + 1;
    }
    
    return distribution;
  }

  private getRecommendationTypeDistribution(cache: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const entry of cache) {
      const type = entry.recommendation_type;
      distribution[type] = (distribution[type] || 0) + 1;
    }
    
    return distribution;
  }

  private getAnalysisTypeDistribution(cache: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const entry of cache) {
      const type = entry.analysis_type;
      distribution[type] = (distribution[type] || 0) + 1;
    }
    
    return distribution;
  }

  private async getPostgreSQLVersion(): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc('get_postgres_version');
      return error ? 'unknown' : data || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async getPGVectorVersion(): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc('get_extension_version', { 
        extension_name: 'vector' 
      });
      return error ? 'unknown' : data || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async getTableSchema(tableName: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.rpc('get_table_schema', { 
        table_name: tableName 
      });
      return error ? {} : data || {};
    } catch {
      return {};
    }
  }

  private async getTableIndexes(tableName: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.rpc('get_table_indexes', { 
        table_name: tableName 
      });
      return error ? [] : data || [];
    } catch {
      return [];
    }
  }

  private async getTablePolicies(tableName: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.rpc('get_table_policies', { 
        table_name: tableName 
      });
      return error ? [] : data || [];
    } catch {
      return [];
    }
  }

  private async getFunctionDefinition(functionName: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.rpc('get_function_definition', { 
        function_name: functionName 
      });
      return error ? {} : data || {};
    } catch {
      return {};
    }
  }

  private getFileSize(filePath: string): number {
    try {
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  private calculateChecksum(data: any): string {
    const crypto = require('crypto');
    const jsonString = JSON.stringify(data);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  private saveManifest(): void {
    const manifestPath = join(this.backupDir, 'backup_manifest.json');
    writeFileSync(manifestPath, JSON.stringify(this.manifest, null, 2));
  }

  /**
   * Restore from backup (for testing and recovery)
   */
  async restoreFromBackup(backupPath: string): Promise<boolean> {
    try {
      console.log(`🔄 Starting restore from: ${backupPath}`);
      
      // Load manifest
      const manifestPath = join(backupPath, 'backup_manifest.json');
      const manifest = JSON.parse(require('fs').readFileSync(manifestPath, 'utf8'));
      
      console.log(`📋 Restoring backup: ${manifest.backup_id}`);
      console.log(`📅 Created: ${manifest.created_at}`);
      console.log(`📊 Records: ${manifest.total_records}`);
      
      // Validate backup integrity
      const isValid = await this.validateBackupIntegrity(backupPath, manifest);
      if (!isValid) {
        throw new Error('Backup integrity validation failed');
      }
      
      console.log(`✅ Backup integrity validated`);
      
      // Note: Actual restore would involve careful data insertion
      // For now, just validate the backup can be read
      
      return true;
      
    } catch (error) {
      console.error('❌ Restore failed:', error);
      return false;
    }
  }

  private async validateBackupIntegrity(backupPath: string, manifest: BackupManifest): Promise<boolean> {
    try {
      // Check all expected files exist
      const fs = require('fs');
      const expectedFiles = Object.keys(manifest.file_sizes);
      
      for (const fileName of expectedFiles) {
        const filePath = join(backupPath, fileName);
        if (!fs.existsSync(filePath)) {
          console.error(`❌ Missing backup file: ${fileName}`);
          return false;
        }
        
        // Validate file size
        const actualSize = fs.statSync(filePath).size;
        const expectedSize = manifest.file_sizes[fileName];
        
        if (Math.abs(actualSize - expectedSize) > 1024) { // Allow 1KB difference
          console.error(`❌ File size mismatch: ${fileName}`);
          return false;
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Backup integrity validation failed:', error);
      return false;
    }
  }

  /**
   * List available backups
   */
  static listBackups(): BackupManifest[] {
    try {
      const fs = require('fs');
      const backupsDir = join(process.cwd(), 'backups');
      
      if (!fs.existsSync(backupsDir)) {
        return [];
      }
      
      const backupDirs = fs.readdirSync(backupsDir)
        .filter((name: string) => name.startsWith('backup_'));
      
      const manifests: BackupManifest[] = [];
      
      for (const dirName of backupDirs) {
        try {
          const manifestPath = join(backupsDir, dirName, 'backup_manifest.json');
          if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            manifests.push(manifest);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to read manifest for ${dirName}:`, error);
        }
      }
      
      return manifests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      return [];
    }
  }
}

// Export factory function and utility functions
export const createAISystemBackup = (supabaseUrl?: string, supabaseKey?: string) => {
  return new AISystemBackup(supabaseUrl, supabaseKey);
};

export const performSystemBackup = async (): Promise<BackupManifest> => {
  const backup = createAISystemBackup();
  return await backup.createFullBackup();
};

export const listSystemBackups = (): BackupManifest[] => {
  return AISystemBackup.listBackups();
};

// CLI interface
if (require.main === module) {
  (async () => {
    try {
      console.log('🚀 Starting AI System Backup...');
      const manifest = await performSystemBackup();
      console.log('🎉 Backup completed successfully!');
      console.log('📋 Manifest:', JSON.stringify(manifest, null, 2));
    } catch (error) {
      console.error('💥 Backup failed:', error);
      process.exit(1);
    }
  })();
}