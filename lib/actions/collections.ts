'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  CollectionActionParams,
  CollectionActionResult,
  CollectionItem,
  GetCollectionResult,
  CollectionActionParamsSchema,
  validateCollectionAction,
} from '@/lib/schemas/entities';

// Export types from schemas for backward compatibility
export type {
  CollectionActionParams,
  CollectionActionResult,
  CollectionItem,
  GetCollectionResult,
};

export type CollectionActionType = 'add' | 'remove';

/**
 * Unified Server Action: Update User Collection
 *
 * Replaces all collection API routes with a single, comprehensive Server Action.
 * Handles add, remove, rate, and update operations in one unified interface.
 * This eliminates the duplicate API routes and consolidates collection management.
 */
export async function updateUserCollection(
  action: 'add' | 'remove' | 'rate' | 'update',
  fragranceId: string,
  metadata?: {
    rating?: number;
    notes?: string;
    tags?: string[];
  }
): Promise<{
  success: boolean;
  error?: string;
  data?: {
    id?: string;
    in_collection: boolean;
    action_performed: 'add' | 'remove' | 'rate' | 'update';
    message: string;
  };
}> {
  try {
    // Validate inputs using our Zod schemas
    const validation = validateCollectionAction({
      fragrance_id: fragranceId,
      action: action === 'rate' || action === 'update' ? 'add' : action,
    });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
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
        error: 'Authentication required',
      };
    }

    // Verify fragrance exists - handle both UUID and slug formats
    const { data: fragrance, error: fragranceError } = await supabase
      .from('fragrances')
      .select('id, name')
      .or(`id.eq.${fragranceId},slug.eq.${fragranceId}`)
      .single();

    if (fragranceError || !fragrance) {
      console.log('Fragrance lookup failed:', fragranceError);
      return {
        success: false,
        error: 'Fragrance not found',
      };
    }

    // Use the actual fragrance ID from database (UUID format)
    const actualFragranceId = fragrance.id;
    console.log(
      'Found fragrance:',
      fragrance.name,
      'with ID:',
      actualFragranceId
    );

    let result: any;
    let in_collection = false;
    let message = '';

    if (action === 'add') {
      // Check if already in collection
      const { data: existing } = await supabase
        .from('user_collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('fragrance_id', actualFragranceId)
        .eq('collection_type', 'owned')
        .single();

      if (existing) {
        return {
          success: true,
          data: {
            in_collection: true,
            action_performed: 'add',
            message: `"${fragrance.name}" is already in your collection`,
          },
        };
      }

      // Add to collection
      const { data, error } = await supabase
        .from('user_collections')
        .insert({
          user_id: user.id,
          fragrance_id: actualFragranceId,
          collection_type: 'owned',
          rating: metadata?.rating || null,
          notes: metadata?.notes || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding to collection:', error);
        return {
          success: false,
          error: 'Failed to add to collection',
        };
      }

      result = data;
      in_collection = true;
      message = `Added "${fragrance.name}" to your collection`;
    } else if (action === 'remove') {
      // Remove from collection
      const { error } = await supabase
        .from('user_collections')
        .delete()
        .eq('user_id', user.id)
        .eq('fragrance_id', actualFragranceId)
        .eq('collection_type', 'owned');

      if (error) {
        console.error('Error removing from collection:', error);
        return {
          success: false,
          error: 'Failed to remove from collection',
        };
      }

      in_collection = false;
      message = `Removed "${fragrance.name}" from your collection`;
    } else if (action === 'rate' || action === 'update') {
      // Update existing collection item with rating/notes
      const { data, error } = await supabase
        .from('user_collections')
        .update({
          rating: metadata?.rating,
          notes: metadata?.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('fragrance_id', actualFragranceId)
        .eq('collection_type', 'owned')
        .select()
        .single();

      if (error) {
        console.error(
          `Error ${action === 'rate' ? 'rating' : 'updating'} collection item:`,
          error
        );
        return {
          success: false,
          error: `Failed to ${action === 'rate' ? 'rate' : 'update'} collection item`,
        };
      }

      result = data;
      in_collection = true;
      message =
        action === 'rate'
          ? `Updated rating for "${fragrance.name}"`
          : `Updated "${fragrance.name}" in your collection`;
    }

    // Revalidate paths that display collection data
    revalidatePath('/collection');
    revalidatePath('/dashboard');
    revalidatePath('/recommendations');

    return {
      success: true,
      data: {
        id: result?.id,
        in_collection,
        action_performed: action,
        message,
      },
    };
  } catch (error) {
    console.error('Collection update error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Internal server error',
    };
  }
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
    // Debug: Log the incoming params
    console.log('toggleCollection called with params:', params);

    // Validate input using Zod schema
    const validation = validateCollectionAction(params);
    if (!validation.success) {
      console.log('Validation failed:', validation.error);
      return {
        success: false,
        in_collection: false,
        message: validation.error!,
        error: validation.error,
      };
    }

    const { fragrance_id: inputFragranceId, action } = validation.data!;

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

    // Verify fragrance exists - handle both UUID and slug formats
    const { data: fragrance, error: fragranceError } = await supabase
      .from('fragrances')
      .select('id, name')
      .or(`id.eq.${inputFragranceId},slug.eq.${inputFragranceId}`)
      .single();

    if (fragranceError || !fragrance) {
      return {
        success: false,
        in_collection: false,
        message: 'Fragrance not found',
        error: 'Fragrance not found',
      };
    }

    // Use the actual fragrance ID from database (UUID format)
    const actualFragranceId = fragrance.id;

    let in_collection = false;

    if (action === 'add') {
      // Check if already in collection
      const { data: existing } = await supabase
        .from('user_collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('fragrance_id', actualFragranceId)
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
          fragrance_id: actualFragranceId,
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
        .eq('fragrance_id', actualFragranceId)
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

    // First, verify fragrance exists and get actual ID
    const { data: fragrance, error: fragranceError } = await supabase
      .from('fragrances')
      .select('id, name')
      .or(`id.eq.${fragrance_id},slug.eq.${fragrance_id}`)
      .single();

    if (fragranceError || !fragrance) {
      return {
        success: false,
        in_collection: false,
        error: 'Fragrance not found',
      };
    }

    // Use the actual fragrance ID from database (UUID format)
    const actualFragranceId = fragrance.id;

    // Check if fragrance is in collection
    const { data: existing, error } = await supabase
      .from('user_collections')
      .select('id')
      .eq('user_id', user.id)
      .eq('fragrance_id', actualFragranceId)
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
