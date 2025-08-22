import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { isResourceAccessible, validateResourceUrl, validateFragranceImageUrl, clearValidationCache } from '@/lib/resource-validation';
import { FALLBACK_IMAGES } from '@/lib/resource-validation/constants';

/**
 * Resource Validation Tests - SCE-63
 * 
 * Tests for resolving 404 errors for missing resources:
 * - URL validation logic
 * - Resource accessibility checks
 * - Fallback image handling
 * - Performance requirements (<200ms)
 */

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Resource Validation System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    mockFetch.mockClear();
    clearValidationCache(); // Clear cache to ensure clean state
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isResourceAccessible', () => {
    test('should return true for accessible images', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      } as Response);

      const result = await isResourceAccessible('https://example.com/image.jpg');
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/image.jpg', {
        method: 'HEAD',
        signal: expect.any(AbortSignal),
      });
    });

    test('should return false for 404 resources', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await isResourceAccessible('https://example.com/missing.jpg');
      
      expect(result).toBe(false);
    });

    test('should return false for non-image content types', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
      } as Response);

      const result = await isResourceAccessible('https://example.com/not-image.html');
      
      expect(result).toBe(false);
    });

    test('should handle network errors gracefully', async () => {
      // Mock fetch to throw a network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await isResourceAccessible('https://networkfail.com/image.jpg');
      
      expect(result).toBe(false);
    });

    test('should timeout after 5 seconds', async () => {
      vi.useFakeTimers();
      
      // Mock a fetch that never resolves but can be aborted
      mockFetch.mockImplementationOnce((url, options) => {
        return new Promise((resolve, reject) => {
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              reject(new Error('AbortError'));
            });
          }
        });
      });

      const promise = isResourceAccessible('https://slow-server.com/image.jpg');
      
      // Fast-forward past the timeout
      vi.advanceTimersByTime(5100);
      
      const result = await promise;
      expect(result).toBe(false);
      
      vi.useRealTimers();
    }, 10000);

    test('should validate response time is under 5 seconds', async () => {
      const startTime = Date.now();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      } as Response);

      await isResourceAccessible('https://example.com/image.jpg');
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(200); // Should be much faster in tests
    });
  });

  describe('validateResourceUrl', () => {
    test('should return original URL for valid accessible images', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      } as Response);

      const result = await validateResourceUrl('https://example.com/valid.jpg', 'fragrance');
      
      expect(result).toBe('https://example.com/valid.jpg');
    });

    test('should return fallback URL for inaccessible images', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await validateResourceUrl('https://example.com/missing.jpg', 'fragrance');
      
      expect(result).toBe(FALLBACK_IMAGES.fragrance);
    });

    test('should handle null/undefined URLs', async () => {
      const result1 = await validateResourceUrl(null, 'fragrance');
      const result2 = await validateResourceUrl(undefined, 'fragrance');
      
      expect(result1).toBe(FALLBACK_IMAGES.fragrance);
      expect(result2).toBe(FALLBACK_IMAGES.fragrance);
    });

    test('should handle empty strings', async () => {
      const result = await validateResourceUrl('', 'fragrance');
      
      expect(result).toBe(FALLBACK_IMAGES.fragrance);
    });

    test('should validate different resource types', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const fragranceResult = await validateResourceUrl('missing.jpg', 'fragrance');
      const brandResult = await validateResourceUrl('missing.jpg', 'brand');
      const userResult = await validateResourceUrl('missing.jpg', 'user');
      
      expect(fragranceResult).toBe(FALLBACK_IMAGES.fragrance);
      expect(brandResult).toBe(FALLBACK_IMAGES.brand);
      expect(userResult).toBe(FALLBACK_IMAGES.user);
    });

    test('should use default fallback for unknown resource types', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await validateResourceUrl('missing.jpg', 'unknown' as any);
      
      expect(result).toBe(FALLBACK_IMAGES.default);
    });
  });

  describe('validateFragranceImageUrl', () => {
    test('should validate fragrance images with proper typing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/png' }),
      } as Response);

      const fragrance = {
        id: 'test-id',
        name: 'Test Fragrance',
        image_url: 'https://example.com/valid.png',
      };

      const result = await validateFragranceImageUrl(fragrance);
      
      expect(result.image_url).toBe('https://example.com/valid.png');
      expect(result.id).toBe('test-id');
      expect(result.name).toBe('Test Fragrance');
    });

    test('should replace broken fragrance images with fallback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const fragrance = {
        id: 'test-id',
        name: 'Test Fragrance',
        image_url: 'https://example.com/broken.jpg',
      };

      const result = await validateFragranceImageUrl(fragrance);
      
      expect(result.image_url).toBe(FALLBACK_IMAGES.fragrance);
      expect(result.id).toBe('test-id');
      expect(result.name).toBe('Test Fragrance');
    });

    test('should handle fragrances without image_url', async () => {
      const fragrance = {
        id: 'test-id',
        name: 'Test Fragrance',
      };

      const result = await validateFragranceImageUrl(fragrance);
      
      expect(result.image_url).toBe(FALLBACK_IMAGES.fragrance);
    });

    test('should preserve all other fragrance properties', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      } as Response);

      const fragrance = {
        id: 'test-id',
        name: 'Test Fragrance',
        image_url: 'https://example.com/valid.jpg',
        brand_id: 'brand-123',
        description: 'A test fragrance',
        notes: ['bergamot', 'rose'],
        sample_available: true,
      };

      const result = await validateFragranceImageUrl(fragrance);
      
      expect(result).toEqual({
        ...fragrance,
        image_url: 'https://example.com/valid.jpg',
      });
    });
  });

  describe('Performance Requirements', () => {
    test('should complete validation in under 200ms for single image', async () => {
      const startTime = performance.now();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      } as Response);

      await validateResourceUrl('https://example.com/test.jpg', 'fragrance');
      
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(200);
    });

    test('should handle batch validation efficiently', async () => {
      const startTime = performance.now();
      
      // Mock responses for 10 images
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      } as Response);

      const urls = Array.from({ length: 10 }, (_, i) => `https://example.com/image${i}.jpg`);
      const promises = urls.map(url => validateResourceUrl(url, 'fragrance'));
      
      await Promise.all(promises);
      
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(500); // Should batch efficiently
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed URLs', async () => {
      const result = await validateResourceUrl('not-a-url', 'fragrance');
      expect(result).toBe(FALLBACK_IMAGES.fragrance);
    });

    test('should handle URLs with special characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      } as Response);

      const url = 'https://example.com/images/fragrance%20with%20spaces.jpg';
      const result = await validateResourceUrl(url, 'fragrance');
      
      expect(result).toBe(url);
    });

    test('should handle relative URLs', async () => {
      const result = await validateResourceUrl('/images/local.jpg', 'fragrance');
      expect(result).toBe('/images/local.jpg'); // Local images assumed valid
    });

    test('should handle data URLs', async () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...';
      const result = await validateResourceUrl(dataUrl, 'fragrance');
      
      expect(result).toBe(dataUrl); // Data URLs assumed valid
    });
  });

  describe('Error Logging', () => {
    test('should log broken resources for monitoring', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await isResourceAccessible('https://logtest.com/broken.jpg');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Resource validation failed:',
        expect.objectContaining({
          url: 'https://logtest.com/broken.jpg',
          type: 'unknown',
          error: 'NOT_FOUND',
          status: 404,
        })
      );
      
      consoleSpy.mockRestore();
    });
  });
});