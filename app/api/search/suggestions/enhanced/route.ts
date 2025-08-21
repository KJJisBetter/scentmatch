/**
 * Enhanced Search Suggestions API using Fuse.js
 *
 * Fast, accurate autocomplete suggestions with fuzzy matching.
 * Replaces AI-powered suggestions with efficient client-side search.
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/lib/search/search-service';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const limit = Math.max(
      1,
      Math.min(20, parseInt(searchParams.get('limit') || '8'))
    );
    const includeTrending = searchParams.get('include_trending') === 'true';

    // Return empty suggestions for very short queries
    if (query.length < 2) {
      const response = {
        suggestions: [],
        query,
        total_suggestions: 0,
        processing_time_ms: Date.now() - startTime,
        personalization_applied: false,
        ai_powered: false, // Using Fuse.js, not AI
      };

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'X-Suggestions-Source': 'fuse-js',
        },
      });
    }

    // Get suggestions using Fuse.js
    const suggestions = await searchService.getSuggestions(query, limit);

    // Transform to expected format for backward compatibility
    const formattedSuggestions = suggestions.map(suggestion => ({
      text: suggestion.text,
      type: suggestion.type,
      confidence: suggestion.confidence,
      personalized: false, // Fuse.js doesn't provide personalization
      result_count: suggestion.result_count,
    }));

    // Add trending suggestions if requested and we have space
    if (includeTrending && formattedSuggestions.length < limit) {
      // For MVP, we'll add some popular fragrance types as "trending"
      const trendingSuggestions = getTrendingSuggestions(
        query,
        limit - formattedSuggestions.length
      );
      formattedSuggestions.push(...trendingSuggestions);
    }

    const response = {
      suggestions: formattedSuggestions,
      query,
      total_suggestions: formattedSuggestions.length,
      processing_time_ms: Date.now() - startTime,
      personalization_applied: false,
      ai_powered: false,
      search_engine: 'fuse-js',
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Suggestions-Source': 'fuse-js',
        'X-Processing-Time': response.processing_time_ms.toString(),
      },
    });
  } catch (error) {
    console.error('Enhanced suggestions API error:', error);

    // Graceful fallback to basic suggestions
    const fallbackSuggestions = getFallbackSuggestions(
      new URL(request.url).searchParams.get('q') || '',
      8
    );

    return NextResponse.json(
      {
        suggestions: fallbackSuggestions,
        query: new URL(request.url).searchParams.get('q') || '',
        total_suggestions: fallbackSuggestions.length,
        processing_time_ms: Date.now() - startTime,
        personalization_applied: false,
        ai_powered: false,
        error: 'Suggestions service degraded',
        fallback_used: true,
      },
      {
        status: 200, // Return 200 even with fallback
        headers: {
          'Cache-Control': 'public, s-maxage=60',
          'X-Suggestions-Source': 'fallback',
        },
      }
    );
  }
}

/**
 * Get trending suggestions based on popular searches
 */
function getTrendingSuggestions(query: string, limit: number) {
  const trendingFragrances = [
    'Dior Homme',
    'Chanel No 5',
    'Tom Ford Black Orchid',
    'Creed Aventus',
    "YSL La Nuit de L'Homme",
    'Maison Margiela Replica',
    'Le Labo Santal 33',
    'Byredo Gypsy Water',
  ];

  const trendingBrands = [
    'Dior',
    'Chanel',
    'Tom Ford',
    'Creed',
    'YSL',
    'Maison Margiela',
    'Le Labo',
    'Byredo',
  ];

  const trending = [];
  const queryLower = query.toLowerCase();

  // Add matching trending fragrances
  for (const fragrance of trendingFragrances) {
    if (trending.length >= limit) break;
    if (fragrance.toLowerCase().includes(queryLower)) {
      trending.push({
        text: fragrance,
        type: 'fragrance' as const,
        confidence: 0.6,
        personalized: false,
        result_count: undefined,
      });
    }
  }

  // Add matching trending brands
  for (const brand of trendingBrands) {
    if (trending.length >= limit) break;
    if (brand.toLowerCase().includes(queryLower)) {
      trending.push({
        text: brand,
        type: 'brand' as const,
        confidence: 0.5,
        personalized: false,
        result_count: undefined,
      });
    }
  }

  return trending;
}

/**
 * Fallback suggestions when search service fails
 */
function getFallbackSuggestions(query: string, limit: number) {
  if (!query || query.length < 2) return [];

  const queryLower = query.toLowerCase();

  // Basic hardcoded suggestions for common searches
  const commonSuggestions: Record<
    string,
    Array<{ text: string; type: 'fragrance' | 'brand' }>
  > = {
    dior: [
      { text: 'Dior Homme', type: 'fragrance' },
      { text: 'Dior Sauvage', type: 'fragrance' },
      { text: 'Dior', type: 'brand' },
    ],
    chanel: [
      { text: 'Chanel No 5', type: 'fragrance' },
      { text: 'Chanel Bleu', type: 'fragrance' },
      { text: 'Chanel', type: 'brand' },
    ],
    tom: [
      { text: 'Tom Ford Black Orchid', type: 'fragrance' },
      { text: 'Tom Ford', type: 'brand' },
    ],
    creed: [
      { text: 'Creed Aventus', type: 'fragrance' },
      { text: 'Creed', type: 'brand' },
    ],
    fresh: [
      { text: 'Fresh Fragrances', type: 'fragrance' },
      { text: 'Fresh Citrus', type: 'fragrance' },
    ],
    woody: [
      { text: 'Woody Fragrances', type: 'fragrance' },
      { text: 'Woody Amber', type: 'fragrance' },
    ],
  };

  // Find matching suggestions
  const suggestions = [];
  for (const [key, values] of Object.entries(commonSuggestions)) {
    if (key.includes(queryLower) || queryLower.includes(key)) {
      for (const suggestion of values) {
        if (suggestions.length >= limit) break;
        suggestions.push({
          ...suggestion,
          confidence: 0.7,
          personalized: false,
        });
      }
    }
  }

  return suggestions.slice(0, limit);
}
