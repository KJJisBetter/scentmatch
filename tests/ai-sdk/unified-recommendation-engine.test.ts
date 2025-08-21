/**
 * Unified Recommendation Engine Tests
 *
 * Tests for the new unified recommendation engine that replaces
 * all 4 separate quiz engines with a single configurable system
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  UnifiedRecommendationEngine,
  type UnifiedRecommendationRequest,
} from '../../lib/ai-sdk/unified-recommendation-engine';
import {
  DirectDatabaseEngine,
  DatabaseRecommendationEngine,
} from '../../lib/ai-sdk/compatibility-layer';

// Mock the AI client
vi.mock('../../lib/ai-sdk/client', () => ({
  aiClient: {
    analyzePersonality: vi.fn().mockResolvedValue({
      personality_type: 'sophisticated',
      confidence: 0.87,
      traits: ['elegant', 'complex', 'evening'],
      description: 'You prefer sophisticated, elegant fragrances',
    }),
    generateRecommendations: vi.fn().mockResolvedValue([
      {
        fragrance_id: 'ai-rec-1',
        score: 0.89,
        reasoning: 'Perfect match for sophisticated preferences',
        confidence: 0.87,
      },
    ]),
    explainRecommendation: vi
      .fn()
      .mockResolvedValue(
        'This fragrance matches your sophisticated style perfectly'
      ),
  },
}));

// Mock Supabase
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    mockResolvedValue: vi.fn(),
  })),
};

vi.mock('../../lib/supabase', () => ({
  createServerSupabase: vi.fn(() => mockSupabase),
}));

describe('Unified Recommendation Engine', () => {
  let engine: UnifiedRecommendationEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new UnifiedRecommendationEngine(mockSupabase as any, 'hybrid');
  });

  describe('Database Strategy', () => {
    test('should generate recommendations using database strategy', async () => {
      // Mock database RPC response
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            fragrance_id: 'db-rec-1',
            name: 'Database Recommendation 1',
            brand: 'Test Brand',
            match_percentage: 85,
            ai_insight: 'Great match for your preferences',
            reasoning: 'Based on quiz analysis',
            sample_available: true,
            sample_price_usd: 15,
            scent_family: 'woody',
          },
        ],
        error: null,
      });

      const request: UnifiedRecommendationRequest = {
        strategy: 'database',
        quizResponses: [
          { question_id: 'q1', answer: 'sophisticated' },
          { question_id: 'q2', answer: 'evening' },
        ],
        limit: 5,
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].fragrance_id).toBe('db-rec-1');
      expect(result.recommendations[0].score).toBe(0.85);
      expect(result.recommendation_method).toBe('database_rpc_optimized');
      expect(result.metadata.strategy_used).toBe('database');
    });

    test('should handle database errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request: UnifiedRecommendationRequest = {
        strategy: 'database',
        quizResponses: [{ question_id: 'q1', answer: 'sophisticated' }],
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(false);
      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe('AI Strategy', () => {
    test('should generate recommendations using AI strategy', async () => {
      // Mock fragrances database query
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'ai-frag-1',
              name: 'AI Fragrance 1',
              fragrance_brands: { name: 'AI Brand' },
              scent_family: 'woody',
              sample_available: true,
              sample_price_usd: 15,
            },
          ],
        }),
      });

      const request: UnifiedRecommendationRequest = {
        strategy: 'ai',
        quizResponses: [
          { question_id: 'q1', answer: 'sophisticated' },
          { question_id: 'q2', answer: 'evening' },
        ],
        limit: 5,
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(true);
      expect(result.personality_analysis).toBeTruthy();
      expect(result.personality_analysis?.personality_type).toBe(
        'sophisticated'
      );
      expect(result.recommendation_method).toBe('vercel_ai_sdk');
      expect(result.metadata.strategy_used).toBe('ai');
    });
  });

  describe('Hybrid Strategy (Default)', () => {
    test('should combine database and AI for hybrid recommendations', async () => {
      // Mock database recommendations
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            fragrance_id: 'hybrid-rec-1',
            name: 'Hybrid Recommendation 1',
            brand: 'Test Brand',
            match_percentage: 75,
            ai_insight: 'Good match',
            reasoning: 'Based on preferences',
            sample_available: true,
            sample_price_usd: 15,
            scent_family: 'fresh',
          },
        ],
        error: null,
      });

      const request: UnifiedRecommendationRequest = {
        strategy: 'hybrid',
        quizResponses: [{ question_id: 'q1', answer: 'sophisticated' }],
        limit: 5,
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.personality_analysis).toBeTruthy();
      expect(result.recommendation_method).toBe('hybrid_ai_database');
      expect(result.metadata.strategy_used).toBe('hybrid');
    });
  });

  describe('Session Token Management', () => {
    test('should use provided session token', async () => {
      const customToken = 'custom-session-123';

      const request: UnifiedRecommendationRequest = {
        strategy: 'database',
        quizResponses: [{ question_id: 'q1', answer: 'test' }],
        sessionToken: customToken,
      };

      // Mock empty database response to avoid complexity
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const result = await engine.generateRecommendations(request);

      expect(result.quiz_session_token).toBe(customToken);
    });

    test('should generate session token when not provided', async () => {
      const request: UnifiedRecommendationRequest = {
        strategy: 'database',
        quizResponses: [{ question_id: 'q1', answer: 'test' }],
      };

      // Mock empty database response
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const result = await engine.generateRecommendations(request);

      expect(result.quiz_session_token).toMatch(/^quiz-\d+-[a-z0-9]+$/);
    });
  });

  describe('Error Handling', () => {
    test('should handle AI failures gracefully', async () => {
      // Mock AI client failure
      const aiClient = await import('../../lib/ai-sdk/client');
      vi.mocked(aiClient.aiClient.analyzePersonality).mockRejectedValue(
        new Error('AI service unavailable')
      );

      const request: UnifiedRecommendationRequest = {
        strategy: 'ai',
        quizResponses: [{ question_id: 'q1', answer: 'test' }],
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(false);
      expect(result.recommendations).toHaveLength(0);
      expect(result.recommendation_method).toBe('error_fallback');
    });
  });
});

describe('Compatibility Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DirectDatabaseEngine Compatibility', () => {
    test('should maintain legacy interface for DirectDatabaseEngine', async () => {
      const engine = new DirectDatabaseEngine();

      // Mock the unified engine response
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            fragrance_id: 'legacy-test-1',
            name: 'Legacy Test Fragrance',
            brand: 'Legacy Brand',
            match_percentage: 88,
            ai_insight: 'Perfect match',
            reasoning: 'Great for evening',
            sample_available: true,
            sample_price_usd: 15,
            scent_family: 'oriental',
          },
        ],
        error: null,
      });

      const legacyResponses = [
        { question_id: 'q1', answer_value: 'sophisticated' },
        { question_id: 'q2', answer_value: 'evening' },
      ];

      const result = await engine.generateRecommendations(
        legacyResponses,
        'test-session-123'
      );

      // Verify legacy interface is maintained
      expect(result).toEqual(
        expect.objectContaining({
          recommendations: expect.any(Array),
          quiz_session_token: expect.any(String),
          total_processing_time_ms: expect.any(Number),
          recommendation_method: expect.any(String),
          success: expect.any(Boolean),
        })
      );

      expect(result.recommendations[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          brand: expect.any(String),
          match_percentage: expect.any(Number),
          ai_insight: expect.any(String),
          reasoning: expect.any(String),
          confidence_level: expect.any(String),
          sample_available: expect.any(Boolean),
        })
      );

      expect(result.quiz_session_token).toBe('test-session-123');
      expect(result.success).toBe(true);
    });
  });

  describe('DatabaseRecommendationEngine Compatibility', () => {
    test('should maintain legacy interface for DatabaseRecommendationEngine', async () => {
      const engine = new DatabaseRecommendationEngine();

      // Mock successful response
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            fragrance_id: 'db-legacy-1',
            name: 'Database Legacy Fragrance',
            brand: 'DB Brand',
            match_percentage: 82,
            ai_insight: 'Good database match',
            reasoning: 'Preference-based selection',
            sample_available: true,
            sample_price_usd: 18,
            scent_family: 'fresh',
          },
        ],
        error: null,
      });

      const responses = [{ question_id: 'q1', answer_value: 'natural' }];

      const result = await engine.generateRecommendations(responses, {
        limit: 8,
      });

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].match_percentage).toBe(82);
      expect(result.recommendation_method).toBe('database_rpc_optimized'); // Uses database strategy
    });
  });
});
