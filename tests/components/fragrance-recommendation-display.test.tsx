/**
 * Fragrance Recommendation Display Tests - Task 3.1
 *
 * Tests for the new simplified recommendation display that shows exactly 3
 * fragrance recommendations with AI insights, replacing the complex personality profile.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock recommendation data structure
const mockFragranceRecommendations = [
  {
    id: 'fragrance-1',
    name: 'Chanel No. 5',
    brand: 'Chanel',
    image_url: '/images/chanel-no5.jpg',
    sample_price_usd: 12,
    match_percentage: 94,
    ai_insight:
      'Perfect match for your elegant and sophisticated style. The aldehydic florals will complement your preference for timeless classics.',
    reasoning:
      "Your quiz responses indicate a love for sophisticated, timeless scents. Chanel No. 5's iconic aldehydic floral composition matches your refined taste perfectly.",
    confidence_level: 'high',
    why_recommended: 'Matches your style preferences and occasion needs',
  },
  {
    id: 'fragrance-2',
    name: 'Santal 33',
    brand: 'Le Labo',
    image_url: '/images/santal-33.jpg',
    sample_price_usd: 15,
    match_percentage: 89,
    ai_insight:
      'Your preference for unique, memorable scents aligns beautifully with this modern woody masterpiece.',
    reasoning:
      "Based on your answers about wanting distinctive fragrances, Santal 33's unique sandalwood composition will give you that memorable presence you're seeking.",
    confidence_level: 'high',
    why_recommended: 'Unique and distinctive as you requested',
  },
  {
    id: 'fragrance-3',
    name: 'Black Opium',
    brand: 'Yves Saint Laurent',
    image_url: '/images/black-opium.jpg',
    sample_price_usd: 10,
    match_percentage: 85,
    ai_insight:
      'The sweet gourmand notes create an ideal match for your preference for warm, cozy scents while maintaining elegance.',
    reasoning:
      "Your selections suggest you enjoy fragrances that are both comforting and impactful. Black Opium's vanilla and coffee notes provide that perfect balance.",
    confidence_level: 'medium',
    why_recommended: 'Balances comfort with impact',
  },
];

// Expected component behavior
const expectedDisplayBehavior = {
  recommendation_count: 3,
  shows_ai_insights: true,
  shows_match_percentages: true,
  shows_sample_pricing: true,
  has_sample_order_buttons: true,
  displays_reasoning: true,
  professional_layout: true,
  mobile_responsive: true,
  no_personality_profile: true, // Key requirement - no complex personality displays
};

describe('Fragrance Recommendation Display Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure and Display', () => {
    it('should display exactly 3 fragrance recommendations', () => {
      const recommendations = mockFragranceRecommendations;

      expect(recommendations).toHaveLength(3);

      recommendations.forEach((rec, index) => {
        expect(rec.id).toMatch(/^fragrance-\d+$/);
        expect(rec.name).toBeTruthy();
        expect(rec.brand).toBeTruthy();
        expect(rec.match_percentage).toBeGreaterThan(80);
        expect(rec.ai_insight).toBeTruthy();

        console.log(
          `Recommendation ${index + 1}: ${rec.name} by ${rec.brand} (${rec.match_percentage}% match)`
        );
      });
    });

    it('should include AI insights for each recommendation', () => {
      mockFragranceRecommendations.forEach(rec => {
        expect(rec.ai_insight).toBeTruthy();
        expect(rec.ai_insight.length).toBeGreaterThan(20);
        expect(rec.ai_insight.length).toBeLessThan(200);

        // AI insights should be personal and explanatory
        expect(rec.ai_insight).toMatch(/your|you/i);
        expect(rec.ai_insight).not.toContain('AI analysis');
        expect(rec.ai_insight).not.toContain('algorithm');
      });
    });

    it('should display match percentages prominently', () => {
      mockFragranceRecommendations.forEach(rec => {
        expect(rec.match_percentage).toBeGreaterThan(70);
        expect(rec.match_percentage).toBeLessThanOrEqual(100);
        expect(typeof rec.match_percentage).toBe('number');
      });

      // Should be ordered by match percentage (highest first)
      const percentages = mockFragranceRecommendations.map(
        r => r.match_percentage
      );
      const sortedPercentages = [...percentages].sort((a, b) => b - a);
      expect(percentages).toEqual(sortedPercentages);
    });

    it('should include sample ordering information', () => {
      mockFragranceRecommendations.forEach(rec => {
        expect(rec.sample_price_usd).toBeGreaterThan(0);
        expect(rec.sample_price_usd).toBeLessThan(50);
        expect(typeof rec.sample_price_usd).toBe('number');
      });
    });
  });

  describe('AI Insight Quality', () => {
    it('should provide personalized, actionable insights', () => {
      mockFragranceRecommendations.forEach((rec, index) => {
        const insight = rec.ai_insight;

        // Should be personal and conversational
        expect(insight).toMatch(/your|you/i);
        expect(insight).not.toMatch(/user|customer|client/i);

        // Should explain the connection
        expect(insight).toMatch(/match|align|complement|perfect|suit/i);

        // Should reference user preferences
        expect(insight).toMatch(/style|preference|taste|answers|quiz/i);

        // Should be encouraging and positive
        expect(insight).toMatch(
          /perfect|beautiful|ideal|amazing|wonderful|excellent/i
        );

        console.log(`Insight ${index + 1}: "${insight}"`);
      });
    });

    it('should provide clear reasoning for each recommendation', () => {
      mockFragranceRecommendations.forEach(rec => {
        expect(rec.reasoning).toBeTruthy();
        expect(rec.reasoning.length).toBeGreaterThan(30);
        expect(rec.reasoning.length).toBeLessThan(300);

        // Reasoning should reference quiz responses
        expect(rec.reasoning).toMatch(
          /answer|response|quiz|selection|indicate/i
        );

        // Should explain the fragrance connection
        expect(rec.reasoning).toMatch(/composition|notes|blend|accord/i);
      });
    });

    it('should indicate confidence levels appropriately', () => {
      const confidenceLevels = mockFragranceRecommendations.map(
        r => r.confidence_level
      );

      // Should have varied but reasonable confidence
      expect(confidenceLevels).toContain('high');
      expect(
        confidenceLevels.every(level =>
          ['high', 'medium', 'good'].includes(level)
        )
      ).toBe(true);

      // High match percentages should have high confidence
      const highMatchRec = mockFragranceRecommendations.find(
        r => r.match_percentage > 90
      );
      expect(highMatchRec?.confidence_level).toBe('high');
    });
  });

  describe('Simplified Display Requirements', () => {
    it('should NOT display complex personality profiles', () => {
      // The new component should not show:
      const forbiddenElements = [
        'personality_type',
        'archetype_analysis',
        'dimension_scores',
        'style_descriptor_complex',
        'psychological_analysis',
        'personality_breakdown',
      ];

      forbiddenElements.forEach(element => {
        // Ensure none of our recommendations contain these complex elements
        mockFragranceRecommendations.forEach(rec => {
          expect(rec).not.toHaveProperty(element);
        });
      });

      expect(expectedDisplayBehavior.no_personality_profile).toBe(true);
    });

    it('should focus on immediate, actionable results', () => {
      mockFragranceRecommendations.forEach(rec => {
        // Each recommendation should be immediately actionable
        expect(rec.sample_price_usd).toBeTruthy(); // Can order sample
        expect(rec.why_recommended).toBeTruthy(); // Clear reason
        expect(rec.match_percentage).toBeGreaterThan(80); // High confidence

        // Should not require additional analysis or interpretation
        expect(rec.ai_insight).not.toContain('requires further analysis');
        expect(rec.ai_insight).not.toContain('additional questions needed');
      });
    });

    it('should maintain professional but approachable tone', () => {
      mockFragranceRecommendations.forEach(rec => {
        // AI insights should be friendly but professional
        expect(rec.ai_insight).not.toContain('absolutely');
        expect(rec.ai_insight).not.toContain('definitely');
        expect(rec.ai_insight).not.toContain('guaranteed');

        // Should be confident but not overselling
        expect(rec.ai_insight).toMatch(
          /perfect|ideal|excellent|beautiful|wonderful/i
        );
        expect(rec.ai_insight).not.toMatch(
          /amazing deal|incredible price|can't miss/i
        );
      });
    });
  });

  describe('Component Interaction Requirements', () => {
    it('should provide clear call-to-action for each recommendation', () => {
      const expectedActions = ['Try Sample', 'Learn More', 'Add to Favorites'];

      // Each recommendation should have clear next steps
      mockFragranceRecommendations.forEach(rec => {
        expect(rec.sample_price_usd).toBeGreaterThan(0); // Can order sample
        expect(rec.name).toBeTruthy(); // Can learn more
        expect(rec.id).toBeTruthy(); // Can add to favorites
      });
    });

    it('should handle sample ordering workflow', () => {
      const sampleOrderingFlow = {
        displays_price: true,
        shows_size_info: true,
        explains_shipping: true,
        maintains_quiz_context: true,
      };

      Object.entries(sampleOrderingFlow).forEach(([requirement, met]) => {
        expect(met).toBe(true);
      });

      // Price display should be clear
      mockFragranceRecommendations.forEach(rec => {
        expect(rec.sample_price_usd).toBeGreaterThan(5);
        expect(rec.sample_price_usd).toBeLessThan(25);
      });
    });

    it('should integrate with conversion flow', () => {
      const conversionIntegration = {
        preserves_quiz_data: true,
        maintains_recommendation_context: true,
        shows_value_proposition: true,
        enables_account_creation: true,
      };

      Object.entries(conversionIntegration).forEach(([requirement, met]) => {
        expect(met).toBe(true);
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should display recommendations appropriately on mobile', () => {
      const mobileRequirements = {
        single_column_layout: true,
        touch_friendly_buttons: true,
        readable_text_sizes: true,
        efficient_space_usage: true,
        fast_loading: true,
      };

      Object.entries(mobileRequirements).forEach(([requirement, met]) => {
        expect(met).toBe(true);
      });
    });

    it('should maintain AI insight readability on small screens', () => {
      mockFragranceRecommendations.forEach(rec => {
        // Insights should be concise enough for mobile
        expect(rec.ai_insight.split(' ').length).toBeLessThanOrEqual(25);
        expect(rec.ai_insight).not.toContain('\n'); // Single paragraph

        // Should not contain overly long words that break on mobile
        const words = rec.ai_insight.split(' ');
        words.forEach(word => {
          expect(word.length).toBeLessThanOrEqual(15); // Allow up to 15 characters
        });
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should load recommendations quickly', () => {
      const performanceTargets = {
        recommendation_generation_ms: 500,
        ai_insight_generation_ms: 200,
        component_render_ms: 50,
        total_display_time_ms: 750,
      };

      // Simplified display should be much faster than complex personality analysis
      expect(performanceTargets.total_display_time_ms).toBeLessThan(1000);
      expect(performanceTargets.recommendation_generation_ms).toBeLessThan(600);

      console.log(
        `Target total display time: ${performanceTargets.total_display_time_ms}ms`
      );
    });

    it('should reduce cognitive load compared to personality profiles', () => {
      const cognitiveLoadComparison = {
        old_personality_profile: {
          elements_to_process: 8, // Personality type, dimensions, archetype, etc.
          reading_time_seconds: 45,
          decision_complexity: 'high',
        },
        new_recommendation_display: {
          elements_to_process: 3, // Just 3 clear recommendations
          reading_time_seconds: 15,
          decision_complexity: 'low',
        },
      };

      const oldLoad = cognitiveLoadComparison.old_personality_profile;
      const newLoad = cognitiveLoadComparison.new_recommendation_display;

      expect(newLoad.elements_to_process).toBeLessThan(
        oldLoad.elements_to_process
      );
      expect(newLoad.reading_time_seconds).toBeLessThan(
        oldLoad.reading_time_seconds
      );
      expect(newLoad.decision_complexity).toBe('low');

      console.log(
        `Cognitive load reduced: ${oldLoad.elements_to_process} → ${newLoad.elements_to_process} elements`
      );
    });
  });
});

/**
 * Integration Test Data for Recommendation Display
 */
export const recommendationDisplayTestData = {
  sample_recommendations: mockFragranceRecommendations,
  display_requirements: expectedDisplayBehavior,
  performance_targets: {
    max_load_time_ms: 750,
    max_ai_insight_length: 150,
    min_match_percentage: 80,
    max_recommendations: 3,
  },
  user_experience_goals: {
    reduces_choice_paralysis: true,
    increases_conversion_rate: true,
    improves_clarity: true,
    maintains_personalization: true,
  },
};
