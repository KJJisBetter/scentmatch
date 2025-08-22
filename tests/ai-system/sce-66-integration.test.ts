/**
 * SCE-66 Integration Test: Simplify AI Explanations for Beginners
 * 
 * Verifies that the complete system generates appropriate explanations
 * based on user experience level through the WorkingRecommendationEngine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorkingRecommendationEngine } from '@/lib/quiz/working-recommendation-engine';
import type { QuizResponse } from '@/lib/quiz/working-recommendation-engine';

describe('SCE-66: Simplified AI Explanations Integration', () => {
  let engine: WorkingRecommendationEngine;

  beforeEach(() => {
    engine = new WorkingRecommendationEngine();
  });

  describe('Beginner Experience Level (Default)', () => {
    it('should generate simple, visual explanations for beginners', async () => {
      const beginnerResponses: QuizResponse[] = [
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
        beginnerResponses,
        'beginner-test-session'
      );

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(3);

      // Check that explanations are beginner-friendly
      result.recommendations.forEach(recommendation => {
        const insight = recommendation.ai_insight;
        
        // Should be short and digestible
        const wordCount = insight.replace(/[✅👍💡🧪]/g, '').replace(/\n/g, ' ')
          .split(' ').filter(word => word.trim().length > 0).length;
        expect(wordCount).toBeLessThanOrEqual(40);

        // Should include visual elements (emojis or bullet points)
        const hasVisualElements = /[✅👍💡🧪]/.test(insight) || insight.includes('\n');
        expect(hasVisualElements).toBe(true);

        // Should use simple language, not technical jargon
        const technicalJargon = [
          'sophisticated blend',
          'olfactory experience',
          'compositional structure',
          'molecular interactions',
          'sillage characteristics'
        ];
        
        const hasJargon = technicalJargon.some(term => 
          insight.toLowerCase().includes(term.toLowerCase())
        );
        expect(hasJargon).toBe(false);

        // Should mention user preferences in simple terms
        expect(insight.toLowerCase()).toMatch(/fresh|clean|like you wanted|everyday|daily/);
      });
    });

    it('should provide actionable next steps for beginners', async () => {
      const beginnerResponses: QuizResponse[] = [
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

      const result = await engine.generateRecommendations(
        beginnerResponses,
        'beginner-actionable-test'
      );

      // Every recommendation should suggest trying a sample
      result.recommendations.forEach(recommendation => {
        const insight = recommendation.ai_insight.toLowerCase();
        expect(insight).toMatch(/sample|try.*before/);
      });
    });
  });

  describe('Advanced Experience Level', () => {
    it('should generate detailed technical explanations for advanced users', async () => {
      const advancedResponses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'experience_level',
          answer_value: 'advanced',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'scent_preferences_experienced',
          answer_value: 'oriental_luxury,woody',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'personality_style',
          answer_value: 'unique_creative',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'occasions_experienced',
          answer_value: 'evening,special_occasions',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await engine.generateRecommendations(
        advancedResponses,
        'advanced-test-session'
      );

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(3);

      // Check that explanations are detailed and technical
      result.recommendations.forEach(recommendation => {
        const insight = recommendation.ai_insight;
        
        // Should be comprehensive (100+ words)
        const wordCount = insight.split(' ').filter(word => word.trim().length > 0).length;
        expect(wordCount).toBeGreaterThanOrEqual(100);

        // Should include technical terminology
        const technicalTerms = [
          'composition',
          'olfactory',
          'sophisticated',
          'accords',
          'fragrance architecture',
          'molecular',
          'longevity',
          'sillage'
        ];
        
        const includesTechnical = technicalTerms.some(term => 
          insight.toLowerCase().includes(term.toLowerCase())
        );
        expect(includesTechnical).toBe(true);

        // Should reference fragrance name and brand
        expect(insight).toContain(recommendation.name);
        expect(insight).toContain(recommendation.brand);
      });
    });
  });

  describe('Experience Level Comparison', () => {
    it('should generate progressively more complex explanations', async () => {
      const baseResponses = [
        {
          question_id: 'gender_preference',
          answer_value: 'women',
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
      ];

      // Generate recommendations for different experience levels
      const beginnerResult = await engine.generateRecommendations([
        ...baseResponses,
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString(),
        }
      ], 'comparison-beginner');

      const intermediateResult = await engine.generateRecommendations([
        ...baseResponses,
        {
          question_id: 'experience_level',
          answer_value: 'intermediate',
          timestamp: new Date().toISOString(),
        }
      ], 'comparison-intermediate');

      const advancedResult = await engine.generateRecommendations([
        ...baseResponses,
        {
          question_id: 'experience_level',
          answer_value: 'advanced',
          timestamp: new Date().toISOString(),
        }
      ], 'comparison-advanced');

      // Count words for each level
      const beginnerWords = beginnerResult.recommendations[0].ai_insight
        .replace(/[✅👍💡🧪]/g, '').replace(/\n/g, ' ')
        .split(' ').filter(word => word.trim().length > 0).length;
      
      const intermediateWords = intermediateResult.recommendations[0].ai_insight
        .split(' ').filter(word => word.trim().length > 0).length;
      
      const advancedWords = advancedResult.recommendations[0].ai_insight
        .split(' ').filter(word => word.trim().length > 0).length;

      // Should progress from simple to complex
      expect(beginnerWords).toBeLessThan(intermediateWords);
      expect(intermediateWords).toBeLessThan(advancedWords);

      // Beginner should have visual elements
      expect(beginnerResult.recommendations[0].ai_insight).toMatch(/[✅👍💡🧪\n]/);
      
      // Advanced should use technical language
      expect(advancedResult.recommendations[0].ai_insight.toLowerCase())
        .toMatch(/composition|olfactory|sophisticated|accords/);
    });
  });

  describe('Real-World Problem Scenarios', () => {
    it('should solve the original problem: overwhelming beginners', async () => {
      const overwhelmedBeginnerResponses: QuizResponse[] = [
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
          answer_value: 'sweet_fruity',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await engine.generateRecommendations(
        overwhelmedBeginnerResponses,
        'overwhelmed-beginner-test'
      );

      result.recommendations.forEach(recommendation => {
        const insight = recommendation.ai_insight;
        
        // CRITICAL: Should NOT be the problematic 150+ word explanations
        const wordCount = insight.replace(/[✅👍💡🧪]/g, '').replace(/\n/g, ' ')
          .split(' ').filter(word => word.trim().length > 0).length;
        expect(wordCount).toBeLessThanOrEqual(40);

        // Should NOT contain overwhelming jargon
        const overwhelmingJargon = [
          'sophisticated blend',
          'olfactory experience',
          'Scent Profile Match',
          'Occasion Suitability',
          'unique take without being overpowering'
        ];
        
        const hasOverwhelmingJargon = overwhelmingJargon.some(jargon => 
          insight.toLowerCase().includes(jargon.toLowerCase())
        );
        expect(hasOverwhelmingJargon).toBe(false);

        // Should be immediately actionable
        expect(insight.toLowerCase()).toMatch(/sample|try/);
        
        // Should be encouraging, not intimidating
        expect(insight.toLowerCase()).toMatch(/like you wanted|works for|great/);
      });
    });

    it('should provide the target beginner-friendly format from requirements', async () => {
      const beginnerResponses: QuizResponse[] = [
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
          question_id: 'occasions_beginner',
          answer_value: 'everyday,professional',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await engine.generateRecommendations(
        beginnerResponses,
        'target-format-test'
      );

      const firstRecommendation = result.recommendations[0];
      const insight = firstRecommendation.ai_insight;

      // Should match the target format from requirements:
      // ✅ Fresh & clean like you wanted
      // 👍 Works for school, work, dates  
      // 💡 Similar to Sauvage but more unique
      // 🧪 Try $14 sample before $150 bottle

      // Should have essential emoji bullet points
      expect(insight).toMatch(/✅.*\n/); // Preference match
      expect(insight).toMatch(/🧪.*\$/); // Sample suggestion

      // Should mention preferences clearly
      expect(insight.toLowerCase()).toMatch(/fresh|clean|like you wanted/);
      
      // Should suggest sample with price
      expect(insight).toMatch(/\$\d+.*sample/);
      
      // Should be in bullet-point format (has newlines)
      expect(insight).toContain('\n');
    });
  });
});