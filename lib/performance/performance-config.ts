/**
 * Performance Configuration - Critical Performance Targets
 * 
 * Centralized performance budgets and optimization targets for ScentMatch.
 * These targets are based on Core Web Vitals and collection platform requirements.
 */

export interface PerformanceTargets {
  // Core Web Vitals
  lcp: number;          // Largest Contentful Paint
  fid: number;          // First Input Delay  
  cls: number;          // Cumulative Layout Shift
  inp: number;          // Interaction to Next Paint
  
  // Collection Platform Specific
  collectionLoadTime: number;     // Collection dashboard load time
  collectionPreviewTime: number;  // Quiz collection preview
  searchResponseTime: number;     // Search/filter response
  analyticsGenerationTime: number; // Analytics calculation
  
  // Database Performance
  queryExecutionTime: number;     // Average query time
  complexAnalyticsTime: number;   // Complex analytics queries
  
  // Bundle Size (KB gzipped)
  totalBundleSize: number;
  routeBundleSize: number;
  chunkSize: number;
}

export const PERFORMANCE_TARGETS: PerformanceTargets = {
  // Core Web Vitals - Collection Platform Critical
  lcp: 2000,           // 2.0s for collection dashboard
  fid: 100,            // 100ms for quiz interactions
  cls: 0.1,            // Stable layout for collection grids
  inp: 200,            // Quick collection interactions
  
  // Collection Platform Performance
  collectionLoadTime: 2000,        // 2s max collection dashboard
  collectionPreviewTime: 500,      // 500ms quiz preview
  searchResponseTime: 300,         // 300ms search/filter
  analyticsGenerationTime: 1000,   // 1s analytics insights
  
  // Database Performance Targets
  queryExecutionTime: 200,         // 200ms average query
  complexAnalyticsTime: 500,       // 500ms complex analytics
  
  // Bundle Size Targets (gzipped)
  totalBundleSize: 200,            // 200KB initial bundle
  routeBundleSize: 50,             // 50KB per route
  chunkSize: 30                    // 30KB per chunk
};

export interface CacheConfig {
  collectionStatsCache: {
    ttl: number;      // Time to live in seconds
    maxSize: number;  // Max cache entries
  };
  analyticsCache: {
    ttl: number;
    maxSize: number;
  };
  socialProofCache: {
    ttl: number;
    maxSize: number;
  };
  insightsCache: {
    ttl: number;
    maxSize: number;
  };
}

export const CACHE_CONFIG: CacheConfig = {
  collectionStatsCache: {
    ttl: 300,        // 5 minutes
    maxSize: 1000
  },
  analyticsCache: {
    ttl: 1800,       // 30 minutes
    maxSize: 500
  },
  socialProofCache: {
    ttl: 900,        // 15 minutes
    maxSize: 200
  },
  insightsCache: {
    ttl: 3600,       // 60 minutes
    maxSize: 100
  }
};

export interface DatabaseIndexes {
  [table: string]: string[];
}

export const REQUIRED_INDEXES: DatabaseIndexes = {
  user_collections: [
    'idx_user_collections_user_id_type_created',
    'idx_user_collections_quiz_session_token',
    'idx_user_collections_fragrance_id_user_id',
    'idx_user_collections_created_at_desc'
  ],
  collection_analytics_events: [
    'idx_analytics_user_id_created',
    'idx_analytics_event_type_created',
    'idx_analytics_quiz_session_token'
  ],
  collection_insights_cache: [
    'idx_insights_cache_user_id_type',
    'idx_insights_cache_expires_at'
  ],
  fragrances: [
    'idx_fragrances_scent_family',
    'idx_fragrances_gender',
    'idx_fragrances_rating_value',
    'idx_fragrances_sample_available'
  ]
};

// Performance monitoring configuration
export const PERFORMANCE_MONITORING = {
  enableRealTimeMetrics: true,
  sampleRate: 0.1,              // Sample 10% of requests
  criticalUserJourneys: [
    'quiz_to_collection_save',
    'collection_dashboard_load', 
    'collection_search_filter',
    'analytics_insights_generation'
  ],
  alertThresholds: {
    responseTime: 3000,          // Alert if >3s
    errorRate: 0.05,             // Alert if >5% error rate
    cacheHitRate: 0.8            // Alert if <80% cache hit rate
  }
};