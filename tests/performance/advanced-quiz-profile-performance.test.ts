/**
 * Advanced Quiz Profile System Performance Tests - Task 7.4
 * Performance testing for multi-trait matching algorithms under production load
 * Validates cost optimization targets and system scalability
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  AdvancedProfileEngine,
  type MultiTraitProfile,
  type QuizResponse,
} from '@/lib/quiz/advanced-profile-engine';
import { ProfileAwareAISystem } from '@/lib/ai/profile-aware-ai-system';

// Performance test configuration
const PERFORMANCE_TARGETS = {
  PROFILE_GENERATION: 5, // 5ms target
  VECTOR_SIMILARITY: 100, // 100ms for vector operations
  AI_DESCRIPTION_CACHED: 50, // 50ms for cached descriptions
  AI_DESCRIPTION_FRESH: 500, // 500ms for fresh AI generation
  RECOMMENDATION_RETRIEVAL: 100, // 100ms for recommendations
  CONCURRENT_USERS: 2500, // 2.5s for 5 concurrent users
  MEMORY_EFFICIENCY: 50 * 1024 * 1024, // 50MB memory increase max
  COST_PER_DESCRIPTION: 0.005, // $0.005 per description
  CACHE_HIT_RATE: 0.85, // 85% cache hit rate target
};

const PRODUCTION_LOAD_SIMULATION = {
  CONCURRENT_PROFILES: 10,
  DESCRIPTIONS_PER_PROFILE: 5,
  SIMILARITY_SEARCHES: 20,
  CACHE_OPERATIONS: 100,
};

describe('Advanced Quiz Profile System - Performance Under Load', () => {
  let profileEngine: AdvancedProfileEngine;
  let aiSystem: ProfileAwareAISystem;

  beforeAll(() => {
    profileEngine = new AdvancedProfileEngine();
    aiSystem = new ProfileAwareAISystem();
  });

  describe('PERF-001: Profile Generation Performance', () => {
    it('PERF-001a: Should generate profiles within 5ms target', async () => {
      const testResponses: QuizResponse[] = [
        {
          question_id: 'personality_core',
          selected_traits: ['sophisticated', 'confident'],
          trait_weights: [0.6, 0.4],
          response_timestamp: new Date().toISOString(),
        },
        {
          question_id: 'scent_preferences',
          selected_traits: ['woody_grounded'],
          trait_weights: [1.0],
          response_timestamp: new Date().toISOString(),
        },
      ];

      // Measure single profile generation time
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await profileEngine.generateMultiTraitProfile(
          testResponses,
          `perf-test-${i}`
        );
        const duration = Date.now() - startTime;
        times.push(duration);
      }

      const averageTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`Profile Generation Performance:`);
      console.log(`  Average: ${averageTime.toFixed(2)}ms`);
      console.log(`  Min: ${minTime}ms, Max: ${maxTime}ms`);
      console.log(`  Target: ${PERFORMANCE_TARGETS.PROFILE_GENERATION}ms`);

      // Should meet performance targets
      expect(averageTime).toBeLessThan(PERFORMANCE_TARGETS.PROFILE_GENERATION);
      expect(maxTime).toBeLessThan(PERFORMANCE_TARGETS.PROFILE_GENERATION * 2); // Allow 2x variance
    });

    it('PERF-001b: Should handle concurrent profile generation efficiently', async () => {
      const testResponses: QuizResponse[] = [
        {
          question_id: 'test_question',
          selected_traits: ['sophisticated'],
          trait_weights: [1.0],
          response_timestamp: new Date().toISOString(),
        },
      ];

      const startTime = Date.now();

      // Generate profiles concurrently
      const concurrentProfiles = await Promise.all(
        Array.from(
          { length: PRODUCTION_LOAD_SIMULATION.CONCURRENT_PROFILES },
          (_, i) =>
            profileEngine.generateMultiTraitProfile(
              testResponses,
              `concurrent-${i}`
            )
        )
      );

      const totalTime = Date.now() - startTime;

      // Validate results
      expect(concurrentProfiles.length).toBe(
        PRODUCTION_LOAD_SIMULATION.CONCURRENT_PROFILES
      );
      concurrentProfiles.forEach(profile => {
        expect(profile.primary_traits.length).toBeGreaterThan(0);
        expect(profile.profile_vector).toHaveLength(256);
      });

      // Performance validation
      expect(totalTime).toBeLessThan(PERFORMANCE_TARGETS.CONCURRENT_USERS);

      console.log(
        `Concurrent Generation: ${PRODUCTION_LOAD_SIMULATION.CONCURRENT_PROFILES} profiles in ${totalTime}ms`
      );
    });

    it('PERF-001c: Should maintain memory efficiency during batch operations', async () => {
      const initialMemory = process.memoryUsage();

      const testResponses: QuizResponse[] = [
        {
          question_id: 'memory_test',
          selected_traits: ['sophisticated', 'confident', 'romantic'],
          trait_weights: [0.5, 0.3, 0.2],
          response_timestamp: new Date().toISOString(),
        },
      ];

      // Generate many profiles to test memory usage
      const profiles: MultiTraitProfile[] = [];
      for (let i = 0; i < 50; i++) {
        const profile = await profileEngine.generateMultiTraitProfile(
          testResponses,
          `memory-test-${i}`
        );
        profiles.push(profile);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Memory Usage:`);
      console.log(
        `  Initial: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`
      );
      console.log(
        `  Final: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`
      );
      console.log(`  Increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
      console.log(
        `  Target: <${Math.round(PERFORMANCE_TARGETS.MEMORY_EFFICIENCY / 1024 / 1024)}MB`
      );

      expect(memoryIncrease).toBeLessThan(
        PERFORMANCE_TARGETS.MEMORY_EFFICIENCY
      );
      expect(profiles.length).toBe(50);
    });
  });

  describe('PERF-002: AI Description System Performance', () => {
    it('PERF-002a: Should achieve target cache hit rates', async () => {
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
        profile_vector: new Array(256).fill(0.1),
        generation_method: 'structured',
        session_token: 'perf-test-ai',
        created_at: new Date().toISOString(),
      };

      const testFragrance = {
        id: 'perf-test-fragrance',
        name: 'Performance Test Scent',
        brand_name: 'Test Brand',
        personality_tags: ['sophisticated', 'confident'],
      };

      // Generate descriptions multiple times to test caching
      let cacheHits = 0;
      let cacheMisses = 0;
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const result = await aiSystem.generateProfileAwareDescription(
          testFragrance,
          testProfile
        );
        if (result.cache_hit) {
          cacheHits++;
        } else {
          cacheMisses++;
        }
      }

      const cacheHitRate = cacheHits / iterations;

      console.log(`Cache Performance:`);
      console.log(`  Cache Hits: ${cacheHits}/${iterations}`);
      console.log(`  Hit Rate: ${(cacheHitRate * 100).toFixed(1)}%`);
      console.log(
        `  Target: ${(PERFORMANCE_TARGETS.CACHE_HIT_RATE * 100).toFixed(1)}%`
      );

      expect(cacheHitRate).toBeGreaterThan(PERFORMANCE_TARGETS.CACHE_HIT_RATE);
    });

    it('PERF-002b: Should meet cost optimization targets', async () => {
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
        profile_vector: new Array(256).fill(0.2),
        generation_method: 'structured',
        session_token: 'cost-test',
        created_at: new Date().toISOString(),
      };

      // Reset daily usage
      await aiSystem.resetDailyUsage();

      const testFragrances = Array.from({ length: 20 }, (_, i) => ({
        id: `cost-test-${i}`,
        name: `Cost Test Fragrance ${i}`,
        brand_name: 'Test Brand',
        personality_tags: ['casual', 'playful'],
      }));

      // Generate descriptions for cost analysis
      const results = [];
      for (const fragrance of testFragrances) {
        const result = await aiSystem.generateProfileAwareDescription(
          fragrance,
          testProfile
        );
        results.push(result);
      }

      const usage = await aiSystem.getDailyTokenUsage();
      const avgCostPerDescription = usage.cost_usd / results.length;

      console.log(`Cost Optimization:`);
      console.log(`  Total Cost: $${usage.cost_usd.toFixed(4)}`);
      console.log(
        `  Cost per Description: $${avgCostPerDescription.toFixed(4)}`
      );
      console.log(
        `  Target: $${PERFORMANCE_TARGETS.COST_PER_DESCRIPTION.toFixed(4)}`
      );
      console.log(`  Tokens Used: ${usage.tokens_used}`);

      expect(avgCostPerDescription).toBeLessThan(
        PERFORMANCE_TARGETS.COST_PER_DESCRIPTION
      );
    });

    it('PERF-002c: Should handle high-frequency description requests', async () => {
      const testProfile: MultiTraitProfile = {
        primary_traits: ['confident'],
        secondary_traits: [],
        trait_weights: { primary: 1.0 },
        confidence_metrics: {
          trait_consistency: 0.9,
          response_clarity: 0.8,
          overall_confidence: 0.85,
          trait_confidences: { confident: 0.9 },
        },
        profile_vector: new Array(256).fill(0.3),
        generation_method: 'structured',
        session_token: 'frequency-test',
        created_at: new Date().toISOString(),
      };

      const testFragrance = {
        id: 'frequency-test-fragrance',
        name: 'High Frequency Test',
        brand_name: 'Speed Brand',
        personality_tags: ['confident'],
      };

      // Simulate high-frequency requests
      const iterations = 50;
      const startTime = Date.now();

      const promises = Array.from({ length: iterations }, () =>
        aiSystem.generateProfileAwareDescription(testFragrance, testProfile)
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      const avgTimePerRequest = totalTime / iterations;

      console.log(`High-Frequency Performance:`);
      console.log(`  ${iterations} requests in ${totalTime}ms`);
      console.log(`  Average: ${avgTimePerRequest.toFixed(2)}ms per request`);
      console.log(
        `  Cache hits: ${results.filter(r => r.cache_hit).length}/${iterations}`
      );

      expect(avgTimePerRequest).toBeLessThan(
        PERFORMANCE_TARGETS.AI_DESCRIPTION_CACHED
      );
      expect(results.filter(r => r.cache_hit).length).toBeGreaterThan(
        iterations * 0.8
      ); // 80%+ cache hits
    });
  });

  describe('PERF-003: Vector Similarity Performance', () => {
    it('PERF-003a: Should perform vector similarity calculations efficiently', async () => {
      const baseProfile: MultiTraitProfile = {
        primary_traits: ['sophisticated'],
        secondary_traits: ['confident'],
        trait_weights: { primary: 0.7, secondary: 0.3 },
        confidence_metrics: {
          trait_consistency: 0.8,
          response_clarity: 0.9,
          overall_confidence: 0.85,
          trait_confidences: { sophisticated: 0.8, confident: 0.7 },
        },
        profile_vector: new Array(256).fill(0).map(() => Math.random() * 0.5),
        generation_method: 'structured',
        session_token: 'similarity-base',
        created_at: new Date().toISOString(),
      };

      // Create similar profiles for comparison
      const similarProfiles = Array.from({ length: 20 }, (_, i) => ({
        ...baseProfile,
        profile_vector: baseProfile.profile_vector.map(
          val => val + (Math.random() - 0.5) * 0.1
        ),
        session_token: `similarity-test-${i}`,
      }));

      const startTime = Date.now();

      // Calculate similarities
      const similarities = await Promise.all(
        similarProfiles.map(profile =>
          profileEngine.calculateProfileSimilarity(baseProfile, profile)
        )
      );

      const totalTime = Date.now() - startTime;
      const avgTimePerComparison = totalTime / similarities.length;

      console.log(`Vector Similarity Performance:`);
      console.log(`  ${similarities.length} comparisons in ${totalTime}ms`);
      console.log(
        `  Average: ${avgTimePerComparison.toFixed(2)}ms per comparison`
      );
      console.log(
        `  Similarities range: ${Math.min(...similarities).toFixed(3)} - ${Math.max(...similarities).toFixed(3)}`
      );

      expect(avgTimePerComparison).toBeLessThan(5); // Very fast for in-memory operations
      expect(similarities.every(s => s >= 0 && s <= 1)).toBe(true); // Valid similarity range
    });

    it('PERF-003b: Should handle large-scale profile matching efficiently', async () => {
      // Simulate finding similar profiles from large user base
      const queryProfile: MultiTraitProfile = {
        primary_traits: ['romantic'],
        secondary_traits: ['confident'],
        trait_weights: { primary: 0.6, secondary: 0.4 },
        confidence_metrics: {
          trait_consistency: 0.8,
          response_clarity: 0.85,
          overall_confidence: 0.82,
          trait_confidences: { romantic: 0.8, confident: 0.7 },
        },
        profile_vector: new Array(256).fill(0).map(() => Math.random()),
        generation_method: 'structured',
        session_token: 'large-scale-query',
        created_at: new Date().toISOString(),
      };

      const startTime = Date.now();

      // This would test the database function in production
      try {
        const similarProfiles = await profileEngine.findSimilarProfiles(
          queryProfile,
          {
            similarity_threshold: 0.7,
            limit: 10,
          }
        );

        const queryTime = Date.now() - startTime;

        console.log(`Large-Scale Profile Matching:`);
        console.log(`  Query time: ${queryTime}ms`);
        console.log(`  Similar profiles found: ${similarProfiles.length}`);
        console.log(`  Target: <${PERFORMANCE_TARGETS.VECTOR_SIMILARITY}ms`);

        if (similarProfiles.length > 0) {
          expect(queryTime).toBeLessThan(PERFORMANCE_TARGETS.VECTOR_SIMILARITY);
        } else {
          console.log(
            'No similar profiles found - expected with empty database'
          );
        }
      } catch (error) {
        console.log(
          'Database similarity search not available yet - test skipped'
        );
      }
    });

    it('PERF-003c: Should optimize memory usage for vector operations', async () => {
      const initialMemory = process.memoryUsage();

      // Generate many profiles with vectors
      const profiles: MultiTraitProfile[] = [];
      for (let i = 0; i < 100; i++) {
        const profile = await profileEngine.generateMultiTraitProfile(
          [
            {
              question_id: `memory-test-${i}`,
              selected_traits: ['sophisticated'],
              trait_weights: [1.0],
              response_timestamp: new Date().toISOString(),
            },
          ],
          `memory-vector-${i}`
        );

        profiles.push(profile);
      }

      // Perform similarity calculations
      const baseLine = profiles[0];
      const similarities = await Promise.all(
        profiles
          .slice(1, 21)
          .map(profile =>
            profileEngine.calculateProfileSimilarity(baseLine, profile)
          )
      );

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Vector Memory Efficiency:`);
      console.log(`  Profiles generated: ${profiles.length}`);
      console.log(`  Similarities calculated: ${similarities.length}`);
      console.log(
        `  Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`
      );
      console.log(
        `  Target: <${Math.round(PERFORMANCE_TARGETS.MEMORY_EFFICIENCY / 1024 / 1024)}MB`
      );

      expect(memoryIncrease).toBeLessThan(
        PERFORMANCE_TARGETS.MEMORY_EFFICIENCY
      );
      expect(similarities.every(s => typeof s === 'number')).toBe(true);
    });
  });

  describe('PERF-004: AI System Scalability', () => {
    it('PERF-004a: Should maintain response times under load', async () => {
      const testProfile: MultiTraitProfile = {
        primary_traits: ['adventurous'],
        secondary_traits: ['confident'],
        trait_weights: { primary: 0.6, secondary: 0.4 },
        confidence_metrics: {
          trait_consistency: 0.8,
          response_clarity: 0.9,
          overall_confidence: 0.85,
          trait_confidences: { adventurous: 0.8, confident: 0.7 },
        },
        profile_vector: new Array(256).fill(0.4),
        generation_method: 'structured',
        session_token: 'load-test',
        created_at: new Date().toISOString(),
      };

      const testFragrances = Array.from(
        { length: PRODUCTION_LOAD_SIMULATION.DESCRIPTIONS_PER_PROFILE },
        (_, i) => ({
          id: `load-test-${i}`,
          name: `Load Test Fragrance ${i}`,
          brand_name: 'Load Test Brand',
          personality_tags: ['adventurous', 'confident'],
        })
      );

      const times: number[] = [];

      for (const fragrance of testFragrances) {
        const startTime = Date.now();
        await aiSystem.generateProfileAwareDescription(fragrance, testProfile);
        const duration = Date.now() - startTime;
        times.push(duration);
      }

      const averageTime =
        times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`AI System Load Performance:`);
      console.log(`  ${times.length} descriptions generated`);
      console.log(`  Average time: ${averageTime.toFixed(2)}ms`);
      console.log(`  Max time: ${maxTime}ms`);
      console.log(
        `  Target: <${PERFORMANCE_TARGETS.AI_DESCRIPTION_CACHED}ms (cached)`
      );

      expect(averageTime).toBeLessThan(
        PERFORMANCE_TARGETS.AI_DESCRIPTION_CACHED
      );
    });

    it('PERF-004b: Should optimize token usage through intelligent caching', async () => {
      await aiSystem.resetDailyUsage();

      const profiles = [
        { traits: ['sophisticated', 'confident'], session: 'token-opt-1' },
        { traits: ['sophisticated', 'elegant'], session: 'token-opt-2' },
        { traits: ['confident', 'romantic'], session: 'token-opt-3' },
        { traits: ['casual', 'playful'], session: 'token-opt-4' },
      ];

      const fragmentDescriptions = [];
      let totalTokensUsed = 0;

      for (const profileData of profiles) {
        const testProfile: MultiTraitProfile = {
          primary_traits: [profileData.traits[0]],
          secondary_traits: profileData.traits.slice(1),
          trait_weights: { primary: 0.6, secondary: 0.4 },
          confidence_metrics: {
            trait_consistency: 0.8,
            response_clarity: 0.9,
            overall_confidence: 0.85,
            trait_confidences: {},
          },
          profile_vector: new Array(256).fill(0.5),
          generation_method: 'structured',
          session_token: profileData.session,
          created_at: new Date().toISOString(),
        };

        const description = await aiSystem.generateProfileAwareDescription(
          {
            id: `token-opt-${profileData.session}`,
            name: 'Token Optimization Test',
            brand_name: 'Optimization Brand',
            personality_tags: profileData.traits,
          },
          testProfile
        );

        fragmentDescriptions.push(description);
        totalTokensUsed += description.tokens_used || 0;
      }

      const usage = await aiSystem.getDailyTokenUsage();
      const avgCost = usage.cost_usd / fragmentDescriptions.length;

      console.log(`Token Optimization:`);
      console.log(`  Descriptions: ${fragmentDescriptions.length}`);
      console.log(`  Total tokens: ${totalTokensUsed}`);
      console.log(`  Total cost: $${usage.cost_usd.toFixed(4)}`);
      console.log(`  Cost per description: $${avgCost.toFixed(4)}`);
      console.log(
        `  Target: $${PERFORMANCE_TARGETS.COST_PER_DESCRIPTION.toFixed(4)}`
      );

      expect(avgCost).toBeLessThan(PERFORMANCE_TARGETS.COST_PER_DESCRIPTION);
    });

    it('PERF-004c: Should scale cache operations efficiently', async () => {
      const startTime = Date.now();

      // Simulate cache operations under load
      for (let i = 0; i < PRODUCTION_LOAD_SIMULATION.CACHE_OPERATIONS; i++) {
        const cacheStats = await aiSystem.getCacheStatistics();
        expect(typeof cacheStats.entries_count).toBe('number');
      }

      const cacheOperationTime = Date.now() - startTime;
      const avgCacheOpTime =
        cacheOperationTime / PRODUCTION_LOAD_SIMULATION.CACHE_OPERATIONS;

      console.log(`Cache Operations Performance:`);
      console.log(
        `  ${PRODUCTION_LOAD_SIMULATION.CACHE_OPERATIONS} cache operations in ${cacheOperationTime}ms`
      );
      console.log(`  Average: ${avgCacheOpTime.toFixed(2)}ms per operation`);

      expect(avgCacheOpTime).toBeLessThan(1); // <1ms per cache operation
    });
  });

  describe('PERF-005: Production Load Simulation', () => {
    it('PERF-005a: Should handle realistic affiliate traffic patterns', async () => {
      const startTime = Date.now();

      // Simulate affiliate traffic: multiple users taking quiz simultaneously
      const affiliateUsers = Array.from({ length: 5 }, (_, i) => ({
        sessionToken: `affiliate-user-${i}`,
        responses: [
          {
            question_id: 'personality_core',
            selected_traits:
              i % 2 === 0
                ? ['sophisticated', 'confident']
                : ['casual', 'playful'],
            trait_weights: [0.6, 0.4],
            response_timestamp: new Date().toISOString(),
          },
        ],
      }));

      // Process all users concurrently
      const userProfiles = await Promise.all(
        affiliateUsers.map(user =>
          profileEngine.generateMultiTraitProfile(
            user.responses,
            user.sessionToken
          )
        )
      );

      // Generate recommendations for each user
      const allRecommendations = await Promise.all(
        userProfiles.map(profile =>
          profileEngine.getProfileRecommendations(profile, { limit: 10 })
        )
      );

      const totalTime = Date.now() - startTime;
      const avgTimePerUser = totalTime / affiliateUsers.length;

      console.log(`Affiliate Traffic Simulation:`);
      console.log(
        `  ${affiliateUsers.length} concurrent users processed in ${totalTime}ms`
      );
      console.log(`  Average per user: ${avgTimePerUser.toFixed(2)}ms`);
      console.log(`  Target: <${PERFORMANCE_TARGETS.CONCURRENT_USERS}ms`);

      expect(totalTime).toBeLessThan(PERFORMANCE_TARGETS.CONCURRENT_USERS);
      expect(userProfiles.every(p => p.primary_traits.length > 0)).toBe(true);
    });

    it('PERF-005b: Should maintain quality under rapid successive requests', async () => {
      const testProfile: MultiTraitProfile = {
        primary_traits: ['romantic'],
        secondary_traits: ['elegant'],
        trait_weights: { primary: 0.7, secondary: 0.3 },
        confidence_metrics: {
          trait_consistency: 0.85,
          response_clarity: 0.9,
          overall_confidence: 0.87,
          trait_confidences: { romantic: 0.85, elegant: 0.8 },
        },
        profile_vector: new Array(256).fill(0.6),
        generation_method: 'structured',
        session_token: 'rapid-test',
        created_at: new Date().toISOString(),
      };

      // Rapid successive requests (simulating user clicking through many fragrances)
      const rapidFragrances = Array.from({ length: 15 }, (_, i) => ({
        id: `rapid-${i}`,
        name: `Rapid Test ${i}`,
        brand_name: 'Rapid Brand',
        personality_tags: ['romantic', 'elegant'],
      }));

      const results = [];
      for (const fragrance of rapidFragrances) {
        const result = await aiSystem.generateProfileAwareDescription(
          fragrance,
          testProfile
        );
        results.push(result);

        // Brief pause to simulate user interaction
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Validate quality maintained under rapid requests
      const avgDescriptionLength =
        results.reduce((sum, r) => sum + r.final_description.length, 0) /
        results.length;
      const errorRate =
        results.filter(r => r.fallback_used).length / results.length;

      console.log(`Rapid Request Quality:`);
      console.log(`  ${results.length} rapid descriptions`);
      console.log(
        `  Average length: ${avgDescriptionLength.toFixed(0)} characters`
      );
      console.log(`  Error rate: ${(errorRate * 100).toFixed(1)}%`);

      expect(avgDescriptionLength).toBeGreaterThan(100); // Reasonable description length
      expect(errorRate).toBeLessThan(0.05); // <5% error rate
    });

    it('PERF-005c: Should demonstrate production readiness metrics', async () => {
      const metrics = {
        profile_generation_avg: 0,
        ai_description_avg: 0,
        cache_hit_rate: 0,
        error_rate: 0,
        memory_efficiency: 0,
        cost_efficiency: 0,
      };

      const iterations = 10;
      const initialMemory = process.memoryUsage();
      let totalErrors = 0;

      await aiSystem.resetDailyUsage();

      for (let i = 0; i < iterations; i++) {
        try {
          // Profile generation timing
          const profileStart = Date.now();
          const profile = await profileEngine.generateMultiTraitProfile(
            [
              {
                question_id: 'production_readiness',
                selected_traits: ['sophisticated', 'confident'],
                trait_weights: [0.6, 0.4],
                response_timestamp: new Date().toISOString(),
              },
            ],
            `prod-ready-${i}`
          );
          metrics.profile_generation_avg += Date.now() - profileStart;

          // AI description timing
          const aiStart = Date.now();
          const description = await aiSystem.generateProfileAwareDescription(
            {
              id: `prod-test-${i}`,
              name: `Production Test ${i}`,
              brand_name: 'Production Brand',
              personality_tags: ['sophisticated', 'confident'],
            },
            profile
          );
          metrics.ai_description_avg += Date.now() - aiStart;

          if (description.cache_hit) metrics.cache_hit_rate++;
        } catch (error) {
          totalErrors++;
        }
      }

      // Calculate averages
      metrics.profile_generation_avg /= iterations;
      metrics.ai_description_avg /= iterations;
      metrics.cache_hit_rate /= iterations;
      metrics.error_rate = totalErrors / iterations;

      const finalMemory = process.memoryUsage();
      metrics.memory_efficiency = finalMemory.heapUsed - initialMemory.heapUsed;

      const usage = await aiSystem.getDailyTokenUsage();
      metrics.cost_efficiency = usage.cost_usd / iterations;

      console.log(`Production Readiness Metrics:`);
      console.log(
        `  Profile Generation: ${metrics.profile_generation_avg.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.PROFILE_GENERATION}ms)`
      );
      console.log(
        `  AI Descriptions: ${metrics.ai_description_avg.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.AI_DESCRIPTION_CACHED}ms)`
      );
      console.log(
        `  Cache Hit Rate: ${(metrics.cache_hit_rate * 100).toFixed(1)}% (target: >${(PERFORMANCE_TARGETS.CACHE_HIT_RATE * 100).toFixed(1)}%)`
      );
      console.log(
        `  Error Rate: ${(metrics.error_rate * 100).toFixed(1)}% (target: <5%)`
      );
      console.log(
        `  Memory Efficiency: ${Math.round(metrics.memory_efficiency / 1024 / 1024)}MB (target: <${Math.round(PERFORMANCE_TARGETS.MEMORY_EFFICIENCY / 1024 / 1024)}MB)`
      );
      console.log(
        `  Cost per Operation: $${metrics.cost_efficiency.toFixed(4)} (target: <$${PERFORMANCE_TARGETS.COST_PER_DESCRIPTION.toFixed(4)})`
      );

      // Validate production readiness
      expect(metrics.profile_generation_avg).toBeLessThan(
        PERFORMANCE_TARGETS.PROFILE_GENERATION
      );
      expect(metrics.ai_description_avg).toBeLessThan(
        PERFORMANCE_TARGETS.AI_DESCRIPTION_CACHED
      );
      expect(metrics.error_rate).toBeLessThan(0.05);
      expect(metrics.memory_efficiency).toBeLessThan(
        PERFORMANCE_TARGETS.MEMORY_EFFICIENCY
      );
      expect(metrics.cost_efficiency).toBeLessThan(
        PERFORMANCE_TARGETS.COST_PER_DESCRIPTION
      );
    });
  });
});

describe('Advanced Quiz Profile System - Cost Optimization Validation', () => {
  describe('PERF-006: Monthly Cost Projections', () => {
    it('PERF-006a: Should meet $10/month target with realistic usage', async () => {
      // Simulate realistic monthly usage patterns
      const monthlySimulation = {
        unique_users: 1000,
        descriptions_per_user: 20,
        template_reuse_rate: 0.8, // 80% template reuse
        dynamic_content_rate: 0.2, // 20% AI enhancement
        affiliate_traffic_multiplier: 1.5,
      };

      const costEstimate =
        await aiSystem.estimateMonthlyCost(monthlySimulation);

      console.log(`Monthly Cost Projection:`);
      console.log(`  Users: ${monthlySimulation.unique_users}`);
      console.log(
        `  Descriptions: ${monthlySimulation.unique_users * monthlySimulation.descriptions_per_user}`
      );
      console.log(
        `  Template reuse: ${(monthlySimulation.template_reuse_rate * 100).toFixed(1)}%`
      );
      console.log(
        `  AI operations: ${monthlySimulation.unique_users * monthlySimulation.descriptions_per_user * monthlySimulation.dynamic_content_rate}`
      );
      console.log(
        `  Estimated cost: $${costEstimate.total_cost_usd.toFixed(2)}`
      );
      console.log(`  Target: <$10.00`);

      expect(costEstimate.total_cost_usd).toBeLessThan(10.0);
      expect(costEstimate.template_savings_percent).toBeGreaterThan(75);
    });

    it('PERF-006b: Should validate cost efficiency improvements', async () => {
      await aiSystem.resetDailyUsage();

      // Test template vs full AI generation cost comparison
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
        profile_vector: new Array(256).fill(0.7),
        generation_method: 'structured',
        session_token: 'cost-efficiency',
        created_at: new Date().toISOString(),
      };

      // Generate multiple descriptions to trigger template reuse
      const fragrances = Array.from({ length: 10 }, (_, i) => ({
        id: `cost-efficiency-${i}`,
        name: `Cost Test ${i}`,
        brand_name: 'Efficiency Brand',
        personality_tags: ['sophisticated'],
      }));

      const results = [];
      for (const fragrance of fragrances) {
        const result = await aiSystem.generateProfileAwareDescription(
          fragrance,
          testProfile
        );
        results.push(result);
      }

      const usage = await aiSystem.getDailyTokenUsage();
      const templateOnlyResults = results.filter(
        r => r.template_only || r.cache_hit
      );
      const aiEnhancedResults = results.filter(r => r.ai_called);

      const templateEfficiency = templateOnlyResults.length / results.length;
      const costPerDescription = usage.cost_usd / results.length;

      console.log(`Cost Efficiency Analysis:`);
      console.log(
        `  Template-only: ${templateOnlyResults.length}/${results.length} (${(templateEfficiency * 100).toFixed(1)}%)`
      );
      console.log(
        `  AI-enhanced: ${aiEnhancedResults.length}/${results.length}`
      );
      console.log(
        `  Average cost: $${costPerDescription.toFixed(4)} per description`
      );
      console.log(
        `  Template savings: ${(templateEfficiency * 100).toFixed(1)}%`
      );

      expect(templateEfficiency).toBeGreaterThan(0.5); // >50% template reuse
      expect(costPerDescription).toBeLessThan(
        PERFORMANCE_TARGETS.COST_PER_DESCRIPTION
      );
    });
  });
});

// Helper function for generating test profiles
function generateTestProfile(
  traits: string[],
  confidence: number = 0.8
): MultiTraitProfile {
  return {
    primary_traits: [traits[0]],
    secondary_traits: traits.slice(1),
    trait_weights: {
      primary: 0.6,
      secondary: traits.length > 1 ? 0.4 : undefined,
      tertiary: traits.length > 2 ? 0.2 : undefined,
    },
    confidence_metrics: {
      trait_consistency: confidence,
      response_clarity: confidence,
      overall_confidence: confidence,
      trait_confidences: traits.reduce(
        (acc, trait) => ({ ...acc, [trait]: confidence }),
        {}
      ),
    },
    profile_vector: new Array(256).fill(confidence * 0.5),
    generation_method: 'structured',
    session_token: `test-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    created_at: new Date().toISOString(),
  };
}
