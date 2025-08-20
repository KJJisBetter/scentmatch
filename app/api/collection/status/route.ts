import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * GET /api/collection/status
 * 
 * Get collection and wishlist status for multiple fragrances
 * Query params: fragrance_ids (comma-separated)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fragranceIdsParam = searchParams.get('fragrance_ids');

    if (!fragranceIdsParam) {
      return NextResponse.json({
        error: 'Missing fragrance_ids parameter'
      }, { status: 400 });
    }

    const fragranceIds = fragranceIdsParam.split(',').filter(Boolean);

    if (fragranceIds.length === 0) {
      return NextResponse.json({
        error: 'No valid fragrance IDs provided'
      }, { status: 400 });
    }

    if (fragranceIds.length > 50) {
      return NextResponse.json({
        error: 'Too many fragrance IDs (max 50)'
      }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get user's collection status for the requested fragrances
    const { data: collectionData, error } = await supabase
      .from('user_collections')
      .select('fragrance_id, collection_type')
      .eq('user_id', user.id)
      .in('fragrance_id', fragranceIds);

    if (error) {
      console.error('Error fetching collection status:', error);
      return NextResponse.json({
        error: 'Failed to fetch collection status'
      }, { status: 500 });
    }

    // Build status object
    const statuses: Record<string, { in_collection: boolean; in_wishlist: boolean }> = {};

    // Initialize all requested IDs with false status
    fragranceIds.forEach(id => {
      statuses[id] = {
        in_collection: false,
        in_wishlist: false
      };
    });

    // Update with actual status from database
    collectionData?.forEach((item: any) => {
      if (!statuses[item.fragrance_id]) {
        statuses[item.fragrance_id] = {
          in_collection: false,
          in_wishlist: false
        };
      }

      if (item.collection_type === 'owned') {
        statuses[item.fragrance_id]!.in_collection = true;
      } else if (item.collection_type === 'wishlist') {
        statuses[item.fragrance_id]!.in_wishlist = true;
      }
    });

    return NextResponse.json({
      statuses
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60'
      }
    });

  } catch (error) {
    console.error('Collection status API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}