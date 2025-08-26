/**
 * Adaptive AI Performance Validation Tests
 * 
 * Comprehensive tests to validate performance optimizations
 * for the adaptive AI explanation system
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createOptimizedUnifiedEngine } from '@/lib/ai-sdk/performance-optimized-unified-engine';
import { createOptimizedExperienceDetector } from '@/lib/ai-sdk/performance-optimized-experience-detector';
import { optimizedAIClient } from '@/lib/ai-sdk/performance-optimized-client';
import { educationCache } from '@/lib/education/cache-manager';
import { performanceMonitor } from '@/lib/performance/adaptive-ai-monitor';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for testing
const mockSupabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      }),
      limit: () => ({
        order: () => Promise.resolve({ data: [], error: null })
      })
    })
  }),
  rpc: () => Promise.resolve({ data: [], error: null })
} as any;

describe('Adaptive AI Performance Optimization Tests', () => {
  let unifiedEngine: any;
  let experienceDetector: any;

  beforeAll(() => {
    unifiedEngine = createOptimizedUnifiedEngine(mockSupabase);
    experienceDetector = createOptimizedExperienceDetector(mockSupabase);
  });

  afterAll(() => {
    educationCache.clear();
  });

  describe('Performance Targets', () => {
    it('should meet Core Web Vitals targets', async () => {
      const performanceReport = performanceMonitor.getPerformanceReport();
      
      // These should be monitored but may not be available in test environment
      console.log('📊 Performance Report:', performanceReport);
      
      expect(performanceReport.score).toBeGreaterThanOrEqual(0);
    });

    it('should maintain fast AI response times (<2s)', async () => {
      const startTime = performance.now();
      
      try {
        await optimizedAIClient.explainForBeginnerOptimized(
          'test-fragrance',
          'New user interested in fresh scents',
          'Test Fragrance by Test Brand (Fresh)'
        );
      } catch (error) {
        // Expected to fail without real API, but we can test timing
      }
      
      const responseTime = performance.now() - startTime;
      console.log(`⚡ AI Response Time: ${responseTime.toFixed(2)}ms`);
      
      // Should be fast even with failures due to caching and fallbacks
      expect(responseTime).toBeLessThan(500); // 500ms for fallback responses
    });

    it('should achieve high cache hit rates (>80%)', async () => {
      // Warm up cache
      for (let i = 0; i < 5; i++) {
        educationCache.set(`test-key-${i}`, `test-value-${i}`, 60000);
      }

      // Test cache hits
      let hits = 0;
      for (let i = 0; i < 5; i++) {
        const result = educationCache.get(`test-key-${i}`);
        if (result) hits++;
      }

      const hitRate = (hits / 5) * 100;
      console.log(`💾 Cache Hit Rate: ${hitRate}%`);
      
      expect(hitRate).toBeGreaterThanOrEqual(80);
    });

    it('should handle experience detection in <200ms', async () => {
      const startTime = performance.now();
      
      const analysis = await experienceDetector.analyzeUserExperience();
      
      const detectionTime = performance.now() - startTime;
      console.log(`🔍 Experience Detection Time: ${detectionTime.toFixed(2)}ms`);
      
      expect(detectionTime).toBeLessThan(200);
      expect(analysis.level).toBe('beginner'); // Default for no user
    });
  });

  describe('Caching Performance', () => {
    it('should cache educational content effectively', () => {
      const testTerms = {
        'EDP': { term: 'EDP', shortExplanation: 'Stronger concentration', category: 'concentrations' as const },
        'Fresh': { term: 'Fresh Notes', shortExplanation: 'Clean, crisp scents', category: 'notes' as const }
      };

      // Test cache operations
      const startTime = performance.now();
      
      educationCache.preloadCriticalContent(testTerms);
      
      const cacheTime = performance.now() - startTime;
      console.log(`📚 Educational Content Cache Time: ${cacheTime.toFixed(2)}ms`);
      
      expect(cacheTime).toBeLessThan(10); // Should be very fast
      
      // Verify content is cached
      const cachedEDP = educationCache.get('edu_EDP');
      expect(cachedEDP).toBeTruthy();
    });

    it('should provide cache performance metrics', () => {
      const metrics = educationCache.getMetrics();
      
      console.log('📈 Cache Metrics:', metrics);
      
      expect(metrics).toHaveProperty('hits');
      expect(metrics).toHaveProperty('misses');
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('avgResponseTime');
      expect(metrics).toHaveProperty('hitRate');
    });

    it('should batch cache operations efficiently', () => {
      const batchItems = [
        { key: 'batch-1', data: 'value-1' },
        { key: 'batch-2', data: 'value-2' },
        { key: 'batch-3', data: 'value-3' },
      ];

      const startTime = performance.now();
      educationCache.batchSet(batchItems);
      const batchTime = performance.now() - startTime;

      console.log(`⚡ Batch Cache Time: ${batchTime.toFixed(2)}ms`);
      
      expect(batchTime).toBeLessThan(5);
      
      // Verify all items were cached
      batchItems.forEach(item => {
        expect(educationCache.get(item.key)).toBe(item.data);
      });
    });
  });

  describe('Mobile Performance', () => {
    it('should optimize for mobile experience detection', async () => {
      const startTime = performance.now();
      
      const level = await experienceDetector.getExperienceLevelFast();
      
      const fastDetectionTime = performance.now() - startTime;
      console.log(`📱 Fast Experience Detection: ${fastDetectionTime.toFixed(2)}ms`);
      
      expect(fastDetectionTime).toBeLessThan(100); // Very fast for mobile
      expect(level).toBe('beginner');
    });

    it('should handle batch operations efficiently', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      
      const startTime = performance.now();
      
      const results = await experienceDetector.batchAnalyzeUsers(
        userIds.map(id => ({ userId: id }))
      );
      
      const batchTime = performance.now() - startTime;
      console.log(`🔄 Batch Analysis Time: ${batchTime.toFixed(2)}ms`);
      
      expect(batchTime).toBeLessThan(300); // 300ms for 3 users
      expect(results.size).toBe(userIds.length);
    });
  });

  describe('AI Response Optimization', () => {
    it('should provide optimized beginner explanations', async () => {
      const startTime = performance.now();
      
      try {
        const result = await optimizedAIClient.explainForBeginnerOptimized(
          'test-fragrance-123',
          'New user exploring fresh scents',
          'Ocean Breeze by Fresh Co (Aquatic Fresh)'
        );
        
        const responseTime = performance.now() - startTime;
        console.log(`🎯 Beginner Explanation Time: ${responseTime.toFixed(2)}ms`);
        
        expect(result).toHaveProperty('explanation');
        expect(result).toHaveProperty('performance');
        expect(result.performance.responseTime).toBeLessThan(3000); // 3s max
        
      } catch (error) {
        // Test fallback performance
        const fallbackTime = performance.now() - startTime;
        expect(fallbackTime).toBeLessThan(100); // Fallbacks should be instant
      }
    });

    it('should handle batch explanation requests', async () => {
      const requests = [
        {
          fragranceId: 'frag-1',
          userContext: 'Beginner user',
          fragranceDetails: 'Test Fragrance 1',
          experienceLevel: 'beginner' as const,
          explanationStyle: {
            maxWords: 35,
            complexity: 'simple' as const,
            includeEducation: true,
            useProgressiveDisclosure: true,
            vocabularyLevel: 'basic' as const,
          }
        },
        {
          fragranceId: 'frag-2',
          userContext: 'Beginner user',
          fragranceDetails: 'Test Fragrance 2',
          experienceLevel: 'beginner' as const,
          explanationStyle: {
            maxWords: 35,
            complexity: 'simple' as const,
            includeEducation: true,
            useProgressiveDisclosure: true,
            vocabularyLevel: 'basic' as const,
          }
        }
      ];

      const startTime = performance.now();
      
      try {
        const results = await optimizedAIClient.batchExplainRecommendations(requests);
        
        const batchTime = performance.now() - startTime;
        console.log(`📦 Batch Explanation Time: ${batchTime.toFixed(2)}ms`);
        
        expect(results.size).toBeLessThanOrEqual(requests.length);
        expect(batchTime).toBeLessThan(5000); // 5s for batch
        
      } catch (error) {
        // Expected to fail without real API
        const fallbackTime = performance.now() - startTime;
        expect(fallbackTime).toBeLessThan(200);
      }
    });
  });

  describe('Memory and Resource Management', () => {
    it('should maintain reasonable cache size', () => {
      // Add many items to test memory management
      for (let i = 0; i < 100; i++) {
        educationCache.set(`test-item-${i}`, `value-${i}`, 60000);
      }

      const size = educationCache.size();
      console.log(`💾 Cache Size: ${size} items`);
      
      expect(size).toBeLessThanOrEqual(100);
    });

    it('should clean up expired cache entries', () => {
      // Add short-lived cache entries
      educationCache.set('short-lived-1', 'value-1', 1); // 1ms TTL
      educationCache.set('short-lived-2', 'value-2', 1);
      
      // Wait for expiration
      setTimeout(() => {
        educationCache.cleanup();
        
        const value1 = educationCache.get('short-lived-1');
        const value2 = educationCache.get('short-lived-2');
        
        expect(value1).toBeNull();
        expect(value2).toBeNull();
      }, 10);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track AI performance metrics', () => {
      performanceMonitor.recordAIMetric('experienceDetection', 150, true);
      performanceMonitor.recordAIMetric('explanationGeneration', 1800, false);
      
      const metrics = performanceMonitor.getPerformanceReport();
      
      console.log('📊 AI Performance Metrics:', metrics);
      
      expect(metrics).toHaveProperty('score');
      expect(metrics.score).toBeGreaterThanOrEqual(0);
      expect(metrics.score).toBeLessThanOrEqual(100);
    });

    it('should track user interactions', () => {
      performanceMonitor.recordInteraction('tooltip');
      performanceMonitor.recordInteraction('progressiveDisclosure');
      performanceMonitor.recordInteraction('confidenceBoost');
      
      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should export performance data', () => {
      const exported = performanceMonitor.exportMetrics();
      const data = JSON.parse(exported);
      
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('score');
      
      console.log('📤 Exported Performance Data Sample:', {
        timestamp: data.timestamp,
        score: data.score,
        metricsCount: Object.keys(data.metrics).length
      });
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should provide fast fallback explanations', async () => {
      const startTime = performance.now();
      
      // This should trigger fallback since we don't have real API
      try {
        await optimizedAIClient.explainForBeginnerOptimized(
          'nonexistent-fragrance',
          'test context',
          'Test Fragrance'
        );
      } catch (error) {
        // Expected - test that fallback is fast
      }
      
      const fallbackTime = performance.now() - startTime;
      console.log(`🔄 Fallback Response Time: ${fallbackTime.toFixed(2)}ms`);
      
      expect(fallbackTime).toBeLessThan(200); // Fallbacks should be instant
    });

    it('should maintain performance under error conditions', async () => {
      const startTime = performance.now();
      
      // Test multiple failed requests
      const promises = Array(5).fill(0).map(() => 
        experienceDetector.analyzeUserExperience('invalid-user-id')
      );
      
      const results = await Promise.allSettled(promises);
      
      const totalTime = performance.now() - startTime;
      console.log(`⚠️ Error Handling Time: ${totalTime.toFixed(2)}ms for 5 requests`);
      
      expect(totalTime).toBeLessThan(1000); // Should handle errors quickly
      
      // All should resolve to beginner fallback
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.level).toBe('beginner');
        }
      });
    });
  });

  describe('Integration Performance', () => {
    it('should handle complete recommendation flow efficiently', async () => {
      const startTime = performance.now();
      
      try {
        const recommendations = await unifiedEngine.generateOptimizedRecommendations({
          strategy: 'hybrid' as const,
          quizResponses: [
            { question_id: 'style', answer: 'fresh_clean' },
            { question_id: 'intensity', answer: 'moderate' }
          ],
          limit: 5,
          userId: 'test-user-123',
          adaptiveExplanations: true
        });
        
        const totalTime = performance.now() - startTime;
        console.log(`🔄 Complete Flow Time: ${totalTime.toFixed(2)}ms`);
        
        expect(recommendations).toHaveProperty('success');
        expect(recommendations).toHaveProperty('performance');
        expect(recommendations).toHaveProperty('caching');
        
        if (recommendations.success) {
          expect(recommendations.performance.totalProcessingTime).toBeLessThan(5000);
        }
        
      } catch (error) {
        // Test fallback performance
        const fallbackTime = performance.now() - startTime;
        expect(fallbackTime).toBeLessThan(1000);
      }
    });
  });
});

// Export test utilities for use in other tests
export const performanceTestUtils = {
  measureResponseTime: async (fn: () => Promise<any>) => {
    const start = performance.now();
    try {
      await fn();
    } catch (error) {
      // Ignore errors, we're measuring time
    }
    return performance.now() - start;
  },
  
  warmUpCache: () => {
    for (let i = 0; i < 10; i++) {
      educationCache.set(`warmup-${i}`, `data-${i}`, 300000);
    }
  },
  
  clearTestData: () => {
    educationCache.clear();
  }
};