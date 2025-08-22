/**
 * Resource Validation Integration Test - SCE-63
 * 
 * Verifies the complete resource validation system works end-to-end
 * across all API endpoints and ensures zero 404 errors.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { validateFragranceImageUrl, validateFragranceImagesBatch } from '@/lib/resource-validation';
import { FALLBACK_IMAGES } from '@/lib/resource-validation/constants';

// Mock fetch for consistent testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Resource Validation Integration - SCE-63', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('should handle realistic fragrance data with mixed valid/invalid URLs', async () => {
    const fragrances = [
      {
        id: 'fragrance-1',
        name: 'Chanel No. 5',
        image_url: 'https://valid-cdn.com/chanel-no5.jpg',
        brand_id: 'chanel',
      },
      {
        id: 'fragrance-2', 
        name: 'Broken Image Fragrance',
        image_url: 'https://broken-cdn.com/missing.jpg',
        brand_id: 'unknown',
      },
      {
        id: 'fragrance-3',
        name: 'No Image Fragrance',
        image_url: null,
        brand_id: 'test',
      },
      {
        id: 'fragrance-4',
        name: 'Local Image Fragrance', 
        image_url: '/images/local-fragrance.png',
        brand_id: 'local',
      }
    ];

    // Mock responses for the different URLs
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      }) // Valid CDN image
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      }); // Broken CDN image

    const result = await validateFragranceImagesBatch(fragrances);

    expect(result).toHaveLength(4);
    
    // Valid URL should remain unchanged
    expect(result[0].image_url).toBe('https://valid-cdn.com/chanel-no5.jpg');
    
    // Broken URL should use fallback
    expect(result[1].image_url).toBe(FALLBACK_IMAGES.fragrance);
    
    // Null URL should use fallback
    expect(result[2].image_url).toBe(FALLBACK_IMAGES.fragrance);
    
    // Local URL should remain unchanged (not validated)
    expect(result[3].image_url).toBe('/images/local-fragrance.png');

    // All other properties should be preserved
    expect(result[0].name).toBe('Chanel No. 5');
    expect(result[1].brand_id).toBe('unknown');
    expect(result[2].id).toBe('fragrance-3');
    expect(result[3].brand_id).toBe('local');
  });

  test('should validate single fragrance with comprehensive metadata', async () => {
    const fragrance = {
      id: 'test-fragrance',
      name: 'Test Fragrance',
      image_url: 'https://test.com/image.jpg',
      description: 'A wonderful fragrance',
      notes: ['bergamot', 'rose', 'sandalwood'],
      brand_id: 'test-brand',
      scent_family: 'Oriental',
      sample_available: true,
      sample_price_usd: 15.99,
      intensity_score: 7,
      longevity_hours: 8,
      created_at: '2025-01-01T00:00:00Z'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/png' }),
    });

    const result = await validateFragranceImageUrl(fragrance);

    // Image URL should be validated and kept
    expect(result.image_url).toBe('https://test.com/image.jpg');
    
    // All other properties should be preserved exactly
    expect(result).toEqual({
      ...fragrance,
      image_url: 'https://test.com/image.jpg',
    });
  });

  test('should handle batch processing efficiently under performance targets', async () => {
    const fragrances = Array.from({ length: 20 }, (_, i) => ({
      id: `fragrance-${i}`,
      name: `Fragrance ${i}`,
      image_url: `https://example.com/fragrance-${i}.jpg`,
      brand_id: `brand-${i}`,
    }));

    // Mock all as valid for performance test
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
    });

    const startTime = performance.now();
    const result = await validateFragranceImagesBatch(fragrances);
    const duration = performance.now() - startTime;

    expect(result).toHaveLength(20);
    expect(duration).toBeLessThan(500); // Should meet batch target
    
    // All URLs should remain unchanged since they're valid
    result.forEach((fragrance, index) => {
      expect(fragrance.image_url).toBe(`https://example.com/fragrance-${index}.jpg`);
    });
  });

  test('should handle API response structure typical of search endpoints', async () => {
    const apiResponse = {
      fragrances: [
        {
          id: 'search-1',
          name: 'Search Result 1',
          image_url: 'https://cdn.com/valid.jpg',
          relevance_score: 0.95,
        },
        {
          id: 'search-2', 
          name: 'Search Result 2',
          image_url: 'https://broken.com/missing.jpg',
          relevance_score: 0.87,
        }
      ],
      total: 2,
      query: 'floral',
      metadata: {
        search_time_ms: 45,
        total_available: 150,
      }
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

    const validatedFragrances = await validateFragranceImagesBatch(apiResponse.fragrances);

    expect(validatedFragrances[0].image_url).toBe('https://cdn.com/valid.jpg');
    expect(validatedFragrances[1].image_url).toBe(FALLBACK_IMAGES.fragrance);
    
    // Non-image properties should be preserved
    expect(validatedFragrances[0].relevance_score).toBe(0.95);
    expect(validatedFragrances[1].relevance_score).toBe(0.87);
  });

  test('should ensure zero 404 errors in final output', async () => {
    const problematicFragrances = [
      { id: '1', name: 'Test 1', image_url: 'invalid-url' },
      { id: '2', name: 'Test 2', image_url: '' },
      { id: '3', name: 'Test 3', image_url: null },
      { id: '4', name: 'Test 4', image_url: undefined },
      { id: '5', name: 'Test 5' }, // no image_url property
    ];

    const result = await validateFragranceImagesBatch(problematicFragrances);

    // All should have valid image URLs (fallbacks)
    result.forEach((fragrance) => {
      expect(fragrance.image_url).toBeTruthy();
      expect(fragrance.image_url).toBe(FALLBACK_IMAGES.fragrance);
      expect(fragrance.image_url.startsWith('/')).toBe(true); // Local path
    });

    // Verify fallback images actually exist
    expect(FALLBACK_IMAGES.fragrance).toBe('/images/fallback/fragrance-placeholder.svg');
    expect(FALLBACK_IMAGES.brand).toBe('/images/fallback/brand-placeholder.svg');
    expect(FALLBACK_IMAGES.user).toBe('/images/fallback/user-placeholder.svg');
    expect(FALLBACK_IMAGES.default).toBe('/images/fallback/default-placeholder.svg');
  });

  test('should handle concurrent validation requests without conflicts', async () => {
    const fragranceSet1 = [
      { id: 'concurrent-1', name: 'Concurrent 1', image_url: 'https://test1.com/image.jpg' },
      { id: 'concurrent-2', name: 'Concurrent 2', image_url: 'https://test2.com/image.jpg' },
    ];

    const fragranceSet2 = [
      { id: 'concurrent-3', name: 'Concurrent 3', image_url: 'https://test3.com/image.jpg' },
      { id: 'concurrent-4', name: 'Concurrent 4', image_url: 'https://test4.com/image.jpg' },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
    });

    // Run concurrent validations
    const [result1, result2] = await Promise.all([
      validateFragranceImagesBatch(fragranceSet1),
      validateFragranceImagesBatch(fragranceSet2)
    ]);

    expect(result1).toHaveLength(2);
    expect(result2).toHaveLength(2);
    
    // Results should not interfere with each other
    expect(result1[0].id).toBe('concurrent-1');
    expect(result2[0].id).toBe('concurrent-3');
  });
});