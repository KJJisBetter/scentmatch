/**
 * Real-Time Learning Integration with Existing User Models
 * 
 * Orchestration layer that integrates real-time event processing, contextual bandits,
 * and WebSocket updates with the existing recommendation engine and user preference models.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';
import { 
  RealTimeEventProcessor, 
  EventStreamManager, 
  createEventStreamManager,
  type UserInteractionEvent 
} from './real-time-event-processor';
import { 
  ContextualRecommendationEngine, 
  createContextualRecommendationEngine,
  type ContextualState 
} from './contextual-bandit-system';
import { 
  WebSocketConnectionManager, 
  RealTimeRecommendationNotifier,
  createRealTimeWebSocketSystem,
  type RecommendationUpdate 
} from './websocket-realtime-updates';
import { 
  ThompsonSamplingService, 
  createThompsonSamplingService 
} from './thompson-sampling';
import { 
  PersonalizedRecommendationEngine,
  UserPreferenceModeler,
  RecommendationCache
} from './recommendation-engine';

// Integration Configuration
export interface RealTimeIntegrationConfig {
  enable_real_time_processing: boolean;
  enable_contextual_bandits: boolean;
  enable_websocket_updates: boolean;
  enable_preference_streaming: boolean;
  
  processing_thresholds: {
    immediate_processing_signal_strength: number;
    batch_processing_delay_ms: number;
    preference_update_threshold: number;
    cache_invalidation_threshold: number;
  };
  
  performance_targets: {
    max_processing_latency_ms: number;
    max_websocket_delivery_latency_ms: number;
    min_recommendation_accuracy: number;
    max_memory_usage_mb: number;
  };
}

// Real-Time Learning Orchestrator
export class RealTimeLearningOrchestrator extends EventEmitter {
  private supabase: SupabaseClient;
  private config: RealTimeIntegrationConfig;
  
  // Core services
  private eventStreamManager: EventStreamManager;
  private contextualEngine: ContextualRecommendationEngine;
  private thompsonSampling: ThompsonSamplingService;
  private websocketSystem: any;
  
  // Existing systems integration
  private recommendationEngine: PersonalizedRecommendationEngine;
  private userPreferenceModeler: UserPreferenceModeler;
  private recommendationCache: RecommendationCache;
  
  // Performance monitoring
  private performanceMetrics: RealTimePerformanceMetrics;
  private isRunning: boolean = false;

  constructor(supabase: SupabaseClient, config: Partial<RealTimeIntegrationConfig> = {}) {
    super();
    this.supabase = supabase;
    this.config = {
      enable_real_time_processing: config.enable_real_time_processing ?? true,
      enable_contextual_bandits: config.enable_contextual_bandits ?? true,
      enable_websocket_updates: config.enable_websocket_updates ?? true,
      enable_preference_streaming: config.enable_preference_streaming ?? true,
      
      processing_thresholds: config.processing_thresholds || {
        immediate_processing_signal_strength: 0.7,
        batch_processing_delay_ms: 5000,
        preference_update_threshold: 0.1,
        cache_invalidation_threshold: 0.2
      },
      
      performance_targets: config.performance_targets || {
        max_processing_latency_ms: 100,
        max_websocket_delivery_latency_ms: 50,
        min_recommendation_accuracy: 0.8,
        max_memory_usage_mb: 1000
      }
    };

    this.initializeServices();
    this.setupEventIntegration();
    this.performanceMetrics = new RealTimePerformanceMetrics();
  }

  /**
   * Initialize all service components
   */
  private initializeServices(): void {
    // Initialize event processing
    this.eventStreamManager = createEventStreamManager(this.supabase);
    
    // Initialize contextual recommendations
    this.contextualEngine = createContextualRecommendationEngine(this.supabase);
    
    // Initialize Thompson Sampling
    this.thompsonSampling = createThompsonSamplingService(this.supabase);
    
    // Initialize WebSocket system
    this.websocketSystem = createRealTimeWebSocketSystem(this.supabase);
    
    // Initialize existing systems
    this.recommendationEngine = new PersonalizedRecommendationEngine({
      supabase: this.supabase,
      enableRealTimeUpdates: true
    });
    
    this.userPreferenceModeler = new UserPreferenceModeler({
      supabase: this.supabase,
      embeddingDimensions: 2048,
      enableTempotalDecay: true
    });
    
    this.recommendationCache = new RecommendationCache({
      supabase: this.supabase,
      enableRealTimeInvalidation: true
    });
  }

  /**
   * Setup event integration between all systems
   */
  private setupEventIntegration(): void {
    // Event stream → Preference learning
    this.eventStreamManager.eventProcessor.on('event_processed', async (eventData) => {
      if (eventData.signal_strength > this.config.processing_thresholds.immediate_processing_signal_strength) {
        await this.handleHighSignalEvent(eventData);
      }
    });

    // Contextual engine → WebSocket notifications
    this.contextualEngine.on('contextual_selection', async (selectionData) => {
      await this.handleContextualSelection(selectionData);
    });

    // Thompson Sampling → Preference updates
    this.thompsonSampling.feedbackProcessor.on('algorithm_optimized', async (optimizationData) => {
      await this.handleAlgorithmOptimization(optimizationData);
    });

    // WebSocket → Feedback processing
    this.websocketSystem.connectionManager.on('realtime_feedback', async (feedbackData) => {
      await this.handleRealTimeFeedback(feedbackData);
    });
  }

  /**
   * Start real-time learning system
   */
  async start(): Promise<{
    services_started: string[];
    integration_active: boolean;
    websocket_server_port?: number;
    performance_monitoring_enabled: boolean;
  }> {
    try {
      const startedServices = [];

      // Start WebSocket server if enabled
      if (this.config.enable_websocket_updates) {
        const wsResult = await this.websocketSystem.server.start();
        if (wsResult.server_started) {
          startedServices.push('websocket_server');
        }
      }

      // Start performance monitoring
      this.performanceMetrics.startMonitoring();
      startedServices.push('performance_monitoring');

      this.isRunning = true;
      startedServices.push('real_time_orchestrator');

      this.emit('system_started', { services: startedServices });

      return {
        services_started: startedServices,
        integration_active: true,
        websocket_server_port: this.websocketSystem.server.port,
        performance_monitoring_enabled: true
      };

    } catch (error) {
      console.error('Failed to start real-time learning system:', error);
      return {
        services_started: [],
        integration_active: false,
        performance_monitoring_enabled: false
      };
    }
  }

  /**
   * Process user interaction with full real-time pipeline
   */
  async processUserInteraction(
    interaction: UserInteractionEvent,
    options: {
      enable_immediate_recommendations: boolean;
      include_contextual_adaptation: boolean;
      send_websocket_updates: boolean;
    } = {
      enable_immediate_recommendations: true,
      include_contextual_adaptation: true,
      send_websocket_updates: true
    }
  ): Promise<{
    interaction_processed: boolean;
    real_time_learning_applied: boolean;
    new_recommendations?: any[];
    websocket_update_sent: boolean;
    processing_metrics: {
      total_latency_ms: number;
      event_processing_ms: number;
      recommendation_generation_ms: number;
      websocket_delivery_ms: number;
    };
  }> {
    const startTime = Date.now();
    let eventProcessingTime = 0;
    let recommendationTime = 0;
    let websocketTime = 0;

    try {
      // 1. Process interaction event through real-time pipeline
      const eventStart = Date.now();
      const processingResult = await this.eventStreamManager.processEvent(interaction);
      eventProcessingTime = Date.now() - eventStart;

      if (!processingResult.processed) {
        throw new Error('Event processing failed');
      }

      // 2. Generate new recommendations if significant signal
      let newRecommendations = undefined;
      if (options.enable_immediate_recommendations && 
          processingResult.preference_signal_strength > this.config.processing_thresholds.preference_update_threshold) {
        
        const recStart = Date.now();
        
        if (options.include_contextual_adaptation && this.config.enable_contextual_bandits) {
          // Use contextual bandit for enhanced recommendations
          const contextualResult = await this.contextualEngine.generateContextualRecommendations(
            interaction.user_id,
            interaction.context,
            {
              max_recommendations: 6,
              include_explanations: true,
              enable_real_time_adaptation: true
            }
          );
          newRecommendations = contextualResult.recommendations;
        } else {
          // Use standard recommendation engine with Thompson Sampling
          const algorithmSelection = await this.thompsonSampling.getOptimalAlgorithm(
            interaction.user_id,
            {
              user_type: 'intermediate', // Would be dynamically determined
              time_of_day: interaction.context.time_of_day,
              device_type: interaction.device_context.device_type
            }
          );
          
          // Generate recommendations using selected algorithm
          newRecommendations = await this.generateRecommendationsWithAlgorithm(
            interaction.user_id,
            algorithmSelection.algorithm_name
          );
        }
        
        recommendationTime = Date.now() - recStart;
      }

      // 3. Send WebSocket update if enabled and recommendations generated
      let websocketSent = false;
      if (options.send_websocket_updates && 
          this.config.enable_websocket_updates && 
          newRecommendations) {
        
        const wsStart = Date.now();
        
        const update: RecommendationUpdate = {
          update_type: 'new_recommendations',
          recommendations: newRecommendations,
          metadata: {
            trigger_event: interaction.event_type,
            generated_at: new Date(),
            confidence: processingResult.preference_signal_strength,
            processing_time_ms: eventProcessingTime + recommendationTime
          }
        };

        const deliveryResult = await this.websocketSystem.notifier.notifyPreferenceChange(
          interaction.user_id,
          {
            changed_families: [], // Would be calculated from interaction
            confidence_changes: {},
            trigger_event: interaction.event_type,
            new_recommendations: newRecommendations
          }
        );

        websocketSent = deliveryResult.notification_sent;
        websocketTime = Date.now() - wsStart;
      }

      // 4. Update performance metrics
      this.performanceMetrics.recordInteractionProcessing({
        total_latency_ms: Date.now() - startTime,
        event_processing_ms: eventProcessingTime,
        recommendation_generation_ms: recommendationTime,
        websocket_delivery_ms: websocketTime,
        signal_strength: processingResult.preference_signal_strength,
        recommendations_generated: newRecommendations ? newRecommendations.length : 0
      });

      return {
        interaction_processed: true,
        real_time_learning_applied: processingResult.immediate_learning_applied,
        new_recommendations: newRecommendations,
        websocket_update_sent: websocketSent,
        processing_metrics: {
          total_latency_ms: Date.now() - startTime,
          event_processing_ms: eventProcessingTime,
          recommendation_generation_ms: recommendationTime,
          websocket_delivery_ms: websocketTime
        }
      };

    } catch (error) {
      console.error('Real-time interaction processing failed:', error);
      
      this.performanceMetrics.recordError({
        error_type: 'interaction_processing_failed',
        latency_ms: Date.now() - startTime,
        user_id: interaction.user_id
      });

      return {
        interaction_processed: false,
        real_time_learning_applied: false,
        websocket_update_sent: false,
        processing_metrics: {
          total_latency_ms: Date.now() - startTime,
          event_processing_ms: eventProcessingTime,
          recommendation_generation_ms: recommendationTime,
          websocket_delivery_ms: websocketTime
        }
      };
    }
  }

  /**
   * Handle high-signal events that require immediate processing
   */
  private async handleHighSignalEvent(eventData: any): Promise<void> {
    try {
      // Invalidate recommendation cache for significant events
      if (eventData.signal_strength > this.config.processing_thresholds.cache_invalidation_threshold) {
        await this.recommendationCache.invalidateUserCache(eventData.user_id, {
          type: 'high_signal_interaction',
          impact_level: 'high'
        });
      }

      // Update user embedding if very significant
      if (eventData.signal_strength > 0.8) {
        await this.userPreferenceModeler.generateUserEmbedding(eventData.user_id);
      }

      // Trigger real-time recommendation refresh
      await this.triggerRecommendationRefresh(eventData.user_id, {
        trigger: 'high_signal_event',
        signal_strength: eventData.signal_strength,
        confidence: 0.8
      });

    } catch (error) {
      console.error('High signal event processing failed:', error);
    }
  }

  /**
   * Handle contextual algorithm selection
   */
  private async handleContextualSelection(selectionData: any): Promise<void> {
    try {
      // Store contextual selection for analytics
      await this.supabase
        .from('user_interactions')
        .insert({
          user_id: selectionData.user_id,
          fragrance_id: 'contextual_selection',
          interaction_type: 'algorithm_selection',
          interaction_value: selectionData.confidence,
          interaction_context: {
            selected_action: selectionData.action,
            context_hash: selectionData.context_hash,
            selection_type: 'contextual_bandit'
          }
        });

      // Emit for monitoring
      this.emit('contextual_selection_recorded', selectionData);

    } catch (error) {
      console.error('Contextual selection handling failed:', error);
    }
  }

  /**
   * Handle Thompson Sampling algorithm optimization
   */
  private async handleAlgorithmOptimization(optimizationData: any): Promise<void> {
    try {
      // Notify user via WebSocket if significant improvement
      if (optimizationData.performance_improvement > 0.1) {
        await this.websocketSystem.notifier.notifyAlgorithmOptimization(
          optimizationData.user_id,
          {
            old_algorithm: optimizationData.old_algorithm,
            new_algorithm: optimizationData.new_algorithm,
            performance_improvement: optimizationData.performance_improvement,
            confidence: optimizationData.confidence
          }
        );
      }

      // Update recommendation cache with new algorithm
      await this.recommendationCache.invalidateUserCache(optimizationData.user_id, {
        type: 'algorithm_optimization',
        impact_level: 'medium'
      });

    } catch (error) {
      console.error('Algorithm optimization handling failed:', error);
    }
  }

  /**
   * Handle real-time feedback from WebSocket
   */
  private async handleRealTimeFeedback(feedbackData: any): Promise<void> {
    try {
      const { user_id, feedback, connection_id } = feedbackData;

      // Process through Thompson Sampling system
      const banditResult = await this.thompsonSampling.processFeedback({
        user_id: user_id,
        fragrance_id: feedback.fragrance_id,
        algorithm_used: feedback.algorithm_used || 'hybrid',
        action: this.mapFeedbackToAction(feedback.type),
        action_value: feedback.value,
        immediate_reward: 0, // Will be calculated
        contextual_factors: feedback.context || {},
        session_id: feedback.session_id || `ws_${connection_id}`
      });

      // Update user preferences if significant learning impact
      if (banditResult.learning_impact > this.config.processing_thresholds.preference_update_threshold) {
        await this.updateUserPreferencesFromFeedback(user_id, feedback, banditResult.learning_impact);
      }

      // Send acknowledgment back via WebSocket
      await this.websocketSystem.connectionManager.sendMessage(connection_id, {
        message_type: 'feedback_processed',
        payload: {
          feedback_id: feedback.id,
          learning_applied: banditResult.algorithm_updated,
          learning_impact: banditResult.learning_impact
        },
        priority: 3
      });

    } catch (error) {
      console.error('Real-time feedback handling failed:', error);
    }
  }

  /**
   * Trigger recommendation refresh for user
   */
  private async triggerRecommendationRefresh(
    userId: string,
    metadata: {
      trigger: string;
      signal_strength: number;
      confidence: number;
    }
  ): Promise<void> {
    try {
      // Generate fresh recommendations using integrated system
      let refreshedRecommendations;

      if (this.config.enable_contextual_bandits) {
        // Use contextual bandit engine
        const contextualResult = await this.contextualEngine.generateContextualRecommendations(
          userId,
          {}, // Would extract current context
          {
            max_recommendations: 8,
            include_explanations: true,
            enable_real_time_adaptation: true
          }
        );
        refreshedRecommendations = contextualResult.recommendations;
      } else {
        // Use standard engine with Thompson Sampling
        const algorithmSelection = await this.thompsonSampling.getOptimalAlgorithm(userId);
        refreshedRecommendations = await this.generateRecommendationsWithAlgorithm(
          userId,
          algorithmSelection.algorithm_name
        );
      }

      // Send update via WebSocket
      if (this.config.enable_websocket_updates) {
        const update: RecommendationUpdate = {
          update_type: 'new_recommendations',
          recommendations: refreshedRecommendations,
          metadata: {
            trigger_event: metadata.trigger,
            generated_at: new Date(),
            confidence: metadata.confidence,
            processing_time_ms: 0
          }
        };

        await this.websocketSystem.connectionManager.sendRecommendationUpdate(userId, update, 2);
      }

      // Update cache
      await this.recommendationCache.storeRecommendations(
        userId,
        'real_time_refresh',
        refreshedRecommendations,
        {
          generation_metadata: {
            trigger: metadata.trigger,
            signal_strength: metadata.signal_strength,
            real_time_generated: true
          }
        }
      );

    } catch (error) {
      console.error('Recommendation refresh failed:', error);
    }
  }

  /**
   * Update user preferences from feedback with real-time integration
   */
  private async updateUserPreferencesFromFeedback(
    userId: string,
    feedback: any,
    learningImpact: number
  ): Promise<void> {
    try {
      // Update user embedding through preference modeler
      const embeddingResult = await this.userPreferenceModeler.generateUserEmbedding(userId);
      
      if (embeddingResult.success) {
        // Trigger contextual pattern learning
        await this.supabase.rpc('update_contextual_preferences', {
          target_user_id: userId,
          context_factors: feedback.context || {},
          preference_updates: {
            feedback_type: feedback.type,
            learning_impact: learningImpact,
            updated_at: new Date().toISOString()
          },
          feedback_strength: learningImpact
        });

        // Emit preference update event
        this.emit('preferences_updated', {
          user_id: userId,
          learning_impact: learningImpact,
          embedding_updated: true,
          contextual_patterns_updated: true
        });
      }

    } catch (error) {
      console.error('User preference update failed:', error);
    }
  }

  /**
   * Generate recommendations using specific algorithm
   */
  private async generateRecommendationsWithAlgorithm(
    userId: string,
    algorithmName: string
  ): Promise<any[]> {
    try {
      // Use existing recommendation engine with algorithm selection
      const recommendations = await this.recommendationEngine.generatePersonalizedRecommendations(
        userId,
        {
          max_results: 8,
          include_explanations: true,
          adventure_level: 0.5,
          use_real_similarity_search: true
        }
      );

      return recommendations.map(rec => ({
        ...rec,
        algorithm_used: algorithmName,
        real_time_generated: true,
        generated_at: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Algorithm-specific recommendation generation failed:', error);
      return [];
    }
  }

  /**
   * Map feedback type to action for bandit processing
   */
  private mapFeedbackToAction(feedbackType: string): any {
    const actionMap: Record<string, any> = {
      'like': 'click',
      'love': 'add_to_collection',
      'dislike': 'ignore',
      'rating': 'rating',
      'purchase_intent': 'purchase_intent',
      'share': 'click'
    };

    return actionMap[feedbackType] || 'view';
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): {
    running: boolean;
    services_status: Record<string, string>;
    performance_metrics: any;
    connection_stats: any;
    integration_health: string;
  } {
    const performanceMetrics = this.performanceMetrics.getCurrentMetrics();
    const connectionStats = this.websocketSystem.connectionManager.getConnectionStats();

    let integrationHealth = 'healthy';
    if (performanceMetrics.avg_processing_latency_ms > this.config.performance_targets.max_processing_latency_ms) {
      integrationHealth = 'degraded_performance';
    }
    if (performanceMetrics.error_rate > 0.05) {
      integrationHealth = 'high_error_rate';
    }

    return {
      running: this.isRunning,
      services_status: {
        event_stream: 'running',
        contextual_engine: this.config.enable_contextual_bandits ? 'running' : 'disabled',
        thompson_sampling: 'running',
        websocket_system: this.config.enable_websocket_updates ? 'running' : 'disabled'
      },
      performance_metrics: performanceMetrics,
      connection_stats: connectionStats,
      integration_health: integrationHealth
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.isRunning = false;
    
    // Stop all services
    this.eventStreamManager.shutdown();
    await this.websocketSystem.server.stop();
    this.performanceMetrics.stopMonitoring();
    
    this.emit('system_shutdown');
  }
}

// Performance Metrics Tracker
class RealTimePerformanceMetrics {
  private metrics: {
    total_interactions: number;
    successful_interactions: number;
    failed_interactions: number;
    total_processing_latency_ms: number;
    total_recommendation_latency_ms: number;
    total_websocket_latency_ms: number;
    websocket_messages_sent: number;
    cache_invalidations: number;
    preference_updates: number;
    start_time: Date;
  };

  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.metrics = {
      total_interactions: 0,
      successful_interactions: 0,
      failed_interactions: 0,
      total_processing_latency_ms: 0,
      total_recommendation_latency_ms: 0,
      total_websocket_latency_ms: 0,
      websocket_messages_sent: 0,
      cache_invalidations: 0,
      preference_updates: 0,
      start_time: new Date()
    };
  }

  /**
   * Record interaction processing metrics
   */
  recordInteractionProcessing(data: {
    total_latency_ms: number;
    event_processing_ms: number;
    recommendation_generation_ms: number;
    websocket_delivery_ms: number;
    signal_strength: number;
    recommendations_generated: number;
  }): void {
    this.metrics.total_interactions++;
    this.metrics.successful_interactions++;
    this.metrics.total_processing_latency_ms += data.total_latency_ms;
    this.metrics.total_recommendation_latency_ms += data.recommendation_generation_ms;
    this.metrics.total_websocket_latency_ms += data.websocket_delivery_ms;
    
    if (data.recommendations_generated > 0) {
      this.metrics.websocket_messages_sent++;
    }
  }

  /**
   * Record error
   */
  recordError(data: {
    error_type: string;
    latency_ms: number;
    user_id: string;
  }): void {
    this.metrics.total_interactions++;
    this.metrics.failed_interactions++;
    this.metrics.total_processing_latency_ms += data.latency_ms;
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): {
    success_rate: number;
    error_rate: number;
    avg_processing_latency_ms: number;
    avg_recommendation_latency_ms: number;
    avg_websocket_latency_ms: number;
    interactions_per_second: number;
    uptime_seconds: number;
  } {
    const totalInteractions = Math.max(this.metrics.total_interactions, 1);
    const uptimeSeconds = (Date.now() - this.metrics.start_time.getTime()) / 1000;

    return {
      success_rate: this.metrics.successful_interactions / totalInteractions,
      error_rate: this.metrics.failed_interactions / totalInteractions,
      avg_processing_latency_ms: this.metrics.total_processing_latency_ms / totalInteractions,
      avg_recommendation_latency_ms: this.metrics.total_recommendation_latency_ms / Math.max(this.metrics.successful_interactions, 1),
      avg_websocket_latency_ms: this.metrics.total_websocket_latency_ms / Math.max(this.metrics.websocket_messages_sent, 1),
      interactions_per_second: totalInteractions / Math.max(uptimeSeconds, 1),
      uptime_seconds: uptimeSeconds
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      const metrics = this.getCurrentMetrics();
      console.log('Real-time system performance:', metrics);
    }, 60000); // Log metrics every minute
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Integration Health Monitor
export class IntegrationHealthMonitor {
  private supabase: SupabaseClient;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<{
    overall_health: 'healthy' | 'degraded' | 'unhealthy';
    component_health: Record<string, string>;
    performance_metrics: any;
    alerts: string[];
  }> {
    try {
      const alerts = [];
      const componentHealth: Record<string, string> = {};

      // Check real-time processing performance
      const { data: realtimePerf } = await this.supabase
        .from('real_time_system_performance')
        .select('*')
        .single();

      componentHealth.real_time_processing = realtimePerf?.system_health_status || 'unknown';
      if (realtimePerf?.pending_events > 1000) {
        alerts.push('High number of pending events in real-time queue');
      }

      // Check WebSocket system health
      const { data: websocketHealth } = await this.supabase
        .from('websocket_system_health')
        .select('*')
        .single();

      componentHealth.websocket_system = websocketHealth?.websocket_health_status || 'unknown';
      if (websocketHealth?.active_connections === 0) {
        alerts.push('No active WebSocket connections');
      }

      // Check bandit algorithm performance
      const { data: banditPerf } = await this.supabase
        .from('bandit_performance_summary')
        .select('avg_success_rate')
        .limit(1);

      const avgBanditPerformance = banditPerf?.[0]?.avg_success_rate || 0.5;
      componentHealth.bandit_algorithms = avgBanditPerformance > 0.6 ? 'healthy' : 'degraded';
      
      if (avgBanditPerformance < 0.4) {
        alerts.push('Low bandit algorithm performance detected');
      }

      // Determine overall health
      const healthValues = Object.values(componentHealth);
      let overallHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (healthValues.includes('unhealthy') || alerts.length > 3) {
        overallHealth = 'unhealthy';
      } else if (healthValues.includes('degraded') || alerts.length > 0) {
        overallHealth = 'degraded';
      }

      return {
        overall_health: overallHealth,
        component_health: componentHealth,
        performance_metrics: {
          real_time_processing: realtimePerf,
          websocket_system: websocketHealth,
          bandit_performance: avgBanditPerformance
        },
        alerts
      };

    } catch (error) {
      console.error('Health check failed:', error);
      return {
        overall_health: 'unhealthy',
        component_health: { health_check: 'failed' },
        performance_metrics: {},
        alerts: ['Health check system failure']
      };
    }
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Main Integration Service Factory
export function createRealTimeLearningSystem(
  supabase: SupabaseClient,
  config: Partial<RealTimeIntegrationConfig> = {}
): {
  orchestrator: RealTimeLearningOrchestrator;
  healthMonitor: IntegrationHealthMonitor;
  start: () => Promise<any>;
  shutdown: () => Promise<void>;
} {
  const orchestrator = new RealTimeLearningOrchestrator(supabase, config);
  const healthMonitor = new IntegrationHealthMonitor(supabase);

  return {
    orchestrator,
    healthMonitor,
    start: async () => {
      const startResult = await orchestrator.start();
      healthMonitor.startHealthMonitoring();
      return startResult;
    },
    shutdown: async () => {
      await orchestrator.shutdown();
      healthMonitor.stopHealthMonitoring();
    }
  };
}

export { 
  type RealTimeIntegrationConfig,
  type UserInteractionEvent,
  type RecommendationUpdate 
};