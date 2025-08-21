import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * GET /api/fragrances
 *
 * Simple fragrances endpoint that works with current database schema
 * Fixed for browse page integration without timeout issues
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse parameters
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const offset = (page - 1) * limit;
    const gender = searchParams.get('gender');
    const brand = searchParams.get('brand');

    const supabase = await createServerSupabase();

    // Build query with popularity scoring for proper sorting
    let query = (supabase as any)
      .from('fragrances')
      .select(
        `
        id,
        name,
        brand_id,
        gender,
        popularity_score,
        rating_value,
        rating_count,
        sample_available,
        sample_price_usd,
        fragrance_brands:brand_id (
          name
        )
      `
      )
      .range(offset, offset + limit - 1);

    // Apply filters using actual columns
    if (gender) {
      query = query.eq('gender', gender);
    }

    if (brand) {
      query = query.eq('brand_id', brand);
    }

    // Order by popularity score (highest first), then by name for ties
    query = query
      .order('popularity_score', { ascending: false, nullsLast: true })
      .order('name', { ascending: true });

    const { data: fragrances, error } = await query;

    if (error) {
      console.error('Fragrances API error:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch fragrances',
          details:
            process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    // Format results with popularity scoring
    const formattedFragrances =
      fragrances?.map((f: any) => ({
        id: f.id,
        name: f.name,
        brand: (f.fragrance_brands as any)?.name || 'Unknown Brand',
        brand_id: f.brand_id,
        gender: f.gender || 'unisex',
        popularity_score: f.popularity_score || 0,
        rating_value: f.rating_value || 0,
        rating_count: f.rating_count || 0,
        sample_available: f.sample_available ?? true,
        sample_price_usd: f.sample_price_usd || 15,
      })) || [];

    return NextResponse.json(
      {
        fragrances: formattedFragrances,
        total: formattedFragrances.length,
        page,
        limit,
        has_more: formattedFragrances.length === limit,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Fragrances API error:', error);
    return NextResponse.json(
      { error: 'Fragrances service temporarily unavailable' },
      { status: 500 }
    );
  }
}
