/**
 * Quiz Recommendation Algorithm Variety Tests
 *
 * Tests to verify quiz recommendations produce varied results based on different preferences
 * and are not affected by alphabetical bias.
 *
 * Related to Task 2 of pre-launch critical bug fixes.
 */

import { describe, it, expect, vi } from 'vitest';
import { WorkingRecommendationEngine } from '../../lib/quiz/working-recommendation-engine';

describe('Quiz Recommendation Variety and Bias Prevention', () => {
  let engine: WorkingRecommendationEngine;

  beforeEach(() => {
    engine = new WorkingRecommendationEngine();
  });

  describe('Task 2.1: Different preference combinations produce different results', () => {
    it('should return different fragrances for Fresh vs Warm preferences', async () => {
      // Test Fresh & Clean preferences
      const freshResponses = [
        { questionId: 'scent-preference', selectedOptions: ['fresh-clean'] },
        { questionId: 'personality', selectedOptions: ['natural'] },
        { questionId: 'gender', selectedOptions: ['men'] },
      ];

      // Test Warm & Spicy preferences
      const warmResponses = [
        { questionId: 'scent-preference', selectedOptions: ['warm-spicy'] },
        { questionId: 'personality', selectedOptions: ['sophisticated'] },
        { questionId: 'gender', selectedOptions: ['men'] },
      ];

      const freshRecommendations =
        await engine.generateRecommendations(freshResponses);
      const warmRecommendations =
        await engine.generateRecommendations(warmResponses);

      // Recommendations should be different
      const freshIds = freshRecommendations.map(r => r.id);
      const warmIds = warmRecommendations.map(r => r.id);

      expect(freshIds).not.toEqual(warmIds);

      // Should not have significant overlap (more than 1 shared fragrance indicates bias)
      const sharedCount = freshIds.filter(id => warmIds.includes(id)).length;
      expect(sharedCount).toBeLessThanOrEqual(1);
    });

    it('should return different fragrances for different personality types', async () => {
      const romanticResponses = [
        { questionId: 'scent-preference', selectedOptions: ['floral-sweet'] },
        { questionId: 'personality', selectedOptions: ['romantic'] },
        { questionId: 'gender', selectedOptions: ['women'] },
      ];

      const sophisticatedResponses = [
        { questionId: 'scent-preference', selectedOptions: ['woody-oriental'] },
        { questionId: 'personality', selectedOptions: ['sophisticated'] },
        { questionId: 'gender', selectedOptions: ['women'] },
      ];

      const romanticRecs =
        await engine.generateRecommendations(romanticResponses);
      const sophisticatedRecs = await engine.generateRecommendations(
        sophisticatedResponses
      );

      const romanticIds = romanticRecs.map(r => r.id);
      const sophisticatedIds = sophisticatedRecs.map(r => r.id);

      expect(romanticIds).not.toEqual(sophisticatedIds);

      // Test for different dominant scent families
      const romanticFamilies = romanticRecs.map(r => r.primary_accord);
      const sophisticatedFamilies = sophisticatedRecs.map(
        r => r.primary_accord
      );

      expect(romanticFamilies).not.toEqual(sophisticatedFamilies);
    });
  });

  describe('Task 2.3: Alphabetical bias prevention', () => {
    it('should not always return brands starting with "A" when scores are tied', async () => {
      // Test with responses that might produce tied scores
      const responses = [
        { questionId: 'gender', selectedOptions: ['men'] },
        { questionId: 'scent-preference', selectedOptions: ['fresh-clean'] },
      ];

      // Run recommendations multiple times
      const allRecommendations = [];
      for (let i = 0; i < 10; i++) {
        const recs = await engine.generateRecommendations(responses);
        allRecommendations.push(...recs.map(r => r.brand));
      }

      // Count unique first letters of brands
      const firstLetters = allRecommendations
        .map(brand => brand?.charAt(0)?.toLowerCase())
        .filter(Boolean);
      const uniqueFirstLetters = [...new Set(firstLetters)];

      // Should have more than just "A" as first letters if bias is fixed
      expect(uniqueFirstLetters.length).toBeGreaterThan(2);

      // "A" should not dominate (less than 60% of all results)
      const aCount = firstLetters.filter(letter => letter === 'a').length;
      const aPercentage = aCount / firstLetters.length;
      expect(aPercentage).toBeLessThan(0.6);
    });

    it('should produce varied results across multiple runs with same inputs', async () => {
      const responses = [
        { questionId: 'gender', selectedOptions: ['men'] },
        { questionId: 'scent-preference', selectedOptions: ['woody-oriental'] },
      ];

      // Run same inputs 5 times
      const runs = [];
      for (let i = 0; i < 5; i++) {
        const recs = await engine.generateRecommendations(responses);
        runs.push(recs.map(r => r.id));
      }

      // At least some variation should occur across runs
      const allSame = runs.every(
        run => JSON.stringify(run) === JSON.stringify(runs[0])
      );

      // With randomization, not all runs should be identical
      expect(allSame).toBe(false);
    });
  });

  describe('Task 2.4: Brand diversity in recommendations', () => {
    it('should not return multiple fragrances from the same brand in top 3', async () => {
      const responses = [
        { questionId: 'gender', selectedOptions: ['men'] },
        { questionId: 'scent-preference', selectedOptions: ['fresh-clean'] },
      ];

      const recommendations = await engine.generateRecommendations(responses);
      const brands = recommendations.map(r => r.brand).filter(Boolean);
      const uniqueBrands = [...new Set(brands)];

      // Top 3 should prefer different brands
      expect(uniqueBrands.length).toBeGreaterThanOrEqual(
        Math.min(2, recommendations.length)
      );

      // Should not have 3 fragrances from same brand
      brands.forEach(brand => {
        const count = brands.filter(b => b === brand).length;
        expect(count).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('Task 2.5: Score differentiation verification', () => {
    it('should produce meaningful score differences between recommendations', async () => {
      const responses = [
        { questionId: 'gender', selectedOptions: ['women'] },
        { questionId: 'scent-preference', selectedOptions: ['floral-sweet'] },
        { questionId: 'personality', selectedOptions: ['romantic'] },
      ];

      // Get scored recommendations using internal method
      const scoredResults = await engine['scoreRecommendations'](responses, []);

      if (scoredResults.length >= 2) {
        const scores = scoredResults.map(r => r.match_score);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);

        // Should have some score variation (not all same score)
        expect(maxScore).not.toEqual(minScore);

        // Score range should be meaningful (more than 5 points difference)
        expect(maxScore - minScore).toBeGreaterThan(5);
      }
    });
  });

  describe('Task 2.6: Quiz responses impact verification', () => {
    it('should show clear preference influence on fragrance selection', async () => {
      // Test strong floral preference
      const floralResponses = [
        { questionId: 'scent-preference', selectedOptions: ['floral-sweet'] },
        { questionId: 'gender', selectedOptions: ['women'] },
      ];

      // Test strong woody preference
      const woodyResponses = [
        { questionId: 'scent-preference', selectedOptions: ['woody-oriental'] },
        { questionId: 'gender', selectedOptions: ['women'] },
      ];

      const floralRecs = await engine.generateRecommendations(floralResponses);
      const woodyRecs = await engine.generateRecommendations(woodyResponses);

      // Should have different dominant accords
      const floralAccords = floralRecs
        .map(r => r.primary_accord)
        .filter(Boolean);
      const woodyAccords = woodyRecs.map(r => r.primary_accord).filter(Boolean);

      // At least one floral recommendation should have floral notes
      const hasFloralNotes = floralAccords.some(
        accord =>
          accord.toLowerCase().includes('floral') ||
          accord.toLowerCase().includes('rose') ||
          accord.toLowerCase().includes('jasmine')
      );

      // At least one woody recommendation should have woody notes
      const hasWoodyNotes = woodyAccords.some(
        accord =>
          accord.toLowerCase().includes('woody') ||
          accord.toLowerCase().includes('cedar') ||
          accord.toLowerCase().includes('sandalwood')
      );

      // Preferences should influence note selection
      if (floralRecs.length > 0) expect(hasFloralNotes).toBe(true);
      if (woodyRecs.length > 0) expect(hasWoodyNotes).toBe(true);
    });
  });
});
