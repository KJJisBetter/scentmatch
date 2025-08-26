/**
 * Educational Content Cache Manager
 * 
 * High-performance caching system for frequently accessed educational content
 * Optimized for mobile-first beginner users with instant tooltip loading
 */

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface EducationCacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  avgResponseTime: number;
}

/**
 * In-memory cache optimized for educational content
 * Prevents repetitive processing of beginner explanations
 */
class EducationCacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private metrics: EducationCacheMetrics = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    avgResponseTime: 0,
  };
  private responseTimes: number[] = [];

  /**
   * Cache educational content with performance tracking
   */
  set<T>(key: string, data: T, ttlMs: number = 300000): void { // 5 min default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Retrieve cached content with performance metrics
   */
  get<T>(key: string): T | null {
    const startTime = performance.now();
    this.metrics.totalRequests++;

    const item = this.cache.get(key);
    
    if (!item || this.isExpired(item)) {
      this.cache.delete(key);
      this.metrics.misses++;
      this.recordResponseTime(startTime);
      return null;
    }

    this.metrics.hits++;
    this.recordResponseTime(startTime);
    return item.data;
  }

  /**
   * Check if cache item has expired
   */
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Record response time for performance monitoring
   */
  private recordResponseTime(startTime: number): void {
    const responseTime = performance.now() - startTime;
    this.responseTimes.push(responseTime);
    
    // Keep only last 100 measurements for rolling average
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
    
    this.metrics.avgResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): EducationCacheMetrics & { hitRate: number } {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;

    return {
      ...this.metrics,
      hitRate,
    };
  }

  /**
   * Clear expired entries for memory optimization
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Pre-load critical educational content for performance
   */
  preloadCriticalContent(educationalTerms: Record<string, any>): void {
    Object.entries(educationalTerms).forEach(([term, content]) => {
      const cacheKey = `edu_${term}`;
      this.set(cacheKey, content, 600000); // 10 min for critical content
    });
  }

  /**
   * Batch cache multiple items efficiently
   */
  batchSet<T>(items: Array<{ key: string; data: T; ttl?: number }>): void {
    items.forEach(({ key, data, ttl = 300000 }) => {
      this.set(key, data, ttl);
    });
  }

  /**
   * Clear all cache (for memory management)
   */
  clear(): void {
    this.cache.clear();
    this.metrics = { hits: 0, misses: 0, totalRequests: 0, avgResponseTime: 0 };
    this.responseTimes = [];
  }

  /**
   * Get cache size for monitoring
   */
  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance for global use
export const educationCache = new EducationCacheManager();

// Cleanup cache every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    educationCache.cleanup();
  }, 300000);
}