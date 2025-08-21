/**
 * Enhanced Search API using Fuse.js
 *
 * Modern search endpoint with fuzzy matching, relevance scoring,
 * and result highlighting. Replaces complex custom search logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/lib/search/search-service';
import type { SearchOptions, SearchFilters } from '@/lib/search/search-types';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query = searchParams.get('q')?.trim() || '';
    const mode = (searchParams.get('mode') ||
      'standard') as SearchOptions['mode'];
    const limit = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get('limit') || '20'))
    );
    const includeHighlights = searchParams.get('highlights') === 'true';
    const boostPopular = searchParams.get('boost_popular') !== 'false'; // Default true

    // Parse filters
    const filters: SearchFilters = {};

    const scentFamilies = searchParams
      .get('scent_families')
      ?.split(',')
      .filter(Boolean);
    if (scentFamilies?.length) filters.scent_families = scentFamilies;

    const genders = searchParams.get('gender')?.split(',').filter(Boolean) as (
      | 'men'
      | 'women'
      | 'unisex'
    )[];
    if (genders?.length) filters.gender = genders;

    const occasions = searchParams.get('occasions')?.split(',').filter(Boolean);
    if (occasions?.length) filters.occasions = occasions;

    const seasons = searchParams.get('seasons')?.split(',').filter(Boolean);
    if (seasons?.length) filters.seasons = seasons;

    const sampleOnly = searchParams.get('sample_only') === 'true';
    if (sampleOnly) filters.sample_only = true;

    const minRating = parseFloat(searchParams.get('min_rating') || '0');
    if (minRating > 0) filters.min_rating = minRating;

    const maxPrice = parseFloat(searchParams.get('max_price') || '0');
    if (maxPrice > 0) filters.max_price = maxPrice;

    // Build search options
    const searchOptions: SearchOptions = {
      mode,
      limit,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      include_highlights: includeHighlights,
      boost_popular: boostPopular,
    };

    // Handle empty query case
    if (!query) {
      return NextResponse.json({
        results: [],
        total: 0,
        query: '',
        search_time_ms: Date.now() - startTime,
        metadata: {
          mode,
          filters_applied: !!searchOptions.filters,
          cache_hit: false,
          highlighting_enabled: includeHighlights,
          error: 'Query parameter required',
        },
      });
    }

    // Perform search using Fuse.js service
    const searchResponse = await searchService.search(query, searchOptions);

    // Transform response for backward compatibility with existing UI
    const compatibleResponse = {
      // New format (primary)
      ...searchResponse,

      // Legacy format for backward compatibility
      fragrances: searchResponse.results.map(result => ({
        id: result.fragrance.id,
        name: result.fragrance.name,
        brand: result.fragrance.brand,
        brand_id: (result.fragrance as any).brand_id || result.fragrance.id,
        gender: result.fragrance.gender || 'unisex',
        scent_family: result.fragrance.scent_family,
        relevance_score: result.score,
        sample_available: result.fragrance.sample_available ?? true,
        sample_price_usd: result.fragrance.sample_price_usd || 15,
        popularity_score: result.fragrance.popularity_score || 0,
        rating_value: (result.fragrance as any).rating_value || 0,
        rating_count: (result.fragrance as any).rating_count || 0,

        // Enhanced fields
        match_reason: result.match_reason,
        highlights: result.highlights,
      })),

      // Metadata
      search_method: 'fuse_js_enhanced',
      filters_applied: searchOptions.filters,
      ai_powered: false, // Fuse.js is not AI, but provides intelligent fuzzy search
      database_integrated: true,
      enhanced_features_enabled: true,
    };

    return NextResponse.json(compatibleResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Search-Method': 'fuse-js',
        'X-Search-Mode': mode as string,
        'X-Results-Count': searchResponse.total.toString(),
        'X-Processing-Time': searchResponse.search_time_ms.toString(),
      },
    });
  } catch (error) {
    console.error('Enhanced search API error:', error);

    return NextResponse.json(
      {
        error: 'Search service temporarily unavailable',
        details:
          process.env.NODE_ENV === 'development' ? String(error) : undefined,
        search_time_ms: Date.now() - startTime,
      },
      {
        status: 500,
        headers: {
          'X-Search-Method': 'fuse-js-error',
        },
      }
    );
  }
}

/**
 * POST /api/search/enhanced
 *
 * Advanced search with complex filters and sorting options
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query, options = {} } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          error: 'Query string required',
          search_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    // Perform search
    const searchResponse = await searchService.search(query, options);

    return NextResponse.json(searchResponse, {
      headers: {
        'Cache-Control': searchResponse.metadata.cache_hit
          ? 'public, s-maxage=300'
          : 'public, s-maxage=60',
        'X-Search-Method': 'fuse-js-post',
        'X-Cache-Hit': searchResponse.metadata.cache_hit.toString(),
      },
    });
  } catch (error) {
    console.error('Enhanced search POST error:', error);

    return NextResponse.json(
      {
        error: 'Search service temporarily unavailable',
        search_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
