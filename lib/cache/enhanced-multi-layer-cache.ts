/**
 * Enhanced Multi-Layer Caching System
 *
 * Comprehensive caching strategy for sub-200ms recommendation generation:
 *
 * Layer 1: In-Memory Cache (2-5ms access)
 * Layer 2: Redis Cache (8-15ms access)
 * Layer 3: Database Cache (25-50ms access)
 * Layer 4: AI Generation/DB Query (200-500ms)
 *
 * Target: 85% overall cache hit rate, sub-200ms average response time
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
  source: 'memory' | 'redis' | 'database' | 'generated';
  access_count: number;
  last_accessed: number;
  cache_key: string;
  metadata?: Record<string, any>;
}

export interface CacheResult<T = any> {
  data: T;
  hit: boolean;
  source: 'memory' | 'redis' | 'database' | 'generated';
  access_time_ms: number;
  cache_key: string;
}

export interface CacheStrategy {
  ttl_seconds: number;
  max_size: number;
  eviction_policy: 'lru' | 'lfu' | 'ttl';
  persistence: boolean;
  compression: boolean;
}

/**
 * Enhanced Multi-Layer Cache Manager
 */
export class EnhancedMultiLayerCache {
  private memoryCache = new Map<string, CacheEntry>();
  private cacheStats = {
    hits: { memory: 0, redis: 0, database: 0 },
    misses: 0,
    total_requests: 0,
    total_response_time: 0,
  };

  // Cache strategies for different data types
  private readonly strategies: Record<string, CacheStrategy> = {
    // User profiles - frequently accessed, medium TTL
    user_profiles: {
      ttl_seconds: 24 * 60 * 60, // 24 hours
      max_size: 1000,
      eviction_policy: 'lru',
      persistence: true,
      compression: false,
    },

    // AI generated profiles - expensive to generate, long TTL
    ai_profiles: {
      ttl_seconds: 7 * 24 * 60 * 60, // 7 days
      max_size: 2000,
      eviction_policy: 'lfu',
      persistence: true,
      compression: true,
    },

    // Fragrance recommendations - personalized, short TTL
    recommendations: {
      ttl_seconds: 6 * 60 * 60, // 6 hours
      max_size: 5000,
      eviction_policy: 'lru',
      persistence: true,
      compression: false,
    },

    // AI descriptions - expensive, medium TTL
    ai_descriptions: {
      ttl_seconds: 3 * 24 * 60 * 60, // 3 days
      max_size: 3000,
      eviction_policy: 'lfu',
      persistence: true,
      compression: true,
    },

    // Fragrance metadata - stable data, long TTL
    fragrance_metadata: {
      ttl_seconds: 7 * 24 * 60 * 60, // 7 days
      max_size: 10000,
      eviction_policy: 'ttl',
      persistence: true,
      compression: false,
    },

    // Quiz session data - temporary, short TTL
    quiz_sessions: {
      ttl_seconds: 2 * 60 * 60, // 2 hours
      max_size: 1000,
      eviction_policy: 'lru',
      persistence: false,
      compression: false,
    },

    // Vector similarity results - computationally expensive, medium TTL
    vector_similarities: {
      ttl_seconds: 12 * 60 * 60, // 12 hours
      max_size: 2000,
      eviction_policy: 'lfu',
      persistence: true,
      compression: false,
    },
  };

  constructor() {
    // Set up periodic cache maintenance
    setInterval(() => this.performMaintenance(), 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Get data using multi-layer cache strategy
   */
  async get<T>(
    cacheKey: string,
    cacheType: keyof typeof this.strategies,
    generator?: () => Promise<T>
  ): Promise<CacheResult<T>> {
    const startTime = performance.now();
    this.cacheStats.total_requests++;

    // Layer 1: In-Memory Cache
    const memoryResult = this.getFromMemory<T>(cacheKey, cacheType);
    if (memoryResult.hit) {
      const accessTime = performance.now() - startTime;
      this.cacheStats.hits.memory++;
      this.updateStats(accessTime);
      return { ...memoryResult, access_time_ms: accessTime };
    }

    // Layer 2: Redis Cache (simulated for now)
    const redisResult = await this.getFromRedis<T>(cacheKey, cacheType);
    if (redisResult.hit) {
      // Store in memory for faster future access
      this.setInMemory(cacheKey, cacheType, redisResult.data);

      const accessTime = performance.now() - startTime;
      this.cacheStats.hits.redis++;
      this.updateStats(accessTime);
      return { ...redisResult, access_time_ms: accessTime };
    }

    // Layer 3: Database Cache (simulated)
    const dbResult = await this.getFromDatabase<T>(cacheKey, cacheType);
    if (dbResult.hit) {
      // Store in Redis and memory
      await this.setInRedis(cacheKey, cacheType, dbResult.data);
      this.setInMemory(cacheKey, cacheType, dbResult.data);

      const accessTime = performance.now() - startTime;
      this.cacheStats.hits.database++;
      this.updateStats(accessTime);
      return { ...dbResult, access_time_ms: accessTime };
    }

    // Layer 4: Generate fresh data
    if (generator) {
      try {
        const generatedData = await generator();

        // Store in all layers
        await this.setInDatabase(cacheKey, cacheType, generatedData);
        await this.setInRedis(cacheKey, cacheType, generatedData);
        this.setInMemory(cacheKey, cacheType, generatedData);

        const accessTime = performance.now() - startTime;
        this.cacheStats.misses++;
        this.updateStats(accessTime);

        return {
          data: generatedData,
          hit: false,
          source: 'generated',
          access_time_ms: accessTime,
          cache_key: cacheKey,
        };
      } catch (error) {
        console.error('Cache generation failed:', error);
        throw error;
      }
    }

    // No generator provided and no cache hit
    throw new Error(
      `Cache miss and no generator provided for key: ${cacheKey}`
    );
  }

  /**
   * Set data in appropriate cache layers
   */
  async set<T>(
    cacheKey: string,
    cacheType: keyof typeof this.strategies,
    data: T,
    customTTL?: number
  ): Promise<void> {
    const strategy = this.strategies[cacheType];

    // Store in memory cache
    this.setInMemory(cacheKey, cacheType, data, customTTL);

    // Store in Redis if persistence enabled
    if (strategy.persistence) {
      await this.setInRedis(cacheKey, cacheType, data, customTTL);
    }
  }

  /**
   * Invalidate cache across all layers
   */
  async invalidate(cacheKey: string): Promise<void> {
    // Remove from memory
    this.memoryCache.delete(cacheKey);

    // Remove from Redis (simulated)
    await this.deleteFromRedis(cacheKey);

    // Remove from database cache (simulated)
    await this.deleteFromDatabase(cacheKey);
  }

  /**
   * Bulk invalidation with pattern matching
   */
  async invalidatePattern(pattern: string): Promise<number> {
    let invalidatedCount = 0;

    // Convert pattern to regex
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));

    // Memory cache invalidation
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        invalidatedCount++;
      }
    }

    // Redis pattern invalidation (would use SCAN in real Redis)
    const redisInvalidated = await this.deletePatternFromRedis(pattern);
    invalidatedCount += redisInvalidated;

    return invalidatedCount;
  }

  /**
   * Preload frequently accessed data
   */
  async preload(
    preloadSpecs: Array<{
      cache_key: string;
      cache_type: keyof typeof this.strategies;
      generator: () => Promise<any>;
      priority: number;
    }>
  ): Promise<void> {
    // Sort by priority
    const sortedSpecs = preloadSpecs.sort((a, b) => b.priority - a.priority);

    // Preload in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < sortedSpecs.length; i += batchSize) {
      const batch = sortedSpecs.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async spec => {
          try {
            if (!this.has(spec.cache_key)) {
              await this.get(spec.cache_key, spec.cache_type, spec.generator);
            }
          } catch (error) {
            console.warn(`Preload failed for ${spec.cache_key}:`, error);
          }
        })
      );

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Memory Cache Operations
   */
  private getFromMemory<T>(
    cacheKey: string,
    cacheType: string
  ): CacheResult<T> {
    const entry = this.memoryCache.get(cacheKey);

    if (!entry) {
      return {
        data: null as any,
        hit: false,
        source: 'memory',
        access_time_ms: 0,
        cache_key: cacheKey,
      };
    }

    // Check expiry
    if (Date.now() > entry.expiry) {
      this.memoryCache.delete(cacheKey);
      return {
        data: null as any,
        hit: false,
        source: 'memory',
        access_time_ms: 0,
        cache_key: cacheKey,
      };
    }

    // Update access metadata
    entry.access_count++;
    entry.last_accessed = Date.now();

    return {
      data: entry.data,
      hit: true,
      source: 'memory',
      access_time_ms: 2, // Typical memory access time
      cache_key: cacheKey,
    };
  }

  private setInMemory<T>(
    cacheKey: string,
    cacheType: keyof typeof this.strategies,
    data: T,
    customTTL?: number
  ): void {
    const strategy = this.strategies[cacheType];
    const ttl = customTTL || strategy.ttl_seconds;

    // LRU eviction if needed
    if (this.memoryCache.size >= strategy.max_size) {
      this.evictFromMemory(strategy.eviction_policy);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl * 1000,
      source: 'memory',
      access_count: 0,
      last_accessed: Date.now(),
      cache_key: cacheKey,
    };

    this.memoryCache.set(cacheKey, entry);
  }

  /**
   * Redis Cache Operations (Simulated - would connect to real Redis)
   */
  private async getFromRedis<T>(
    cacheKey: string,
    cacheType: string
  ): Promise<CacheResult<T>> {
    // Simulate Redis access time
    await new Promise(resolve => setTimeout(resolve, 8));

    // Simulate 70% Redis hit rate
    const hit = Math.random() < 0.7;

    if (hit) {
      // Simulate cached data
      const mockData = this.generateMockCacheData<T>(cacheKey, cacheType);
      return {
        data: mockData,
        hit: true,
        source: 'redis',
        access_time_ms: 8,
        cache_key: cacheKey,
      };
    }

    return {
      data: null as any,
      hit: false,
      source: 'redis',
      access_time_ms: 8,
      cache_key: cacheKey,
    };
  }

  private async setInRedis<T>(
    cacheKey: string,
    cacheType: keyof typeof this.strategies,
    data: T,
    customTTL?: number
  ): Promise<void> {
    // Simulate Redis write time
    await new Promise(resolve => setTimeout(resolve, 5));

    // In production, would use: await redis.setex(cacheKey, ttl, JSON.stringify(data))
    console.debug(`Redis SET: ${cacheKey} (${cacheType})`);
  }

  private async deleteFromRedis(cacheKey: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 3));
    console.debug(`Redis DEL: ${cacheKey}`);
  }

  private async deletePatternFromRedis(pattern: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 10));
    console.debug(`Redis pattern delete: ${pattern}`);
    return Math.floor(Math.random() * 20); // Simulate deletion count
  }

  /**
   * Database Cache Operations (Simulated)
   */
  private async getFromDatabase<T>(
    cacheKey: string,
    cacheType: string
  ): Promise<CacheResult<T>> {
    // Simulate database access time
    await new Promise(resolve => setTimeout(resolve, 25));

    // Simulate 40% database cache hit rate
    const hit = Math.random() < 0.4;

    if (hit) {
      const mockData = this.generateMockCacheData<T>(cacheKey, cacheType);
      return {
        data: mockData,
        hit: true,
        source: 'database',
        access_time_ms: 25,
        cache_key: cacheKey,
      };
    }

    return {
      data: null as any,
      hit: false,
      source: 'database',
      access_time_ms: 25,
      cache_key: cacheKey,
    };
  }

  private async setInDatabase<T>(
    cacheKey: string,
    cacheType: keyof typeof this.strategies,
    data: T
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 15));
    console.debug(`Database cache SET: ${cacheKey} (${cacheType})`);
  }

  private async deleteFromDatabase(cacheKey: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10));
    console.debug(`Database cache DEL: ${cacheKey}`);
  }

  /**
   * Memory Eviction Strategies
   */
  private evictFromMemory(policy: 'lru' | 'lfu' | 'ttl'): void {
    if (this.memoryCache.size === 0) return;

    let keyToEvict: string | null = null;

    switch (policy) {
      case 'lru':
        // Least Recently Used
        let oldestAccess = Date.now();
        for (const [key, entry] of this.memoryCache.entries()) {
          if (entry.last_accessed < oldestAccess) {
            oldestAccess = entry.last_accessed;
            keyToEvict = key;
          }
        }
        break;

      case 'lfu':
        // Least Frequently Used
        let lowestCount = Infinity;
        for (const [key, entry] of this.memoryCache.entries()) {
          if (entry.access_count < lowestCount) {
            lowestCount = entry.access_count;
            keyToEvict = key;
          }
        }
        break;

      case 'ttl':
        // Shortest TTL remaining
        let shortestTTL = Infinity;
        const now = Date.now();
        for (const [key, entry] of this.memoryCache.entries()) {
          const remainingTTL = entry.expiry - now;
          if (remainingTTL < shortestTTL) {
            shortestTTL = remainingTTL;
            keyToEvict = key;
          }
        }
        break;
    }

    if (keyToEvict) {
      this.memoryCache.delete(keyToEvict);
    }
  }

  /**
   * Cache Maintenance and Cleanup
   */
  private performMaintenance(): void {
    const now = Date.now();
    const beforeSize = this.memoryCache.size;

    // Remove expired entries
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiry) {
        this.memoryCache.delete(key);
      }
    }

    const expiredCount = beforeSize - this.memoryCache.size;
    if (expiredCount > 0) {
      console.debug(
        `Cache maintenance: removed ${expiredCount} expired entries`
      );
    }

    // Trigger garbage collection if memory pressure is high
    if (this.memoryCache.size > 5000) {
      this.forceEviction();
    }
  }

  private forceEviction(): void {
    const targetSize = Math.floor(this.memoryCache.size * 0.8); // Evict 20%
    const entries = Array.from(this.memoryCache.entries());

    // Sort by access count (LFU) for aggressive eviction
    entries.sort((a, b) => a[1].access_count - b[1].access_count);

    const toEvict = entries.slice(0, this.memoryCache.size - targetSize);
    toEvict.forEach(([key]) => this.memoryCache.delete(key));

    console.debug(`Force eviction: removed ${toEvict.length} entries`);
  }

  /**
   * Utility Methods
   */
  private has(cacheKey: string): boolean {
    const entry = this.memoryCache.get(cacheKey);
    return entry ? Date.now() <= entry.expiry : false;
  }

  private updateStats(accessTime: number): void {
    this.cacheStats.total_response_time += accessTime;
  }

  private generateMockCacheData<T>(cacheKey: string, cacheType: string): T {
    // Generate appropriate mock data based on cache type
    const mockData = {
      user_profiles: { id: 'user123', experience_level: 'enthusiast' },
      ai_profiles: {
        profile_name: 'Elegant Rose of Gardens',
        uniqueness_score: 0.85,
      },
      recommendations: [{ id: 'frag1', match_score: 0.92 }],
      ai_descriptions: {
        description: 'Perfect match for your sophisticated taste',
      },
      fragrance_metadata: {
        id: 'frag1',
        name: 'Chanel No. 5',
        brand: 'Chanel',
      },
      quiz_sessions: { session_id: 'session123', responses: [] },
      vector_similarities: [{ fragrance_id: 'frag1', similarity: 0.89 }],
    };

    return (mockData[cacheType as keyof typeof mockData] || {}) as T;
  }

  /**
   * Cache Statistics and Monitoring
   */
  public getStats() {
    const totalHits =
      this.cacheStats.hits.memory +
      this.cacheStats.hits.redis +
      this.cacheStats.hits.database;
    const hitRate = totalHits / Math.max(this.cacheStats.total_requests, 1);
    const avgResponseTime =
      this.cacheStats.total_response_time /
      Math.max(this.cacheStats.total_requests, 1);

    return {
      total_requests: this.cacheStats.total_requests,
      hit_rate: hitRate,
      miss_rate: 1 - hitRate,
      avg_response_time_ms: avgResponseTime,
      cache_size: this.memoryCache.size,
      layer_performance: {
        memory: {
          hits: this.cacheStats.hits.memory,
          hit_rate:
            this.cacheStats.hits.memory /
            Math.max(this.cacheStats.total_requests, 1),
          avg_access_time: 2,
        },
        redis: {
          hits: this.cacheStats.hits.redis,
          hit_rate:
            this.cacheStats.hits.redis /
            Math.max(this.cacheStats.total_requests, 1),
          avg_access_time: 8,
        },
        database: {
          hits: this.cacheStats.hits.database,
          hit_rate:
            this.cacheStats.hits.database /
            Math.max(this.cacheStats.total_requests, 1),
          avg_access_time: 25,
        },
      },
      strategies: this.strategies,
    };
  }

  public resetStats(): void {
    this.cacheStats = {
      hits: { memory: 0, redis: 0, database: 0 },
      misses: 0,
      total_requests: 0,
      total_response_time: 0,
    };
  }

  public clearAllCaches(): void {
    this.memoryCache.clear();
    console.debug('All caches cleared');
  }
}

/**
 * Specialized Cache for Enhanced Quiz System
 */
export class EnhancedQuizCache extends EnhancedMultiLayerCache {
  /**
   * Cache AI Profile with optimal strategy
   */
  async cacheAIProfile(
    profileKey: string,
    profileData: any
  ): Promise<CacheResult<any>> {
    return this.get(`ai_profile:${profileKey}`, 'ai_profiles', async () => {
      // Would generate AI profile here
      return {
        profile_name: 'Generated Profile Name',
        style_descriptor: 'sophisticated',
        description: {
          paragraph_1: 'Generated description...',
          paragraph_2: 'More description...',
          paragraph_3: 'Final paragraph...',
        },
        uniqueness_score: 0.85,
        personality_insights: ['insight1', 'insight2'],
      };
    });
  }

  /**
   * Cache Recommendations with user context
   */
  async cacheRecommendations(
    userId: string,
    profileHash: string,
    preferencesHash: string
  ): Promise<CacheResult<any[]>> {
    const cacheKey = `recommendations:${userId}:${profileHash}:${preferencesHash}`;

    return this.get(cacheKey, 'recommendations', async () => {
      // Would generate recommendations here
      return [
        { fragrance_id: '1', match_score: 0.92, reason: 'Perfect match' },
        { fragrance_id: '2', match_score: 0.87, reason: 'Great choice' },
        { fragrance_id: '3', match_score: 0.82, reason: 'Good option' },
      ];
    });
  }

  /**
   * Cache Fragrance Metadata with long TTL
   */
  async cacheFragranceMetadata(fragranceId: string): Promise<CacheResult<any>> {
    return this.get(
      `fragrance:${fragranceId}`,
      'fragrance_metadata',
      async () => {
        // Would fetch from database
        return {
          id: fragranceId,
          name: 'Mock Fragrance',
          brand: 'Mock Brand',
          accords: ['floral', 'woody'],
          rating: 4.2,
        };
      }
    );
  }

  /**
   * Cache Vector Similarity Results
   */
  async cacheVectorSimilarity(
    profileVector: string,
    targetType: 'fragrances' | 'users'
  ): Promise<CacheResult<any[]>> {
    const cacheKey = `vector_sim:${profileVector}:${targetType}`;

    return this.get(cacheKey, 'vector_similarities', async () => {
      // Would perform vector similarity search
      return [
        { target_id: '1', similarity: 0.94 },
        { target_id: '2', similarity: 0.89 },
        { target_id: '3', similarity: 0.85 },
      ];
    });
  }

  /**
   * Smart Cache Warming for Quiz Flow
   */
  async warmQuizCaches(
    experienceLevel: 'beginner' | 'enthusiast' | 'collector'
  ): Promise<void> {
    const warmingSpecs = [
      // Popular fragrance metadata
      {
        cache_key: 'popular_fragrances:women',
        cache_type: 'fragrance_metadata' as const,
        generator: () => this.loadPopularFragrances('women'),
        priority: 10,
      },
      {
        cache_key: 'popular_fragrances:men',
        cache_type: 'fragrance_metadata' as const,
        generator: () => this.loadPopularFragrances('men'),
        priority: 9,
      },

      // Experience-level specific templates
      {
        cache_key: `quiz_templates:${experienceLevel}`,
        cache_type: 'ai_descriptions' as const,
        generator: () => this.loadQuizTemplates(experienceLevel),
        priority: 8,
      },

      // Common personality combinations
      {
        cache_key: 'common_traits:sophisticated_romantic',
        cache_type: 'ai_profiles' as const,
        generator: () => this.loadCommonTraitProfiles('sophisticated_romantic'),
        priority: 7,
      },
    ];

    await this.preload(warmingSpecs);
    console.log(`Cache warming completed for ${experienceLevel} level`);
  }

  /**
   * Cache Warming Helpers
   */
  private async loadPopularFragrances(gender: string): Promise<any[]> {
    // Would fetch popular fragrances from database
    return [
      { id: '1', name: 'Chanel No. 5', brand: 'Chanel', gender },
      { id: '2', name: 'Miss Dior', brand: 'Dior', gender },
    ];
  }

  private async loadQuizTemplates(experienceLevel: string): Promise<any[]> {
    // Would load quiz templates for experience level
    return [
      {
        template_id: `${experienceLevel}_template_1`,
        content: 'Template content...',
      },
    ];
  }

  private async loadCommonTraitProfiles(
    traitCombination: string
  ): Promise<any> {
    // Would load common trait combinations
    return {
      trait_combination: traitCombination,
      profile_template: 'Common profile template...',
    };
  }
}

/**
 * Global Cache Instance
 */
export const enhancedCache = new EnhancedQuizCache();

/**
 * Cache Decorator for Performance-Critical Functions
 */
export function cached(
  cacheType: keyof EnhancedQuizCache['strategies'],
  keyGenerator: (...args: any[]) => string,
  ttl?: number
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args);

      try {
        const result = await enhancedCache.get(cacheKey, cacheType, () =>
          method.apply(this, args)
        );

        return result.data;
      } catch (error) {
        console.warn(`Cached method ${propertyName} failed:`, error);
        return method.apply(this, args);
      }
    };

    return descriptor;
  };
}
