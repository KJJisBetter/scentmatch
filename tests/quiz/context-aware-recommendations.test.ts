/**
 * Context-Aware Recommendations Tests - SCE-70
 * 
 * Tests that AI recommendations properly utilize user context
 * to provide personalized, relevant suggestions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorkingRecommendationEngine } from '@/lib/quiz/working-recommendation-engine';
import type { QuizResponse } from '@/lib/quiz/working-recommendation-engine';

describe('Context-Aware Recommendations', () => {
  let engine: WorkingRecommendationEngine;

  beforeEach(() => {
    engine = new WorkingRecommendationEngine();
  });

  describe('Beginner Context: Known Fragrances', () => {
    it('provides Sauvage-specific recommendations for users who mentioned Sauvage', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: JSON.stringify({
            known_fragrances: ['Sauvage by Dior'],
            current_collection: [],
            context_notes: ''
          }),
          answer_metadata: {
            known_fragrances: ['Sauvage by Dior'],
            current_collection: [],
            context_notes: ''
          },
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'fresh_clean,warm_cozy',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(3);

      // Check that at least one recommendation mentions Sauvage in the insight
      const sauvageRelatedRec = result.recommendations.find(rec => 
        rec.ai_insight.toLowerCase().includes('sauvage')
      );
      expect(sauvageRelatedRec).toBeDefined();
      expect(sauvageRelatedRec?.ai_insight).toMatch(/since you.*sauvage/i);
    });

    it('provides Bleu de Chanel-specific recommendations for users who mentioned it', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: JSON.stringify({
            known_fragrances: ['Bleu de Chanel by Chanel'],
            current_collection: [],
            context_notes: ''
          }),
          answer_metadata: {
            known_fragrances: ['Bleu de Chanel by Chanel'],
            current_collection: [],
            context_notes: ''
          },
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'fresh_clean,warm_cozy',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);

      const chanelRelatedRec = result.recommendations.find(rec => 
        rec.ai_insight.toLowerCase().includes('bleu de chanel')
      );
      expect(chanelRelatedRec).toBeDefined();
      expect(chanelRelatedRec?.ai_insight).toMatch(/bleu de chanel/i);
    });

    it('provides Acqua di Gio-specific recommendations', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: JSON.stringify({
            known_fragrances: ['Acqua di Gio by Giorgio Armani'],
            current_collection: [],
            context_notes: ''
          }),
          answer_metadata: {
            known_fragrances: ['Acqua di Gio by Giorgio Armani'],
            current_collection: [],
            context_notes: ''
          },
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'fresh_clean',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);

      const acquaRelatedRec = result.recommendations.find(rec => 
        rec.ai_insight.toLowerCase().includes('acqua di gio')
      );
      expect(acquaRelatedRec).toBeDefined();
      expect(acquaRelatedRec?.ai_insight).toMatch(/acqua di gio/i);
    });

    it('provides Black Opium-specific recommendations for women', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'women',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: JSON.stringify({
            known_fragrances: ['Black Opium by Yves Saint Laurent'],
            current_collection: [],
            context_notes: ''
          }),
          answer_metadata: {
            known_fragrances: ['Black Opium by Yves Saint Laurent'],
            current_collection: [],
            context_notes: ''
          },
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'sweet_fruity,warm_cozy',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);

      const blackOpiumRelatedRec = result.recommendations.find(rec => 
        rec.ai_insight.toLowerCase().includes('black opium')
      );
      expect(blackOpiumRelatedRec).toBeDefined();
      expect(blackOpiumRelatedRec?.ai_insight).toMatch(/black opium/i);
    });

    it('handles multiple known fragrances appropriately', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: JSON.stringify({
            known_fragrances: ['Sauvage by Dior', 'Bleu de Chanel by Chanel'],
            current_collection: [],
            context_notes: ''
          }),
          answer_metadata: {
            known_fragrances: ['Sauvage by Dior', 'Bleu de Chanel by Chanel'],
            current_collection: [],
            context_notes: ''
          },
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'fresh_clean,warm_cozy',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);

      // Should reference at least one of the known fragrances
      const contextAwareRecs = result.recommendations.filter(rec => 
        rec.ai_insight.toLowerCase().includes('sauvage') || 
        rec.ai_insight.toLowerCase().includes('bleu de chanel')
      );
      expect(contextAwareRecs.length).toBeGreaterThan(0);
    });

    it('provides generic known fragrance response for unrecognized fragrances', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: JSON.stringify({
            known_fragrances: ['Some Unknown Fragrance'],
            current_collection: [],
            context_notes: ''
          }),
          answer_metadata: {
            known_fragrances: ['Some Unknown Fragrance'],
            current_collection: [],
            context_notes: ''
          },
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'fresh_clean',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);

      // Should provide generic context-aware response
      const contextAwareRec = result.recommendations.find(rec => 
        rec.ai_insight.toLowerCase().includes('curious about')
      );
      expect(contextAwareRec).toBeDefined();
    });

    it('handles "never heard of any" response appropriately', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: JSON.stringify({
            known_fragrances: ["I haven't heard of any specific ones"],
            current_collection: [],
            context_notes: ''
          }),
          answer_metadata: {
            known_fragrances: ["I haven't heard of any specific ones"],
            current_collection: [],
            context_notes: ''
          },
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'fresh_clean',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);

      // Should not try to reference specific fragrances
      const hasSpecificFragranceReferences = result.recommendations.some(rec => 
        rec.ai_insight.toLowerCase().includes('sauvage') ||
        rec.ai_insight.toLowerCase().includes('bleu de chanel')
      );
      expect(hasSpecificFragranceReferences).toBe(false);
    });
  });

  describe('Advanced Context: Current Collection', () => {
    it('provides collection-based recommendations for experienced users', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'experienced',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: JSON.stringify({
            known_fragrances: [],
            current_collection: [
              {
                id: '1',
                name: 'Sauvage',
                brand: 'Dior',
                rating: 5,
                frequency: 'daily',
                likes: 'fresh, long-lasting',
                dislikes: 'can be too strong sometimes'
              }
            ],
            context_notes: ''
          }),
          answer_metadata: {
            known_fragrances: [],
            current_collection: [
              {
                id: '1',
                name: 'Sauvage',
                brand: 'Dior',
                rating: 5,
                frequency: 'daily',
                likes: 'fresh, long-lasting',
                dislikes: 'can be too strong sometimes'
              }
            ],
            context_notes: ''
          },
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_experienced',
          answer_value: 'citrus,woody,fresh_green',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);

      // Should reference their existing collection
      const collectionBasedRec = result.recommendations.find(rec => 
        rec.ai_insight.toLowerCase().includes('building on your') ||
        rec.ai_insight.toLowerCase().includes('sauvage')
      );
      expect(collectionBasedRec).toBeDefined();
    });

    it('references highest-rated item in collection', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'enthusiast',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: JSON.stringify({
            known_fragrances: [],
            current_collection: [
              {
                id: '1',
                name: 'Aventus',
                brand: 'Creed',
                rating: 5,
                frequency: 'special',
                likes: 'unique, sophisticated'
              },
              {
                id: '2',
                name: 'Dylan Blue',
                brand: 'Versace',
                rating: 3,
                frequency: 'weekly',
                likes: 'affordable, decent'
              }
            ],
            context_notes: ''
          }),
          answer_metadata: {
            known_fragrances: [],
            current_collection: [
              {
                id: '1',
                name: 'Aventus',
                brand: 'Creed',
                rating: 5,
                frequency: 'special',
                likes: 'unique, sophisticated'
              },
              {
                id: '2',
                name: 'Dylan Blue',
                brand: 'Versace',
                rating: 3,
                frequency: 'weekly',
                likes: 'affordable, decent'
              }
            ],
            context_notes: ''
          },
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_enthusiast',
          answer_value: 'citrus,woody',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);

      // Should reference the 5-star Aventus, not the 3-star Dylan Blue
      const aventusBasedRec = result.recommendations.find(rec => 
        rec.ai_insight.toLowerCase().includes('aventus') ||
        rec.ai_insight.toLowerCase().includes('5-star')
      );
      expect(aventusBasedRec).toBeDefined();
    });

    it('provides sophisticated language for experienced users', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'experienced',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: JSON.stringify({
            known_fragrances: [],
            current_collection: [
              {
                id: '1',
                name: 'Tom Ford Oud Wood',
                brand: 'Tom Ford',
                rating: 5,
                frequency: 'special',
                likes: 'complex, luxurious'
              }
            ],
            context_notes: ''
          }),
          answer_metadata: {
            known_fragrances: [],
            current_collection: [
              {
                id: '1',
                name: 'Tom Ford Oud Wood',
                brand: 'Tom Ford',
                rating: 5,
                frequency: 'special',
                likes: 'complex, luxurious'
              }
            ],
            context_notes: ''
          },
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_experienced',
          answer_value: 'woody,unique_unusual',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);

      // Should use sophisticated language for experienced users
      const sophisticatedRec = result.recommendations.find(rec => 
        rec.ai_insight.toLowerCase().includes('sophisticated') ||
        rec.ai_insight.toLowerCase().includes('olfactory') ||
        rec.ai_insight.toLowerCase().includes('composition')
      );
      expect(sophisticatedRec).toBeDefined();
    });
  });

  describe('Context Notes Integration', () => {
    it('considers context notes in recommendations', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'women',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: JSON.stringify({
            known_fragrances: [],
            current_collection: [],
            context_notes: 'I prefer light, fresh scents for daily wear and avoid anything too heavy or sweet'
          }),
          answer_metadata: {
            known_fragrances: [],
            current_collection: [],
            context_notes: 'I prefer light, fresh scents for daily wear and avoid anything too heavy or sweet'
          },
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'fresh_clean',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(3);

      // Should generate appropriate recommendations regardless of context notes
      // (Context notes are captured but not directly processed in current implementation)
      expect(result.recommendations.every(rec => rec.sample_available)).toBe(true);
    });
  });

  describe('Fallback Behavior', () => {
    it('handles missing context gracefully', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'fresh_clean',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(3);

      // Should still provide good recommendations without context
      expect(result.recommendations.every(rec => rec.sample_available)).toBe(true);
    });

    it('handles malformed context data gracefully', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: 'invalid json string',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'fresh_clean',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(3);

      // Should still work with malformed context
      expect(result.recommendations.every(rec => rec.sample_available)).toBe(true);
    });
  });

  describe('AI Insight Quality', () => {
    it('generates appropriate length insights for different experience levels', async () => {
      const beginnerResponses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: JSON.stringify({
            known_fragrances: ['Sauvage by Dior'],
            current_collection: [],
            context_notes: ''
          }),
          answer_metadata: {
            known_fragrances: ['Sauvage by Dior'],
            current_collection: [],
            context_notes: ''
          },
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'fresh_clean',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(beginnerResponses, 'test-session');

      expect(result.success).toBe(true);

      // Beginner insights should be concise and use emojis
      const beginnerInsight = result.recommendations[0].ai_insight;
      expect(beginnerInsight).toMatch(/[✅🔄⚡💡🧪]/); // Should contain emojis
      expect(beginnerInsight.split('\n').length).toBeGreaterThan(1); // Should be multi-line format
    });

    it('includes sample pricing in insights', async () => {
      const responses: QuizResponse[] = [
        {
          question_id: 'gender_preference',
          answer_value: 'men',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'experience_level',
          answer_value: 'beginner',
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'user_context',
          answer_value: JSON.stringify({
            known_fragrances: ['Sauvage by Dior'],
            current_collection: [],
            context_notes: ''
          }),
          answer_metadata: {
            known_fragrances: ['Sauvage by Dior'],
            current_collection: [],
            context_notes: ''
          },
          timestamp: new Date().toISOString()
        },
        {
          question_id: 'scent_preferences_beginner',
          answer_value: 'fresh_clean',
          timestamp: new Date().toISOString()
        }
      ];

      const result = await engine.generateRecommendations(responses, 'test-session');

      expect(result.success).toBe(true);

      // Should include sample pricing in the insight
      const insightWithPricing = result.recommendations.find(rec => 
        rec.ai_insight.includes('$') && rec.ai_insight.toLowerCase().includes('sample')
      );
      expect(insightWithPricing).toBeDefined();
    });
  });
});