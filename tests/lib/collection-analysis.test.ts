/**
 * Collection Analysis Engine Tests
 *
 * Tests for AI-powered collection analysis, preference learning,
 * and intelligent recommendation generation based on user collections
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollectionAnalysisEngine } from '@/lib/ai/collection-analysis-engine';

// Mock the OpenAI client
vi.mock('@/lib/ai/openai-client', () => ({
  analyzeCollectionWithGPT4: vi.fn(),
  generatePreferenceInsights: vi.fn(),
  categorizeFragranceWithAI: vi.fn(),
  identifyCollectionGaps: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase-client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  })),
}));

describe('CollectionAnalysisEngine', () => {
  let analysisEngine: CollectionAnalysisEngine;

  const mockUserCollection = [
    {
      id: 'col-1',
      user_id: 'user-123',
      fragrance_id: 'frag-1',
      status: 'owned',
      rating: 5,
      usage_frequency: 'daily',
      occasions: ['work', 'casual'],
      seasons: ['spring', 'summer'],
      personal_notes: 'Love the citrus opening, perfect for morning',
      fragrance: {
        id: 'frag-1',
        name: 'Aventus',
        brand: 'Creed',
        scent_family: 'woody_fresh',
        notes: ['bergamot', 'blackcurrant', 'apple', 'birch', 'musk'],
        intensity_score: 8,
        longevity_hours: 8,
        recommended_occasions: ['work', 'date'],
        recommended_seasons: ['spring', 'summer', 'fall'],
      },
    },
    {
      id: 'col-2',
      user_id: 'user-123',
      fragrance_id: 'frag-2',
      status: 'owned',
      rating: 4,
      usage_frequency: 'weekly',
      occasions: ['evening', 'date'],
      seasons: ['fall', 'winter'],
      personal_notes: 'Rich and sophisticated, but can be overwhelming',
      fragrance: {
        id: 'frag-2',
        name: 'Black Orchid',
        brand: 'Tom Ford',
        scent_family: 'oriental_woody',
        notes: [
          'truffle',
          'gardenia',
          'black currant',
          'ylang-ylang',
          'patchouli',
        ],
        intensity_score: 9,
        longevity_hours: 10,
        recommended_occasions: ['evening', 'formal'],
        recommended_seasons: ['fall', 'winter'],
      },
    },
    {
      id: 'col-3',
      user_id: 'user-123',
      fragrance_id: 'frag-3',
      status: 'wishlist',
      rating: null,
      usage_frequency: null,
      occasions: [],
      seasons: [],
      personal_notes: 'Want to try this for winter',
      fragrance: {
        id: 'frag-3',
        name: 'Tobacco Vanille',
        brand: 'Tom Ford',
        scent_family: 'oriental_gourmand',
        notes: ['tobacco', 'vanilla', 'cocoa', 'tonka bean', 'dried fruits'],
        intensity_score: 8,
        longevity_hours: 9,
        recommended_occasions: ['evening', 'casual'],
        recommended_seasons: ['fall', 'winter'],
      },
    },
  ];

  beforeEach(() => {
    analysisEngine = new CollectionAnalysisEngine();
    vi.clearAllMocks();
  });

  describe('Collection Analysis', () => {
    it('should analyze user collection and generate comprehensive preference profile', async () => {
      const result = await analysisEngine.analyzeUserCollection('user-123', {
        includeReasons: true,
        includeGapAnalysis: true,
      });

      expect(result).toMatchObject({
        preferenceProfile: {
          scentFamilies: expect.arrayContaining([
            'woody_fresh',
            'oriental_woody',
          ]),
          seasonalPreferences: expect.arrayContaining([
            'spring',
            'summer',
            'fall',
          ]),
          intensityPreference: expect.any(String),
          brandAffinity: expect.arrayContaining(['Creed', 'Tom Ford']),
          notePreferences: expect.objectContaining({
            loved: expect.any(Array),
            liked: expect.any(Array),
            disliked: expect.any(Array),
          }),
        },
        insights: expect.objectContaining({
          dominantNotes: expect.any(Array),
          occasionGaps: expect.any(Array),
          seasonalGaps: expect.any(Array),
          totalFragrances: expect.any(Number),
          collectionValue: expect.any(Number),
        }),
        confidence: expect.any(Number),
        analysisQuality: expect.any(String),
      });
    });

    it('should identify sophisticated preference patterns from collection data', async () => {
      const patterns =
        await analysisEngine.identifyPreferencePatterns('user-123');

      expect(patterns).toMatchObject({
        notePatterns: expect.objectContaining({
          topNotes: expect.any(Array),
          heartNotes: expect.any(Array),
          baseNotes: expect.any(Array),
          avoidedNotes: expect.any(Array),
        }),
        brandLoyalty: expect.objectContaining({
          preferredBrands: expect.any(Array),
          brandDiversity: expect.any(Number),
          luxuryTendency: expect.any(Number),
        }),
        usagePatterns: expect.objectContaining({
          dailyDrivers: expect.any(Array),
          specialOccasions: expect.any(Array),
          seasonalRotation: expect.any(Object),
        }),
        pricePreferences: expect.objectContaining({
          averageSpent: expect.any(Number),
          priceRange: expect.objectContaining({
            min: expect.any(Number),
            max: expect.any(Number),
          }),
          valueOrientation: expect.any(String),
        }),
      });
    });

    it('should handle users with small collections gracefully', async () => {
      const result = await analysisEngine.analyzeUserCollection('user-new', {
        includeReasons: true,
      });

      expect(result).toMatchObject({
        preferenceProfile: expect.any(Object),
        insights: expect.objectContaining({
          insufficientData: true,
          recommendedActions: expect.arrayContaining([
            'take_quiz',
            'add_more_fragrances',
          ]),
        }),
        confidence: expect.any(Number),
        analysisQuality: 'limited_data',
      });
    });
  });

  describe('Gap Analysis', () => {
    it('should identify collection gaps across multiple dimensions', async () => {
      const gaps = await analysisEngine.identifyCollectionGaps('user-123', {
        analysisType: 'comprehensive',
      });

      expect(gaps).toMatchObject({
        scentFamilyGaps: expect.arrayContaining([
          expect.objectContaining({
            family: expect.any(String),
            priority: expect.any(String),
            reasoning: expect.any(String),
            suggestions: expect.any(Array),
          }),
        ]),
        seasonalGaps: expect.any(Array),
        occasionGaps: expect.any(Array),
        intensityGaps: expect.any(Array),
        strategicRecommendations: expect.arrayContaining([
          expect.objectContaining({
            fragranceId: expect.any(String),
            priority: expect.any(String),
            reasoning: expect.any(String),
            fillsGaps: expect.any(Array),
          }),
        ]),
      });
    });

    it('should prioritize gaps based on user preferences and collection balance', async () => {
      const gaps = await analysisEngine.identifyCollectionGaps('user-123', {
        prioritizeBy: 'user_preference',
      });

      // Gaps should be ordered by priority
      expect(gaps.strategicRecommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            priority: expect.stringMatching(/^(high|medium|low)$/),
            confidence: expect.any(Number),
          }),
        ])
      );

      // High priority gaps should come first
      const priorities = gaps.strategicRecommendations.map(r => r.priority);
      const highPriorityIndex = priorities.indexOf('high');
      const lowPriorityIndex = priorities.indexOf('low');

      if (highPriorityIndex !== -1 && lowPriorityIndex !== -1) {
        expect(highPriorityIndex).toBeLessThan(lowPriorityIndex);
      }
    });
  });

  describe('Auto-Categorization', () => {
    it('should automatically categorize fragrances using AI analysis', async () => {
      const categorization = await analysisEngine.categorizeFragrance(
        'frag-1',
        {
          userId: 'user-123',
          includeConfidence: true,
        }
      );

      expect(categorization).toMatchObject({
        scentFamily: expect.any(String),
        occasions: expect.any(Array),
        seasons: expect.any(Array),
        intensity: expect.any(String),
        moodTags: expect.any(Array),
        confidence: expect.any(Number),
        reasoning: expect.any(String),
        aiSuggestion: true,
      });
    });

    it('should respect manual categorization overrides', async () => {
      const manualOverride = {
        scentFamily: 'custom_category',
        occasions: ['special_event'],
        userNotes: 'My personal interpretation',
      };

      const result = await analysisEngine.applyCategorization(
        'frag-1',
        'user-123',
        {
          ...manualOverride,
          overrideAI: true,
        }
      );

      expect(result).toMatchObject({
        applied: manualOverride,
        aiSuggestion: expect.any(Object),
        learnFromOverride: true,
        userPreferenceUpdated: true,
      });
    });

    it('should learn from manual categorization changes', async () => {
      await analysisEngine.learnFromCategorization('user-123', {
        fragranceId: 'frag-1',
        aiSuggestion: { scentFamily: 'woody_fresh', occasions: ['work'] },
        userCorrection: {
          scentFamily: 'fresh_aquatic',
          occasions: ['casual', 'weekend'],
        },
        correctionReason: 'user_override',
      });

      // Verify the learning was applied
      const updatedPreferences =
        await analysisEngine.getUserPreferences('user-123');

      expect(updatedPreferences).toMatchObject({
        categorizationLearning: expect.objectContaining({
          overridePatterns: expect.any(Array),
          preferenceAdjustments: expect.any(Object),
        }),
      });
    });
  });

  describe('Real-time Profile Updates', () => {
    it('should update preference profile when collection changes', async () => {
      const newItem = {
        fragrance_id: 'frag-new',
        status: 'owned',
        rating: 5,
        usage_frequency: 'daily',
        occasions: ['work'],
        seasons: ['spring'],
      };

      const result = await analysisEngine.updateProfileFromCollectionChange(
        'user-123',
        'add',
        newItem
      );

      expect(result).toMatchObject({
        profileUpdated: true,
        changesDetected: expect.objectContaining({
          newPreferences: expect.any(Array),
          strengthenedPreferences: expect.any(Array),
          preferenceShifts: expect.any(Array),
        }),
        newRecommendations: expect.any(Array),
        confidence: expect.any(Number),
      });
    });

    it('should handle fragrance removal from collection', async () => {
      const result = await analysisEngine.updateProfileFromCollectionChange(
        'user-123',
        'remove',
        { fragrance_id: 'frag-1' }
      );

      expect(result).toMatchObject({
        profileUpdated: true,
        changesDetected: expect.objectContaining({
          weakenedPreferences: expect.any(Array),
          newGaps: expect.any(Array),
        }),
        recommendationsRefreshed: true,
      });
    });

    it('should update profile when user ratings change', async () => {
      const result = await analysisEngine.updateProfileFromRatingChange(
        'user-123',
        'frag-1',
        { oldRating: 4, newRating: 5 }
      );

      expect(result).toMatchObject({
        profileUpdated: true,
        preferenceStrengthened: expect.any(Boolean),
        relatedRecommendationsUpdated: expect.any(Number),
      });
    });
  });

  describe('Intelligent Recommendations', () => {
    it('should generate collection-based recommendations with detailed reasoning', async () => {
      const recommendations =
        await analysisEngine.generateCollectionBasedRecommendations(
          'user-123',
          {
            maxResults: 10,
            includeReasoning: true,
            context: 'collection_expansion',
          }
        );

      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fragranceId: expect.any(String),
            score: expect.any(Number),
            reasoning: expect.objectContaining({
              collectionAlignment: expect.any(String),
              gapFilling: expect.any(String),
              preferenceMatch: expect.any(String),
            }),
            tags: expect.any(Array),
            confidence: expect.any(Number),
          }),
        ])
      );
    });

    it('should prioritize collection-based matching over general popularity', async () => {
      const recommendations =
        await analysisEngine.generateCollectionBasedRecommendations(
          'user-123',
          { prioritizeCollection: true }
        );

      // Verify collection-based scoring is weighted heavily
      expect(recommendations[0]).toMatchObject({
        score: expect.any(Number),
        collectionScore: expect.any(Number),
        popularityScore: expect.any(Number),
      });

      // Collection score should be weighted more heavily
      const topRec = recommendations[0];
      expect(
        topRec.collectionScore * 0.7 + topRec.popularityScore * 0.3
      ).toBeCloseTo(topRec.score, 1);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should complete collection analysis within performance targets', async () => {
      const startTime = Date.now();

      await analysisEngine.analyzeUserCollection('user-123', {
        includeReasons: true,
        includeGapAnalysis: true,
      });

      const analysisTime = Date.now() - startTime;
      expect(analysisTime).toBeLessThan(3000); // 3 second target
    });

    it('should handle OpenAI API failures gracefully', async () => {
      // Mock OpenAI failure
      const { analyzeCollectionWithGPT4 } = await import(
        '@/lib/ai/openai-client'
      );
      vi.mocked(analyzeCollectionWithGPT4).mockRejectedValueOnce(
        new Error('OpenAI API timeout')
      );

      const result = await analysisEngine.analyzeUserCollection('user-123');

      expect(result).toMatchObject({
        preferenceProfile: expect.any(Object),
        fallbackUsed: true,
        analysisQuality: 'rule_based_fallback',
        error: 'openai_unavailable',
      });
    });

    it('should provide meaningful insights even with limited data', async () => {
      const result = await analysisEngine.analyzeUserCollection(
        'user-minimal',
        {
          includeReasons: true,
        }
      );

      expect(result).toMatchObject({
        preferenceProfile: expect.any(Object),
        insights: expect.objectContaining({
          insufficientData: true,
          confidence: expect.any(Number),
          suggestedActions: expect.any(Array),
        }),
        analysisQuality: expect.stringMatching(/limited|basic/),
      });
    });
  });

  describe('Integration with Existing Systems', () => {
    it('should integrate with existing recommendation engine', async () => {
      const collectionInsights =
        await analysisEngine.getInsightsForRecommendationEngine('user-123');

      expect(collectionInsights).toMatchObject({
        preferenceWeights: expect.objectContaining({
          scentFamilies: expect.any(Object),
          notes: expect.any(Object),
          occasions: expect.any(Object),
          seasons: expect.any(Object),
        }),
        avoidanceRules: expect.any(Array),
        boostFactors: expect.any(Array),
        confidence: expect.any(Number),
      });
    });

    it('should work with existing quiz personality data', async () => {
      const quizPersonality = {
        personality_type: 'sophisticated',
        dimension_woody: 8,
        dimension_fresh: 3,
        preferred_intensity: 7,
        confidence_score: 0.85,
      };

      const result = await analysisEngine.combineCollectionAndQuizAnalysis(
        'user-123',
        quizPersonality
      );

      expect(result).toMatchObject({
        combinedProfile: expect.objectContaining({
          collectionBased: expect.any(Object),
          quizBased: expect.any(Object),
          weighted: expect.any(Object),
        }),
        alignmentScore: expect.any(Number),
        confidence: expect.any(Number),
        analysisMethod: 'hybrid_collection_quiz',
      });
    });
  });
});
