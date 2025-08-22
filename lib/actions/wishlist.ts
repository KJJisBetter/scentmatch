'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  WishlistActionParams,
  WishlistActionResult,
  GetWishlistResult,
  WishlistActionParamsSchema,
  validateWishlistAction,
  CollectionItem,
} from '@/lib/schemas/entities';

// Export types from schemas for backward compatibility
export type { 
  WishlistActionParams,
  WishlistActionResult,
  GetWishlistResult,
};

export type WishlistActionType = 'add' | 'remove';
export type WishlistItem = CollectionItem;

/**
 * Unified Server Action: Update User Wishlist
 * 
 * Replaces all wishlist API routes with a single, comprehensive Server Action.
 * Handles add, remove, bulk_add, and clear operations in one unified interface.
 * This eliminates the duplicate API routes and consolidates wishlist management.
 */
export async function updateUserWishlist(
  action: 'add' | 'remove' | 'bulk_add' | 'clear',
  fragranceIds: string | string[]
): Promise<{
  success: boolean;
  error?: string;
  count?: number;
  data?: {
    action_performed: 'add' | 'remove' | 'bulk_add' | 'clear';
    items_affected: number;
    message: string;
  };
}> {
  try {
    const supabase = await createServerSupabase();

    // Check user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Normalize fragranceIds to array
    const ids = Array.isArray(fragranceIds) ? fragranceIds : [fragranceIds];
    
    // Validate fragrance IDs
    for (const id of ids) {
      const validation = validateWishlistAction({
        fragrance_id: id,
        action: action === 'bulk_add' ? 'add' : action === 'clear' ? 'remove' : action,
      });

      if (!validation.success) {
        return {
          success: false,
          error: `Invalid fragrance ID: ${id}`,
        };
      }
    }

    let itemsAffected = 0;
    let message = '';

    if (action === 'add') {
      const fragranceId = ids[0];
      
      // Verify fragrance exists
      const { data: fragrance, error: fragranceError } = await supabase
        .from('fragrances')
        .select('id, name')
        .eq('id', fragranceId)
        .single();

      if (fragranceError || !fragrance) {
        return {
          success: false,
          error: 'Fragrance not found',
        };
      }

      // Check if already in wishlist
      const { data: existing } = await supabase
        .from('user_collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('fragrance_id', fragranceId)
        .eq('collection_type', 'wishlist')
        .single();

      if (existing) {
        return {
          success: true,
          count: 0,
          data: {
            action_performed: 'add',
            items_affected: 0,
            message: `"${fragrance.name}" is already in your wishlist`,
          },
        };
      }

      // Add to wishlist
      const { data, error } = await supabase
        .from('user_collections')
        .insert({
          user_id: user.id,
          fragrance_id: fragranceId,
          collection_type: 'wishlist',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding to wishlist:', error);
        return {
          success: false,
          error: 'Failed to add to wishlist',
        };
      }

      itemsAffected = 1;
      message = `Added "${fragrance.name}" to your wishlist`;

    } else if (action === 'remove') {
      const fragranceId = ids[0];

      // Verify fragrance exists
      const { data: fragrance, error: fragranceError } = await supabase
        .from('fragrances')
        .select('id, name')
        .eq('id', fragranceId)
        .single();

      if (fragranceError || !fragrance) {
        return {
          success: false,
          error: 'Fragrance not found',
        };
      }

      // Remove from wishlist
      const { data, error } = await supabase
        .from('user_collections')
        .delete()
        .eq('user_id', user.id)
        .eq('fragrance_id', fragranceId)
        .eq('collection_type', 'wishlist');

      if (error) {
        console.error('Error removing from wishlist:', error);
        return {
          success: false,
          error: 'Failed to remove from wishlist',
        };
      }

      itemsAffected = 1;
      message = `Removed "${fragrance.name}" from your wishlist`;

    } else if (action === 'bulk_add') {
      // Verify all fragrances exist
      const { data: fragrances, error: fragrancesError } = await supabase
        .from('fragrances')
        .select('id, name')
        .in('id', ids);

      if (fragrancesError || fragrances.length !== ids.length) {
        return {
          success: false,
          error: 'One or more fragrances not found',
        };
      }

      // Get existing wishlist items to avoid duplicates
      const { data: existingItems } = await supabase
        .from('user_collections')
        .select('fragrance_id')
        .eq('user_id', user.id)
        .eq('collection_type', 'wishlist')
        .in('fragrance_id', ids);

      const existingIds = existingItems?.map((item: any) => item.fragrance_id) || [];
      const newIds = ids.filter(id => !existingIds.includes(id));

      if (newIds.length === 0) {
        return {
          success: true,
          count: 0,
          data: {
            action_performed: 'bulk_add',
            items_affected: 0,
            message: 'All selected fragrances are already in your wishlist',
          },
        };
      }

      // Bulk insert new wishlist items
      const insertData = newIds.map(fragranceId => ({
        user_id: user.id,
        fragrance_id: fragranceId,
        collection_type: 'wishlist',
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('user_collections')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Error bulk adding to wishlist:', error);
        return {
          success: false,
          error: 'Failed to add fragrances to wishlist',
        };
      }

      itemsAffected = newIds.length;
      message = `Added ${newIds.length} fragrance${newIds.length > 1 ? 's' : ''} to your wishlist`;

    } else if (action === 'clear') {
      // Remove all items from wishlist
      const { data, error } = await supabase
        .from('user_collections')
        .delete()
        .eq('user_id', user.id)
        .eq('collection_type', 'wishlist');

      if (error) {
        console.error('Error clearing wishlist:', error);
        return {
          success: false,
          error: 'Failed to clear wishlist',
        };
      }

      itemsAffected = data?.length || 0;
      message = 'Cleared your wishlist';
    }

    // Revalidate paths that display wishlist data
    revalidatePath('/wishlist');
    revalidatePath('/dashboard');
    revalidatePath('/recommendations');

    return {
      success: true,
      count: itemsAffected,
      data: {
        action_performed: action,
        items_affected: itemsAffected,
        message,
      },
    };
  } catch (error) {
    console.error('Wishlist update error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Internal server error',
    };
  }
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
    // Validate input using Zod schema
    const validation = validateWishlistAction(params);
    if (!validation.success) {
      return {
        success: false,
        in_wishlist: false,
        message: validation.error!,
        error: validation.error,
      };
    }

    const { fragrance_id, action } = validation.data!;

    const supabase = await createServerSupabase();

    // Check user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        in_wishlist: false,
        message: 'Authentication required',
        error: 'Authentication required',
      };
    }

    // Verify fragrance exists
    const { data: fragrance, error: fragranceError } = await supabase
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
      const { data: existing } = await supabase
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
      const { data, error } = await supabase
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
      const { error } = await supabase
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
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Get user's wishlist with fragrance details
    const { data: wishlist, error } = await supabase
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
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        in_wishlist: false,
        error: 'Authentication required',
      };
    }

    // Check if fragrance is in wishlist
    const { data: existing, error } = await supabase
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
