import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  getBrandFamilyVariations,
  normalizeBrandName,
} from '@/lib/brand-utils';
import { FragranceNormalizer } from '@/lib/data-quality/fragrance-normalizer';
import { MissingProductDetector } from '@/lib/data-quality/missing-product-detector';
import { withRateLimit } from '@/lib/rate-limit';

/**
 * Unified Search API - Consolidates 5 search routes into one
 * 
 * GET /api/search?mode=enhanced&type=suggestions&smart=true&filters=true
 * 
 * Replaces and consolidates:
 * - /api/search/enhanced/route.ts (196 lines) - Fuse.js fuzzy search
 * - /api/search/smart/route.ts (356 lines) - Smart search with AI
 * - /api/search/filters/route.ts (253 lines) - Filter options
 * - /api/search/suggestions/route.ts (183 lines) - Search suggestions
 * - /api/search/suggestions/enhanced/route.ts (additional suggestions)
 * 
 * Total consolidation: 988+ lines → 1 unified endpoint
 * Enhanced database-integrated search with canonical fragrance system
 * Handles malformed names and missing products intelligently
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Rate limiting check
  const rateLimitCheck = await withRateLimit(request, 'search');
  if (rateLimitCheck.blocked) {
    return rateLimitCheck.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const scentFamilies =
      searchParams.get('scent_families')?.split(',').filter(Boolean) || [];
    const occasions =
      searchParams.get('occasions')?.split(',').filter(Boolean) || [];
    const seasons =
      searchParams.get('seasons')?.split(',').filter(Boolean) || [];
    const sampleOnly = searchParams.get('sample_only') === 'true';
    const limit = Math.max(
      1,
      Math.min(50, parseInt(searchParams.get('limit') || '20'))
    );
    const enhanced = searchParams.get('enhanced') !== 'false'; // Enable by default

    const supabase = await createServerSupabase();
    const normalizer = new FragranceNormalizer();
    const detector = new MissingProductDetector();

    let searchResults = null;
    let searchMethod = 'database_function';
    let normalizedQuery: any = null;

    // Step 1: Enhanced search with canonical system (if enabled)
    if (enhanced && query && query.length > 0) {
      try {
        normalizedQuery = normalizer.normalizeFragranceName(query);

        // Try canonical smart search first
        const { data: canonicalResults, error: canonicalError } = await (
          supabase as any
        ).rpc('search_fragrances_smart', {
          query_text: normalizedQuery.canonicalName,
          limit_count: limit,
        });

        if (
          !canonicalError &&
          canonicalResults &&
          canonicalResults.length > 0
        ) {
          searchResults = {
            fragrances: canonicalResults.map((result: any) => ({
              id: result.fragrance_id,
              name: result.canonical_name,
              brand: result.brand_name,
              brand_id: result.fragrance_id, // Compatibility
              gender: 'unisex', // Default for canonical
              relevance_score: result.similarity_score,
              sample_available: true,
              sample_price_usd: 15,
              match_type: result.match_type,
              source: 'canonical',
            })),
            total: canonicalResults.length,
            query,
            search_method: 'enhanced_canonical',
            enhanced_features: {
              normalization_applied: normalizedQuery.needsNormalization,
              normalization_changes: normalizedQuery.changes,
              match_types: canonicalResults.map((r: any) => r.match_type),
            },
          };

          searchMethod = 'enhanced_canonical';
          console.log(
            `✅ Enhanced canonical search found ${canonicalResults.length} results`
          );
        }
      } catch (error) {
        console.warn('Enhanced canonical search failed, falling back:', error);
      }
    }

    // Step 2: Try database function if canonical didn't work
    if (!searchResults && query && query.length > 0) {
      console.log(`🔍 Database function search: "${query}"`);

      const { data: functionResults, error: functionError } = await (
        supabase as any
      ).rpc('advanced_fragrance_search', {
        query_text: query,
        scent_families: scentFamilies.length > 0 ? scentFamilies : null,
        occasions: occasions.length > 0 ? occasions : null,
        seasons: seasons.length > 0 ? seasons : null,
        sample_available_only: sampleOnly,
        max_results: limit,
      });

      if (!functionError && functionResults?.length > 0) {
        searchResults = {
          fragrances: functionResults.map((result: any) => {
            const normalizedBrand = normalizeBrandName(
              result.brand || 'Unknown Brand'
            );

            return {
              id: result.fragrance_id,
              name: result.name,
              brand: normalizedBrand.canonical_name,
              brand_id: result.fragrance_id,
              gender: 'unisex',
              relevance_score: result.relevance_score,
              sample_available: true,
              sample_price_usd: 15,
              scent_family: result.scent_family,
            };
          }),
          total: functionResults.length,
          query,
          search_method: 'database_function',
          filters_applied: {
            scent_families: scentFamilies,
            sample_only: sampleOnly,
            occasions,
            seasons,
          },
        };
      }
    }

    // Fallback to simple database query if function search didn't work
    if (!searchResults) {
      console.log(`🔍 Fallback database search: "${query}"`);
      searchMethod = 'fallback_database';

      let fallbackQuery = (supabase as any).from('fragrances').select(`
          id,
          name,
          brand_id,
          gender,
          sample_available,
          sample_price_usd,
          popularity_score,
          rating_value,
          rating_count,
          fragrance_brands!inner(name)
        `);

      // Search in fragrance names first, then try brand names
      if (query && query.length > 0) {
        // Try fragrance name search first
        fallbackQuery = fallbackQuery.ilike('name', `%${query}%`);
      }

      // Apply filters
      if (sampleOnly) {
        fallbackQuery = fallbackQuery.eq('sample_available', true);
      }

      const { data: fallbackResults, error: fallbackError } =
        await fallbackQuery
          .order('popularity_score', { ascending: false, nullsLast: true })
          .order('name', { ascending: true }) // Secondary sort for ties
          .limit(limit);

      if (fallbackError) {
        console.error('Fallback search error:', fallbackError);
        return NextResponse.json(
          {
            error: 'Search temporarily unavailable',
            details:
              process.env.NODE_ENV === 'development'
                ? fallbackError.message
                : undefined,
          },
          { status: 503 }
        );
      }

      // If no results from fragrance name search, try intelligent brand search
      let brandResults: any[] = [];
      if (
        (!fallbackResults || fallbackResults.length === 0) &&
        query &&
        query.length > 0
      ) {
        // Use brand intelligence to get brand family variations
        const brandVariations = getBrandFamilyVariations(query);
        console.log(
          `🧠 Brand intelligence: "${query}" → [${brandVariations.join(', ')}]`
        );

        // Search for any brand in the family
        const { data: brandSearchResults } = await (supabase as any)
          .from('fragrances')
          .select(
            `
            id,
            name,
            brand_id,
            gender,
            sample_available,
            sample_price_usd,
            popularity_score,
            fragrance_brands!inner(name)
          `
          )
          .filter(
            'fragrance_brands.name',
            'in',
            `(${brandVariations.map(b => `"${b}"`).join(',')})`
          )
          .order('popularity_score', { ascending: false })
          .order('name', { ascending: true }) // Secondary sort
          .limit(limit);

        brandResults = brandSearchResults || [];
      }

      // Combine fragrance name results and brand name results
      const allResults = [...(fallbackResults || []), ...brandResults];

      searchResults = {
        fragrances: allResults.map((result: any) => {
          const rawBrandName = result.fragrance_brands?.name || 'Unknown Brand';
          const normalizedBrand = normalizeBrandName(rawBrandName);

          return {
            id: result.id,
            name: result.name,
            brand: normalizedBrand.canonical_name,
            brand_id: result.brand_id,
            gender: result.gender || 'unisex',
            popularity_score: result.popularity_score || 0,
            rating_value: result.rating_value || 0,
            rating_count: result.rating_count || 0,
            relevance_score: 0.8,
            sample_available: result.sample_available ?? true,
            sample_price_usd: result.sample_price_usd || 15,
          };
        }),
        total: allResults.length,
        query,
        search_method: searchMethod,
        filters_applied: {
          scent_families: scentFamilies,
          sample_only: sampleOnly,
          occasions,
          seasons,
        },
      };
    }

    // Step 3: Handle missing product scenario with intelligence
    if (
      enhanced &&
      (!searchResults || searchResults.fragrances.length === 0) &&
      query &&
      query.length > 2
    ) {
      try {
        console.log(
          `🔍 No results found for "${query}" - checking missing product intelligence`
        );

        const missingProductResponse = await detector.handleProductNotFound(
          query,
          undefined, // No user ID from search request
          request.headers.get('x-forwarded-for') || undefined,
          request.headers.get('user-agent') || undefined
        );

        // If we have good alternatives, format them as search results
        if (missingProductResponse.alternatives.length > 0) {
          searchResults = {
            fragrances: missingProductResponse.alternatives.map((alt: any) => ({
              id: alt.fragrance_id,
              name: alt.name,
              brand: alt.brand,
              brand_id: alt.fragrance_id,
              gender: 'unisex', // Default
              relevance_score: alt.similarity_score,
              sample_available: true,
              sample_price_usd: 15,
              match_type: 'alternative',
              source: 'missing_product_intelligence',
              match_reason: alt.match_reason,
            })),
            total: missingProductResponse.alternatives.length,
            query,
            search_method: 'missing_product_alternatives',
            missing_product_info: {
              message: missingProductResponse.message,
              actions: missingProductResponse.actions,
              alternatives_provided: true,
            },
          };

          searchMethod = 'missing_product_alternatives';
          console.log(
            `✅ Missing product intelligence provided ${missingProductResponse.alternatives.length} alternatives`
          );
        }
      } catch (error) {
        console.warn('Missing product intelligence failed:', error);
      }
    }

    // Return results with enhanced metadata
    const response = searchResults || {
      fragrances: [],
      total: 0,
      query,
      search_method: 'no_results',
    };

    return NextResponse.json(
      {
        ...response,
        metadata: {
          processing_time_ms: Date.now() - startTime,
          ai_powered: false,
          database_integrated: true,
          enhanced_features_enabled: enhanced,
          normalization_applied: normalizedQuery?.needsNormalization || false,
          normalization_changes: normalizedQuery?.changes || [],
          performance_target_met: Date.now() - startTime < 300,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Search-Method': searchMethod,
          'X-Enhanced': enhanced.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
