'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase';

export type CollectionActionType = 'add' | 'remove';

export interface CollectionActionParams {
  fragrance_id: string;
  action: CollectionActionType;
}

export interface CollectionActionResult {
  success: boolean;
  in_collection: boolean;
  message: string;
  error?: string;
}

export interface CollectionItem {
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

export interface GetCollectionResult {
  success: boolean;
  collection?: CollectionItem[];
  total?: number;
  error?: string;
}

/**
 * Server Action: Toggle fragrance in user's personal collection
 *
 * Converts POST /api/collection functionality to Server Action
 * Handles both adding and removing fragrances from user's owned collection
 */
export async function toggleCollection(
  params: CollectionActionParams
): Promise<CollectionActionResult> {
  try {
    const { fragrance_id, action } = params;

    // Validate required fields
    if (!fragrance_id || !action) {
      return {
        success: false,
        in_collection: false,
        message: 'Missing required fields: fragrance_id, action',
        error: 'Missing required fields: fragrance_id, action',
      };
    }

    // Validate action type
    if (!['add', 'remove'].includes(action)) {
      return {
        success: false,
        in_collection: false,
        message: 'Action must be "add" or "remove"',
        error: 'Action must be "add" or "remove"',
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
        in_collection: false,
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
        in_collection: false,
        message: 'Fragrance not found',
        error: 'Fragrance not found',
      };
    }

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
        return {
          success: true,
          in_collection: true,
          message: 'Already in your collection',
        };
      }

      // Add to collection
      const { data, error } = await supabase
        .from('user_collections')
        .insert({
          user_id: user.id,
          fragrance_id,
          collection_type: 'owned',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding to collection:', error);
        return {
          success: false,
          in_collection: false,
          message: 'Failed to add to collection',
          error: 'Failed to add to collection',
        };
      }

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
        return {
          success: false,
          in_collection: true,
          message: 'Failed to remove from collection',
          error: 'Failed to remove from collection',
        };
      }

      in_collection = false;
    }

    // Revalidate paths that display collection data
    revalidatePath('/collection');
    revalidatePath('/dashboard');
    revalidatePath('/recommendations');

    return {
      success: true,
      in_collection,
      message:
        action === 'add'
          ? `Added "${fragrance.name}" to your collection`
          : `Removed "${fragrance.name}" from your collection`,
    };
  } catch (error) {
    console.error('Collection action error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      in_collection: false,
      message: 'Internal server error',
      error: 'Internal server error',
    };
  }
}

/**
 * Server Action: Get user's complete collection
 *
 * Converts GET /api/collection functionality to Server Action
 * Returns formatted collection with fragrance details
 */
export async function getUserCollection(): Promise<GetCollectionResult> {
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

    // Get user's collection with fragrance details
    const { data: collection, error } = await supabase
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
      .eq('collection_type', 'owned')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching collection:', error);
      return {
        success: false,
        error: 'Failed to fetch collection',
      };
    }

    const formattedCollection: CollectionItem[] =
      collection?.map((item: any) => ({
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
      collection: formattedCollection,
      total: formattedCollection.length,
    };
  } catch (error) {
    console.error('Collection GET action error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

/**
 * Server Action: Check if a fragrance is in user's collection
 *
 * Utility function to check collection status for a specific fragrance
 */
export async function isInCollection(
  fragrance_id: string
): Promise<{ success: boolean; in_collection: boolean; error?: string }> {
  try {
    if (!fragrance_id) {
      return {
        success: false,
        in_collection: false,
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
        in_collection: false,
        error: 'Authentication required',
      };
    }

    // Check if fragrance is in collection
    const { data: existing, error } = await supabase
      .from('user_collections')
      .select('id')
      .eq('user_id', user.id)
      .eq('fragrance_id', fragrance_id)
      .eq('collection_type', 'owned')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error checking collection status:', error);
      return {
        success: false,
        in_collection: false,
        error: 'Failed to check collection status',
      };
    }

    return {
      success: true,
      in_collection: !!existing,
    };
  } catch (error) {
    console.error('Collection check error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      in_collection: false,
      error: 'Internal server error',
    };
  }
}
