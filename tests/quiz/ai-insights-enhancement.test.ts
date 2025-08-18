/**
 * AI Insights Enhancement Tests - Task 3.1
 *
 * Tests to verify AI insights are personalized, unique, and reference specific
 * user preferences and fragrance characteristics instead of generic templates.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorkingRecommendationEngine } from '@/lib/quiz/working-recommendation-engine';
import type { QuizResponse } from '@/lib/quiz/working-recommendation-engine';

describe('AI Insights Enhancement - Personalization', () => {
  let engine: WorkingRecommendationEngine;

  beforeEach(() => {
    engine = new WorkingRecommendationEngine();
  });

  describe('Personalized Insight Generation', () => {
    it('should generate unique insights for different fragrances', async () => {
      const quizResponses: QuizResponse[] = [
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
          answer_value: 'fresh_clean,warm_cozy',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'personality_style',
          answer_value: 'classic_timeless',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'occasions_beginner',
          answer_value: 'everyday',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await engine.generateRecommendations(
        quizResponses,
        'test-session'
      );

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(3);

      // CRITICAL: Each recommendation should have unique insights
      const insights = result.recommendations.map(rec => rec.ai_insight);
      const uniqueInsights = new Set(insights);

      expect(uniqueInsights.size).toBe(3); // All 3 should be different
      expect(insights[0]).not.toBe(insights[1]);
      expect(insights[0]).not.toBe(insights[2]);
      expect(insights[1]).not.toBe(insights[2]);
    });

    it('should reference specific user preferences in insights', async () => {
      const freshAndClassicResponses: QuizResponse[] = [
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
        {
          question_id: 'personality_style',
          answer_value: 'classic_timeless',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'occasions_beginner',
          answer_value: 'everyday',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await engine.generateRecommendations(
        freshAndClassicResponses,
        'test-session'
      );

      // Insights should reference the specific preferences chosen
      result.recommendations.forEach(recommendation => {
        const insight = recommendation.ai_insight.toLowerCase();

        // Should mention fresh/clean preference
        const mentionsFresh =
          insight.includes('fresh') ||
          insight.includes('clean') ||
          insight.includes('citrus');

        // Should mention classic/timeless style
        const mentionsClassic =
          insight.includes('classic') ||
          insight.includes('timeless') ||
          insight.includes('elegant');

        // Should mention everyday occasion
        const mentionsEveryday =
          insight.includes('everyday') ||
          insight.includes('daily') ||
          insight.includes('versatile');

        // At least one of these should be mentioned specifically
        expect(mentionsFresh || mentionsClassic || mentionsEveryday).toBe(true);
      });
    });

    it('should reference actual fragrance characteristics', async () => {
      const result = await engine.generateRecommendations(
        [
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
        ],
        'test-session'
      );

      result.recommendations.forEach(recommendation => {
        const insight = recommendation.ai_insight;

        // Should not be completely generic
        expect(insight).not.toBe('Perfect match for your preferences.');
        expect(insight).not.toBe(
          'Perfect match for your preferences. The fresh notes align perfectly with your taste.'
        );

        // Should reference the actual fragrance name or brand
        const mentionsFragrance =
          insight.toLowerCase().includes(recommendation.name.toLowerCase()) ||
          insight.toLowerCase().includes(recommendation.brand.toLowerCase());

        // Should reference specific scent characteristics or notes
        const mentionsSpecificNotes =
          /\b(citrus|bergamot|lavender|vanilla|woody|spicy|aromatic|aquatic)\b/i.test(
            insight
          );

        // At least one of these should be true for personalized insights
        expect(mentionsFragrance || mentionsSpecificNotes).toBe(true);
      });
    });

    it('should avoid generic template language', async () => {
      const result = await engine.generateRecommendations(
        [
          {
            question_id: 'gender_preference',
            answer_value: 'men',
            timestamp: new Date().toISOString(),
          },
          {
            question_id: 'experience_level',
            answer_value: 'enthusiast',
            timestamp: new Date().toISOString(),
          },
          {
            question_id: 'scent_preferences_enthusiast',
            answer_value: 'warm_cozy,unique_creative',
            timestamp: new Date().toISOString(),
          },
        ],
        'test-session'
      );

      // Define generic phrases that should be avoided
      const genericPhrases = [
        'perfect match for your preferences',
        'align perfectly with your taste',
        'matches your quiz responses beautifully',
        'based on your answers',
      ];

      result.recommendations.forEach(recommendation => {
        const insight = recommendation.ai_insight.toLowerCase();

        // Should not contain overly generic template language
        genericPhrases.forEach(phrase => {
          expect(insight).not.toContain(phrase);
        });

        // Should be substantial (not just one sentence)
        expect(insight.length).toBeGreaterThan(50);

        // Should contain specific details
        expect(insight).toMatch(
          /\b(citrus|woody|floral|spicy|fresh|vanilla|bergamot|sandalwood|rose|jasmine)\b/i
        );
      });
    });
  });

  describe('Context-Aware Insight Generation', () => {
    it('should generate different insights for different personality styles', async () => {
      const baseResponses = [
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

      // Test different personality styles
      const classicResponses = [
        ...baseResponses,
        {
          question_id: 'personality_style',
          answer_value: 'classic_timeless',
          timestamp: new Date().toISOString(),
        },
      ];

      const boldResponses = [
        ...baseResponses,
        {
          question_id: 'personality_style',
          answer_value: 'bold_confident',
          timestamp: new Date().toISOString(),
        },
      ];

      const [classicResult, boldResult] = await Promise.all([
        engine.generateRecommendations(classicResponses, 'test-classic'),
        engine.generateRecommendations(boldResponses, 'test-bold'),
      ]);

      // Compare insights for the same fragrance with different personality styles
      if (classicResult.recommendations[0] && boldResult.recommendations[0]) {
        const classicInsight = classicResult.recommendations[0].ai_insight;
        const boldInsight = boldResult.recommendations[0].ai_insight;

        // Should be different insights reflecting different personalities
        expect(classicInsight).not.toBe(boldInsight);

        // Classic should mention timeless/elegant concepts
        expect(classicInsight.toLowerCase()).toMatch(
          /\b(classic|timeless|elegant|sophisticated|refined)\b/
        );

        // Bold should mention confident/statement concepts
        expect(boldInsight.toLowerCase()).toMatch(
          /\b(bold|confident|statement|memorable|impression)\b/
        );
      }
    });

    it('should handle multiple scent preferences intelligently', async () => {
      const multiplePreferencesResponses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'experience_level',
          answer_value: 'enthusiast',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'scent_preferences_enthusiast',
          answer_value: 'fresh_clean,warm_cozy',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'personality_style',
          answer_value: 'unique_creative',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'occasions_enthusiast',
          answer_value: 'everyday,professional',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await engine.generateRecommendations(
        multiplePreferencesResponses,
        'test-session'
      );

      result.recommendations.forEach(recommendation => {
        const insight = recommendation.ai_insight.toLowerCase();

        // Should reference multiple aspects of the user's preferences
        const referencesMultipleAspects = [
          /\b(fresh|clean|citrus|aquatic)\b/.test(insight),
          /\b(warm|cozy|woody|amber|vanilla)\b/.test(insight),
          /\b(everyday|daily|versatile)\b/.test(insight),
          /\b(professional|office|work)\b/.test(insight),
          /\b(unique|creative|distinctive|unusual)\b/.test(insight),
        ].filter(Boolean).length;

        // Should reference at least 2 different aspects for comprehensive insights
        expect(referencesMultipleAspects).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Quality and Uniqueness Standards', () => {
    it('should generate insights of appropriate length', async () => {
      const result = await engine.generateRecommendations(
        [
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
        ],
        'test-session'
      );

      result.recommendations.forEach(recommendation => {
        const insight = recommendation.ai_insight;

        // Should be substantial but not too long
        expect(insight.length).toBeGreaterThan(40);
        expect(insight.length).toBeLessThan(200);

        // Should not be just one generic sentence
        expect(insight.split('.').length).toBeGreaterThan(1);
      });
    });

    it('should maintain professional tone while being personal', async () => {
      const result = await engine.generateRecommendations(
        [
          {
            question_id: 'gender_preference',
            answer_value: 'women',
            timestamp: new Date().toISOString(),
          },
          {
            question_id: 'experience_level',
            answer_value: 'experienced',
            timestamp: new Date().toISOString(),
          },
          {
            question_id: 'scent_preferences_experienced',
            answer_value: 'floral_complex,oriental_luxury',
            timestamp: new Date().toISOString(),
          },
        ],
        'test-session'
      );

      result.recommendations.forEach(recommendation => {
        const insight = recommendation.ai_insight;

        // Should avoid overly casual language
        expect(insight).not.toMatch(
          /\b(awesome|super|totally|amazing|incredible)\b/i
        );

        // Should use appropriate fragrance terminology
        expect(insight).toMatch(
          /\b(notes|accords|composition|blend|character|profile)\b/i
        );

        // Should be conversational but professional
        expect(insight).toMatch(/\b(you|your)\b/i); // Personal address
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle fragrances with minimal data gracefully', async () => {
      // Test with fragrances that might have limited accord/note data
      const result = await engine.generateRecommendations(
        [
          {
            question_id: 'gender_preference',
            answer_value: 'unisex',
            timestamp: new Date().toISOString(),
          },
          {
            question_id: 'experience_level',
            answer_value: 'beginner',
            timestamp: new Date().toISOString(),
          },
          {
            question_id: 'scent_preferences_beginner',
            answer_value: 'open_anything',
            timestamp: new Date().toISOString(),
          },
        ],
        'test-session'
      );

      result.recommendations.forEach(recommendation => {
        // Should still generate meaningful insights even with limited data
        expect(recommendation.ai_insight).toBeTruthy();
        expect(recommendation.ai_insight.length).toBeGreaterThan(20);

        // Should not be empty or just filler text
        expect(recommendation.ai_insight).not.toBe('');
        expect(recommendation.ai_insight).not.toBe(
          'This fragrance matches your preferences.'
        );
      });
    });

    it('should provide fallback insights when detailed generation fails', async () => {
      // This test ensures we have proper fallback when dynamic generation fails
      const result = await engine.generateRecommendations(
        [
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
        ],
        'test-session'
      );

      // All recommendations should have valid insights
      result.recommendations.forEach(recommendation => {
        expect(recommendation.ai_insight).toBeTruthy();
        expect(typeof recommendation.ai_insight).toBe('string');
        expect(recommendation.ai_insight.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Insight Content Quality', () => {
    it('should explain WHY the fragrance matches the user', async () => {
      const specificResponses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'experience_level',
          answer_value: 'enthusiast',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'scent_preferences_enthusiast',
          answer_value: 'fresh_clean,warm_cozy',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'personality_style',
          answer_value: 'classic_timeless',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'occasions_enthusiast',
          answer_value: 'everyday,professional',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await engine.generateRecommendations(
        specificResponses,
        'test-session'
      );

      result.recommendations.forEach(recommendation => {
        const insight = recommendation.ai_insight.toLowerCase();

        // Should explain the connection between user preferences and fragrance
        const hasExplanation =
          insight.includes('because') ||
          insight.includes('since') ||
          insight.includes('as you') ||
          insight.includes('your preference for') ||
          insight.includes('matches your') ||
          insight.includes('aligns with your');

        expect(hasExplanation).toBe(true);
      });
    });

    it('should avoid repetitive language patterns', async () => {
      const result = await engine.generateRecommendations(
        [
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
            answer_value: 'floral_pretty,sweet_fruity',
            timestamp: new Date().toISOString(),
          },
        ],
        'test-session'
      );

      const insights = result.recommendations.map(rec => rec.ai_insight);

      // Check for repetitive sentence starters
      const starterPatterns = [
        /^perfect match for/i,
        /^the .* notes align/i,
        /^this .* fragrance/i,
      ];

      starterPatterns.forEach(pattern => {
        const matchingCount = insights.filter(insight =>
          pattern.test(insight)
        ).length;
        expect(matchingCount).toBeLessThan(2); // No more than 1 should use the same pattern
      });
    });
  });
});

describe('Reasoning Quality Enhancement', () => {
  let engine: WorkingRecommendationEngine;

  beforeEach(() => {
    engine = new WorkingRecommendationEngine();
  });

  it('should provide detailed reasoning that references quiz answers', async () => {
    const detailedResponses: QuizResponse[] = [
      {
        question_id: 'gender_preference',
        answer_value: 'men',
        timestamp: new Date().toISOString(),
      },
      {
        question_id: 'experience_level',
        answer_value: 'enthusiast',
        timestamp: new Date().toISOString(),
      },
      {
        question_id: 'scent_preferences_enthusiast',
        answer_value: 'fresh_clean,warm_cozy',
        timestamp: new Date().toISOString(),
      },
      {
        question_id: 'personality_style',
        answer_value: 'classic_timeless',
        timestamp: new Date().toISOString(),
      },
      {
        question_id: 'occasions_enthusiast',
        answer_value: 'everyday,professional',
        timestamp: new Date().toISOString(),
      },
    ];

    const result = await engine.generateRecommendations(
      detailedResponses,
      'test-session'
    );

    result.recommendations.forEach(recommendation => {
      const reasoning = recommendation.reasoning.toLowerCase();

      // Reasoning should reference specific quiz answers
      const referencesQuizAnswers =
        reasoning.includes('fresh') ||
        reasoning.includes('clean') ||
        reasoning.includes('warm') ||
        reasoning.includes('cozy') ||
        reasoning.includes('classic') ||
        reasoning.includes('everyday') ||
        reasoning.includes('professional');

      expect(referencesQuizAnswers).toBe(true);

      // Should be more detailed than just one sentence
      expect(reasoning.split('.').length).toBeGreaterThan(1);
    });
  });
});
