import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/fragrances/[id]
 *
 * Fetches detailed fragrance information by ID
 * Returns comprehensive fragrance data including brand info
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate fragrance ID
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { error: 'Fragrance ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    // Fetch fragrance with brand information using actual database columns
    const { data: fragrance, error } = await (supabase as any)
      .from('fragrances')
      .select(
        `
        id,
        name,
        brand_id,
        gender,
        fragrance_brands:brand_id (
          id,
          name
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Fragrance not found' },
          { status: 404 }
        );
      }

      console.error('Database error fetching fragrance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch fragrance data' },
        { status: 500 }
      );
    }

    if (!fragrance) {
      return NextResponse.json(
        { error: 'Fragrance not found' },
        { status: 404 }
      );
    }

    // Return fragrance data with proper typing
    return NextResponse.json(fragrance, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400', // 1 hour cache, 24 hour stale
      },
    });
  } catch (error) {
    console.error('Unexpected error in fragrance API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
