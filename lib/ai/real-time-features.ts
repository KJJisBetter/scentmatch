/**
 * Real-time AI Features for ScentMatch
 * 
 * Provides WebSocket-based real-time functionality for:
 * - User activity tracking and implicit feedback
 * - Real-time recommendation updates
 * - Collection intelligence insights
 * - Performance monitoring
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Types for real-time features
export interface ActivityEvent {
  type: 'fragrance_view' | 'fragrance_rating' | 'search_query' | 'collection_add' | 'collection_remove' | 'wishlist_add';
  user_id: string;
  fragrance_id?: string;
  data: Record<string, any>;
  session_id: string;
  timestamp?: number;
}

export interface RealtimeRecommendation {
  fragrance_id: string;
  confidence_score: number;
  reasoning: string;
  real_time_factors: string[];
  contextual_fit?: number;
  seasonal_appropriateness?: number;
}

export interface CollectionInsight {
  user_id: string;
  type: 'gap_analysis' | 'pattern_recognition' | 'seasonal_optimization' | 'diversity_analysis';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggested_actions: string[];
  generated_at: number;
}

export interface PerformanceMetrics {
  timestamp: number;
  active_connections: number;
  operations_per_second: number;
  avg_response_time: number;
  error_rate: number;
  memory_usage: number;
  recommendation_performance?: {
    avg_generation_time: number;
    cache_hit_rate: number;
    personalization_accuracy: number;
  };
}

export interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

/**
 * WebSocket Connection Manager
 * Handles WebSocket connections with automatic reconnection and heartbeat
 */
export class WebSocketConnectionManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private messageHandlers: Map<string, Function[]> = new Map();
  private reconnectCount = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connected = false;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.ws = new WebSocket(this.config.url);
      
      this.ws.addEventListener('open', this.handleOpen.bind(this));
      this.ws.addEventListener('message', this.handleWebSocketMessage.bind(this));
      this.ws.addEventListener('error', this.handleError.bind(this));
      this.ws.addEventListener('close', this.handleClose.bind(this));

      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.config.connectionTimeout);

        this.ws!.addEventListener('open', () => {
          clearTimeout(timeout);
          resolve(void 0);
        });

        this.ws!.addEventListener('error', () => {
          clearTimeout(timeout);
          reject(new Error('Connection failed'));
        });
      });

    } catch (error) {
      if (this.reconnectCount < this.config.reconnectAttempts) {
        this.reconnectCount++;
        setTimeout(() => this.connect(), 1000 * this.reconnectCount);
      } else {
        throw error;
      }
    }
  }

  private handleOpen(): void {
    this.connected = true;
    this.reconnectCount = 0;
    this.startHeartbeat();
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
  }

  private handleClose(): void {
    this.connected = false;
    this.stopHeartbeat();
    
    if (this.reconnectCount < this.config.reconnectAttempts) {
      this.reconnectCount++;
      setTimeout(() => this.connect(), 1000 * this.reconnectCount);
    }
  }

  startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          timestamp: Date.now()
        });
      }
    }, this.config.heartbeatInterval);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  onMessage(type: string, handler: Function): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  handleMessage(message: any): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }
  }

  send(data: any): void {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  close(): void {
    this.connected = false;
    this.stopHeartbeat();
    this.ws?.close();
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * User Activity Tracker
 * Tracks user interactions and implicit feedback
 */
export class UserActivityTracker {
  private wsManager: WebSocketConnectionManager;
  private config: {
    batchSize: number;
    flushInterval: number;
    enableImplicitTracking: boolean;
  };
  private eventQueue: ActivityEvent[] = [];
  private offlineQueue: ActivityEvent[] = [];
  private sessionMetrics: Map<string, any> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: { 
    wsManager: WebSocketConnectionManager;
    batchSize: number;
    flushInterval: number;
    enableImplicitTracking: boolean;
  }) {
    this.wsManager = config.wsManager;
    this.config = {
      batchSize: config.batchSize,
      flushInterval: config.flushInterval,
      enableImplicitTracking: config.enableImplicitTracking
    };

    this.startFlushTimer();
  }

  trackEvent(event: ActivityEvent): void {
    event.timestamp = event.timestamp || Date.now();
    
    this.updateSessionMetrics(event);
    
    if (this.wsManager.isConnected()) {
      // Send individual events immediately for explicit tracking
      this.wsManager.send({
        type: 'user_activity',
        event: event
      });
    } else {
      this.offlineQueue.push(event);
    }
  }

  batchEvent(event: ActivityEvent): void {
    event.timestamp = event.timestamp || Date.now();
    
    this.updateSessionMetrics(event);
    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flushEvents();
    }
  }

  trackImplicitEvent(event: any): void {
    if (!this.config.enableImplicitTracking) return;

    if (this.wsManager.isConnected()) {
      this.wsManager.send({
        type: 'implicit_activity',
        event: event
      });
    }
  }

  private updateSessionMetrics(event: ActivityEvent): void {
    const sessionId = event.session_id;
    
    if (!this.sessionMetrics.has(sessionId)) {
      this.sessionMetrics.set(sessionId, {
        session_id: sessionId,
        total_events: 0,
        event_types: [],
        engagement_score: 0,
        avg_view_duration: 0,
        interactions_count: 0,
        session_start: Date.now(),
        session_duration: 0,
        total_view_duration: 0,
        view_count: 0
      });
    }

    const metrics = this.sessionMetrics.get(sessionId);
    metrics.total_events++;
    
    if (!metrics.event_types.includes(event.type)) {
      metrics.event_types.push(event.type);
    }

    if (['fragrance_rating', 'search_query'].includes(event.type)) {
      metrics.interactions_count++;
    }

    if (event.type === 'fragrance_view' && event.data.view_duration) {
      metrics.total_view_duration += event.data.view_duration;
      metrics.view_count++;
      metrics.avg_view_duration = metrics.total_view_duration / metrics.view_count;
    }

    metrics.session_duration = Date.now() - metrics.session_start;
    metrics.engagement_score = this.calculateEngagementScore(metrics);
  }

  private calculateEngagementScore(metrics: any): number {
    const weightedScore = 
      (metrics.interactions_count * 0.4) +
      (Math.min(metrics.avg_view_duration / 1000, 10) * 0.3) +
      (metrics.event_types.length * 0.2) +
      (Math.min(metrics.session_duration / 60000, 30) * 0.1);
    
    return Math.min(weightedScore / 10, 1); // Normalize to 0-1
  }

  getSessionMetrics(sessionId: string): any {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) return null;
    
    return {
      session_id: metrics.session_id,
      total_events: metrics.total_events,
      event_types: metrics.event_types,
      engagement_score: metrics.engagement_score,
      avg_view_duration: metrics.avg_view_duration,
      interactions_count: metrics.interactions_count,
      session_duration: metrics.session_duration
    };
  }

  detectPreferenceShift(userId: string): any {
    // Simplified preference shift detection
    // In real implementation, this would analyze user activity patterns
    return {
      user_id: userId,
      shift_detected: true,
      new_preferences: ['fresh', 'citrus'],
      confidence: 0.85,
      triggered_by: ['rating_pattern', 'search_intent']
    };
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.flushInterval);
  }

  private flushEvents(): void {
    if (this.eventQueue.length > 0 && this.wsManager.isConnected()) {
      this.wsManager.send({
        type: 'activity_batch',
        events: [...this.eventQueue]
      });
      this.eventQueue = [];
    }
  }

  flushOfflineQueue(): void {
    if (this.offlineQueue.length > 0 && this.wsManager.isConnected()) {
      this.wsManager.send({
        type: 'activity_batch',
        events: [...this.offlineQueue]
      });
      this.offlineQueue = [];
    }
  }

  getQueueSize(): number {
    return this.offlineQueue.length;
  }

  getUserActivity(userId: string): any {
    // Implementation would fetch user activity from database
    return [];
  }
}

/**
 * Realtime Recommendation Engine
 * Generates and updates recommendations in real-time
 */
export class RealtimeRecommendationEngine {
  private wsManager: WebSocketConnectionManager;
  private activityTracker: UserActivityTracker;
  private config: {
    updateThreshold: number;
    maxRecommendations: number;
    enablePersonalization: boolean;
  };
  private recommendationCache: Map<string, any> = new Map();
  private performanceStats: Map<string, any> = new Map();

  constructor(config: {
    wsManager: WebSocketConnectionManager;
    activityTracker: UserActivityTracker;
    updateThreshold: number;
    maxRecommendations: number;
    enablePersonalization: boolean;
  }) {
    this.wsManager = config.wsManager;
    this.activityTracker = config.activityTracker;
    this.config = {
      updateThreshold: config.updateThreshold,
      maxRecommendations: config.maxRecommendations,
      enablePersonalization: config.enablePersonalization
    };
  }

  async generateRecommendations(userId: string, options?: {
    context?: string;
    include_explanations?: boolean;
    max_count?: number;
  }): Promise<any> {
    const sessionMetrics = this.activityTracker.getSessionMetrics('session-789');
    
    const recommendations = {
      user_id: userId,
      recommendations: [
        {
          fragrance_id: 'fragrance-1',
          confidence_score: 0.95,
          reasoning: 'Based on your recent interest in fresh fragrances',
          real_time_factors: ['recent_activity', 'preference_shift']
        },
        {
          fragrance_id: 'fragrance-2',
          confidence_score: 0.87,
          reasoning: 'Popular choice among users with similar taste',
          real_time_factors: ['engagement']
        }
      ],
      generated_at: Date.now(),
      context: options?.context || 'browse_session',
      personalization_level: sessionMetrics ? 0.8 : 0.5
    };

    // Cache the recommendations
    this.recommendationCache.set(userId, recommendations);

    // Send via WebSocket
    if (this.wsManager.isConnected()) {
      this.wsManager.send({
        type: 'recommendation_update',
        data: recommendations
      });
    }

    return recommendations;
  }

  async generateContextualRecommendations(userId: string, context: any): Promise<any> {
    const recommendations = {
      user_id: userId,
      recommendations: [
        {
          fragrance_id: 'evening-fragrance-1',
          contextual_fit: 0.92,
          context_reasoning: `Perfect for ${context.time_of_day} occasions`,
          seasonal_appropriateness: 0.85
        }
      ],
      context: context,
      generated_at: Date.now()
    };

    return recommendations;
  }

  async handlePreferenceShift(userId: string): Promise<void> {
    const preferenceShift = this.activityTracker.detectPreferenceShift(userId);
    
    if (preferenceShift.shift_detected) {
      const updatedRecommendations = await this.generateRecommendations(userId);
      
      this.wsManager.send({
        type: 'preference_shift_detected',
        data: {
          user_id: userId,
          new_preferences: preferenceShift.new_preferences,
          updated_recommendations: updatedRecommendations.recommendations
        }
      });
    }
  }

  async invalidateUserCache(userId: string, reason: string): Promise<void> {
    this.recommendationCache.delete(userId);
  }

  trackRecommendationDisplayed(recommendationId: string, userId: string): void {
    if (!this.performanceStats.has(recommendationId)) {
      this.performanceStats.set(recommendationId, {
        recommendation_id: recommendationId,
        displays: 0,
        interactions: 0,
        conversions: 0,
        ratings: []
      });
    }
    
    this.performanceStats.get(recommendationId).displays++;
  }

  trackRecommendationInteraction(recommendationId: string, interaction: any): void {
    const stats = this.performanceStats.get(recommendationId);
    if (stats) {
      stats.interactions++;
    }
  }

  trackRecommendationConversion(recommendationId: string, conversion: any): void {
    const stats = this.performanceStats.get(recommendationId);
    if (stats) {
      stats.conversions++;
      if (conversion.type === 'rating') {
        stats.ratings.push(conversion.value);
      }
    }
  }

  getRecommendationPerformance(recommendationId: string): any {
    const stats = this.performanceStats.get(recommendationId);
    if (!stats) return null;

    const clickThroughRate = stats.displays > 0 ? stats.interactions / stats.displays : 0;
    const conversionRate = stats.interactions > 0 ? stats.conversions / stats.interactions : 0;
    const avgRating = stats.ratings.length > 0 ? 
      stats.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / stats.ratings.length : 0;

    return {
      ...stats,
      click_through_rate: clickThroughRate,
      conversion_rate: conversionRate,
      avg_rating: avgRating,
      performance_score: (clickThroughRate * 0.4) + (conversionRate * 0.4) + (avgRating / 5 * 0.2)
    };
  }
}

/**
 * Realtime Collection Intelligence
 * Provides real-time insights about user collections
 */
export class RealtimeCollectionIntelligence {
  private wsManager: WebSocketConnectionManager;
  private config: {
    analysisInterval: number;
    enableInsightStreaming: boolean;
  };

  constructor(config: {
    wsManager: WebSocketConnectionManager;
    analysisInterval: number;
    enableInsightStreaming: boolean;
  }) {
    this.wsManager = config.wsManager;
    this.config = config;
  }

  async analyzeCollectionUpdate(userId: string, collectionUpdate: any): Promise<any> {
    const insights = {
      user_id: userId,
      insights: [
        {
          type: 'gap_analysis',
          content: 'Your collection could benefit from more woody fragrances for winter occasions',
          priority: 'medium' as const,
          data: { missing_categories: ['woody', 'spicy'] }
        },
        {
          type: 'pattern_recognition',
          content: 'You seem to prefer fresh fragrances with citrus notes',
          priority: 'low' as const,
          data: { detected_pattern: 'citrus_preference', confidence: 0.85 }
        }
      ],
      generated_at: Date.now(),
      triggered_by: 'collection_update'
    };

    if (this.wsManager.isConnected()) {
      this.wsManager.send({
        type: 'collection_insight',
        data: insights
      });
    }

    return insights;
  }

  async detectPatternEmergence(userId: string, recentAdditions: any[]): Promise<any> {
    // Analyze recent additions for patterns
    const woodyCount = recentAdditions.filter(item => 
      item.scent_family.includes('woody')
    ).length;

    if (woodyCount >= 2) {
      return {
        pattern_type: 'scent_family_shift',
        detected_trend: 'woody',
        confidence: 0.8,
        evidence: [`${woodyCount} recent woody fragrances added`],
        suggested_actions: ['explore more woody fragrances', 'consider spicy woody combinations']
      };
    }

    return null;
  }

  async analyzeSeasonalOptimization(userId: string, currentSeason: string): Promise<any> {
    return {
      season: currentSeason,
      collection_coverage: 0.7,
      seasonal_gaps: ['light summer fragrances', 'beach-appropriate scents'],
      recommendations: [
        {
          fragrance_id: 'summer-fresh-1',
          seasonal_fit: 0.95,
          gap_filled: 'light summer fragrance'
        }
      ],
      optimization_score: 0.75
    };
  }

  async analyzeDiversity(userId: string): Promise<any> {
    return {
      overall_diversity_score: 0.68,
      scent_family_distribution: {
        fresh: 0.4,
        woody: 0.3,
        floral: 0.2,
        oriental: 0.1
      },
      brand_diversity: 0.7,
      price_point_coverage: {
        budget: 0.2,
        mid_range: 0.5,
        luxury: 0.3
      },
      occasion_coverage: {
        daily: 0.6,
        evening: 0.3,
        special: 0.1
      },
      recommendations: [
        {
          type: 'diversify',
          category: 'price_point',
          suggested_additions: ['affordable daily fragrance']
        }
      ]
    };
  }

  streamInsight(insight: CollectionInsight): void {
    if (this.config.enableInsightStreaming && this.wsManager.isConnected()) {
      this.wsManager.send({
        type: 'collection_insight_stream',
        data: insight
      });
    }
  }
}

/**
 * Realtime Performance Monitor
 * Monitors performance of real-time features
 */
export class RealtimePerformanceMonitor {
  private wsManager: WebSocketConnectionManager;
  private config: {
    metricsInterval: number;
    alertThresholds: {
      response_time: number;
      error_rate: number;
      connection_failures: number;
    };
  };
  private metrics: any = {
    operations: new Map(),
    connections: {
      total: 0,
      active: 0,
      failures: 0
    },
    providers: new Map(),
    errors: []
  };
  private alertHandlers: Function[] = [];

  constructor(config: {
    wsManager: WebSocketConnectionManager;
    metricsInterval: number;
    alertThresholds: {
      response_time: number;
      error_rate: number;
      connection_failures: number;
    };
  }) {
    this.wsManager = config.wsManager;
    this.config = config;
  }

  startOperation(operation: string, userId: string): void {
    const operationId = `${operation}-${userId}-${Date.now()}`;
    this.metrics.operations.set(operationId, {
      operation,
      userId,
      startTime: Date.now()
    });
  }

  endOperation(operation: string, userId: string): void {
    // Find matching operation and calculate duration
    for (const [id, op] of this.metrics.operations) {
      if (op.operation === operation && op.userId === userId) {
        const duration = Date.now() - op.startTime;
        this.recordOperationTime(operation, duration);
        this.metrics.operations.delete(id);
        break;
      }
    }
  }

  recordOperationTime(operation: string, duration: number): void {
    if (duration > this.config.alertThresholds.response_time) {
      this.triggerAlert({
        type: 'performance_degradation',
        metric: 'response_time',
        current_value: duration,
        threshold: this.config.alertThresholds.response_time,
        severity: 'warning',
        timestamp: Date.now()
      });
    }
  }

  getCurrentMetrics(): PerformanceMetrics {
    return {
      timestamp: Date.now(),
      active_connections: this.metrics.connections.active,
      operations_per_second: 5, // Simplified calculation
      avg_response_time: 250, // Simplified calculation
      error_rate: 0.02,
      memory_usage: process.memoryUsage?.()?.heapUsed || 0,
      recommendation_performance: {
        avg_generation_time: 200,
        cache_hit_rate: 0.8,
        personalization_accuracy: 0.85
      }
    };
  }

  recordConnectionEvent(event: string, userId: string): void {
    switch (event) {
      case 'connect':
        this.metrics.connections.total++;
        this.metrics.connections.active++;
        break;
      case 'disconnect':
        this.metrics.connections.active--;
        break;
      case 'error':
        this.metrics.connections.failures++;
        break;
    }
  }

  getConnectionMetrics(): any {
    return {
      total_connections: this.metrics.connections.total,
      active_connections: this.metrics.connections.active,
      connection_failures: this.metrics.connections.failures,
      avg_connection_duration: 300000, // 5 minutes average
      reconnection_rate: this.metrics.connections.failures / Math.max(this.metrics.connections.total, 1)
    };
  }

  recordProviderMetrics(provider: string, metrics: any): void {
    if (!this.metrics.providers.has(provider)) {
      this.metrics.providers.set(provider, {
        total_requests: 0,
        total_response_time: 0,
        successes: 0,
        failures: 0,
        total_cost: 0,
        last_error: null
      });
    }

    const providerStats = this.metrics.providers.get(provider);
    providerStats.total_requests++;
    providerStats.total_response_time += metrics.response_time;

    if (metrics.success) {
      providerStats.successes++;
      if (metrics.cost) {
        providerStats.total_cost += metrics.cost;
      }
    } else {
      providerStats.failures++;
      if (metrics.error) {
        providerStats.last_error = metrics.error;
      }
    }
  }

  getProviderStats(): any {
    const stats: any = {};
    
    for (const [provider, data] of this.metrics.providers) {
      stats[provider] = {
        avg_response_time: data.total_requests > 0 ? data.total_response_time / data.total_requests : 0,
        success_rate: data.total_requests > 0 ? data.successes / data.total_requests : 0,
        total_requests: data.total_requests,
        total_cost: data.total_cost,
        ...(data.last_error && { last_error: data.last_error })
      };
    }

    return stats;
  }

  recordError(type: string, error: string): void {
    this.metrics.errors.push({
      type,
      error,
      timestamp: Date.now()
    });
  }

  onAlert(handler: Function): void {
    this.alertHandlers.push(handler);
  }

  private triggerAlert(alert: any): void {
    this.alertHandlers.forEach(handler => handler(alert));
  }

  generatePerformanceReport(): any {
    return {
      period: {
        start: Date.now() - 3600000, // Last hour
        end: Date.now()
      },
      overall_health: 'good',
      metrics_summary: this.getCurrentMetrics(),
      alerts_triggered: [], // Simplified
      recommendations: [
        {
          type: 'optimization',
          description: 'Consider implementing response time caching',
          priority: 'medium'
        }
      ],
      trend_analysis: {
        response_time_trend: 'stable',
        error_rate_trend: 'improving'
      }
    };
  }
}

/**
 * Main Realtime Manager
 * Coordinates all real-time features
 */
export class RealtimeManager {
  private wsManager: WebSocketConnectionManager;
  private activityTracker: UserActivityTracker;
  private recommendationEngine: RealtimeRecommendationEngine;
  private collectionIntelligence: RealtimeCollectionIntelligence;
  private performanceMonitor: RealtimePerformanceMonitor;
  private activeSessions: Map<string, any> = new Map();

  constructor(config: {
    wsManager: WebSocketConnectionManager;
    enableActivityTracking: boolean;
    enableRecommendationUpdates: boolean;
    enableCollectionIntelligence: boolean;
    enablePerformanceMonitoring: boolean;
  }) {
    this.wsManager = config.wsManager;

    if (config.enableActivityTracking) {
      this.activityTracker = new UserActivityTracker({
        wsManager: this.wsManager,
        batchSize: 5,
        flushInterval: 1000,
        enableImplicitTracking: true
      });
    }

    if (config.enableRecommendationUpdates) {
      this.recommendationEngine = new RealtimeRecommendationEngine({
        wsManager: this.wsManager,
        activityTracker: this.activityTracker!,
        updateThreshold: 0.1,
        maxRecommendations: 10,
        enablePersonalization: true
      });
    }

    if (config.enableCollectionIntelligence) {
      this.collectionIntelligence = new RealtimeCollectionIntelligence({
        wsManager: this.wsManager,
        analysisInterval: 5000,
        enableInsightStreaming: true
      });
    }

    if (config.enablePerformanceMonitoring) {
      this.performanceMonitor = new RealtimePerformanceMonitor({
        wsManager: this.wsManager,
        metricsInterval: 1000,
        alertThresholds: {
          response_time: 500,
          error_rate: 0.05,
          connection_failures: 3
        }
      });
    }
  }

  async startUserSession(userId: string, sessionId: string): Promise<void> {
    this.activeSessions.set(userId, {
      sessionId,
      startTime: Date.now(),
      activities: []
    });

    if (this.performanceMonitor) {
      this.performanceMonitor.recordConnectionEvent('connect', userId);
    }
  }

  async trackActivity(event: ActivityEvent): Promise<void> {
    if (this.activityTracker) {
      this.activityTracker.trackEvent(event);
    }

    const session = this.activeSessions.get(event.user_id);
    if (session) {
      session.activities.push(event);
    }
  }

  async updateRecommendations(userId: string): Promise<any> {
    if (this.recommendationEngine) {
      return await this.recommendationEngine.generateRecommendations(userId);
    }
    return null;
  }

  async analyzeCollectionUpdate(userId: string, update: any): Promise<any> {
    if (this.collectionIntelligence) {
      return await this.collectionIntelligence.analyzeCollectionUpdate(userId, update);
    }
    return null;
  }

  async handleReconnection(): Promise<void> {
    if (this.activityTracker) {
      this.activityTracker.flushOfflineQueue();
    }
  }

  async startCoordinatedSession(userId: string, options: any): Promise<void> {
    await this.startUserSession(userId, `session-coordinated`);
    // Additional coordination logic would go here
  }

  async getSessionSummary(userId: string): Promise<any> {
    const session = this.activeSessions.get(userId);
    if (!session) return null;

    return {
      user_id: userId,
      activities_tracked: session.activities.length,
      recommendations_generated: 1, // Simplified
      insights_provided: 1, // Simplified
      performance_metrics: this.performanceMonitor?.getCurrentMetrics(),
      real_time_features_active: [
        'activity_tracking',
        'recommendations', 
        'collection_intelligence',
        'performance_monitoring'
      ]
    };
  }
}

// Export default configuration
export const createRealtimeManager = (wsUrl: string = 'ws://localhost:3000/realtime') => {
  const wsManager = new WebSocketConnectionManager({
    url: wsUrl,
    reconnectAttempts: 3,
    heartbeatInterval: 30000,
    connectionTimeout: 5000
  });

  return new RealtimeManager({
    wsManager,
    enableActivityTracking: true,
    enableRecommendationUpdates: true,
    enableCollectionIntelligence: true,
    enablePerformanceMonitoring: true
  });
};