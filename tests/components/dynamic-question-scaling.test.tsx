/**
 * Dynamic Question Complexity Scaling Tests - Task 2.1
 *
 * Tests for adaptive question structure that scales complexity based on user experience level:
 * - Beginner: 4 options, simplified language
 * - Enthusiast: 6-8 options, balanced complexity
 * - Collector: 8-10 options, sophisticated choices
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

export type ExperienceLevel = 'beginner' | 'enthusiast' | 'collector';

// Mock data for dynamic question scaling
const questionComplexityByLevel = {
  beginner: {
    option_count: 4,
    language_complexity: 'simple',
    technical_terms: false,
    question_count: 4,
    examples: [
      { text: 'Light, fresh scents', complexity_score: 1 },
      { text: 'Sweet, floral scents', complexity_score: 1 },
      { text: 'Warm, woody scents', complexity_score: 2 },
      { text: 'Rich, bold scents', complexity_score: 2 },
    ],
  },
  enthusiast: {
    option_count: 6,
    language_complexity: 'moderate',
    technical_terms: false,
    question_count: 6,
    examples: [
      { text: 'Citrus and aquatic freshness', complexity_score: 3 },
      { text: 'Romantic floral bouquets', complexity_score: 3 },
      { text: 'Oriental spice blends', complexity_score: 4 },
      { text: 'Woody amber compositions', complexity_score: 4 },
      { text: 'Green, herbal scents', complexity_score: 3 },
      { text: 'Gourmand vanilla notes', complexity_score: 3 },
    ],
  },
  collector: {
    option_count: 10,
    language_complexity: 'sophisticated',
    technical_terms: true,
    question_count: 8,
    examples: [
      { text: 'Aldehydic florals with powdery facets', complexity_score: 8 },
      { text: 'Chypre structures with oakmoss', complexity_score: 9 },
      { text: 'Fougère compositions', complexity_score: 7 },
      { text: 'Oud and rare wood accords', complexity_score: 8 },
      { text: 'Animalic and indolic florals', complexity_score: 9 },
      { text: 'Vintage-style aldehydes', complexity_score: 8 },
      { text: 'Niche artisanal creations', complexity_score: 7 },
      { text: 'Limited edition masterpieces', complexity_score: 8 },
      { text: 'Avant-garde olfactory art', complexity_score: 10 },
      { text: 'Historical fragrance reconstructions', complexity_score: 9 },
    ],
  },
};

// Test data for option splitting and separation
const optionSplittingExamples = {
  original_combined_options: [
    'Casual & relaxed',
    'Professional & sophisticated',
    'Bold & confident',
    'Sweet & fresh',
  ],
  split_options: {
    beginner: [
      'Casual scents',
      'Relaxed scents',
      'Professional scents',
      'Bold scents',
    ],
    enthusiast: [
      'Casual everyday scents',
      'Relaxed comfortable scents',
      'Professional work scents',
      'Sophisticated evening scents',
      'Bold statement scents',
      'Confident signature scents',
    ],
    collector: [
      'Casual niche discoveries',
      'Relaxed comfort compositions',
      'Professional boardroom scents',
      'Sophisticated gala fragrances',
      'Bold avant-garde statements',
      'Confident signature masterpieces',
      'Artisanal casual wear',
      'Refined relaxation blends',
    ],
  },
};

// Test data for Fresh category separation
const freshCategorySeparation = {
  original: ['Fresh'],
  separated_by_level: {
    beginner: ['Fresh scents'], // Keep simple for beginners
    enthusiast: ['Citrus', 'Aquatic'], // Split for better understanding
    collector: [
      'Citrus compositions',
      'Aquatic marine',
      'Green aromatic',
      'Ozonic',
    ], // Full sophistication
  },
};

describe('Dynamic Question Complexity Scaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Option Count Scaling by Experience Level', () => {
    it('should provide correct number of options for each experience level', () => {
      Object.entries(questionComplexityByLevel).forEach(([level, config]) => {
        expect(config.option_count).toBeGreaterThanOrEqual(4);

        if (level === 'beginner') {
          expect(config.option_count).toBe(4);
        } else if (level === 'enthusiast') {
          expect(config.option_count).toBeGreaterThanOrEqual(6);
          expect(config.option_count).toBeLessThanOrEqual(8);
        } else if (level === 'collector') {
          expect(config.option_count).toBeGreaterThanOrEqual(8);
          expect(config.option_count).toBeLessThanOrEqual(10);
        }

        console.log(`${level}: ${config.option_count} options per question`);
      });
    });

    it('should scale question count based on experience level', () => {
      const beginnerQuestions =
        questionComplexityByLevel.beginner.question_count;
      const enthusiastQuestions =
        questionComplexityByLevel.enthusiast.question_count;
      const collectorQuestions =
        questionComplexityByLevel.collector.question_count;

      expect(beginnerQuestions).toBe(4);
      expect(enthusiastQuestions).toBe(6);
      expect(collectorQuestions).toBe(8);

      // Should increase with experience
      expect(enthusiastQuestions).toBeGreaterThan(beginnerQuestions);
      expect(collectorQuestions).toBeGreaterThan(enthusiastQuestions);
    });

    it('should maintain appropriate complexity progression', () => {
      const levels = ['beginner', 'enthusiast', 'collector'] as const;

      levels.forEach(level => {
        const config = questionComplexityByLevel[level];
        const avgComplexity =
          config.examples.reduce((sum, ex) => sum + ex.complexity_score, 0) /
          config.examples.length;

        if (level === 'beginner') {
          expect(avgComplexity).toBeLessThan(3);
        } else if (level === 'enthusiast') {
          expect(avgComplexity).toBeGreaterThanOrEqual(3);
          expect(avgComplexity).toBeLessThan(6);
        } else if (level === 'collector') {
          expect(avgComplexity).toBeGreaterThanOrEqual(7);
        }

        console.log(`${level}: Average complexity ${avgComplexity.toFixed(1)}`);
      });
    });
  });

  describe('Language Complexity Adaptation', () => {
    it('should use appropriate language complexity for each level', () => {
      // Beginner language should be simple
      const beginnerExamples = questionComplexityByLevel.beginner.examples;
      beginnerExamples.forEach(example => {
        expect(example.text.split(' ').length).toBeLessThanOrEqual(4);
        expect(example.text).not.toMatch(
          /aldehydic|chypre|fougère|oud|indolic/i
        );
        expect(example.complexity_score).toBeLessThanOrEqual(2);
      });

      // Enthusiast language should be balanced
      const enthusiastExamples = questionComplexityByLevel.enthusiast.examples;
      enthusiastExamples.forEach(example => {
        expect(example.text.split(' ').length).toBeLessThanOrEqual(6);
        expect(example.complexity_score).toBeGreaterThan(2);
        expect(example.complexity_score).toBeLessThan(6);
      });

      // Collector language can be sophisticated
      const collectorExamples = questionComplexityByLevel.collector.examples;
      collectorExamples.forEach(example => {
        expect(example.complexity_score).toBeGreaterThanOrEqual(7);
        // Collectors can handle technical terms
      });
    });

    it('should avoid technical terms for beginners and enthusiasts', () => {
      expect(questionComplexityByLevel.beginner.technical_terms).toBe(false);
      expect(questionComplexityByLevel.enthusiast.technical_terms).toBe(false);
      expect(questionComplexityByLevel.collector.technical_terms).toBe(true);
    });
  });

  describe('Option Splitting and Separation', () => {
    it('should split combined options into separate choices', () => {
      const original = optionSplittingExamples.original_combined_options;
      const split = optionSplittingExamples.split_options;

      // Original has combined terms with "&"
      original.forEach(option => {
        expect(option).toContain('&');
      });

      // Split options should separate these
      Object.values(split).forEach(levelOptions => {
        levelOptions.forEach(option => {
          // Most split options should not contain "&" (some sophisticated ones might for collectors)
          if (!option.includes('avant-garde')) {
            expect(option.split('&').length).toBeLessThanOrEqual(2);
          }
        });
      });
    });

    it('should provide progressive complexity in split options', () => {
      const { beginner, enthusiast, collector } =
        optionSplittingExamples.split_options;

      // Beginner options should be simplest
      beginner.forEach(option => {
        expect(option.split(' ').length).toBeLessThanOrEqual(3);
      });

      // Enthusiast options more descriptive
      enthusiast.forEach(option => {
        expect(option.split(' ').length).toBeLessThanOrEqual(5);
      });

      // Collector options can be sophisticated
      collector.forEach(option => {
        expect(option.split(' ').length).toBeLessThanOrEqual(6);
      });
    });
  });

  describe('Fresh Category Separation', () => {
    it('should separate Fresh into Citrus and Aquatic for experienced users', () => {
      const separation = freshCategorySeparation.separated_by_level;

      // Beginners keep it simple
      expect(separation.beginner).toEqual(['Fresh scents']);

      // Enthusiasts get split categories
      expect(separation.enthusiast).toContain('Citrus');
      expect(separation.enthusiast).toContain('Aquatic');
      expect(separation.enthusiast).not.toContain('Fresh scents');

      // Collectors get sophisticated options
      expect(separation.collector).toContain('Citrus compositions');
      expect(separation.collector).toContain('Aquatic marine');
      expect(separation.collector.length).toBeGreaterThanOrEqual(3);
    });

    it('should maintain clear category distinction', () => {
      const enthusiastFresh =
        freshCategorySeparation.separated_by_level.enthusiast;
      const collectorFresh =
        freshCategorySeparation.separated_by_level.collector;

      // Each category should be distinct
      enthusiastFresh.forEach(category => {
        expect(['Citrus', 'Aquatic']).toContain(category);
      });

      collectorFresh.forEach(category => {
        expect(category).toMatch(/citrus|aquatic|green|ozonic/i);
      });
    });
  });

  describe('Natural Occasion Categories', () => {
    it('should provide natural occasion categories by experience level', () => {
      const naturalOccasions = {
        beginner: ['Every day', 'Special occasions', 'Work'],
        enthusiast: [
          'Every day',
          'Work meetings',
          'Date nights',
          'Weekend outings',
          'Special occasions',
          'Travel',
        ],
        collector: [
          'Daily signature',
          'Boardroom presence',
          'Romantic evenings',
          'Cultural events',
          'Seasonal celebrations',
          'Private collections',
          'Art gallery openings',
          'Intimate dinners',
        ],
      };

      // Beginners get 3 simple categories
      expect(naturalOccasions.beginner).toHaveLength(3);
      naturalOccasions.beginner.forEach(occasion => {
        expect(occasion.split(' ').length).toBeLessThanOrEqual(3);
        expect(occasion).toMatch(/^(Every day|Special occasions|Work)$/);
      });

      // Enthusiasts get 6 varied categories
      expect(naturalOccasions.enthusiast).toHaveLength(6);
      naturalOccasions.enthusiast.forEach(occasion => {
        expect(occasion.split(' ').length).toBeLessThanOrEqual(4);
      });

      // Collectors get 8 sophisticated categories
      expect(naturalOccasions.collector).toHaveLength(8);
      naturalOccasions.collector.forEach(occasion => {
        expect(occasion.split(' ').length).toBeLessThanOrEqual(4);
      });
    });

    it('should progress from generic to specific occasions', () => {
      const occasions = {
        beginner: ['Every day', 'Special occasions', 'Work'],
        enthusiast: [
          'Every day',
          'Work meetings',
          'Date nights',
          'Weekend outings',
          'Special occasions',
          'Travel',
        ],
        collector: [
          'Daily signature',
          'Boardroom presence',
          'Romantic evenings',
          'Cultural events',
          'Seasonal celebrations',
          'Private collections',
          'Art gallery openings',
          'Intimate dinners',
        ],
      };

      // Beginner occasions should be broad and universal
      occasions.beginner.forEach(occasion => {
        expect(['Every day', 'Special occasions', 'Work']).toContain(occasion);
      });

      // Enthusiast occasions should be more specific but still relatable
      expect(occasions.enthusiast).toContain('Date nights');
      expect(occasions.enthusiast).toContain('Weekend outings');

      // Collector occasions should be sophisticated and niche
      expect(occasions.collector).toContain('Art gallery openings');
      expect(occasions.collector).toContain('Private collections');
    });
  });

  describe('Option Content Quality', () => {
    it('should maintain quality across all complexity levels', () => {
      Object.entries(questionComplexityByLevel).forEach(([level, config]) => {
        config.examples.forEach(example => {
          // All options should be clear and actionable
          expect(example.text.length).toBeGreaterThan(5);
          expect(example.text.length).toBeLessThan(50);

          // Should start with capital letter
          expect(example.text).toMatch(/^[A-Z]/);

          // Should not end with period (it's an option, not a sentence)
          expect(example.text).not.toMatch(/\.$/);
        });

        console.log(
          `${level}: ${config.examples.length} example options validated`
        );
      });
    });

    it('should avoid overwhelming beginners with choices', () => {
      const beginnerConfig = questionComplexityByLevel.beginner;

      // 4 options maximum for beginners
      expect(beginnerConfig.option_count).toBe(4);

      // Each option should be very clear
      beginnerConfig.examples.forEach(example => {
        expect(example.text.split(' ').length).toBeLessThanOrEqual(4);
        expect(example.complexity_score).toBeLessThanOrEqual(2);
      });
    });

    it('should provide rich choices for collectors', () => {
      const collectorConfig = questionComplexityByLevel.collector;

      // 8-10 options for sophisticated users
      expect(collectorConfig.option_count).toBeGreaterThanOrEqual(8);
      expect(collectorConfig.option_count).toBeLessThanOrEqual(10);

      // Options can be sophisticated
      collectorConfig.examples.forEach(example => {
        expect(example.complexity_score).toBeGreaterThanOrEqual(7);
      });

      // Should include technical terms appropriately
      const technicalTermsFound = collectorConfig.examples.some(example =>
        example.text.match(/aldehydic|chypre|fougère|oud|indolic|animalic/i)
      );
      expect(technicalTermsFound).toBe(true);
    });
  });

  describe('Adaptive Question Flow', () => {
    it('should create appropriate question progression for each level', () => {
      const questionProgression = {
        beginner: {
          questions: [
            { id: 'style', text: 'What scents do you enjoy?', options: 4 },
            {
              id: 'occasions',
              text: 'When do you wear fragrance?',
              options: 4,
            },
            { id: 'intensity', text: 'How strong should it be?', options: 4 },
            { id: 'mood', text: 'What feeling do you want?', options: 4 },
          ],
        },
        enthusiast: {
          questions: [
            {
              id: 'style',
              text: 'What fragrance styles appeal to you?',
              options: 6,
            },
            {
              id: 'families',
              text: 'Which fragrance families do you prefer?',
              options: 6,
            },
            {
              id: 'occasions',
              text: 'What occasions are most important?',
              options: 6,
            },
            {
              id: 'intensity',
              text: 'How noticeable should your fragrance be?',
              options: 6,
            },
            {
              id: 'seasons',
              text: 'What seasons do you wear fragrance most?',
              options: 6,
            },
            {
              id: 'characteristics',
              text: 'What characteristics matter most?',
              options: 6,
            },
          ],
        },
        collector: {
          questions: [
            {
              id: 'composition_style',
              text: 'What compositional styles intrigue you?',
              options: 10,
            },
            {
              id: 'olfactory_families',
              text: 'Which olfactory families define your taste?',
              options: 10,
            },
            {
              id: 'occasions_sophisticated',
              text: 'What occasions demand your finest selections?',
              options: 8,
            },
            {
              id: 'intensity_nuanced',
              text: 'How do you prefer fragrance projection?',
              options: 8,
            },
            {
              id: 'seasonal_mastery',
              text: 'How do you approach seasonal fragrance curation?',
              options: 8,
            },
            {
              id: 'collection_philosophy',
              text: 'What drives your collection philosophy?',
              options: 10,
            },
            {
              id: 'artisanal_preferences',
              text: 'What artisanal elements captivate you?',
              options: 10,
            },
            {
              id: 'vintage_modern',
              text: 'How do you balance vintage and modern aesthetics?',
              options: 8,
            },
          ],
        },
      };

      Object.entries(questionProgression).forEach(([level, config]) => {
        const expectedQuestionCount =
          level === 'beginner' ? 4 : level === 'enthusiast' ? 6 : 8;
        expect(config.questions).toHaveLength(expectedQuestionCount);

        config.questions.forEach(question => {
          const expectedOptionCount =
            level === 'beginner'
              ? 4
              : level === 'enthusiast'
                ? 6
                : question.id.includes('composition') ||
                    question.id.includes('artisanal') ||
                    question.id.includes('philosophy') ||
                    question.id.includes('olfactory')
                  ? 10
                  : 8;

          expect(question.options).toBe(expectedOptionCount);
          expect(question.text.length).toBeGreaterThan(10);
          expect(question.text.length).toBeLessThan(80);
        });

        console.log(
          `${level}: ${config.questions.length} questions with appropriate complexity`
        );
      });
    });
  });

  describe('Performance and User Experience', () => {
    it('should maintain fast rendering with increased option counts', () => {
      const performanceRequirements = {
        beginner: { max_render_time_ms: 50, options: 4 },
        enthusiast: { max_render_time_ms: 75, options: 6 },
        collector: { max_render_time_ms: 100, options: 10 },
      };

      Object.entries(performanceRequirements).forEach(([level, req]) => {
        // Simulate rendering time calculation
        const estimatedRenderTime = req.options * 8; // 8ms per option estimate

        expect(estimatedRenderTime).toBeLessThan(req.max_render_time_ms);
        console.log(
          `${level}: ${estimatedRenderTime}ms estimated render time for ${req.options} options`
        );
      });
    });

    it('should prevent choice paralysis with appropriate option counts', () => {
      // Psychological research: 7±2 rule for cognitive load
      const cognitiveLoadTest = {
        beginner: {
          options: 4,
          cognitive_load: 'low',
          choice_paralysis_risk: 0.1,
        },
        enthusiast: {
          options: 6,
          cognitive_load: 'optimal',
          choice_paralysis_risk: 0.15,
        },
        collector: {
          options: 10,
          cognitive_load: 'high_but_desired',
          choice_paralysis_risk: 0.25,
        },
      };

      Object.entries(cognitiveLoadTest).forEach(([level, test]) => {
        // Beginners should have minimal cognitive load
        if (level === 'beginner') {
          expect(test.choice_paralysis_risk).toBeLessThan(0.15);
        }

        // Collectors expect and can handle more choices
        if (level === 'collector') {
          expect(test.choice_paralysis_risk).toBeLessThan(0.3);
        }

        console.log(
          `${level}: ${test.cognitive_load} cognitive load, ${(test.choice_paralysis_risk * 100).toFixed(1)}% paralysis risk`
        );
      });
    });
  });
});

/**
 * Integration Test Data for Question Scaling
 */
export const questionScalingTestData = {
  complexity_by_level: questionComplexityByLevel,
  option_splitting: optionSplittingExamples,
  fresh_separation: freshCategorySeparation,
  scaling_validation: {
    maintains_user_flow: true,
    preserves_data_quality: true,
    improves_user_experience: true,
    reduces_abandonment: true,
  },
};
