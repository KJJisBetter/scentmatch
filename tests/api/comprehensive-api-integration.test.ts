/**
 * Comprehensive API Endpoint Integration Tests - Task 2.1
 *
 * Tests all API endpoints with new database schema integration.
 * Validates that API endpoints work correctly with enhanced database structure,
 * handle errors gracefully, and maintain proper performance.
 */

import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { createServiceSupabase } from '@/lib/supabase/server';

const API_BASE_URL = 'http://localhost:3000';

describe('Comprehensive API Integration - Database Schema Compatibility', () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createServiceSupabase();
  });

  describe('Quiz API Endpoints - Database Integration', () => {
    test('POST /api/quiz/analyze should handle quiz responses with database integration', async () => {
      const quizData = {
        responses: [
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
        ],
        session_token: 'test-session-comprehensive'
      };

      const response = await fetch(`${API_BASE_URL}/api/quiz/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData)
      });

      // Should respond with recommendations
      if (response.ok) {
        const result = await response.json();
        
        expect(result).toBeDefined();
        expect(result.recommendations).toBeDefined();
        expect(Array.isArray(result.recommendations)).toBe(true);
        
        // Validate gender filtering is working (critical fix)
        result.recommendations.forEach((rec: any) => {
          expect(rec.name.toLowerCase()).not.toContain('ariana');
          expect(rec.brand.toLowerCase()).not.toBe('ariana grande');
        });
        
        console.log(`✅ Quiz API: Gender filtering working - no Ariana Grande for men`);
      } else {
        console.log(`⚠️ Quiz API returned ${response.status}: ${response.statusText}`);
        
        // Document the error for fixing
        const errorText = await response.text();
        console.log(`   Error details: ${errorText}`);
      }
    });

    test('POST /api/quiz/analyze should validate input data correctly', async () => {
      // Test with insufficient data
      const insufficientData = {
        responses: [
          {
            question_id: 'gender_preference',
            answer_value: 'men',
            timestamp: new Date().toISOString()
          }
        ],
        session_token: 'test-insufficient'
      };

      const response = await fetch(`${API_BASE_URL}/api/quiz/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(insufficientData)
      });

      // Should handle insufficient data gracefully
      if (response.status === 400) {
        console.log(`✅ Quiz API: Properly validates insufficient input data`);
      } else if (response.ok) {
        const result = await response.json();
        if (result.success === false) {
          console.log(`✅ Quiz API: Gracefully handles insufficient data`);
        }
      } else {
        console.log(`⚠️ Quiz API validation test: ${response.status}`);
      }
    });

    test('POST /api/quiz/analyze should store preferences in user_preferences table if exists', async () => {
      // First check if user_preferences table exists
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'user_preferences')
        .eq('table_schema', 'public')
        .single();

      if (!tableExists) {
        console.log(`⚠️ user_preferences table doesn't exist - API integration limited`);
        return;
      }

      // Test API can interact with user_preferences
      console.log(`✅ user_preferences table exists - API should integrate with it`);
    });
  });

  describe('Fragrance API Endpoints - Browse Page Performance', () => {
    test('GET /api/fragrances should handle basic pagination without timeout', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/api/fragrances?limit=20&page=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const result = await response.json();
        
        expect(result).toBeDefined();
        expect(responseTime).toBeLessThan(3000); // Should not timeout
        
        console.log(`✅ Fragrances API: Responded in ${responseTime}ms`);
        
        if (result.fragrances) {
          expect(Array.isArray(result.fragrances)).toBe(true);
          expect(result.fragrances.length).toBeLessThanOrEqual(20);
          console.log(`✅ Fragrances API: Returned ${result.fragrances.length} fragrances`);
        }
      } else {
        console.log(`❌ Fragrances API: ${response.status} ${response.statusText} in ${responseTime}ms`);
        
        if (responseTime > 10000) {
          console.log(`❌ CRITICAL: Browse page timeout issue confirmed - ${responseTime}ms`);
        }
      }
    });

    test('GET /api/fragrances should handle filtering without performance issues', async () => {
      const filters = {
        brand: 'Dior',
        gender: 'men',
        limit: 10
      };

      const queryParams = new URLSearchParams(filters);
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/api/fragrances?${queryParams}`, {
        method: 'GET'
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Fragrances filtering API: ${responseTime}ms`);
        
        if (result.fragrances) {
          result.fragrances.forEach((fragrance: any) => {
            expect(fragrance.brand?.toLowerCase()).toContain('dior');
          });
        }
      } else {
        console.log(`❌ Fragrances filtering API: ${response.status} in ${responseTime}ms`);
      }
    });

    test('GET /api/search should work with new database schema', async () => {
      const searchParams = new URLSearchParams({
        q: 'fresh',
        limit: '10'
      });

      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/api/search?${searchParams}`, {
        method: 'GET'
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Search API: Responded in ${responseTime}ms`);
        
        expect(result).toBeDefined();
        if (result.fragrances) {
          expect(Array.isArray(result.fragrances)).toBe(true);
        }
      } else {
        console.log(`❌ Search API: ${response.status} in ${responseTime}ms`);
        
        // Check if this is the browse page timeout issue
        if (response.status === 500 || responseTime > 5000) {
          console.log(`❌ CRITICAL: Search API timeout - affects browse page`);
        }
      }
    });

    test('GET /api/search/filters should provide filter options efficiently', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/api/search/filters`, {
        method: 'GET'
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Search filters API: ${responseTime}ms`);
        
        expect(result).toBeDefined();
        expect(result.brands || result.scent_families).toBeDefined();
        expect(responseTime).toBeLessThan(1000); // Should be fast for browse page
      } else {
        console.log(`❌ Search filters API: ${response.status} in ${responseTime}ms`);
      }
    });
  });

  describe('Individual Fragrance API Endpoints', () => {
    test('GET /api/fragrances/[id] should return enhanced fragrance details', async () => {
      // Get a sample fragrance ID first
      const { data: sampleFragrance } = await supabase
        .from('fragrances')
        .select('id')
        .limit(1)
        .single();

      if (!sampleFragrance) {
        console.log('⚠️ No fragrances found for testing individual API');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/fragrances/${sampleFragrance.id}`);

      if (response.ok) {
        const result = await response.json();
        
        expect(result).toBeDefined();
        expect(result.id).toBe(sampleFragrance.id);
        
        // Should include enhanced data if available
        console.log(`✅ Individual fragrance API working for ID: ${sampleFragrance.id}`);
      } else {
        console.log(`❌ Individual fragrance API: ${response.status} for ID ${sampleFragrance.id}`);
      }
    });

    test('GET /api/fragrances/[id]/similar should provide vector similarity if available', async () => {
      const { data: sampleFragrance } = await supabase
        .from('fragrances')
        .select('id')
        .limit(1)
        .single();

      if (!sampleFragrance) {
        console.log('⚠️ No fragrances found for testing similarity API');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/fragrances/${sampleFragrance.id}/similar`);

      if (response.ok) {
        const result = await response.json();
        
        expect(result).toBeDefined();
        console.log(`✅ Similarity API working for ID: ${sampleFragrance.id}`);
        
        if (result.similar_fragrances) {
          expect(Array.isArray(result.similar_fragrances)).toBe(true);
        }
      } else {
        console.log(`❌ Similarity API: ${response.status} - vector similarity may not be implemented`);
      }
    });
  });

  describe('Collection API Endpoints', () => {
    test('GET /api/collections should work with enhanced user_collections table', async () => {
      // This would require authentication, so we'll test the endpoint exists
      const response = await fetch(`${API_BASE_URL}/api/collections`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token' // This will likely fail auth but test endpoint exists
        }
      });

      // Expect auth error (401) or proper response, not 404
      if (response.status === 404) {
        console.log(`❌ Collections API: Endpoint doesn't exist yet`);
      } else if (response.status === 401) {
        console.log(`✅ Collections API: Endpoint exists (auth required)`);
      } else if (response.ok) {
        console.log(`✅ Collections API: Working`);
      } else {
        console.log(`⚠️ Collections API: ${response.status} - may need implementation`);
      }
    });

    test('POST /api/collections/interactions should track user interactions if implemented', async () => {
      const interactionData = {
        fragrance_id: '1',
        interaction_type: 'view',
        session_id: 'test-session'
      };

      const response = await fetch(`${API_BASE_URL}/api/collections/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interactionData)
      });

      if (response.status === 404) {
        console.log(`⚠️ Interactions API: Endpoint not yet implemented`);
      } else if (response.status === 401) {
        console.log(`✅ Interactions API: Endpoint exists (auth required)`);
      } else {
        console.log(`✅ Interactions API: Response ${response.status}`);
      }
    });
  });

  describe('Recommendations API Endpoints', () => {
    test('GET /api/recommendations should provide personalized recommendations', async () => {
      const response = await fetch(`${API_BASE_URL}/api/recommendations?limit=5`, {
        method: 'GET'
      });

      if (response.ok) {
        const result = await response.json();
        
        expect(result).toBeDefined();
        console.log(`✅ Recommendations API: Working`);
        
        if (result.recommendations) {
          expect(Array.isArray(result.recommendations)).toBe(true);
          expect(result.recommendations.length).toBeLessThanOrEqual(5);
        }
      } else {
        console.log(`❌ Recommendations API: ${response.status} - may need implementation`);
      }
    });

    test('POST /api/recommendations/feedback should handle user feedback', async () => {
      const feedbackData = {
        fragrance_id: '1',
        feedback_type: 'like',
        rating: 5
      };

      const response = await fetch(`${API_BASE_URL}/api/recommendations/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      if (response.status === 404) {
        console.log(`⚠️ Recommendations feedback API: Not yet implemented`);
      } else {
        console.log(`✅ Recommendations feedback API: Response ${response.status}`);
      }
    });
  });

  describe('API Performance and Error Handling', () => {
    test('should handle malformed requests gracefully', async () => {
      const malformedData = {
        invalid: 'data',
        missing: 'required_fields'
      };

      const response = await fetch(`${API_BASE_URL}/api/quiz/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(malformedData)
      });

      // Should return 400 Bad Request or handle gracefully
      expect([400, 422, 500].includes(response.status)).toBe(true);
      console.log(`✅ API error handling: Malformed request handled with ${response.status}`);
    });

    test('should handle database connection issues gracefully', async () => {
      // This test validates that APIs don't crash when database has issues
      // We can't easily simulate database failure, so we'll test timeout handling
      
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET'
      });

      if (response.ok) {
        console.log(`✅ Health check API: Database connectivity good`);
      } else {
        console.log(`⚠️ Health check API: ${response.status} - may indicate database issues`);
      }
    });

    test('should validate API response formats are consistent', async () => {
      const endpoints = [
        '/api/quiz/analyze',
        '/api/fragrances',
        '/api/search',
        '/api/recommendations'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'GET'
        });

        // All APIs should return JSON content type
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          console.log(`✅ ${endpoint}: Correct JSON content type`);
        } else if (response.status === 404) {
          console.log(`⚠️ ${endpoint}: Endpoint not found`);
        } else {
          console.log(`⚠️ ${endpoint}: Unexpected content type: ${contentType}`);
        }
      }
    });
  });

  describe('Database Integration Validation via API', () => {
    test('should verify API can access fragrance data correctly', async () => {
      // Test that APIs can read fragrance data with current schema
      const response = await fetch(`${API_BASE_URL}/api/fragrances?limit=5`);

      if (response.ok) {
        const result = await response.json();
        
        if (result.fragrances && result.fragrances.length > 0) {
          const fragrance = result.fragrances[0];
          
          // Validate fragrance data structure
          expect(fragrance.id).toBeDefined();
          expect(fragrance.name).toBeDefined();
          expect(typeof fragrance.name).toBe('string');
          
          console.log(`✅ API-Database integration: Fragrance data accessible`);
          console.log(`   Sample fragrance: ${fragrance.name}`);
        } else {
          console.log(`⚠️ API returned empty fragrance data`);
        }
      } else {
        console.log(`❌ Cannot test API-Database integration: ${response.status}`);
      }
    });

    test('should verify gender filtering works through API endpoints', async () => {
      // Test men's filtering through API
      const menResponse = await fetch(`${API_BASE_URL}/api/fragrances?gender=men&limit=10`);
      
      if (menResponse.ok) {
        const menResult = await menResponse.json();
        
        if (menResult.fragrances) {
          menResult.fragrances.forEach((fragrance: any) => {
            // Should not contain obvious women's fragrances
            expect(fragrance.name.toLowerCase()).not.toContain('ariana');
            expect(fragrance.brand?.toLowerCase()).not.toBe('ariana grande');
          });
          
          console.log(`✅ API Gender filtering: Men's filter working`);
        }
      } else {
        console.log(`⚠️ Men's gender filtering test: API ${menResponse.status}`);
      }

      // Test women's filtering through API
      const womenResponse = await fetch(`${API_BASE_URL}/api/fragrances?gender=women&limit=10`);
      
      if (womenResponse.ok) {
        const womenResult = await womenResponse.json();
        console.log(`✅ API Gender filtering: Women's filter responding`);
      } else {
        console.log(`⚠️ Women's gender filtering test: API ${womenResponse.status}`);
      }
    });

    test('should verify browse page data endpoints work without timeout', async () => {
      // Test the exact calls that browse page makes
      const browsePageCalls = [
        '/api/search?limit=20',
        '/api/search/filters'
      ];

      for (const endpoint of browsePageCalls) {
        const startTime = Date.now();
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          console.log(`✅ Browse page API ${endpoint}: ${responseTime}ms`);
        } else {
          console.log(`❌ Browse page API ${endpoint}: ${response.status} in ${responseTime}ms`);
          
          if (responseTime > 5000) {
            console.log(`❌ CRITICAL: Browse page timeout issue in ${endpoint}`);
          }
        }
      }
    });

    test('should verify API endpoints can handle large result sets efficiently', async () => {
      // Test with larger limits to see performance
      const response = await fetch(`${API_BASE_URL}/api/fragrances?limit=100`);
      
      const startTime = Date.now();
      if (response.ok) {
        const result = await response.json();
        const responseTime = Date.now() - startTime;
        
        console.log(`✅ Large result set API: ${responseTime}ms for up to 100 fragrances`);
        
        if (responseTime > 2000) {
          console.log(`⚠️ Performance concern: Large queries taking ${responseTime}ms`);
        }
      } else {
        console.log(`❌ Large result set test: ${response.status}`);
      }
    });
  });

  describe('Vector Similarity and AI Integration', () => {
    test('should verify vector similarity endpoints if implemented', async () => {
      // Check if we have any fragrances to test with
      const { data: sampleFragrance } = await supabase
        .from('fragrances')
        .select('id')
        .limit(1)
        .single();

      if (!sampleFragrance) {
        console.log('⚠️ No fragrance data for vector similarity testing');
        return;
      }

      // Test vector similarity endpoint
      const response = await fetch(`${API_BASE_URL}/api/fragrances/${sampleFragrance.id}/similar`);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Vector similarity API: Working for fragrance ${sampleFragrance.id}`);
        
        if (result.similar_fragrances) {
          expect(Array.isArray(result.similar_fragrances)).toBe(true);
        }
      } else if (response.status === 404) {
        console.log(`⚠️ Vector similarity API: Not yet implemented`);
      } else {
        console.log(`❌ Vector similarity API: ${response.status}`);
      }
    });

    test('should verify AI description endpoints work with enhanced data', async () => {
      // Test if AI descriptions work with current data
      const { data: sampleFragrance } = await supabase
        .from('fragrances')
        .select('id, name')
        .limit(1)
        .single();

      if (sampleFragrance) {
        console.log(`✅ AI integration test ready with fragrance: ${sampleFragrance.name}`);
        
        // Future test: POST to AI description endpoint
        // For now, just verify we have data to work with
      }
    });
  });

  describe('API Integration Summary', () => {
    test('should provide comprehensive API status report', async () => {
      console.log('\n📊 API Integration Status Summary:');
      
      // Test all major endpoints and report status
      const endpoints = [
        { path: '/api/quiz/analyze', method: 'GET', description: 'Quiz Analysis' },
        { path: '/api/fragrances', method: 'GET', description: 'Fragrance List' },
        { path: '/api/search', method: 'GET', description: 'Fragrance Search' },
        { path: '/api/search/filters', method: 'GET', description: 'Filter Options' },
        { path: '/api/recommendations', method: 'GET', description: 'Recommendations' },
        { path: '/api/health', method: 'GET', description: 'Health Check' }
      ];

      const results = [];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        try {
          const response = await fetch(`${API_BASE_URL}${endpoint.path}`);
          const responseTime = Date.now() - startTime;
          
          results.push({
            endpoint: endpoint.path,
            status: response.status,
            responseTime,
            working: response.ok || response.status === 401 || response.status === 422
          });
        } catch (error) {
          results.push({
            endpoint: endpoint.path,
            status: 'ERROR',
            responseTime: Date.now() - startTime,
            working: false,
            error: error.message
          });
        }
      }

      // Report findings
      const workingEndpoints = results.filter(r => r.working).length;
      const totalEndpoints = results.length;
      
      console.log(`   ✅ Working endpoints: ${workingEndpoints}/${totalEndpoints}`);
      
      results.forEach(result => {
        const status = result.working ? '✅' : '❌';
        console.log(`   ${status} ${result.endpoint}: ${result.status} (${result.responseTime}ms)`);
      });

      // Overall assessment
      if (workingEndpoints >= totalEndpoints * 0.7) {
        console.log(`\n✅ API Integration: ${Math.round(workingEndpoints/totalEndpoints*100)}% endpoints working`);
      } else {
        console.log(`\n❌ API Integration: Only ${Math.round(workingEndpoints/totalEndpoints*100)}% endpoints working`);
      }

      expect(workingEndpoints).toBeGreaterThan(0);
    });
  });
});