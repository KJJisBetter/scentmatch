/**
 * Resource Validation Middleware - SCE-63
 * 
 * Middleware for validating resources in API responses
 * to prevent 404 errors reaching the client.
 */

import { NextResponse } from 'next/server';
import { validateFragranceImageUrl, validateFragranceImagesBatch } from './index';

/**
 * Middleware to validate and fix image URLs in fragrance API responses
 * @param fragrances - Single fragrance or array of fragrances
 * @returns Promise<any> - Validated fragrance(s) with working image URLs
 */
export async function validateApiFragranceImages<T extends Record<string, any>>(
  fragrances: T | T[]
): Promise<T | T[]> {
  if (Array.isArray(fragrances)) {
    // Batch process arrays efficiently
    return validateFragranceImagesBatch(fragrances);
  } else {
    // Process single fragrance
    return validateFragranceImageUrl(fragrances);
  }
}

/**
 * Creates a NextResponse with validated image URLs
 * @param data - Response data containing fragrances
 * @param options - Response options (status, headers, etc.)
 * @returns Promise<NextResponse> - Response with validated image URLs
 */
export async function createValidatedApiResponse(
  data: any,
  options: {
    status?: number;
    headers?: HeadersInit;
    cache?: string;
  } = {}
): Promise<NextResponse> {
  try {
    let validatedData = data;

    // Handle different response structures
    if (data.fragrances && Array.isArray(data.fragrances)) {
      // Search results or list responses
      validatedData = {
        ...data,
        fragrances: await validateFragranceImagesBatch(data.fragrances),
      };
    } else if (data.similar && Array.isArray(data.similar)) {
      // Similar fragrances responses
      validatedData = {
        ...data,
        similar: await validateFragranceImagesBatch(data.similar),
      };
    } else if (data.recommendations && Array.isArray(data.recommendations)) {
      // Recommendation responses
      validatedData = {
        ...data,
        recommendations: await validateFragranceImagesBatch(data.recommendations),
      };
    } else if (data.id && data.name) {
      // Single fragrance responses
      validatedData = await validateFragranceImageUrl(data);
    } else if (Array.isArray(data)) {
      // Direct array of fragrances
      validatedData = await validateFragranceImagesBatch(data);
    }

    // Set default cache headers for performance
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.cache && { 'Cache-Control': options.cache }),
      ...options.headers,
    };

    return NextResponse.json(validatedData, {
      status: options.status || 200,
      headers: defaultHeaders,
    });

  } catch (error) {
    console.error('Error validating API response images:', error);
    
    // Return original data if validation fails
    return NextResponse.json(data, {
      status: options.status || 200,
      headers: options.headers,
    });
  }
}

/**
 * Validates fragrance data from database queries before API response
 * @param queryResult - Supabase query result
 * @returns Promise<any> - Query result with validated image URLs
 */
export async function validateDatabaseFragranceResult(
  queryResult: { data: any; error: any }
): Promise<{ data: any; error: any }> {
  if (queryResult.error || !queryResult.data) {
    return queryResult;
  }

  try {
    let validatedData = queryResult.data;

    if (Array.isArray(queryResult.data)) {
      validatedData = await validateFragranceImagesBatch(queryResult.data);
    } else if (queryResult.data.id && queryResult.data.name) {
      validatedData = await validateFragranceImageUrl(queryResult.data);
    }

    return {
      ...queryResult,
      data: validatedData,
    };
  } catch (error) {
    console.error('Error validating database fragrance result:', error);
    return queryResult;
  }
}

/**
 * Express-style middleware wrapper for validation
 * @param handler - API route handler
 * @returns Wrapped handler with image validation
 */
export function withResourceValidation<T extends (...args: any[]) => any>(
  handler: T
): T {
  return (async (...args: any[]): Promise<any> => {
    try {
      const result = await handler(...args);
      
      // If result is a NextResponse, extract and validate the data
      if (result instanceof NextResponse) {
        const data = await result.json();
        const headersObject: Record<string, string> = {};
        result.headers.forEach((value, key) => {
          headersObject[key] = value;
        });
        
        return createValidatedApiResponse(data, {
          status: result.status,
          headers: headersObject,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Resource validation middleware error:', error);
      return handler(...args); // Fall back to original handler
    }
  }) as T;
}

/**
 * Validates and enriches search results with proper image fallbacks
 * @param searchResults - Array of search result objects
 * @returns Promise<Array> - Search results with validated images
 */
export async function validateSearchResults<T extends Record<string, any>>(
  searchResults: T[]
): Promise<T[]> {
  const startTime = performance.now();
  
  const validatedResults = await validateFragranceImagesBatch(searchResults);
  
  const duration = performance.now() - startTime;
  if (duration > 500) {
    console.warn(`Search result validation took ${duration}ms for ${searchResults.length} items`);
  }
  
  return validatedResults;
}

/**
 * Validates and enriches recommendation results
 * @param recommendations - Array of recommendation objects
 * @returns Promise<Array> - Recommendations with validated images
 */
export async function validateRecommendationResults<T extends Record<string, any>>(
  recommendations: T[]
): Promise<T[]> {
  const startTime = performance.now();
  
  const validatedRecommendations = await validateFragranceImagesBatch(recommendations);
  
  const duration = performance.now() - startTime;
  if (duration > 500) {
    console.warn(`Recommendation validation took ${duration}ms for ${recommendations.length} items`);
  }
  
  return validatedRecommendations;
}