'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase';

export type WishlistActionType = 'add' | 'remove';

export interface WishlistActionParams {
  fragrance_id: string;
  action: WishlistActionType;
}

export interface WishlistActionResult {
  success: boolean;
  in_wishlist: boolean;
  message: string;
  error?: string;
}

export interface WishlistItem {
  id: string;
  collection_type: string;
  rating: number | null;
  notes: string | null;
  added_at: string;
  fragrance: {
    id: string;
    name: string;
    brand: string;
    scent_family: string | null;
    gender: string | null;
    sample_available: boolean | null;
    sample_price_usd: number | null;
  };
}

export interface GetWishlistResult {
  success: boolean;
  wishlist?: WishlistItem[];
  total?: number;
  error?: string;
}

/**
 * Server Action: Toggle fragrance in user's wishlist
 *
 * Converts POST /api/wishlist functionality to Server Action
 * Handles both adding and removing fragrances from user's wishlist
 */
export async function toggleWishlist(
  params: WishlistActionParams
): Promise<WishlistActionResult> {
  try {
    const { fragrance_id, action } = params;

    // Validate required fields
    if (!fragrance_id || !action) {
      return {
        success: false,
        in_wishlist: false,
        message: 'Missing required fields: fragrance_id, action',
        error: 'Missing required fields: fragrance_id, action',
      };
    }

    // Validate action type
    if (!['add', 'remove'].includes(action)) {
      return {
        success: false,
        in_wishlist: false,
        message: 'Action must be "add" or "remove"',
        error: 'Action must be "add" or "remove"',
      };
    }

    const supabase = await createServerSupabase();

    // Check user authentication
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        in_wishlist: false,
        message: 'Authentication required',
        error: 'Authentication required',
      };
    }

    // Verify fragrance exists
    const { data: fragrance, error: fragranceError } = await (supabase as any)
      .from('fragrances')
      .select('id, name')
      .eq('id', fragrance_id)
      .single();

    if (fragranceError || !fragrance) {
      return {
        success: false,
        in_wishlist: false,
        message: 'Fragrance not found',
        error: 'Fragrance not found',
      };
    }

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
        return {
          success: true,
          in_wishlist: true,
          message: 'Already in your wishlist',
        };
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
        return {
          success: false,
          in_wishlist: false,
          message: 'Failed to add to wishlist',
          error: 'Failed to add to wishlist',
        };
      }

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
        return {
          success: false,
          in_wishlist: true,
          message: 'Failed to remove from wishlist',
          error: 'Failed to remove from wishlist',
        };
      }

      in_wishlist = false;
    }

    // Revalidate paths that display wishlist data
    revalidatePath('/wishlist');
    revalidatePath('/dashboard');
    revalidatePath('/recommendations');

    return {
      success: true,
      in_wishlist,
      message:
        action === 'add'
          ? `Added "${fragrance.name}" to your wishlist`
          : `Removed "${fragrance.name}" from your wishlist`,
    };
  } catch (error) {
    console.error('Wishlist action error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      in_wishlist: false,
      message: 'Internal server error',
      error: 'Internal server error',
    };
  }
}

/**
 * Server Action: Get user's complete wishlist
 *
 * Converts GET /api/wishlist functionality to Server Action
 * Returns formatted wishlist with fragrance details
 */
export async function getUserWishlist(): Promise<GetWishlistResult> {
  try {
    const supabase = await createServerSupabase();

    // Check user authentication
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      };
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
      return {
        success: false,
        error: 'Failed to fetch wishlist',
      };
    }

    const formattedWishlist: WishlistItem[] =
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

    return {
      success: true,
      wishlist: formattedWishlist,
      total: formattedWishlist.length,
    };
  } catch (error) {
    console.error('Wishlist GET action error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

/**
 * Server Action: Check if a fragrance is in user's wishlist
 *
 * Utility function to check wishlist status for a specific fragrance
 */
export async function isInWishlist(
  fragrance_id: string
): Promise<{ success: boolean; in_wishlist: boolean; error?: string }> {
  try {
    if (!fragrance_id) {
      return {
        success: false,
        in_wishlist: false,
        error: 'Fragrance ID is required',
      };
    }

    const supabase = await createServerSupabase();

    // Check user authentication
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        in_wishlist: false,
        error: 'Authentication required',
      };
    }

    // Check if fragrance is in wishlist
    const { data: existing, error } = await (supabase as any)
      .from('user_collections')
      .select('id')
      .eq('user_id', user.id)
      .eq('fragrance_id', fragrance_id)
      .eq('collection_type', 'wishlist')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error checking wishlist status:', error);
      return {
        success: false,
        in_wishlist: false,
        error: 'Failed to check wishlist status',
      };
    }

    return {
      success: true,
      in_wishlist: !!existing,
    };
  } catch (error) {
    console.error('Wishlist check error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      in_wishlist: false,
      error: 'Internal server error',
    };
  }
}
