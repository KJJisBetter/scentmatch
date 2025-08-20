import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * POST /api/collection
 * 
 * Add or remove a fragrance from user's personal collection
 */
export async function POST(request: NextRequest) {
  try {
    const { fragrance_id, action } = await request.json();

    if (!fragrance_id || !action) {
      return NextResponse.json({
        error: 'Missing required fields: fragrance_id, action'
      }, { status: 400 });
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json({
        error: 'Action must be "add" or "remove"'
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

    // Verify fragrance exists
    const { data: fragrance, error: fragranceError } = await supabase
      .from('fragrances')
      .select('id, name')
      .eq('id', fragrance_id)
      .single();

    if (fragranceError || !fragrance) {
      return NextResponse.json({
        error: 'Fragrance not found'
      }, { status: 400 });
    }

    let result;
    let in_collection = false;

    if (action === 'add') {
      // Check if already in collection
      const { data: existing } = await supabase
        .from('user_collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('fragrance_id', fragrance_id)
        .eq('collection_type', 'owned')
        .single();

      if (existing) {
        return NextResponse.json({
          success: true,
          in_collection: true,
          message: 'Already in your collection'
        });
      }

      // Add to collection
      const { data, error } = await supabase
        .from('user_collections')
        .insert({
          user_id: user.id,
          fragrance_id,
          collection_type: 'owned',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding to collection:', error);
        return NextResponse.json({
          error: 'Failed to add to collection'
        }, { status: 500 });
      }

      result = data;
      in_collection = true;

    } else if (action === 'remove') {
      // Remove from collection
      const { error } = await supabase
        .from('user_collections')
        .delete()
        .eq('user_id', user.id)
        .eq('fragrance_id', fragrance_id)
        .eq('collection_type', 'owned');

      if (error) {
        console.error('Error removing from collection:', error);
        return NextResponse.json({
          error: 'Failed to remove from collection'
        }, { status: 500 });
      }

      in_collection = false;
    }

    return NextResponse.json({
      success: true,
      in_collection,
      message: action === 'add' 
        ? `Added "${fragrance.name}" to your collection` 
        : `Removed "${fragrance.name}" from your collection`
    });

  } catch (error) {
    console.error('Collection API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * GET /api/collection
 * 
 * Get user's complete collection
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get user's collection with fragrance details
    const { data: collection, error } = await supabase
      .from('user_collections')
      .select(`
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
      `)
      .eq('user_id', user.id)
      .eq('collection_type', 'owned')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching collection:', error);
      return NextResponse.json({
        error: 'Failed to fetch collection'
      }, { status: 500 });
    }

    const formattedCollection = collection?.map((item: any) => ({
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
        sample_price_usd: item.fragrances?.sample_price_usd
      }
    })) || [];

    return NextResponse.json({
      collection: formattedCollection,
      total: formattedCollection.length
    });

  } catch (error) {
    console.error('Collection GET API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}