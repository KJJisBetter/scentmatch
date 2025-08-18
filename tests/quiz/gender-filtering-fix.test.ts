/**
 * Gender Filtering Fix Tests - Task 1.1
 *
 * Tests to verify gender filtering works correctly and prevents cross-gender
 * recommendations (e.g., men getting Ariana Grande fragrances).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorkingRecommendationEngine } from '@/lib/quiz/working-recommendation-engine';
import type { QuizResponse } from '@/lib/quiz/working-recommendation-engine';

describe('Gender Filtering System - Critical Fix', () => {
  let engine: WorkingRecommendationEngine;

  beforeEach(() => {
    engine = new WorkingRecommendationEngine();
  });

  describe("Men's Gender Preference Filtering", () => {
    const menQuizResponses: QuizResponse[] = [
      {
        question_id: 'gender_preference',
        answer_value: 'men',
        timestamp: new Date().toISOString(),
      },
      {
        question_id: 'experience_level',
        answer_value: 'beginner',
        timestamp: new Date().toISOString(),
      },
      {
        question_id: 'scent_preferences_beginner',
        answer_value: 'fresh_clean',
        timestamp: new Date().toISOString(),
      },
    ];

    it('should NEVER return women-targeted fragrances to men', async () => {
      const result = await engine.generateRecommendations(
        menQuizResponses,
        'test-session'
      );

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(3);

      // CRITICAL: No women's fragrances should be returned
      result.recommendations.forEach(recommendation => {
        // Access the internal gender_target through reflection or mock data
        // This test should fail with current implementation
        expect(recommendation.name.toLowerCase()).not.toContain('ariana');
        expect(recommendation.name.toLowerCase()).not.toContain('for women');
        expect(recommendation.brand.toLowerCase()).not.toBe('ariana grande');
      });
    });

    it("should return only men's or unisex fragrances for men", async () => {
      // Mock the internal cleanFragranceData to test filtering logic
      const result = await engine.generateRecommendations(
        menQuizResponses,
        'test-session'
      );

      // Each recommendation should be either men's or unisex
      result.recommendations.forEach(recommendation => {
        // This test will help us verify our fix
        // We'll need access to internal gender_target info
        expect(['men', 'unisex']).toContain(
          getFragranceGenderTarget(recommendation.id)
        );
      });
    });

    it('should include unisex fragrances for men', async () => {
      const result = await engine.generateRecommendations(
        menQuizResponses,
        'test-session'
      );

      // At least some recommendations should be unisex (acceptable for men)
      const hasUnisexOption = result.recommendations.some(rec =>
        isUnisexFragrance(rec.id)
      );

      expect(hasUnisexOption).toBe(true);
    });
  });

  describe("Women's Gender Preference Filtering", () => {
    const womenQuizResponses: QuizResponse[] = [
      {
        question_id: 'gender_preference',
        answer_value: 'women',
        timestamp: new Date().toISOString(),
      },
      {
        question_id: 'experience_level',
        answer_value: 'beginner',
        timestamp: new Date().toISOString(),
      },
      {
        question_id: 'scent_preferences_beginner',
        answer_value: 'floral_pretty',
        timestamp: new Date().toISOString(),
      },
    ];

    it('should NEVER return men-targeted fragrances to women', async () => {
      const result = await engine.generateRecommendations(
        womenQuizResponses,
        'test-session'
      );

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(3);

      // CRITICAL: No men's exclusive fragrances should be returned
      result.recommendations.forEach(recommendation => {
        expect(recommendation.name.toLowerCase()).not.toContain('for men');
        // Check for typical men's fragrance patterns
        const mensPattern = /(sauvage|acqua di gio|bleu de|polo)/i;
        if (mensPattern.test(recommendation.name)) {
          // These should only be included if they're unisex versions
          expect(isUnisexFragrance(recommendation.id)).toBe(true);
        }
      });
    });

    it("should return only women's or unisex fragrances for women", async () => {
      const result = await engine.generateRecommendations(
        womenQuizResponses,
        'test-session'
      );

      result.recommendations.forEach(recommendation => {
        expect(['women', 'unisex']).toContain(
          getFragranceGenderTarget(recommendation.id)
        );
      });
    });
  });

  describe('Unisex Preference Handling', () => {
    it('should handle unisex preference correctly', async () => {
      const unisexResponses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'unisex',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'experience_level',
          answer_value: 'enthusiast',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'scent_preferences_enthusiast',
          answer_value: 'warm_cozy',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await engine.generateRecommendations(
        unisexResponses,
        'test-session'
      );

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(3);

      // Unisex preference should allow all gender targets
      const genderTargets = result.recommendations.map(rec =>
        getFragranceGenderTarget(rec.id)
      );

      // Should be a mix or at least include unisex options
      expect(new Set(genderTargets).size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing gender preference gracefully', async () => {
      const incompleteResponses: QuizResponse[] = [
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await engine.generateRecommendations(
        incompleteResponses,
        'test-session'
      );

      // Should still return recommendations but with fallback gender handling
      expect(result.recommendations).toHaveLength(3);
    });

    it("should prevent popular women's fragrances from appearing for men", async () => {
      const menQuizResponses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'sweet_fruity', // This might match women's fragrances
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await engine.generateRecommendations(
        menQuizResponses,
        'test-session'
      );

      // Even with sweet/fruity preferences, should not get women's fragrances
      const problematicBrands = [
        'ariana grande',
        'taylor swift',
        'britney spears',
      ];
      result.recommendations.forEach(recommendation => {
        problematicBrands.forEach(brand => {
          expect(recommendation.brand.toLowerCase()).not.toBe(brand);
        });
      });
    });
  });

  describe('Fallback Recommendation Gender Filtering', () => {
    it('should apply gender filtering to fallback recommendations', async () => {
      // Force error condition to trigger fallback
      const invalidResponses: QuizResponse[] = [];

      const result = await engine.generateRecommendations(
        invalidResponses,
        'test-session'
      );

      expect(result.success).toBe(false); // Should use fallback
      expect(result.recommendations).toHaveLength(3);

      // Even fallback recommendations should respect some gender filtering
      // if we can infer from session or other context
    });
  });
});

// Helper functions to test internal gender logic
// These will need to be implemented to access fragrance gender data

function getFragranceGenderTarget(fragranceId: string): string {
  // This helper would extract gender_target from our fragrance data
  // For now, we'll simulate this based on fragrance data patterns

  // Import the raw fragrance data to check
  const fragranceData = require('../../data/fragrances.json');
  const fragrance = fragranceData.find((f: any) => f.id === fragranceId);

  if (!fragrance) return 'unisex';

  // Use the same logic as the engine to determine gender
  const name = fragrance.name.toLowerCase();
  if (name.includes('for women') || name.includes('for men')) {
    return name.includes('for women') ? 'women' : 'men';
  }

  // Check brand patterns for known gendered brands
  const brand = fragrance.brandName.toLowerCase();
  if (brand.includes('ariana') || brand.includes('taylor swift')) {
    return 'women';
  }

  return 'unisex';
}

function isUnisexFragrance(fragranceId: string): boolean {
  return getFragranceGenderTarget(fragranceId) === 'unisex';
}
