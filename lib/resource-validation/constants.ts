/**
 * Resource Validation Constants - SCE-63
 * 
 * Defines fallback images and resource validation settings
 * for handling 404 errors in fragrance platform resources.
 */

export const FALLBACK_IMAGES = {
  // Fragrance fallback - elegant bottle silhouette
  fragrance: '/images/fallback/fragrance-placeholder.svg',
  
  // Brand fallback - minimalist brand icon
  brand: '/images/fallback/brand-placeholder.svg',
  
  // User avatar fallback - user profile icon
  user: '/images/fallback/user-placeholder.svg',
  
  // Default fallback for unknown resource types
  default: '/images/fallback/default-placeholder.svg',
} as const;

export type ResourceType = keyof typeof FALLBACK_IMAGES;

export const VALIDATION_CONFIG = {
  // Request timeout for resource validation (5 seconds)
  TIMEOUT_MS: 5000,
  
  // Cache duration for validation results (10 minutes)
  CACHE_DURATION_MS: 10 * 60 * 1000,
  
  // Valid image content types
  VALID_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/avif',
  ] as const,
  
  // Performance targets
  PERFORMANCE: {
    // Target validation time for single image
    SINGLE_IMAGE_TARGET_MS: 200,
    
    // Target validation time for batch processing
    BATCH_TARGET_MS: 500,
    
    // Maximum concurrent validations
    MAX_CONCURRENT: 5,
  },
} as const;

export const VALIDATION_ERRORS = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT', 
  INVALID_CONTENT_TYPE: 'INVALID_CONTENT_TYPE',
  NOT_FOUND: 'NOT_FOUND',
  MALFORMED_URL: 'MALFORMED_URL',
} as const;

export type ValidationError = keyof typeof VALIDATION_ERRORS;