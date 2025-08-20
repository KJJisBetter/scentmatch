import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  RealtimeManager,
  UserActivityTracker,
  RealtimeRecommendationEngine,
  RealtimeCollectionIntelligence,
  RealtimePerformanceMonitor,
  WebSocketConnectionManager,
  type ActivityEvent,
  type RealtimeRecommendation,
  type CollectionInsight,
  type PerformanceMetrics,
  type WebSocketConfig
} from '@/lib/ai/real-time-features';

describe('Real-time AI Features', () => {
  
  describe('WebSocket Connection Manager', () => {
    let wsManager: WebSocketConnectionManager;
    let mockWebSocket: any;

    beforeEach(() => {
      // Mock WebSocket
      mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        readyState: 1, // OPEN
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3
      };

      global.WebSocket = vi.fn(() => mockWebSocket);

      const config: WebSocketConfig = {
        url: 'ws://localhost:3000/realtime',
        reconnectAttempts: 3,
        heartbeatInterval: 30000,
        connectionTimeout: 5000
      };

      wsManager = new WebSocketConnectionManager(config);
    });

    it('should establish WebSocket connection', async () => {
      await wsManager.connect();

      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:3000/realtime');
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should handle connection errors and retry', async () => {
      let reconnectAttempts = 0;
      const maxRetries = 3;

      // Mock connection failure
      mockWebSocket.readyState = 3; // CLOSED
      
      const connectSpy = vi.spyOn(wsManager, 'connect').mockImplementation(async () => {
        reconnectAttempts++;
        if (reconnectAttempts < maxRetries) {
          throw new Error('Connection failed');
        }
        return Promise.resolve();
      });

      try {
        await wsManager.connect();
        expect(reconnectAttempts).toBe(3);
      } catch (error) {
        // Expected for failed connections
      }

      expect(connectSpy).toHaveBeenCalledTimes(1);
    });

    it('should send heartbeat messages to maintain connection', () => {
      vi.useFakeTimers();
      
      wsManager.startHeartbeat();
      
      // Advance time by heartbeat interval
      vi.advanceTimersByTime(30000);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'heartbeat', timestamp: expect.any(Number) })
      );
      
      vi.useRealTimers();
    });

    it('should handle message routing for different event types', () => {
      const onRecommendationUpdate = vi.fn();
      const onCollectionInsight = vi.fn();
      
      wsManager.onMessage('recommendation_update', onRecommendationUpdate);
      wsManager.onMessage('collection_insight', onCollectionInsight);

      // Simulate receiving messages
      const recommendationMessage = {
        type: 'recommendation_update',
        data: { fragrance_id: '123', score: 0.95 }
      };
      
      const collectionMessage = {
        type: 'collection_insight',
        data: { insight_type: 'gap_analysis', content: 'Missing summer fragrances' }
      };

      wsManager.handleMessage(recommendationMessage);
      wsManager.handleMessage(collectionMessage);

      expect(onRecommendationUpdate).toHaveBeenCalledWith(recommendationMessage.data);
      expect(onCollectionInsight).toHaveBeenCalledWith(collectionMessage.data);
    });

    it('should clean up connections and listeners on close', () => {
      wsManager.close();

      expect(mockWebSocket.close).toHaveBeenCalled();
      expect(wsManager.isConnected()).toBe(false);
    });
  });

  describe('User Activity Tracker', () => {
    let activityTracker: UserActivityTracker;
    let mockWsManager: any;

    beforeEach(() => {
      mockWsManager = {
        send: vi.fn(),
        isConnected: vi.fn().mockReturnValue(true)
      };

      activityTracker = new UserActivityTracker({
        wsManager: mockWsManager,
        batchSize: 5,
        flushInterval: 1000,
        enableImplicitTracking: true
      });
    });

    it('should track explicit user interactions', () => {
      const event: ActivityEvent = {
        type: 'fragrance_rating',
        user_id: 'user-123',
        fragrance_id: 'fragrance-456',
        data: { rating: 4, timestamp: Date.now() },
        session_id: 'session-789'
      };

      activityTracker.trackEvent(event);

      expect(mockWsManager.send).toHaveBeenCalledWith({
        type: 'user_activity',
        event: event
      });
    });

    it('should track implicit user interactions', () => {
      const viewEvent = {
        type: 'fragrance_view',
        user_id: 'user-123',
        fragrance_id: 'fragrance-456',
        data: { 
          view_duration: 5000,
          scroll_depth: 0.8,
          timestamp: Date.now()
        },
        session_id: 'session-789'
      };

      activityTracker.trackImplicitEvent(viewEvent);

      expect(mockWsManager.send).toHaveBeenCalledWith({
        type: 'implicit_activity',
        event: viewEvent
      });
    });

    it('should batch events and flush periodically', () => {
      vi.useFakeTimers();

      // Track multiple events without reaching batch size
      for (let i = 0; i < 3; i++) {
        (activityTracker as any).batchEvent({
          type: 'fragrance_view',
          user_id: 'user-123',
          fragrance_id: `fragrance-${i}`,
          data: { timestamp: Date.now() },
          session_id: 'session-789'
        });
      }

      // Should not send yet (batch size not reached)
      expect(mockWsManager.send).not.toHaveBeenCalled();

      // Advance time to trigger flush
      vi.advanceTimersByTime(1000);

      expect(mockWsManager.send).toHaveBeenCalledWith({
        type: 'activity_batch',
        events: expect.arrayContaining([
          expect.objectContaining({ type: 'fragrance_view' })
        ])
      });

      vi.useRealTimers();
    });

    it('should calculate session-based engagement metrics', () => {
      const sessionId = 'session-123';
      
      // Track various activities in session
      activityTracker.trackEvent({
        type: 'fragrance_view',
        user_id: 'user-123',
        fragrance_id: 'fragrance-1',
        data: { view_duration: 3000 },
        session_id: sessionId
      });

      activityTracker.trackEvent({
        type: 'fragrance_rating',
        user_id: 'user-123', 
        fragrance_id: 'fragrance-1',
        data: { rating: 5 },
        session_id: sessionId
      });

      activityTracker.trackEvent({
        type: 'search_query',
        user_id: 'user-123',
        data: { query: 'fresh citrus summer' },
        session_id: sessionId
      });

      const metrics = activityTracker.getSessionMetrics(sessionId);

      expect(metrics).toEqual({
        session_id: sessionId,
        total_events: 3,
        event_types: ['fragrance_view', 'fragrance_rating', 'search_query'],
        engagement_score: expect.any(Number),
        avg_view_duration: 3000,
        interactions_count: 2, // rating and search are interactions
        session_duration: expect.any(Number)
      });
    });

    it('should detect preference changes from activity patterns', () => {
      const userId = 'user-123';
      
      // Track pattern indicating shift to fresh/citrus preferences
      const recentActivities = [
        { type: 'fragrance_view', fragrance_id: 'citrus-1', data: { view_duration: 5000 } },
        { type: 'fragrance_rating', fragrance_id: 'citrus-2', data: { rating: 5 } },
        { type: 'fragrance_view', fragrance_id: 'fresh-1', data: { view_duration: 4000 } },
        { type: 'search_query', data: { query: 'fresh summer citrus' } }
      ];

      recentActivities.forEach(activity => {
        activityTracker.trackEvent({
          ...activity,
          user_id: userId,
          session_id: 'session-123'
        } as ActivityEvent);
      });

      const preferenceShift = activityTracker.detectPreferenceShift(userId);

      expect(preferenceShift).toEqual({
        user_id: userId,
        shift_detected: true,
        new_preferences: expect.arrayContaining(['fresh', 'citrus']),
        confidence: expect.any(Number),
        triggered_by: expect.arrayContaining(['rating_pattern', 'search_intent'])
      });
    });

    it('should handle offline activity queuing', () => {
      mockWsManager.isConnected.mockReturnValue(false);

      const event: ActivityEvent = {
        type: 'fragrance_rating',
        user_id: 'user-123',
        fragrance_id: 'fragrance-456', 
        data: { rating: 4 },
        session_id: 'session-789'
      };

      activityTracker.trackEvent(event);

      // Should queue instead of sending
      expect(mockWsManager.send).not.toHaveBeenCalled();
      expect(activityTracker.getQueueSize()).toBe(1);

      // When connection restored
      mockWsManager.isConnected.mockReturnValue(true);
      activityTracker.flushOfflineQueue();

      expect(mockWsManager.send).toHaveBeenCalledWith({
        type: 'activity_batch',
        events: [event]
      });
    });
  });

  describe('Realtime Recommendation Engine', () => {
    let realtimeEngine: RealtimeRecommendationEngine;
    let mockWsManager: any;
    let mockActivityTracker: any;

    beforeEach(() => {
      mockWsManager = {
        send: vi.fn(),
        onMessage: vi.fn(),
        isConnected: vi.fn().mockReturnValue(true)
      };

      mockActivityTracker = {
        getSessionMetrics: vi.fn(),
        getUserActivity: vi.fn(),
        detectPreferenceShift: vi.fn()
      };

      realtimeEngine = new RealtimeRecommendationEngine({
        wsManager: mockWsManager,
        activityTracker: mockActivityTracker,
        updateThreshold: 0.1, // Update if recommendation confidence changes by 10%
        maxRecommendations: 10,
        enablePersonalization: true
      });
    });

    it('should generate real-time recommendations based on current activity', async () => {
      const userId = 'user-123';
      const sessionId = 'session-789';

      mockActivityTracker.getSessionMetrics.mockReturnValue({
        session_id: sessionId,
        total_events: 5,
        event_types: ['fragrance_view', 'fragrance_rating'],
        engagement_score: 0.8,
        recent_preferences: ['fresh', 'citrus']
      });

      const recommendations = await realtimeEngine.generateRecommendations(userId, {
        context: 'browse_session',
        include_explanations: true,
        max_count: 5
      });

      expect(recommendations).toEqual({
        user_id: userId,
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            fragrance_id: expect.any(String),
            confidence_score: expect.any(Number),
            reasoning: expect.any(String),
            real_time_factors: expect.arrayContaining([
              expect.stringMatching(/recent_activity|preference_shift|engagement/)
            ])
          })
        ]),
        generated_at: expect.any(Number),
        context: 'browse_session',
        personalization_level: expect.any(Number)
      });

      expect(mockWsManager.send).toHaveBeenCalledWith({
        type: 'recommendation_update',
        data: recommendations
      });
    });

    it('should update recommendations when user preferences shift', async () => {
      const userId = 'user-123';
      
      mockActivityTracker.detectPreferenceShift.mockReturnValue({
        user_id: userId,
        shift_detected: true,
        new_preferences: ['woody', 'spicy'],
        confidence: 0.85,
        triggered_by: ['rating_pattern']
      });

      await realtimeEngine.handlePreferenceShift(userId);

      expect(mockWsManager.send).toHaveBeenCalledWith({
        type: 'preference_shift_detected',
        data: {
          user_id: userId,
          new_preferences: ['woody', 'spicy'],
          updated_recommendations: expect.any(Array)
        }
      });
    });

    it('should provide contextual recommendations based on time and weather', async () => {
      const userId = 'user-123';
      
      // Mock current context
      const context = {
        time_of_day: 'evening',
        season: 'winter',
        weather: 'cold',
        occasion: 'date_night'
      };

      const recommendations = await realtimeEngine.generateContextualRecommendations(
        userId, 
        context
      );

      expect(recommendations.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fragrance_id: expect.any(String),
            contextual_fit: expect.any(Number),
            context_reasoning: expect.stringContaining('evening'),
            seasonal_appropriateness: expect.any(Number)
          })
        ])
      );
    });

    it('should handle recommendation caching and invalidation', async () => {
      const userId = 'user-123';
      
      // First call should generate fresh recommendations
      const firstRecommendations = await realtimeEngine.generateRecommendations(userId);
      
      // Second call within cache period should return cached results
      const cachedRecommendations = await realtimeEngine.generateRecommendations(userId);
      
      expect(firstRecommendations.generated_at).toBe(cachedRecommendations.generated_at);

      // Simulate preference change to invalidate cache
      await realtimeEngine.invalidateUserCache(userId, 'preference_change');
      
      const newRecommendations = await realtimeEngine.generateRecommendations(userId);
      
      expect(newRecommendations.generated_at).toBeGreaterThan(firstRecommendations.generated_at);
    });

    it('should track recommendation performance and feedback', () => {
      const recommendationId = 'rec-123';
      const userId = 'user-123';
      
      // Track recommendation display
      realtimeEngine.trackRecommendationDisplayed(recommendationId, userId);
      
      // Track user interaction with recommendation
      realtimeEngine.trackRecommendationInteraction(recommendationId, {
        type: 'click',
        timestamp: Date.now(),
        fragrance_id: 'fragrance-456'
      });

      // Track conversion (rating/purchase intent)
      realtimeEngine.trackRecommendationConversion(recommendationId, {
        type: 'rating',
        value: 5,
        timestamp: Date.now()
      });

      const performance = realtimeEngine.getRecommendationPerformance(recommendationId);

      expect(performance).toEqual({
        recommendation_id: recommendationId,
        displays: 1,
        interactions: 1,
        conversions: 1,
        click_through_rate: 1.0,
        conversion_rate: 1.0,
        avg_rating: 5.0,
        performance_score: expect.any(Number)
      });
    });
  });

  describe('Realtime Collection Intelligence', () => {
    let collectionIntelligence: RealtimeCollectionIntelligence;
    let mockWsManager: any;

    beforeEach(() => {
      mockWsManager = {
        send: vi.fn(),
        onMessage: vi.fn(),
        isConnected: vi.fn().mockReturnValue(true)
      };

      collectionIntelligence = new RealtimeCollectionIntelligence({
        wsManager: mockWsManager,
        analysisInterval: 5000,
        enableInsightStreaming: true
      });
    });

    it('should analyze collection changes in real-time', async () => {
      const userId = 'user-123';
      const collectionUpdate = {
        action: 'add',
        fragrance_id: 'fragrance-456',
        fragrance_data: {
          id: 'fragrance-456',
          name: 'Fresh Summer Breeze',
          brand: 'TestBrand',
          scent_family: ['fresh', 'citrus'],
          notes: {
            top: ['bergamot', 'lemon'],
            middle: ['jasmine'],
            base: ['musk']
          }
        }
      };

      const insights = await collectionIntelligence.analyzeCollectionUpdate(
        userId, 
        collectionUpdate
      );

      expect(insights).toEqual({
        user_id: userId,
        insights: expect.arrayContaining([
          expect.objectContaining({
            type: 'gap_analysis',
            content: expect.any(String),
            priority: expect.any(Number)
          }),
          expect.objectContaining({
            type: 'pattern_recognition',
            content: expect.any(String),
            data: expect.any(Object)
          })
        ]),
        generated_at: expect.any(Number),
        triggered_by: 'collection_update'
      });

      expect(mockWsManager.send).toHaveBeenCalledWith({
        type: 'collection_insight',
        data: insights
      });
    });

    it('should detect emerging preference patterns', async () => {
      const userId = 'user-123';
      
      // Simulate multiple collection additions showing pattern
      const recentAdditions = [
        { scent_family: ['woody', 'spicy'], notes: { base: ['sandalwood', 'pepper'] } },
        { scent_family: ['woody', 'oriental'], notes: { base: ['cedar', 'vanilla'] } },
        { scent_family: ['woody', 'fresh'], notes: { base: ['oak', 'vetiver'] } }
      ];

      const pattern = await collectionIntelligence.detectPatternEmergence(
        userId, 
        recentAdditions
      );

      expect(pattern).toEqual({
        pattern_type: 'scent_family_shift',
        detected_trend: 'woody',
        confidence: expect.any(Number),
        evidence: expect.arrayContaining([
          expect.stringMatching(/woody/)
        ]),
        suggested_actions: expect.arrayContaining([
          expect.stringContaining('explore')
        ])
      });
    });

    it('should provide seasonal collection optimization', async () => {
      const userId = 'user-123';
      const currentSeason = 'summer';
      
      const seasonalAnalysis = await collectionIntelligence.analyzeSeasonalOptimization(
        userId,
        currentSeason
      );

      expect(seasonalAnalysis).toEqual({
        season: currentSeason,
        collection_coverage: expect.any(Number),
        seasonal_gaps: expect.any(Array),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            fragrance_id: expect.any(String),
            seasonal_fit: expect.any(Number),
            gap_filled: expect.any(String)
          })
        ]),
        optimization_score: expect.any(Number)
      });
    });

    it('should monitor collection diversity and balance', async () => {
      const userId = 'user-123';
      
      const diversityAnalysis = await collectionIntelligence.analyzeDiversity(userId);

      expect(diversityAnalysis).toEqual({
        overall_diversity_score: expect.any(Number),
        scent_family_distribution: expect.any(Object),
        brand_diversity: expect.any(Number),
        price_point_coverage: expect.any(Object),
        occasion_coverage: expect.any(Object),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            type: 'diversify',
            category: expect.any(String),
            suggested_additions: expect.any(Array)
          })
        ])
      });
    });

    it('should stream collection insights to connected clients', () => {
      const insight: CollectionInsight = {
        user_id: 'user-123',
        type: 'seasonal_gap',
        title: 'Missing Winter Fragrances',
        content: 'Your collection could benefit from more warming, spicy fragrances for winter.',
        priority: 'medium',
        actionable: true,
        suggested_actions: ['Browse woody fragrances', 'Explore spicy scents'],
        generated_at: Date.now()
      };

      collectionIntelligence.streamInsight(insight);

      expect(mockWsManager.send).toHaveBeenCalledWith({
        type: 'collection_insight_stream',
        data: insight
      });
    });
  });

  describe('Realtime Performance Monitor', () => {
    let performanceMonitor: RealtimePerformanceMonitor;
    let mockWsManager: any;

    beforeEach(() => {
      mockWsManager = {
        send: vi.fn(),
        onMessage: vi.fn(),
        isConnected: vi.fn().mockReturnValue(true)
      };

      performanceMonitor = new RealtimePerformanceMonitor({
        wsManager: mockWsManager,
        metricsInterval: 1000,
        alertThresholds: {
          response_time: 500,
          error_rate: 0.05,
          connection_failures: 3
        }
      });
    });

    it('should track real-time performance metrics', () => {
      const startTime = Date.now();
      
      // Simulate AI operations
      performanceMonitor.startOperation('recommendation_generation', 'user-123');
      
      // Simulate processing time
      setTimeout(() => {
        performanceMonitor.endOperation('recommendation_generation', 'user-123');
      }, 250);

      const metrics = performanceMonitor.getCurrentMetrics();

      expect(metrics).toEqual({
        timestamp: expect.any(Number),
        active_connections: expect.any(Number),
        operations_per_second: expect.any(Number),
        avg_response_time: expect.any(Number),
        error_rate: expect.any(Number),
        memory_usage: expect.any(Number),
        recommendation_performance: expect.objectContaining({
          avg_generation_time: expect.any(Number),
          cache_hit_rate: expect.any(Number),
          personalization_accuracy: expect.any(Number)
        })
      });
    });

    it('should detect and alert on performance degradation', () => {
      const alertHandler = vi.fn();
      performanceMonitor.onAlert(alertHandler);

      // Simulate slow operations triggering threshold
      for (let i = 0; i < 5; i++) {
        performanceMonitor.recordOperationTime('search', 800); // Above 500ms threshold
      }

      expect(alertHandler).toHaveBeenCalledWith({
        type: 'performance_degradation',
        metric: 'response_time',
        current_value: expect.any(Number),
        threshold: 500,
        severity: 'warning',
        timestamp: expect.any(Number)
      });
    });

    it('should monitor WebSocket connection health', () => {
      performanceMonitor.recordConnectionEvent('connect', 'user-123');
      performanceMonitor.recordConnectionEvent('disconnect', 'user-123');
      performanceMonitor.recordConnectionEvent('error', 'user-123');

      const connectionMetrics = performanceMonitor.getConnectionMetrics();

      expect(connectionMetrics).toEqual({
        total_connections: 1,
        active_connections: 0,
        connection_failures: 1,
        avg_connection_duration: expect.any(Number),
        reconnection_rate: expect.any(Number)
      });
    });

    it('should track AI provider performance across real-time operations', () => {
      performanceMonitor.recordProviderMetrics('voyage', {
        operation: 'embedding_generation',
        response_time: 150,
        success: true,
        cost: 0.0018,
        tokens: 10
      });

      performanceMonitor.recordProviderMetrics('openai', {
        operation: 'embedding_generation', 
        response_time: 300,
        success: false,
        error: 'Rate limit exceeded'
      });

      const providerStats = performanceMonitor.getProviderStats();

      expect(providerStats).toEqual({
        voyage: {
          avg_response_time: 150,
          success_rate: 1.0,
          total_requests: 1,
          total_cost: 0.0018
        },
        openai: {
          avg_response_time: 300,
          success_rate: 0.0,
          total_requests: 1,
          total_cost: 0,
          last_error: 'Rate limit exceeded'
        }
      });
    });

    it('should generate performance reports and recommendations', () => {
      // Simulate mixed performance data
      performanceMonitor.recordOperationTime('recommendation', 200);
      performanceMonitor.recordOperationTime('recommendation', 450);
      performanceMonitor.recordOperationTime('recommendation', 800);
      
      performanceMonitor.recordError('network_timeout', 'Connection timeout');
      performanceMonitor.recordError('ai_provider_error', 'Rate limit exceeded');

      const report = performanceMonitor.generatePerformanceReport();

      expect(report).toEqual({
        period: expect.any(Object),
        overall_health: expect.any(String),
        metrics_summary: expect.any(Object),
        alerts_triggered: expect.any(Array),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            description: expect.any(String),
            priority: expect.any(String)
          })
        ]),
        trend_analysis: expect.any(Object)
      });
    });
  });

  describe('Integration Tests', () => {
    let realtimeManager: RealtimeManager;
    let mockWsManager: any;

    beforeEach(() => {
      mockWsManager = {
        connect: vi.fn(),
        send: vi.fn(),
        onMessage: vi.fn(),
        close: vi.fn(),
        isConnected: vi.fn().mockReturnValue(true)
      };

      realtimeManager = new RealtimeManager({
        wsManager: mockWsManager,
        enableActivityTracking: true,
        enableRecommendationUpdates: true,
        enableCollectionIntelligence: true,
        enablePerformanceMonitoring: true
      });
    });

    it('should handle complete real-time user journey', async () => {
      const userId = 'user-123';
      const sessionId = 'session-789';

      // User starts browsing
      await realtimeManager.startUserSession(userId, sessionId);

      // Track user activity
      await realtimeManager.trackActivity({
        type: 'fragrance_view',
        user_id: userId,
        fragrance_id: 'fragrance-1',
        data: { view_duration: 3000 },
        session_id: sessionId
      });

      // Generate real-time recommendations
      const recommendations = await realtimeManager.updateRecommendations(userId);

      // User adds fragrance to collection
      await realtimeManager.trackActivity({
        type: 'collection_add',
        user_id: userId,
        fragrance_id: 'fragrance-1',
        session_id: sessionId
      });

      // Generate collection insights
      const insights = await realtimeManager.analyzeCollectionUpdate(userId, {
        action: 'add',
        fragrance_id: 'fragrance-1'
      });

      expect(recommendations).toBeDefined();
      expect(insights).toBeDefined();
      expect(mockWsManager.send).toHaveBeenCalledTimes(expect.any(Number));
    });

    it('should handle WebSocket disconnection and reconnection gracefully', async () => {
      const userId = 'user-123';

      // Simulate connection loss
      mockWsManager.isConnected.mockReturnValue(false);
      
      // Activity should be queued
      await realtimeManager.trackActivity({
        type: 'search_query',
        user_id: userId,
        data: { query: 'fresh summer' },
        session_id: 'session-123'
      });

      // Simulate reconnection
      mockWsManager.isConnected.mockReturnValue(true);
      await realtimeManager.handleReconnection();

      // Queued activities should be sent
      expect(mockWsManager.send).toHaveBeenCalledWith({
        type: 'activity_batch',
        events: expect.arrayContaining([
          expect.objectContaining({ type: 'search_query' })
        ])
      });
    });

    it('should coordinate all real-time features for optimal user experience', async () => {
      const userId = 'user-123';
      
      // Start coordinated real-time session
      await realtimeManager.startCoordinatedSession(userId, {
        enable_activity_tracking: true,
        enable_live_recommendations: true,
        enable_collection_insights: true,
        performance_monitoring: true
      });

      // Simulate active user session
      const activities = [
        { type: 'fragrance_view', fragrance_id: 'f1', data: { duration: 2000 } },
        { type: 'fragrance_rating', fragrance_id: 'f1', data: { rating: 5 } },
        { type: 'search_query', data: { query: 'similar to this' } },
        { type: 'collection_add', fragrance_id: 'f1' }
      ];

      for (const activity of activities) {
        await realtimeManager.trackActivity({
          ...activity,
          user_id: userId,
          session_id: 'session-coordinated'
        } as ActivityEvent);
      }

      // Verify all subsystems are working together
      const sessionSummary = await realtimeManager.getSessionSummary(userId);

      expect(sessionSummary).toEqual({
        user_id: userId,
        activities_tracked: 4,
        recommendations_generated: expect.any(Number),
        insights_provided: expect.any(Number),
        performance_metrics: expect.any(Object),
        real_time_features_active: ['activity_tracking', 'recommendations', 'collection_intelligence', 'performance_monitoring']
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

// Type definitions for testing
interface ActivityEvent {
  type: string;
  user_id: string;
  fragrance_id?: string;
  data: any;
  session_id: string;
  timestamp?: number;
}

interface RealtimeRecommendation {
  fragrance_id: string;
  confidence_score: number;
  reasoning: string;
  real_time_factors: string[];
  contextual_fit?: number;
  seasonal_appropriateness?: number;
}

interface CollectionInsight {
  user_id: string;
  type: string;
  title: string;
  content: string;
  priority: string;
  actionable: boolean;
  suggested_actions: string[];
  generated_at: number;
}

interface PerformanceMetrics {
  timestamp: number;
  active_connections: number;
  operations_per_second: number;
  avg_response_time: number;
  error_rate: number;
  memory_usage: number;
}

interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}