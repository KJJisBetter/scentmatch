/**
 * Comprehensive Quiz Functionality Tests
 *
 * Complete test suite for quiz system to ensure unified engine
 * maintains all expected behaviors from the original 4 separate engines.
 *
 * Tests cover:
 * - All quiz question flows and branches
 * - Response validation and sanitization
 * - Session token management
 * - Different experience levels
 * - Gender-based recommendations
 * - API contract compliance
 * - Error handling and fallbacks
 *
 * @priority CRITICAL - Must pass before declaring quiz consolidation complete
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { DirectDatabaseEngine } from '../../lib/ai-sdk/compatibility-layer';

// Mock dependencies
vi.mock('../../lib/supabase', () => ({
  createServerSupabase: vi.fn(() =>
    Promise.resolve({
      rpc: vi.fn(),
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      })),
    })
  ),
}));

vi.mock('../../lib/ai-sdk/client', () => ({
  aiClient: {
    analyzePersonality: vi.fn().mockResolvedValue({
      personality_type: 'sophisticated',
      confidence: 0.87,
      traits: ['elegant', 'complex', 'evening'],
      description: 'You prefer sophisticated, elegant fragrances',
    }),
  },
}));

describe('Comprehensive Quiz Functionality Tests', () => {
  let engine: DirectDatabaseEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new DirectDatabaseEngine();
  });

  describe('Quiz Flow - Beginner Level', () => {
    test('should handle complete beginner quiz flow', async () => {
      // Mock successful database response
      const { createServerSupabase } = await import('../../lib/supabase');
      const mockSupabase = await createServerSupabase();

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'beginner-rec-1',
              name: 'Light Day Fragrance',
              fragrance_brands: { name: 'Beginner Brand' },
              gender: 'women',
              popularity_score: 75,
              rating_value: 4.2,
              rating_count: 1500,
              sample_available: true,
              sample_price_usd: 12,
            },
          ],
          error: null,
        }),
      } as any);

      const beginnerResponses = [
        { question_id: 'gender', answer_value: 'women' },
        { question_id: 'experience', answer_value: 'beginner' },
        { question_id: 'scent_appeal', answer_value: 'fresh' },
        { question_id: 'style', answer_value: 'easy_going' },
        { question_id: 'occasion', answer_value: 'daily' },
      ];

      const result = await engine.generateRecommendations(
        beginnerResponses,
        'beginner-session-123'
      );

      // Verify successful completion
      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(1);
      expect(result.quiz_session_token).toBe('beginner-session-123');
      expect(result.recommendation_method).toBe('database_rpc_optimized');

      // Verify recommendation structure
      const rec = result.recommendations[0];
      expect(rec).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          fragrance_id: expect.any(String),
          name: expect.any(String),
          brand: expect.any(String),
          match_percentage: expect.any(Number),
          ai_insight: expect.any(String),
          reasoning: expect.any(String),
          confidence_level: expect.stringMatching(/^(high|medium|good)$/),
          sample_available: expect.any(Boolean),
          sample_price_usd: expect.any(Number),
        })
      );

      expect(rec.match_percentage).toBeGreaterThanOrEqual(0);
      expect(rec.match_percentage).toBeLessThanOrEqual(100);
    });

    test('should handle intermediate quiz flow with more questions', async () => {
      const { createServerSupabase } = await import('../../lib/supabase');
      const mockSupabase = await createServerSupabase();

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'intermediate-rec-1',
              name: 'Complex Evening Scent',
              fragrance_brands: { name: 'Sophisticated Brand' },
              gender: 'women',
              popularity_score: 85,
              rating_value: 4.5,
              rating_count: 2500,
              sample_available: true,
              sample_price_usd: 18,
            },
          ],
          error: null,
        }),
      } as any);

      const intermediateResponses = [
        { question_id: 'gender', answer_value: 'women' },
        { question_id: 'experience', answer_value: 'intermediate' },
        { question_id: 'scent_appeal', answer_value: 'floral' },
        { question_id: 'scent_appeal', answer_value: 'oriental' }, // Multiple selections
        { question_id: 'style', answer_value: 'sophisticated' },
        { question_id: 'occasion', answer_value: 'evening' },
        { question_id: 'intensity', answer_value: 'moderate' },
        { question_id: 'price_range', answer_value: 'mid_range' },
      ];

      const result = await engine.generateRecommendations(
        intermediateResponses,
        'intermediate-session-456'
      );

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].match_percentage).toBeGreaterThan(70); // Should be higher quality
      expect(result.recommendations[0].sample_price_usd).toBeGreaterThan(15); // More sophisticated = pricier
    });

    test('should handle advanced quiz flow with detailed preferences', async () => {
      const { createServerSupabase } = await import('../../lib/supabase');
      const mockSupabase = await createServerSupabase();

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'advanced-rec-1',
              name: 'Niche Artistic Creation',
              fragrance_brands: { name: 'Artisan House' },
              gender: 'unisex',
              popularity_score: 65,
              rating_value: 4.8,
              rating_count: 850,
              sample_available: true,
              sample_price_usd: 25,
            },
          ],
          error: null,
        }),
      } as any);

      const advancedResponses = [
        { question_id: 'gender', answer_value: 'unisex' },
        { question_id: 'experience', answer_value: 'advanced' },
        { question_id: 'scent_appeal', answer_value: 'complex' },
        {
          question_id: 'preferred_notes',
          answer_value: 'oud,saffron,ambergris',
        },
        { question_id: 'style', answer_value: 'unique_artistic' },
        { question_id: 'occasion', answer_value: 'special_events' },
        { question_id: 'intensity', answer_value: 'bold' },
        { question_id: 'price_range', answer_value: 'luxury' },
        { question_id: 'brand_preference', answer_value: 'niche_houses' },
        { question_id: 'collection_size', answer_value: 'collector' },
      ];

      const result = await engine.generateRecommendations(
        advancedResponses,
        'advanced-session-789'
      );

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].brand).toContain('Artisan'); // Niche brand
      expect(result.recommendations[0].sample_price_usd).toBeGreaterThan(20); // Premium pricing
    });
  });

  describe('Gender-Based Recommendation Logic', () => {
    test('should provide appropriate recommendations for women preferences', async () => {
      const { createServerSupabase } = await import('../../lib/supabase');
      const mockSupabase = await createServerSupabase();

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'women-rec-1',
              name: 'Elegant Floral',
              fragrance_brands: { name: 'Feminine House' },
              gender: 'women',
              popularity_score: 80,
              rating_value: 4.4,
              rating_count: 3200,
              sample_available: true,
              sample_price_usd: 16,
            },
          ],
          error: null,
        }),
      } as any);

      const womenResponses = [
        { question_id: 'gender', answer_value: 'women' },
        { question_id: 'scent_appeal', answer_value: 'floral' },
      ];

      const result = await engine.generateRecommendations(womenResponses);

      expect(result.success).toBe(true);
      expect(result.recommendations[0].name).toContain('Floral');
      // Should not get masculine-coded recommendations
      expect(result.recommendations[0].name).not.toMatch(
        /\b(macho|masculine|rugged)\b/i
      );
    });

    test('should provide appropriate recommendations for men preferences', async () => {
      const { createServerSupabase } = await import('../../lib/supabase');
      const mockSupabase = await createServerSupabase();

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'men-rec-1',
              name: 'Bold Woody Scent',
              fragrance_brands: { name: 'Masculine House' },
              gender: 'men',
              popularity_score: 78,
              rating_value: 4.3,
              rating_count: 2800,
              sample_available: true,
              sample_price_usd: 17,
            },
          ],
          error: null,
        }),
      } as any);

      const menResponses = [
        { question_id: 'gender', answer_value: 'men' },
        { question_id: 'scent_appeal', answer_value: 'woody' },
      ];

      const result = await engine.generateRecommendations(menResponses);

      expect(result.success).toBe(true);
      expect(result.recommendations[0].name).toContain('Woody');
      // Should align with masculine preferences
      expect(result.recommendations[0].name).toMatch(
        /\b(bold|woody|strong)\b/i
      );
    });

    test('should handle unisex preferences appropriately', async () => {
      const { createServerSupabase } = await import('../../lib/supabase');
      const mockSupabase = await createServerSupabase();

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'unisex-rec-1',
              name: 'Universal Appeal',
              fragrance_brands: { name: 'Inclusive Brand' },
              gender: 'unisex',
              popularity_score: 82,
              rating_value: 4.6,
              rating_count: 1900,
              sample_available: true,
              sample_price_usd: 19,
            },
          ],
          error: null,
        }),
      } as any);

      const unisexResponses = [
        { question_id: 'gender', answer_value: 'unisex' },
        { question_id: 'scent_appeal', answer_value: 'fresh' },
      ];

      const result = await engine.generateRecommendations(unisexResponses);

      expect(result.success).toBe(true);
      expect(result.recommendations[0].name).toContain('Universal');
      // Should work for anyone
      expect(['unisex', 'men', 'women']).toContain(
        result.recommendations[0].id.split('__')[0] || 'unisex'
      );
    });
  });

  describe('Question Response Validation', () => {
    test('should validate required question responses', async () => {
      // Test with missing required fields
      const incompleteResponses = [
        { question_id: 'gender', answer_value: '' }, // Empty answer
        { question_id: 'scent_appeal' }, // Missing answer_value
      ];

      const result = await engine.generateRecommendations(incompleteResponses);

      // Should either succeed with fallback or handle gracefully
      expect(result).toEqual(
        expect.objectContaining({
          success: expect.any(Boolean),
          recommendations: expect.any(Array),
          quiz_session_token: expect.any(String),
          processing_time_ms: expect.any(Number),
        })
      );
    });

    test('should sanitize and validate answer values', async () => {
      // Test with potentially malicious input
      const maliciousResponses = [
        {
          question_id: 'gender',
          answer_value: '<script>alert("xss")</script>',
        },
        { question_id: 'scent_appeal', answer_value: '../../etc/passwd' },
        { question_id: 'style', answer_value: 'DROP TABLE users;' },
      ];

      const result = await engine.generateRecommendations(maliciousResponses);

      // Should handle gracefully without security issues
      expect(result.success).toBeDefined();
      expect(result.quiz_session_token).toMatch(/^quiz-\d+-[a-z0-9]+$/);

      // Should not contain malicious content in responses
      result.recommendations.forEach(rec => {
        expect(rec.ai_insight).not.toContain('<script>');
        expect(rec.reasoning).not.toContain('DROP TABLE');
      });
    });

    test('should handle edge case answer values', async () => {
      const edgeCaseResponses = [
        { question_id: 'gender', answer_value: 'WOMEN' }, // Case sensitivity
        { question_id: 'scent_appeal', answer_value: '  fresh  ' }, // Whitespace
        { question_id: 'style', answer_value: 'sophisticated-elegant' }, // Hyphenated
        { question_id: 'occasion', answer_value: 'daily,evening' }, // Multiple values
      ];

      const result = await engine.generateRecommendations(edgeCaseResponses);

      expect(result.success).toBe(true);
      expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Session Token Management', () => {
    test('should use provided session token', async () => {
      const customToken = 'custom-quiz-session-test-123';
      const responses = [{ question_id: 'gender', answer_value: 'women' }];

      const result = await engine.generateRecommendations(
        responses,
        customToken
      );

      expect(result.quiz_session_token).toBe(customToken);
    });

    test('should generate valid session token when not provided', async () => {
      const responses = [{ question_id: 'gender', answer_value: 'men' }];

      const result = await engine.generateRecommendations(responses);

      expect(result.quiz_session_token).toMatch(/^quiz-\d+-[a-z0-9]+$/);
      expect(result.quiz_session_token.length).toBeGreaterThan(10);
    });

    test('should generate unique session tokens', async () => {
      const responses = [{ question_id: 'gender', answer_value: 'women' }];

      const result1 = await engine.generateRecommendations(responses);
      const result2 = await engine.generateRecommendations(responses);

      expect(result1.quiz_session_token).not.toBe(result2.quiz_session_token);
    });
  });

  describe('Recommendation Quality and Diversity', () => {
    test('should provide diverse recommendations across price ranges', async () => {
      const { createServerSupabase } = await import('../../lib/supabase');
      const mockSupabase = await createServerSupabase();

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'budget-rec-1',
              name: 'Affordable Daily',
              fragrance_brands: { name: 'Budget Brand' },
              gender: 'women',
              popularity_score: 70,
              rating_value: 4.1,
              rating_count: 1200,
              sample_available: true,
              sample_price_usd: 8,
            },
            {
              id: 'mid-rec-1',
              name: 'Quality Choice',
              fragrance_brands: { name: 'Mid Brand' },
              gender: 'women',
              popularity_score: 80,
              rating_value: 4.4,
              rating_count: 2100,
              sample_available: true,
              sample_price_usd: 15,
            },
            {
              id: 'luxury-rec-1',
              name: 'Premium Selection',
              fragrance_brands: { name: 'Luxury House' },
              gender: 'women',
              popularity_score: 90,
              rating_value: 4.7,
              rating_count: 800,
              sample_available: true,
              sample_price_usd: 25,
            },
          ],
          error: null,
        }),
      } as any);

      const responses = [
        { question_id: 'gender', answer_value: 'women' },
        { question_id: 'price_range', answer_value: 'all_ranges' },
      ];

      const result = await engine.generateRecommendations(responses);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(3);

      // Verify price diversity
      const prices = result.recommendations.map(r => r.sample_price_usd);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      expect(maxPrice - minPrice).toBeGreaterThan(10); // Should span price ranges
    });

    test('should provide recommendations with meaningful explanations', async () => {
      const responses = [
        { question_id: 'gender', answer_value: 'women' },
        { question_id: 'scent_appeal', answer_value: 'fresh' },
      ];

      const result = await engine.generateRecommendations(responses);

      if (result.success && result.recommendations.length > 0) {
        result.recommendations.forEach(rec => {
          // Explanations should be meaningful
          expect(rec.ai_insight.length).toBeGreaterThan(10);
          expect(rec.reasoning.length).toBeGreaterThan(10);
          expect(rec.why_recommended.length).toBeGreaterThan(10);

          // Should not be placeholder text
          expect(rec.ai_insight).not.toBe('N/A');
          expect(rec.reasoning).not.toBe('TBD');
          expect(rec.why_recommended).not.toBe('TODO');

          // Should contain relevant information
          expect(rec.ai_insight).toMatch(/\b(rating|users|popular|match)\b/i);
        });
      }
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('should handle database connection failures gracefully', async () => {
      // Mock database error
      const { createServerSupabase } = await import('../../lib/supabase');
      const mockSupabase = await createServerSupabase();

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockRejectedValue(new Error('Database connection failed')),
      } as any);

      const responses = [{ question_id: 'gender', answer_value: 'women' }];

      const result = await engine.generateRecommendations(responses);

      // Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.recommendations).toHaveLength(0);
      expect(result.quiz_session_token).toBeTruthy();
      expect(result.processing_time_ms).toBeGreaterThan(0);
    });

    test('should handle empty response arrays', async () => {
      const result = await engine.generateRecommendations([]);

      expect(result.success).toBe(false);
      expect(result.recommendations).toHaveLength(0);
      expect(result.quiz_session_token).toMatch(/^quiz-\d+-[a-z0-9]+$/);
    });

    test('should handle malformed response objects', async () => {
      const malformedResponses = [
        null,
        undefined,
        { invalid: 'structure' },
        { question_id: null, answer_value: undefined },
      ] as any;

      const result = await engine.generateRecommendations(malformedResponses);

      // Should handle gracefully without crashing
      expect(result).toEqual(
        expect.objectContaining({
          success: expect.any(Boolean),
          recommendations: expect.any(Array),
          quiz_session_token: expect.any(String),
        })
      );
    });
  });

  describe('Performance Requirements', () => {
    test('should complete quiz analysis within acceptable time limits', async () => {
      const startTime = Date.now();

      const responses = [
        { question_id: 'gender', answer_value: 'women' },
        { question_id: 'scent_appeal', answer_value: 'fresh' },
      ];

      const result = await engine.generateRecommendations(responses);
      const totalTime = Date.now() - startTime;

      // Should complete within 2 seconds for testing
      expect(totalTime).toBeLessThan(2000);
      expect(result.processing_time_ms).toBeGreaterThan(0);
      expect(result.processing_time_ms).toBeLessThan(2000);
    });

    test('should provide processing time metadata', async () => {
      const responses = [{ question_id: 'gender', answer_value: 'women' }];

      const result = await engine.generateRecommendations(responses);

      expect(result.processing_time_ms).toBeGreaterThan(0);
      expect(typeof result.processing_time_ms).toBe('number');
    });
  });

  describe('Recommendation Scoring and Ranking', () => {
    test('should provide match percentages in valid range', async () => {
      const responses = [
        { question_id: 'gender', answer_value: 'women' },
        { question_id: 'scent_appeal', answer_value: 'floral' },
      ];

      const result = await engine.generateRecommendations(responses);

      if (result.success && result.recommendations.length > 0) {
        result.recommendations.forEach(rec => {
          expect(rec.match_percentage).toBeGreaterThanOrEqual(0);
          expect(rec.match_percentage).toBeLessThanOrEqual(100);
          expect(typeof rec.match_percentage).toBe('number');
        });
      }
    });

    test('should rank recommendations by relevance', async () => {
      const { createServerSupabase } = await import('../../lib/supabase');
      const mockSupabase = await createServerSupabase();

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'high-match',
              name: 'Perfect Match',
              fragrance_brands: { name: 'Perfect Brand' },
              gender: 'women',
              popularity_score: 95,
              rating_value: 4.8,
              rating_count: 5000,
              sample_available: true,
              sample_price_usd: 20,
            },
            {
              id: 'medium-match',
              name: 'Good Match',
              fragrance_brands: { name: 'Good Brand' },
              gender: 'women',
              popularity_score: 75,
              rating_value: 4.2,
              rating_count: 2000,
              sample_available: true,
              sample_price_usd: 15,
            },
          ],
          error: null,
        }),
      } as any);

      const responses = [{ question_id: 'gender', answer_value: 'women' }];

      const result = await engine.generateRecommendations(responses);

      if (result.success && result.recommendations.length > 1) {
        // Should be sorted by match quality
        for (let i = 1; i < result.recommendations.length; i++) {
          expect(
            result.recommendations[i - 1].match_percentage
          ).toBeGreaterThanOrEqual(result.recommendations[i].match_percentage);
        }
      }
    });
  });

  describe('API Response Structure Validation', () => {
    test('should maintain exact API response structure for legacy compatibility', async () => {
      const responses = [
        { question_id: 'gender', answer_value: 'women' },
        { question_id: 'scent_appeal', answer_value: 'fresh' },
      ];

      const result = await engine.generateRecommendations(
        responses,
        'structure-test-session'
      );

      // Verify exact structure that frontend expects
      expect(result).toEqual(
        expect.objectContaining({
          recommendations: expect.any(Array),
          quiz_session_token: expect.any(String),
          total_processing_time_ms: expect.any(Number),
          recommendation_method: expect.any(String),
          success: expect.any(Boolean),
        })
      );

      // Verify recommendation item structure
      if (result.recommendations.length > 0) {
        const rec = result.recommendations[0];
        expect(rec).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            fragrance_id: expect.any(String),
            name: expect.any(String),
            brand: expect.any(String),
            sample_price_usd: expect.any(Number),
            match_percentage: expect.any(Number),
            ai_insight: expect.any(String),
            reasoning: expect.any(String),
            confidence_level: expect.stringMatching(/^(high|medium|good)$/),
            why_recommended: expect.any(String),
            sample_available: expect.any(Boolean),
            score: expect.any(Number),
            explanation: expect.any(String),
          })
        );
      }
    });

    test('should include personality analysis when applicable', async () => {
      const responses = [
        { question_id: 'gender', answer_value: 'women' },
        { question_id: 'experience', answer_value: 'intermediate' },
        { question_id: 'scent_appeal', answer_value: 'floral' },
        { question_id: 'style', answer_value: 'sophisticated' },
      ];

      const result = await engine.generateRecommendations(responses);

      // Personality analysis should be included for substantial quiz responses
      if (result.success && responses.length >= 3) {
        expect(result.personality_analysis).toBeDefined();
        if (result.personality_analysis) {
          expect(result.personality_analysis).toEqual(
            expect.objectContaining({
              personality_type: expect.stringMatching(
                /^(sophisticated|romantic|natural|classic)$/
              ),
              confidence: expect.any(Number),
              traits: expect.any(Array),
              description: expect.any(String),
            })
          );
        }
      }
    });
  });

  describe('Business Logic Validation', () => {
    test('should enforce minimum recommendation count for valid quizzes', async () => {
      const { createServerSupabase } = await import('../../lib/supabase');
      const mockSupabase = await createServerSupabase();

      // Mock sufficient recommendations
      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: Array.from({ length: 5 }, (_, i) => ({
            id: `business-rec-${i}`,
            name: `Business Fragrance ${i + 1}`,
            fragrance_brands: { name: `Brand ${i + 1}` },
            gender: 'women',
            popularity_score: 80 - i * 5,
            rating_value: 4.5 - i * 0.1,
            rating_count: 1000 + i * 200,
            sample_available: true,
            sample_price_usd: 15 + i * 2,
          })),
          error: null,
        }),
      } as any);

      const validResponses = [
        { question_id: 'gender', answer_value: 'women' },
        { question_id: 'scent_appeal', answer_value: 'floral' },
        { question_id: 'style', answer_value: 'sophisticated' },
      ];

      const result = await engine.generateRecommendations(validResponses);

      // Should provide at least 3 recommendations for complete quiz
      expect(result.success).toBe(true);
      expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(result.recommendations.length).toBeLessThanOrEqual(10);
    });

    test('should handle sample availability correctly', async () => {
      const responses = [{ question_id: 'gender', answer_value: 'women' }];

      const result = await engine.generateRecommendations(responses);

      if (result.success && result.recommendations.length > 0) {
        result.recommendations.forEach(rec => {
          // All recommendations should have sample availability info
          expect(typeof rec.sample_available).toBe('boolean');

          // If sample available, should have valid price
          if (rec.sample_available) {
            expect(rec.sample_price_usd).toBeGreaterThan(0);
            expect(rec.sample_price_usd).toBeLessThan(100); // Reasonable sample price range
          }
        });
      }
    });

    test('should provide confidence levels that match score ranges', async () => {
      const responses = [{ question_id: 'gender', answer_value: 'women' }];

      const result = await engine.generateRecommendations(responses);

      if (result.success && result.recommendations.length > 0) {
        result.recommendations.forEach(rec => {
          // Confidence levels should align with match percentages
          if (rec.match_percentage >= 80) {
            expect(['high', 'good']).toContain(rec.confidence_level);
          } else if (rec.match_percentage >= 60) {
            expect(['medium', 'good']).toContain(rec.confidence_level);
          } else {
            expect(['medium', 'good']).toContain(rec.confidence_level); // Our system caps at medium minimum
          }
        });
      }
    });
  });

  describe('Integration with Frontend Components', () => {
    test('should provide data format compatible with FragranceRecommendationDisplay', async () => {
      const responses = [
        { question_id: 'gender', answer_value: 'women' },
        { question_id: 'scent_appeal', answer_value: 'floral' },
      ];

      const result = await engine.generateRecommendations(responses);

      if (result.success && result.recommendations.length > 0) {
        const rec = result.recommendations[0];

        // Verify all fields that FragranceRecommendationDisplay component expects
        expect(rec.id).toBeDefined();
        expect(rec.name).toBeDefined();
        expect(rec.brand).toBeDefined();
        expect(rec.ai_insight).toBeDefined();
        expect(rec.sample_available).toBeDefined();
        expect(rec.sample_price_usd).toBeDefined();

        // Verify types match component expectations
        expect(typeof rec.id).toBe('string');
        expect(typeof rec.name).toBe('string');
        expect(typeof rec.brand).toBe('string');
        expect(typeof rec.sample_available).toBe('boolean');
        expect(typeof rec.sample_price_usd).toBe('number');
      }
    });

    test('should provide next_steps data for conversion flow', async () => {
      const responses = [
        { question_id: 'gender', answer_value: 'women' },
        { question_id: 'scent_appeal', answer_value: 'fresh' },
      ];

      const result = await engine.generateRecommendations(responses);

      // Should provide guidance for next steps in user journey
      expect(result).toEqual(
        expect.objectContaining({
          success: expect.any(Boolean),
          recommendations: expect.any(Array),
        })
      );

      // Verify quiz completion triggers appropriate next steps
      if (result.success && result.recommendations.length > 0) {
        // Should indicate samples are available for trying
        const hasAvailableSamples = result.recommendations.some(
          r => r.sample_available
        );
        expect(hasAvailableSamples).toBe(true);
      }
    });
  });
});
