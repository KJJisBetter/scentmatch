/**
 * Enhanced Recommendation Caching and Multi-Resolution Embedding Cache
 * 
 * Advanced caching system for AI recommendations and Matryoshka embeddings with intelligent
 * invalidation, cache warming, performance optimization, and multi-tier storage.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';

// Types for recommendation caching
export interface CacheConfiguration {
  cache_layers: CacheLayer[];
  invalidation_strategies: InvalidationStrategy[];
  warming_strategies: WarmingStrategy[];
  compression_enabled: boolean;
  distributed_enabled: boolean;
  performance_targets: CachePerformanceTargets;
}

export interface CacheLayer {
  layer_name: string;
  cache_type: 'memory' | 'redis' | 'database' | 'hybrid';
  max_size_mb: number;
  default_ttl_ms: number;
  eviction_policy: 'lru' | 'lfu' | 'adaptive' | 'ttl';
  compression_ratio: number;
  priority_levels: number;
}

export interface InvalidationStrategy {
  strategy_name: string;
  triggers: InvalidationTrigger[];
  scope: 'user' | 'global' | 'content' | 'context';
  granularity: 'exact' | 'pattern' | 'related';
  batch_invalidation: boolean;
  cascade_invalidation: boolean;
}

export interface InvalidationTrigger {
  trigger_type: 'user_activity' | 'content_update' | 'time_based' | 'algorithm_change' | 'manual';
  conditions: TriggerCondition[];
  invalidation_delay: number;
  priority: 'immediate' | 'batch' | 'scheduled';
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'contains' | 'changed' | 'threshold_exceeded';
  value: any;
  weight: number;
}

export interface WarmingStrategy {
  strategy_name: string;
  target_audience: 'popular_users' | 'new_users' | 'all_users' | 'trending_content';
  warming_schedule: WarmingSchedule;
  priority: 'high' | 'medium' | 'low';
  resource_limits: ResourceLimits;
  success_metrics: string[];
}

export interface WarmingSchedule {
  schedule_type: 'continuous' | 'periodic' | 'event_driven';
  interval_ms?: number;
  cron_expression?: string;
  trigger_events?: string[];
  batch_size: number;
}

export interface ResourceLimits {
  max_cpu_usage: number;
  max_memory_usage: number;
  max_cost_per_hour: number;
  max_concurrent_operations: number;
}

export interface CachePerformanceTargets {
  hit_rate_target: number;
  avg_retrieval_time_ms: number;
  cache_warming_coverage: number;
  invalidation_accuracy: number;
}

export interface CacheEntry {
  cache_key: string;
  user_id: string;
  recommendation_type: string;
  recommendations: any[];
  context_hash: string;
  confidence_score: number;
  created_at: number;
  expires_at: number;
  access_count: number;
  last_accessed: number;
  cache_layer: string;
  size_bytes: number;
  compression_used: boolean;
  invalidation_version: number;
}

export interface CacheMetrics {
  cache_layer: string;
  time_period: string;
  hits: number;
  misses: number;
  hit_rate: number;
  avg_retrieval_time_ms: number;
  evictions: number;
  invalidations: number;
  warming_operations: number;
  storage_utilization: number;
  compression_ratio: number;
  cost_savings_usd: number;
}

// Multi-Resolution Embedding Cache Types
export interface EmbeddingCacheEntry {
  cache_key: string;
  embeddings: {
    256?: number[];
    512?: number[];
    1024?: number[];
    2048?: number[];
  };
  metadata: {
    source_text: string;
    content_hash: string;
    generation_time_ms: number;
    api_cost_cents: number;
    quality_scores: Record<number, number>;
    access_count: number;
    last_accessed: Date;
    created_at: Date;
    expires_at: Date;
  };
  cache_tier: 'hot' | 'warm' | 'cold';
  priority_score: number;
}

export interface EmbeddingCacheConfig {
  hot_cache_size: number;
  warm_cache_size: number;
  cold_cache_enabled: boolean;
  enable_predictive_caching: boolean;
  enable_compression: boolean;
  
  ttl_config: {
    hot_cache_hours: number;
    warm_cache_days: number;
    cold_cache_weeks: number;
  };
  
  eviction_policy: 'lru' | 'lfu' | 'adaptive' | 'cost_aware';
  preloading_strategies: string[];
}

export interface EmbeddingCacheMetrics {
  hit_rates: {
    overall: number;
    hot_tier: number;
    warm_tier: number;
    cold_tier: number;
    by_dimension: Record<number, number>;
  };
  latency_metrics: {
    avg_retrieval_ms: number;
    hot_tier_avg_ms: number;
    warm_tier_avg_ms: number;
    cold_tier_avg_ms: number;
  };
  cost_savings: {
    api_calls_avoided: number;
    estimated_cost_savings_cents: number;
    cache_efficiency_score: number;
  };
  storage_metrics: {
    total_entries: number;
    memory_usage_mb: number;
    compression_ratio: number;
  };
}

// Multi-Tier Embedding Cache for Matryoshka Embeddings
export class MultiTierEmbeddingCache extends EventEmitter {
  private supabase: ReturnType<typeof createClient<Database>>;
  private config: EmbeddingCacheConfig;
  
  // In-memory caches for different tiers
  private hotCache: Map<string, EmbeddingCacheEntry> = new Map();
  private warmCache: Map<string, EmbeddingCacheEntry> = new Map();
  private accessPatterns: Map<string, number[]> = new Map(); // Track access times
  private performanceMetrics: EmbeddingCacheStats;

  constructor(supabase: ReturnType<typeof createClient<Database>>, config: Partial<EmbeddingCacheConfig> = {}) {
    super();
    this.supabase = supabase;
    this.config = {
      hot_cache_size: config.hot_cache_size || 1000,
      warm_cache_size: config.warm_cache_size || 5000,
      cold_cache_enabled: config.cold_cache_enabled ?? true,
      enable_predictive_caching: config.enable_predictive_caching ?? true,
      enable_compression: config.enable_compression ?? false,
      
      ttl_config: config.ttl_config || {
        hot_cache_hours: 4,
        warm_cache_days: 7,
        cold_cache_weeks: 4
      },
      
      eviction_policy: config.eviction_policy || 'adaptive',
      preloading_strategies: config.preloading_strategies || ['popular_queries', 'user_patterns', 'seasonal_trends']
    };

    this.performanceMetrics = new EmbeddingCacheStats();
  }

  /**
   * Store multi-resolution embedding in cache
   */
  async storeEmbedding(
    sourceText: string,
    embeddings: Record<number, number[]>,
    metadata: {
      generation_time_ms: number;
      api_cost_cents: number;
      quality_scores: Record<number, number>;
    }
  ): Promise<{
    stored: boolean;
    cache_key: string;
    cache_tier: string;
    storage_size_bytes: number;
    evicted_entries?: number;
  }> {
    try {
      const cacheKey = this.generateEmbeddingCacheKey(sourceText);
      const contentHash = createHash('sha256').update(sourceText.toLowerCase().trim()).digest('hex');
      
      // Create cache entry
      const entry: EmbeddingCacheEntry = {
        cache_key: cacheKey,
        embeddings: this.config.enable_compression ? this.compressEmbeddings(embeddings) : embeddings,
        metadata: {
          source_text: sourceText,
          content_hash: contentHash,
          generation_time_ms: metadata.generation_time_ms,
          api_cost_cents: metadata.api_cost_cents,
          quality_scores: metadata.quality_scores,
          access_count: 0,
          last_accessed: new Date(),
          created_at: new Date(),
          expires_at: new Date(Date.now() + this.config.ttl_config.hot_cache_hours * 60 * 60 * 1000)
        },
        cache_tier: 'hot',
        priority_score: this.calculateEmbeddingPriorityScore(sourceText, embeddings, metadata)
      };

      // Determine optimal cache tier
      const optimalTier = this.selectOptimalCacheTier(entry);
      entry.cache_tier = optimalTier;

      // Store in appropriate tier
      let evictedEntries = 0;
      if (optimalTier === 'hot') {
        evictedEntries = await this.addToHotCache(entry);
      } else if (optimalTier === 'warm') {
        evictedEntries = await this.addToWarmCache(entry);
      } else if (this.config.cold_cache_enabled) {
        await this.addToColdCache(entry);
      }

      // Calculate storage size
      const storageSize = this.calculateEmbeddingStorageSize(embeddings);

      // Update performance metrics
      this.performanceMetrics.recordStorage(cacheKey, storageSize, optimalTier);

      // Emit storage event
      this.emit('embedding_cached', {
        cache_key: cacheKey,
        cache_tier: optimalTier,
        storage_size_bytes: storageSize,
        dimensions: Object.keys(embeddings).map(d => parseInt(d))
      });

      return {
        stored: true,
        cache_key: cacheKey,
        cache_tier: optimalTier,
        storage_size_bytes: storageSize,
        evicted_entries: evictedEntries
      };

    } catch (error) {
      console.error('Embedding cache storage failed:', error);
      return {
        stored: false,
        cache_key: '',
        cache_tier: 'none',
        storage_size_bytes: 0
      };
    }
  }

  /**
   * Retrieve embeddings from cache with adaptive precision
   */
  async retrieveEmbedding(
    sourceText: string,
    requestedDimensions: number[] = [256, 512, 1024, 2048]
  ): Promise<{
    cache_hit: boolean;
    embeddings: Record<number, number[]>;
    cache_tier?: string;
    retrieval_latency_ms: number;
    dimensions_found: number[];
    dimensions_missing: number[];
    cost_savings_cents: number;
  }> {
    const startTime = Date.now();
    const cacheKey = this.generateEmbeddingCacheKey(sourceText);

    try {
      // Check hot cache first
      let entry = this.hotCache.get(cacheKey);
      let cacheTier = 'hot';

      // Check warm cache if not in hot
      if (!entry) {
        entry = this.warmCache.get(cacheKey);
        cacheTier = 'warm';
      }

      // Check cold cache (database) if not in memory
      if (!entry && this.config.cold_cache_enabled) {
        entry = await this.retrieveFromColdCache(cacheKey);
        cacheTier = 'cold';
      }

      if (!entry) {
        // Cache miss
        this.performanceMetrics.recordMiss(cacheKey);
        
        return {
          cache_hit: false,
          embeddings: {},
          retrieval_latency_ms: Date.now() - startTime,
          dimensions_found: [],
          dimensions_missing: requestedDimensions,
          cost_savings_cents: 0
        };
      }

      // Check if entry is expired
      if (entry.metadata.expires_at.getTime() < Date.now()) {
        await this.removeExpiredEmbeddingEntry(cacheKey, cacheTier);
        this.performanceMetrics.recordMiss(cacheKey);
        
        return {
          cache_hit: false,
          embeddings: {},
          retrieval_latency_ms: Date.now() - startTime,
          dimensions_found: [],
          dimensions_missing: requestedDimensions,
          cost_savings_cents: 0
        };
      }

      // Extract requested dimensions
      const availableEmbeddings: Record<number, number[]> = {};
      const dimensionsFound: number[] = [];
      const dimensionsMissing: number[] = [];

      for (const dim of requestedDimensions) {
        if (entry.embeddings[dim as keyof typeof entry.embeddings]) {
          availableEmbeddings[dim] = this.config.enable_compression 
            ? this.decompressEmbedding(entry.embeddings[dim as keyof typeof entry.embeddings]!)
            : entry.embeddings[dim as keyof typeof entry.embeddings]!;
          dimensionsFound.push(dim);
        } else {
          dimensionsMissing.push(dim);
        }
      }

      // Update access statistics
      entry.metadata.access_count++;
      entry.metadata.last_accessed = new Date();
      this.updateEmbeddingAccessPattern(cacheKey);

      // Promote to higher tier if access pattern indicates high value
      if (cacheTier === 'warm' && this.shouldPromoteToHot(entry)) {
        await this.promoteToHotCache(entry);
      }

      // Calculate cost savings
      const costSavings = entry.metadata.api_cost_cents;

      // Record hit metrics
      this.performanceMetrics.recordHit(cacheKey, cacheTier, Date.now() - startTime);

      this.emit('embedding_cache_hit', {
        cache_key: cacheKey,
        cache_tier: cacheTier,
        dimensions_retrieved: dimensionsFound,
        access_count: entry.metadata.access_count
      });

      return {
        cache_hit: true,
        embeddings: availableEmbeddings,
        cache_tier: cacheTier,
        retrieval_latency_ms: Date.now() - startTime,
        dimensions_found: dimensionsFound,
        dimensions_missing: dimensionsMissing,
        cost_savings_cents: costSavings
      };

    } catch (error) {
      console.error('Embedding cache retrieval failed:', error);
      this.performanceMetrics.recordError(cacheKey, error);
      
      return {
        cache_hit: false,
        embeddings: {},
        retrieval_latency_ms: Date.now() - startTime,
        dimensions_found: [],
        dimensions_missing: requestedDimensions,
        cost_savings_cents: 0
      };
    }
  }

  /**
   * Calculate priority score for embedding cache entry
   */
  private calculateEmbeddingPriorityScore(
    sourceText: string,
    embeddings: Record<number, number[]>,
    metadata: any
  ): number {
    let score = 0.5; // Base score

    // Text complexity factor
    score += Math.min(0.2, sourceText.length / 500);

    // Embedding completeness factor (more dimensions = higher priority)
    const dimensionsAvailable = Object.keys(embeddings).length;
    score += (dimensionsAvailable / 4) * 0.2;

    // Generation cost factor (expensive to generate = higher priority to cache)
    score += Math.min(0.2, metadata.api_cost_cents / 10);

    // Quality factor
    const avgQuality = Object.values(metadata.quality_scores || {}).reduce((sum: number, q: any) => sum + q, 0) / 
                     Math.max(Object.keys(metadata.quality_scores || {}).length, 1);
    score += avgQuality * 0.1;

    return Math.min(1.0, score);
  }

  /**
   * Select optimal cache tier for embedding entry
   */
  private selectOptimalCacheTier(entry: EmbeddingCacheEntry): 'hot' | 'warm' | 'cold' {
    // High priority or frequently accessed items go to hot cache
    if (entry.priority_score > 0.8 || entry.metadata.access_count > 5) {
      return 'hot';
    }

    // Medium priority items go to warm cache
    if (entry.priority_score > 0.4 || entry.metadata.access_count > 1) {
      return 'warm';
    }

    // Low priority items go to cold cache
    return 'cold';
  }

  /**
   * Add entry to hot cache with eviction if needed
   */
  private async addToHotCache(entry: EmbeddingCacheEntry): Promise<number> {
    let evictedCount = 0;

    // Evict if cache is full
    if (this.hotCache.size >= this.config.hot_cache_size) {
      evictedCount = await this.evictFromHotCache();
    }

    this.hotCache.set(entry.cache_key, entry);
    return evictedCount;
  }

  /**
   * Add entry to warm cache with eviction if needed
   */
  private async addToWarmCache(entry: EmbeddingCacheEntry): Promise<number> {
    let evictedCount = 0;

    // Evict if cache is full
    if (this.warmCache.size >= this.config.warm_cache_size) {
      evictedCount = await this.evictFromWarmCache();
    }

    entry.cache_tier = 'warm';
    entry.metadata.expires_at = new Date(Date.now() + this.config.ttl_config.warm_cache_days * 24 * 60 * 60 * 1000);
    
    this.warmCache.set(entry.cache_key, entry);
    return evictedCount;
  }

  /**
   * Add entry to cold cache (database storage)
   */
  private async addToColdCache(entry: EmbeddingCacheEntry): Promise<void> {
    try {
      entry.cache_tier = 'cold';
      entry.metadata.expires_at = new Date(Date.now() + this.config.ttl_config.cold_cache_weeks * 7 * 24 * 60 * 60 * 1000);

      await this.supabase
        .from('embedding_cache_multi')
        .insert({
          cache_key: entry.cache_key,
          cache_type: 'query_embedding',
          embedding_256: entry.embeddings[256] ? `[${entry.embeddings[256].join(',')}]` : null,
          embedding_512: entry.embeddings[512] ? `[${entry.embeddings[512].join(',')}]` : null,
          embedding_1024: entry.embeddings[1024] ? `[${entry.embeddings[1024].join(',')}]` : null,
          embedding_2048: entry.embeddings[2048] ? `[${entry.embeddings[2048].join(',')}]` : null,
          cache_tier: 'cold',
          access_count: entry.metadata.access_count,
          last_accessed_at: entry.metadata.last_accessed.toISOString(),
          access_frequency: 1.0,
          priority_score: entry.priority_score,
          expires_at: entry.metadata.expires_at.toISOString()
        });

    } catch (error) {
      console.error('Failed to store in cold cache:', error);
    }
  }

  /**
   * Retrieve from cold cache (database)
   */
  private async retrieveFromColdCache(cacheKey: string): Promise<EmbeddingCacheEntry | null> {
    try {
      const { data, error } = await this.supabase
        .from('embedding_cache_multi')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      // Convert database format to EmbeddingCacheEntry
      const entry: EmbeddingCacheEntry = {
        cache_key: cacheKey,
        embeddings: {
          256: data.embedding_256 ? this.parseVectorString(data.embedding_256) : undefined,
          512: data.embedding_512 ? this.parseVectorString(data.embedding_512) : undefined,
          1024: data.embedding_1024 ? this.parseVectorString(data.embedding_1024) : undefined,
          2048: data.embedding_2048 ? this.parseVectorString(data.embedding_2048) : undefined
        },
        metadata: {
          source_text: '',
          content_hash: '',
          generation_time_ms: 0,
          api_cost_cents: 0,
          quality_scores: {},
          access_count: data.access_count || 0,
          last_accessed: new Date(data.last_accessed_at),
          created_at: new Date(data.created_at),
          expires_at: new Date(data.expires_at)
        },
        cache_tier: 'cold',
        priority_score: data.priority_score || 0.5
      };

      // Update access count in database
      await this.supabase
        .from('embedding_cache_multi')
        .update({
          access_count: (data.access_count || 0) + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('cache_key', cacheKey);

      return entry;

    } catch (error) {
      console.error('Cold cache retrieval failed:', error);
      return null;
    }
  }

  /**
   * Generate cache key for embeddings
   */
  private generateEmbeddingCacheKey(sourceText: string): string {
    return createHash('sha256')
      .update(sourceText.toLowerCase().trim())
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Calculate storage size for embeddings
   */
  private calculateEmbeddingStorageSize(embeddings: Record<number, number[]>): number {
    let totalSize = 0;
    
    for (const [dim, embedding] of Object.entries(embeddings)) {
      totalSize += embedding.length * 4; // 4 bytes per float32
    }
    
    return totalSize;
  }

  /**
   * Compress embeddings for storage efficiency
   */
  private compressEmbeddings(embeddings: Record<number, number[]>): Record<number, number[]> {
    // Simplified compression - in production would use proper compression algorithms
    const compressed: Record<number, number[]> = {};
    
    for (const [dim, embedding] of Object.entries(embeddings)) {
      // Quantize to reduce precision (lossy compression)
      compressed[parseInt(dim)] = embedding.map(val => Math.round(val * 1000) / 1000);
    }
    
    return compressed;
  }

  /**
   * Decompress embeddings
   */
  private decompressEmbedding(embedding: number[]): number[] {
    // For quantization compression, no decompression needed
    return embedding;
  }

  /**
   * Parse vector string from database
   */
  private parseVectorString(vectorString: string): number[] {
    try {
      const cleanString = vectorString.replace(/^\[|\]$/g, '');
      return cleanString.split(',').map(val => parseFloat(val.trim()));
    } catch (error) {
      console.error('Failed to parse vector string:', error);
      return [];
    }
  }

  /**
   * Update access pattern tracking
   */
  private updateEmbeddingAccessPattern(cacheKey: string): void {
    const pattern = this.accessPatterns.get(cacheKey) || [];
    pattern.push(Date.now());
    
    // Keep only recent access times (last 24 hours)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recentAccesses = pattern.filter(time => time > cutoff);
    
    this.accessPatterns.set(cacheKey, recentAccesses);
  }

  /**
   * Check if entry should be promoted to hot cache
   */
  private shouldPromoteToHot(entry: EmbeddingCacheEntry): boolean {
    const pattern = this.accessPatterns.get(entry.cache_key) || [];
    
    // Promote if accessed frequently in recent period
    const recentAccesses = pattern.filter(time => time > Date.now() - 60 * 60 * 1000); // Last hour
    return recentAccesses.length >= 3 || entry.metadata.access_count >= 10;
  }

  /**
   * Promote entry to hot cache
   */
  private async promoteToHotCache(entry: EmbeddingCacheEntry): Promise<void> {
    entry.cache_tier = 'hot';
    entry.metadata.expires_at = new Date(Date.now() + this.config.ttl_config.hot_cache_hours * 60 * 60 * 1000);
    
    await this.addToHotCache(entry);
    this.warmCache.delete(entry.cache_key);
    
    this.emit('cache_promotion', {
      cache_key: entry.cache_key,
      promoted_to: 'hot',
      access_count: entry.metadata.access_count
    });
  }

  /**
   * Evict entries from hot cache
   */
  private async evictFromHotCache(): Promise<number> {
    const evictionCandidates = this.selectEmbeddingEvictionCandidates(this.hotCache, Math.floor(this.config.hot_cache_size * 0.1));

    for (const candidate of evictionCandidates) {
      // Move to warm cache if valuable enough
      if (candidate.priority_score > 0.3) {
        await this.addToWarmCache(candidate);
      }
      
      this.hotCache.delete(candidate.cache_key);
    }

    return evictionCandidates.length;
  }

  /**
   * Evict entries from warm cache
   */
  private async evictFromWarmCache(): Promise<number> {
    const evictionCandidates = this.selectEmbeddingEvictionCandidates(this.warmCache, Math.floor(this.config.warm_cache_size * 0.1));

    for (const candidate of evictionCandidates) {
      // Move to cold cache if enabled and valuable enough
      if (this.config.cold_cache_enabled && candidate.priority_score > 0.2) {
        await this.addToColdCache(candidate);
      }
      
      this.warmCache.delete(candidate.cache_key);
    }

    return evictionCandidates.length;
  }

  /**
   * Select eviction candidates for embeddings
   */
  private selectEmbeddingEvictionCandidates(cache: Map<string, EmbeddingCacheEntry>, count: number): EmbeddingCacheEntry[] {
    const entries = Array.from(cache.values());
    
    switch (this.config.eviction_policy) {
      case 'lru':
        return entries
          .sort((a, b) => a.metadata.last_accessed.getTime() - b.metadata.last_accessed.getTime())
          .slice(0, count);
      
      case 'lfu':
        return entries
          .sort((a, b) => a.metadata.access_count - b.metadata.access_count)
          .slice(0, count);
      
      case 'cost_aware':
        return entries
          .sort((a, b) => (a.metadata.api_cost_cents / (a.metadata.access_count + 1)) - 
                         (b.metadata.api_cost_cents / (b.metadata.access_count + 1)))
          .slice(0, count);
      
      case 'adaptive':
      default:
        // Adaptive eviction considers multiple factors
        return entries
          .sort((a, b) => this.calculateEmbeddingEvictionScore(b) - this.calculateEmbeddingEvictionScore(a))
          .slice(0, count);
    }
  }

  /**
   * Calculate eviction score for adaptive policy
   */
  private calculateEmbeddingEvictionScore(entry: EmbeddingCacheEntry): number {
    const ageWeight = 0.3;
    const accessWeight = 0.3;
    const costWeight = 0.2;
    const qualityWeight = 0.2;

    // Age factor (newer = higher score)
    const ageMs = Date.now() - entry.metadata.created_at.getTime();
    const ageFactor = Math.max(0, 1 - ageMs / (7 * 24 * 60 * 60 * 1000)); // 1 week decay

    // Access factor
    const accessFactor = Math.min(1, entry.metadata.access_count / 10);

    // Cost factor (expensive to regenerate = higher score)
    const costFactor = Math.min(1, entry.metadata.api_cost_cents / 5);

    // Quality factor
    const avgQuality = Object.values(entry.metadata.quality_scores).reduce((sum, q) => sum + q, 0) / 
                      Math.max(Object.keys(entry.metadata.quality_scores).length, 1);

    return (
      ageFactor * ageWeight +
      accessFactor * accessWeight +
      costFactor * costWeight +
      avgQuality * qualityWeight
    );
  }

  /**
   * Remove expired embedding entry from cache
   */
  private async removeExpiredEmbeddingEntry(cacheKey: string, tier: string): Promise<void> {
    if (tier === 'hot') {
      this.hotCache.delete(cacheKey);
    } else if (tier === 'warm') {
      this.warmCache.delete(cacheKey);
    } else if (tier === 'cold') {
      await this.supabase
        .from('embedding_cache_multi')
        .delete()
        .eq('cache_key', cacheKey);
    }

    this.emit('embedding_cache_expiry', { cache_key: cacheKey, tier });
  }

  /**
   * Get embedding cache performance metrics
   */
  getEmbeddingCacheMetrics(): EmbeddingCacheMetrics {
    return this.performanceMetrics.getMetrics();
  }
}

// Embedding Cache Performance Statistics
class EmbeddingCacheStats {
  private stats = {
    total_requests: 0,
    cache_hits: 0,
    cache_misses: 0,
    hot_hits: 0,
    warm_hits: 0,
    cold_hits: 0,
    total_retrieval_time_ms: 0,
    hot_retrieval_time_ms: 0,
    warm_retrieval_time_ms: 0,
    cold_retrieval_time_ms: 0,
    api_calls_avoided: 0,
    cost_savings_cents: 0
  };

  recordHit(cacheKey: string, tier: string, latencyMs: number): void {
    this.stats.total_requests++;
    this.stats.cache_hits++;
    this.stats.total_retrieval_time_ms += latencyMs;

    switch (tier) {
      case 'hot':
        this.stats.hot_hits++;
        this.stats.hot_retrieval_time_ms += latencyMs;
        break;
      case 'warm':
        this.stats.warm_hits++;
        this.stats.warm_retrieval_time_ms += latencyMs;
        break;
      case 'cold':
        this.stats.cold_hits++;
        this.stats.cold_retrieval_time_ms += latencyMs;
        break;
    }

    // Estimate API call avoided and cost savings
    this.stats.api_calls_avoided++;
    this.stats.cost_savings_cents += 0.5; // Estimated cost per API call
  }

  recordMiss(cacheKey: string): void {
    this.stats.total_requests++;
    this.stats.cache_misses++;
  }

  recordStorage(cacheKey: string, sizeBytes: number, tier: string): void {
    // Track storage operations
  }

  recordError(cacheKey: string, error: any): void {
    // Track errors for debugging
  }

  getMetrics(): EmbeddingCacheMetrics {
    const totalRequests = Math.max(this.stats.total_requests, 1);
    
    return {
      hit_rates: {
        overall: this.stats.cache_hits / totalRequests,
        hot_tier: this.stats.hot_hits / Math.max(this.stats.cache_hits, 1),
        warm_tier: this.stats.warm_hits / Math.max(this.stats.cache_hits, 1),
        cold_tier: this.stats.cold_hits / Math.max(this.stats.cache_hits, 1),
        by_dimension: {
          256: 0.8, // Mock dimension-specific hit rates
          512: 0.6,
          1024: 0.4,
          2048: 0.3
        }
      },
      latency_metrics: {
        avg_retrieval_ms: this.stats.total_retrieval_time_ms / Math.max(this.stats.cache_hits, 1),
        hot_tier_avg_ms: this.stats.hot_retrieval_time_ms / Math.max(this.stats.hot_hits, 1),
        warm_tier_avg_ms: this.stats.warm_retrieval_time_ms / Math.max(this.stats.warm_hits, 1),
        cold_tier_avg_ms: this.stats.cold_retrieval_time_ms / Math.max(this.stats.cold_hits, 1)
      },
      cost_savings: {
        api_calls_avoided: this.stats.api_calls_avoided,
        estimated_cost_savings_cents: this.stats.cost_savings_cents,
        cache_efficiency_score: this.stats.cache_hits / totalRequests
      },
      storage_metrics: {
        total_entries: this.stats.cache_hits + this.stats.cache_misses,
        memory_usage_mb: 0, // Would be calculated from actual cache sizes
        compression_ratio: 1.0 // Would be calculated if compression enabled
      }
    };
  }
}

/**
 * Recommendation Cache Manager
 * Main caching system for AI recommendations
 */
export class RecommendationCacheManager {
  private config: CacheConfiguration;
  private supabase: ReturnType<typeof createClient<Database>>;
  private cacheStore: Map<string, CacheEntry> = new Map();
  private invalidationQueue: InvalidationTask[] = [];
  private warmingQueue: WarmingTask[] = [];
  private metrics: Map<string, CacheMetrics> = new Map();
  private compressionCache: Map<string, any> = new Map();

  constructor(config: Partial<CacheConfiguration>) {
    this.config = this.mergeWithDefaults(config);
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.initializeCacheSystem();
  }

  private mergeWithDefaults(config: Partial<CacheConfiguration>): CacheConfiguration {
    return {
      cache_layers: [
        {
          layer_name: 'memory_primary',
          cache_type: 'memory',
          max_size_mb: 100,
          default_ttl_ms: 300000, // 5 minutes
          eviction_policy: 'lru',
          compression_ratio: 0.3,
          priority_levels: 3
        },
        {
          layer_name: 'database_secondary',
          cache_type: 'database',
          max_size_mb: 1000,
          default_ttl_ms: 3600000, // 1 hour
          eviction_policy: 'ttl',
          compression_ratio: 0.6,
          priority_levels: 2
        }
      ],
      invalidation_strategies: [
        {
          strategy_name: 'user_activity_invalidation',
          triggers: [
            {
              trigger_type: 'user_activity',
              conditions: [
                { field: 'activity_type', operator: 'equals', value: 'collection_add', weight: 1.0 },
                { field: 'activity_type', operator: 'equals', value: 'rating', weight: 0.8 }
              ],
              invalidation_delay: 0,
              priority: 'immediate'
            }
          ],
          scope: 'user',
          granularity: 'exact',
          batch_invalidation: false,
          cascade_invalidation: true
        }
      ],
      warming_strategies: [
        {
          strategy_name: 'popular_user_warming',
          target_audience: 'popular_users',
          warming_schedule: {
            schedule_type: 'periodic',
            interval_ms: 900000, // 15 minutes
            batch_size: 50
          },
          priority: 'high',
          resource_limits: {
            max_cpu_usage: 0.3,
            max_memory_usage: 0.5,
            max_cost_per_hour: 2.0,
            max_concurrent_operations: 10
          },
          success_metrics: ['cache_hit_rate_improvement', 'response_time_reduction']
        }
      ],
      compression_enabled: true,
      distributed_enabled: false,
      performance_targets: {
        hit_rate_target: 0.85,
        avg_retrieval_time_ms: 5,
        cache_warming_coverage: 0.7,
        invalidation_accuracy: 0.95
      },
      ...config
    };
  }

  /**
   * Get cached recommendations for user
   */
  async getRecommendations(
    userId: string,
    recommendationType: string,
    context?: any
  ): Promise<{ recommendations: any[] | null; cache_hit: boolean; cache_layer?: string }> {
    const cacheKey = this.generateCacheKey(userId, recommendationType, context);
    
    // Check memory cache first
    const memoryResult = this.getFromMemoryCache(cacheKey);
    if (memoryResult) {
      this.recordCacheHit('memory', cacheKey);
      return { recommendations: memoryResult.recommendations, cache_hit: true, cache_layer: 'memory' };
    }

    // Check database cache
    const dbResult = await this.getFromDatabaseCache(cacheKey);
    if (dbResult) {
      // Promote to memory cache
      this.setInMemoryCache(cacheKey, dbResult);
      this.recordCacheHit('database', cacheKey);
      return { recommendations: dbResult.recommendations, cache_hit: true, cache_layer: 'database' };
    }

    this.recordCacheMiss(cacheKey);
    return { recommendations: null, cache_hit: false };
  }

  /**
   * Cache recommendations with intelligent storage
   */
  async cacheRecommendations(
    userId: string,
    recommendationType: string,
    recommendations: any[],
    context?: any,
    options?: {
      ttl?: number;
      priority?: 'high' | 'medium' | 'low';
      cache_layers?: string[];
    }
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(userId, recommendationType, context);
    const contextHash = this.generateContextHash(context);
    
    const cacheEntry: CacheEntry = {
      cache_key: cacheKey,
      user_id: userId,
      recommendation_type: recommendationType,
      recommendations,
      context_hash: contextHash,
      confidence_score: this.calculateRecommendationConfidence(recommendations),
      created_at: Date.now(),
      expires_at: Date.now() + (options?.ttl || this.config.cache_layers[0].default_ttl_ms),
      access_count: 0,
      last_accessed: Date.now(),
      cache_layer: 'memory',
      size_bytes: this.estimateSize(recommendations),
      compression_used: false,
      invalidation_version: 1
    };

    // Determine which cache layers to use
    const targetLayers = options?.cache_layers || ['memory', 'database'];
    
    // Store in memory cache
    if (targetLayers.includes('memory')) {
      this.setInMemoryCache(cacheKey, cacheEntry);
    }

    // Store in database cache
    if (targetLayers.includes('database')) {
      await this.setInDatabaseCache(cacheKey, cacheEntry);
    }

    // Update metrics
    this.updateCacheMetrics('cache_set', cacheEntry.cache_layer, cacheEntry.size_bytes);
  }

  /**
   * Handle user activity for cache invalidation
   */
  async handleUserActivity(activity: any, existingCacheEntries?: any[]): Promise<any> {
    const affectedKeys = this.findAffectedCacheKeys(activity);
    const invalidationReason = this.determineInvalidationReason(activity);
    
    // Execute invalidation
    const invalidatedKeys = await this.invalidateCacheKeys(affectedKeys, invalidationReason);
    
    // Determine if cache refresh should be triggered
    const shouldRefresh = this.shouldTriggerCacheRefresh(activity, invalidatedKeys);
    
    // Calculate new cache priority based on activity
    const newPriority = this.calculateCachePriority(activity);

    return {
      invalidated_keys: invalidatedKeys,
      affected_entries: invalidatedKeys.length,
      invalidation_reason: invalidationReason,
      cache_refresh_triggered: shouldRefresh,
      new_cache_priority: newPriority
    };
  }

  private findAffectedCacheKeys(activity: any): string[] {
    const affectedKeys = [];
    
    // User-specific invalidations
    const userCachePattern = `${activity.user_id}_*`;
    const userKeys = this.findCacheKeysByPattern(userCachePattern);
    affectedKeys.push(...userKeys);

    // Activity-specific invalidations
    if (activity.activity_type === 'collection_add' || activity.activity_type === 'rating') {
      // Invalidate personalized recommendations
      const personalizedKeys = this.findCacheKeysByPattern(`${activity.user_id}_personalized_*`);
      affectedKeys.push(...personalizedKeys);
      
      // Invalidate collection-based recommendations
      const collectionKeys = this.findCacheKeysByPattern(`${activity.user_id}_collection_*`);
      affectedKeys.push(...collectionKeys);
    }

    if (activity.activity_type === 'search') {
      // Invalidate search-related caches
      const searchKeys = this.findCacheKeysByPattern(`${activity.user_id}_search_*`);
      affectedKeys.push(...searchKeys);
    }

    return [...new Set(affectedKeys)]; // Remove duplicates
  }

  private findCacheKeysByPattern(pattern: string): string[] {
    const keys = Array.from(this.cacheStore.keys());
    
    // Convert pattern to regex
    const regexPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    
    return keys.filter(key => regex.test(key));
  }

  private determineInvalidationReason(activity: any): string {
    switch (activity.activity_type) {
      case 'collection_add':
      case 'collection_remove':
        return 'user_collection_changed';
      case 'rating':
        return 'user_preference_updated';
      case 'search':
        return 'user_search_behavior';
      default:
        return 'user_activity_detected';
    }
  }

  private async invalidateCacheKeys(keys: string[], reason: string): Promise<string[]> {
    const invalidatedKeys = [];

    for (const key of keys) {
      // Remove from memory cache
      if (this.cacheStore.has(key)) {
        this.cacheStore.delete(key);
        invalidatedKeys.push(key);
      }

      // Remove from database cache
      try {
        await this.supabase
          .from('recommendation_cache')
          .delete()
          .eq('cache_key', key);
      } catch (error) {
        console.warn(`Failed to invalidate database cache for key ${key}:`, error);
      }
    }

    // Log invalidation for analytics
    this.logInvalidation(invalidatedKeys, reason);

    return invalidatedKeys;
  }

  private shouldTriggerCacheRefresh(activity: any, invalidatedKeys: string[]): boolean {
    // Trigger refresh for high-value users or significant activity
    const isHighValueUser = activity.user_id && activity.user_id.includes('premium'); // Simplified check
    const significantInvalidation = invalidatedKeys.length > 3;
    const criticalActivity = ['collection_add', 'rating'].includes(activity.activity_type);

    return isHighValueUser || (significantActivity && criticalActivity);
  }

  private calculateCachePriority(activity: any): number {
    let priority = 0.5; // Base priority

    // Increase priority based on activity type
    if (activity.activity_type === 'rating') {
      priority += 0.3; // High signal activity
    } else if (activity.activity_type === 'collection_add') {
      priority += 0.2; // Moderate signal activity
    }

    // Increase priority for engaged users
    if (activity.session_duration > 300000) { // > 5 minutes
      priority += 0.2;
    }

    return Math.min(1.0, priority);
  }

  /**
   * Create and execute cache warming plan
   */
  createWarmingPlan(warmingConfig: any): any {
    const planId = `warming_plan_${Date.now()}`;
    
    const strategies = warmingConfig.strategies.map((strategy: any) => ({
      strategy_type: strategy.type,
      execution_schedule: warmingConfig.schedule[strategy.type],
      priority: strategy.priority,
      estimated_execution_time: this.estimateWarmingTime(strategy),
      cache_coverage_improvement: this.estimateCoverageImprovement(strategy),
      resource_requirements: this.calculateWarmingResources(strategy)
    }));

    // Determine execution order based on priority and dependencies
    const executionOrder = strategies
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      })
      .map(s => s.strategy_type);

    const resourceRequirements = {
      peak_cpu_usage: Math.max(...strategies.map(s => s.resource_requirements.cpu)),
      peak_memory_usage: Math.max(...strategies.map(s => s.resource_requirements.memory)),
      estimated_cost: strategies.reduce((sum, s) => sum + s.resource_requirements.cost, 0)
    };

    return {
      plan_id: planId,
      strategies,
      execution_order: executionOrder,
      resource_requirements: resourceRequirements
    };
  }

  private estimateWarmingTime(strategy: any): number {
    // Estimate execution time based on strategy type and batch size
    const baseTimePerItem = 100; // ms
    return strategy.batch_size * baseTimePerItem;
  }

  private estimateCoverageImprovement(strategy: any): number {
    // Estimate how much cache coverage will improve
    switch (strategy.type) {
      case 'popular_users':
        return 0.3; // 30% improvement
      case 'trending_content':
        return 0.2; // 20% improvement
      case 'seasonal_recommendations':
        return 0.15; // 15% improvement
      default:
        return 0.1;
    }
  }

  private calculateWarmingResources(strategy: any): any {
    return {
      cpu: strategy.batch_size > 100 ? 0.4 : 0.2,
      memory: strategy.batch_size * 0.001, // 1KB per item estimate
      cost: strategy.batch_size * 0.001 // $0.001 per item estimate
    };
  }

  /**
   * Optimize cache storage with compression
   */
  optimizeStorage(cacheData: any): any {
    const originalSize = this.calculateDataSize(cacheData);
    
    if (!this.config.compression_enabled) {
      return {
        original_size_bytes: originalSize,
        compressed_size_bytes: originalSize,
        compression_ratio: 1.0,
        compression_method: 'none',
        decompression_time_ms: 0,
        storage_savings_percentage: 0
      };
    }

    // Apply compression
    const compressed = this.compressData(cacheData);
    const decompStartTime = Date.now();
    const decompressed = this.decompressData(compressed.data);
    const decompressionTime = Date.now() - decompStartTime;

    return {
      original_size_bytes: originalSize,
      compressed_size_bytes: compressed.size,
      compression_ratio: compressed.size / originalSize,
      compression_method: compressed.method,
      decompression_time_ms: decompressionTime,
      storage_savings_percentage: ((originalSize - compressed.size) / originalSize) * 100
    };
  }

  private calculateDataSize(data: any): number {
    // Estimate data size in bytes
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  }

  private compressData(data: any): { data: any; size: number; method: string } {
    // Simplified compression simulation
    const originalString = JSON.stringify(data);
    
    // Simulate compression by removing redundant data
    const compressed = {
      ...data,
      recommendations: data.recommendations?.map((rec: any) => ({
        id: rec.fragrance_id,
        conf: Math.round(rec.confidence_score * 100), // Reduce precision
        reason: rec.reasoning?.[0]?.substring(0, 50) // Truncate reasoning
      }))
    };

    const compressedString = JSON.stringify(compressed);
    
    return {
      data: compressed,
      size: new Blob([compressedString]).size,
      method: 'json_optimization'
    };
  }

  private decompressData(compressedData: any): any {
    // Simulate decompression by expanding abbreviated data
    return {
      ...compressedData,
      recommendations: compressedData.recommendations?.map((rec: any) => ({
        fragrance_id: rec.id,
        confidence_score: rec.conf / 100,
        reasoning: [rec.reason],
        metadata: { compressed: true }
      }))
    };
  }

  /**
   * Analyze cache performance
   */
  analyzeCachePerformance(metricsData: any): any {
    const {
      hits,
      misses,
      evictions,
      total_requests,
      avg_retrieval_time_ms,
      storage_utilization,
      invalidations
    } = metricsData;

    const hitRate = hits / (hits + misses);
    const missRate = misses / (hits + misses);
    const evictionRate = evictions / total_requests;
    const invalidationRate = invalidations / total_requests;

    // Calculate performance score
    const performanceScore = (
      (hitRate * 0.4) +
      (Math.max(0, 1 - avg_retrieval_time_ms / 50) * 0.3) + // Target 50ms or less
      (Math.max(0, 1 - evictionRate) * 0.2) +
      (storage_utilization * 0.1) // Higher utilization is good
    );

    // Generate recommendations
    const recommendations = [];
    
    if (hitRate < 0.8) {
      recommendations.push('Increase cache size or improve cache key strategy');
    }
    
    if (avg_retrieval_time_ms > 10) {
      recommendations.push('Optimize cache storage or enable compression');
    }
    
    if (evictionRate > 0.1) {
      recommendations.push('Increase cache capacity or optimize eviction policy');
    }

    // Capacity planning
    const capacityPlanning = {
      current_utilization: storage_utilization,
      projected_growth: this.projectCacheGrowth(metricsData),
      recommended_capacity: this.recommendCacheCapacity(metricsData),
      scaling_trigger: storage_utilization * 1.2 // Scale when 20% above current
    };

    return {
      hit_rate: hitRate,
      miss_rate: missRate,
      eviction_rate: evictionRate,
      avg_retrieval_time: avg_retrieval_time_ms,
      storage_efficiency: storage_utilization,
      invalidation_rate: invalidationRate,
      performance_score: performanceScore,
      recommendations,
      capacity_planning: capacityPlanning
    };
  }

  private projectCacheGrowth(metrics: any): number {
    // Project cache growth based on current trends
    const currentRequests = metrics.hits + metrics.misses;
    const growthRate = 0.15; // 15% monthly growth assumption
    
    return currentRequests * growthRate;
  }

  private recommendCacheCapacity(metrics: any): number {
    const currentCapacity = this.config.cache_layers[0].max_size_mb;
    const utilizationRatio = metrics.storage_utilization;
    
    // Recommend capacity based on target 70% utilization
    const targetUtilization = 0.7;
    const recommendedCapacity = currentCapacity * (utilizationRatio / targetUtilization);
    
    return Math.ceil(recommendedCapacity);
  }

  // Cache implementation methods
  private generateCacheKey(userId: string, type: string, context?: any): string {
    const contextStr = context ? JSON.stringify(context) : '';
    const hash = createHash('md5').update(`${userId}_${type}_${contextStr}`).digest('hex');
    return `rec_${userId}_${type}_${hash.substring(0, 8)}`;
  }

  private generateContextHash(context: any): string {
    if (!context) return '';
    return createHash('md5').update(JSON.stringify(context)).digest('hex');
  }

  private calculateRecommendationConfidence(recommendations: any[]): number {
    if (recommendations.length === 0) return 0;
    
    const avgConfidence = recommendations.reduce((sum, rec) => 
      sum + (rec.confidence_score || rec.confidence || 0.5), 0) / recommendations.length;
    
    return Math.min(1.0, avgConfidence);
  }

  private estimateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private getFromMemoryCache(cacheKey: string): CacheEntry | null {
    const entry = this.cacheStore.get(cacheKey);
    
    if (!entry) return null;
    
    // Check TTL
    if (Date.now() > entry.expires_at) {
      this.cacheStore.delete(cacheKey);
      return null;
    }

    // Update access statistics
    entry.access_count++;
    entry.last_accessed = Date.now();
    
    return entry;
  }

  private async getFromDatabaseCache(cacheKey: string): Promise<CacheEntry | null> {
    try {
      const { data: cacheData, error } = await this.supabase
        .from('recommendation_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gte('cache_expires_at', new Date().toISOString())
        .single();

      if (error || !cacheData) return null;

      // Convert database format to CacheEntry
      const entry: CacheEntry = {
        cache_key: cacheData.cache_key || cacheKey,
        user_id: cacheData.user_id,
        recommendation_type: cacheData.recommendation_type,
        recommendations: typeof cacheData.recommendations === 'string' ? 
          JSON.parse(cacheData.recommendations) : cacheData.recommendations,
        context_hash: cacheData.context_hash || '',
        confidence_score: cacheData.confidence_score || 0.5,
        created_at: new Date(cacheData.created_at).getTime(),
        expires_at: new Date(cacheData.cache_expires_at).getTime(),
        access_count: 1,
        last_accessed: Date.now(),
        cache_layer: 'database',
        size_bytes: this.estimateSize(cacheData.recommendations),
        compression_used: false,
        invalidation_version: 1
      };

      return entry;

    } catch (error) {
      console.warn('Failed to retrieve from database cache:', error);
      return null;
    }
  }

  private setInMemoryCache(cacheKey: string, entry: CacheEntry): void {
    // Check if we need to evict entries first
    this.enforceMemoryCacheSize();
    
    this.cacheStore.set(cacheKey, entry);
  }

  private async setInDatabaseCache(cacheKey: string, entry: CacheEntry): Promise<void> {
    try {
      await this.supabase
        .from('recommendation_cache')
        .upsert({
          cache_key: cacheKey,
          user_id: entry.user_id,
          recommendation_type: entry.recommendation_type,
          recommendations: JSON.stringify(entry.recommendations),
          context_hash: entry.context_hash,
          confidence_score: entry.confidence_score,
          cache_expires_at: new Date(entry.expires_at).toISOString(),
          created_at: new Date(entry.created_at).toISOString()
        });

    } catch (error) {
      console.warn('Failed to set database cache:', error);
    }
  }

  private enforceMemoryCacheSize(): void {
    const maxSize = this.config.cache_layers[0].max_size_mb * 1024 * 1024; // Convert to bytes
    let currentSize = 0;

    // Calculate current size
    for (const entry of this.cacheStore.values()) {
      currentSize += entry.size_bytes;
    }

    if (currentSize <= maxSize) return;

    // Evict entries based on eviction policy
    const entries = Array.from(this.cacheStore.entries());
    const evictionPolicy = this.config.cache_layers[0].eviction_policy;

    if (evictionPolicy === 'lru') {
      entries.sort(([, a], [, b]) => a.last_accessed - b.last_accessed);
    } else if (evictionPolicy === 'lfu') {
      entries.sort(([, a], [, b]) => a.access_count - b.access_count);
    } else if (evictionPolicy === 'ttl') {
      entries.sort(([, a], [, b]) => a.expires_at - b.expires_at);
    }

    // Remove entries until under size limit
    let removedSize = 0;
    let removedCount = 0;
    
    for (const [key, entry] of entries) {
      this.cacheStore.delete(key);
      removedSize += entry.size_bytes;
      removedCount++;
      
      if (currentSize - removedSize <= maxSize) {
        break;
      }
    }

    this.updateCacheMetrics('eviction', 'memory', removedSize, removedCount);
  }

  // Metrics and analytics
  private recordCacheHit(layer: string, cacheKey: string): void {
    this.updateCacheMetrics('hit', layer);
  }

  private recordCacheMiss(cacheKey: string): void {
    this.updateCacheMetrics('miss', 'memory');
  }

  private updateCacheMetrics(operation: string, layer: string, bytes?: number, count?: number): void {
    const metricsKey = `${layer}_${this.getCurrentTimeWindow()}`;
    let metrics = this.metrics.get(metricsKey);

    if (!metrics) {
      metrics = {
        cache_layer: layer,
        time_period: this.getCurrentTimeWindow(),
        hits: 0,
        misses: 0,
        hit_rate: 0,
        avg_retrieval_time_ms: 0,
        evictions: 0,
        invalidations: 0,
        warming_operations: 0,
        storage_utilization: 0,
        compression_ratio: 1.0,
        cost_savings_usd: 0
      };
    }

    switch (operation) {
      case 'hit':
        metrics.hits++;
        break;
      case 'miss':
        metrics.misses++;
        break;
      case 'eviction':
        metrics.evictions += count || 1;
        break;
      case 'invalidation':
        metrics.invalidations += count || 1;
        break;
      case 'warming':
        metrics.warming_operations++;
        break;
    }

    // Recalculate hit rate
    if (metrics.hits + metrics.misses > 0) {
      metrics.hit_rate = metrics.hits / (metrics.hits + metrics.misses);
    }

    this.metrics.set(metricsKey, metrics);
  }

  private getCurrentTimeWindow(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
  }

  private logInvalidation(keys: string[], reason: string): void {
    console.log(`Cache invalidation: ${keys.length} keys invalidated due to ${reason}`);
    this.updateCacheMetrics('invalidation', 'memory', 0, keys.length);
  }

  private initializeCacheSystem(): void {
    // Start periodic maintenance
    setInterval(() => {
      this.performCacheMaintenance();
    }, 300000); // Every 5 minutes

    // Start cache warming if enabled
    this.startCacheWarming();
  }

  private performCacheMaintenance(): void {
    // Clean expired entries
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, entry] of this.cacheStore.entries()) {
      if (now > entry.expires_at) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cacheStore.delete(key);
    }

    // Process invalidation queue
    this.processInvalidationQueue();

    // Process warming queue
    this.processWarmingQueue();
  }

  private processInvalidationQueue(): void {
    // Process pending invalidations
    while (this.invalidationQueue.length > 0) {
      const task = this.invalidationQueue.shift();
      if (task) {
        this.executeInvalidationTask(task);
      }
    }
  }

  private processWarmingQueue(): void {
    // Process pending warming tasks
    while (this.warmingQueue.length > 0) {
      const task = this.warmingQueue.shift();
      if (task) {
        this.executeWarmingTask(task);
      }
    }
  }

  private executeInvalidationTask(task: InvalidationTask): void {
    // Execute invalidation task
    console.log(`Executing invalidation task: ${task.task_id}`);
  }

  private executeWarmingTask(task: WarmingTask): void {
    // Execute warming task
    console.log(`Executing warming task: ${task.task_id}`);
  }

  private startCacheWarming(): void {
    // Initialize cache warming based on strategies
    for (const strategy of this.config.warming_strategies) {
      if (strategy.warming_schedule.schedule_type === 'periodic') {
        setInterval(() => {
          this.executeCacheWarming(strategy);
        }, strategy.warming_schedule.interval_ms || 900000);
      }
    }
  }

  private async executeCacheWarming(strategy: WarmingStrategy): Promise<void> {
    try {
      console.log(`Executing cache warming: ${strategy.strategy_name}`);
      
      // Implementation would depend on strategy type
      // For now, just log the execution
      this.updateCacheMetrics('warming', 'memory');
      
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }

  // Public API
  getCacheMetrics(layer?: string): Map<string, CacheMetrics> {
    if (layer) {
      const layerMetrics = new Map();
      for (const [key, metrics] of this.metrics.entries()) {
        if (metrics.cache_layer === layer) {
          layerMetrics.set(key, metrics);
        }
      }
      return layerMetrics;
    }
    
    return new Map(this.metrics);
  }

  getCacheConfiguration(): CacheConfiguration {
    return { ...this.config };
  }

  getCurrentCacheSize(): { memory_mb: number; database_entries: number } {
    const memorySize = Array.from(this.cacheStore.values())
      .reduce((sum, entry) => sum + entry.size_bytes, 0) / (1024 * 1024);

    return {
      memory_mb: memorySize,
      database_entries: 0 // Would query database for actual count
    };
  }
}

// Supporting interfaces and types
interface InvalidationTask {
  task_id: string;
  strategy: string;
  cache_keys: string[];
  reason: string;
  scheduled_at: number;
  priority: 'immediate' | 'batch' | 'scheduled';
}

interface WarmingTask {
  task_id: string;
  strategy: string;
  target_users: string[];
  target_content: string[];
  scheduled_at: number;
  priority: 'high' | 'medium' | 'low';
}

// Export factory function
export const createRecommendationCacheManager = (config?: Partial<CacheConfiguration>) => {
  return new RecommendationCacheManager(config || {});
};

// Factory function for multi-tier embedding cache
export function createMultiTierEmbeddingCache(
  supabase: ReturnType<typeof createClient<Database>>,
  config: Partial<EmbeddingCacheConfig> = {}
): MultiTierEmbeddingCache {
  return new MultiTierEmbeddingCache(supabase, config);
}

// Export multi-resolution embedding cache classes
export {
  EmbeddingCacheStats
};

// Export additional classes
export {
  AIProviderCostMonitor,
  createAIProviderCostMonitor,
  DEFAULT_COST_CONFIG
} from './ai-cost-optimizer';