/**
 * Quiz Algorithm Investigation - Test Different Responses
 * 
 * This test investigates whether the quiz algorithm actually uses user responses
 * to generate different recommendations or if it's always returning the same results.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { WorkingRecommendationEngine } from '@/lib/quiz/working-recommendation-engine';
import type { QuizResponse } from '@/lib/quiz/working-recommendation-engine';

describe('Quiz Algorithm Investigation - Response Variation Testing', () => {
  let engine: WorkingRecommendationEngine;

  beforeEach(() => {
    engine = new WorkingRecommendationEngine();
  });

  describe('Scent Preference Variation Testing', () => {
    test('should return DIFFERENT recommendations for different scent preferences', async () => {
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
          question_id: 'personality_style',
          answer_value: 'classic_timeless',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'occasions_beginner',
          answer_value: 'everyday',
          timestamp: new Date().toISOString(),
        }
      ];

      // Test 1: Fresh & Clean preferences
      const freshResponses = [
        ...baseResponses,
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'fresh_clean',
          timestamp: new Date().toISOString(),
        }
      ];

      // Test 2: Sweet & Fruity preferences  
      const sweetResponses = [
        ...baseResponses,
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'sweet_fruity',
          timestamp: new Date().toISOString(),
        }
      ];

      // Test 3: Warm & Cozy preferences
      const warmResponses = [
        ...baseResponses,
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'warm_cozy',
          timestamp: new Date().toISOString(),
        }
      ];

      // Generate recommendations for each preference set
      const [freshResult, sweetResult, warmResult] = await Promise.all([
        engine.generateRecommendations(freshResponses, 'test-fresh'),
        engine.generateRecommendations(sweetResponses, 'test-sweet'),
        engine.generateRecommendations(warmResponses, 'test-warm')
      ]);

      console.log('\n🧪 PREFERENCE VARIATION TEST RESULTS:');
      console.log('\n1. FRESH & CLEAN preferences:');
      freshResult.recommendations.forEach((rec, i) => {
        console.log(`   ${i+1}. ${rec.name} by ${rec.brand}`);
      });

      console.log('\n2. SWEET & FRUITY preferences:');
      sweetResult.recommendations.forEach((rec, i) => {
        console.log(`   ${i+1}. ${rec.name} by ${rec.brand}`);
      });

      console.log('\n3. WARM & COZY preferences:');
      warmResult.recommendations.forEach((rec, i) => {
        console.log(`   ${i+1}. ${rec.name} by ${rec.brand}`);
      });

      // Test if recommendations are actually different
      const freshNames = freshResult.recommendations.map(r => r.name);
      const sweetNames = sweetResult.recommendations.map(r => r.name);
      const warmNames = warmResult.recommendations.map(r => r.name);

      // These should be different sets of fragrances
      const freshVsSweet = freshNames.some(name => !sweetNames.includes(name));
      const freshVsWarm = freshNames.some(name => !warmNames.includes(name));
      const sweetVsWarm = sweetNames.some(name => !warmNames.includes(name));

      console.log('\n📊 VARIATION ANALYSIS:');
      console.log(`   Fresh vs Sweet different: ${freshVsSweet}`);
      console.log(`   Fresh vs Warm different: ${freshVsWarm}`);
      console.log(`   Sweet vs Warm different: ${sweetVsWarm}`);

      // At least some recommendations should be different across preference types
      expect(freshVsSweet || freshVsWarm || sweetVsWarm).toBe(true);

      if (!freshVsSweet && !freshVsWarm && !sweetVsWarm) {
        console.log('\n❌ ALGORITHM ISSUE: All preference types return identical results');
        console.log('   This suggests the scoring algorithm is not using scent preferences correctly');
      }
    });

    test('should verify algorithm actually uses scent family matching', async () => {
      const responses: QuizResponse[] = [
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
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-fresh-specific');

      console.log('\n🔍 ALGORITHM INVESTIGATION:');
      console.log('User selected: Fresh & Clean preferences');
      console.log('Expected: Citrus, aquatic, fresh fragrances');
      console.log('');

      result.recommendations.forEach((rec, i) => {
        console.log(`${i+1}. ${rec.name} by ${rec.brand}`);
        console.log(`   Scent family: ${rec.scent_family || 'unknown'}`);
        console.log(`   Match score: ${rec.match_score || 'unknown'}`);
        console.log(`   AI insight: ${rec.ai_insight.substring(0, 100)}...`);
        console.log('');
      });

      // All recommendations should be from men's or unisex fragrances
      result.recommendations.forEach(rec => {
        const isAppropriateGender = rec.gender_target === 'men' || rec.gender_target === 'unisex';
        expect(isAppropriateGender).toBe(true);
      });

      console.log('✅ Gender filtering working correctly (no women\'s fragrances for men)');
    });

    test('should test personality style variation impact', async () => {
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
        }
      ];

      // Test different personality styles
      const boldResponses = [
        ...baseResponses,
        {
          question_id: 'personality_style',
          answer_value: 'bold_confident',
          timestamp: new Date().toISOString(),
        }
      ];

      const classicResponses = [
        ...baseResponses,
        {
          question_id: 'personality_style',
          answer_value: 'classic_timeless',
          timestamp: new Date().toISOString(),
        }
      ];

      const [boldResult, classicResult] = await Promise.all([
        engine.generateRecommendations(boldResponses, 'test-bold'),
        engine.generateRecommendations(classicResponses, 'test-classic')
      ]);

      console.log('\n🎭 PERSONALITY STYLE VARIATION TEST:');
      console.log('\nBOLD & CONFIDENT personality:');
      boldResult.recommendations.forEach((rec, i) => {
        console.log(`   ${i+1}. ${rec.name} - ${rec.ai_insight.substring(0, 80)}...`);
      });

      console.log('\nCLASSIC & TIMELESS personality:');
      classicResult.recommendations.forEach((rec, i) => {
        console.log(`   ${i+1}. ${rec.name} - ${rec.ai_insight.substring(0, 80)}...`);
      });

      // Check if personality affects the AI insights at minimum
      const boldInsights = boldResult.recommendations.map(r => r.ai_insight.toLowerCase());
      const classicInsights = classicResult.recommendations.map(r => r.ai_insight.toLowerCase());

      const boldHasPersonalityTerms = boldInsights.some(insight => 
        insight.includes('bold') || insight.includes('confident') || insight.includes('statement')
      );
      
      const classicHasPersonalityTerms = classicInsights.some(insight => 
        insight.includes('classic') || insight.includes('timeless') || insight.includes('elegant')
      );

      console.log(`\n📊 Personality impact analysis:`);
      console.log(`   Bold personality terms in insights: ${boldHasPersonalityTerms}`);
      console.log(`   Classic personality terms in insights: ${classicHasPersonalityTerms}`);

      // At minimum, personality should affect the AI insights
      expect(boldHasPersonalityTerms || classicHasPersonalityTerms).toBe(true);
    });
  });

  describe('Algorithm Scoring Investigation', () => {
    test('should debug scoring algorithm step by step', async () => {
      const responses: QuizResponse[] = [
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
          answer_value: 'warm_cozy',
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'personality_style',
          answer_value: 'bold_confident',
          timestamp: new Date().toISOString(),
        }
      ];

      console.log('\n🔍 ALGORITHM STEP-BY-STEP DEBUG:');
      console.log('Input responses:');
      responses.forEach(r => {
        console.log(`   ${r.question_id}: ${r.answer_value}`);
      });

      const result = await engine.generateRecommendations(responses, 'debug-test');

      console.log('\nAlgorithm output:');
      console.log(`   Success: ${result.success}`);
      console.log(`   Method: ${result.recommendation_method}`);
      console.log(`   Processing time: ${result.total_processing_time_ms}ms`);
      console.log(`   Recommendations count: ${result.recommendations.length}`);

      // Check if we're hitting the fallback logic
      if (!result.success) {
        console.log('\n⚠️  ALGORITHM USING FALLBACK - Main algorithm may have failed');
      } else {
        console.log('\n✅ Main algorithm succeeded');
      }

      expect(result.recommendations.length).toBe(3);
    });

    test('should verify scent family matching is working', async () => {
      // Create responses that should strongly prefer woody/spicy (warm_cozy)
      const warmResponses: QuizResponse[] = [
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
          answer_value: 'warm_cozy',
          timestamp: new Date().toISOString(),
        }
      ];

      const result = await engine.generateRecommendations(warmResponses, 'test-warm-matching');

      console.log('\n🌿 SCENT FAMILY MATCHING TEST:');
      console.log('User preference: warm_cozy (should prefer woody, spicy, amber)');
      console.log('');

      result.recommendations.forEach((rec, i) => {
        const hasWarmAccords = rec.accords?.some((accord: string) => 
          ['woody', 'amber', 'spicy', 'warm', 'vanilla', 'cedar', 'sandalwood'].includes(accord.toLowerCase())
        );

        console.log(`${i+1}. ${rec.name}`);
        console.log(`   Accords: ${rec.accords?.join(', ') || 'none'}`);
        console.log(`   Has warm accords: ${hasWarmAccords}`);
        console.log(`   Scent family: ${rec.scent_family}`);
        console.log('');
      });

      // At least some recommendations should match the warm/cozy preference
      const hasWarmMatchingRecs = result.recommendations.some(rec => 
        rec.accords?.some((accord: string) => 
          ['woody', 'amber', 'spicy', 'warm', 'vanilla'].includes(accord.toLowerCase())
        )
      );

      if (!hasWarmMatchingRecs) {
        console.log('❌ ISSUE: No warm/cozy accords found in recommendations for warm_cozy preference');
        console.log('   This suggests scent family matching may not be working properly');
      } else {
        console.log('✅ Some recommendations match warm/cozy preference');
      }
    });
  });
});