import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * POST /api/wishlist
 *
 * Add or remove a fragrance from user's wishlist
 */
export async function POST(request: NextRequest) {
  try {
    const { fragrance_id, action } = await request.json();

    if (!fragrance_id || !action) {
      return NextResponse.json(
        {
          error: 'Missing required fields: fragrance_id, action',
        },
        { status: 400 }
      );
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json(
        {
          error: 'Action must be "add" or "remove"',
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    // Check user authentication
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Verify fragrance exists
    const { data: fragrance, error: fragranceError } = await (supabase as any)
      .from('fragrances')
      .select('id, name')
      .eq('id', fragrance_id)
      .single();

    if (fragranceError || !fragrance) {
      return NextResponse.json(
        {
          error: 'Fragrance not found',
        },
        { status: 400 }
      );
    }

    let result;
    let in_wishlist = false;

    if (action === 'add') {
      // Check if already in wishlist
      const { data: existing } = await (supabase as any)
        .from('user_collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('fragrance_id', fragrance_id)
        .eq('collection_type', 'wishlist')
        .single();

      if (existing) {
        return NextResponse.json({
          success: true,
          in_wishlist: true,
          message: 'Already in your wishlist',
        });
      }

      // Add to wishlist
      const { data, error } = await (supabase as any)
        .from('user_collections')
        .insert({
          user_id: user.id,
          fragrance_id,
          collection_type: 'wishlist',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding to wishlist:', error);
        return NextResponse.json(
          {
            error: 'Failed to add to wishlist',
          },
          { status: 500 }
        );
      }

      result = data;
      in_wishlist = true;
    } else if (action === 'remove') {
      // Remove from wishlist
      const { error } = await (supabase as any)
        .from('user_collections')
        .delete()
        .eq('user_id', user.id)
        .eq('fragrance_id', fragrance_id)
        .eq('collection_type', 'wishlist');

      if (error) {
        console.error('Error removing from wishlist:', error);
        return NextResponse.json(
          {
            error: 'Failed to remove from wishlist',
          },
          { status: 500 }
        );
      }

      in_wishlist = false;
    }

    return NextResponse.json({
      success: true,
      in_wishlist,
      message:
        action === 'add'
          ? `Added "${fragrance.name}" to your wishlist`
          : `Removed "${fragrance.name}" from your wishlist`,
    });
  } catch (error) {
    console.error('Wishlist API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wishlist
 *
 * Get user's complete wishlist
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Check user authentication
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Get user's wishlist with fragrance details
    const { data: wishlist, error } = await (supabase as any)
      .from('user_collections')
      .select(
        `
        id,
        collection_type,
        rating,
        notes,
        created_at,
        fragrances (
          id,
          name,
          scent_family,
          gender,
          sample_available,
          sample_price_usd,
          fragrance_brands!inner(name)
        )
      `
      )
      .eq('user_id', user.id)
      .eq('collection_type', 'wishlist')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wishlist:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch wishlist',
        },
        { status: 500 }
      );
    }

    const formattedWishlist =
      wishlist?.map((item: any) => ({
        id: item.id,
        collection_type: item.collection_type,
        rating: item.rating,
        notes: item.notes,
        added_at: item.created_at,
        fragrance: {
          id: item.fragrances?.id,
          name: item.fragrances?.name,
          brand: item.fragrances?.fragrance_brands?.name || 'Unknown Brand',
          scent_family: item.fragrances?.scent_family,
          gender: item.fragrances?.gender,
          sample_available: item.fragrances?.sample_available,
          sample_price_usd: item.fragrances?.sample_price_usd,
        },
      })) || [];

    return NextResponse.json({
      wishlist: formattedWishlist,
      total: formattedWishlist.length,
    });
  } catch (error) {
    console.error('Wishlist GET API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
