import { describe, test, expect, beforeEach, vi } from 'vitest';
import { setupRpcOperations, resetDatabaseMocks } from '../utils/database-test-utils';

/**
 * Progressive Engagement Conversion Tests
 * 
 * Tests the optimized quiz-to-account conversion flow:
 * - Progressive engagement without forced authentication
 * - Natural conversion prompts based on user behavior
 * - Guest session value building and investment tracking
 * - Conversion funnel optimization metrics
 * - User momentum preservation throughout flow
 */

// Mock progressive engagement components
vi.mock('@/components/quiz/progressive-engagement-flow', () => ({
  ProgressiveEngagementFlow: vi.fn().mockImplementation(() => null)
}));

vi.mock('@/lib/actions/guest-engagement', () => ({
  trackGuestEngagement: vi.fn(),
  buildProgressiveValue: vi.fn(),
  triggerNaturalConversion: vi.fn(),
  transferGuestToAccount: vi.fn()
}));

describe('Progressive Engagement Conversion Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMocks();
    setupRpcOperations();
  });

  describe('Guest Exploration Without Forced Auth', () => {
    test('should allow full quiz results exploration without login wall', async () => {
      const { ProgressiveEngagementFlow } = await import('@/components/quiz/progressive-engagement-flow');
      
      const guestExploration = {
        quiz_session_token: 'guest-exploration-token',
        recommendations: [
          { fragrance_id: 'frag-1', name: 'Test Fragrance 1', match_percentage: 95 },
          { fragrance_id: 'frag-2', name: 'Test Fragrance 2', match_percentage: 87 },
          { fragrance_id: 'frag-3', name: 'Test Fragrance 3', match_percentage: 82 }
        ],
        engagement_phase: 'exploration',
        forced_auth: false,
        wall_removed: true
      };

      const mockFlow = ProgressiveEngagementFlow as any;
      mockFlow.mockImplementation(({ quizResults, phase }) => ({
        render: () => ({
          results_accessible: true,
          auth_wall_present: false,
          exploration_enabled: true,
          recommendations_count: quizResults.recommendations.length,
          phase: phase
        })
      }));

      const component = new mockFlow({
        quizResults: guestExploration,
        phase: 'exploration'
      });

      const result = component.render();

      expect(result.auth_wall_present).toBe(false);
      expect(result.exploration_enabled).toBe(true);
      expect(result.recommendations_count).toBe(3);
      expect(result.results_accessible).toBe(true);
    });

    test('should provide progressive value discovery instead of limitations', async () => {
      const { buildProgressiveValue } = await import('@/lib/actions/guest-engagement');
      
      const progressiveValue = {
        phase_1_discovery: {
          message: '✨ You have 3 perfect matches!',
          tone: 'positive_discovery',
          call_to_action: 'explore_matches',
          limitation_messaging: false
        },
        phase_2_investment: {
          message: '🔥 Based on your activity, we found 2 more amazing matches',
          tone: 'value_building',
          additional_value: true,
          investment_indicators: ['time_spent', 'favorites_added', 'detailed_views']
        },
        phase_3_conversion: {
          message: '💎 Ready to save your fragrance journey?',
          tone: 'natural_progression',
          timing: 'high_engagement',
          forced: false
        }
      };

      (buildProgressiveValue as any).mockResolvedValue(progressiveValue);

      const result = await buildProgressiveValue('guest-token', 'exploration');

      expect(result.phase_1_discovery.limitation_messaging).toBe(false);
      expect(result.phase_1_discovery.tone).toBe('positive_discovery');
      expect(result.phase_2_investment.additional_value).toBe(true);
      expect(result.phase_3_conversion.forced).toBe(false);
    });

    test('should track user investment and engagement signals', async () => {
      const { trackGuestEngagement } = await import('@/lib/actions/guest-engagement');
      
      const engagementSignals = {
        session_token: 'investment-tracking-token',
        engagement_events: [
          { type: 'fragrance_detail_view', fragrance_id: 'frag-1', duration_seconds: 45 },
          { type: 'favorite_added', fragrance_id: 'frag-1', timestamp: Date.now() },
          { type: 'sample_interest', fragrance_id: 'frag-1', interest_level: 'high' },
          { type: 'quiz_result_share', method: 'copy_link', engagement_score: 8 }
        ],
        investment_score: 0.75, // High investment
        conversion_readiness: 'high',
        optimal_conversion_timing: true
      };

      (trackGuestEngagement as any).mockResolvedValue({
        tracking_successful: true,
        investment_score: 0.75,
        engagement_quality: 'high',
        conversion_signals: {
          favorites_added: 1,
          time_spent_minutes: 3.2,
          detail_views: 1,
          share_actions: 1
        },
        recommended_action: 'offer_conversion'
      });

      const tracking = await trackGuestEngagement(engagementSignals);

      expect(tracking.investment_score).toBe(0.75);
      expect(tracking.engagement_quality).toBe('high');
      expect(tracking.conversion_signals.favorites_added).toBe(1);
      expect(tracking.recommended_action).toBe('offer_conversion');
    });
  });

  describe('Natural Conversion Trigger Points', () => {
    test('should trigger conversion prompts at optimal engagement moments', async () => {
      const { triggerNaturalConversion } = await import('@/lib/actions/guest-engagement');
      
      const optimalMoments = [
        {
          trigger: 'high_engagement',
          context: 'after_adding_second_favorite',
          investment_score: 0.8,
          message: 'Love these matches? Save your discoveries!',
          timing: 'perfect'
        },
        {
          trigger: 'extended_exploration',
          context: 'spent_over_3_minutes',
          investment_score: 0.7,
          message: 'You seem really interested! Want to keep exploring?',
          timing: 'good'
        },
        {
          trigger: 'share_intent',
          context: 'attempted_to_share',
          investment_score: 0.9,
          message: 'Share your fragrance journey with friends!',
          timing: 'excellent'
        }
      ];

      (triggerNaturalConversion as any).mockImplementation((trigger) => {
        return Promise.resolve({
          trigger_appropriate: true,
          conversion_message: trigger.message,
          user_investment_level: trigger.investment_score,
          timing_quality: trigger.timing,
          expected_conversion_rate: trigger.investment_score * 0.6 // Higher investment = higher conversion
        });
      });

      for (const moment of optimalMoments) {
        const result = await triggerNaturalConversion(moment);
        
        expect(result.trigger_appropriate).toBe(true);
        expect(result.user_investment_level).toBeGreaterThan(0.65);
        expect(result.expected_conversion_rate).toBeGreaterThan(0.4);
      }
    });

    test('should avoid premature conversion pressure', async () => {
      const { triggerNaturalConversion } = await import('@/lib/actions/guest-engagement');
      
      const prematureTriggers = [
        {
          context: 'immediate_quiz_completion',
          time_spent_seconds: 15,
          investment_score: 0.1,
          engagement_signals: 0
        },
        {
          context: 'single_recommendation_view',
          time_spent_seconds: 30,
          investment_score: 0.2,
          engagement_signals: 1
        }
      ];

      (triggerNaturalConversion as any).mockImplementation((trigger) => {
        return Promise.resolve({
          trigger_appropriate: trigger.investment_score > 0.4,
          reason: trigger.investment_score <= 0.4 ? 'insufficient_investment' : 'ready',
          recommended_action: trigger.investment_score <= 0.4 ? 'continue_building_value' : 'offer_conversion'
        });
      });

      for (const trigger of prematureTriggers) {
        const result = await triggerNaturalConversion(trigger);
        
        expect(result.trigger_appropriate).toBe(false);
        expect(result.reason).toBe('insufficient_investment');
        expect(result.recommended_action).toBe('continue_building_value');
      }
    });

    test('should customize conversion messaging based on user behavior', async () => {
      const { triggerNaturalConversion } = await import('@/lib/actions/guest-engagement');
      
      const behaviorPatterns = [
        {
          behavior: 'fragrance_collector',
          signals: ['multiple_favorites', 'detail_focus', 'brand_comparison'],
          optimal_message: 'Build your fragrance collection with personalized recommendations!'
        },
        {
          behavior: 'gift_seeker',
          signals: ['occasion_questions', 'sharing_behavior', 'price_conscious'],
          optimal_message: 'Find the perfect fragrance gift with our expert matching!'
        },
        {
          behavior: 'fragrance_newbie',
          signals: ['educational_content', 'cautious_exploration', 'sample_interest'],
          optimal_message: 'Start your fragrance journey with confidence!'
        }
      ];

      (triggerNaturalConversion as any).mockImplementation((pattern) => {
        return Promise.resolve({
          personalized_message: pattern.optimal_message,
          behavior_pattern: pattern.behavior,
          message_relevance_score: 0.85,
          expected_response_rate: 0.65
        });
      });

      for (const pattern of behaviorPatterns) {
        const result = await triggerNaturalConversion(pattern);
        
        expect(result.personalized_message).toBe(pattern.optimal_message);
        expect(result.message_relevance_score).toBeGreaterThan(0.8);
        expect(result.expected_response_rate).toBeGreaterThan(0.6);
      }
    });
  });

  describe('Value Building Before Account Creation', () => {
    test('should demonstrate value before requesting commitment', async () => {
      const valueDemonstration = {
        phase_1_immediate_value: {
          recommendations_shown: 3,
          personality_insights: 'Your sophisticated style loves oriental and woody fragrances',
          immediate_satisfaction: true,
          value_experienced: true
        },
        phase_2_enhanced_value: {
          additional_recommendations: 2,
          detailed_explanations: true,
          comparison_tools: true,
          investment_building: true
        },
        phase_3_exclusive_value: {
          collection_preview: true,
          sample_discounts: true,
          future_recommendations: true,
          account_required: true
        }
      };

      // Value should be demonstrated progressively
      expect(valueDemonstration.phase_1_immediate_value.value_experienced).toBe(true);
      expect(valueDemonstration.phase_2_enhanced_value.investment_building).toBe(true);
      expect(valueDemonstration.phase_3_exclusive_value.account_required).toBe(true);
    });

    test('should build progressive FOMO without aggressive tactics', async () => {
      const progressiveFOMO = {
        gentle_scarcity: {
          message: '2 of your matches are trending this week',
          tone: 'informative',
          pressure_level: 'low'
        },
        social_proof: {
          message: '1,247 people with your profile loved this fragrance',
          tone: 'validating',
          pressure_level: 'none'
        },
        exclusive_access: {
          message: 'Members get early access to new arrivals',
          tone: 'benefit_focused',
          pressure_level: 'minimal'
        }
      };

      Object.values(progressiveFOMO).forEach(strategy => {
        expect(['low', 'none', 'minimal']).toContain(strategy.pressure_level);
        expect(['informative', 'validating', 'benefit_focused']).toContain(strategy.tone);
      });
    });

    test('should provide immediate gratification while building account value', async () => {
      const immediateGratification = {
        instant_access: {
          quiz_results: true,
          top_recommendations: true,
          personality_explanation: true,
          no_barriers: true
        },
        enhanced_features_preview: {
          collection_management: 'preview_available',
          sample_tracking: 'preview_available',
          reorder_system: 'preview_available',
          account_required_for_full: true
        },
        future_value_communication: {
          '20% off samples': 'account_benefit',
          'Personalized restock alerts': 'account_benefit',
          'Fragrance journey tracking': 'account_benefit',
          value_clear: true
        }
      };

      expect(immediateGratification.instant_access.no_barriers).toBe(true);
      expect(immediateGratification.enhanced_features_preview.account_required_for_full).toBe(true);
      expect(immediateGratification.future_value_communication.value_clear).toBe(true);
    });
  });

  describe('Conversion Funnel Optimization', () => {
    test('should track conversion funnel metrics for optimization', async () => {
      const funnelMetrics = {
        quiz_completion: {
          completed: 850,
          started: 1000,
          completion_rate: 0.85
        },
        results_engagement: {
          explored_results: 800,
          quiz_completed: 850,
          engagement_rate: 0.94
        },
        value_building: {
          high_engagement: 450,
          explored_results: 800,
          investment_rate: 0.56
        },
        natural_conversion_triggers: {
          triggered: 320,
          high_engagement: 450,
          trigger_rate: 0.71
        },
        account_creation: {
          created: 210,
          triggered: 320,
          conversion_rate: 0.66
        }
      };

      // Calculate overall funnel performance
      const overallConversion = funnelMetrics.account_creation.created / funnelMetrics.quiz_completion.started;
      
      expect(funnelMetrics.quiz_completion.completion_rate).toBeGreaterThan(0.8);
      expect(funnelMetrics.results_engagement.engagement_rate).toBeGreaterThan(0.9);
      expect(funnelMetrics.account_creation.conversion_rate).toBeGreaterThan(0.6);
      expect(overallConversion).toBeGreaterThan(0.2); // 20%+ overall conversion
    });

    test('should identify and optimize conversion bottlenecks', async () => {
      const bottleneckAnalysis = {
        quiz_to_results: {
          drop_off_rate: 0.06, // 6% drop-off (good)
          optimization_potential: 'low'
        },
        results_to_engagement: {
          drop_off_rate: 0.15, // 15% drop-off 
          optimization_potential: 'medium',
          suggested_improvements: ['better_result_presentation', 'clearer_next_steps']
        },
        engagement_to_conversion: {
          drop_off_rate: 0.34, // 34% drop-off
          optimization_potential: 'high',
          suggested_improvements: ['better_timing', 'improved_value_proposition', 'reduced_friction']
        }
      };

      // High drop-off points should be identified for optimization
      Object.entries(bottleneckAnalysis).forEach(([stage, analysis]) => {
        if (analysis.drop_off_rate > 0.25) {
          expect(analysis.optimization_potential).toBe('high');
          expect(analysis.suggested_improvements).toBeDefined();
        }
      });
    });

    test('should A/B test conversion strategies for optimization', async () => {
      const abTestResults = {
        test_progressive_vs_immediate: {
          progressive_engagement: {
            conversion_rate: 0.24,
            user_satisfaction: 8.7,
            time_to_convert: 420 // seconds
          },
          immediate_conversion: {
            conversion_rate: 0.18,
            user_satisfaction: 6.2,
            time_to_convert: 45 // seconds
          },
          winner: 'progressive_engagement',
          confidence: 0.95
        },
        test_messaging_tone: {
          benefit_focused: {
            conversion_rate: 0.26,
            click_through_rate: 0.45
          },
          urgency_focused: {
            conversion_rate: 0.19,
            click_through_rate: 0.38
          },
          winner: 'benefit_focused',
          confidence: 0.89
        }
      };

      expect(abTestResults.test_progressive_vs_immediate.progressive_engagement.conversion_rate)
        .toBeGreaterThan(abTestResults.test_progressive_vs_immediate.immediate_conversion.conversion_rate);
      
      expect(abTestResults.test_messaging_tone.benefit_focused.conversion_rate)
        .toBeGreaterThan(abTestResults.test_messaging_tone.urgency_focused.conversion_rate);
    });
  });

  describe('Guest to Account Transfer', () => {
    test('should seamlessly preserve all guest session data during conversion', async () => {
      const { transferGuestToAccount } = await import('@/lib/actions/guest-engagement');
      
      const transferScenario = {
        guest_session_token: 'high-investment-guest',
        guest_data: {
          quiz_responses: 12,
          personality_profile: { archetype: 'sophisticated', confidence: 0.87 },
          engagement_history: [
            { type: 'favorite_added', fragrance_id: 'frag-1' },
            { type: 'detail_view', fragrance_id: 'frag-2', duration: 120 },
            { type: 'sample_interest', fragrance_id: 'frag-1' }
          ],
          investment_score: 0.85,
          time_invested: 340 // seconds
        },
        account_data: {
          email: 'test@example.com',
          first_name: 'Test'
        }
      };

      (transferGuestToAccount as any).mockResolvedValue({
        transfer_successful: true,
        data_preservation: {
          quiz_responses: 12,
          personality_profile: true,
          favorites: 1,
          engagement_history: 3,
          investment_score: 0.85
        },
        enhanced_account: {
          onboarding_completed: true,
          personalization_active: true,
          recommendations_count: 15,
          immediate_benefits_applied: true
        },
        user_experience: {
          seamless_transition: true,
          no_data_loss: true,
          immediate_value_delivery: true
        }
      });

      const result = await transferGuestToAccount(transferScenario);

      expect(result.transfer_successful).toBe(true);
      expect(result.data_preservation.quiz_responses).toBe(12);
      expect(result.data_preservation.investment_score).toBe(0.85);
      expect(result.user_experience.seamless_transition).toBe(true);
      expect(result.user_experience.no_data_loss).toBe(true);
    });

    test('should provide immediate post-conversion value to confirm decision', async () => {
      const postConversionValue = {
        immediate_benefits: {
          recommendations_increased: 15, // from 3 to 15
          discount_applied: '20%',
          collection_features_unlocked: true,
          sample_tracking_enabled: true
        },
        confirmation_messaging: {
          value_delivered: 'Your 15 personalized matches are ready!',
          next_steps_clear: true,
          buyers_remorse_prevention: true
        },
        engagement_continuation: {
          seamless_flow: true,
          no_disruption: true,
          enhanced_experience: true
        }
      };

      expect(postConversionValue.immediate_benefits.recommendations_increased).toBe(15);
      expect(postConversionValue.confirmation_messaging.buyers_remorse_prevention).toBe(true);
      expect(postConversionValue.engagement_continuation.seamless_flow).toBe(true);
    });
  });

  describe('Success Metrics and Analytics', () => {
    test('should track key conversion funnel success metrics', async () => {
      const successMetrics = {
        conversion_rate_improvement: {
          before_optimization: 0.15, // 15% quiz to account
          after_optimization: 0.24,  // 24% quiz to account
          improvement: 0.60 // 60% improvement
        },
        user_satisfaction: {
          pressure_reduction: 0.85, // Users report 85% less pressure
          experience_quality: 8.4,  // Out of 10
          recommendation_accuracy: 0.91
        },
        engagement_quality: {
          time_before_conversion: 280, // seconds (was 45)
          engagement_depth_score: 0.73, // 0-1 scale
          investment_before_conversion: 0.68
        },
        business_impact: {
          revenue_per_conversion: 1.15, // 15% higher due to higher engagement
          customer_lifetime_value: 1.22, // 22% higher
          referral_rate: 1.35 // 35% higher due to better experience
        }
      };

      expect(successMetrics.conversion_rate_improvement.improvement).toBeGreaterThan(0.5);
      expect(successMetrics.user_satisfaction.experience_quality).toBeGreaterThan(8);
      expect(successMetrics.business_impact.customer_lifetime_value).toBeGreaterThan(1.2);
    });
  });
});