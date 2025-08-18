import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Fragrances API Endpoint
 *
 * Provides fragrance search and listing functionality for:
 * - Autocomplete search in quiz favorite selection
 * - Browse page fragrance listing
 * - General fragrance discovery
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || searchParams.get('q') || '';
    const sort = searchParams.get('sort') || 'rating';

    const supabase = await createClient();

    let query = supabase
      .from('fragrances')
      .select(
        `
        id,
        name,
        brand_name,
        slug,
        rating_value,
        rating_count,
        score,
        gender,
        accords,
        perfumers
      `
      )
      .not('rating_value', 'is', null) // Only return rated fragrances
      .limit(Math.min(limit, 100)); // Cap at 100 results

    // Add search filter if provided
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,brand_name.ilike.%${search}%,accords.cs.{${search}}`
      );
    }

    // Add sorting
    switch (sort) {
      case 'popularity':
        query = query.order('rating_count', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating_value', { ascending: false });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'brand':
        query = query.order('brand_name', { ascending: true });
        break;
      default:
        query = query.order('rating_value', { ascending: false });
    }

    const { data: fragrances, error } = await query;

    if (error) {
      console.error('Error fetching fragrances:', error);
      return NextResponse.json(
        { error: 'Failed to fetch fragrances' },
        { status: 500 }
      );
    }

    // Format results for frontend consumption
    const formattedFragrances =
      fragrances?.map(fragrance => ({
        id: fragrance.id,
        name: fragrance.name,
        brand: fragrance.brand_name,
        slug: fragrance.slug,
        rating: fragrance.rating_value,
        rating_count: fragrance.rating_count,
        score: fragrance.score,
        gender: fragrance.gender,
        accords: fragrance.accords || [],
        perfumers: fragrance.perfumers || [],
        popularity_score: fragrance.rating_count || 0,
      })) || [];

    return NextResponse.json({
      success: true,
      fragrances: formattedFragrances,
      total: formattedFragrances.length,
      search_query: search,
      sort_method: sort,
    });
  } catch (error) {
    console.error('Unexpected error in fragrances API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
