'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

// Types for Quiz Collection operations
export interface CollectionSaveData {
  quiz_session_token: string;
  fragrance_ids: string[];
  collection_name?: string;
}

export interface CollectionSaveResult {
  success: boolean;
  error?: string;
  data?: {
    collection_items: Array<{
      id: string;
      fragrance_id: string;
      fragrance_name: string;
    }>;
    collection_size: number;
    quiz_session_token: string;
    analytics_tracked: boolean;
  };
}

export interface QuizToCollectionAnalytics {
  quiz_session_token: string;
  user_id?: string;
  guest_session_id?: string;
  fragrance_count: number;
  conversion_source: 'quiz_completion' | 'collection_preview';
  save_timestamp: string;
}

/**
 * Server Action: Save Quiz Recommendations as Collection - Task 1.2
 *
 * Specialized Server Action for converting quiz results directly into user collections.
 * Handles both authenticated and guest users with proper quiz session attribution.
 *
 * Features:
 * - Quiz session attribution for analytics
 * - Support for both auth and guest users
 * - Bulk collection creation from recommendations
 * - Analytics event tracking
 * - Proper validation and error handling
 */
export async function saveQuizRecommendations(
  data: CollectionSaveData
): Promise<CollectionSaveResult> {
  try {
    const {
      quiz_session_token,
      fragrance_ids,
      collection_name = 'My Quiz Matches',
    } = data;

    // Validate inputs
    if (!quiz_session_token) {
      return {
        success: false,
        error: 'Quiz session token is required',
      };
    }

    if (!fragrance_ids || fragrance_ids.length === 0) {
      return {
        success: false,
        error: 'At least one fragrance ID is required',
      };
    }

    if (fragrance_ids.length > 10) {
      return {
        success: false,
        error: 'Cannot save more than 10 fragrances at once',
      };
    }

    const supabase = await createServerSupabase();

    // Check user authentication (may be guest or authenticated)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // For guest users, we'll need to use the quiz_session_token as identifier
    let user_id: string | null = null;
    let guest_session_id: string | null = null;

    if (user) {
      user_id = user.id;
    } else {
      // Use quiz session token as guest identifier
      guest_session_id = quiz_session_token;
    }

    // Validate that fragrances exist and get their details
    const { data: fragrances, error: fragranceError } = await supabase
      .from('fragrances')
      .select(
        'id, name, brand_id, sample_price_usd, fragrance_brands!inner(name)'
      )
      .in('id', fragrance_ids);

    if (fragranceError) {
      console.error('Error fetching fragrances:', fragranceError);
      return {
        success: false,
        error: 'Failed to validate fragrance recommendations',
      };
    }

    if (!fragrances || fragrances.length === 0) {
      return {
        success: false,
        error: 'No valid fragrances found for the provided IDs',
      };
    }

    // Check for existing collection items to avoid duplicates
    let existingQuery = supabase
      .from('user_collections')
      .select('fragrance_id')
      .in('fragrance_id', fragrance_ids)
      .eq('collection_type', 'saved');

    if (user_id) {
      existingQuery = existingQuery.eq('user_id', user_id);
    } else {
      existingQuery = existingQuery.eq('guest_session_id', guest_session_id);
    }

    const { data: existing } = await existingQuery;
    const existingIds = new Set(existing?.map(item => item.fragrance_id) || []);

    // Filter out already saved fragrances
    const newFragrances = fragrances.filter(f => !existingIds.has(f.id));

    if (newFragrances.length === 0) {
      return {
        success: true,
        data: {
          collection_items: fragrances.map(f => ({
            id: `existing-${f.id}`,
            fragrance_id: f.id,
            fragrance_name: `${f.name} by ${Array.isArray(f.fragrance_brands) ? f.fragrance_brands[0]?.name : f.fragrance_brands?.name}`,
          })),
          collection_size: fragrances.length,
          quiz_session_token,
          analytics_tracked: false,
        },
      };
    }

    // Prepare collection items for batch insert
    const collectionItems = newFragrances.map(fragrance => ({
      user_id,
      guest_session_id,
      fragrance_id: fragrance.id,
      collection_type: 'saved' as const,
      quiz_session_token, // Attribution to quiz session
      notes: `Recommended by AI quiz - ${collection_name}`,
      created_at: new Date().toISOString(),
    }));

    // Insert collection items in batch
    const { data: insertedItems, error: insertError } = await supabase
      .from('user_collections')
      .insert(collectionItems).select(`
        id,
        fragrance_id,
        fragrances!inner(
          id,
          name,
          fragrance_brands!inner(name)
        )
      `);

    if (insertError) {
      console.error('Error inserting collection items:', insertError);
      return {
        success: false,
        error: 'Failed to save recommendations to collection',
      };
    }

    // Track analytics event
    let analyticsTracked = false;
    try {
      const analyticsData: QuizToCollectionAnalytics = {
        quiz_session_token,
        user_id: user_id || undefined,
        guest_session_id: guest_session_id || undefined,
        fragrance_count: newFragrances.length,
        conversion_source: 'collection_preview',
        save_timestamp: new Date().toISOString(),
      };

      await trackQuizToCollectionConversion(analyticsData);
      analyticsTracked = true;
    } catch (analyticsError) {
      console.warn('Analytics tracking failed:', analyticsError);
      // Don't fail the entire operation for analytics issues
    }

    // Prepare response data
    const responseItems = (insertedItems || []).map(item => ({
      id: item.id,
      fragrance_id: item.fragrance_id,
      fragrance_name: `${item.fragrances.name} by ${Array.isArray(item.fragrances.fragrance_brands) ? item.fragrances.fragrance_brands[0]?.name : item.fragrances.fragrance_brands?.name}`,
    }));

    // Revalidate relevant paths
    revalidatePath('/collection');
    revalidatePath('/quiz');
    revalidatePath('/recommendations');
    if (user_id) {
      revalidatePath('/dashboard');
    }

    return {
      success: true,
      data: {
        collection_items: responseItems,
        collection_size: responseItems.length,
        quiz_session_token,
        analytics_tracked: analyticsTracked,
      },
    };
  } catch (error) {
    console.error('Quiz collection save error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Internal server error while saving collection',
    };
  }
}

/**
 * Analytics Tracking for Quiz-to-Collection Conversions
 *
 * Tracks successful conversions from quiz completion to collection building
 * for business intelligence and conversion optimization.
 */
async function trackQuizToCollectionConversion(
  data: QuizToCollectionAnalytics
): Promise<void> {
  try {
    const supabase = await createServerSupabase();

    // Check if analytics table exists, if not we'll create it later via migration
    const analyticsEvent = {
      user_id: data.user_id || null,
      event_type: 'quiz_to_collection_conversion',
      event_data: {
        quiz_session_token: data.quiz_session_token,
        guest_session_id: data.guest_session_id,
        fragrance_count: data.fragrance_count,
        conversion_source: data.conversion_source,
        save_timestamp: data.save_timestamp,
        user_type: data.user_id ? 'authenticated' : 'guest',
      },
      quiz_session_token: data.quiz_session_token,
      created_at: new Date().toISOString(),
    };

    // Try to insert analytics event - fail silently if table doesn't exist yet
    try {
      const { error } = await supabase
        .from('collection_analytics_events')
        .insert(analyticsEvent);

      if (error) {
        console.warn('Analytics tracking error:', error);
      }
    } catch (analyticsError) {
      console.warn('Analytics table not available yet:', analyticsError);
    }
  } catch (error) {
    console.warn('Failed to track quiz-to-collection conversion:', error);
    // Don't throw - analytics should never break the main flow
  }
}

/**
 * Server Action: Get Quiz Session Collection Status
 *
 * Check if recommendations from a quiz session have already been saved
 * to avoid duplicate saves and provide better UX.
 */
export async function getQuizSessionCollectionStatus(
  quiz_session_token: string
): Promise<{
  success: boolean;
  has_saved_collection: boolean;
  saved_count: number;
  error?: string;
}> {
  try {
    if (!quiz_session_token) {
      return {
        success: false,
        has_saved_collection: false,
        saved_count: 0,
        error: 'Quiz session token is required',
      };
    }

    const supabase = await createServerSupabase();

    // Check user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase
      .from('user_collections')
      .select('id', { count: 'exact' })
      .eq('quiz_session_token', quiz_session_token);

    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.eq('guest_session_id', quiz_session_token);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Error checking quiz session collection status:', error);
      return {
        success: false,
        has_saved_collection: false,
        saved_count: 0,
        error: 'Failed to check collection status',
      };
    }

    return {
      success: true,
      has_saved_collection: (count || 0) > 0,
      saved_count: count || 0,
    };
  } catch (error) {
    console.error('Quiz session collection status error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      has_saved_collection: false,
      saved_count: 0,
      error: 'Internal server error',
    };
  }
}

/**
 * Server Action: Enhanced Collection Toggle with Quiz Attribution
 *
 * Extends the basic collection toggle to support quiz session attribution
 * for better analytics and user journey tracking.
 */
export async function toggleCollectionWithQuizAttribution(
  fragrance_id: string,
  action: 'add' | 'remove',
  quiz_session_token?: string
): Promise<{
  success: boolean;
  in_collection: boolean;
  message: string;
  error?: string;
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
        in_collection: false,
        message: 'Authentication required',
        error: 'Authentication required',
      };
    }

    // Verify fragrance exists
    const { data: fragrance, error: fragranceError } = await supabase
      .from('fragrances')
      .select('id, name, fragrance_brands!inner(name)')
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
    let message = '';

    if (action === 'add') {
      // Check if already in collection
      const { data: existing } = await supabase
        .from('user_collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('fragrance_id', fragrance_id)
        .eq('collection_type', 'saved')
        .single();

      if (existing) {
        return {
          success: true,
          in_collection: true,
          message: `"${fragrance.name}" is already in your collection`,
        };
      }

      // Add to collection with quiz attribution
      const insertData: any = {
        user_id: user.id,
        fragrance_id: fragrance_id,
        collection_type: 'saved',
        created_at: new Date().toISOString(),
      };

      if (quiz_session_token) {
        insertData.quiz_session_token = quiz_session_token;
        insertData.notes = 'Added from quiz recommendations';
      }

      const { error } = await supabase
        .from('user_collections')
        .insert(insertData);

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
      message = `Added "${fragrance.name}" to your collection`;
    } else if (action === 'remove') {
      // Remove from collection
      const { error } = await supabase
        .from('user_collections')
        .delete()
        .eq('user_id', user.id)
        .eq('fragrance_id', fragrance_id)
        .eq('collection_type', 'saved');

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
      message = `Removed "${fragrance.name}" from your collection`;
    }

    // Revalidate relevant paths
    revalidatePath('/collection');
    revalidatePath('/recommendations');

    return {
      success: true,
      in_collection,
      message,
    };
  } catch (error) {
    console.error('Enhanced collection toggle error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      in_collection: false,
      message: 'Internal server error',
      error: 'Internal server error',
    };
  }
}
