import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * GET /api/search/suggestions
 * 
 * MVP autocomplete endpoint for fragrance and brand suggestions
 * Provides fast, simple suggestions for search input
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    // Minimum query length check for MVP performance
    if (query.length < 2) {
      return NextResponse.json({
        suggestions: []
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // 1 hour cache
        },
      });
    }

    // Limit for MVP performance - 5 suggestions total
    const suggestionLimit = 5;
    const supabase = await createServerSupabase();

    // Search fragrances and brands in parallel for MVP speed
    const [fragranceResults, brandResults] = await Promise.all([
      // Search fragrance names
      supabase
        .from('fragrances')
        .select('name')
        .ilike('name', `%${query}%`)
        .limit(3) // Max 3 fragrance suggestions
        .order('score', { ascending: false, nullsFirst: false }),
      
      // Search brand names
      supabase
        .from('fragrance_brands')
        .select('name')
        .ilike('name', `%${query}%`)
        .limit(2) // Max 2 brand suggestions
        .order('item_count', { ascending: false, nullsFirst: false })
    ]);

    if (fragranceResults.error) {
      console.error('Error fetching fragrance suggestions:', fragranceResults.error);
    }

    if (brandResults.error) {
      console.error('Error fetching brand suggestions:', brandResults.error);
    }

    // Combine and format suggestions for MVP
    const suggestions: Array<{ text: string; type: string }> = [];

    // Add fragrance suggestions
    if (fragranceResults.data) {
      fragranceResults.data.forEach(fragrance => {
        suggestions.push({
          text: fragrance.name,
          type: 'fragrance'
        });
      });
    }

    // Add brand suggestions
    if (brandResults.data) {
      brandResults.data.forEach(brand => {
        suggestions.push({
          text: brand.name,
          type: 'brand'
        });
      });
    }

    // Limit total suggestions and remove duplicates for MVP
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase())
      )
      .slice(0, suggestionLimit);

    return NextResponse.json({
      suggestions: uniqueSuggestions
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600', // 30 min cache for queries
      },
    });

  } catch (error) {
    console.error('Unexpected error in suggestions API:', error);
    
    // Graceful fallback for MVP - return empty suggestions rather than error
    return NextResponse.json({
      suggestions: []
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300', // 5 min cache for errors
      },
    });
  }
}