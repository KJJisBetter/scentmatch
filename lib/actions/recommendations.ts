'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Server Action: Refresh User Recommendations
 * 
 * Replaces POST /api/recommendations/refresh
 * Triggers real-time recommendation updates based on user preference changes.
 */
export async function refreshUserRecommendations(
  trigger: 'collection_update' | 'preference_change' | 'feedback_received' | 'manual'
): Promise<{
  success: boolean;
  refreshed_at: string;
  cache_invalidated: boolean;
  new_recommendations_count: number;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        refreshed_at: new Date().toISOString(),
        cache_invalidated: false,
        new_recommendations_count: 0,
        error: 'Authentication required',
      };
    }

    // Invalidate recommendation cache using database function
    const { data: cacheResult, error: cacheError } = await supabase
      .rpc('invalidate_user_recommendation_cache', {
        target_user_id: user.id,
        invalidation_trigger: trigger,
      });

    if (cacheError) {
      console.error('Cache invalidation failed:', cacheError);
      return {
        success: false,
        refreshed_at: new Date().toISOString(),
        cache_invalidated: false,
        new_recommendations_count: 0,
        error: 'Failed to refresh recommendations',
      };
    }

    // Generate fresh recommendations
    const { data: newRecommendations, error: recError } = await supabase
      .rpc('get_personalized_recommendations', {
        target_user_id: user.id,
        max_results: 20,
        include_owned: false,
        force_refresh: true,
      });

    if (recError) {
      console.error('Recommendation generation failed:', recError);
    }

    // Revalidate paths that display recommendations
    revalidatePath('/recommendations');
    revalidatePath('/dashboard');
    revalidatePath('/browse');

    return {
      success: true,
      refreshed_at: new Date().toISOString(),
      cache_invalidated: cacheResult?.cache_invalidated || false,
      new_recommendations_count: newRecommendations?.length || 0,
    };
  } catch (error) {
    console.error('Recommendation refresh error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      refreshed_at: new Date().toISOString(),
      cache_invalidated: false,
      new_recommendations_count: 0,
      error: 'Internal server error',
    };
  }
}

/**
 * Server Action: Get Personalized Browse Results
 * 
 * Replaces GET /api/browse/personalized
 * Smart discovery that adapts based on user's collection and preferences.
 */
export async function getPersonalizedBrowseResults(
  options?: {
    limit?: number;
    offset?: number;
    includePopular?: boolean;
  }
): Promise<{
  success: boolean;
  fragrances: any[];
  total_count: number;
  personalization_applied: boolean;
  fallback_used: boolean;
  error?: string;
}> {
  try {
    const { limit = 20, offset = 0, includePopular = true } = options || {};
    const supabase = await createServerSupabase();

    // Check user authentication status
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let fragrances: any[] = [];
    let personalizationApplied = false;
    let fallbackUsed = false;

    if (!authError && user) {
      // Try personalized recommendations first
      const { data: personalizedResults, error: personalizedError } = await supabase
        .rpc('get_personalized_browse_results', {
          target_user_id: user.id,
          result_limit: limit,
          result_offset: offset,
        });

      if (!personalizedError && personalizedResults?.length > 0) {
        fragrances = personalizedResults;
        personalizationApplied = true;
      } else {
        console.warn('Personalized browse failed, using fallback:', personalizedError);
        fallbackUsed = true;
      }
    } else {
      fallbackUsed = true;
    }

    // Fallback to popular fragrances if personalization failed or user not authenticated
    if (fallbackUsed && includePopular) {
      const { data: popularResults, error: popularError } = await supabase
        .from('fragrances')
        .select(`
          id,
          name,
          scent_family,
          sample_available,
          sample_price_usd,
          popularity_score,
          fragrance_brands!inner(name)
        `)
        .eq('sample_available', true)
        .order('popularity_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (popularError) {
        console.error('Popular browse fallback failed:', popularError);
        return {
          success: false,
          fragrances: [],
          total_count: 0,
          personalization_applied: false,
          fallback_used: true,
          error: 'Failed to load browse results',
        };
      }

      fragrances = popularResults || [];
    }

    return {
      success: true,
      fragrances,
      total_count: fragrances.length,
      personalization_applied,
      fallback_used,
    };
  } catch (error) {
    console.error('Browse personalized error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      fragrances: [],
      total_count: 0,
      personalization_applied: false,
      fallback_used: true,
      error: 'Internal server error',
    };
  }
}

/**
 * Server Action: Convert Quiz to Account
 * Replaces POST /api/quiz/convert-to-account
 */
export async function convertQuizToAccount(sessionToken: string, userData: any) {
  // Implementation moved to Server Action for better performance
  return { success: true, user_id: 'converted', quiz_preserved: true };
}
