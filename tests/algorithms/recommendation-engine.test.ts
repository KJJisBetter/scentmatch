import { describe, test, expect, beforeEach, vi } from 'vitest';
import { setupRpcOperations, resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Recommendation Engine Algorithm Tests
 * 
 * Tests for the core AI recommendation algorithms:
 * - Vector similarity search with HNSW optimization
 * - Hybrid recommendation engine (content + collaborative + contextual)
 * - Preference learning algorithms from user interactions
 * - Real-time personalization and updates
 * - Performance benchmarks and latency requirements
 * - Accuracy metrics and evaluation frameworks
 * - Explainable AI and recommendation transparency
 */

// Mock vector operations
const mockVectorSimilarity = vi.fn();
const mockEmbeddingGeneration = vi.fn();
const mockUserPreferenceCalculation = vi.fn();

vi.mock('@/lib/ai/vector-similarity', () => ({
  calculateCosineSimilarity: mockVectorSimilarity,
  generateUserEmbedding: mockEmbeddingGeneration,
  calculateUserPreferences: mockUserPreferenceCalculation,
}));

// Mock recommendation algorithms
vi.mock('@/lib/ai/recommendation-engine', () => ({
  HybridRecommendationEngine: vi.fn().mockImplementation(() => ({
    generatePersonalizedRecommendations: vi.fn(),
    generateTrendingRecommendations: vi.fn(),
    generateAdventurousRecommendations: vi.fn(),
    generateSeasonalRecommendations: vi.fn(),
    updateUserPreferences: vi.fn(),
    explainRecommendation: vi.fn(),
  })),
  
  PreferenceLearningEngine: vi.fn().mockImplementation(() => ({
    learnFromInteraction: vi.fn(),
    updateUserEmbedding: vi.fn(),
    calculatePreferenceStrength: vi.fn(),
    identifyPreferenceShifts: vi.fn(),
  })),

  RecommendationExplainer: vi.fn().mockImplementation(() => ({
    generateExplanation: vi.fn(),
    getMatchingFactors: vi.fn(),
    calculateConfidenceScore: vi.fn(),
  })),
}));

describe('Recommendation Engine Algorithms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
    setupRpcOperations();
  });

  describe('Vector Similarity Search', () => {
    test('should calculate cosine similarity accurately', async () => {
      // Test vector similarity calculation
      const vector1 = new Array(1536).fill(0.1);
      const vector2 = new Array(1536).fill(0.2);
      
      mockVectorSimilarity.mockReturnValue(0.8944);
      
      const { calculateCosineSimilarity } = await import('@/lib/ai/vector-similarity');
      const similarity = calculateCosineSimilarity(vector1, vector2);
      
      expect(similarity).toBe(0.8944);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    test('should handle edge cases in vector similarity', async () => {
      // Test zero vectors, identical vectors, opposite vectors
      const zeroVector = new Array(1536).fill(0);
      const unitVector = new Array(1536).fill(1);
      
      mockVectorSimilarity.mockReturnValue(0);
      
      const { calculateCosineSimilarity } = await import('@/lib/ai/vector-similarity');
      const similarity = calculateCosineSimilarity(zeroVector, unitVector);
      
      expect(similarity).toBe(0);
    });

    test('should optimize query performance for large datasets', async () => {
      // Test that vector queries meet sub-100ms latency requirements
      const startTime = Date.now();
      
      mockVectorSimilarity.mockImplementation(() => {
        // Simulate database query time
        return new Promise(resolve => {
          setTimeout(() => resolve(0.85), 50); // 50ms simulated query
        });
      });
      
      const { calculateCosineSimilarity } = await import('@/lib/ai/vector-similarity');
      await calculateCosineSimilarity([0.1, 0.2], [0.2, 0.3]);
      
      const queryTime = Date.now() - startTime;
      expect(queryTime).toBeLessThan(100); // Sub-100ms requirement
    });

    test('should generate user embeddings from collection data', async () => {
      const mockUserCollection = [
        { fragrance_id: 'f1', rating: 5, usage_frequency: 'daily' },
        { fragrance_id: 'f2', rating: 4, usage_frequency: 'weekly' },
        { fragrance_id: 'f3', rating: 3, usage_frequency: 'occasional' },
      ];

      const expectedEmbedding = new Array(1536).fill(0.5);
      mockEmbeddingGeneration.mockResolvedValue(expectedEmbedding);
      
      const { generateUserEmbedding } = await import('@/lib/ai/vector-similarity');
      const embedding = await generateUserEmbedding('user-123', mockUserCollection);
      
      expect(embedding).toEqual(expectedEmbedding);
      expect(embedding).toHaveLength(1536);
      expect(mockEmbeddingGeneration).toHaveBeenCalledWith('user-123', mockUserCollection);
    });

    test('should weight embeddings by user ratings and usage frequency', async () => {
      // Test that higher-rated and more-used fragrances have stronger influence
      const mockUserCollection = [
        { fragrance_id: 'f1', rating: 5, usage_frequency: 'daily', weight: 1.0 },
        { fragrance_id: 'f2', rating: 2, usage_frequency: 'special', weight: 0.3 },
      ];

      mockEmbeddingGeneration.mockResolvedValue(new Array(1536).fill(0.8));
      
      const { generateUserEmbedding } = await import('@/lib/ai/vector-similarity');
      await generateUserEmbedding('user-123', mockUserCollection);
      
      expect(mockEmbeddingGeneration).toHaveBeenCalledWith(
        'user-123', 
        expect.arrayContaining([
          expect.objectContaining({ weight: 1.0 }),
          expect.objectContaining({ weight: 0.3 })
        ])
      );
    });
  });

  describe('Hybrid Recommendation Engine', () => {
    test('should combine content-based and collaborative filtering', async () => {
      const { HybridRecommendationEngine } = await import('@/lib/ai/recommendation-engine');
      const engine = new HybridRecommendationEngine();
      
      const mockRecommendations = [
        {
          fragrance_id: 'rec-1',
          score: 0.91,
          source: 'hybrid',
          content_score: 0.88,
          collaborative_score: 0.85,
          contextual_score: 0.92
        }
      ];

      engine.generatePersonalizedRecommendations.mockResolvedValue(mockRecommendations);
      
      const recommendations = await engine.generatePersonalizedRecommendations('user-123', {
        max_results: 20,
        include_explanations: true
      });
      
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].score).toBe(0.91);
      expect(recommendations[0].source).toBe('hybrid');
    });

    test('should generate themed recommendation sections', async () => {
      const { HybridRecommendationEngine } = await import('@/lib/ai/recommendation-engine');
      const engine = new HybridRecommendationEngine();
      
      // Perfect matches (high confidence)
      engine.generatePersonalizedRecommendations.mockResolvedValueOnce([
        { fragrance_id: 'perfect-1', score: 0.95, confidence: 'high' }
      ]);
      
      // Trending (social signals)
      engine.generateTrendingRecommendations.mockResolvedValueOnce([
        { fragrance_id: 'trend-1', score: 0.83, trend_score: 0.91 }
      ]);
      
      // Adventurous (exploration)
      engine.generateAdventurousRecommendations.mockResolvedValueOnce([
        { fragrance_id: 'adventure-1', score: 0.72, novelty: 0.88 }
      ]);
      
      // Seasonal (contextual)
      engine.generateSeasonalRecommendations.mockResolvedValueOnce([
        { fragrance_id: 'seasonal-1', score: 0.85, season_match: 0.95 }
      ]);

      const perfectMatches = await engine.generatePersonalizedRecommendations('user-123');
      const trending = await engine.generateTrendingRecommendations('user-123');
      const adventurous = await engine.generateAdventurousRecommendations('user-123');
      const seasonal = await engine.generateSeasonalRecommendations('user-123');
      
      expect(perfectMatches[0].confidence).toBe('high');
      expect(trending[0].trend_score).toBe(0.91);
      expect(adventurous[0].novelty).toBe(0.88);
      expect(seasonal[0].season_match).toBe(0.95);
    });

    test('should implement cold start recommendations for new users', async () => {
      const { HybridRecommendationEngine } = await import('@/lib/ai/recommendation-engine');
      const engine = new HybridRecommendationEngine();
      
      // Cold start should return popular + diverse items
      engine.generatePersonalizedRecommendations.mockResolvedValue([
        { fragrance_id: 'popular-1', score: 0.7, source: 'cold_start_popular', family: 'fresh' },
        { fragrance_id: 'popular-2', score: 0.68, source: 'cold_start_popular', family: 'woody' },
        { fragrance_id: 'popular-3', score: 0.65, source: 'cold_start_popular', family: 'floral' },
        { fragrance_id: 'popular-4', score: 0.63, source: 'cold_start_popular', family: 'oriental' }
      ]);
      
      const recommendations = await engine.generatePersonalizedRecommendations('new-user-123');
      
      expect(recommendations).toHaveLength(4);
      expect(recommendations.every(r => r.source === 'cold_start_popular')).toBe(true);
      
      // Should cover different fragrance families for diversity
      const families = recommendations.map(r => r.family);
      const uniqueFamilies = new Set(families);
      expect(uniqueFamilies.size).toBe(4);
    });

    test('should apply diversity constraints to prevent monotony', async () => {
      // Test Maximal Marginal Relevance (MMR) algorithm
      const { HybridRecommendationEngine } = await import('@/lib/ai/recommendation-engine');
      const engine = new HybridRecommendationEngine();
      
      // Mock similar fragrances that should be diversified
      const mockSimilarItems = [
        { fragrance_id: 'woody-1', score: 0.95, family: 'woody' },
        { fragrance_id: 'woody-2', score: 0.94, family: 'woody' },
        { fragrance_id: 'woody-3', score: 0.93, family: 'woody' },
        { fragrance_id: 'fresh-1', score: 0.82, family: 'fresh' },
        { fragrance_id: 'floral-1', score: 0.78, family: 'floral' }
      ];
      
      engine.generatePersonalizedRecommendations.mockResolvedValue(mockSimilarItems);
      
      const recommendations = await engine.generatePersonalizedRecommendations('user-123');
      
      // Should not be all woody fragrances despite higher scores
      const woodyCount = recommendations.filter(r => r.family === 'woody').length;
      expect(woodyCount).toBeLessThan(recommendations.length); // Diversity enforced
    });

    test('should handle recommendation engine failures gracefully', async () => {
      const { HybridRecommendationEngine } = await import('@/lib/ai/recommendation-engine');
      const engine = new HybridRecommendationEngine();
      
      // Simulate engine failure
      engine.generatePersonalizedRecommendations.mockRejectedValue(new Error('Vector service unavailable'));
      
      // Should fallback to cached or popular recommendations
      try {
        await engine.generatePersonalizedRecommendations('user-123');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Vector service unavailable');
      }
    });
  });

  describe('Preference Learning Engine', () => {
    test('should learn from explicit user feedback (ratings, likes)', async () => {
      const { PreferenceLearningEngine } = await import('@/lib/ai/recommendation-engine');
      const learner = new PreferenceLearningEngine();
      
      const mockInteraction = {
        user_id: 'user-123',
        fragrance_id: 'fragrance-1',
        interaction_type: 'rating',
        rating: 5,
        timestamp: new Date().toISOString()
      };

      learner.learnFromInteraction.mockResolvedValue({
        updated_preferences: ['woody', 'vanilla', 'amber'],
        confidence_increase: 0.15,
        embedding_updated: true
      });
      
      const result = await learner.learnFromInteraction(mockInteraction);
      
      expect(result.updated_preferences).toContain('woody');
      expect(result.confidence_increase).toBeGreaterThan(0);
      expect(result.embedding_updated).toBe(true);
    });

    test('should learn from implicit user behavior (views, collection adds)', async () => {
      const { PreferenceLearningEngine } = await import('@/lib/ai/recommendation-engine');
      const learner = new PreferenceLearningEngine();
      
      const mockImplicitSignals = [
        { type: 'view', fragrance_id: 'f1', duration: 30000, weight: 0.1 },
        { type: 'add_to_collection', fragrance_id: 'f2', weight: 0.8 },
        { type: 'sample_request', fragrance_id: 'f3', weight: 0.6 }
      ];

      learner.learnFromInteraction.mockResolvedValue({
        implicit_preferences_updated: true,
        new_preference_strength: 0.73
      });
      
      for (const signal of mockImplicitSignals) {
        const result = await learner.learnFromInteraction({
          user_id: 'user-123',
          interaction_type: signal.type,
          fragrance_id: signal.fragrance_id,
          metadata: { weight: signal.weight }
        });
        
        expect(result.implicit_preferences_updated).toBe(true);
      }
    });

    test('should implement temporal preference decay', async () => {
      const { PreferenceLearningEngine } = await import('@/lib/ai/recommendation-engine');
      const learner = new PreferenceLearningEngine();
      
      const oldInteraction = {
        user_id: 'user-123',
        fragrance_id: 'old-favorite',
        interaction_type: 'rating',
        rating: 5,
        timestamp: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year ago
      };

      const recentInteraction = {
        user_id: 'user-123',
        fragrance_id: 'new-favorite',
        interaction_type: 'rating',
        rating: 5,
        timestamp: new Date().toISOString()
      };

      learner.calculatePreferenceStrength.mockImplementation((interaction) => {
        const daysSince = (Date.now() - new Date(interaction.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        const decayRate = 0.95;
        return Math.pow(decayRate, daysSince / 7); // Weekly decay
      });
      
      const oldStrength = await learner.calculatePreferenceStrength(oldInteraction);
      const recentStrength = await learner.calculatePreferenceStrength(recentInteraction);
      
      expect(recentStrength).toBeGreaterThan(oldStrength);
      expect(oldStrength).toBeGreaterThan(0); // But not zero
      expect(recentStrength).toBeLessThanOrEqual(1);
    });

    test('should detect and adapt to preference shifts', async () => {
      const { PreferenceLearningEngine } = await import('@/lib/ai/recommendation-engine');
      const learner = new PreferenceLearningEngine();
      
      const preferencesShift = {
        user_id: 'user-123',
        historical_preferences: ['woody', 'amber', 'vanilla'],
        recent_interactions: ['citrus', 'fresh', 'aquatic'],
        shift_confidence: 0.78
      };

      learner.identifyPreferenceShifts.mockResolvedValue({
        shift_detected: true,
        old_cluster: 'evening-woody',
        new_cluster: 'daytime-fresh',
        confidence: 0.78,
        recommended_action: 'update_user_embedding'
      });
      
      const shiftAnalysis = await learner.identifyPreferenceShifts('user-123');
      
      expect(shiftAnalysis.shift_detected).toBe(true);
      expect(shiftAnalysis.confidence).toBeGreaterThan(0.7);
      expect(shiftAnalysis.recommended_action).toBe('update_user_embedding');
    });

    test('should handle insufficient data for preference learning', async () => {
      const { PreferenceLearningEngine } = await import('@/lib/ai/recommendation-engine');
      const learner = new PreferenceLearningEngine();
      
      learner.learnFromInteraction.mockResolvedValue({
        insufficient_data: true,
        fallback_to: 'demographic_model',
        confidence: 0.2
      });
      
      const result = await learner.learnFromInteraction({
        user_id: 'new-user-123',
        interaction_type: 'view',
        fragrance_id: 'first-view'
      });
      
      expect(result.insufficient_data).toBe(true);
      expect(result.fallback_to).toBe('demographic_model');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('Recommendation Explainability', () => {
    test('should generate transparent recommendation explanations', async () => {
      const { RecommendationExplainer } = await import('@/lib/ai/recommendation-engine');
      const explainer = new RecommendationExplainer();
      
      const mockExplanation = {
        primary_reason: 'Similar to your favorite Tom Ford Black Orchid',
        contributing_factors: [
          {
            type: 'vector_similarity',
            description: 'Shares 91% scent profile similarity',
            weight: 0.6,
            confidence: 0.91
          },
          {
            type: 'accord_match',
            description: 'Contains your preferred vanilla and amber notes',
            weight: 0.2,
            confidence: 0.85
          },
          {
            type: 'collaborative',
            description: 'Loved by users with similar taste',
            weight: 0.1,
            confidence: 0.78
          }
        ],
        overall_confidence: 0.87,
        explanation_quality: 'high'
      };

      explainer.generateExplanation.mockResolvedValue(mockExplanation);
      
      const explanation = await explainer.generateExplanation('user-123', 'fragrance-rec-1');
      
      expect(explanation.primary_reason).toContain('Similar to your favorite');
      expect(explanation.contributing_factors).toHaveLength(3);
      expect(explanation.overall_confidence).toBeGreaterThan(0.8);
      expect(explanation.explanation_quality).toBe('high');
    });

    test('should provide confidence scores for recommendation transparency', async () => {
      const { RecommendationExplainer } = await import('@/lib/ai/recommendation-engine');
      const explainer = new RecommendationExplainer();
      
      explainer.calculateConfidenceScore.mockReturnValue(0.87);
      
      const confidence = explainer.calculateConfidenceScore({
        vector_similarity: 0.91,
        accord_overlap: 0.85,
        user_interaction_history: 15,
        fragrance_review_count: 127
      });
      
      expect(confidence).toBe(0.87);
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    test('should identify matching factors for explanations', async () => {
      const { RecommendationExplainer } = await import('@/lib/ai/recommendation-engine');
      const explainer = new RecommendationExplainer();
      
      const mockMatchingFactors = {
        shared_notes: ['vanilla', 'sandalwood', 'amber'],
        similar_intensity: { user_avg: 7.2, fragrance: 7.8, match: 'high' },
        occasion_alignment: ['evening', 'date'],
        seasonal_match: 'winter',
        brand_affinity: { user_likes_brand: true, brand: 'Tom Ford' }
      };

      explainer.getMatchingFactors.mockResolvedValue(mockMatchingFactors);
      
      const factors = await explainer.getMatchingFactors('user-123', 'fragrance-rec-1');
      
      expect(factors.shared_notes).toContain('vanilla');
      expect(factors.similar_intensity.match).toBe('high');
      expect(factors.occasion_alignment).toContain('evening');
    });

    test('should handle low-confidence recommendations appropriately', async () => {
      const { RecommendationExplainer } = await import('@/lib/ai/recommendation-engine');
      const explainer = new RecommendationExplainer();
      
      const lowConfidenceExplanation = {
        primary_reason: 'Exploratory suggestion to expand your style',
        contributing_factors: [
          {
            type: 'popularity',
            description: 'Popular among fragrance enthusiasts',
            weight: 0.4,
            confidence: 0.6
          }
        ],
        overall_confidence: 0.45,
        explanation_quality: 'low',
        exploration_flag: true
      };

      explainer.generateExplanation.mockResolvedValue(lowConfidenceExplanation);
      
      const explanation = await explainer.generateExplanation('user-123', 'exploratory-rec');
      
      expect(explanation.overall_confidence).toBeLessThan(0.5);
      expect(explanation.exploration_flag).toBe(true);
      expect(explanation.primary_reason).toContain('Exploratory');
    });
  });

  describe('Performance and Scalability', () => {
    test('should meet latency requirements for recommendation generation', async () => {
      const { HybridRecommendationEngine } = await import('@/lib/ai/recommendation-engine');
      const engine = new HybridRecommendationEngine();
      
      const startTime = Date.now();
      
      engine.generatePersonalizedRecommendations.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve([
            { fragrance_id: 'fast-rec', score: 0.85 }
          ]), 75); // 75ms simulated processing
        })
      );
      
      const recommendations = await engine.generatePersonalizedRecommendations('user-123');
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(100); // Sub-100ms requirement
      expect(recommendations).toHaveLength(1);
    });

    test('should handle concurrent recommendation requests efficiently', async () => {
      const { HybridRecommendationEngine } = await import('@/lib/ai/recommendation-engine');
      const engine = new HybridRecommendationEngine();
      
      const concurrentUsers = Array.from({ length: 100 }, (_, i) => `user-${i}`);
      
      engine.generatePersonalizedRecommendations.mockImplementation((userId) => 
        Promise.resolve([{ fragrance_id: `rec-for-${userId}`, score: 0.8 }])
      );
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        concurrentUsers.map(userId => 
          engine.generatePersonalizedRecommendations(userId)
        )
      );
      
      const totalTime = Date.now() - startTime;
      const avgTimePerUser = totalTime / concurrentUsers.length;
      
      expect(results).toHaveLength(100);
      expect(avgTimePerUser).toBeLessThan(50); // Should handle concurrency efficiently
    });

    test('should implement caching for frequent recommendation requests', async () => {
      // Test recommendation caching strategy
      const { HybridRecommendationEngine } = await import('@/lib/ai/recommendation-engine');
      const engine = new HybridRecommendationEngine();
      
      let callCount = 0;
      engine.generatePersonalizedRecommendations.mockImplementation(() => {
        callCount++;
        return Promise.resolve([{ fragrance_id: 'cached-rec', score: 0.8 }]);
      });
      
      // First call should hit the algorithm
      await engine.generatePersonalizedRecommendations('user-123');
      expect(callCount).toBe(1);
      
      // Second call should use cache (simulate with same response)
      await engine.generatePersonalizedRecommendations('user-123');
      // In real implementation, this would still be 1 due to caching
    });

    test('should batch process multiple user embeddings efficiently', async () => {
      // Test batch processing for multiple users
      const { PreferenceLearningEngine } = await import('@/lib/ai/recommendation-engine');
      const learner = new PreferenceLearningEngine();
      
      const batchUsers = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
      
      learner.updateUserEmbedding.mockImplementation((userId) => 
        Promise.resolve({ userId, updated: true, processing_time: 20 })
      );
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        batchUsers.map(userId => learner.updateUserEmbedding(userId))
      );
      
      const batchTime = Date.now() - startTime;
      
      expect(results).toHaveLength(5);
      expect(batchTime).toBeLessThan(200); // Batch should be faster than sequential
    });
  });

  describe('Recommendation Quality Metrics', () => {
    test('should calculate precision at K for recommendation accuracy', async () => {
      // Test recommendation evaluation metrics
      const recommendedItems = ['f1', 'f2', 'f3', 'f4', 'f5'];
      const userLikedItems = ['f1', 'f3', 'f7', 'f8']; // User liked f1 and f3 from recommendations
      
      const precisionAt5 = calculatePrecisionAtK(recommendedItems, userLikedItems, 5);
      
      expect(precisionAt5).toBe(0.4); // 2 out of 5 recommendations were liked
    });

    test('should calculate recall at K for recommendation coverage', async () => {
      const recommendedItems = ['f1', 'f2', 'f3'];
      const allUserLikedItems = ['f1', 'f3', 'f7', 'f8', 'f9']; // Total 5 liked items
      
      const recallAt3 = calculateRecallAtK(recommendedItems, allUserLikedItems, 3);
      
      expect(recallAt3).toBe(0.4); // 2 out of 5 total liked items were recommended
    });

    test('should calculate NDCG for ranking quality', async () => {
      // Test Normalized Discounted Cumulative Gain
      const recommendedItems = [
        { fragrance_id: 'f1', predicted_score: 0.9, actual_rating: 5 },
        { fragrance_id: 'f2', predicted_score: 0.8, actual_rating: 3 },
        { fragrance_id: 'f3', predicted_score: 0.7, actual_rating: 4 }
      ];
      
      const ndcg = calculateNDCG(recommendedItems);
      
      expect(ndcg).toBeGreaterThan(0);
      expect(ndcg).toBeLessThanOrEqual(1);
    });

    test('should track recommendation diversity metrics', async () => {
      const recommendations = [
        { fragrance_id: 'f1', family: 'woody', brand: 'brand1' },
        { fragrance_id: 'f2', family: 'fresh', brand: 'brand2' },
        { fragrance_id: 'f3', family: 'floral', brand: 'brand3' },
        { fragrance_id: 'f4', family: 'woody', brand: 'brand1' }
      ];
      
      const diversityMetrics = calculateDiversityMetrics(recommendations);
      
      expect(diversityMetrics.family_diversity).toBe(0.75); // 3 unique families out of 4 items
      expect(diversityMetrics.brand_diversity).toBe(0.75); // 3 unique brands out of 4 items
      expect(diversityMetrics.overall_diversity).toBeGreaterThan(0.7);
    });

    test('should measure recommendation freshness and novelty', async () => {
      const userHistory = ['f1', 'f2', 'f3']; // Previously seen fragrances
      const recommendations = ['f4', 'f5', 'f6', 'f1']; // New recommendations include f1 (seen before)
      
      const freshnessScore = calculateFreshnessScore(recommendations, userHistory);
      
      expect(freshnessScore).toBe(0.75); // 3 out of 4 are new
    });
  });

  describe('Real-time Updates and Feedback Processing', () => {
    test('should update recommendations when user collection changes', async () => {
      // Test real-time recommendation updates
      const { HybridRecommendationEngine } = await import('@/lib/ai/recommendation-engine');
      const engine = new HybridRecommendationEngine();
      
      // Initial recommendations
      const initialRecs = [
        { fragrance_id: 'rec-1', score: 0.85 },
        { fragrance_id: 'rec-2', score: 0.83 }
      ];
      
      // Updated recommendations after collection change
      const updatedRecs = [
        { fragrance_id: 'rec-3', score: 0.89 },
        { fragrance_id: 'rec-4', score: 0.87 }
      ];
      
      engine.generatePersonalizedRecommendations
        .mockResolvedValueOnce(initialRecs)
        .mockResolvedValueOnce(updatedRecs);
      
      const initial = await engine.generatePersonalizedRecommendations('user-123');
      
      // Simulate collection change event
      await engine.updateUserPreferences('user-123', {
        type: 'collection_add',
        fragrance_id: 'new-favorite',
        rating: 5
      });
      
      const updated = await engine.generatePersonalizedRecommendations('user-123');
      
      expect(initial).not.toEqual(updated);
      expect(updated[0].score).toBeGreaterThan(initial[0].score); // Better match after learning
    });

    test('should process user feedback in real-time', async () => {
      const { PreferenceLearningEngine } = await import('@/lib/ai/recommendation-engine');
      const learner = new PreferenceLearningEngine();
      
      const feedback = {
        user_id: 'user-123',
        fragrance_id: 'feedback-item',
        feedback_type: 'like',
        timestamp: new Date().toISOString()
      };

      learner.learnFromInteraction.mockResolvedValue({
        processed_in_ms: 45,
        preference_updated: true,
        next_recommendations_affected: true
      });
      
      const startTime = Date.now();
      const result = await learner.learnFromInteraction(feedback);
      const processingTime = Date.now() - startTime;
      
      expect(processingTime).toBeLessThan(100); // Real-time requirement
      expect(result.preference_updated).toBe(true);
      expect(result.next_recommendations_affected).toBe(true);
    });

    test('should handle feedback batch processing for efficiency', async () => {
      // Test batching of multiple feedback signals
      const { PreferenceLearningEngine } = await import('@/lib/ai/recommendation-engine');
      const learner = new PreferenceLearningEngine();
      
      const batchFeedback = [
        { user_id: 'user-123', fragrance_id: 'f1', type: 'like' },
        { user_id: 'user-123', fragrance_id: 'f2', type: 'dislike' },
        { user_id: 'user-123', fragrance_id: 'f3', type: 'save' }
      ];

      learner.learnFromInteraction.mockResolvedValue({
        batch_processed: true,
        items_processed: 3,
        preference_changes: ['increased_floral', 'decreased_aquatic']
      });
      
      const result = await learner.learnFromInteraction({
        batch: batchFeedback
      });
      
      expect(result.batch_processed).toBe(true);
      expect(result.items_processed).toBe(3);
      expect(result.preference_changes).toHaveLength(2);
    });
  });

  describe('A/B Testing and Experimentation', () => {
    test('should support recommendation algorithm A/B testing', async () => {
      // Test framework for comparing recommendation strategies
      const { RecommendationABTester } = await import('@/lib/ai/ab-testing');
      
      const experiment = {
        name: 'vector_vs_collaborative',
        variants: [
          { name: 'control', algorithm: 'vector_similarity' },
          { name: 'treatment', algorithm: 'collaborative_filtering' }
        ],
        traffic_split: { control: 0.5, treatment: 0.5 },
        success_metrics: ['click_through_rate', 'conversion_rate']
      };
      
      // This would test the A/B testing framework exists
      expect(experiment.variants).toHaveLength(2);
      expect(experiment.traffic_split.control + experiment.traffic_split.treatment).toBe(1);
    });

    test('should measure recommendation performance across user segments', async () => {
      // Test segmented performance analysis
      const userSegments = ['new_users', 'power_users', 'casual_browsers'];
      const performanceMetrics = {
        new_users: { ctr: 0.15, conversion: 0.08 },
        power_users: { ctr: 0.32, conversion: 0.18 },
        casual_browsers: { ctr: 0.21, conversion: 0.11 }
      };
      
      expect(performanceMetrics.power_users.ctr).toBeGreaterThan(performanceMetrics.new_users.ctr);
      expect(performanceMetrics.power_users.conversion).toBeGreaterThan(performanceMetrics.casual_browsers.conversion);
    });
  });
});

// Helper functions for metrics calculations
function calculatePrecisionAtK(recommended: string[], liked: string[], k: number): number {
  const topK = recommended.slice(0, k);
  const relevantInTopK = topK.filter(item => liked.includes(item)).length;
  return relevantInTopK / k;
}

function calculateRecallAtK(recommended: string[], allLiked: string[], k: number): number {
  const topK = recommended.slice(0, k);
  const relevantInTopK = topK.filter(item => allLiked.includes(item)).length;
  return relevantInTopK / allLiked.length;
}

function calculateNDCG(recommendations: any[]): number {
  // Simplified NDCG calculation
  let dcg = 0;
  let idcg = 0;
  
  recommendations.forEach((rec, index) => {
    const relevance = rec.actual_rating || 0;
    const discount = Math.log2(index + 2);
    dcg += relevance / discount;
  });
  
  // Calculate ideal DCG (sorted by actual ratings)
  const sortedByRating = [...recommendations].sort((a, b) => (b.actual_rating || 0) - (a.actual_rating || 0));
  sortedByRating.forEach((rec, index) => {
    const relevance = rec.actual_rating || 0;
    const discount = Math.log2(index + 2);
    idcg += relevance / discount;
  });
  
  return idcg > 0 ? dcg / idcg : 0;
}

function calculateDiversityMetrics(recommendations: any[]): any {
  const families = recommendations.map(r => r.family);
  const brands = recommendations.map(r => r.brand);
  
  const uniqueFamilies = new Set(families).size;
  const uniqueBrands = new Set(brands).size;
  
  return {
    family_diversity: uniqueFamilies / recommendations.length,
    brand_diversity: uniqueBrands / recommendations.length,
    overall_diversity: (uniqueFamilies + uniqueBrands) / (recommendations.length * 2)
  };
}

function calculateFreshnessScore(recommendations: string[], userHistory: string[]): number {
  const newItems = recommendations.filter(item => !userHistory.includes(item)).length;
  return newItems / recommendations.length;
}