import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  getBrandFamilyVariations,
  normalizeBrandName,
} from '@/lib/brand-utils';
import { FragranceNormalizer } from '@/lib/data-quality/fragrance-normalizer';
import { MissingProductDetector } from '@/lib/data-quality/missing-product-detector';
import { withRateLimit } from '@/lib/rate-limit';
import {
  searchQuerySchema,
  validateApiInput,
  sanitizeForDatabase,
} from '@/lib/validation/api-schemas';

/**
 * Clean corrupted fragrance names that contain UUIDs
 * Handles edge cases where database entries have UUID prefixes
 */
function cleanFragranceName(name: string): string {
  if (!name) return name;

  // Remove UUID prefixes (36-char UUID pattern followed by space)
  // Pattern: "12deed0a-fe15-45f1-b6e0-50f421f3bb7f Creed Aventus Oil"
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\s+/i;
  return name.replace(uuidPattern, '').trim();
}

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

    // SECURITY: Validate and sanitize search parameters
    const queryParams = {
      q: searchParams.get('q')?.trim() || '',
      scent_families:
        searchParams.get('scent_families')?.split(',').filter(Boolean) || [],
      occasions:
        searchParams.get('occasions')?.split(',').filter(Boolean) || [],
      seasons: searchParams.get('seasons')?.split(',').filter(Boolean) || [],
      sample_only: searchParams.get('sample_only') === 'true',
      limit: Math.max(
        1,
        Math.min(50, parseInt(searchParams.get('limit') || '20'))
      ),
      enhanced: searchParams.get('enhanced') !== 'false',
    };

    const validation = validateApiInput(searchQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid search parameters',
          details: 'error' in validation ? validation.error : 'Validation failed',
        },
        { status: 400 }
      );
    }

    const {
      q: query,
      scent_families: scentFamilies,
      occasions,
      seasons,
      sample_only: sampleOnly,
      limit,
      enhanced,
    } = validation.data;

    // Additional sanitization for database queries
    const sanitizedQuery = query ? sanitizeForDatabase(query) : '';

    const supabase = await createServerSupabase();
    const normalizer = new FragranceNormalizer();
    const detector = new MissingProductDetector();

    let searchResults = null;
    let searchMethod = 'database_function';
    let normalizedQuery: any = null;

    // Step 1: Enhanced search with canonical system (if enabled)
    if (enhanced && sanitizedQuery && sanitizedQuery.length > 0) {
      try {
        normalizedQuery = normalizer.normalizeFragranceName(sanitizedQuery);

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
          // Map canonical UUIDs back to original fragrance IDs for proper linking
          const canonicalIds = canonicalResults.map((r: any) => r.fragrance_id);

          const { data: fragranceMapping } = await supabase
            .from('fragrances_canonical')
            .select('id, metadata')
            .in('id', canonicalIds);

          const idMap = new Map();
          fragranceMapping?.forEach((mapping: any) => {
            const originalId = mapping.metadata?.migrated_from;
            if (originalId) {
              idMap.set(mapping.id, originalId);
            }
          });

          searchResults = {
            fragrances: canonicalResults.map((result: any) => ({
              id: idMap.get(result.fragrance_id) || result.fragrance_id, // Use original fragrance ID
              name: cleanFragranceName(result.canonical_name),
              brand: result.brand_name,
              brand_id: result.brand_id || result.brand_name, // Use actual brand ID
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
    if (!searchResults && sanitizedQuery && sanitizedQuery.length > 0) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Database function search: "${sanitizedQuery}"`);
      }

      const { data: functionResults, error: functionError } = await (
        supabase as any
      ).rpc('advanced_fragrance_search', {
        query_text: sanitizedQuery,
        scent_families: (scentFamilies?.length ?? 0) > 0 ? scentFamilies : null,
        occasions: (occasions?.length ?? 0) > 0 ? occasions : null,
        seasons: (seasons?.length ?? 0) > 0 ? seasons : null,
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
              name: cleanFragranceName(result.name),
              brand: normalizedBrand.canonical_name,
              brand_id: result.brand_id || normalizedBrand.canonical_name,
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
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Fallback database search: "${sanitizedQuery}"`);
      }
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
      if (sanitizedQuery && sanitizedQuery.length > 0) {
        // Try fragrance name search first
        fallbackQuery = fallbackQuery.ilike('name', `%${sanitizedQuery}%`);
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
        sanitizedQuery &&
        sanitizedQuery.length > 0
      ) {
        // Use brand intelligence to get brand family variations
        const brandVariations = getBrandFamilyVariations(sanitizedQuery);
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `🧠 Brand intelligence: "${sanitizedQuery}" → [${brandVariations.join(', ')}]`
          );
        }

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
            name: cleanFragranceName(result.name),
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
      sanitizedQuery &&
      sanitizedQuery.length > 2
    ) {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `🔍 No results found for "${sanitizedQuery}" - checking missing product intelligence`
          );
        }

        const missingProductResponse = await detector.handleProductNotFound(
          sanitizedQuery,
          undefined, // No user ID from search request
          request.headers.get('x-forwarded-for') || undefined,
          request.headers.get('user-agent') || undefined
        );

        // If we have good alternatives, format them as search results
        if (missingProductResponse.alternatives.length > 0) {
          // Check if alternatives have canonical UUIDs that need mapping
          const alternativeIds = missingProductResponse.alternatives.map(
            (alt: any) => alt.fragrance_id
          );
          const uuidPattern =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const needsMapping = alternativeIds.some((id: string) =>
            uuidPattern.test(id)
          );

          const alternativeIdMap = new Map();
          if (needsMapping) {
            const { data: altMapping } = await supabase
              .from('fragrances_canonical')
              .select('id, metadata')
              .in(
                'id',
                alternativeIds.filter((id: string) => uuidPattern.test(id))
              );

            altMapping?.forEach((mapping: any) => {
              const originalId = mapping.metadata?.migrated_from;
              if (originalId) {
                alternativeIdMap.set(mapping.id, originalId);
              }
            });
          }

          searchResults = {
            fragrances: missingProductResponse.alternatives.map((alt: any) => ({
              id: alternativeIdMap.get(alt.fragrance_id) || alt.fragrance_id, // Use original fragrance ID if available
              name: cleanFragranceName(alt.name),
              brand: alt.brand,
              brand_id: alt.brand_id || alt.brand,
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
          'X-Enhanced': enhanced?.toString() ?? 'false',
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
