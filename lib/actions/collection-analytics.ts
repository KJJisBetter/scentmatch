'use server';

import { unstable_rethrow } from 'next/navigation';
import { collectionAnalytics } from '@/lib/services/collection-analytics';
import { analyticsCache, cacheUtils } from '@/lib/utils/analytics-cache';
import type { 
  CollectionStats, 
  CollectionInsights, 
  AnalyticsEvent,
  CollectionStatsResponse,
  CollectionInsightsResponse,
  EngagementLevelResponse
} from '@/lib/types/collection-analytics';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Server Actions for Collection Analytics - Task 1.4
 * 
 * Provides server-side access to analytics services with proper authentication
 * and error handling. These actions bridge the analytics service with UI components.
 */

/**
 * Get real-time collection statistics for authenticated user
 */
export async function getCollectionStats(): Promise<CollectionStatsResponse> {
  try {
    const supabase = await createServerSupabase();
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const startTime = performance.now();
    const stats = await collectionAnalytics.getCollectionStats(user.id);
    const endTime = performance.now();

    return {
      success: true,
      data: stats,
      performance: {
        query_time_ms: Math.round(endTime - startTime),
        cache_hit: false, // Stats are always fresh
        data_size_kb: Math.round(JSON.stringify(stats).length / 1024),
        complexity_score: 2
      }
    };

  } catch (error) {
    console.error('Collection stats action error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to fetch collection statistics'
    };
  }
}

/**
 * Get comprehensive collection insights with caching
 */
export async function getCollectionInsights(forceRefresh = false): Promise<CollectionInsightsResponse> {
  try {
    const supabase = await createServerSupabase();
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Use analytics cache for performance
    const cacheKey = cacheUtils.createKey(user.id, 'comprehensive_insights');
    const cacheOptions = {
      force_refresh: forceRefresh,
      ttl: cacheUtils.calculateTTL('comprehensive_insights')
    };

    const result = await analyticsCache.getOrGenerate(
      cacheKey,
      () => collectionAnalytics.getCollectionInsights(user.id, forceRefresh),
      cacheOptions
    );

    return {
      success: true,
      data: result.data,
      cached: result.cached,
      generated_at: new Date().toISOString(),
      performance: result.performance
    };

  } catch (error) {
    console.error('Collection insights action error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to generate collection insights'
    };
  }
}

/**
 * Get user engagement level for personalization
 */
export async function getUserEngagementLevel(): Promise<EngagementLevelResponse> {
  try {
    const supabase = await createServerSupabase();
    
    // Check user authentication  
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const engagementLevel = await collectionAnalytics.getUserEngagementLevel(user.id);
    
    // Get engagement score if available
    const { data: engagementData } = await supabase
      .from('user_engagement_scores')
      .select('engagement_score_raw')
      .eq('user_id', user.id)
      .single();

    return {
      success: true,
      engagement_level: engagementLevel,
      engagement_score: engagementData?.engagement_score_raw || 0
    };

  } catch (error) {
    console.error('Engagement level action error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to get engagement level'
    };
  }
}

/**
 * Track analytics event (fire-and-forget)
 */
export async function trackAnalyticsEvent(
  eventType: string,
  eventData: Record<string, any>,
  quizSessionToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();
    
    // Get user if authenticated (optional for analytics)
    const { data: { user } } = await supabase.auth.getUser();

    const event: AnalyticsEvent = {
      user_id: user?.id,
      event_type: eventType,
      event_data: eventData,
      quiz_session_token: quizSessionToken
    };

    // Track event asynchronously - don't block
    collectionAnalytics.trackEvent(event).catch(error => {
      console.warn('Analytics event tracking failed:', error);
    });

    return { success: true };

  } catch (error) {
    console.warn('Analytics event action error:', error);
    // Don't throw for analytics - it should never break the main flow
    return {
      success: false,
      error: 'Analytics tracking failed'
    };
  }
}

/**
 * Update engagement metrics manually (useful after major actions)
 */
export async function updateUserEngagement(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    await collectionAnalytics.updateEngagementMetrics(user.id);

    return { success: true };

  } catch (error) {
    console.error('Update engagement action error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to update engagement metrics'
    };
  }
}

/**
 * Clear analytics cache for user (admin/debug function)
 */
export async function clearAnalyticsCache(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    await analyticsCache.clearUserCache(user.id);

    return { success: true };

  } catch (error) {
    console.error('Clear cache action error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to clear analytics cache'
    };
  }
}