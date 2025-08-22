/**
 * Resource Validation System - SCE-63
 * 
 * Core utilities for validating image URLs and handling
 * 404 errors with fallback resources.
 */

import { 
  FALLBACK_IMAGES, 
  VALIDATION_CONFIG, 
  VALIDATION_ERRORS,
  type ResourceType,
  type ValidationError 
} from './constants';

// Simple in-memory cache for validation results
const validationCache = new Map<string, { valid: boolean; timestamp: number }>();

/**
 * Checks if a resource URL is accessible and returns a valid image
 * @param url - The resource URL to validate
 * @returns Promise<boolean> - True if accessible, false otherwise
 */
export async function isResourceAccessible(url: string): Promise<boolean> {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Handle relative URLs and data URLs as valid
  if (url.startsWith('/') || url.startsWith('data:')) {
    return true;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    logValidationError(url, 'unknown', VALIDATION_ERRORS.MALFORMED_URL);
    return false;
  }

  // Check cache first
  const cached = validationCache.get(url);
  if (cached && (Date.now() - cached.timestamp) < VALIDATION_CONFIG.CACHE_DURATION_MS) {
    return cached.valid;
  }

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VALIDATION_CONFIG.TIMEOUT_MS);

    // Use HEAD request for efficiency
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check if response is successful
    if (!response.ok) {
      logValidationError(url, 'unknown', VALIDATION_ERRORS.NOT_FOUND, response.status);
      cacheValidationResult(url, false);
      return false;
    }

    // Validate content type if provided
    const contentType = response.headers.get('content-type');
    if (contentType && !VALIDATION_CONFIG.VALID_IMAGE_TYPES.some(type => 
      contentType.toLowerCase().includes(type)
    )) {
      logValidationError(url, 'unknown', VALIDATION_ERRORS.INVALID_CONTENT_TYPE);
      cacheValidationResult(url, false);
      return false;
    }

    cacheValidationResult(url, true);
    return true;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logValidationError(url, 'unknown', VALIDATION_ERRORS.TIMEOUT);
    } else {
      logValidationError(url, 'unknown', VALIDATION_ERRORS.NETWORK_ERROR);
    }
    
    cacheValidationResult(url, false);
    return false;
  }
}

/**
 * Validates a resource URL and returns either the original URL or a fallback
 * @param url - The resource URL to validate
 * @param resourceType - The type of resource (fragrance, brand, user, etc.)
 * @returns Promise<string> - The validated URL or fallback
 */
export async function validateResourceUrl(
  url: string | null | undefined, 
  resourceType: ResourceType | string
): Promise<string> {
  // Handle null/undefined/empty URLs
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return getFallbackImage(resourceType);
  }

  const isValid = await isResourceAccessible(url);
  
  if (isValid) {
    return url;
  }

  return getFallbackImage(resourceType);
}

/**
 * Validates a fragrance object's image URL and returns updated object
 * @param fragrance - Fragrance object with potential image_url
 * @returns Promise<object> - Fragrance with validated image_url
 */
export async function validateFragranceImageUrl<T extends Record<string, any>>(
  fragrance: T
): Promise<T & { image_url: string }> {
  const validatedImageUrl = await validateResourceUrl(
    fragrance.image_url, 
    'fragrance'
  );

  return {
    ...fragrance,
    image_url: validatedImageUrl,
  };
}

/**
 * Batch validates multiple resource URLs efficiently
 * @param urls - Array of URLs to validate
 * @param resourceType - Type of resources being validated
 * @returns Promise<string[]> - Array of validated URLs
 */
export async function validateResourceUrlsBatch(
  urls: (string | null | undefined)[],
  resourceType: ResourceType | string
): Promise<string[]> {
  // Limit concurrent validations for performance
  const semaphore = createSemaphore(VALIDATION_CONFIG.PERFORMANCE.MAX_CONCURRENT);
  
  const validationPromises = urls.map(async (url) => {
    await semaphore.acquire();
    try {
      return await validateResourceUrl(url, resourceType);
    } finally {
      semaphore.release();
    }
  });

  return Promise.all(validationPromises);
}

/**
 * Validates an array of fragrance objects' image URLs
 * @param fragrances - Array of fragrance objects
 * @returns Promise<Array> - Array of fragrances with validated image URLs
 */
export async function validateFragranceImagesBatch<T extends Record<string, any>>(
  fragrances: T[]
): Promise<Array<T & { image_url: string }>> {
  const semaphore = createSemaphore(VALIDATION_CONFIG.PERFORMANCE.MAX_CONCURRENT);
  
  const validationPromises = fragrances.map(async (fragrance) => {
    await semaphore.acquire();
    try {
      return await validateFragranceImageUrl(fragrance);
    } finally {
      semaphore.release();
    }
  });

  return Promise.all(validationPromises);
}

/**
 * Gets the appropriate fallback image for a resource type
 * @param resourceType - The type of resource
 * @returns string - The fallback image URL
 */
function getFallbackImage(resourceType: ResourceType | string): string {
  if (resourceType in FALLBACK_IMAGES) {
    return FALLBACK_IMAGES[resourceType as ResourceType];
  }
  return FALLBACK_IMAGES.default;
}

/**
 * Caches validation result for performance
 * @param url - The URL that was validated
 * @param valid - Whether the URL is valid
 */
function cacheValidationResult(url: string, valid: boolean): void {
  validationCache.set(url, {
    valid,
    timestamp: Date.now(),
  });

  // Clean up old cache entries periodically
  if (validationCache.size > 1000) {
    const cutoff = Date.now() - VALIDATION_CONFIG.CACHE_DURATION_MS;
    const entriesToDelete: string[] = [];
    validationCache.forEach((value, key) => {
      if (value.timestamp < cutoff) {
        entriesToDelete.push(key);
      }
    });
    entriesToDelete.forEach(key => validationCache.delete(key));
  }
}

/**
 * Logs validation errors for monitoring and debugging
 * @param url - The URL that failed validation
 * @param resourceType - The type of resource
 * @param errorType - The type of validation error
 * @param status - HTTP status code if applicable
 */
function logValidationError(
  url: string, 
  resourceType: string, 
  errorType: ValidationError,
  status?: number
): void {
  const logData = {
    url,
    type: resourceType,
    error: errorType,
    status,
    timestamp: new Date().toISOString(),
  };

  // Use console.warn for development, in production this could be sent to monitoring service
  console.warn('Resource validation failed:', logData);
}

/**
 * Creates a semaphore for limiting concurrent operations
 * @param maxConcurrent - Maximum number of concurrent operations
 * @returns Semaphore object with acquire/release methods
 */
function createSemaphore(maxConcurrent: number) {
  let current = 0;
  const queue: Array<() => void> = [];

  return {
    async acquire(): Promise<void> {
      return new Promise<void>((resolve) => {
        if (current < maxConcurrent) {
          current++;
          resolve();
        } else {
          queue.push(() => {
            current++;
            resolve();
          });
        }
      });
    },

    release(): void {
      current--;
      const next = queue.shift();
      if (next) {
        next();
      }
    },
  };
}

/**
 * Clears the validation cache (useful for testing)
 */
export function clearValidationCache(): void {
  validationCache.clear();
}