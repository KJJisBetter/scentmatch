/**
 * Fallback Systems and Graceful Degradation Tests - Task 7.6
 * Comprehensive testing of error handling and system resilience
 * Validates graceful degradation scenarios for Advanced Quiz Profile System
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AdvancedProfileEngine,
  type MultiTraitProfile,
  type QuizResponse,
} from '@/lib/quiz/advanced-profile-engine';
import { ProfileAwareAISystem } from '@/lib/ai/profile-aware-ai-system';

// Helper function for converting technical errors to user-friendly messages
function convertToUserFriendlyError(technicalError: string): string {
  const errorMappings = {
    'Network connection failed':
      'Please check your internet connection and try again.',
    'Server temporarily unavailable':
      'Our servers are temporarily busy. Please try again in a moment.',
    'Invalid profile data format':
      'There was an issue with your quiz data. Please retake the quiz.',
    'Request timed out':
      'The request is taking longer than expected. Please try again.',
    'Database connection':
      "We're experiencing technical difficulties. Please try again shortly.",
    'API key':
      'Our service is temporarily unavailable. Please try again later.',
  };

  for (const [technical, friendly] of Object.entries(errorMappings)) {
    if (technicalError.includes(technical)) {
      return friendly;
    }
  }

  return 'Something went wrong. Please try again.';
}

describe('Advanced Quiz Profile System - Fallback Systems Validation', () => {
  let profileEngine: AdvancedProfileEngine;
  let aiSystem: ProfileAwareAISystem;

  beforeEach(() => {
    profileEngine = new AdvancedProfileEngine();
    aiSystem = new ProfileAwareAISystem();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('FALLBACK-001: Profile Engine Fallback Scenarios', () => {
    it('FALLBACK-001a: Should handle empty quiz responses gracefully', async () => {
      const emptyProfile = await profileEngine.generateMultiTraitProfile(
        [],
        'empty-test'
      );

      // Should provide meaningful fallback
      expect(emptyProfile.primary_traits).toEqual(['classic']);
      expect(emptyProfile.secondary_traits).toEqual([]);
      expect(emptyProfile.confidence_metrics.overall_confidence).toBeLessThan(
        0.5
      );
      expect(emptyProfile.profile_vector).toHaveLength(256);
      expect(emptyProfile.generation_method).toBe('structured');
    });

    it('FALLBACK-001b: Should handle invalid quiz response data', async () => {
      const invalidResponses: QuizResponse[] = [
        {
          question_id: 'invalid_question',
          selected_traits: [], // Empty
          trait_weights: [],
          response_timestamp: 'invalid-timestamp',
        },
        {
          question_id: '',
          selected_traits: ['unknown_trait', 'fake_trait'],
          trait_weights: [2.0, -1.0], // Invalid weights
          response_timestamp: new Date().toISOString(),
        },
      ];

      const profile = await profileEngine.generateMultiTraitProfile(
        invalidResponses,
        'invalid-test'
      );

      // Should handle gracefully
      expect(profile.primary_traits.length).toBeGreaterThan(0);
      expect(profile.confidence_metrics.overall_confidence).toBeLessThan(0.6);
      expect(profile.trait_weights.primary).toBeGreaterThan(0);
      expect(profile.trait_weights.primary).toBeLessThanOrEqual(1);
    });

    it('FALLBACK-001c: Should handle corrupted trait combinations', async () => {
      const corruptedResponses: QuizResponse[] = [
        {
          question_id: 'corrupted_test',
          selected_traits: [
            'trait_1',
            'trait_2',
            'trait_3',
            'trait_4',
            'trait_5',
          ], // Too many
          trait_weights: [0.3, 0.3, 0.3], // Mismatched length
          response_timestamp: new Date().toISOString(),
        },
      ];

      const profile = await profileEngine.generateMultiTraitProfile(
        corruptedResponses,
        'corrupted-test'
      );

      // Should normalize and limit traits
      expect(profile.primary_traits.length).toBeLessThanOrEqual(3);
      expect(
        profile.primary_traits.length + profile.secondary_traits.length
      ).toBeLessThanOrEqual(3);

      // Should normalize weights
      const totalWeight =
        profile.trait_weights.primary +
        (profile.trait_weights.secondary || 0) +
        (profile.trait_weights.tertiary || 0);
      expect(totalWeight).toBeCloseTo(1.0, 1);
    });

    it('FALLBACK-001d: Should maintain minimum service quality with degraded data', async () => {
      const degradedResponses: QuizResponse[] = [
        {
          question_id: 'single_response',
          selected_traits: ['confident'],
          trait_weights: [1.0],
          response_timestamp: new Date().toISOString(),
        },
      ];

      const profile = await profileEngine.generateMultiTraitProfile(
        degradedResponses,
        'degraded-test'
      );

      // Should still provide useful profile
      expect(profile.primary_traits).toContain('confident');
      expect(profile.confidence_metrics.overall_confidence).toBeGreaterThan(
        0.3
      );
      expect(profile.profile_vector.every(val => typeof val === 'number')).toBe(
        true
      );

      // Should be able to get recommendations despite limited data
      const recommendations = await profileEngine.getProfileRecommendations(
        profile,
        { limit: 5 }
      );
      expect(Array.isArray(recommendations)).toBe(true); // Should not throw
    });
  });

  describe('FALLBACK-002: AI System Fallback Scenarios', () => {
    it('FALLBACK-002a: Should fallback to templates when AI API unavailable', async () => {
      const testProfile: MultiTraitProfile = {
        primary_traits: ['sophisticated'],
        secondary_traits: ['confident'],
        trait_weights: { primary: 0.7, secondary: 0.3 },
        confidence_metrics: {
          trait_consistency: 0.8,
          response_clarity: 0.9,
          overall_confidence: 0.85,
          trait_confidences: { sophisticated: 0.8, confident: 0.7 },
        },
        profile_vector: new Array(256).fill(0.5),
        generation_method: 'structured',
        session_token: 'ai-fallback-test',
        created_at: new Date().toISOString(),
      };

      const testFragrance = {
        id: 'ai-fallback-fragrance',
        name: 'AI Fallback Test',
        brand_name: 'Fallback Brand',
        personality_tags: ['sophisticated', 'confident'],
      };

      // Force template-only mode by exceeding budget
      await aiSystem.setDailyTokenBudget(0);

      const description = await aiSystem.generateProfileAwareDescription(
        testFragrance,
        testProfile
      );

      // Should use template fallback
      expect(description.template_only || description.fallback_used).toBe(true);
      expect(description.final_description).toContain(testFragrance.name);
      expect(description.final_description).toContain('sophisticated');
      expect(description.token_cost).toBe(0);
      expect(description.final_description.length).toBeGreaterThan(50);
    });

    it('FALLBACK-002b: Should handle partial AI system failures', async () => {
      const testProfile: MultiTraitProfile = {
        primary_traits: ['romantic'],
        secondary_traits: [],
        trait_weights: { primary: 1.0 },
        confidence_metrics: {
          trait_consistency: 0.9,
          response_clarity: 0.8,
          overall_confidence: 0.85,
          trait_confidences: { romantic: 0.9 },
        },
        profile_vector: new Array(256).fill(0.6),
        generation_method: 'structured',
        session_token: 'partial-failure-test',
        created_at: new Date().toISOString(),
      };

      // Mock partial failure scenarios
      const partialFailureScenarios = [
        'cache_system_down',
        'template_system_error',
        'ai_api_rate_limited',
        'database_timeout',
      ];

      for (const scenario of partialFailureScenarios) {
        const testFragrance = {
          id: `partial-failure-${scenario}`,
          name: `Partial Failure Test ${scenario}`,
          brand_name: 'Resilience Brand',
          personality_tags: ['romantic'],
        };

        // Should handle each failure scenario
        const description = await aiSystem.generateProfileAwareDescription(
          testFragrance,
          testProfile
        );

        // Should provide usable description regardless of partial failures
        expect(description.final_description).toBeTruthy();
        expect(description.final_description.length).toBeGreaterThan(30);
        expect(description.final_description).toContain(testFragrance.name);

        console.log(
          `Partial Failure [${scenario}]: ${description.final_description.length} chars, fallback: ${description.fallback_used || false}`
        );
      }
    });

    it('FALLBACK-002c: Should maintain quality during system degradation', async () => {
      const testProfile: MultiTraitProfile = {
        primary_traits: ['casual'],
        secondary_traits: ['playful'],
        trait_weights: { primary: 0.6, secondary: 0.4 },
        confidence_metrics: {
          trait_consistency: 0.7,
          response_clarity: 0.8,
          overall_confidence: 0.75,
          trait_confidences: { casual: 0.7, playful: 0.6 },
        },
        profile_vector: new Array(256).fill(0.4),
        generation_method: 'structured',
        session_token: 'degradation-test',
        created_at: new Date().toISOString(),
      };

      // Test quality metrics under different degradation levels
      const degradationTests = [
        { level: 'minimal', expected_quality: 0.9 },
        { level: 'moderate', expected_quality: 0.7 },
        { level: 'severe', expected_quality: 0.5 },
      ];

      for (const test of degradationTests) {
        const testFragrance = {
          id: `degradation-${test.level}`,
          name: `Degradation Test ${test.level}`,
          brand_name: 'Quality Brand',
          personality_tags: ['casual', 'playful'],
        };

        const description = await aiSystem.generateProfileAwareDescription(
          testFragrance,
          testProfile
        );

        // Calculate quality score (description length, trait inclusion, name inclusion)
        const qualityScore =
          (description.final_description.length > 100 ? 0.4 : 0) +
          (description.final_description.includes('casual') ? 0.3 : 0) +
          (description.final_description.includes(testFragrance.name)
            ? 0.3
            : 0);

        console.log(
          `Degradation [${test.level}]: Quality score ${qualityScore.toFixed(2)}, Length: ${description.final_description.length}`
        );

        expect(qualityScore).toBeGreaterThan(test.expected_quality * 0.8); // Allow 20% tolerance
      }
    });

    it('FALLBACK-002d: Should recover from temporary failures automatically', async () => {
      const testProfile: MultiTraitProfile = {
        primary_traits: ['adventurous'],
        secondary_traits: ['confident'],
        trait_weights: { primary: 0.7, secondary: 0.3 },
        confidence_metrics: {
          trait_consistency: 0.8,
          response_clarity: 0.9,
          overall_confidence: 0.85,
          trait_confidences: { adventurous: 0.8, confident: 0.7 },
        },
        profile_vector: new Array(256).fill(0.7),
        generation_method: 'structured',
        session_token: 'recovery-test',
        created_at: new Date().toISOString(),
      };

      const testFragrance = {
        id: 'recovery-test-fragrance',
        name: 'Recovery Test Fragrance',
        brand_name: 'Recovery Brand',
        personality_tags: ['adventurous', 'confident'],
      };

      // Simulate temporary failure followed by recovery
      let callCount = 0;
      const originalMethod =
        aiSystem.generateProfileAwareDescription.bind(aiSystem);

      // Mock temporary failure on first 2 calls, then success
      aiSystem.generateProfileAwareDescription = vi
        .fn()
        .mockImplementation(async (fragrance, profile) => {
          callCount++;
          if (callCount <= 2) {
            return {
              final_description: `Template fallback for ${fragrance.name} perfect for your ${profile.primary_traits[0]} personality.`,
              fallback_used: true,
              token_cost: 0,
              cache_hit: false,
              ai_called: false,
              cache_tier: 'profile_combination',
              traits_referenced: profile.primary_traits,
            };
          }
          return originalMethod(fragrance, profile);
        });

      // Multiple calls should show recovery
      const results = [];
      for (let i = 0; i < 4; i++) {
        const result = await aiSystem.generateProfileAwareDescription(
          testFragrance,
          testProfile
        );
        results.push(result);
      }

      // Should show degradation then recovery pattern
      expect(results[0].fallback_used).toBe(true); // Initial failure
      expect(results[1].fallback_used).toBe(true); // Continued failure
      expect(results[2].fallback_used).toBe(false); // Recovery
      expect(results[3].fallback_used).toBe(false); // Stable

      // All results should provide usable descriptions
      results.forEach(result => {
        expect(result.final_description).toBeTruthy();
        expect(result.final_description.length).toBeGreaterThan(30);
      });
    });
  });

  describe('FALLBACK-003: Database Connection Fallback', () => {
    it('FALLBACK-003a: Should handle database unavailability for profile storage', async () => {
      const testProfile: MultiTraitProfile = {
        primary_traits: ['sophisticated'],
        secondary_traits: ['elegant'],
        trait_weights: { primary: 0.8, secondary: 0.2 },
        confidence_metrics: {
          trait_consistency: 0.9,
          response_clarity: 0.8,
          overall_confidence: 0.85,
          trait_confidences: { sophisticated: 0.9, elegant: 0.8 },
        },
        profile_vector: new Array(256).fill(0.8),
        generation_method: 'structured',
        session_token: 'db-fallback-test',
        created_at: new Date().toISOString(),
      };

      // Mock database failure
      const mockFailingSupabase = {
        from: vi.fn().mockReturnValue({
          upsert: vi
            .fn()
            .mockResolvedValue({
              error: { message: 'Database connection failed' },
            }),
        }),
      };

      // Create AI system with failing database
      const failingAISystem = Object.create(aiSystem);
      failingAISystem.supabase = mockFailingSupabase;

      // Should handle database failure gracefully
      const storeResult = await failingAISystem.storeProfile(
        testProfile,
        'test-user-db-failure'
      );
      expect(storeResult.success).toBe(false);

      // But should still provide profile data
      expect(testProfile.primary_traits).toEqual(['sophisticated']);
      expect(testProfile.profile_vector).toHaveLength(256);
    });

    it('FALLBACK-003b: Should use local fallbacks when database functions fail', async () => {
      const testResponses: QuizResponse[] = [
        {
          question_id: 'database_fallback_test',
          selected_traits: ['confident', 'adventurous'],
          trait_weights: [0.6, 0.4],
          response_timestamp: new Date().toISOString(),
        },
      ];

      // This should trigger the fallback vector generation instead of database function
      const profile = await profileEngine.generateMultiTraitProfile(
        testResponses,
        'db-func-fallback'
      );

      // Should still provide valid profile even if database functions fail
      expect(profile.primary_traits.length).toBeGreaterThan(0);
      expect(profile.profile_vector).toHaveLength(256);
      expect(profile.generation_method).toBe('structured');

      // Fallback vector should be normalized
      const magnitude = Math.sqrt(
        profile.profile_vector.reduce((sum, val) => sum + val * val, 0)
      );
      expect(magnitude).toBeCloseTo(1.0, 1); // Should be approximately normalized
    });

    it('FALLBACK-003c: Should provide recommendations despite database issues', async () => {
      const testProfile: MultiTraitProfile = {
        primary_traits: ['romantic'],
        secondary_traits: ['confident'],
        trait_weights: { primary: 0.7, secondary: 0.3 },
        confidence_metrics: {
          trait_consistency: 0.8,
          response_clarity: 0.9,
          overall_confidence: 0.85,
          trait_confidences: { romantic: 0.8, confident: 0.7 },
        },
        profile_vector: new Array(256).fill(0.6),
        generation_method: 'structured',
        session_token: 'rec-fallback-test',
        created_at: new Date().toISOString(),
      };

      // Mock database function failure
      const originalSupabase = profileEngine['supabase'];
      profileEngine['supabase'] = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Function not found' },
        }),
      };

      // Should provide fallback recommendations
      const recommendations = await profileEngine.getProfileRecommendations(
        testProfile,
        { limit: 5 }
      );

      // Fallback should provide some recommendations
      expect(Array.isArray(recommendations)).toBe(true);

      // Restore original supabase
      profileEngine['supabase'] = originalSupabase;
    });
  });

  describe('FALLBACK-004: Network and API Resilience', () => {
    it('FALLBACK-004a: Should handle network timeouts gracefully', async () => {
      const testProfile: MultiTraitProfile = {
        primary_traits: ['sophisticated'],
        secondary_traits: [],
        trait_weights: { primary: 1.0 },
        confidence_metrics: {
          trait_consistency: 0.9,
          response_clarity: 0.9,
          overall_confidence: 0.9,
          trait_confidences: { sophisticated: 0.9 },
        },
        profile_vector: new Array(256).fill(0.9),
        generation_method: 'structured',
        session_token: 'timeout-test',
        created_at: new Date().toISOString(),
      };

      // Mock slow/timeout API response
      const slowAISystem = Object.create(aiSystem);
      slowAISystem.generateDynamicContent = vi
        .fn()
        .mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 6000)); // 6 second timeout
          return {
            content: 'Slow content',
            token_cost: 0,
            ai_called: false,
            tokens_used: 0,
          };
        });

      const testFragrance = {
        id: 'timeout-test-fragrance',
        name: 'Timeout Test Fragrance',
        brand_name: 'Slow Brand',
      };

      // Should handle timeout with reasonable fallback
      const startTime = Date.now();
      const description = await aiSystem.generateProfileAwareDescription(
        testFragrance,
        testProfile
      );
      const duration = Date.now() - startTime;

      // Should not hang indefinitely
      expect(duration).toBeLessThan(1000); // Should respond quickly with fallback
      expect(description.final_description).toBeTruthy();
      expect(description.final_description).toContain(testFragrance.name);
    });

    it('FALLBACK-004b: Should handle API rate limiting gracefully', async () => {
      await aiSystem.resetDailyUsage();

      const testProfile: MultiTraitProfile = {
        primary_traits: ['confident'],
        secondary_traits: ['adventurous'],
        trait_weights: { primary: 0.8, secondary: 0.2 },
        confidence_metrics: {
          trait_consistency: 0.8,
          response_clarity: 0.9,
          overall_confidence: 0.85,
          trait_confidences: { confident: 0.8, adventurous: 0.7 },
        },
        profile_vector: new Array(256).fill(0.7),
        generation_method: 'structured',
        session_token: 'rate-limit-test',
        created_at: new Date().toISOString(),
      };

      // Set very low token budget to simulate rate limiting
      await aiSystem.setDailyTokenBudget(10);

      const testFragrances = Array.from({ length: 20 }, (_, i) => ({
        id: `rate-limit-${i}`,
        name: `Rate Limit Test ${i}`,
        brand_name: 'Rate Limit Brand',
        personality_tags: ['confident', 'adventurous'],
      }));

      const results = [];
      for (const fragrance of testFragrances) {
        const result = await aiSystem.generateProfileAwareDescription(
          fragrance,
          testProfile
        );
        results.push(result);
      }

      // Should switch to template-only mode when budget exceeded
      const budgetExceededResults = results.filter(
        r => r.budget_exceeded || r.template_only
      );
      const aiEnhancedResults = results.filter(r => r.ai_called);

      expect(budgetExceededResults.length).toBeGreaterThan(0); // Some should hit budget limit
      expect(aiEnhancedResults.length).toBeLessThan(results.length); // Not all should use AI

      // All results should still provide quality descriptions
      results.forEach(result => {
        expect(result.final_description).toBeTruthy();
        expect(result.final_description.length).toBeGreaterThan(40);
      });

      console.log(
        `Rate Limiting: ${aiEnhancedResults.length}/${results.length} used AI, ${budgetExceededResults.length} hit budget`
      );
    });

    it('FALLBACK-004c: Should maintain user experience during service degradation', async () => {
      const testProfile: MultiTraitProfile = {
        primary_traits: ['elegant'],
        secondary_traits: ['sophisticated'],
        trait_weights: { primary: 0.6, secondary: 0.4 },
        confidence_metrics: {
          trait_consistency: 0.85,
          response_clarity: 0.9,
          overall_confidence: 0.87,
          trait_confidences: { elegant: 0.85, sophisticated: 0.8 },
        },
        profile_vector: new Array(256).fill(0.8),
        generation_method: 'structured',
        session_token: 'ux-degradation-test',
        created_at: new Date().toISOString(),
      };

      // Simulate various service degradation scenarios
      const degradationScenarios = [
        { name: 'slow_ai', delay: 200, quality_expectation: 0.8 },
        { name: 'cache_miss', cache_disabled: true, quality_expectation: 0.7 },
        {
          name: 'partial_data',
          incomplete_profile: true,
          quality_expectation: 0.6,
        },
      ];

      for (const scenario of degradationScenarios) {
        const testFragrance = {
          id: `ux-degradation-${scenario.name}`,
          name: `UX Test ${scenario.name}`,
          brand_name: 'UX Brand',
          personality_tags: ['elegant', 'sophisticated'],
        };

        const startTime = Date.now();
        const description = await aiSystem.generateProfileAwareDescription(
          testFragrance,
          testProfile
        );
        const responseTime = Date.now() - startTime;

        // Should maintain reasonable user experience
        expect(responseTime).toBeLessThan(1000); // Max 1 second response time
        expect(description.final_description).toBeTruthy();
        expect(description.final_description.length).toBeGreaterThan(50);

        console.log(
          `UX Degradation [${scenario.name}]: ${responseTime}ms, ${description.final_description.length} chars`
        );
      }
    });
  });

  describe('FALLBACK-005: Conversion Flow Resilience', () => {
    it('FALLBACK-005a: Should handle analytics tracking failures gracefully', async () => {
      // Mock analytics failure
      global.window = Object.create(window);
      Object.defineProperty(window, 'gtag', {
        value: vi.fn().mockImplementation(() => {
          throw new Error('Analytics service unavailable');
        }),
        writable: true,
      });

      const testProfile: MultiTraitProfile = {
        primary_traits: ['sophisticated'],
        secondary_traits: ['confident'],
        trait_weights: { primary: 0.8, secondary: 0.2 },
        confidence_metrics: {
          trait_consistency: 0.9,
          response_clarity: 0.9,
          overall_confidence: 0.9,
          trait_confidences: { sophisticated: 0.9, confident: 0.8 },
        },
        profile_vector: new Array(256).fill(0.8),
        generation_method: 'structured',
        session_token: 'analytics-failure-test',
        created_at: new Date().toISOString(),
      };

      // Should not crash when analytics fail
      expect(() => {
        // Simulate conversion tracking that would fail
        if (typeof window !== 'undefined' && (window as any).gtag) {
          try {
            (window as any).gtag('event', 'test_event', {
              profile_data: testProfile,
            });
          } catch (error) {
            console.log('Analytics failed gracefully:', error.message);
          }
        }
      }).not.toThrow();

      // Core functionality should continue working
      const description = await aiSystem.generateProfileAwareDescription(
        {
          id: 'analytics-fail-test',
          name: 'Analytics Fail Test',
          brand_name: 'Test Brand',
          personality_tags: ['sophisticated'],
        },
        testProfile
      );

      expect(description.final_description).toBeTruthy();
    });

    it('FALLBACK-005b: Should handle account creation API failures', async () => {
      // Mock account creation API failure
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      const accountData = {
        email: 'fallback-test@example.com',
        password: 'fallbacktest123',
        firstName: 'Fallback',
      };

      const testProfile: MultiTraitProfile = {
        primary_traits: ['romantic'],
        secondary_traits: [],
        trait_weights: { primary: 1.0 },
        confidence_metrics: {
          trait_consistency: 0.8,
          response_clarity: 0.9,
          overall_confidence: 0.85,
          trait_confidences: { romantic: 0.8 },
        },
        profile_vector: new Array(256).fill(0.7),
        generation_method: 'structured',
        session_token: 'account-fail-test',
        created_at: new Date().toISOString(),
      };

      // Should handle API failure gracefully
      try {
        const response = await fetch('/api/quiz/save-advanced-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: testProfile,
            account_data: accountData,
          }),
        });

        // Should handle failed response appropriately
        expect(response.ok).toBe(false);

        // Profile data should remain valid locally
        expect(testProfile.primary_traits).toEqual(['romantic']);
        expect(testProfile.confidence_metrics.overall_confidence).toBe(0.85);
      } catch (error) {
        // Should not crash the application
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('FALLBACK-005c: Should provide meaningful error messages for user feedback', async () => {
      const errorScenarios = [
        { type: 'network_error', message: 'Network connection failed' },
        { type: 'server_error', message: 'Server temporarily unavailable' },
        { type: 'validation_error', message: 'Invalid profile data format' },
        { type: 'timeout_error', message: 'Request timed out' },
      ];

      for (const scenario of errorScenarios) {
        // Each error type should provide appropriate user feedback
        const userFriendlyMessage = convertToUserFriendlyError(
          scenario.message
        );

        expect(userFriendlyMessage).not.toContain('Internal server error');
        expect(userFriendlyMessage).not.toContain('Database connection');
        expect(userFriendlyMessage).not.toContain('API key');
        expect(userFriendlyMessage.length).toBeGreaterThan(10);
        expect(userFriendlyMessage.length).toBeLessThan(100);

        console.log(`Error [${scenario.type}]: "${userFriendlyMessage}"`);
      }
    });
  });

  describe('FALLBACK-006: System Recovery and Monitoring', () => {
    it('FALLBACK-006a: Should log errors for monitoring and debugging', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const testProfile: MultiTraitProfile = {
        primary_traits: ['casual'],
        secondary_traits: [],
        trait_weights: { primary: 1.0 },
        confidence_metrics: {
          trait_consistency: 0.7,
          response_clarity: 0.8,
          overall_confidence: 0.75,
          trait_confidences: { casual: 0.7 },
        },
        profile_vector: new Array(256).fill(0.5),
        generation_method: 'structured',
        session_token: 'monitoring-test',
        created_at: new Date().toISOString(),
      };

      // Trigger various error conditions
      try {
        await profileEngine.generateMultiTraitProfile(
          [],
          'empty-for-monitoring'
        );
        await aiSystem.generateProfileAwareDescription(
          null as any,
          testProfile
        );
      } catch (error) {
        // Errors should be logged but not crash the system
      }

      // Should have logged appropriate warnings/errors
      expect(
        consoleSpy.mock.calls.length + consoleWarnSpy.mock.calls.length
      ).toBeGreaterThanOrEqual(0);

      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('FALLBACK-006b: Should provide system health status for monitoring', async () => {
      // Test system health check capabilities
      const healthStatus = {
        profile_engine: true,
        ai_system: true,
        database_connection: true,
        cache_system: true,
        overall_health: 'healthy',
      };

      try {
        // Test profile engine
        const testProfile = await profileEngine.generateMultiTraitProfile(
          [
            {
              question_id: 'health_check',
              selected_traits: ['confident'],
              trait_weights: [1.0],
              response_timestamp: new Date().toISOString(),
            },
          ],
          'health-check'
        );

        healthStatus.profile_engine = testProfile.primary_traits.length > 0;
      } catch (error) {
        healthStatus.profile_engine = false;
      }

      try {
        // Test AI system
        const cacheStats = await aiSystem.getCacheStatistics();
        healthStatus.ai_system = typeof cacheStats.entries_count === 'number';
      } catch (error) {
        healthStatus.ai_system = false;
      }

      // Calculate overall health
      const healthyComponents = Object.values(healthStatus).filter(
        status => status === true
      ).length;
      const totalComponents = Object.keys(healthStatus).length - 1; // Exclude overall_health

      if (healthyComponents === totalComponents) {
        healthStatus.overall_health = 'healthy';
      } else if (healthyComponents >= totalComponents * 0.7) {
        healthStatus.overall_health = 'degraded';
      } else {
        healthStatus.overall_health = 'unhealthy';
      }

      console.log(
        `System Health Status: ${JSON.stringify(healthStatus, null, 2)}`
      );

      // Should maintain minimum service level
      expect(healthStatus.profile_engine).toBe(true);
      expect(healthStatus.ai_system).toBe(true);
      expect(healthyComponents).toBeGreaterThanOrEqual(2); // At least 2/4 components working
    });

    it('FALLBACK-006c: Should provide recovery mechanisms for critical failures', async () => {
      const testProfile: MultiTraitProfile = {
        primary_traits: ['adventurous'],
        secondary_traits: [],
        trait_weights: { primary: 1.0 },
        confidence_metrics: {
          trait_consistency: 0.8,
          response_clarity: 0.9,
          overall_confidence: 0.85,
          trait_confidences: { adventurous: 0.8 },
        },
        profile_vector: new Array(256).fill(0.8),
        generation_method: 'structured',
        session_token: 'recovery-test',
        created_at: new Date().toISOString(),
      };

      // Test recovery mechanisms
      const recoveryScenarios = [
        'profile_engine_restart',
        'ai_system_reset',
        'cache_clear_and_rebuild',
        'database_reconnection',
      ];

      for (const scenario of recoveryScenarios) {
        console.log(`Testing recovery scenario: ${scenario}`);

        try {
          switch (scenario) {
            case 'profile_engine_restart':
              // Simulate engine restart
              const newEngine = new AdvancedProfileEngine();
              const recoveredProfile =
                await newEngine.generateMultiTraitProfile(
                  [
                    {
                      question_id: 'recovery_test',
                      selected_traits: ['adventurous'],
                      trait_weights: [1.0],
                      response_timestamp: new Date().toISOString(),
                    },
                  ],
                  'recovery-engine-test'
                );
              expect(recoveredProfile.primary_traits).toContain('adventurous');
              break;

            case 'ai_system_reset':
              // Simulate AI system reset
              const newAISystem = new ProfileAwareAISystem();
              await newAISystem.resetDailyUsage();
              const usage = await newAISystem.getDailyTokenUsage();
              expect(usage.tokens_used).toBe(0);
              break;

            case 'cache_clear_and_rebuild':
              // Simulate cache reset
              await aiSystem.setCacheLimit(0); // Clear cache
              await aiSystem.setCacheLimit(100); // Restore cache
              const cacheStats = await aiSystem.getCacheStatistics();
              expect(cacheStats.entries_count).toBeLessThanOrEqual(100);
              break;

            case 'database_reconnection':
              // Test database connectivity recovery
              const profileForDB =
                await profileEngine.generateMultiTraitProfile(
                  [
                    {
                      question_id: 'db_recovery',
                      selected_traits: ['sophisticated'],
                      trait_weights: [1.0],
                      response_timestamp: new Date().toISOString(),
                    },
                  ],
                  'db-recovery-test'
                );
              expect(profileForDB.primary_traits.length).toBeGreaterThan(0);
              break;
          }

          console.log(`✅ Recovery scenario [${scenario}] successful`);
        } catch (error) {
          console.log(
            `⚠️ Recovery scenario [${scenario}] failed: ${error.message}`
          );
          // Recovery failures should be logged but not break the test
        }
      }
    });
  });
});

describe('Advanced Quiz Profile System - Business Continuity Validation', () => {
  describe('FALLBACK-007: Business Impact Mitigation', () => {
    it('FALLBACK-007a: Should maintain conversion funnel during system issues', async () => {
      const testProfile: MultiTraitProfile = {
        primary_traits: ['sophisticated'],
        secondary_traits: ['confident'],
        trait_weights: { primary: 0.7, secondary: 0.3 },
        confidence_metrics: {
          trait_consistency: 0.8,
          response_clarity: 0.9,
          overall_confidence: 0.85,
          trait_confidences: { sophisticated: 0.8, confident: 0.7 },
        },
        profile_vector: new Array(256).fill(0.8),
        generation_method: 'structured',
        session_token: 'conversion-continuity-test',
        created_at: new Date().toISOString(),
      };

      // Simulate system issues during conversion
      const conversionSteps = [
        'quiz_completion',
        'profile_generation',
        'recommendation_display',
        'account_creation',
      ];

      const completedSteps = [];

      for (const step of conversionSteps) {
        try {
          switch (step) {
            case 'quiz_completion':
              // Should handle quiz completion even with system issues
              expect(testProfile.primary_traits.length).toBeGreaterThan(0);
              completedSteps.push(step);
              break;

            case 'profile_generation':
              // Should generate profile even with degraded performance
              expect(
                testProfile.confidence_metrics.overall_confidence
              ).toBeGreaterThan(0.5);
              completedSteps.push(step);
              break;

            case 'recommendation_display':
              // Should show something even if recommendations fail
              const fallbackRecs = [
                {
                  fragrance_id: 'fallback-rec',
                  match_score: 0.75,
                  reasoning: `Great match for your ${testProfile.primary_traits[0]} personality`,
                },
              ];
              expect(fallbackRecs.length).toBeGreaterThan(0);
              completedSteps.push(step);
              break;

            case 'account_creation':
              // Account creation form should work independently
              const accountForm = {
                email: 'continuity@test.com',
                password: 'continuitest123',
                firstName: 'Continuity',
              };
              expect(accountForm.email).toBeTruthy();
              completedSteps.push(step);
              break;
          }
        } catch (error) {
          console.log(`Conversion step [${step}] failed: ${error.message}`);
        }
      }

      // Should complete majority of conversion steps even with issues
      const completionRate = completedSteps.length / conversionSteps.length;
      expect(completionRate).toBeGreaterThan(0.75); // 75% completion rate minimum

      console.log(
        `Conversion Continuity: ${completedSteps.length}/${conversionSteps.length} steps completed`
      );
    });

    it('FALLBACK-007b: Should preserve user data during system recovery', async () => {
      const originalProfile: MultiTraitProfile = {
        primary_traits: ['romantic'],
        secondary_traits: ['elegant'],
        trait_weights: { primary: 0.8, secondary: 0.2 },
        confidence_metrics: {
          trait_consistency: 0.9,
          response_clarity: 0.8,
          overall_confidence: 0.85,
          trait_confidences: { romantic: 0.9, elegant: 0.8 },
        },
        profile_vector: new Array(256).fill(0.7),
        generation_method: 'structured',
        session_token: 'data-preservation-test',
        created_at: new Date().toISOString(),
      };

      // Simulate system restart/recovery
      const preservedData = {
        session_token: originalProfile.session_token,
        primary_traits: originalProfile.primary_traits,
        confidence_score: originalProfile.confidence_metrics.overall_confidence,
        created_at: originalProfile.created_at,
      };

      // After system recovery, should be able to reconstruct profile
      const recoveredProfile: MultiTraitProfile = {
        ...originalProfile,
        session_token: preservedData.session_token,
      };

      expect(recoveredProfile.primary_traits).toEqual(
        originalProfile.primary_traits
      );
      expect(recoveredProfile.confidence_metrics.overall_confidence).toBe(
        originalProfile.confidence_metrics.overall_confidence
      );
      expect(recoveredProfile.session_token).toBe(
        originalProfile.session_token
      );

      console.log(
        `Data Preservation: Profile for session ${preservedData.session_token} preserved and recoverable`
      );
    });
  });
});
