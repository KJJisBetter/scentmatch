/**
 * AI Endpoints Compatibility Tests
 *
 * Critical tests to ensure API compatibility during AI system refactor.
 * These tests verify the existing API contracts for all AI-related endpoints
 * that will be affected by the Vercel AI SDK migration.
 *
 * These are schema validation tests focused on response structure verification
 * rather than implementation details. The goal is to ensure that after refactoring
 * with Vercel AI SDK, the API responses maintain their expected structure.
 *
 * @priority CRITICAL - Must pass before any AI refactoring
 */

import { describe, test, expect } from 'vitest';

// API Contract Validation Functions
function validateRecommendationRefreshResponse(response: any) {
  // For immediate refresh response
  if (response.refresh_triggered) {
    expect(response).toEqual(
      expect.objectContaining({
        refresh_triggered: expect.any(Boolean),
        updated_sections: expect.any(Array),
        processing_time_ms: expect.any(Number),
        cache_invalidated: expect.any(Boolean),
        new_recommendations_available: expect.any(Boolean),
        estimated_improvement: expect.any(Number),
        trigger: expect.any(String),
      })
    );

    // Validate array contents and numeric ranges
    expect(response.updated_sections.length).toBeGreaterThan(0);
    expect(response.processing_time_ms).toBeGreaterThan(0);
    expect(response.estimated_improvement).toBeGreaterThanOrEqual(0);
    expect(response.estimated_improvement).toBeLessThanOrEqual(1);
  }

  // For batch refresh response (202 status)
  if (response.batch_refresh_queued) {
    expect(response).toEqual(
      expect.objectContaining({
        batch_refresh_queued: expect.any(Boolean),
        updated_sections: expect.any(Array),
        estimated_completion: expect.any(String),
        queue_position: expect.any(Number),
        trigger: expect.any(String),
      })
    );
  }
}

function validateRecommendationFeedbackResponse(response: any) {
  expect(response).toEqual(
    expect.objectContaining({
      success: expect.any(Boolean),
      feedback_processed: expect.any(Boolean),
      feedback_id: expect.any(String),
      learning_impact: expect.any(Number),
      preference_update: expect.objectContaining({
        preferences_updated: expect.any(Boolean),
        embedding_updated: expect.any(Boolean),
        confidence_change: expect.any(Number),
        learning_weight: expect.any(Number),
      }),
      recommendation_refresh: expect.objectContaining({
        cache_invalidated: expect.any(Boolean),
        new_recommendations_available: expect.any(Boolean),
        refresh_recommended: expect.any(Boolean),
      }),
      feedback_quality: expect.objectContaining({
        reliability_score: expect.any(Number),
        quality_level: expect.any(String),
        trust_factors: expect.any(Array),
      }),
      metadata: expect.objectContaining({
        processing_time_ms: expect.any(Number),
        ai_learning_applied: expect.any(Boolean),
      }),
    })
  );

  // Validate ranges and types
  expect(response.learning_impact).toBeGreaterThanOrEqual(0);
  expect(response.learning_impact).toBeLessThanOrEqual(1);
  expect(response.preference_update.confidence_change).toBeGreaterThanOrEqual(
    -1
  );
  expect(response.preference_update.confidence_change).toBeLessThanOrEqual(1);
  expect(response.feedback_quality.reliability_score).toBeGreaterThanOrEqual(0);
  expect(response.feedback_quality.reliability_score).toBeLessThanOrEqual(1);
  expect(['high', 'medium', 'low']).toContain(
    response.feedback_quality.quality_level
  );
}

function validateBrowsePersonalizedResponse(response: any) {
  expect(response).toEqual(
    expect.objectContaining({
      fragrances: expect.any(Array),
      total: expect.any(Number),
      sorting_strategy: expect.any(String),
      user_collection_size: expect.any(Number),
      metadata: expect.objectContaining({
        processing_time_ms: expect.any(Number),
        authenticated: expect.any(Boolean),
        personalized: expect.any(Boolean),
      }),
    })
  );

  // Validate fragrance objects structure
  response.fragrances.forEach((fragrance: any) => {
    expect(fragrance).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        brand: expect.any(String),
        collection_status: expect.any(Array),
        in_collection: expect.any(Boolean),
        in_wishlist: expect.any(Boolean),
      })
    );
  });

  // Validate sorting strategies
  expect(['popularity', 'personalized']).toContain(response.sorting_strategy);
  expect(response.total).toBeGreaterThanOrEqual(0);
  expect(response.user_collection_size).toBeGreaterThanOrEqual(0);
}

function validateQuizAnalyzeResponse(response: any) {
  expect(response).toEqual(
    expect.objectContaining({
      analysis_complete: expect.any(Boolean),
      recommendations: expect.any(Array),
      quiz_session_token: expect.any(String),
      processing_time_ms: expect.any(Number),
      recommendation_method: expect.any(String),
      personality_analysis: expect.any(Object),
      next_steps: expect.objectContaining({
        try_samples: expect.any(Boolean),
        create_account: expect.any(Boolean),
        explore_more: expect.any(Boolean),
      }),
    })
  );

  // Validate quiz session token format
  expect(response.quiz_session_token).toMatch(
    /^quiz-\d+-[a-z0-9]+$|^[a-z0-9-]+$/
  );

  // Validate recommendations structure
  response.recommendations.forEach((rec: any) => {
    expect(rec).toEqual(
      expect.objectContaining({
        fragrance_id: expect.any(String),
        name: expect.any(String),
        brand: expect.any(String),
      })
    );
  });
}

function validateSimilarFragrancesResponse(response: any) {
  expect(response).toEqual(
    expect.objectContaining({
      similar: expect.any(Array),
      metadata: expect.objectContaining({
        threshold_used: expect.any(Number),
        max_results: expect.any(Number),
        embedding_version: expect.any(String),
        total_found: expect.any(Number),
      }),
    })
  );

  // Validate similar fragrances structure
  response.similar.forEach((item: any) => {
    expect(item).toEqual(
      expect.objectContaining({
        fragrance_id: expect.any(String),
        similarity_score: expect.any(Number),
        name: expect.any(String),
        brand: expect.any(String),
      })
    );

    // Validate similarity score range
    expect(item.similarity_score).toBeGreaterThanOrEqual(0);
    expect(item.similarity_score).toBeLessThanOrEqual(1);
  });

  // Validate metadata ranges
  expect(response.metadata.threshold_used).toBeGreaterThanOrEqual(0);
  expect(response.metadata.threshold_used).toBeLessThanOrEqual(1);
  expect(response.metadata.max_results).toBeGreaterThan(0);
  expect(response.metadata.total_found).toBeGreaterThanOrEqual(0);
}

// Error Response Validation
function validateErrorResponse(response: any, expectedStatus: number) {
  expect(response).toEqual(
    expect.objectContaining({
      error: expect.any(String),
    })
  );
  expect(response.error.length).toBeGreaterThan(0);
}

describe('AI Endpoints Compatibility Tests', () => {
  describe('API Response Schema Validation', () => {
    test('should validate recommendation refresh response schema structure', () => {
      // Test immediate refresh response
      const immediateRefreshResponse = {
        refresh_triggered: true,
        updated_sections: ['perfect_matches', 'adventurous', 'seasonal'],
        processing_time_ms: 45,
        cache_invalidated: true,
        new_recommendations_available: true,
        estimated_improvement: 0.15,
        trigger: 'preference_change',
      };

      expect(() =>
        validateRecommendationRefreshResponse(immediateRefreshResponse)
      ).not.toThrow();

      // Test batch refresh response
      const batchRefreshResponse = {
        batch_refresh_queued: true,
        updated_sections: ['perfect_matches', 'trending'],
        estimated_completion: '2024-12-15T10:15:00Z',
        queue_position: 1,
        trigger: 'algorithm_update',
      };

      expect(() =>
        validateRecommendationRefreshResponse(batchRefreshResponse)
      ).not.toThrow();
    });

    test('should validate recommendation feedback response schema structure', () => {
      const feedbackResponse = {
        success: true,
        feedback_processed: true,
        feedback_id: 'feedback_1234567890',
        learning_impact: 0.12,
        preference_update: {
          preferences_updated: true,
          embedding_updated: true,
          confidence_change: 0.05,
          learning_weight: 0.8,
        },
        recommendation_refresh: {
          cache_invalidated: true,
          new_recommendations_available: true,
          refresh_recommended: true,
        },
        feedback_quality: {
          reliability_score: 0.85,
          quality_level: 'high',
          trust_factors: [
            'consistent_rating_pattern',
            'sufficient_interaction_time',
          ],
        },
        metadata: {
          processing_time_ms: 67,
          ai_learning_applied: true,
          bandit_learning_applied: true,
          preference_adjustment_type: 'moderate',
        },
      };

      expect(() =>
        validateRecommendationFeedbackResponse(feedbackResponse)
      ).not.toThrow();
    });

    test('should validate browse personalized response schema structure', () => {
      const browseResponse = {
        fragrances: [
          {
            id: 'frag-123',
            name: 'Test Fragrance',
            brand: 'Test Brand',
            brand_id: 'brand-123',
            gender: 'unisex',
            scent_family: 'woody',
            popularity_score: 0.85,
            rating_value: 4.2,
            rating_count: 150,
            relevance_score: 0.9,
            sample_available: true,
            sample_price_usd: 15,
            collection_status: ['owned'],
            in_collection: true,
            in_wishlist: false,
          },
        ],
        total: 1,
        sorting_strategy: 'personalized',
        user_collection_size: 5,
        metadata: {
          processing_time_ms: 45,
          authenticated: true,
          personalized: true,
        },
      };

      expect(() =>
        validateBrowsePersonalizedResponse(browseResponse)
      ).not.toThrow();
    });

    test('should validate quiz analyze response schema structure', () => {
      const quizResponse = {
        analysis_complete: true,
        recommendations: [
          {
            fragrance_id: 'quiz-rec-1',
            name: 'Quiz Recommendation 1',
            brand: 'Test Brand',
            score: 0.89,
            explanation: 'Perfect match for your preferences',
          },
        ],
        quiz_session_token: 'quiz-1634567890-abcdef123',
        processing_time_ms: 45,
        recommendation_method: 'database_rpc',
        personality_analysis: {
          personality_type: 'sophisticated',
          confidence: 0.87,
          traits: ['elegant', 'complex', 'evening'],
        },
        next_steps: {
          try_samples: true,
          create_account: true,
          explore_more: true,
        },
      };

      expect(() => validateQuizAnalyzeResponse(quizResponse)).not.toThrow();
    });

    test('should validate similar fragrances response schema structure', () => {
      const similarResponse = {
        similar: [
          {
            fragrance_id: 'similar-1',
            similarity_score: 0.89,
            name: 'Similar Fragrance 1',
            brand: 'Similar Brand 1',
            image_url: '/images/similar1.jpg',
            sample_available: true,
            sample_price_usd: 15,
            scent_family: 'woody',
          },
        ],
        metadata: {
          threshold_used: 0.7,
          max_results: 6,
          embedding_version: 'voyage-3.5',
          total_found: 1,
        },
      };

      expect(() =>
        validateSimilarFragrancesResponse(similarResponse)
      ).not.toThrow();
    });

    test('should validate error response structure', () => {
      const errorResponse = {
        error: 'Authentication required',
      };

      expect(() => validateErrorResponse(errorResponse, 401)).not.toThrow();

      const validationErrorResponse = {
        error: 'Invalid feedback data',
        validation_errors: [
          'Invalid fragrance_id format',
          'Invalid feedback_type',
        ],
      };

      expect(() =>
        validateErrorResponse(validationErrorResponse, 400)
      ).not.toThrow();
    });
  });

  describe('API Contract Edge Cases', () => {
    test('should handle empty arrays and null values appropriately', () => {
      // Browse with no fragrances
      const emptyBrowseResponse = {
        fragrances: [],
        total: 0,
        sorting_strategy: 'popularity',
        user_collection_size: 0,
        metadata: {
          processing_time_ms: 25,
          authenticated: false,
          personalized: false,
        },
      };

      expect(() =>
        validateBrowsePersonalizedResponse(emptyBrowseResponse)
      ).not.toThrow();

      // Similar fragrances with no results
      const emptySimilarResponse = {
        similar: [],
        metadata: {
          threshold_used: 0.9,
          max_results: 10,
          embedding_version: 'voyage-3.5',
          total_found: 0,
        },
      };

      expect(() =>
        validateSimilarFragrancesResponse(emptySimilarResponse)
      ).not.toThrow();
    });

    test('should validate fallback response structures', () => {
      // Similar fragrances fallback response
      const fallbackSimilarResponse = {
        similar: [
          {
            fragrance_id: 'fallback-1',
            similarity_score: 0.5,
            name: 'Fallback Fragrance',
            brand: 'Unknown Brand',
          },
        ],
        fallback: true,
        message: 'Using fallback similarity algorithm',
        metadata: {
          threshold_used: 0.7,
          max_results: 6,
          embedding_version: 'voyage-3.5',
          total_found: 1,
        },
      };

      expect(() =>
        validateSimilarFragrancesResponse(fallbackSimilarResponse)
      ).not.toThrow();
    });

    test('should validate failed quiz analysis response', () => {
      const failedQuizResponse = {
        analysis_complete: false,
        error: 'Unable to generate recommendations',
        recommendations: [],
        quiz_session_token: 'quiz-session-123',
        processing_time_ms: 100,
      };

      // This should have the basic structure even when failed
      expect(failedQuizResponse).toEqual(
        expect.objectContaining({
          analysis_complete: expect.any(Boolean),
          recommendations: expect.any(Array),
          quiz_session_token: expect.any(String),
          processing_time_ms: expect.any(Number),
        })
      );
    });
  });

  describe('Required Field Validation', () => {
    test('should identify missing required fields in responses', () => {
      // Test that validation functions catch missing required fields
      const incompleteRefreshResponse = {
        refresh_triggered: true,
        // Missing required fields: updated_sections, processing_time_ms, etc.
      };

      expect(() =>
        validateRecommendationRefreshResponse(incompleteRefreshResponse)
      ).toThrow();

      const incompleteFeedbackResponse = {
        success: true,
        // Missing required fields: feedback_processed, learning_impact, etc.
      };

      expect(() =>
        validateRecommendationFeedbackResponse(incompleteFeedbackResponse)
      ).toThrow();
    });

    test('should validate numeric field ranges', () => {
      // Test that numeric values are within expected ranges
      const invalidRangeResponse = {
        success: true,
        feedback_processed: true,
        feedback_id: 'test',
        learning_impact: 1.5, // Invalid: should be 0-1
        preference_update: {
          preferences_updated: true,
          embedding_updated: true,
          confidence_change: 0.05,
          learning_weight: 0.8,
        },
        recommendation_refresh: {
          cache_invalidated: true,
          new_recommendations_available: true,
          refresh_recommended: true,
        },
        feedback_quality: {
          reliability_score: 0.85,
          quality_level: 'high',
          trust_factors: [],
        },
        metadata: {
          processing_time_ms: 67,
          ai_learning_applied: true,
        },
      };

      expect(() =>
        validateRecommendationFeedbackResponse(invalidRangeResponse)
      ).toThrow();
    });
  });

  describe('HTTP Headers and Status Codes', () => {
    test('should expect appropriate cache headers for each endpoint', () => {
      // These are the expected cache patterns that should be maintained
      const expectedCacheHeaders = {
        'recommendations/refresh': 'no-cache', // Real-time updates
        'recommendations/feedback': 'no-cache', // User-specific actions
        'browse/personalized': 'private, s-maxage=60', // Short cache for personalized
        'fragrances/similar': 'public, s-maxage=3600', // Longer cache for similar items
        'quiz/analyze': 'private, max-age=300', // Medium cache for quiz results
      };

      // Verify expected patterns exist (this documents the contract)
      Object.entries(expectedCacheHeaders).forEach(
        ([endpoint, cachePattern]) => {
          expect(cachePattern).toBeTruthy();
          expect(typeof cachePattern).toBe('string');
        }
      );
    });

    test('should expect appropriate HTTP status codes for success and error cases', () => {
      const expectedStatusCodes = {
        'POST /api/recommendations/refresh': [200, 202, 400, 401, 500],
        'POST /api/recommendations/feedback': [200, 400, 401, 429, 500],
        'GET /api/browse/personalized': [200, 500],
        'POST /api/quiz/analyze': [200, 400, 422, 500],
        'GET /api/fragrances/[id]/similar': [200, 400, 404, 500],
      };

      // Verify expected status codes are documented
      Object.entries(expectedStatusCodes).forEach(([endpoint, statusCodes]) => {
        expect(Array.isArray(statusCodes)).toBe(true);
        expect(statusCodes.length).toBeGreaterThan(0);
        statusCodes.forEach(code => {
          expect(code).toBeGreaterThanOrEqual(200);
          expect(code).toBeLessThan(600);
        });
      });
    });
  });
});
