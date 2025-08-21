/**
 * Enhanced Smart Search API
 * Multi-stage search with canonical fragrance system integration
 * Handles malformed names and missing products intelligently
 * Addresses Linear issues SCE-49/50/51
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { MissingProductDetector } from '@/lib/data-quality/missing-product-detector';
import { FragranceNormalizer } from '@/lib/data-quality/fragrance-normalizer';
import {
  getBrandFamilyVariations,
  normalizeBrandName,
} from '@/lib/brand-utils';

const detector = new MissingProductDetector();
const normalizer = new FragranceNormalizer();

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const includeFallback = searchParams.get('include_fallback') !== 'false';
    const fuzzyThreshold = parseFloat(
      searchParams.get('fuzzy_threshold') || '0.3'
    );
    const limit = Math.max(
      1,
      Math.min(50, parseInt(searchParams.get('limit') || '20'))
    );

    // Validate input
    if (!query || query.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Query parameter "q" is required',
            details: { query },
          },
        },
        { status: 400 }
      );
    }

    if (query.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Query too long (maximum 200 characters)',
            details: { length: query.length },
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    // Step 1: Normalize the search query
    const normalizedQuery = normalizer.normalizeFragranceName(query);
    const searchTerms = [query, normalizedQuery.canonicalName];

    // If normalization changed the query significantly, use both versions
    if (normalizedQuery.needsNormalization) {
      console.log(
        `🔄 Query normalized: "${query}" → "${normalizedQuery.canonicalName}"`
      );
    }

    let searchResults: any[] = [];
    let searchStrategy = 'none';
    let missingProductHandled = false;

    // Step 2: Try canonical smart search first
    try {
      const { data: canonicalResults, error: canonicalError } = await (
        supabase as any
      ).rpc('search_fragrances_smart', {
        query_text: normalizedQuery.canonicalName,
        limit_count: limit,
      });

      if (!canonicalError && canonicalResults && canonicalResults.length > 0) {
        searchResults = canonicalResults.map(formatCanonicalResult);
        searchStrategy = 'canonical_smart';
        console.log(
          `✅ Canonical search found ${searchResults.length} results`
        );
      }
    } catch (error) {
      console.warn('Canonical search failed, using fallback:', error);
    }

    // Step 3: Fallback to existing search system if no canonical results
    if (searchResults.length === 0 && includeFallback) {
      try {
        // Use existing advanced_fragrance_search function
        const { data: functionResults, error: functionError } = await (
          supabase as any
        ).rpc('advanced_fragrance_search', {
          query_text: query,
          scent_families: null,
          occasions: null,
          seasons: null,
          sample_available_only: false,
          max_results: limit,
        });

        if (!functionError && functionResults && functionResults.length > 0) {
          searchResults = functionResults.map(formatLegacyResult);
          searchStrategy = 'legacy_function';
          console.log(
            `✅ Legacy function found ${searchResults.length} results`
          );
        }
      } catch (error) {
        console.warn('Legacy function search failed:', error);
      }
    }

    // Step 4: Final fallback to direct database search
    if (searchResults.length === 0 && includeFallback) {
      try {
        const { data: directResults, error: directError } = await (
          supabase as any
        )
          .from('fragrances')
          .select(
            `
            id, name, brand_id, gender, popularity_score, rating_value,
            sample_available, sample_price_usd,
            fragrance_brands!inner(name)
          `
          )
          .or(`name.ilike.%${query}%,fragrance_brands.name.ilike.%${query}%`)
          .eq('sample_available', true)
          .order('popularity_score', { ascending: false, nullsLast: true })
          .limit(limit);

        if (!directError && directResults && directResults.length > 0) {
          searchResults = directResults.map(formatDirectResult);
          searchStrategy = 'direct_database';
          console.log(
            `✅ Direct database found ${searchResults.length} results`
          );
        }
      } catch (error) {
        console.warn('Direct database search failed:', error);
      }
    }

    // Step 5: Handle missing product scenario
    if (searchResults.length === 0) {
      try {
        console.log(
          `🔍 No results found for "${query}" - triggering missing product intelligence`
        );

        const missingProductResponse = await detector.handleProductNotFound(
          query,
          undefined, // No user ID from search request
          request.headers.get('x-forwarded-for'),
          request.headers.get('user-agent')
        );

        missingProductHandled = true;
        searchStrategy = 'missing_product_intelligence';

        return NextResponse.json({
          success: true,
          data: {
            results: [],
            alternatives: missingProductResponse.alternatives,
            message: missingProductResponse.message,
            actions: missingProductResponse.actions,
            search_strategy: searchStrategy,
            query_normalized: normalizedQuery.canonicalName,
            missing_product_handled: true,
            processing_time_ms: Date.now() - startTime,
          },
        });
      } catch (error) {
        console.error('Missing product handling failed:', error);
      }
    }

    // Step 6: Enhance and rank results
    const enhancedResults = await enhanceSearchResults(
      searchResults,
      query,
      normalizedQuery
    );

    const processingTime = Date.now() - startTime;

    // Return successful search results
    return NextResponse.json(
      {
        success: true,
        data: {
          results: enhancedResults,
          total_found: enhancedResults.length,
          search_strategy: searchStrategy,
          query_original: query,
          query_normalized: normalizedQuery.canonicalName,
          normalization_applied: normalizedQuery.needsNormalization,
          normalization_changes: normalizedQuery.changes,
          missing_product_handled: missingProductHandled,
          processing_time_ms: processingTime,
          performance_target_met: processingTime < 150,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Search-Strategy': searchStrategy,
          'X-Processing-Time': processingTime.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Smart search API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error during search',
          details: process.env.NODE_ENV === 'development' ? error : {},
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Format canonical search results
 */
function formatCanonicalResult(result: any): any {
  return {
    fragrance_id: result.fragrance_id,
    name: result.canonical_name,
    brand: result.brand_name,
    similarity_score: result.similarity_score,
    match_type: result.match_type,
    source: 'canonical',
  };
}

/**
 * Format legacy function results
 */
function formatLegacyResult(result: any): any {
  const normalizedBrand = normalizeBrandName(result.brand || 'Unknown Brand');

  return {
    fragrance_id: result.fragrance_id,
    name: result.name,
    brand: normalizedBrand.canonical_name,
    similarity_score: result.relevance_score || 0.8,
    match_type: 'legacy',
    source: 'legacy_function',
  };
}

/**
 * Format direct database results
 */
function formatDirectResult(result: any): any {
  const normalizedBrand = normalizeBrandName(
    result.fragrance_brands?.name || 'Unknown Brand'
  );

  return {
    fragrance_id: result.id,
    name: result.name,
    brand: normalizedBrand.canonical_name,
    similarity_score: 0.7 + (result.popularity_score || 0) * 0.001,
    match_type: 'direct',
    source: 'direct_database',
    gender: result.gender,
    sample_available: result.sample_available,
    sample_price_usd: result.sample_price_usd,
  };
}

/**
 * Enhance search results with additional ranking and metadata
 */
async function enhanceSearchResults(
  results: any[],
  originalQuery: string,
  normalizedQuery: any
): Promise<any[]> {
  try {
    // Add query relevance boosting
    const enhanced = results.map(result => {
      let boostedScore = result.similarity_score;

      // Boost exact brand matches
      if (result.brand.toLowerCase().includes(originalQuery.toLowerCase())) {
        boostedScore += 0.1;
      }

      // Boost exact name matches
      if (result.name.toLowerCase().includes(originalQuery.toLowerCase())) {
        boostedScore += 0.15;
      }

      // Boost if name contains normalized query terms
      if (normalizedQuery.needsNormalization) {
        const normalizedTerms = normalizedQuery.canonicalName
          .toLowerCase()
          .split(' ');
        const nameWords = result.name.toLowerCase().split(' ');
        const matchingTerms = normalizedTerms.filter(term =>
          nameWords.some(word => word.includes(term))
        );
        boostedScore += matchingTerms.length * 0.02;
      }

      return {
        ...result,
        enhanced_score: Math.min(1.0, boostedScore),
        original_score: result.similarity_score,
      };
    });

    // Sort by enhanced score
    return enhanced.sort((a, b) => b.enhanced_score - a.enhanced_score);
  } catch (error) {
    console.error('Error enhancing search results:', error);
    return results;
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
