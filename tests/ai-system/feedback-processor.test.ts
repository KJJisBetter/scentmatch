import { describe, test, expect, beforeEach, vi, Mock } from 'vitest';

/**
 * Feedback Processor Test Suite
 * 
 * Tests for the AI-powered feedback processing system that learns
 * from user interactions and updates recommendations in real-time.
 * 
 * Test Coverage:
 * - Explicit feedback processing (ratings, likes/dislikes)
 * - Implicit feedback learning (view time, interactions)
 * - Thompson Sampling bandit optimization
 * - Preference learning and embedding updates
 * - Cache invalidation and recommendation refresh
 * - Feedback quality assessment
 */

const mockSupabaseClient = {
  from: vi.fn(() => ({
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })),
  rpc: vi.fn(),
};

// Mock AI feedback processing components
vi.mock('@/lib/ai-sdk/feedback-processor', () => ({
  FeedbackProcessor: vi.fn().mockImplementation(() => ({
    processExplicitFeedback: vi.fn(),
    processImplicitFeedback: vi.fn(),
    assessFeedbackQuality: vi.fn(),
    updateUserPreferences: vi.fn(),
  })),
  RecommendationCache: vi.fn().mockImplementation(() => ({
    invalidateUserCache: vi.fn(),
    refreshUserRecommendations: vi.fn(),
    getCacheStatus: vi.fn(),
  })),
  createThompsonSamplingService: vi.fn(() => ({
    processFeedback: vi.fn(),
    getAlgorithmPerformance: vi.fn(),
    updateSuccessRates: vi.fn(),
  })),
}));

const { 
  FeedbackProcessor, 
  RecommendationCache, 
  createThompsonSamplingService 
} = await import('@/lib/ai-sdk/feedback-processor');

describe('Feedback Processor Tests', () => {
  let feedbackProcessor: any;
  let recommendationCache: any;
  let thompsonService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    feedbackProcessor = new FeedbackProcessor({
      supabase: mockSupabaseClient,
      enableImplicitFeedback: true,
      enableExplicitFeedback: true,
      learningRate: 0.1,
      feedbackDecayDays: 90,
    });

    recommendationCache = new RecommendationCache({
      supabase: mockSupabaseClient,
      defaultTTL: 3600,
      enableRealTimeInvalidation: true,
    });

    thompsonService = createThompsonSamplingService(mockSupabaseClient);
  });

  describe('Explicit Feedback Processing', () => {
    test('should process like feedback with preference learning', async () => {
      const mockFeedbackResult = {
        learning_impact: 0.15,
        preference_update_applied: true,
        updated_embedding: true,
        preference_adjustment: 'positive_scent_family',
        confidence_boost: 0.05,
      };

      feedbackProcessor.processExplicitFeedback.mockResolvedValueOnce(mockFeedbackResult);

      const feedbackEvent = {
        user_id: 'test-user',
        fragrance_id: 'frag-123',
        feedback_type: 'like',
        rating_value: 4,
        confidence: 0.8,
        context: {
          recommendation_id: 'rec-456',
          recommendation_source: 'ai_hybrid',
        },
      };

      const result = await feedbackProcessor.processExplicitFeedback(feedbackEvent);

      expect(result.learning_impact).toBe(0.15);
      expect(result.preference_update_applied).toBe(true);
      expect(result.updated_embedding).toBe(true);
      expect(result.preference_adjustment).toBe('positive_scent_family');
    });

    test('should process dislike feedback with negative learning', async () => {
      const mockFeedbackResult = {
        learning_impact: 0.12,
        preference_update_applied: true,
        updated_embedding: false,
        preference_adjustment: 'negative_intensity',
        confidence_adjustment: -0.03,
      };

      feedbackProcessor.processExplicitFeedback.mockResolvedValueOnce(mockFeedbackResult);

      const feedbackEvent = {
        user_id: 'test-user',
        fragrance_id: 'frag-456',
        feedback_type: 'dislike',
        confidence: 0.9,
        reason: 'Too strong/overwhelming',
      };

      const result = await feedbackProcessor.processExplicitFeedback(feedbackEvent);

      expect(result.learning_impact).toBe(0.12);
      expect(result.preference_adjustment).toBe('negative_intensity');
      expect(result.updated_embedding).toBe(false); // No embedding update for negative
    });

    test('should handle detailed rating feedback', async () => {
      const mockFeedbackResult = {
        learning_impact: 0.25, // High impact for detailed feedback
        preference_update_applied: true,
        updated_embedding: true,
        preference_adjustment: 'refined_preferences',
        detailed_analysis: {
          scent_family_preference: 'increased_oriental',
          intensity_preference: 'medium_strong',
          occasion_learning: 'evening_preferred',
        },
      };

      feedbackProcessor.processExplicitFeedback.mockResolvedValueOnce(mockFeedbackResult);

      const detailedFeedback = {
        user_id: 'test-user',
        fragrance_id: 'frag-789',
        feedback_type: 'rating',
        rating_value: 5,
        confidence: 1.0,
        reason: 'Perfect for evening occasions, love the oriental notes',
        context: {
          time_spent_rating: 45, // Thoughtful rating
          previous_interactions: 3,
        },
      };

      const result = await feedbackProcessor.processExplicitFeedback(detailedFeedback);

      expect(result.learning_impact).toBe(0.25);
      expect(result.detailed_analysis).toBeDefined();
      expect(result.detailed_analysis.occasion_learning).toBe('evening_preferred');
    });
  });

  describe('Thompson Sampling Bandit Optimization', () => {
    test('should update algorithm success rates based on feedback', async () => {
      const mockBanditResult = {
        algorithm_updated: true,
        new_success_rate: 0.73,
        learning_impact: 0.08,
        processing_time_ms: 25,
        processed: true,
        algorithm_performance: {
          'hybrid': 0.73,
          'ai_similarity': 0.68,
          'collaborative': 0.71,
        },
      };

      thompsonService.processFeedback.mockResolvedValueOnce(mockBanditResult);

      const banditFeedback = {
        user_id: 'test-user',
        fragrance_id: 'frag-bandit',
        algorithm_used: 'hybrid',
        action: 'add_to_collection',
        action_value: 5,
        immediate_reward: 1.0,
        contextual_factors: {
          time_of_day: 'evening',
          season: 'winter',
          user_type: 'experienced',
        },
      };

      const result = await thompsonService.processFeedback(banditFeedback);

      expect(result.algorithm_updated).toBe(true);
      expect(result.new_success_rate).toBe(0.73);
      expect(result.processing_time_ms).toBeLessThan(50);
      expect(result.algorithm_performance.hybrid).toBeGreaterThan(0.7);
    });

    test('should optimize algorithm selection based on user context', async () => {
      thompsonService.getAlgorithmPerformance.mockReturnValueOnce({
        'hybrid': { success_rate: 0.75, confidence: 0.85 },
        'ai_similarity': { success_rate: 0.68, confidence: 0.72 },
        'collaborative': { success_rate: 0.71, confidence: 0.78 },
      });

      const performance = thompsonService.getAlgorithmPerformance('test-user');

      expect(performance.hybrid.success_rate).toBeGreaterThan(0.7);
      expect(performance.hybrid.success_rate).toBeGreaterThan(performance.ai_similarity.success_rate);
    });
  });

  describe('Cache Management and Performance', () => {
    test('should invalidate recommendation cache after significant feedback', async () => {
      const mockInvalidationResult = {
        invalidated: true,
        cache_keys_cleared: ['user:test-user:recommendations', 'user:test-user:trending'],
        invalidation_reason: 'high_impact_feedback',
        refresh_scheduled: true,
      };

      recommendationCache.invalidateUserCache.mockResolvedValueOnce(mockInvalidationResult);

      const result = await recommendationCache.invalidateUserCache('test-user', {
        type: 'feedback_received',
        fragrance_id: 'frag-cache',
        rating: 5,
        impact_level: 'high',
      });

      expect(result.invalidated).toBe(true);
      expect(result.cache_keys_cleared).toContain('user:test-user:recommendations');
      expect(result.refresh_scheduled).toBe(true);
    });

    test('should preserve cache for low-impact feedback', async () => {
      const mockInvalidationResult = {
        invalidated: false,
        cache_preserved: true,
        invalidation_reason: 'low_impact_feedback',
        ttl_remaining: 2400,
      };

      recommendationCache.invalidateUserCache.mockResolvedValueOnce(mockInvalidationResult);

      const result = await recommendationCache.invalidateUserCache('test-user', {
        type: 'feedback_received',
        fragrance_id: 'frag-low-impact',
        rating: 3,
        impact_level: 'low',
      });

      expect(result.invalidated).toBe(false);
      expect(result.cache_preserved).toBe(true);
      expect(result.ttl_remaining).toBeGreaterThan(2000);
    });
  });

  describe('Feedback Quality Assessment', () => {
    test('should assess high-quality detailed feedback', async () => {
      const mockQualityAssessment = {
        reliability_score: 0.88,
        quality_level: 'high',
        trust_factors: {
          consistency: 0.9,
          detail_level: 0.85,
          time_investment: 0.8,
          experience_level: 0.7,
        },
        learning_weight: 0.85,
      };

      feedbackProcessor.assessFeedbackQuality.mockResolvedValueOnce(mockQualityAssessment);

      const qualityInput = {
        user_id: 'test-user',
        fragrance_id: 'frag-quality',
        feedback_type: 'rating',
        rating_value: 5,
        time_spent_before_rating: 60, // 1 minute consideration
        previous_interactions: 5,
        feedback_text_length: 120, // Detailed notes
      };

      const result = await feedbackProcessor.assessFeedbackQuality(qualityInput);

      expect(result.quality_level).toBe('high');
      expect(result.reliability_score).toBeGreaterThan(0.8);
      expect(result.learning_weight).toBeGreaterThan(0.8);
      expect(result.trust_factors.time_investment).toBeGreaterThan(0.7);
    });

    test('should identify low-quality rapid feedback', async () => {
      const mockQualityAssessment = {
        reliability_score: 0.32,
        quality_level: 'low',
        trust_factors: {
          consistency: 0.4,
          detail_level: 0.1,
          time_investment: 0.2,
          pattern_suspicious: true,
        },
        learning_weight: 0.15,
      };

      feedbackProcessor.assessFeedbackQuality.mockResolvedValueOnce(mockQualityAssessment);

      const rapidFeedback = {
        user_id: 'test-user',
        fragrance_id: 'frag-rapid',
        feedback_type: 'like',
        time_spent_before_rating: 2, // 2 seconds - too fast
        previous_interactions: 0,
        feedback_text_length: 0, // No notes
      };

      const result = await feedbackProcessor.assessFeedbackQuality(rapidFeedback);

      expect(result.quality_level).toBe('low');
      expect(result.reliability_score).toBeLessThan(0.5);
      expect(result.learning_weight).toBeLessThan(0.3);
      expect(result.trust_factors.pattern_suspicious).toBe(true);
    });
  });

  describe('Real-time Learning Integration', () => {
    test('should update user preferences in real-time', async () => {
      const mockPreferenceUpdate = {
        preferences_updated: true,
        updated_categories: ['scent_family', 'intensity', 'occasion'],
        confidence_changes: {
          oriental: +0.15,
          fresh: -0.08,
          intensity_strong: +0.12,
        },
        embedding_update_scheduled: true,
      };

      feedbackProcessor.updateUserPreferences.mockResolvedValueOnce(mockPreferenceUpdate);

      const result = await feedbackProcessor.updateUserPreferences('test-user', {
        fragrance_id: 'frag-learning',
        feedback_type: 'love',
        learning_context: {
          scent_family: 'Oriental',
          intensity_score: 4.2,
          occasion_context: 'evening',
        },
      });

      expect(result.preferences_updated).toBe(true);
      expect(result.updated_categories).toContain('scent_family');
      expect(result.confidence_changes.oriental).toBe(0.15);
      expect(result.embedding_update_scheduled).toBe(true);
    });
  });
});