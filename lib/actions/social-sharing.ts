'use server';

import { unstable_rethrow } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { socialSharingService } from '@/lib/services/social-sharing';
import type { ShareType, SharePlatform } from '@/lib/types/collection-analytics';
import type { ShareableData, ShareResult } from '@/lib/services/social-sharing';

/**
 * Social Sharing Server Actions - Task 3.1 (Phase 1C)
 * 
 * Server Actions for collection and quiz results sharing with viral mechanics.
 * Handles share creation, tracking, and reward distribution.
 */

/**
 * Create a shareable link for collection or quiz results
 */
export async function shareCollection(params: {
  collection_data: ShareableData;
  share_type: ShareType;
  platform: SharePlatform;
}): Promise<ShareResult> {
  try {
    const supabase = await createServerSupabase();
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required for sharing'
      };
    }

    // Validate share permissions
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('privacy_settings')
      .eq('id', user.id)
      .single();

    if (userProfile?.privacy_settings?.disable_collection_sharing) {
      return {
        success: false,
        error: 'Collection sharing is disabled in your privacy settings'
      };
    }

    // Create share record
    const shareResult = await socialSharingService.createShare(
      user.id,
      params.share_type,
      params.platform,
      params.collection_data
    );

    if (shareResult.success) {
      // Track share creation analytics
      await trackSharingEvent(user.id, 'share_created', {
        share_type: params.share_type,
        platform: params.platform,
        share_token: shareResult.share_token
      });

      // Grant sharing reward points
      await grantSharingReward(user.id, params.share_type);
    }

    return shareResult;

  } catch (error) {
    console.error('Share collection action error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to create shareable link'
    };
  }
}

/**
 * Track share interaction from external source
 */
export async function trackShareInteraction(
  shareToken: string,
  interactionType: 'view' | 'click' | 'conversion',
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    await socialSharingService.trackShareInteraction(
      shareToken,
      interactionType,
      metadata
    );

    return { success: true };

  } catch (error) {
    console.warn('Track share interaction error:', error);
    return {
      success: false,
      error: 'Failed to track interaction'
    };
  }
}

/**
 * Get public shareable content by token
 */
export async function getPublicShare(shareToken: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const result = await socialSharingService.getShareableContent(shareToken);
    return result;

  } catch (error) {
    console.error('Get public share error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to load shared content'
    };
  }
}

/**
 * Process referral when someone signs up from a share
 */
export async function processShareReferral(
  shareToken: string
): Promise<{ success: boolean; reward_granted?: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();
    
    // Check user authentication (the new user who signed up)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const result = await socialSharingService.processShareReferral(
      shareToken,
      user.id
    );

    return result;

  } catch (error) {
    console.error('Process share referral error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to process referral'
    };
  }
}

/**
 * Get user's sharing metrics and analytics
 */
export async function getUserSharingMetrics(): Promise<{
  success: boolean;
  metrics?: any;
  rewards?: any;
  error?: string;
}> {
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

    // Get sharing metrics
    const metrics = await socialSharingService.getShareMetrics(user.id);
    
    // Get viral rewards
    const rewards = await socialSharingService.processViralRewards(user.id);

    return {
      success: true,
      metrics,
      rewards
    };

  } catch (error) {
    console.error('Get sharing metrics error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to get sharing metrics'
    };
  }
}

/**
 * Get social proof data for display across the platform
 */
export async function getSocialProofData(): Promise<{
  success: boolean;
  data?: {
    total_shares_today: number;
    total_collections_shared: number;
    trending_personalities: string[];
    recent_shares: Array<{
      owner_name: string;
      share_type: string;
      created_at: string;
    }>;
  };
  error?: string;
}> {
  try {
    const socialProofData = await socialSharingService.getSocialProofData();
    
    // Get recent public shares for social proof
    const trendingShares = await socialSharingService.getTrendingShares(5);
    
    const recent_shares = trendingShares.map(share => ({
      owner_name: share.owner_name,
      share_type: share.share_type,
      created_at: share.created_at
    }));

    return {
      success: true,
      data: {
        ...socialProofData,
        recent_shares
      }
    };

  } catch (error) {
    console.error('Get social proof data error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to get social proof data'
    };
  }
}

/**
 * Generate sharing image for specific platform
 */
export async function generateSharingImage(
  shareData: ShareableData,
  platform: SharePlatform,
  theme = 'default'
): Promise<{
  success: boolean;
  image_url?: string;
  error?: string;
}> {
  try {
    const result = await socialSharingService.generateShareImage(
      shareData,
      platform,
      theme
    );

    return result;

  } catch (error) {
    console.error('Generate sharing image error:', error);
    unstable_rethrow(error);

    return {
      success: false,
      error: 'Failed to generate sharing image'
    };
  }
}

// Helper functions

/**
 * Track sharing-related analytics events
 */
async function trackSharingEvent(
  userId: string,
  eventType: string,
  eventData: Record<string, any>
): Promise<void> {
  try {
    const supabase = await createServerSupabase();

    await supabase
      .from('collection_analytics_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.warn('Sharing event tracking error:', error);
    // Don't throw - analytics should never break the main flow
  }
}

/**
 * Grant rewards for sharing activities
 */
async function grantSharingReward(
  userId: string,
  shareType: ShareType
): Promise<void> {
  try {
    const supabase = await createServerSupabase();

    // Determine reward amount based on share type
    const rewardAmount = shareType === 'collection' ? 100 : 75; // Collections worth more

    // Track reward granting
    await supabase
      .from('collection_analytics_events')
      .insert({
        user_id: userId,
        event_type: 'sharing_reward_granted',
        event_data: {
          share_type: shareType,
          reward_type: 'engagement_points',
          reward_amount: rewardAmount,
          reward_description: `Sharing reward for ${shareType} share`
        },
        created_at: new Date().toISOString()
      });

    // Update user engagement score
    await supabase.rpc('update_user_engagement_metrics', {
      target_user_id: userId
    });

  } catch (error) {
    console.warn('Grant sharing reward error:', error);
  }
}