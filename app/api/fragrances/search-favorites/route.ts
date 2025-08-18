import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * GET /api/fragrances/search-favorites
 *
 * Autocomplete search for favorite fragrance selection
 * Optimized for user-friendly search during quiz experience
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);

    // Extract and validate parameters
    const query = searchParams.get('query');
    const limitParam = searchParams.get('limit');
    const sampleOnlyParam = searchParams.get('sample_only');

    // Validate query parameter
    if (!query || query.length < 3) {
      return NextResponse.json(
        { error: 'Query parameter required with minimum 3 characters' },
        { status: 400 }
      );
    }

    // Parse limit parameter
    const limit = limitParam ? Math.min(parseInt(limitParam), 50) : 10;
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: 'Limit must be a positive number (max 50)' },
        { status: 400 }
      );
    }

    // Parse sample_only parameter
    const sampleOnly = sampleOnlyParam === 'true';

    // Clean and prepare search query
    const searchQuery = query.trim().toLowerCase();

    // Build database query (using existing schema)
    let dbQuery = supabase
      .from('fragrances')
      .select(
        `
        id,
        name,
        brand_name,
        rating_value,
        rating_count,
        score,
        gender,
        accords
      `
      )
      .not('rating_value', 'is', null);

    // Apply search filters
    if (sampleOnly) {
      // Filter for sample availability (mock for now since schema doesn't have this field)
      dbQuery = dbQuery.gte('rating_count', 10); // Use rating count as proxy for availability
    }

    // Use text search on multiple fields using existing schema
    if (searchQuery) {
      dbQuery = dbQuery.or(
        `name.ilike.%${searchQuery}%,brand_name.ilike.%${searchQuery}%`
      );
    }

    // Apply limit and order
    dbQuery = dbQuery.order('rating_value', { ascending: false }).limit(limit);

    const { data: fragrances, error: searchError } = await dbQuery;

    if (searchError) {
      console.error('Error searching fragrances:', searchError);
      return NextResponse.json(
        { error: 'Search temporarily unavailable' },
        { status: 500 }
      );
    }

    // Also search by notes if no direct name/brand matches
    let noteMatches: any[] = [];
    if (fragrances && fragrances.length < limit / 2) {
      const { data: noteSearchResults } = await supabase
        .from('fragrances')
        .select(
          `
          id,
          name,
          brand_id,
          scent_family,
          notes,
          sample_available,
          sample_price_usd,
          popularity_score,
          image_url,
          fragrance_brands!inner(
            name
          )
        `
        )
        .contains('notes', [searchQuery])
        .order('popularity_score', { ascending: false, nullsFirst: false })
        .limit(Math.max(5, limit - (fragrances?.length || 0)));

      noteMatches = noteSearchResults || [];
    }

    // Combine and deduplicate results
    const allResults = [...(fragrances || []), ...noteMatches];
    const uniqueResults = allResults.filter(
      (fragrance, index, self) =>
        index === self.findIndex(f => f.id === fragrance.id)
    );

    // Format results for response
    const formattedResults = (fragrances || [])
      .slice(0, limit)
      .map(fragrance => ({
        id: fragrance.id,
        name: fragrance.name,
        brand: fragrance.brand_name,
        scent_family: fragrance.accords?.[0] || 'Unclassified',
        popularity_score: fragrance.rating_count || 0,
        sample_available: (fragrance.rating_count || 0) >= 10, // Mock based on popularity
        sample_price_usd: 8.99, // Mock price
        notes: fragrance.accords || [],
        image_url: null, // Not available in current schema
        // Add search relevance score for sorting
        relevance_score: calculateRelevanceScore(fragrance, searchQuery),
      }))
      .sort((a, b) => {
        // Sort by relevance first, then popularity
        if (b.relevance_score !== a.relevance_score) {
          return b.relevance_score - a.relevance_score;
        }
        return (b.popularity_score || 0) - (a.popularity_score || 0);
      });

    // Get total count for pagination info (simplified)
    const totalMatches = formattedResults.length;

    console.log(
      `Fragrance search: "${query}" returned ${totalMatches} results`
    );

    return NextResponse.json(
      {
        fragrances: formattedResults,
        total_matches: totalMatches,
        query_used: query,
        search_metadata: {
          sample_only_filter: sampleOnly,
          results_limit: limit,
          search_performance: 'optimized',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=600', // 5 min cache, 10 min CDN
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in fragrance search:', error);

    return NextResponse.json(
      { error: 'Search service temporarily unavailable' },
      { status: 500 }
    );
  }
}

/**
 * Calculate relevance score for search result ranking
 */
function calculateRelevanceScore(fragrance: any, query: string): number {
  let score = 0;
  const normalizedQuery = query.toLowerCase();
  const name = fragrance.name.toLowerCase();
  const brand = fragrance.brand_name?.toLowerCase() || '';

  // Exact name match gets highest score
  if (name === normalizedQuery) {
    score += 100;
  } else if (name.startsWith(normalizedQuery)) {
    score += 80;
  } else if (name.includes(normalizedQuery)) {
    score += 60;
  }

  // Brand match
  if (brand === normalizedQuery) {
    score += 70;
  } else if (brand.startsWith(normalizedQuery)) {
    score += 50;
  } else if (brand.includes(normalizedQuery)) {
    score += 30;
  }

  // Accords match (if accords contain the query)
  if (
    fragrance.accords &&
    fragrance.accords.some((accord: string) =>
      accord.toLowerCase().includes(normalizedQuery)
    )
  ) {
    score += 20;
  }

  // Boost popular fragrances slightly
  score += (fragrance.rating_count || 0) * 0.01;

  // Boost highly rated fragrances
  score += (fragrance.rating_value || 0) * 2;

  return score;
}

/**
 * Alternative implementation using PostgreSQL full-text search (for future optimization)
 */
async function performFullTextSearch(
  supabase: any,
  query: string,
  limit: number,
  sampleOnly: boolean
) {
  // This would use PostgreSQL's ts_vector for better search performance
  // Implementation would depend on having search_vector column populated

  const searchVector = query
    .split(' ')
    .map(term => `${term}:*`)
    .join(' & ');

  let dbQuery = supabase
    .from('fragrances')
    .select(
      `
      id,
      name,
      brand_id,
      scent_family,
      notes,
      sample_available,
      sample_price_usd,
      popularity_score,
      search_vector,
      fragrance_brands!inner(name)
    `
    )
    .textSearch('search_vector', searchVector)
    .order('popularity_score', { ascending: false });

  if (sampleOnly) {
    dbQuery = dbQuery.eq('sample_available', true);
  }

  return await dbQuery.limit(limit);
}
