import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/search/route';

// Mock Supabase client to simulate database responses
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
};

// Mock the createServerSupabase function
vi.mock('@/lib/supabase', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock AI/search dependencies to prevent them from running
vi.mock('@/lib/ai/voyage-client', () => ({
  generateQueryEmbedding: vi.fn(),
}));

vi.mock('@/lib/ai/ai-search', () => ({
  SemanticSearchEngine: vi.fn(),
  QueryProcessor: vi.fn(),
  IntentClassifier: vi.fn(),
  HybridSearchEngine: vi.fn().mockImplementation(() => ({
    search: vi
      .fn()
      .mockRejectedValue(new Error('AI search disabled for testing')),
  })),
  SearchPersonalizer: vi.fn(),
}));

describe('Search API Brand Name Mapping Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockSupabase.from.mockReset();
    mockSupabase.rpc.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Brand Name Resolution Bug Detection', () => {
    test('should detect when brand_id is used instead of brand name for "dior" query', async () => {
      // Simulate database response where brand_id != brand name
      const mockFragranceResults = [
        {
          id: 'fragrance-1',
          name: 'Sauvage',
          brand_id: 'brand-dior-uuid-123', // This is what's being returned as "brand"
          gender: 'masculine',
        },
        {
          id: 'fragrance-2',
          name: 'Miss Dior',
          brand_id: 'brand-dior-uuid-123',
          gender: 'feminine',
        },
      ];

      // Mock the fallback search query chain
      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockFragranceResults,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search?q=dior'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();

      // CRITICAL TEST: Verify that we can detect the brand mapping bug
      expect(data.fragrances).toBeDefined();
      expect(data.fragrances.length).toBeGreaterThan(0);

      // This test will FAIL when the bug exists because brand will be the UUID
      // When fixed, brand should be the actual brand name "Dior"
      for (const fragrance of data.fragrances) {
        // Check if brand field contains a UUID (indicating the bug)
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            fragrance.brand
          );
        const containsUuid =
          fragrance.brand?.includes('uuid') ||
          fragrance.brand?.includes('brand-');

        if (isUuid || containsUuid) {
          console.warn(
            `🐛 BRAND MAPPING BUG DETECTED: Fragrance "${fragrance.name}" has brand="${fragrance.brand}" (appears to be brand_id instead of brand name)`
          );
        }

        // The brand should be a human-readable name, not an ID or "Unknown Brand"
        expect(fragrance.brand).toBeDefined();
        expect(fragrance.brand).not.toBe('Unknown Brand');
        expect(fragrance.brand).not.toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        ); // Not a UUID
        expect(fragrance.brand).not.toMatch(/brand-.*-uuid/); // Not a brand ID pattern
      }
    });

    test('should return proper brand names when search API is working correctly', async () => {
      // Simulate what the response SHOULD look like when properly fixed
      const mockCorrectResults = [
        {
          id: 'fragrance-1',
          name: 'Sauvage',
          brand_id: 'brand-dior-uuid-123',
          gender: 'masculine',
          // In a proper fix, we would join with fragrance_brands table to get:
          brand_name: 'Dior', // This would come from fragrance_brands.name
        },
        {
          id: 'fragrance-2',
          name: 'Miss Dior',
          brand_id: 'brand-dior-uuid-123',
          gender: 'feminine',
          brand_name: 'Dior',
        },
      ];

      // Mock a search that includes brand name (simulating proper JOIN)
      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockCorrectResults,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search?q=dior'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();

      // Verify proper brand name mapping
      expect(data.fragrances).toBeDefined();
      expect(data.fragrances.length).toBeGreaterThan(0);

      for (const fragrance of data.fragrances) {
        // When properly fixed, all Dior fragrances should show "Dior" as brand
        if (
          fragrance.name.toLowerCase().includes('dior') ||
          fragrance.name.toLowerCase().includes('sauvage')
        ) {
          // Should be the actual brand name
          expect(fragrance.brand).toBe('Dior');
          // Should not be a UUID or unknown
          expect(fragrance.brand).not.toMatch(/^[0-9a-f-]{36}$/);
          expect(fragrance.brand).not.toBe('Unknown Brand');
          expect(fragrance.brand).not.toBe('brand-dior-uuid-123');
        }
      }
    });
  });

  describe('Search API Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database error
      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed', code: '08003' },
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search?q=dior'
      );
      const response = await GET(request);

      expect(response.status).toBe(503);

      const data = await response.json();
      expect(data.error).toBe('Search temporarily unavailable');
    });

    test('should handle empty search results', async () => {
      // Mock empty results
      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search?q=nonexistentbrand'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.fragrances).toEqual([]);
      expect(data.total).toBe(0);
    });
  });

  describe('Search Query Validation', () => {
    test('should handle empty query and return default results', async () => {
      const mockDefaultResults = [
        {
          id: 'popular-1',
          name: 'Popular Fragrance 1',
          brand_id: 'brand-1',
          gender: 'unisex',
        },
        {
          id: 'popular-2',
          name: 'Popular Fragrance 2',
          brand_id: 'brand-2',
          gender: 'unisex',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockDefaultResults,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const request = new NextRequest('http://localhost:3000/api/search');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.fragrances).toBeDefined();
      expect(data.query).toBe('');
    });

    test('should validate brand filter parameter', async () => {
      const mockBrandFilterResults = [
        {
          id: 'fragrance-1',
          name: 'Fragrance from specific brand',
          brand_id: 'specific-brand-id',
          gender: 'unisex',
        },
      ];

      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: mockBrandFilterResults,
            error: null,
          }),
        }),
      });

      const mockOr = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      const mockSelect = vi.fn().mockReturnValue({
        or: mockOr,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search?q=test&brand=specific-brand-id'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);

      // Verify that the brand filter was applied
      expect(mockEq).toHaveBeenCalledWith('brand_id', 'specific-brand-id');
    });
  });

  describe('Response Format Validation', () => {
    test('should return properly formatted response structure', async () => {
      const mockResults = [
        {
          id: 'test-fragrance',
          name: 'Test Fragrance',
          brand_id: 'test-brand-id',
          gender: 'unisex',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockResults,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search?q=test'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();

      // Validate response structure
      expect(data).toHaveProperty('fragrances');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('query');
      expect(data).toHaveProperty('search_method');
      expect(data).toHaveProperty('filters_applied');
      expect(data).toHaveProperty('metadata');

      // Validate fragrance objects structure
      if (data.fragrances.length > 0) {
        const fragrance = data.fragrances[0];
        expect(fragrance).toHaveProperty('id');
        expect(fragrance).toHaveProperty('name');
        expect(fragrance).toHaveProperty('brand'); // This is the critical field for brand mapping
        expect(fragrance).toHaveProperty('brand_id');
        expect(fragrance).toHaveProperty('gender');
        expect(fragrance).toHaveProperty('relevance_score');
        expect(fragrance).toHaveProperty('sample_available');
        expect(fragrance).toHaveProperty('sample_price_usd');
      }
    });

    test('should include proper cache headers', async () => {
      const mockResults = [
        {
          id: 'test-fragrance',
          name: 'Test Fragrance',
          brand_id: 'test-brand-id',
          gender: 'unisex',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockResults,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search?q=test'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);

      // Validate cache headers are present
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toBeTruthy();
      expect(cacheControl).toContain('public');

      // Validate search metadata headers
      expect(response.headers.get('X-AI-Powered')).toBeDefined();
      expect(response.headers.get('X-Search-Method')).toBeDefined();
      expect(response.headers.get('X-Processing-Time')).toBeDefined();
    });
  });

  describe('Brand Name Regression Prevention', () => {
    test('should prevent "Unknown Brand" from appearing in search results', async () => {
      // Test various scenarios that could lead to "Unknown Brand"
      const problematicResults = [
        {
          id: 'fragrance-1',
          name: 'Fragrance with null brand_id',
          brand_id: null,
          gender: 'unisex',
        },
        {
          id: 'fragrance-2',
          name: 'Fragrance with undefined brand_id',
          brand_id: undefined,
          gender: 'unisex',
        },
        {
          id: 'fragrance-3',
          name: 'Fragrance with empty brand_id',
          brand_id: '',
          gender: 'unisex',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: problematicResults,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search?q=test'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();

      // Check that no fragrance has "Unknown Brand" as the brand
      for (const fragrance of data.fragrances) {
        if (fragrance.brand === 'Unknown Brand') {
          console.warn(
            `⚠️  REGRESSION DETECTED: Fragrance "${fragrance.name}" shows "Unknown Brand"`
          );

          // When properly fixed, even null brand_ids should be handled gracefully
          // Either with a proper brand name lookup or a better fallback than "Unknown Brand"
        }

        // Ideally, we should never see "Unknown Brand" in production
        // This test will fail until the proper brand name lookup is implemented
        expect(fragrance.brand).not.toBe('Unknown Brand');
      }
    });

    test('should use proper brand name lookup for known brands', async () => {
      // Simulate a properly implemented brand lookup
      const resultsWithBrandLookup = [
        {
          id: 'fragrance-1',
          name: 'Sauvage EDT',
          brand_id: 'dior-brand-id',
          gender: 'masculine',
          // This would come from a JOIN with fragrance_brands table
          brand_name: 'Dior',
        },
        {
          id: 'fragrance-2',
          name: 'No. 5',
          brand_id: 'chanel-brand-id',
          gender: 'feminine',
          brand_name: 'Chanel',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: resultsWithBrandLookup,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/search?q=luxury'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();

      // Verify that brand names are human-readable
      const expectedBrands = ['Dior', 'Chanel'];

      for (const fragrance of data.fragrances) {
        expect(fragrance.brand).toBeDefined();
        expect(fragrance.brand).not.toBe('Unknown Brand');
        expect(fragrance.brand).not.toMatch(/^[a-f0-9-]{36}$/); // Not a UUID

        // For known test data, verify correct brand mapping
        if (fragrance.name === 'Sauvage EDT') {
          expect(fragrance.brand).toBe('Dior');
        } else if (fragrance.name === 'No. 5') {
          expect(fragrance.brand).toBe('Chanel');
        }
      }
    });
  });
});

/*
 * CRITICAL BUG DETECTION SUMMARY:
 *
 * This test suite specifically targets the brand name mapping bug where:
 * 1. Search API returns brand_id (UUID) instead of brand name
 * 2. Results show "Unknown Brand" when brand_id is null
 * 3. Users see technical UUIDs instead of "Dior", "Chanel", etc.
 *
 * THE FIX REQUIRED:
 * 1. The search query needs to JOIN fragrances with fragrance_brands table
 * 2. Select fragrance_brands.name AS brand instead of using brand_id
 * 3. Handle null brand_id cases gracefully (perhaps "Independent" or proper lookup)
 *
 * TESTS WILL PASS WHEN:
 * ✅ Search returns actual brand names like "Dior", "Chanel"
 * ✅ No "Unknown Brand" appears in results
 * ✅ No UUIDs appear as brand names
 * ✅ Proper error handling for missing brand data
 *
 * CURRENT BUG LOCATION:
 * /app/api/search/route.ts line 178: brand: result.brand_id || 'Unknown Brand'
 *
 * This should be: brand: result.brand_name || result.brand || 'Independent'
 * With proper JOIN: fragrance_brands.name AS brand_name
 */
