/**
 * Real-time AI Features - Main Export Module
 * 
 * Comprehensive real-time AI system for ScentMatch including:
 * - WebSocket connections and real-time updates
 * - User activity tracking and implicit feedback collection
 * - Real-time recommendation updates based on user behavior
 * - Collection intelligence with preference change notifications
 * - Performance monitoring for all real-time features
 */

// Core real-time features
export {
  WebSocketConnectionManager,
  UserActivityTracker,
  RealtimeRecommendationEngine,
  RealtimeCollectionIntelligence,
  RealtimePerformanceMonitor,
  RealtimeManager,
  createRealtimeManager,
  type ActivityEvent,
  type RealtimeRecommendation,
  type CollectionInsight,
  type PerformanceMetrics,
  type WebSocketConfig
} from './real-time-features';

// User activity tracking and implicit feedback
export {
  ClientActivityTracker,
  ActivityProcessor,
  getActivityTracker,
  createActivityProcessor,
  type UserActivity,
  type ActivityType,
  type ActivityData,
  type ImplicitFeedback,
  type ImplicitSignal,
  type SessionMetrics
} from './user-activity-tracker';

// Real-time recommendations
export {
  RealtimeRecommendationEngine as AdvancedRealtimeRecommendationEngine,
  createRealtimeRecommendationEngine,
  type RealtimeRecommendation as DetailedRealtimeRecommendation,
  type RealtimeFactors,
  type RecommendationMetadata,
  type UserContext,
  type TimeContext,
  type DeviceContext,
  type PreferenceSignal,
  type FragranceAttributes,
  type ExplanationComponent,
  type BehaviorPattern,
  type PatternImplication
} from './real-time-recommendations';

// Collection insights and notifications
export {
  CollectionIntelligenceEngine,
  createCollectionIntelligenceEngine,
  type CollectionInsight as DetailedCollectionInsight,
  type InsightType,
  type SuggestedAction,
  type InsightData,
  type CollectionMetrics,
  type PriceRangeCoverage,
  type SeasonalCoverage,
  type OccasionCoverage,
  type PreferenceChangeNotification,
  type DetectedChange
} from './collection-insights';

// Performance monitoring
export {
  RealtimePerformanceMonitor as AdvancedRealtimePerformanceMonitor,
  createRealtimePerformanceMonitor,
  type PerformanceMetrics as DetailedPerformanceMetrics,
  type MetricType,
  type ComponentType,
  type MetricUnit,
  type PerformanceAlert,
  type AlertType,
  type AlertSeverity,
  type PerformanceReport,
  type PerformanceSummary
} from './real-time-performance-monitor';

/**
 * Factory function to create a complete real-time AI system
 */
export const createCompleteRealtimeSystem = (config: {
  wsUrl?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  enableActivityTracking?: boolean;
  enableRecommendationUpdates?: boolean;
  enableCollectionIntelligence?: boolean;
  enablePerformanceMonitoring?: boolean;
}) => {
  const {
    wsUrl = 'ws://localhost:3000/realtime',
    enableActivityTracking = true,
    enableRecommendationUpdates = true,
    enableCollectionIntelligence = true,
    enablePerformanceMonitoring = true
  } = config;

  // Create WebSocket manager
  const wsManager = new WebSocketConnectionManager({
    url: wsUrl,
    reconnectAttempts: 3,
    heartbeatInterval: 30000,
    connectionTimeout: 5000
  });

  // Create activity tracker
  const activityTracker = enableActivityTracking ? new UserActivityTracker({
    wsManager,
    batchSize: 10,
    flushInterval: 5000,
    enableImplicitTracking: true
  }) : null;

  // Create recommendation engine
  const recommendationEngine = enableRecommendationUpdates ? new RealtimeRecommendationEngine({
    wsManager,
    activityTracker: activityTracker!,
    updateThreshold: 0.1,
    maxRecommendations: 20,
    enablePersonalization: true
  }) : null;

  // Create collection intelligence
  const collectionIntelligence = enableCollectionIntelligence ? new RealtimeCollectionIntelligence({
    wsManager,
    analysisInterval: 300000,
    enableInsightStreaming: true
  }) : null;

  // Create performance monitor
  const performanceMonitor = enablePerformanceMonitoring ? new RealtimePerformanceMonitor({
    wsManager,
    metricsInterval: 30000,
    alertThresholds: {
      response_time: 500,
      error_rate: 0.05,
      connection_failures: 3
    }
  }) : null;

  // Create main manager
  const manager = new RealtimeManager({
    wsManager,
    enableActivityTracking,
    enableRecommendationUpdates,
    enableCollectionIntelligence,
    enablePerformanceMonitoring
  });

  return {
    wsManager,
    activityTracker,
    recommendationEngine,
    collectionIntelligence,
    performanceMonitor,
    manager,
    
    // Convenience methods
    async connect() {
      await wsManager.connect();
    },
    
    async disconnect() {
      wsManager.close();
    },
    
    async trackUserActivity(activity: ActivityEvent) {
      return manager.trackActivity(activity);
    },
    
    async getRecommendations(userId: string) {
      return manager.updateRecommendations(userId);
    },
    
    async analyzeCollection(userId: string, update: any) {
      return manager.analyzeCollectionUpdate(userId, update);
    },
    
    getPerformanceReport() {
      return performanceMonitor?.generatePerformanceReport();
    }
  };
};

/**
 * Default configuration for production use
 */
export const REALTIME_CONFIG = {
  WEBSOCKET: {
    url: process.env.WEBSOCKET_URL || 'ws://localhost:3000/realtime',
    reconnectAttempts: 5,
    heartbeatInterval: 30000,
    connectionTimeout: 10000
  },
  
  ACTIVITY_TRACKING: {
    batchSize: 20,
    flushInterval: 10000,
    enableImplicitTracking: true,
    sessionTimeout: 1800000
  },
  
  RECOMMENDATIONS: {
    updateThreshold: 0.15,
    maxRecommendations: 25,
    enablePersonalization: true,
    cacheTimeout: 600000,
    contextualBoost: 0.2
  },
  
  COLLECTION_INTELLIGENCE: {
    analysisInterval: 300000,
    enableInsightStreaming: true,
    maxInsightsPerUser: 20,
    insightTTL: 86400000
  },
  
  PERFORMANCE_MONITORING: {
    metricsInterval: 60000,
    alertThresholds: {
      response_time: 500,
      error_rate: 0.02,
      memory_usage: 0.85,
      connection_failures: 5
    },
    reportingInterval: 3600000
  }
};

/**
 * Health check for all real-time features
 */
export const checkRealtimeSystemHealth = async (system: ReturnType<typeof createCompleteRealtimeSystem>) => {
  const health = {
    websocket: system.wsManager.isConnected(),
    activity_tracking: system.activityTracker !== null,
    recommendations: system.recommendationEngine !== null,
    collection_intelligence: system.collectionIntelligence !== null,
    performance_monitoring: system.performanceMonitor !== null,
    overall_status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: Date.now()
  };

  const healthyComponents = Object.values(health).filter(v => v === true).length;
  const totalComponents = 5;
  
  if (healthyComponents === totalComponents) {
    health.overall_status = 'healthy';
  } else if (healthyComponents >= totalComponents * 0.6) {
    health.overall_status = 'degraded';
  } else {
    health.overall_status = 'unhealthy';
  }

  return health;
};

// Export version info
export const REALTIME_SYSTEM_VERSION = '1.0.0';
export const SUPPORTED_FEATURES = [
  'websocket_connections',
  'user_activity_tracking',
  'implicit_feedback_collection',
  'realtime_recommendations',
  'behavior_pattern_detection',
  'collection_intelligence',
  'preference_change_notifications',
  'performance_monitoring',
  'system_health_checks',
  'offline_support',
  'automatic_reconnection',
  'metrics_aggregation',
  'alert_system'
] as const;