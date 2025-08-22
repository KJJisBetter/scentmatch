import { describe, test, expect, beforeEach, vi, Mock } from 'vitest';
import { 
  UnifiedRecommendationEngine,
  type UnifiedRecommendationRequest,
  type UnifiedRecommendationResult,
  type RecommendationStrategy
} from '@/lib/ai-sdk/unified-recommendation-engine';

/**
 * Unified Recommendation Engine Test Suite
 * 
 * Comprehensive tests for the consolidated AI recommendation system
 * that replaces 4 separate quiz engines (2,272 lines → ~200 lines).
 * 
 * Test Coverage:
 * - Database strategy recommendations
 * - AI strategy with OpenAI integration
 * - Hybrid strategy combining both
 * - Quiz response processing
 * - User preference learning
 * - Performance optimization
 * - Error handling and fallbacks
 */

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    insert: vi.fn().mockReturnThis(),
  })),
  rpc: vi.fn(),
};

// Mock AI client
vi.mock('@/lib/ai-sdk/client', () => ({
  aiClient: {
    generatePersonalityAnalysis: vi.fn(),
    generateRecommendations: vi.fn(),
  },
}));

const { aiClient } = await import('@/lib/ai-sdk/client');

describe('UnifiedRecommendationEngine Tests', () => {
  let engine: UnifiedRecommendationEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new UnifiedRecommendationEngine(mockSupabaseClient as any, 'hybrid');
  });

  describe('Database Strategy Tests', () => {
    test('should generate recommendations using database-only strategy', async () => {
      const mockFragrances = [
        {
          fragrance_id: 'frag-1',
          name: 'Test Fragrance 1',
          brand: 'Test Brand',
          score: 0.95,
          scent_family: 'Oriental',
          sample_available: true,
          sample_price_usd: 5.99,
        },
        {
          fragrance_id: 'frag-2', 
          name: 'Test Fragrance 2',
          brand: 'Test Brand 2',
          score: 0.87,
          scent_family: 'Fresh',
          sample_available: true,
          sample_price_usd: 4.99,
        }
      ];

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: mockFragrances,
        error: null,
      });

      const request: UnifiedRecommendationRequest = {
        strategy: 'database',
        userPreferences: {
          scent_families: ['Oriental', 'Fresh'],
          gender: 'women',
        },
        limit: 5,
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(2);
      expect(result.metadata.strategy_used).toBe('database');
      expect(result.recommendations[0].fragrance_id).toBe('frag-1');
      expect(result.recommendations[0].score).toBe(0.95);
      expect(result.processing_time_ms).toBeGreaterThan(0);
    });

    test('should handle empty database results gracefully', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const request: UnifiedRecommendationRequest = {
        strategy: 'database',
        userPreferences: { scent_families: ['Rare Family'] },
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(0);
      expect(result.confidence_score).toBeLessThan(0.5);
    });

    test('should handle database errors with fallback', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const request: UnifiedRecommendationRequest = {
        strategy: 'database',
        userPreferences: { scent_families: ['Oriental'] },
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(false);
      expect(result.recommendations).toHaveLength(0);
      expect(result.metadata.strategy_used).toBe('database');
    });
  });

  describe('AI Strategy Tests', () => {
    test('should generate recommendations using AI-only strategy', async () => {
      const mockAIResponse: any = {
        personality_analysis: {
          primary_archetype: 'sophisticated_minimalist',
          confidence: 0.85,
          traits: ['refined', 'understated', 'quality-focused'],
        },
        recommendations: [
          {
            fragrance_id: 'ai-frag-1',
            name: 'AI Recommended Fragrance',
            brand: 'Luxury Brand',
            confidence_score: 0.92,
            explanation: 'Matches your sophisticated minimalist personality',
            scent_family: 'Woody',
          }
        ],
      };

      (aiClient.generatePersonalityAnalysis as Mock).mockResolvedValueOnce(mockAIResponse.personality_analysis);
      (aiClient.generateRecommendations as Mock).mockResolvedValueOnce(mockAIResponse.recommendations);

      const request: UnifiedRecommendationRequest = {
        strategy: 'ai',
        quizResponses: [
          { question_id: 'style', answer: 'sophisticated_minimalist' },
          { question_id: 'occasion', answer: 'professional' },
        ],
        limit: 3,
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(1);
      expect(result.personality_analysis?.primary_archetype).toBe('sophisticated_minimalist');
      expect(result.metadata.strategy_used).toBe('ai');
      expect(result.confidence_score).toBeGreaterThan(0.8);
    });

    test('should handle AI service errors with graceful fallback', async () => {
      (aiClient.generatePersonalityAnalysis as Mock).mockRejectedValueOnce(
        new Error('AI service unavailable')
      );

      const request: UnifiedRecommendationRequest = {
        strategy: 'ai',
        quizResponses: [
          { question_id: 'style', answer: 'sophisticated_minimalist' },
        ],
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(false);
      expect(result.recommendations).toHaveLength(0);
      expect(result.metadata.strategy_used).toBe('ai');
    });
  });

  describe('Hybrid Strategy Tests', () => {
    test('should combine AI and database strategies for optimal results', async () => {
      // Mock AI analysis
      const mockPersonality = {
        primary_archetype: 'romantic_dreamer',
        confidence: 0.78,
        traits: ['floral-loving', 'feminine', 'emotional'],
      };

      (aiClient.generatePersonalityAnalysis as Mock).mockResolvedValueOnce(mockPersonality);

      // Mock database recommendations
      const mockDBFragrances = [
        {
          fragrance_id: 'db-frag-1',
          name: 'Database Fragrance 1',
          brand: 'DB Brand',
          score: 0.89,
          scent_family: 'Floral',
        }
      ];

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: mockDBFragrances,
        error: null,
      });

      // Mock AI recommendations
      const mockAIRecs = [
        {
          fragrance_id: 'ai-frag-1',
          name: 'AI Fragrance 1',
          brand: 'AI Brand',
          confidence_score: 0.91,
          explanation: 'Perfect for romantic dreamers',
        }
      ];

      (aiClient.generateRecommendations as Mock).mockResolvedValueOnce(mockAIRecs);

      const request: UnifiedRecommendationRequest = {
        strategy: 'hybrid',
        quizResponses: [
          { question_id: 'style', answer: 'romantic_dreamer' },
        ],
        userPreferences: {
          scent_families: ['Floral'],
          gender: 'women',
        },
        limit: 5,
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.personality_analysis?.primary_archetype).toBe('romantic_dreamer');
      expect(result.metadata.strategy_used).toBe('hybrid');
      expect(result.confidence_score).toBeGreaterThan(0.8);
      
      // Should include recommendations from both sources
      const sources = result.recommendations.map(r => r.fragrance_id);
      expect(sources).toContain('db-frag-1');
      expect(sources).toContain('ai-frag-1');
    });

    test('should gracefully fallback when one strategy fails', async () => {
      // AI fails
      (aiClient.generatePersonalityAnalysis as Mock).mockRejectedValueOnce(
        new Error('AI unavailable')
      );

      // Database succeeds
      const mockDBFragrances = [
        {
          fragrance_id: 'fallback-frag',
          name: 'Fallback Fragrance',
          brand: 'Reliable Brand',
          score: 0.85,
        }
      ];

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: mockDBFragrances,
        error: null,
      });

      const request: UnifiedRecommendationRequest = {
        strategy: 'hybrid',
        quizResponses: [{ question_id: 'style', answer: 'casual' }],
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].fragrance_id).toBe('fallback-frag');
      expect(result.personality_analysis).toBeUndefined(); // AI failed
    });
  });

  describe('Performance Tests', () => {
    test('should meet performance targets for recommendation generation', async () => {
      const startTime = performance.now();

      // Mock fast database response
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [{ fragrance_id: 'perf-test', score: 0.9 }],
        error: null,
      });

      const request: UnifiedRecommendationRequest = {
        strategy: 'database',
        userPreferences: { scent_families: ['Fresh'] },
        limit: 10,
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(true);
      expect(result.processing_time_ms).toBeLessThan(500); // Should be under 500ms
      
      const actualTime = performance.now() - startTime;
      expect(actualTime).toBeLessThan(1000); // Total time under 1 second
    });

    test('should handle concurrent recommendation requests', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [{ fragrance_id: 'concurrent-test', score: 0.8 }],
        error: null,
      });

      const requests = Array.from({ length: 5 }).map((_, i) => ({
        strategy: 'database' as RecommendationStrategy,
        userPreferences: { scent_families: [`Family${i}`] },
        sessionToken: `session-${i}`,
      }));

      // Run concurrent requests
      const results = await Promise.all(
        requests.map(req => engine.generateRecommendations(req))
      );

      // All should succeed
      expect(results.every(r => r.success)).toBe(true);
      expect(results).toHaveLength(5);
      
      // Each should have unique session context
      const sessionTokens = results.map(r => r.quiz_session_token);
      expect(new Set(sessionTokens).size).toBe(5);
    });
  });

  describe('Legacy Engine Compatibility', () => {
    test('should provide backward compatibility interface', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [
          {
            fragrance_id: 'compat-frag',
            name: 'Compatibility Test',
            brand: 'Legacy Brand',
            score: 0.88,
          }
        ],
        error: null,
      });

      // Test legacy-style call pattern
      const legacyRequest = {
        strategy: 'database' as RecommendationStrategy,
        userPreferences: {
          scent_families: ['Oriental'],
          intensity: 3,
          occasions: ['evening'],
        },
      };

      const result = await engine.generateRecommendations(legacyRequest);

      expect(result.success).toBe(true);
      expect(result.recommendations[0].name).toBe('Compatibility Test');
      expect(result.metadata.algorithm_version).toBeDefined();
    });
  });

  describe('Quiz Response Processing', () => {
    test('should process quiz responses for personality analysis', async () => {
      const mockPersonality = {
        primary_archetype: 'adventurous_explorer',
        confidence: 0.82,
        traits: ['bold', 'experimental', 'confident'],
        secondary_traits: ['social', 'trendy'],
      };

      (aiClient.generatePersonalityAnalysis as Mock).mockResolvedValueOnce(mockPersonality);

      const mockRecommendations = [
        {
          fragrance_id: 'adventure-frag',
          name: 'Bold Adventure',
          brand: 'Experimental House',
          confidence_score: 0.88,
          explanation: 'Perfect for adventurous personalities',
        }
      ];

      (aiClient.generateRecommendations as Mock).mockResolvedValueOnce(mockRecommendations);

      const request: UnifiedRecommendationRequest = {
        strategy: 'ai',
        quizResponses: [
          { question_id: 'style', answer: 'bold_experimental' },
          { question_id: 'social', answer: 'outgoing_social' },
          { question_id: 'risk', answer: 'love_trying_new' },
          { question_id: 'occasions', answer: 'parties_events' },
          { question_id: 'confidence', answer: 'very_confident' },
        ],
        sessionToken: 'quiz-session-123',
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(true);
      expect(result.personality_analysis?.primary_archetype).toBe('adventurous_explorer');
      expect(result.personality_analysis?.confidence).toBe(0.82);
      expect(result.quiz_session_token).toBe('quiz-session-123');
      expect(result.recommendations[0].explanation).toContain('adventurous');
    });

    test('should handle incomplete quiz responses', async () => {
      const request: UnifiedRecommendationRequest = {
        strategy: 'ai',
        quizResponses: [
          { question_id: 'style', answer: 'casual' },
          // Missing required responses
        ],
        limit: 3,
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(false);
      expect(result.recommendations).toHaveLength(0);
      expect(result.confidence_score).toBeLessThan(0.5);
    });
  });

  describe('User Collection Integration', () => {
    test('should use existing collection data for better recommendations', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [
          {
            fragrance_id: 'collection-enhanced',
            name: 'Collection Enhanced Rec',
            brand: 'Smart Brand',
            score: 0.94,
            recommendation_reason: 'Based on your Oriental collection preference',
          }
        ],
        error: null,
      });

      const request: UnifiedRecommendationRequest = {
        strategy: 'database',
        userCollection: [
          { fragrance_id: 'owned-1', collection_type: 'owned', rating: 5 },
          { fragrance_id: 'owned-2', collection_type: 'owned', rating: 4 },
        ],
        userPreferences: { scent_families: ['Oriental'] },
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(true);
      expect(result.recommendations[0].why_recommended).toContain('collection');
      expect(result.confidence_score).toBeGreaterThan(0.8); // Higher confidence with collection data
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle network timeouts gracefully', async () => {
      mockSupabaseClient.rpc.mockImplementationOnce(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const request: UnifiedRecommendationRequest = {
        strategy: 'database',
        userPreferences: { scent_families: ['Fresh'] },
      };

      const result = await engine.generateRecommendations(request);

      expect(result.success).toBe(false);
      expect(result.processing_time_ms).toBeGreaterThan(90);
      expect(result.metadata.strategy_used).toBe('database');
    });

    test('should validate input parameters', async () => {
      const invalidRequest = {
        strategy: 'invalid_strategy' as RecommendationStrategy,
        userPreferences: { scent_families: [] },
      };

      const result = await engine.generateRecommendations(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe('Caching and Optimization', () => {
    test('should use cached results when available', async () => {
      // First call - should hit database
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [{ fragrance_id: 'cached-frag', score: 0.9 }],
        error: null,
      });

      const request: UnifiedRecommendationRequest = {
        strategy: 'database',
        userPreferences: { scent_families: ['Fresh'] },
        sessionToken: 'cache-test-session',
      };

      const firstResult = await engine.generateRecommendations(request);
      const secondResult = await engine.generateRecommendations(request);

      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(true);
      
      // Second call should be faster (cached)
      expect(secondResult.processing_time_ms).toBeLessThanOrEqual(firstResult.processing_time_ms);
    });
  });
});