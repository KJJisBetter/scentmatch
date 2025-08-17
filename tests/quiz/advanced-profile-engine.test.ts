/**
 * Advanced Profile Engine Tests - Task 3.1
 * Comprehensive tests for multi-dimensional profile analysis and trait weighting
 * Tests the replacement of MVPPersonalityEngine with AdvancedProfileEngine
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type {
  AdvancedProfileEngine,
  MultiTraitProfile,
  TraitWeights,
  ProfileVector,
  ConfidenceMetrics,
} from '@/lib/quiz/advanced-profile-engine';

// Mock data for comprehensive testing
const MOCK_QUIZ_RESPONSES = [
  {
    question_id: 'q1_lifestyle',
    selected_traits: ['sophisticated', 'confident'],
    trait_weights: [0.6, 0.4],
    response_timestamp: new Date().toISOString(),
  },
  {
    question_id: 'q2_occasions',
    selected_traits: ['elegant', 'professional'],
    trait_weights: [0.5, 0.5],
    response_timestamp: new Date().toISOString(),
  },
  {
    question_id: 'q3_preferences',
    selected_traits: ['classic', 'sophisticated', 'romantic'],
    trait_weights: [0.5, 0.3, 0.2],
    response_timestamp: new Date().toISOString(),
  },
];

const MOCK_SINGLE_TRAIT_RESPONSES = [
  {
    question_id: 'q1_simple',
    selected_traits: ['casual'],
    trait_weights: [1.0],
    response_timestamp: new Date().toISOString(),
  },
  {
    question_id: 'q2_simple',
    selected_traits: ['natural'],
    trait_weights: [1.0],
    response_timestamp: new Date().toISOString(),
  },
];

const MOCK_COMPLEX_RESPONSES = [
  {
    question_id: 'q1_complex',
    selected_traits: ['sophisticated', 'romantic', 'adventurous'],
    trait_weights: [0.5, 0.3, 0.2],
    response_timestamp: new Date().toISOString(),
  },
  {
    question_id: 'q2_complex',
    selected_traits: ['confident', 'elegant'],
    trait_weights: [0.7, 0.3],
    response_timestamp: new Date().toISOString(),
  },
  {
    question_id: 'q3_complex',
    selected_traits: ['modern', 'sophisticated'],
    trait_weights: [0.4, 0.6],
    response_timestamp: new Date().toISOString(),
  },
];

describe('AdvancedProfileEngine - Multi-Dimensional Profile Analysis', () => {
  let engine: AdvancedProfileEngine;
  const sessionToken = 'test-session-advanced-001';

  beforeEach(() => {
    // engine = new AdvancedProfileEngine()
    // Will be implemented in Task 3.2
  });

  describe('PROFILE-ENGINE-001: Multi-Trait Profile Generation', () => {
    it('PROFILE-ENGINE-001a: Should generate multi-trait profiles from quiz responses', async () => {
      // Skip until implementation
      if (!engine) {
        console.warn(
          'AdvancedProfileEngine not yet implemented - test skipped'
        );
        return;
      }

      const profile = await engine.generateMultiTraitProfile(
        MOCK_QUIZ_RESPONSES,
        sessionToken
      );

      // Should return multi-dimensional profile
      expect(profile).toHaveProperty('primary_traits');
      expect(profile).toHaveProperty('secondary_traits');
      expect(profile).toHaveProperty('trait_weights');
      expect(profile).toHaveProperty('confidence_metrics');
      expect(profile).toHaveProperty('profile_vector');

      // Primary traits should be most weighted
      expect(profile.primary_traits).toHaveLength(1);
      expect(profile.primary_traits[0]).toBe('sophisticated'); // Most frequent in responses

      // Should support 2-3 trait combinations
      const totalTraits =
        profile.primary_traits.length + profile.secondary_traits.length;
      expect(totalTraits).toBeGreaterThanOrEqual(2);
      expect(totalTraits).toBeLessThanOrEqual(3);
    });

    it('PROFILE-ENGINE-001b: Should implement weighted trait combination algorithm', async () => {
      if (!engine) return;

      const profile = await engine.generateMultiTraitProfile(
        MOCK_QUIZ_RESPONSES,
        sessionToken
      );

      // Verify trait weighting: primary 50%, secondary 30%, tertiary 20%
      const weights = profile.trait_weights;

      expect(weights.primary).toBeCloseTo(0.5, 1); // Within 0.1 of 50%
      expect(weights.secondary).toBeCloseTo(0.3, 1); // Within 0.1 of 30%

      if (weights.tertiary) {
        expect(weights.tertiary).toBeCloseTo(0.2, 1); // Within 0.1 of 20%
      }

      // Total weights should sum to 1.0
      const totalWeight =
        weights.primary + weights.secondary + (weights.tertiary || 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('PROFILE-ENGINE-001c: Should handle single trait responses gracefully', async () => {
      if (!engine) return;

      const profile = await engine.generateMultiTraitProfile(
        MOCK_SINGLE_TRAIT_RESPONSES,
        sessionToken
      );

      // Should still create valid profile with single trait
      expect(profile.primary_traits).toHaveLength(1);
      expect(profile.trait_weights.primary).toBeCloseTo(1.0, 1);

      // Should have high confidence for clear single trait
      expect(profile.confidence_metrics.overall_confidence).toBeGreaterThan(
        0.7
      );
    });

    it('PROFILE-ENGINE-001d: Should process complex trait combinations', async () => {
      if (!engine) return;

      const profile = await engine.generateMultiTraitProfile(
        MOCK_COMPLEX_RESPONSES,
        sessionToken
      );

      // Should handle overlapping traits (sophisticated appears multiple times)
      expect(profile.primary_traits).toContain('sophisticated');

      // Should aggregate trait strengths across responses
      const sophisticatedWeight = profile.trait_weights.primary;
      expect(sophisticatedWeight).toBeGreaterThan(0.3); // Should be strongly weighted

      // Should generate confidence metrics
      expect(profile.confidence_metrics).toHaveProperty('trait_consistency');
      expect(profile.confidence_metrics).toHaveProperty('response_clarity');
      expect(profile.confidence_metrics).toHaveProperty('overall_confidence');
    });
  });

  describe('PROFILE-ENGINE-002: Structured Vector Generation', () => {
    it('PROFILE-ENGINE-002a: Should generate 256-dimension structured vectors', async () => {
      if (!engine) return;

      const profile = await engine.generateMultiTraitProfile(
        MOCK_QUIZ_RESPONSES,
        sessionToken
      );

      // Should generate exactly 256-dimension vector
      expect(profile.profile_vector).toHaveLength(256);
      expect(profile.profile_vector.every(val => typeof val === 'number')).toBe(
        true
      );

      // Vector should be normalized (for cosine similarity)
      const magnitude = Math.sqrt(
        profile.profile_vector.reduce((sum, val) => sum + val * val, 0)
      );
      expect(magnitude).toBeCloseTo(1.0, 2);
    });

    it('PROFILE-ENGINE-002b: Should be cost-efficient (no external API calls)', async () => {
      if (!engine) return;

      const startTime = Date.now();
      const profile = await engine.generateMultiTraitProfile(
        MOCK_QUIZ_RESPONSES,
        sessionToken
      );
      const duration = Date.now() - startTime;

      // Should complete in <5ms (no API calls requirement)
      expect(duration).toBeLessThan(5);
      expect(profile.generation_method).toBe('structured'); // Not 'embedding'
    });

    it('PROFILE-ENGINE-002c: Should encode traits in specific vector dimensions', async () => {
      if (!engine) return;

      const profile1 = await engine.generateMultiTraitProfile(
        MOCK_QUIZ_RESPONSES,
        sessionToken
      );
      const profile2 = await engine.generateMultiTraitProfile(
        MOCK_SINGLE_TRAIT_RESPONSES,
        sessionToken + '-2'
      );

      // Different trait combinations should have different vectors
      const similarity = cosineSimilarity(
        profile1.profile_vector,
        profile2.profile_vector
      );
      expect(similarity).toBeLessThan(0.9); // Should be meaningfully different

      // Similar traits should be encoded in similar vector regions
      const sophisticatedProfile = await engine.generateMultiTraitProfile(
        [
          {
            question_id: 'test',
            selected_traits: ['sophisticated'],
            trait_weights: [1.0],
            response_timestamp: new Date().toISOString(),
          },
        ],
        sessionToken + '-soph'
      );

      const elegantProfile = await engine.generateMultiTraitProfile(
        [
          {
            question_id: 'test',
            selected_traits: ['elegant'],
            trait_weights: [1.0],
            response_timestamp: new Date().toISOString(),
          },
        ],
        sessionToken + '-elegant'
      );

      const relatedSimilarity = cosineSimilarity(
        sophisticatedProfile.profile_vector,
        elegantProfile.profile_vector
      );
      expect(relatedSimilarity).toBeGreaterThan(0.5); // Related traits should be similar
    });
  });

  describe('PROFILE-ENGINE-003: Confidence Scoring for Complex Traits', () => {
    it('PROFILE-ENGINE-003a: Should calculate trait consistency confidence', async () => {
      if (!engine) return;

      const profile = await engine.generateMultiTraitProfile(
        MOCK_QUIZ_RESPONSES,
        sessionToken
      );

      expect(profile.confidence_metrics.trait_consistency).toBeGreaterThan(0);
      expect(profile.confidence_metrics.trait_consistency).toBeLessThanOrEqual(
        1
      );

      // Consistent responses should have higher trait consistency
      const consistentResponses = [
        {
          question_id: 'q1',
          selected_traits: ['sophisticated'],
          trait_weights: [1.0],
          response_timestamp: new Date().toISOString(),
        },
        {
          question_id: 'q2',
          selected_traits: ['sophisticated'],
          trait_weights: [1.0],
          response_timestamp: new Date().toISOString(),
        },
        {
          question_id: 'q3',
          selected_traits: ['sophisticated'],
          trait_weights: [1.0],
          response_timestamp: new Date().toISOString(),
        },
      ];

      const consistentProfile = await engine.generateMultiTraitProfile(
        consistentResponses,
        sessionToken + '-consistent'
      );
      expect(
        consistentProfile.confidence_metrics.trait_consistency
      ).toBeGreaterThan(0.8);
    });

    it('PROFILE-ENGINE-003b: Should calculate response clarity confidence', async () => {
      if (!engine) return;

      // Clear single trait selections should have high clarity
      const clearProfile = await engine.generateMultiTraitProfile(
        MOCK_SINGLE_TRAIT_RESPONSES,
        sessionToken
      );
      expect(clearProfile.confidence_metrics.response_clarity).toBeGreaterThan(
        0.7
      );

      // Complex multi-trait selections should have lower clarity
      const complexProfile = await engine.generateMultiTraitProfile(
        MOCK_COMPLEX_RESPONSES,
        sessionToken + '-complex'
      );
      expect(complexProfile.confidence_metrics.response_clarity).toBeLessThan(
        clearProfile.confidence_metrics.response_clarity
      );
    });

    it('PROFILE-ENGINE-003c: Should calculate overall confidence from multiple factors', async () => {
      if (!engine) return;

      const profile = await engine.generateMultiTraitProfile(
        MOCK_QUIZ_RESPONSES,
        sessionToken
      );

      // Overall confidence should be weighted combination of factors
      const { trait_consistency, response_clarity, overall_confidence } =
        profile.confidence_metrics;

      expect(overall_confidence).toBeGreaterThan(0);
      expect(overall_confidence).toBeLessThanOrEqual(1);

      // Should be influenced by both consistency and clarity
      expect(overall_confidence).toBeLessThanOrEqual(
        Math.max(trait_consistency, response_clarity)
      );
      expect(overall_confidence).toBeGreaterThanOrEqual(
        Math.min(trait_consistency, response_clarity) * 0.5
      );
    });

    it('PROFILE-ENGINE-003d: Should provide confidence breakdown by trait', async () => {
      if (!engine) return;

      const profile = await engine.generateMultiTraitProfile(
        MOCK_QUIZ_RESPONSES,
        sessionToken
      );

      expect(profile.confidence_metrics).toHaveProperty('trait_confidences');
      expect(typeof profile.confidence_metrics.trait_confidences).toBe(
        'object'
      );

      // Should have confidence scores for each identified trait
      profile.primary_traits.forEach(trait => {
        expect(
          profile.confidence_metrics.trait_confidences[trait]
        ).toBeGreaterThan(0);
        expect(
          profile.confidence_metrics.trait_confidences[trait]
        ).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('PROFILE-ENGINE-004: Profile Similarity and Cold-Start Support', () => {
    it('PROFILE-ENGINE-004a: Should calculate profile similarity scores', async () => {
      if (!engine) return;

      const profile1 = await engine.generateMultiTraitProfile(
        MOCK_QUIZ_RESPONSES,
        sessionToken + '-1'
      );
      const profile2 = await engine.generateMultiTraitProfile(
        MOCK_QUIZ_RESPONSES,
        sessionToken + '-2'
      ); // Same responses
      const profile3 = await engine.generateMultiTraitProfile(
        MOCK_SINGLE_TRAIT_RESPONSES,
        sessionToken + '-3'
      ); // Different

      const similarity12 = await engine.calculateProfileSimilarity(
        profile1,
        profile2
      );
      const similarity13 = await engine.calculateProfileSimilarity(
        profile1,
        profile3
      );

      // Same responses should have high similarity
      expect(similarity12).toBeGreaterThan(0.9);

      // Different responses should have lower similarity
      expect(similarity13).toBeLessThan(similarity12);

      // All similarities should be in valid range
      expect(similarity12).toBeGreaterThanOrEqual(0);
      expect(similarity12).toBeLessThanOrEqual(1);
      expect(similarity13).toBeGreaterThanOrEqual(0);
      expect(similarity13).toBeLessThanOrEqual(1);
    });

    it('PROFILE-ENGINE-004b: Should find similar existing profiles for cold-start', async () => {
      if (!engine) return;

      const newUserProfile = await engine.generateMultiTraitProfile(
        MOCK_QUIZ_RESPONSES,
        sessionToken
      );

      // This would integrate with database function find_similar_profiles
      const similarProfiles = await engine.findSimilarProfiles(newUserProfile, {
        similarity_threshold: 0.7,
        limit: 5,
      });

      expect(Array.isArray(similarProfiles)).toBe(true);
      expect(similarProfiles.length).toBeLessThanOrEqual(5);

      similarProfiles.forEach(profile => {
        expect(profile).toHaveProperty('user_id');
        expect(profile).toHaveProperty('similarity_score');
        expect(profile.similarity_score).toBeGreaterThanOrEqual(0.7);
        expect(profile.similarity_score).toBeLessThanOrEqual(1);
      });
    });

    it('PROFILE-ENGINE-004c: Should support cold-start recommendations', async () => {
      if (!engine) return;

      const newUserProfile = await engine.generateMultiTraitProfile(
        MOCK_QUIZ_RESPONSES,
        sessionToken
      );

      const coldStartRecs = await engine.generateColdStartRecommendations(
        newUserProfile,
        {
          max_recommendations: 10,
          use_similar_profiles: true,
        }
      );

      expect(Array.isArray(coldStartRecs)).toBe(true);
      expect(coldStartRecs.length).toBeLessThanOrEqual(10);

      coldStartRecs.forEach(rec => {
        expect(rec).toHaveProperty('fragrance_id');
        expect(rec).toHaveProperty('match_score');
        expect(rec).toHaveProperty('reasoning');
        expect(rec.match_score).toBeGreaterThan(0);
        expect(rec.match_score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('PROFILE-ENGINE-005: Performance and Integration', () => {
    it('PROFILE-ENGINE-005a: Should meet performance targets', async () => {
      if (!engine) return;

      // Profile generation should be <5ms
      const startTime = Date.now();
      await engine.generateMultiTraitProfile(MOCK_QUIZ_RESPONSES, sessionToken);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5);
    });

    it('PROFILE-ENGINE-005b: Should integrate with database functions', async () => {
      if (!engine) return;

      const profile = await engine.generateMultiTraitProfile(
        MOCK_QUIZ_RESPONSES,
        sessionToken
      );

      // Should use database function to store profile
      const storedProfile = await engine.storeProfile(profile, 'test-user-id');
      expect(storedProfile.success).toBe(true);

      // Should use database function to get recommendations
      const recommendations = await engine.getProfileRecommendations(profile, {
        limit: 15,
      });
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(15);
    });

    it('PROFILE-ENGINE-005c: Should maintain backward compatibility with MVP engine', async () => {
      if (!engine) return;

      // Should be able to handle MVP-style single personality responses
      const mvpStyleResponses = [
        {
          question_id: 'q1',
          answer_value: 'sophisticated professional evening',
          response_timestamp: new Date().toISOString(),
        },
      ];

      const profile = await engine.generateFromMVPResponses(
        mvpStyleResponses,
        sessionToken
      );

      expect(profile).toHaveProperty('primary_traits');
      expect(profile.primary_traits).toContain('sophisticated');
      expect(profile.confidence_metrics.overall_confidence).toBeGreaterThan(
        0.5
      );
    });

    it('PROFILE-ENGINE-005d: Should exceed MVP accuracy through multi-trait analysis', async () => {
      if (!engine) return;

      // Advanced engine should provide more nuanced recommendations
      const advancedProfile = await engine.generateMultiTraitProfile(
        MOCK_COMPLEX_RESPONSES,
        sessionToken
      );
      const advancedRecs = await engine.getProfileRecommendations(
        advancedProfile,
        { limit: 10 }
      );

      // Should have multiple trait considerations in reasoning
      const multiTraitReasoning = advancedRecs.filter(
        rec =>
          rec.reasoning.includes('sophisticated') &&
          rec.reasoning.includes('romantic')
      );
      expect(multiTraitReasoning.length).toBeGreaterThan(0);

      // Should have higher confidence than simple single-trait matching
      const avgConfidence =
        advancedRecs.reduce((sum, rec) => sum + rec.match_score, 0) /
        advancedRecs.length;
      expect(avgConfidence).toBeGreaterThan(0.75); // Should exceed MVP typical 0.7 average
    });
  });

  describe('PROFILE-ENGINE-006: Error Handling and Edge Cases', () => {
    it('PROFILE-ENGINE-006a: Should handle empty quiz responses', async () => {
      if (!engine) return;

      const emptyProfile = await engine.generateMultiTraitProfile(
        [],
        sessionToken
      );

      expect(emptyProfile).toHaveProperty('primary_traits');
      expect(emptyProfile.primary_traits).toEqual(['classic']); // Default fallback
      expect(emptyProfile.confidence_metrics.overall_confidence).toBeLessThan(
        0.3
      );
    });

    it('PROFILE-ENGINE-006b: Should handle invalid trait combinations', async () => {
      if (!engine) return;

      const invalidResponses = [
        {
          question_id: 'q1',
          selected_traits: ['unknown_trait'],
          trait_weights: [1.0],
          response_timestamp: new Date().toISOString(),
        },
      ];

      const profile = await engine.generateMultiTraitProfile(
        invalidResponses,
        sessionToken
      );

      // Should fallback gracefully
      expect(profile.primary_traits).not.toContain('unknown_trait');
      expect(profile.confidence_metrics.overall_confidence).toBeLessThan(0.5);
    });

    it('PROFILE-ENGINE-006c: Should handle inconsistent trait weights', async () => {
      if (!engine) return;

      const inconsistentResponses = [
        {
          question_id: 'q1',
          selected_traits: ['sophisticated', 'casual'],
          trait_weights: [0.7, 0.8], // Weights don't sum to 1.0
          response_timestamp: new Date().toISOString(),
        },
      ];

      const profile = await engine.generateMultiTraitProfile(
        inconsistentResponses,
        sessionToken
      );

      // Should normalize weights automatically
      const totalWeight =
        profile.trait_weights.primary +
        (profile.trait_weights.secondary || 0) +
        (profile.trait_weights.tertiary || 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });
  });
});

// Helper function for testing
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

// Type definitions for the tests (will be implemented in Task 3.2)
declare module '@/lib/quiz/advanced-profile-engine' {
  export interface TraitWeights {
    primary: number;
    secondary?: number;
    tertiary?: number;
  }

  export interface ConfidenceMetrics {
    trait_consistency: number;
    response_clarity: number;
    overall_confidence: number;
    trait_confidences: Record<string, number>;
  }

  export interface MultiTraitProfile {
    primary_traits: string[];
    secondary_traits: string[];
    trait_weights: TraitWeights;
    confidence_metrics: ConfidenceMetrics;
    profile_vector: number[];
    generation_method: 'structured' | 'embedding';
    session_token: string;
    created_at: string;
  }

  export type ProfileVector = number[];

  export interface QuizResponse {
    question_id: string;
    selected_traits: string[];
    trait_weights: number[];
    response_timestamp: string;
  }

  export interface SimilarProfile {
    user_id: string;
    similarity_score: number;
    successful_purchases?: number;
  }

  export interface Recommendation {
    fragrance_id: string;
    match_score: number;
    reasoning: string;
    personality_boost?: number;
    final_score?: number;
  }

  export class AdvancedProfileEngine {
    generateMultiTraitProfile(
      responses: QuizResponse[],
      sessionToken: string
    ): Promise<MultiTraitProfile>;
    calculateProfileSimilarity(
      profile1: MultiTraitProfile,
      profile2: MultiTraitProfile
    ): Promise<number>;
    findSimilarProfiles(
      profile: MultiTraitProfile,
      options: { similarity_threshold: number; limit: number }
    ): Promise<SimilarProfile[]>;
    generateColdStartRecommendations(
      profile: MultiTraitProfile,
      options: { max_recommendations: number; use_similar_profiles: boolean }
    ): Promise<Recommendation[]>;
    storeProfile(
      profile: MultiTraitProfile,
      userId: string
    ): Promise<{ success: boolean }>;
    getProfileRecommendations(
      profile: MultiTraitProfile,
      options: { limit: number }
    ): Promise<Recommendation[]>;
    generateFromMVPResponses(
      responses: any[],
      sessionToken: string
    ): Promise<MultiTraitProfile>;
  }
}
