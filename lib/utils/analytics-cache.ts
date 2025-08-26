import { createServerSupabase } from '@/lib/supabase/server';
import type { InsightType, CacheOptions, AnalyticsPerformanceMetrics } from '@/lib/types/collection-analytics';

/**
 * Analytics Cache Utility - Task 1.4
 * 
 * Manages caching for expensive analytics calculations
 * Provides intelligent cache invalidation and background refresh
 */

interface CacheEntry<T = any> {
  data: T;
  generated_at: string;
  expires_at: string;
  cache_version: number;
  generation_time_ms: number;
}

interface CacheKey {
  userId: string;
  insightType: InsightType;
  version?: number;
}

export class AnalyticsCache {
  private static instance: AnalyticsCache;
  private supabase: ReturnType<typeof createServerSupabase> | null = null;

  constructor() {
    // Singleton pattern for cache management
  }

  static getInstance(): AnalyticsCache {
    if (!AnalyticsCache.instance) {
      AnalyticsCache.instance = new AnalyticsCache();
    }
    return AnalyticsCache.instance;
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createServerSupabase();
    }
    return this.supabase;
  }

  /**
   * Get cached insights with automatic expiration checking
   */
  async get<T>(
    key: CacheKey, 
    options: CacheOptions = {}
  ): Promise<CacheEntry<T> | null> {
    if (options.force_refresh) {
      return null;
    }

    const supabase = await this.getSupabase();

    try {
      const { data, error } = await supabase
        .from('collection_insights_cache')
        .select('*')
        .eq('user_id', key.userId)
        .eq('insight_type', key.insightType)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if cache is still valid
      const now = new Date();
      const expiresAt = new Date(data.expires_at);

      if (now > expiresAt) {
        // Cache expired, remove it
        await this.remove(key);
        return null;
      }

      return {
        data: data.insight_data,
        generated_at: data.generated_at,
        expires_at: data.expires_at,
        cache_version: data.cache_version,
        generation_time_ms: data.generation_time_ms
      };

    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cache entry with automatic expiration
   */
  async set<T>(
    key: CacheKey,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const supabase = await this.getSupabase();
    const ttl = options.ttl || 3600; // Default 1 hour
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    try {
      const cacheEntry = {
        user_id: key.userId,
        insight_type: key.insightType,
        insight_data: data,
        generated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        cache_version: key.version || 1,
        generation_time_ms: 0 // Will be updated by caller
      };

      const { error } = await supabase
        .from('collection_insights_cache')
        .upsert(cacheEntry);

      if (error) {
        console.warn('Cache set error:', error);
      }
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }

  /**
   * Remove cache entry
   */
  async remove(key: CacheKey): Promise<void> {
    const supabase = await this.getSupabase();

    try {
      const { error } = await supabase
        .from('collection_insights_cache')
        .delete()
        .eq('user_id', key.userId)
        .eq('insight_type', key.insightType);

      if (error) {
        console.warn('Cache remove error:', error);
      }
    } catch (error) {
      console.warn('Failed to remove cache:', error);
    }
  }

  /**
   * Clear all cache entries for a user
   */
  async clearUserCache(userId: string): Promise<void> {
    const supabase = await this.getSupabase();

    try {
      const { error } = await supabase
        .from('collection_insights_cache')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.warn('Clear user cache error:', error);
      }
    } catch (error) {
      console.warn('Failed to clear user cache:', error);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(userId?: string): Promise<{
    total_entries: number;
    expired_entries: number;
    cache_hit_ratio?: number;
    average_generation_time: number;
  }> {
    const supabase = await this.getSupabase();

    try {
      let query = supabase.from('collection_insights_cache').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error || !data) {
        return {
          total_entries: 0,
          expired_entries: 0,
          average_generation_time: 0
        };
      }

      const now = new Date();
      const expiredEntries = data.filter(entry => new Date(entry.expires_at) < now);
      const totalGenerationTime = data.reduce((sum, entry) => sum + entry.generation_time_ms, 0);

      return {
        total_entries: data.length,
        expired_entries: expiredEntries.length,
        average_generation_time: data.length > 0 ? Math.round(totalGenerationTime / data.length) : 0
      };

    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return {
        total_entries: 0,
        expired_entries: 0,
        average_generation_time: 0
      };
    }
  }

  /**
   * Cleanup expired cache entries
   */
  async cleanupExpired(): Promise<number> {
    const supabase = await this.getSupabase();

    try {
      const { error } = await supabase.rpc('cleanup_expired_insights_cache');

      if (error) {
        console.warn('Cache cleanup error:', error);
        return 0;
      }

      // Return approximate count (could be improved with better RPC function)
      const stats = await this.getCacheStats();
      return stats.expired_entries;

    } catch (error) {
      console.warn('Failed to cleanup expired cache:', error);
      return 0;
    }
  }

  /**
   * Warm cache for a user by pre-generating common insights
   */
  async warmCache(
    userId: string,
    insightTypes: InsightType[] = ['scent_profile_analysis', 'collection_statistics']
  ): Promise<void> {
    // This would typically be called by a background job
    // For now, we'll just mark the cache as needing refresh

    for (const insightType of insightTypes) {
      // Invalidate existing cache to trigger regeneration
      await this.remove({ userId, insightType });
    }

    console.log(`Cache warming scheduled for user ${userId}, insights: ${insightTypes.join(', ')}`);
  }

  /**
   * Get or generate cached data with performance tracking
   */
  async getOrGenerate<T>(
    key: CacheKey,
    generator: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<{ data: T; cached: boolean; performance: AnalyticsPerformanceMetrics }> {
    const startTime = performance.now();

    // Try cache first
    const cached = await this.get<T>(key, options);
    
    if (cached && !options.force_refresh) {
      const endTime = performance.now();
      return {
        data: cached.data,
        cached: true,
        performance: {
          query_time_ms: Math.round(endTime - startTime),
          cache_hit: true,
          data_size_kb: this.calculateDataSize(cached.data),
          complexity_score: 1 // Cache reads are low complexity
        }
      };
    }

    // Generate fresh data
    const generationStart = performance.now();
    const freshData = await generator();
    const generationTime = Math.round(performance.now() - generationStart);

    // Cache the result
    await this.set(key, freshData, options);

    const endTime = performance.now();

    return {
      data: freshData,
      cached: false,
      performance: {
        query_time_ms: Math.round(endTime - startTime),
        cache_hit: false,
        data_size_kb: this.calculateDataSize(freshData),
        complexity_score: this.calculateComplexityScore(generationTime)
      }
    };
  }

  /**
   * Calculate approximate data size in KB
   */
  private calculateDataSize(data: any): number {
    try {
      const jsonString = JSON.stringify(data);
      return Math.round(new Blob([jsonString]).size / 1024);
    } catch {
      return 0;
    }
  }

  /**
   * Calculate complexity score based on generation time
   */
  private calculateComplexityScore(generationTimeMs: number): number {
    // Score 1-10 based on generation time
    if (generationTimeMs < 100) return 1;
    if (generationTimeMs < 500) return 3;
    if (generationTimeMs < 1000) return 5;
    if (generationTimeMs < 5000) return 7;
    return 10;
  }

  /**
   * Background cache refresh for expensive operations
   */
  async scheduleBackgroundRefresh(
    key: CacheKey,
    generator: () => Promise<any>,
    options: CacheOptions = {}
  ): Promise<void> {
    // In a real implementation, this would use a job queue
    // For now, we'll use setTimeout for demonstration

    setTimeout(async () => {
      try {
        const freshData = await generator();
        await this.set(key, freshData, { ...options, ttl: options.ttl || 3600 });
        console.log(`Background refresh completed for ${key.insightType} - user ${key.userId}`);
      } catch (error) {
        console.warn('Background refresh failed:', error);
      }
    }, 1000); // Delay to avoid blocking main thread
  }
}

// Export singleton instance
export const analyticsCache = AnalyticsCache.getInstance();

// Utility functions for cache management
export const cacheUtils = {
  /**
   * Create cache key from user ID and insight type
   */
  createKey: (userId: string, insightType: InsightType, version = 1): CacheKey => ({
    userId,
    insightType,
    version
  }),

  /**
   * Check if cache should be refreshed based on user activity
   */
  shouldRefresh: (lastGeneratedAt: string, userLastActivity: string): boolean => {
    const generated = new Date(lastGeneratedAt);
    const activity = new Date(userLastActivity);
    return activity > generated;
  },

  /**
   * Calculate optimal TTL based on insight type
   */
  calculateTTL: (insightType: InsightType): number => {
    const ttlMap: Record<InsightType, number> = {
      'collection_statistics': 300,      // 5 minutes - frequently changing
      'scent_profile_analysis': 1800,    // 30 minutes - moderate change
      'recommendation_accuracy': 3600,   // 1 hour - slow change
      'seasonal_preferences': 7200,      // 2 hours - seasonal data
      'brand_affinity': 3600,           // 1 hour - moderate change
      'discovery_patterns': 1800,       // 30 minutes - user behavior
      'social_context': 900,            // 15 minutes - social data changes fast
      'comprehensive_insights': 3600    // 1 hour - full insights
    };

    return ttlMap[insightType] || 3600; // Default 1 hour
  }
};