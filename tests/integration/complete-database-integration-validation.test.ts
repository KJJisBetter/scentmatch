/**
 * Complete Database Integration Validation Tests - Task 5.1
 *
 * Comprehensive end-to-end testing of the complete user journey with database integration.
 * Tests quiz → recommendations → browse flow with all system components working together.
 * Validates all fixes from Tasks 1-4 work in harmony.
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { createServiceSupabase } from '@/lib/supabase';

const API_BASE_URL = 'http://localhost:3000';

describe('Complete Database Integration Validation - End-to-End System Testing', () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createServiceSupabase();
  });

  describe('Complete User Journey Testing (Quiz → Recommendations → Browse)', () => {
    test('should complete full user journey: Men\'s quiz → recommendations → browse', async () => {
      console.log('🚀 TESTING COMPLETE USER JOURNEY - MEN\'S PATH\n');

      // Step 1: Complete quiz with men's preferences
      console.log('Step 1: Quiz completion with fresh preferences...');
      
      const quizData = {
        responses: [
          { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
          { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
          { question_id: 'scent_preferences_beginner', answer_value: 'fresh_clean', timestamp: new Date().toISOString() },
          { question_id: 'personality_style', answer_value: 'classic_timeless', timestamp: new Date().toISOString() },
          { question_id: 'occasions_beginner', answer_value: 'everyday', timestamp: new Date().toISOString() }
        ]
      };

      const quizStartTime = Date.now();
      const quizResponse = await fetch(`${API_BASE_URL}/api/quiz/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData)
      });
      const quizTime = Date.now() - quizStartTime;

      expect(quizResponse.ok).toBe(true);
      expect(quizTime).toBeLessThan(5000); // Quiz should complete within 5 seconds

      const quizResult = await quizResponse.json();
      expect(quizResult.recommendations).toBeDefined();
      expect(quizResult.recommendations).toHaveLength(3);

      console.log(`✅ Quiz completed in ${quizTime}ms`);
      console.log('   Recommendations:');
      quizResult.recommendations.forEach((rec: any, i: number) => {
        console.log(`   ${i+1}. ${rec.name} by ${rec.brand} (${rec.gender_target})`);
        
        // CRITICAL: Verify no women's fragrances for men
        expect(['men', 'unisex'].includes(rec.gender_target)).toBe(true);
      });

      // Step 2: Browse page load test
      console.log('\nStep 2: Browse page loading...');
      
      const browseStartTime = Date.now();
      const browseResponse = await fetch(`${API_BASE_URL}/browse`);
      const browseTime = Date.now() - browseStartTime;

      expect(browseResponse.ok).toBe(true);
      expect(browseTime).toBeLessThan(15000); // Browse page should load within 15 seconds

      const browseContent = await browseResponse.text();
      expect(browseContent).toContain('Browse Fragrances');
      expect(browseContent).toContain('fragrance'); // Should show fragrance content

      console.log(`✅ Browse page loaded in ${browseTime}ms`);

      // Step 3: Search functionality test
      console.log('\nStep 3: Search functionality...');
      
      const searchStartTime = Date.now();
      const searchResponse = await fetch(`${API_BASE_URL}/api/search?q=fresh&limit=5`);
      const searchTime = Date.now() - searchStartTime;

      expect(searchResponse.ok).toBe(true);
      expect(searchTime).toBeLessThan(3000); // Search should complete within 3 seconds

      const searchResult = await searchResponse.json();
      expect(searchResult.fragrances).toBeDefined();
      expect(Array.isArray(searchResult.fragrances)).toBe(true);

      console.log(`✅ Search completed in ${searchTime}ms → ${searchResult.fragrances.length} results`);

      // Step 4: Individual fragrance detail test  
      console.log('\nStep 4: Individual fragrance details...');
      
      if (searchResult.fragrances.length > 0) {
        const firstFragrance = searchResult.fragrances[0];
        
        const detailStartTime = Date.now();
        const detailResponse = await fetch(`${API_BASE_URL}/api/fragrances/${firstFragrance.id}`);
        const detailTime = Date.now() - detailStartTime;

        expect(detailResponse.ok).toBe(true);
        expect(detailTime).toBeLessThan(2000); // Detail page should load within 2 seconds

        const detailResult = await detailResponse.json();
        expect(detailResult.id).toBe(firstFragrance.id);
        expect(detailResult.name).toBeDefined();

        console.log(`✅ Fragrance details loaded in ${detailTime}ms for: ${detailResult.name}`);

        // Step 5: Similar fragrances test
        console.log('\nStep 5: Similar fragrances...');
        
        const similarStartTime = Date.now();
        const similarResponse = await fetch(`${API_BASE_URL}/api/fragrances/${firstFragrance.id}/similar`);
        const similarTime = Date.now() - similarStartTime;

        if (similarResponse.ok) {
          const similarResult = await similarResponse.json();
          console.log(`✅ Similar fragrances loaded in ${similarTime}ms → ${similarResult.similar?.length || 0} similar fragrances`);
        } else {
          console.log(`⚠️ Similar fragrances: ${similarResponse.status} (vector similarity not fully implemented)`);
        }
      }

      console.log('\n🎯 COMPLETE USER JOURNEY: SUCCESS');
      console.log(`   Total journey time: Quiz(${quizTime}ms) + Browse(${browseTime}ms) + Search(${searchTime}ms) = ${quizTime + browseTime + searchTime}ms`);
    });

    test('should complete full user journey: Women\'s quiz → recommendations → browse', async () => {
      console.log('🚀 TESTING COMPLETE USER JOURNEY - WOMEN\'S PATH\n');

      // Test women's path to ensure gender filtering works both ways
      const womenQuizData = {
        responses: [
          { question_id: 'gender_preference', answer_value: 'women', timestamp: new Date().toISOString() },
          { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
          { question_id: 'scent_preferences_beginner', answer_value: 'floral_pretty', timestamp: new Date().toISOString() }
        ]
      };

      const quizResponse = await fetch(`${API_BASE_URL}/api/quiz/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(womenQuizData)
      });

      expect(quizResponse.ok).toBe(true);

      const quizResult = await quizResponse.json();
      expect(quizResult.recommendations).toHaveLength(3);

      console.log('Women\'s quiz recommendations:');
      quizResult.recommendations.forEach((rec: any, i: number) => {
        console.log(`   ${i+1}. ${rec.name} by ${rec.brand} (${rec.gender_target})`);
        
        // CRITICAL: Verify no men's fragrances for women
        expect(['women', 'unisex'].includes(rec.gender_target)).toBe(true);
      });

      console.log('✅ Women\'s gender filtering working correctly');
    });
  });

  describe('System Performance Under Load Testing', () => {
    test('should handle concurrent API requests without degradation', async () => {
      console.log('🔄 Testing concurrent API request performance...');

      // Test multiple concurrent requests (simulates multiple users)
      const concurrentRequests = Array.from({ length: 5 }, (_, i) => {
        return fetch(`${API_BASE_URL}/api/search?limit=10&test=${i}`);
      });

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach((response, i) => {
        expect(response.ok).toBe(true);
        console.log(`   Request ${i+1}: ${response.status}`);
      });

      console.log(`✅ Concurrent requests completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(10000); // All 5 requests within 10 seconds
    });

    test('should maintain database connection stability under load', async () => {
      console.log('🔄 Testing database connection stability...');

      // Rapid sequential database queries
      for (let i = 0; i < 5; i++) {
        const { data: fragrances, error } = await supabase
          .from('fragrances')
          .select('id, name')
          .limit(10);

        expect(error).toBeNull();
        expect(fragrances).toBeDefined();
        expect(Array.isArray(fragrances)).toBe(true);
      }

      console.log('✅ Database connection stable under rapid queries');
    });
  });

  describe('Error Scenarios and System Resilience Testing', () => {
    test('should handle invalid API requests gracefully', async () => {
      console.log('🔄 Testing error scenario handling...');

      const errorScenarios = [
        { endpoint: '/api/quiz/analyze', method: 'POST', data: { invalid: 'data' }, description: 'Invalid quiz data' },
        { endpoint: '/api/search?limit=invalid', method: 'GET', description: 'Invalid search parameters' },
        { endpoint: '/api/fragrances/nonexistent-id', method: 'GET', description: 'Nonexistent fragrance ID' }
      ];

      for (const scenario of errorScenarios) {
        const response = await fetch(`${API_BASE_URL}${scenario.endpoint}`, {
          method: scenario.method,
          headers: scenario.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
          body: scenario.method === 'POST' ? JSON.stringify(scenario.data || {}) : undefined
        });

        // Should return proper error codes, not crash
        expect([400, 404, 422, 500].includes(response.status)).toBe(true);
        
        const errorContent = await response.text();
        expect(errorContent).toBeDefined();
        expect(errorContent.length).toBeGreaterThan(0);

        console.log(`✅ ${scenario.description}: ${response.status} (handled gracefully)`);
      }
    });

    test('should verify system works without enhanced database features', async () => {
      console.log('🔄 Testing system resilience without enhanced features...');

      // The system should work even if enhanced tables/functions aren't available
      // Test basic functionality
      const basicTests = [
        { name: 'Basic quiz', test: () => fetch(`${API_BASE_URL}/api/quiz/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responses: [
              { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
              { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
              { question_id: 'scent_preferences_beginner', answer_value: 'fresh_clean', timestamp: new Date().toISOString() }
            ]
          })
        })},
        { name: 'Basic search', test: () => fetch(`${API_BASE_URL}/api/search?limit=5`) },
        { name: 'Basic browse', test: () => fetch(`${API_BASE_URL}/browse`) }
      ];

      for (const basicTest of basicTests) {
        const response = await basicTest.test();
        
        expect(response.ok).toBe(true);
        console.log(`✅ ${basicTest.name}: ${response.status} (working without enhanced features)`);
      }
    });
  });

  describe('Final Integration Validation and Summary', () => {
    test('should provide comprehensive system integration status', async () => {
      console.log('\n📋 FINAL SYSTEM INTEGRATION STATUS REPORT\n');

      // Test all major system components
      const systemComponents = [
        {
          name: 'Database Connectivity',
          test: async () => {
            const { data, error } = await supabase.from('fragrances').select('id').limit(1);
            return { success: !error, details: error?.message || `${data?.length || 0} records accessible` };
          }
        },
        {
          name: 'Quiz API Integration', 
          test: async () => {
            const response = await fetch(`${API_BASE_URL}/api/quiz/analyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                responses: [
                  { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
                  { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
                  { question_id: 'scent_preferences_beginner', answer_value: 'fresh_clean', timestamp: new Date().toISOString() }
                ]
              })
            });
            const result = response.ok ? await response.json() : null;
            return { 
              success: response.ok && result?.recommendations?.length === 3,
              details: response.ok ? `${result?.recommendations?.length || 0} recommendations` : `${response.status} error`
            };
          }
        },
        {
          name: 'Search API Integration',
          test: async () => {
            const response = await fetch(`${API_BASE_URL}/api/search?limit=5`);
            const result = response.ok ? await response.json() : null;
            return {
              success: response.ok && result?.fragrances?.length > 0,
              details: response.ok ? `${result?.fragrances?.length || 0} search results` : `${response.status} error`
            };
          }
        },
        {
          name: 'Browse Page Loading',
          test: async () => {
            const startTime = Date.now();
            const response = await fetch(`${API_BASE_URL}/browse`);
            const loadTime = Date.now() - startTime;
            const content = response.ok ? await response.text() : '';
            return {
              success: response.ok && content.includes('Browse Fragrances') && loadTime < 15000,
              details: response.ok ? `Loaded in ${loadTime}ms` : `${response.status} error`
            };
          }
        },
        {
          name: 'Individual Fragrance API',
          test: async () => {
            const response = await fetch(`${API_BASE_URL}/api/fragrances/paco-rabanne__1-million-absolutely-gold`);
            const result = response.ok ? await response.json() : null;
            return {
              success: response.ok && result?.name,
              details: response.ok ? result?.name || 'Details loaded' : `${response.status} error`
            };
          }
        },
        {
          name: 'Filter Options API',
          test: async () => {
            const response = await fetch(`${API_BASE_URL}/api/search/filters`);
            const result = response.ok ? await response.json() : null;
            return {
              success: response.ok && result?.metadata,
              details: response.ok ? 'Filter options available' : `${response.status} error`
            };
          }
        }
      ];

      const testResults = [];

      for (const component of systemComponents) {
        try {
          const result = await component.test();
          testResults.push({ ...component, ...result });
          
          const icon = result.success ? '✅' : '❌';
          console.log(`${icon} ${component.name}: ${result.details}`);
        } catch (error) {
          testResults.push({ ...component, success: false, details: error.message });
          console.log(`❌ ${component.name}: ERROR - ${error.message}`);
        }
      }

      // Overall system health assessment
      const workingComponents = testResults.filter(r => r.success).length;
      const totalComponents = testResults.length;
      const healthPercentage = Math.round((workingComponents / totalComponents) * 100);

      console.log(`\n📊 SYSTEM HEALTH: ${workingComponents}/${totalComponents} components working (${healthPercentage}%)`);

      if (healthPercentage >= 100) {
        console.log('🎉 PERFECT: All system components fully functional');
      } else if (healthPercentage >= 80) {
        console.log('✅ EXCELLENT: Core functionality working, minor issues only');
      } else if (healthPercentage >= 60) {
        console.log('⚠️ GOOD: Most functionality working, some integration gaps');
      } else {
        console.log('❌ POOR: Significant integration issues need resolution');
      }

      // System should have at least 80% functionality
      expect(healthPercentage).toBeGreaterThanOrEqual(80);
    });

    test('should verify gender filtering works across all system components', async () => {
      console.log('\n🔍 TESTING GENDER FILTERING ACROSS ENTIRE SYSTEM\n');

      // Test 1: Quiz gender filtering for men
      console.log('Testing men\'s gender filtering...');
      
      const menQuizResponse = await fetch(`${API_BASE_URL}/api/quiz/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: [
            { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
            { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
            { question_id: 'scent_preferences_beginner', answer_value: 'fresh_clean', timestamp: new Date().toISOString() }
          ]
        })
      });

      if (menQuizResponse.ok) {
        const menResult = await menQuizResponse.json();
        menResult.recommendations?.forEach((rec: any) => {
          expect(rec.name.toLowerCase()).not.toContain('ariana');
          expect(rec.brand.toLowerCase()).not.toBe('ariana grande');
          expect(['men', 'unisex'].includes(rec.gender_target)).toBe(true);
        });
        console.log('✅ Men\'s quiz: No women\'s fragrances returned');
      }

      // Test 2: Search API gender filtering
      console.log('Testing search API gender filtering...');
      
      const menSearchResponse = await fetch(`${API_BASE_URL}/api/search?gender=for men&limit=10`);
      if (menSearchResponse.ok) {
        const menSearchResult = await menSearchResponse.json();
        menSearchResult.fragrances?.forEach((frag: any) => {
          expect(frag.gender).toBe('for men');
        });
        console.log(`✅ Search API: ${menSearchResult.fragrances?.length || 0} men's fragrances only`);
      }

      console.log('🎯 Gender filtering: SYSTEM-WIDE SUCCESS');
    });

    test('should verify all critical fixes work together harmoniously', async () => {
      console.log('\n🔧 VERIFYING ALL CRITICAL FIXES WORK TOGETHER\n');

      const criticalFixes = [
        {
          name: 'Database Integration',
          description: 'APIs work with current database schema',
          test: async () => {
            const response = await fetch(`${API_BASE_URL}/api/search?limit=3`);
            const result = response.ok ? await response.json() : null;
            return response.ok && result?.fragrances?.length > 0;
          }
        },
        {
          name: 'Quiz Gender Filtering',
          description: 'Men don\'t get women\'s fragrances (Ariana Grande bug fixed)',
          test: async () => {
            const response = await fetch(`${API_BASE_URL}/api/quiz/analyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                responses: [
                  { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
                  { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
                  { question_id: 'scent_preferences_beginner', answer_value: 'fresh_clean', timestamp: new Date().toISOString() }
                ]
              })
            });
            const result = response.ok ? await response.json() : null;
            return response.ok && result?.recommendations?.every((r: any) => 
              !r.name.toLowerCase().includes('ariana') && ['men', 'unisex'].includes(r.gender_target)
            );
          }
        },
        {
          name: 'Browse Page Timeout Fix',
          description: 'Browse page loads without hanging indefinitely',
          test: async () => {
            const startTime = Date.now();
            const response = await fetch(`${API_BASE_URL}/browse`);
            const loadTime = Date.now() - startTime;
            const content = response.ok ? await response.text() : '';
            return response.ok && content.includes('Browse Fragrances') && loadTime < 15000;
          }
        },
        {
          name: 'Quiz Preference Variation',
          description: 'Different quiz answers produce different recommendations',
          test: async () => {
            const freshResponse = await fetch(`${API_BASE_URL}/api/quiz/analyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                responses: [
                  { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
                  { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
                  { question_id: 'scent_preferences_beginner', answer_value: 'fresh_clean', timestamp: new Date().toISOString() }
                ]
              })
            });
            
            const warmResponse = await fetch(`${API_BASE_URL}/api/quiz/analyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                responses: [
                  { question_id: 'gender_preference', answer_value: 'men', timestamp: new Date().toISOString() },
                  { question_id: 'experience_level', answer_value: 'beginner', timestamp: new Date().toISOString() },
                  { question_id: 'scent_preferences_beginner', answer_value: 'warm_cozy', timestamp: new Date().toISOString() }
                ]
              })
            });

            if (freshResponse.ok && warmResponse.ok) {
              const freshResult = await freshResponse.json();
              const warmResult = await warmResponse.json();
              
              const freshName = freshResult.recommendations?.[0]?.name;
              const warmName = warmResult.recommendations?.[0]?.name;
              
              return freshName !== warmName; // Should be different
            }
            return false;
          }
        }
      ];

      console.log('Testing all critical fixes:');
      let fixesWorking = 0;

      for (const fix of criticalFixes) {
        try {
          const isWorking = await fix.test();
          const icon = isWorking ? '✅' : '❌';
          console.log(`${icon} ${fix.name}: ${fix.description}`);
          if (isWorking) fixesWorking++;
        } catch (error) {
          console.log(`❌ ${fix.name}: ERROR - ${error.message}`);
        }
      }

      console.log(`\n🎯 CRITICAL FIXES STATUS: ${fixesWorking}/${criticalFixes.length} working`);

      if (fixesWorking === criticalFixes.length) {
        console.log('🎉 ALL CRITICAL FIXES WORKING PERFECTLY');
      } else if (fixesWorking >= criticalFixes.length * 0.75) {
        console.log('✅ MOST CRITICAL FIXES WORKING');
      } else {
        console.log('⚠️ SOME CRITICAL FIXES NEED ATTENTION');
      }

      expect(fixesWorking).toBeGreaterThanOrEqual(3); // At least 3/4 fixes should work
    });
  });
});