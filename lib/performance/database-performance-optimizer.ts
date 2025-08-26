/**
 * Database Performance Optimizer
 * Task 7.3: Optimize database queries for improved response times
 * Target: All queries < 100ms, complex queries < 500ms
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface QueryPerformanceMetric {
  queryName: string;
  executionTime: number;
  rowsReturned: number;
  cacheHit: boolean;
  optimizationApplied: string[];
  timestamp: number;
}

export interface QueryOptimizationConfig {
  enableCaching: boolean;
  cacheMaxAge: number;
  enableIndexHints: boolean;
  enableQueryBatching: boolean;
  maxBatchSize: number;
}

class DatabasePerformanceOptimizer {
  private supabase: SupabaseClient;
  private config: QueryOptimizationConfig;
  private queryMetrics: QueryPerformanceMetric[] = [];
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  constructor(supabase: SupabaseClient, config: Partial<QueryOptimizationConfig> = {}) {
    this.supabase = supabase;
    this.config = {
      enableCaching: true,
      cacheMaxAge: 300000, // 5 minutes
      enableIndexHints: true,
      enableQueryBatching: true,
      maxBatchSize: 50,
      ...config
    };
  }

  /**
   * Optimized fragrance search with intelligent caching and indexing
   * Target: < 100ms response time
   */
  async optimizedFragranceSearch(
    query: string,
    filters: {
      brands?: string[];
      families?: string[];
      minRating?: number;
      maxPrice?: number;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ data: any[]; metrics: QueryPerformanceMetric }> {
    const startTime = performance.now();
    const queryName = 'fragrance_search';
    const cacheKey = `search:${query}:${JSON.stringify(filters)}`;
    const optimizations: string[] = [];

    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        optimizations.push('cache_hit');
        return {
          data: cached,
          metrics: this.createMetric(queryName, performance.now() - startTime, cached.length, true, optimizations)
        };
      }
    }

    try {
      // Build optimized query with proper indexing
      let supabaseQuery = this.supabase
        .from('fragrances')
        .select(`
          id,
          name,
          brand:fragrance_brands(name),
          description,
          scent_family,
          rating,
          price_range,
          image_url,
          popularity_score,
          created_at
        `);

      // Apply search optimization
      if (query) {
        // Use full-text search for better performance
        supabaseQuery = supabaseQuery.textSearch('search_vector', query, {
          type: 'websearch',
          config: 'english'
        });
        optimizations.push('full_text_search');
      }

      // Apply filters with proper indexing
      if (filters.brands?.length) {
        supabaseQuery = supabaseQuery.in('brand_id', 
          await this.getBrandIds(filters.brands)
        );
        optimizations.push('brand_filter_optimized');
      }

      if (filters.families?.length) {
        supabaseQuery = supabaseQuery.in('scent_family', filters.families);
        optimizations.push('family_filter_indexed');
      }

      if (filters.minRating) {
        supabaseQuery = supabaseQuery.gte('rating', filters.minRating);
        optimizations.push('rating_filter_indexed');
      }

      if (filters.maxPrice) {
        supabaseQuery = supabaseQuery.lte('max_price', filters.maxPrice);
        optimizations.push('price_filter_indexed');
      }

      // Optimize ordering and pagination
      supabaseQuery = supabaseQuery
        .order('popularity_score', { ascending: false })
        .order('rating', { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);
      
      optimizations.push('optimized_ordering', 'efficient_pagination');

      const { data, error } = await supabaseQuery;

      if (error) throw error;

      const executionTime = performance.now() - startTime;
      
      // Cache successful results
      if (this.config.enableCaching && data) {
        this.setCachedResult(cacheKey, data);
        optimizations.push('result_cached');
      }

      const metrics = this.createMetric(queryName, executionTime, data?.length || 0, false, optimizations);
      this.recordMetric(metrics);

      // Log slow queries for optimization
      if (executionTime > 100) {
        console.warn(`Slow query detected: ${queryName} took ${Math.round(executionTime)}ms`, {
          query,
          filters,
          optimizations
        });
      }

      return { data: data || [], metrics };

    } catch (error) {
      const executionTime = performance.now() - startTime;
      const metrics = this.createMetric(queryName, executionTime, 0, false, ['error']);
      this.recordMetric(metrics);
      throw error;
    }
  }

  /**
   * Optimized user recommendations with caching and batch loading
   * Target: < 200ms response time
   */
  async optimizedUserRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<{ data: any[]; metrics: QueryPerformanceMetric }> {
    const startTime = performance.now();
    const queryName = 'user_recommendations';
    const cacheKey = `recommendations:${userId}:${limit}`;
    const optimizations: string[] = [];

    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        optimizations.push('cache_hit');
        return {
          data: cached,
          metrics: this.createMetric(queryName, performance.now() - startTime, cached.length, true, optimizations)
        };
      }
    }

    try {
      // Use materialized view for complex recommendations
      const { data, error } = await this.supabase
        .rpc('get_optimized_recommendations', {
          p_user_id: userId,
          p_limit: limit
        });

      if (error) throw error;

      const executionTime = performance.now() - startTime;
      optimizations.push('materialized_view', 'stored_procedure');

      // Cache results with shorter TTL due to personalization
      if (this.config.enableCaching && data) {
        this.setCachedResult(cacheKey, data, 180000); // 3 minutes
        optimizations.push('result_cached');
      }

      const metrics = this.createMetric(queryName, executionTime, data?.length || 0, false, optimizations);
      this.recordMetric(metrics);

      return { data: data || [], metrics };

    } catch (error) {
      console.error('Recommendations query failed:', error);
      const executionTime = performance.now() - startTime;
      const metrics = this.createMetric(queryName, executionTime, 0, false, ['error']);
      this.recordMetric(metrics);
      throw error;
    }
  }

  /**
   * Batch load fragrances with intelligent caching
   * Target: < 50ms per fragrance when cached, < 200ms for batch
   */
  async batchLoadFragrances(
    fragranceIds: number[]
  ): Promise<{ data: any[]; metrics: QueryPerformanceMetric }> {
    const startTime = performance.now();
    const queryName = 'batch_fragrance_load';
    const optimizations: string[] = [];

    // Check cache for individual fragrances
    const cachedResults: any[] = [];
    const uncachedIds: number[] = [];

    if (this.config.enableCaching) {
      for (const id of fragranceIds) {
        const cached = this.getCachedResult(`fragrance:${id}`);
        if (cached) {
          cachedResults.push(cached);
        } else {
          uncachedIds.push(id);
        }
      }
      
      if (cachedResults.length > 0) {
        optimizations.push(`cache_hits:${cachedResults.length}`);
      }
    }

    let freshResults: any[] = [];

    // Batch load uncached fragrances
    if (uncachedIds.length > 0) {
      const { data, error } = await this.supabase
        .from('fragrances')
        .select(`
          id,
          name,
          brand:fragrance_brands(name),
          description,
          scent_family,
          rating,
          image_url,
          notes_top,
          notes_middle,
          notes_base,
          longevity,
          sillage
        `)
        .in('id', uncachedIds);

      if (error) throw error;
      
      freshResults = data || [];
      optimizations.push('batch_query');

      // Cache individual results
      if (this.config.enableCaching) {
        freshResults.forEach(fragrance => {
          this.setCachedResult(`fragrance:${fragrance.id}`, fragrance);
        });
        optimizations.push('individual_caching');
      }
    }

    const executionTime = performance.now() - startTime;
    const totalResults = [...cachedResults, ...freshResults];
    
    const metrics = this.createMetric(
      queryName, 
      executionTime, 
      totalResults.length, 
      cachedResults.length > 0,
      optimizations
    );
    this.recordMetric(metrics);

    return { data: totalResults, metrics };
  }

  /**
   * Optimized social validation data loading
   * Target: < 100ms response time
   */
  async optimizedSocialValidation(
    fragranceId: number
  ): Promise<{ data: any; metrics: QueryPerformanceMetric }> {
    const startTime = performance.now();
    const queryName = 'social_validation';
    const cacheKey = `social:${fragranceId}`;
    const optimizations: string[] = [];

    // Check cache
    if (this.config.enableCaching) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        optimizations.push('cache_hit');
        return {
          data: cached,
          metrics: this.createMetric(queryName, performance.now() - startTime, 1, true, optimizations)
        };
      }
    }

    try {
      // Single optimized query for all social data
      const { data, error } = await this.supabase
        .rpc('get_social_validation_data', {
          p_fragrance_id: fragranceId
        });

      if (error) throw error;

      const executionTime = performance.now() - startTime;
      optimizations.push('stored_procedure', 'aggregated_query');

      // Cache with medium TTL (social data changes moderately)
      if (this.config.enableCaching && data) {
        this.setCachedResult(cacheKey, data, 600000); // 10 minutes
        optimizations.push('result_cached');
      }

      const metrics = this.createMetric(queryName, executionTime, 1, false, optimizations);
      this.recordMetric(metrics);

      return { data, metrics };

    } catch (error) {
      const executionTime = performance.now() - startTime;
      const metrics = this.createMetric(queryName, executionTime, 0, false, ['error']);
      this.recordMetric(metrics);
      throw error;
    }
  }

  // Helper methods
  private async getBrandIds(brandNames: string[]): Promise<number[]> {
    const cacheKey = `brand_ids:${brandNames.join(',')}`;
    
    if (this.config.enableCaching) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) return cached;
    }

    const { data } = await this.supabase
      .from('fragrance_brands')
      .select('id')
      .in('name', brandNames);

    const brandIds = data?.map(brand => brand.id) || [];
    
    if (this.config.enableCaching) {
      this.setCachedResult(cacheKey, brandIds, 3600000); // 1 hour (brands don't change often)
    }

    return brandIds;
  }

  private getCachedResult(key: string): any | null {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    // Clean expired cache entry
    if (cached) {
      this.queryCache.delete(key);
    }
    
    return null;
  }

  private setCachedResult(key: string, data: any, ttl?: number): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheMaxAge
    });

    // Prevent cache from growing too large
    if (this.queryCache.size > 1000) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }
  }

  private createMetric(
    queryName: string,
    executionTime: number,
    rowsReturned: number,
    cacheHit: boolean,
    optimizations: string[]
  ): QueryPerformanceMetric {
    return {
      queryName,
      executionTime,
      rowsReturned,
      cacheHit,
      optimizationApplied: optimizations,
      timestamp: Date.now()
    };
  }

  private recordMetric(metric: QueryPerformanceMetric): void {
    this.queryMetrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    // Log performance issues in development
    if (process.env.NODE_ENV === 'development' && metric.executionTime > 100) {
      console.warn(`🐌 Slow query: ${metric.queryName} took ${Math.round(metric.executionTime)}ms`);
    }
  }

  // Public methods for monitoring
  getQueryMetrics(): QueryPerformanceMetric[] {
    return [...this.queryMetrics];
  }

  getAverageQueryTime(queryName?: string): number {
    const relevantMetrics = queryName 
      ? this.queryMetrics.filter(m => m.queryName === queryName)
      : this.queryMetrics;

    if (relevantMetrics.length === 0) return 0;

    const totalTime = relevantMetrics.reduce((sum, m) => sum + m.executionTime, 0);
    return totalTime / relevantMetrics.length;
  }

  getCacheHitRate(): number {
    if (this.queryMetrics.length === 0) return 0;
    
    const cacheHits = this.queryMetrics.filter(m => m.cacheHit).length;
    return (cacheHits / this.queryMetrics.length) * 100;
  }

  clearCache(): void {
    this.queryCache.clear();
  }

  getPerformanceReport(): {
    totalQueries: number;
    averageQueryTime: number;
    cacheHitRate: number;
    slowQueries: QueryPerformanceMetric[];
    queryBreakdown: Record<string, { count: number; avgTime: number }>;
  } {
    const slowQueries = this.queryMetrics.filter(m => m.executionTime > 100);
    
    const queryBreakdown = this.queryMetrics.reduce((acc, metric) => {
      if (!acc[metric.queryName]) {
        acc[metric.queryName] = { count: 0, avgTime: 0, totalTime: 0 };
      }
      acc[metric.queryName].count++;
      acc[metric.queryName].totalTime += metric.executionTime;
      acc[metric.queryName].avgTime = acc[metric.queryName].totalTime / acc[metric.queryName].count;
      return acc;
    }, {} as Record<string, { count: number; avgTime: number; totalTime: number }>);

    // Clean up totalTime from result
    Object.keys(queryBreakdown).forEach(key => {
      delete (queryBreakdown[key] as any).totalTime;
    });

    return {
      totalQueries: this.queryMetrics.length,
      averageQueryTime: this.getAverageQueryTime(),
      cacheHitRate: this.getCacheHitRate(),
      slowQueries,
      queryBreakdown
    };
  }
}

export { DatabasePerformanceOptimizer };