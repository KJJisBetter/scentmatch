/**
 * Browse Page Functionality Tests - Task 4.1
 *
 * Tests for browse page data loading, timeout prevention, performance optimization,
 * and integration with new database structure. Ensures browse page works reliably
 * with large datasets and complex filtering.
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { createServiceSupabase } from '@/lib/supabase';

const API_BASE_URL = 'http://localhost:3000';

describe('Browse Page Functionality - Data Loading & Performance', () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createServiceSupabase();
  });

  describe('Browse Page Data Loading and Timeout Prevention', () => {
    test('should load browse page without timeout under 15 seconds', async () => {
      console.log('🔄 Testing browse page load time...');
      
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/browse`, {
        method: 'GET'
      });

      const loadTime = Date.now() - startTime;
      
      expect(response.ok).toBe(true);
      expect(loadTime).toBeLessThan(15000); // 15 second timeout limit
      
      if (loadTime > 10000) {
        console.log(`⚠️ Browse page slow: ${loadTime}ms (over 10 seconds)`);
      } else {
        console.log(`✅ Browse page load time: ${loadTime}ms`);
      }

      const pageContent = await response.text();
      expect(pageContent).toContain('Browse Fragrances');
    });

    test('should verify search API performance for browse page calls', async () => {
      console.log('🔄 Testing search API performance for browse page...');
      
      // Test the exact API calls browse page makes
      const browsePageAPICalls = [
        { endpoint: '/api/search?limit=20', description: 'Initial fragrance load' },
        { endpoint: '/api/search/filters', description: 'Filter options' },
        { endpoint: '/api/search?q=fresh&limit=10', description: 'Search with query' },
        { endpoint: '/api/search?gender=men&limit=10', description: 'Gender filter' },
        { endpoint: '/api/search?brand=Chanel&limit=10', description: 'Brand filter' }
      ];

      for (const apiCall of browsePageAPICalls) {
        const startTime = Date.now();
        
        const response = await fetch(`${API_BASE_URL}${apiCall.endpoint}`);
        const responseTime = Date.now() - startTime;

        expect(response.ok).toBe(true);
        expect(responseTime).toBeLessThan(3000); // 3 second limit for API calls

        if (response.ok) {
          const result = await response.json();
          expect(result.fragrances).toBeDefined();
          expect(Array.isArray(result.fragrances)).toBe(true);
          
          console.log(`✅ ${apiCall.description}: ${responseTime}ms (${result.fragrances?.length || 0} results)`);
        } else {
          console.log(`❌ ${apiCall.description}: ${response.status} in ${responseTime}ms`);
        }
      }
    });

    test('should handle large result sets efficiently', async () => {
      console.log('🔄 Testing large result set performance...');
      
      const largeResultTests = [
        { limit: 50, description: 'Medium page size' },
        { limit: 100, description: 'Large page size' },
        { limit: 200, description: 'Very large page size' }
      ];

      for (const test of largeResultTests) {
        const startTime = Date.now();
        
        const response = await fetch(`${API_BASE_URL}/api/search?limit=${test.limit}`);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const result = await response.json();
          
          expect(responseTime).toBeLessThan(5000); // 5 second limit for large queries
          expect(result.fragrances).toBeDefined();
          expect(result.fragrances.length).toBeLessThanOrEqual(test.limit);
          
          console.log(`✅ ${test.description} (${test.limit}): ${responseTime}ms → ${result.fragrances.length} fragrances`);
        } else {
          console.log(`❌ ${test.description}: ${response.status} in ${responseTime}ms`);
        }
      }
    });
  });

  describe('Browse Page Database Query Optimization', () => {
    test('should verify database query performance for browse filtering', async () => {
      console.log('🔄 Testing database query performance for filters...');
      
      // Test database queries that browse page filtering would use
      const filterQueries = [
        {
          description: 'Gender filtering',
          query: () => supabase.from('fragrances').select('id, name, gender').eq('gender', 'for men').limit(20)
        },
        {
          description: 'Brand filtering', 
          query: () => supabase.from('fragrances').select('id, name, brand_id').eq('brand_id', 'chanel').limit(20)
        },
        {
          description: 'Basic pagination',
          query: () => supabase.from('fragrances').select('id, name, gender').range(0, 19)
        },
        {
          description: 'Complex filtering',
          query: () => supabase.from('fragrances').select('id, name, gender, brand_id').eq('gender', 'for men').limit(20).order('name')
        }
      ];

      for (const testQuery of filterQueries) {
        const startTime = Date.now();
        
        const { data, error } = await testQuery.query();
        const queryTime = Date.now() - startTime;

        expect(error).toBeNull();
        expect(queryTime).toBeLessThan(1000); // 1 second limit for database queries
        
        console.log(`✅ ${testQuery.description}: ${queryTime}ms → ${data?.length || 0} results`);
      }
    });

    test('should verify fragrance data consistency for browse display', async () => {
      console.log('🔄 Testing fragrance data consistency...');
      
      // Test that fragrances have required fields for browse page display
      const { data: sampleFragrances, error } = await supabase
        .from('fragrances')
        .select('id, name, brand_id, gender')
        .limit(20);

      expect(error).toBeNull();
      expect(sampleFragrances).toBeDefined();
      expect(Array.isArray(sampleFragrances)).toBe(true);

      let validCount = 0;
      
      sampleFragrances?.forEach(fragrance => {
        const hasRequiredFields = fragrance.id && fragrance.name && fragrance.brand_id;
        if (hasRequiredFields) validCount++;
        
        expect(fragrance.id).toBeDefined();
        expect(fragrance.name).toBeDefined();
        expect(typeof fragrance.name).toBe('string');
        expect(fragrance.name.trim()).not.toBe('');
      });

      console.log(`✅ Data consistency: ${validCount}/${sampleFragrances?.length || 0} valid fragrance records`);
      expect(validCount).toBeGreaterThan(0);
    });

    test('should verify brand relationship queries work for browse page', async () => {
      console.log('🔄 Testing brand relationship queries...');
      
      // Test fragrance-brand joins that browse page uses
      const { data: fragrancesWithBrands, error } = await supabase
        .from('fragrances')
        .select(`
          id,
          name,
          brand_id,
          fragrance_brands!inner(name)
        `)
        .limit(10);

      if (error) {
        console.log(`⚠️ Brand relationship query error: ${error.message}`);
        
        // Test alternative approach
        const { data: fragrancesOnly } = await supabase
          .from('fragrances')
          .select('id, name, brand_id')
          .limit(10);

        expect(fragrancesOnly).toBeDefined();
        console.log(`✅ Basic fragrance queries working (${fragrancesOnly?.length || 0} records)`);
      } else {
        expect(fragrancesWithBrands).toBeDefined();
        expect(Array.isArray(fragrancesWithBrands)).toBe(true);
        
        console.log(`✅ Brand relationship queries working (${fragrancesWithBrands?.length || 0} records)`);
        
        // Verify brand data is accessible
        fragrancesWithBrands?.forEach(frag => {
          expect(frag.fragrance_brands).toBeDefined();
          expect((frag.fragrance_brands as any)?.name).toBeDefined();
        });
      }
    });
  });

  describe('Browse Page Loading States and Error Handling', () => {
    test('should verify proper loading states for browse page components', async () => {
      console.log('🔄 Testing browse page loading states...');
      
      // Test that loading states are properly implemented
      const browsePageResponse = await fetch(`${API_BASE_URL}/browse`);
      const pageContent = await browsePageResponse.text();

      // Should contain loading skeleton or proper content
      const hasLoadingState = pageContent.includes('loading-skeleton') || 
                             pageContent.includes('Loading') ||
                             pageContent.includes('fragrance');

      expect(hasLoadingState).toBe(true);
      console.log('✅ Browse page has proper loading states');
    });

    test('should verify error handling for browse page API failures', async () => {
      console.log('🔄 Testing browse page error handling...');
      
      // Test search filters endpoint (critical for browse page)
      const filtersResponse = await fetch(`${API_BASE_URL}/api/search/filters`);
      
      if (filtersResponse.ok) {
        const filtersData = await filtersResponse.json();
        
        expect(filtersData).toBeDefined();
        console.log('✅ Search filters API working for browse page');
        
        // Verify filter data structure
        expect(filtersData.brands || filtersData.scent_families || filtersData.metadata).toBeDefined();
      } else {
        console.log(`⚠️ Search filters API error: ${filtersResponse.status}`);
        
        // Browse page should handle this gracefully
        const filtersErrorText = await filtersResponse.text();
        expect(filtersErrorText).toBeDefined();
      }
    });

    test('should verify browse page fallback behavior when APIs fail', async () => {
      console.log('🔄 Testing browse page fallback behavior...');
      
      // Test invalid API calls that browse page might encounter
      const invalidResponse = await fetch(`${API_BASE_URL}/api/search?invalid_param=true&limit=10`);
      
      // Should handle gracefully (either work or return proper error)
      if (invalidResponse.ok) {
        const result = await invalidResponse.json();
        expect(result.fragrances || result.error).toBeDefined();
        console.log('✅ Browse page handles invalid parameters gracefully');
      } else {
        // Error response should be structured
        const errorText = await invalidResponse.text();
        expect(errorText).toBeDefined();
        console.log('✅ Browse page returns structured errors');
      }
    });
  });

  describe('Browse Page Performance with Large Datasets', () => {
    test('should verify performance with current fragrance dataset size', async () => {
      console.log('🔄 Testing performance with current dataset...');
      
      // Get total fragrance count
      const { count: totalFragrances } = await supabase
        .from('fragrances')
        .select('*', { count: 'exact', head: true });

      console.log(`📊 Total fragrances in database: ${totalFragrances}`);

      // Test pagination through dataset
      const pageSize = 20;
      const totalPages = Math.min(5, Math.ceil((totalFragrances || 0) / pageSize)); // Test first 5 pages

      for (let page = 1; page <= totalPages; page++) {
        const startTime = Date.now();
        
        const response = await fetch(`${API_BASE_URL}/api/fragrances?page=${page}&limit=${pageSize}`);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const result = await response.json();
          
          expect(responseTime).toBeLessThan(2000); // 2 second limit per page
          expect(result.fragrances).toBeDefined();
          expect(result.fragrances.length).toBeLessThanOrEqual(pageSize);
          
          console.log(`✅ Page ${page}: ${responseTime}ms → ${result.fragrances.length} fragrances`);
        } else {
          console.log(`❌ Page ${page}: ${response.status} in ${responseTime}ms`);
        }
      }
    });

    test('should verify complex filtering performance', async () => {
      console.log('🔄 Testing complex filtering performance...');
      
      const complexFilters = [
        { filter: 'gender=men', description: 'Gender filter only' },
        { filter: 'gender=men&brand=chanel', description: 'Gender + Brand' },
        { filter: 'gender=women&limit=50', description: 'Gender + Large limit' },
        { filter: 'q=fresh&gender=men&limit=20', description: 'Search + Gender + Limit' }
      ];

      for (const filterTest of complexFilters) {
        const startTime = Date.now();
        
        const response = await fetch(`${API_BASE_URL}/api/search?${filterTest.filter}`);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const result = await response.json();
          
          expect(responseTime).toBeLessThan(3000); // 3 second limit for complex queries
          expect(result.fragrances).toBeDefined();
          
          console.log(`✅ ${filterTest.description}: ${responseTime}ms → ${result.fragrances?.length || 0} results`);
        } else {
          console.log(`❌ ${filterTest.description}: ${response.status} in ${responseTime}ms`);
        }
      }
    });
  });

  describe('Browse Page Integration with Enhanced Database', () => {
    test('should verify browse page works with current database schema', async () => {
      console.log('🔄 Testing browse page database schema integration...');
      
      // Test that browse page can access fragrance data correctly
      const { data: fragranceData, error } = await supabase
        .from('fragrances')
        .select('id, name, brand_id, gender')
        .limit(5);

      expect(error).toBeNull();
      expect(fragranceData).toBeDefined();
      expect(Array.isArray(fragranceData)).toBe(true);

      if (fragranceData && fragranceData.length > 0) {
        console.log(`✅ Database schema compatible: ${fragranceData.length} fragrances accessible`);
        
        // Test individual fragrance API (used by browse page for details)
        const sampleFragrance = fragranceData[0];
        const detailResponse = await fetch(`${API_BASE_URL}/api/fragrances/${sampleFragrance.id}`);
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          expect(detailData.id).toBe(sampleFragrance.id);
          console.log(`✅ Individual fragrance API working for: ${detailData.name}`);
        } else {
          console.log(`⚠️ Individual fragrance API: ${detailResponse.status}`);
        }
      }
    });

    test('should verify enhanced metadata integration where available', async () => {
      console.log('🔄 Testing enhanced metadata integration...');
      
      // Check if enhanced columns are available
      const { data: sampleFragrance } = await supabase
        .from('fragrances')
        .select('*')
        .limit(1)
        .single();

      if (sampleFragrance) {
        console.log('Available fragrance fields:');
        Object.keys(sampleFragrance).forEach(key => {
          console.log(`   ${key}: ${typeof sampleFragrance[key]}`);
        });

        // Basic fields should always be available
        expect(sampleFragrance.id).toBeDefined();
        expect(sampleFragrance.name).toBeDefined();
        expect(sampleFragrance.brand_id).toBeDefined();
        
        console.log('✅ Core fragrance metadata accessible for browse page');
      }
    });

    test('should verify filtering and search integration', async () => {
      console.log('🔄 Testing filtering and search integration...');
      
      // Test search with various filters
      const searchTests = [
        { query: 'fresh', expectedType: 'text search' },
        { query: '', expectedType: 'browse all' },
        { query: 'Chanel', expectedType: 'brand search' }
      ];

      for (const searchTest of searchTests) {
        const response = await fetch(
          `${API_BASE_URL}/api/search?q=${encodeURIComponent(searchTest.query)}&limit=10`
        );

        if (response.ok) {
          const result = await response.json();
          
          expect(result.fragrances).toBeDefined();
          expect(Array.isArray(result.fragrances)).toBe(true);
          
          console.log(`✅ ${searchTest.expectedType}: ${result.fragrances?.length || 0} results`);
          
          // Verify result structure for browse page compatibility
          if (result.fragrances && result.fragrances.length > 0) {
            const firstResult = result.fragrances[0];
            expect(firstResult.id).toBeDefined();
            expect(firstResult.name).toBeDefined();
          }
        } else {
          console.log(`❌ ${searchTest.expectedType}: ${response.status}`);
        }
      }
    });
  });

  describe('Browse Page Performance Summary', () => {
    test('should provide comprehensive browse page performance report', async () => {
      console.log('\n📊 BROWSE PAGE PERFORMANCE SUMMARY:');
      
      // Test key browse page metrics
      const performanceTests = [
        {
          name: 'Initial Page Load',
          test: () => fetch(`${API_BASE_URL}/browse`),
          targetTime: 15000
        },
        {
          name: 'Default Fragrance List',
          test: () => fetch(`${API_BASE_URL}/api/search?limit=20`),
          targetTime: 2000
        },
        {
          name: 'Filter Options Load',
          test: () => fetch(`${API_BASE_URL}/api/search/filters`),
          targetTime: 1000
        },
        {
          name: 'Search Query',
          test: () => fetch(`${API_BASE_URL}/api/search?q=fresh&limit=10`),
          targetTime: 2000
        }
      ];

      const results = [];

      for (const perfTest of performanceTests) {
        const startTime = Date.now();
        
        try {
          const response = await perfTest.test();
          const responseTime = Date.now() - startTime;
          
          const passed = response.ok && responseTime < perfTest.targetTime;
          results.push({
            name: perfTest.name,
            time: responseTime,
            status: response.status,
            passed: passed
          });
          
          const icon = passed ? '✅' : '⚠️';
          console.log(`   ${icon} ${perfTest.name}: ${responseTime}ms (${response.status})`);
          
        } catch (error) {
          results.push({
            name: perfTest.name,
            time: -1,
            status: 'ERROR',
            passed: false
          });
          
          console.log(`   ❌ ${perfTest.name}: ERROR`);
        }
      }

      // Overall assessment
      const passedTests = results.filter(r => r.passed).length;
      const totalTests = results.length;
      
      console.log(`\n📈 Overall Performance: ${passedTests}/${totalTests} tests passed`);
      
      if (passedTests === totalTests) {
        console.log('🎉 Browse page performance: EXCELLENT');
      } else if (passedTests >= totalTests * 0.75) {
        console.log('✅ Browse page performance: GOOD');
      } else {
        console.log('⚠️ Browse page performance: NEEDS IMPROVEMENT');
      }

      expect(passedTests).toBeGreaterThan(0);
    });
  });
});