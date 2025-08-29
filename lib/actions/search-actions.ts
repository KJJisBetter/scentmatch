'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { searchService } from '@/lib/search/search-service';
import { FragranceNormalizer } from '@/lib/data-quality/fragrance-normalizer';
import { MissingProductDetector } from '@/lib/data-quality/missing-product-detector';
import {
  searchQuerySchema,
  validateApiInput,
  sanitizeForDatabase,
} from '@/lib/validation/api-schemas';
import type {
  SearchFilters,
  SearchFragrance,
  SearchActionResult,
} from './search-types';

/**
 * Hybrid Search Server Action
 *
 * Combines FuseSearchService performance with API route intelligence:
 * - Primary: Fast Fuse.js in-memory search (<200ms)
 * - Enhanced: FragranceNormalizer for data quality
 * - Fallback: Database RPC functions for complex queries
 * - Intelligence: MissingProductDetector for alternatives
 */
export async function searchFragrances(
  query: string,
  filters?: SearchFilters,
  options?: {
    enhanced?: boolean;
    limit?: number;
    include_highlights?: boolean;
  }
): Promise<SearchActionResult> {
  const startTime = Date.now();

  try {
    // Build search parameters for validation
    const searchParams = {
      q: query || '',
      scent_families: filters?.scent_families || [],
      occasions: filters?.occasions || [],
      seasons: filters?.seasons || [],
      sample_only: filters?.sample_only || false,
      limit: options?.limit || 20,
      enhanced: options?.enhanced !== false,
    };

    // Validate input using established Zod schema
    const validation = validateApiInput(searchQuerySchema, searchParams);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // TypeScript type narrowing - validation.success is true here
    const {
      q: validatedQuery,
      scent_families: scentFamilies,
      occasions,
      seasons,
      sample_only: sampleOnly,
      limit,
      enhanced,
    } = validation.data;

    // Sanitize query for database operations
    const sanitizedQuery = validatedQuery
      ? sanitizeForDatabase(validatedQuery)
      : '';

    // Rate limiting check (simulated - would need request context in real implementation)
    // const rateLimitCheck = await withRateLimit(request, 'search');
    // if (rateLimitCheck.blocked) {
    //   return { success: false, error: 'Rate limit exceeded' };
    // }

    const normalizer = new FragranceNormalizer();
    const detector = new MissingProductDetector();

    let searchResults: SearchFragrance[] = [];
    let searchMethod = 'fuse_search';
    let totalCount = 0;

    // Strategy 1: Enhanced normalization + FuseSearch (Primary)
    if (enhanced && sanitizedQuery.length > 0) {
      try {
        // Normalize query for better matching
        const normalizedQuery =
          normalizer.normalizeFragranceName(sanitizedQuery);

        // Use FuseSearchService for fast in-memory search
        const fuseResponse = await searchService.search(
          normalizedQuery.canonicalName || sanitizedQuery,
          {
            mode: 'standard',
            limit,
            filters: {
              scent_families: scentFamilies,
              sample_only: sampleOnly,
              gender: [], // No gender filter in current interface
              occasions,
              seasons,
            },
            include_highlights: options?.include_highlights || false,
            boost_popular: true,
          }
        );

        if (fuseResponse.results.length > 0) {
          searchResults = fuseResponse.results.map(result => ({
            id: result.fragrance.id,
            name: result.fragrance.name,
            brand: result.fragrance.brand,
            brand_id: result.fragrance.brand || result.fragrance.id,
            scent_family: result.fragrance.scent_family,
            gender: result.fragrance.gender || 'unisex',
            relevance_score: result.score,
            sample_available: result.fragrance.sample_available ?? true,
            sample_price_usd: result.fragrance.sample_price_usd || 15,
            match_type: 'fuse_search',
            source: 'enhanced_fuse',
          }));

          totalCount = fuseResponse.total;
          searchMethod = 'enhanced_fuse_search';
        }
      } catch (error) {
        console.warn('Enhanced FuseSearch failed, falling back:', error);
      }
    }

    // Strategy 2: Database fallback for complex queries
    if (searchResults.length === 0 && sanitizedQuery.length > 0) {
      try {
        const supabase = await createServerSupabase();

        // Use database RPC function as fallback
        const { data: dbResults, error: dbError } = await (supabase as any).rpc(
          'advanced_fragrance_search',
          {
            query_text: sanitizedQuery,
            scent_families: scentFamilies?.length ? scentFamilies : null,
            occasions: occasions?.length ? occasions : null,
            seasons: seasons?.length ? seasons : null,
            sample_available_only: sampleOnly,
            max_results: limit,
          }
        );

        if (!dbError && dbResults?.length > 0) {
          searchResults = dbResults.map((result: any) => ({
            id: result.fragrance_id,
            name: result.name,
            brand: result.brand || 'Unknown Brand',
            brand_id: result.brand_id,
            scent_family: result.scent_family,
            gender: result.gender || 'unisex',
            relevance_score: result.relevance_score || 0.5,
            sample_available: result.sample_available ?? true,
            sample_price_usd: result.sample_price_usd || 15,
            match_type: 'database_rpc',
            source: 'database_function',
          }));

          totalCount = dbResults.length;
          searchMethod = 'database_rpc_fallback';
        }
      } catch (error) {
        console.warn('Database RPC fallback failed:', error);
      }
    }

    // Strategy 3: Missing Product Intelligence
    if (enhanced && searchResults.length === 0 && sanitizedQuery.length > 2) {
      try {
        const missingProductResponse = await detector.handleProductNotFound(
          sanitizedQuery,
          undefined, // No user ID available in Server Action context
          undefined, // No IP available
          undefined // No user agent available
        );

        if (missingProductResponse.alternatives.length > 0) {
          searchResults = missingProductResponse.alternatives.map(alt => ({
            id: alt.fragrance_id,
            name: alt.name,
            brand: alt.brand,
            brand_id: alt.brand || alt.fragrance_id,
            scent_family: undefined,
            gender: 'unisex',
            relevance_score: alt.similarity_score,
            sample_available: true,
            sample_price_usd: 15,
            match_type: 'alternative',
            source: 'missing_product_intelligence',
          }));

          totalCount = missingProductResponse.alternatives.length;
          searchMethod = 'missing_product_alternatives';
        }
      } catch (error) {
        console.warn('Missing product intelligence failed:', error);
      }
    }

    // Build response matching API format
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        fragrances: searchResults,
        total: totalCount,
        query,
        search_method: searchMethod,
        filters_applied: {
          scent_families: scentFamilies,
          sample_only: sampleOnly,
          occasions,
          seasons,
        },
        metadata: {
          processing_time_ms: processingTime,
          ai_powered: false,
          database_integrated: true,
          enhanced_features_enabled: enhanced,
          performance_target_met: processingTime < 200,
        },
      },
    };
  } catch (error) {
    console.error('Search Server Action error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Search temporarily unavailable',
    };
  }
}

// Functions moved to separate modules:
// - getSearchSuggestions: @/lib/actions/suggestion-actions
// - getFilterOptions: @/lib/actions/filter-actions
