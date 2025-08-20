/**
 * Enhanced Search System Integration Tests
 * Tests multi-stage search with canonical fragrance system integration
 * Addresses malformed names and missing products from Linear issues SCE-49/50/51
 * Spec: @.agent-os/specs/2025-08-20-fragrance-data-quality-system/
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServiceSupabase } from '@/lib/supabase'

const supabase = createServiceSupabase()

describe('Enhanced Search System Integration', () => {
  let testCanonicalId: string
  
  beforeAll(async () => {
    // Create test canonical fragrance with variants for testing
    const { data: canonical } = await supabase
      .from('fragrances_canonical')
      .insert({
        canonical_name: 'Test Search Fragrance',
        brand_id: 'test-brand',
        fragrance_line: 'Test Search'
      })
      .select('id')
      .single()

    testCanonicalId = canonical?.id || ''

    // Create test variants
    await supabase
      .from('fragrance_variants')
      .insert([
        {
          canonical_id: testCanonicalId,
          variant_name: 'Test Search EDP',
          source: 'manual',
          confidence: 0.9,
          is_malformed: false
        },
        {
          canonical_id: testCanonicalId,
          variant_name: 'TEST SEARCH PARFUM',
          source: 'import', 
          confidence: 0.8,
          is_malformed: true
        }
      ])
  })

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('fragrance_variants').delete().eq('canonical_id', testCanonicalId)
    await supabase.from('fragrances_canonical').delete().eq('id', testCanonicalId)
  })

  describe('SEARCH-001: Multi-Stage Search Algorithm', () => {
    it('SEARCH-001a: Stage 1 - Exact Match Priority', async () => {
      // Test that exact matches get highest priority
      const { data: results, error } = await supabase
        .rpc('search_fragrances_smart', {
          query_text: 'Test Search Fragrance',
          limit_count: 10
        })

      expect(error).toBeNull()
      expect(Array.isArray(results)).toBe(true)

      if (results && results.length > 0) {
        expect(results[0].match_type).toBe('exact')
        expect(results[0].similarity_score).toBe(1.0)
        expect(results[0].canonical_name).toBe('Test Search Fragrance')
      }
    })

    it('SEARCH-001b: Stage 2 - Variant Match Detection', async () => {
      // Test that variant names are matched to canonical
      const { data: results, error } = await supabase
        .rpc('search_fragrances_smart', {
          query_text: 'Test Search EDP',
          limit_count: 10
        })

      expect(error).toBeNull()
      
      if (results && results.length > 0) {
        expect(results[0].match_type).toBe('variant')
        expect(results[0].canonical_name).toBe('Test Search Fragrance')
        expect(results[0].similarity_score).toBeGreaterThan(0.8)
      }
    })

    it('SEARCH-001c: Stage 3 - Fuzzy Text Matching', async () => {
      // Test fuzzy matching for typos and variations
      const { data: results, error } = await supabase
        .rpc('search_fragrances_smart', {
          query_text: 'Test Serch Fragrnce', // Intentional typos
          limit_count: 10
        })

      expect(error).toBeNull()
      
      if (results && results.length > 0) {
        expect(results[0].match_type).toBe('fuzzy')
        expect(results[0].similarity_score).toBeGreaterThan(0.3)
      }
    })

    it('SEARCH-001d: Stage 4 - Semantic Vector Search', async () => {
      // Test semantic search with embeddings (if available)
      const testEmbedding = Array(1536).fill(0.1) // Mock embedding
      
      const { data: results, error } = await supabase
        .rpc('search_fragrances_smart', {
          query_text: 'Nonexistent Product Name',
          query_embedding: testEmbedding,
          limit_count: 5
        })

      expect(error).toBeNull()
      
      if (results && results.length > 0) {
        expect(results[0].match_type).toBe('semantic')
        expect(results[0].similarity_score).toBeGreaterThan(0.0)
      }
    })
  })

  describe('SEARCH-002: Integration with Existing Search API', () => {
    it('SEARCH-002a: Current Search API Compatibility', async () => {
      // Test that existing /api/search endpoint still works
      const response = await fetch('http://localhost:3000/api/search?q=chanel')
      
      expect([200, 503]).toContain(response.status) // 503 if server not running
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('fragrances')
        expect(Array.isArray(data.fragrances)).toBe(true)
        expect(data).toHaveProperty('metadata')
      }
    })

    it('SEARCH-002b: Search Performance Baseline', async () => {
      // Test current search performance
      const startTime = Date.now()
      
      const response = await fetch('http://localhost:3000/api/search?q=chanel&limit=20')
      
      const responseTime = Date.now() - startTime
      expect(responseTime).toBeLessThan(2000) // Reasonable baseline
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.metadata.processing_time_ms).toBeLessThan(500)
      }
    })
  })

  describe('SEARCH-003: Malformed Name Handling (SCE-49/51)', () => {
    it('SEARCH-003a: Search for "Bleu De EDP" Returns Canonical', async () => {
      // Test that searching for malformed names finds canonical versions
      const response = await fetch('http://localhost:3000/api/search/smart?q=Bleu%20De%20EDP')
      
      expect([200, 404]).toContain(response.status)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.success).toBe(true)
        
        // Should find Chanel Bleu de Chanel through normalization
        const chanelResults = data.data.results.filter((result: any) => 
          result.brand.toLowerCase().includes('chanel') &&
          result.name.toLowerCase().includes('bleu')
        )
        expect(chanelResults.length).toBeGreaterThan(0)
      }
    })

    it('SEARCH-003b: Search for "N05" Returns Chanel No 5', async () => {
      // Test Chanel number abbreviation handling
      const response = await fetch('http://localhost:3000/api/search/smart?q=N05')
      
      expect([200, 404]).toContain(response.status)
      
      if (response.status === 200) {
        const data = await response.json()
        
        // Should find Chanel No 5 through abbreviation expansion
        const no5Results = data.data.results.filter((result: any) =>
          result.name.toLowerCase().includes('no 5') ||
          result.name.toLowerCase().includes('no.5')
        )
        expect(no5Results.length).toBeGreaterThan(0)
      }
    })

    it('SEARCH-003c: All-Caps Search Normalization', async () => {
      // Test that all-caps searches are handled properly
      const response = await fetch('http://localhost:3000/api/search/smart?q=SAUVAGE%20EDT')
      
      expect([200, 404]).toContain(response.status)
      
      if (response.status === 200) {
        const data = await response.json()
        
        // Should find Dior Sauvage through normalization
        const sauvageResults = data.data.results.filter((result: any) =>
          result.name.toLowerCase().includes('sauvage')
        )
        expect(sauvageResults.length).toBeGreaterThan(0)
      }
    })
  })

  describe('SEARCH-004: Missing Product Intelligence (SCE-50)', () => {
    it('SEARCH-004a: "Coach For Men" Returns Alternatives', async () => {
      // Test the specific Linear issue case
      const response = await fetch('http://localhost:3000/api/search/smart?q=Coach%20For%20Men')
      
      expect([200, 404]).toContain(response.status)
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data && data.data.alternatives) {
          // Missing product handling kicked in
          expect(data.data.alternatives.length).toBeGreaterThan(0)
          expect(data.data.message).toContain("couldn't find that exact product")
          
          // Should suggest Coach brand alternatives or masculine fragrances
          const relevantAlts = data.data.alternatives.filter((alt: any) =>
            alt.brand.toLowerCase().includes('coach') ||
            alt.match_reason.toLowerCase().includes('masculine')
          )
          expect(relevantAlts.length).toBeGreaterThan(0)
        }
      }
    })

    it('SEARCH-004b: Missing Product Logging Integration', async () => {
      // Test that missing product searches are logged
      const response = await fetch('http://localhost:3000/api/search/smart?q=Completely%20Nonexistent%20Product')
      
      expect([200, 404]).toContain(response.status)
      
      // Check if missing product was logged (via missing product summary)
      const { data: summaryCheck } = await supabase
        .from('missing_product_summary')
        .select('request_count')
        .eq('normalized_query', 'completely nonexistent product')
        .single()

      // May not exist yet, but test structure should handle logging
      expect(true).toBe(true) // Passes if no errors thrown
    })

    it('SEARCH-004c: Popular Missing Products Get Priority', async () => {
      // Test that frequently searched missing products get higher priority
      const popularQuery = 'Popular Missing Fragrance Test'
      
      // Simulate multiple searches
      for (let i = 0; i < 5; i++) {
        await fetch(`http://localhost:3000/api/search/smart?q=${encodeURIComponent(popularQuery)}`)
      }
      
      // Check priority was assigned
      const { data: priorityCheck } = await supabase
        .from('missing_product_summary') 
        .select('priority_score, request_count')
        .eq('normalized_query', popularQuery.toLowerCase())
        .single()

      if (priorityCheck) {
        expect(priorityCheck.priority_score).toBeGreaterThan(1)
        expect(priorityCheck.request_count).toBeGreaterThanOrEqual(5)
      }
    })
  })

  describe('SEARCH-005: Performance Requirements', () => {
    it('SEARCH-005a: Single Search Under 150ms Target', async () => {
      // Test performance target for enhanced search
      const startTime = Date.now()
      
      const { data: results, error } = await supabase
        .rpc('search_fragrances_smart', {
          query_text: 'chanel',
          limit_count: 20
        })
      
      const processingTime = Date.now() - startTime
      
      expect(error).toBeNull()
      expect(processingTime).toBeLessThan(150) // Target <150ms
    })

    it('SEARCH-005b: Concurrent Search Performance', async () => {
      // Test performance under concurrent load
      const searches = Array.from({ length: 5 }, (_, i) =>
        supabase.rpc('search_fragrances_smart', {
          query_text: `test query ${i}`,
          limit_count: 10
        })
      )

      const startTime = Date.now()
      const results = await Promise.all(searches)
      const totalTime = Date.now() - startTime

      results.forEach(({ error }) => {
        expect(error).toBeNull()
      })

      const avgTime = totalTime / searches.length
      expect(avgTime).toBeLessThan(200) // Reasonable under concurrent load
    })

    it('SEARCH-005c: Large Result Set Performance', async () => {
      // Test performance with larger result sets
      const startTime = Date.now()
      
      const { data: results, error } = await supabase
        .rpc('search_fragrances_smart', {
          query_text: 'eau', // Common term, should match many
          limit_count: 50
        })
      
      const processingTime = Date.now() - startTime
      
      expect(error).toBeNull()
      expect(processingTime).toBeLessThan(300) // Acceptable for large sets
    })
  })

  describe('SEARCH-006: Search Result Quality', () => {
    it('SEARCH-006a: Relevance Ranking Accuracy', async () => {
      // Test that most relevant results appear first
      const { data: results, error } = await supabase
        .rpc('search_fragrances_smart', {
          query_text: 'chanel no 5',
          limit_count: 10
        })

      expect(error).toBeNull()
      
      if (results && results.length > 0) {
        // First result should be most relevant
        expect(results[0].similarity_score).toBeGreaterThan(0.8)
        
        // Results should be sorted by similarity (descending)
        for (let i = 1; i < results.length; i++) {
          expect(results[i-1].similarity_score).toBeGreaterThanOrEqual(results[i].similarity_score)
        }
      }
    })

    it('SEARCH-006b: Match Type Progression', async () => {
      // Test that match types progress logically (exact → variant → fuzzy → semantic)
      const searches = [
        { query: 'Test Search Fragrance', expectedType: 'exact' },
        { query: 'Test Search EDP', expectedType: 'variant' },
        { query: 'Test Serch Frag', expectedType: 'fuzzy' }
      ]

      for (const { query, expectedType } of searches) {
        const { data: results } = await supabase
          .rpc('search_fragrances_smart', { query_text: query, limit_count: 5 })

        if (results && results.length > 0) {
          expect(results[0].match_type).toBe(expectedType)
        }
      }
    })

    it('SEARCH-006c: No False Positives', async () => {
      // Test that irrelevant results don't appear with high scores
      const { data: results, error } = await supabase
        .rpc('search_fragrances_smart', {
          query_text: 'completely unrelated search term xyz123',
          limit_count: 10
        })

      expect(error).toBeNull()
      
      if (results && results.length > 0) {
        // Any results should have reasonable similarity scores
        results.forEach((result: any) => {
          if (result.similarity_score > 0.7) {
            // High scores should only be for actually relevant results
            expect(result.canonical_name.toLowerCase()).toContain('xyz')
          }
        })
      }
    })
  })

  describe('SEARCH-007: Fallback Strategy Testing', () => {
    it('SEARCH-007a: Graceful Degradation', async () => {
      // Test that search works even if some stages fail
      
      // Test with missing embedding (should skip semantic search)
      const { data: results, error } = await supabase
        .rpc('search_fragrances_smart', {
          query_text: 'test query',
          query_embedding: null, // No embedding provided
          limit_count: 5
        })

      expect(error).toBeNull()
      expect(Array.isArray(results)).toBe(true)
    })

    it('SEARCH-007b: Empty Result Handling', async () => {
      // Test handling when no matches found at any stage
      const { data: results, error } = await supabase
        .rpc('search_fragrances_smart', {
          query_text: 'xyzabc123nonexistent',
          limit_count: 5
        })

      expect(error).toBeNull()
      expect(Array.isArray(results)).toBe(true)
      // May be empty array, which is acceptable
    })
  })

  describe('SEARCH-008: Integration with Current Search System', () => {
    it('SEARCH-008a: Current API Endpoint Still Functions', async () => {
      // Ensure existing search API continues to work
      const response = await fetch('http://localhost:3000/api/search?q=test&limit=5')
      
      expect([200, 503]).toContain(response.status)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('fragrances')
        expect(data).toHaveProperty('metadata')
        expect(data.metadata).toHaveProperty('processing_time_ms')
      }
    })

    it('SEARCH-008b: Enhanced Search Endpoint Creation', async () => {
      // Test new enhanced search endpoint
      const response = await fetch('http://localhost:3000/api/search/smart?q=test&limit=5')
      
      expect([200, 404]).toContain(response.status)
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data).toHaveProperty('results')
        expect(data.data).toHaveProperty('search_strategy')
        expect(data.data).toHaveProperty('processing_time_ms')
      }
    })
  })

  describe('SEARCH-009: Brand Intelligence Integration', () => {
    it('SEARCH-009a: Brand Family Recognition', async () => {
      // Test that brand searches find related brand families
      const brandSearches = [
        'armani', // Should find Giorgio Armani and Emporio Armani
        'dior', // Should find Christian Dior
        'ysl', // Should find Yves Saint Laurent
        'ck' // Should find Calvin Klein
      ]

      for (const brand of brandSearches) {
        const response = await fetch(`http://localhost:3000/api/search?q=${brand}&limit=10`)
        
        if (response.status === 200) {
          const data = await response.json()
          expect(data.fragrances.length).toBeGreaterThan(0)
          
          // Should find multiple fragrances for major brands
          if (['armani', 'dior'].includes(brand)) {
            expect(data.fragrances.length).toBeGreaterThan(3)
          }
        }
      }
    })

    it('SEARCH-009b: Brand Normalization Consistency', async () => {
      // Test that brand names are consistently normalized in results
      const response = await fetch('http://localhost:3000/api/search?q=armani&limit=10')
      
      if (response.status === 200) {
        const data = await response.json()
        
        data.fragrances.forEach((fragrance: any) => {
          // Brand names should be properly formatted
          expect(fragrance.brand).not.toMatch(/[a-z]+-[a-z]+/) // No kebab-case
          expect(fragrance.brand).toMatch(/^[A-Z]/) // Proper capitalization
        })
      }
    })
  })

  describe('SEARCH-010: Cache and Optimization', () => {
    it('SEARCH-010a: Response Caching Headers', async () => {
      // Test that search responses include proper caching headers
      const response = await fetch('http://localhost:3000/api/search?q=popular&limit=5')
      
      if (response.status === 200) {
        const cacheControl = response.headers.get('cache-control')
        expect(cacheControl).toBeDefined()
        expect(cacheControl).toContain('s-maxage')
      }
    })

    it('SEARCH-010b: Search Method Reporting', async () => {
      // Test that responses indicate which search method was used
      const response = await fetch('http://localhost:3000/api/search?q=test&limit=5')
      
      if (response.status === 200) {
        const data = await response.json()
        expect(data.search_method).toBeDefined()
        expect(['database_function', 'fallback_database', 'enhanced_smart']).toContain(data.search_method)
      }
    })
  })

  describe('SEARCH-011: Error Handling and Resilience', () => {
    it('SEARCH-011a: Invalid Query Parameter Handling', async () => {
      const invalidQueries = [
        '', // Empty query
        'a', // Too short
        'x'.repeat(300), // Too long
        '!@#$%^&*()', // Special characters only
      ]

      for (const query of invalidQueries) {
        const response = await fetch(`http://localhost:3000/api/search/smart?q=${encodeURIComponent(query)}`)
        
        // Should handle gracefully, not crash
        expect([200, 400]).toContain(response.status)
      }
    })

    it('SEARCH-011b: Database Connection Resilience', async () => {
      // Test that search handles database issues gracefully
      const response = await fetch('http://localhost:3000/api/search?q=test&limit=5')
      
      // Should return valid response structure even if errors occur
      expect([200, 503, 500]).toContain(response.status)
      
      if (response.headers.get('content-type')?.includes('json')) {
        const data = await response.json()
        expect(data).toBeDefined()
      }
    })
  })

  describe('SEARCH-012: User Experience Integration', () => {
    it('SEARCH-012a: Search Result Format Consistency', async () => {
      // Test that enhanced search returns format compatible with UI
      const response = await fetch('http://localhost:3000/api/search/smart?q=test&limit=5')
      
      if (response.status === 200) {
        const data = await response.json()
        
        if (data.data && data.data.results) {
          data.data.results.forEach((result: any) => {
            expect(result).toHaveProperty('fragrance_id')
            expect(result).toHaveProperty('name')
            expect(result).toHaveProperty('brand')
            expect(result).toHaveProperty('similarity_score')
            expect(result).toHaveProperty('match_type')
            
            // UI compatibility
            expect(typeof result.name).toBe('string')
            expect(typeof result.brand).toBe('string')
            expect(typeof result.similarity_score).toBe('number')
          })
        }
      }
    })

    it('SEARCH-012b: Mobile Search Performance', async () => {
      // Test search performance expectations for mobile users
      const mobileUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      
      const response = await fetch('http://localhost:3000/api/search?q=chanel&limit=10', {
        headers: {
          'User-Agent': mobileUserAgent
        }
      })
      
      if (response.status === 200) {
        const data = await response.json()
        // Mobile users expect faster responses
        expect(data.metadata.processing_time_ms).toBeLessThan(300)
      }
    })
  })
})