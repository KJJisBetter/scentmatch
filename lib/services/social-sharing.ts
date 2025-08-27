import { createServerSupabase } from '@/lib/supabase/server';
import type { ShareType, SharePlatform } from '@/lib/types/collection-analytics';

// Types for social sharing
export interface ShareableData {
  collection_data?: {
    user_name: string;
    collection_summary: {
      total_items: number;
      top_fragrances: Array<{
        id: string;
        name: string;
        brand: string;
      }>;
      dominant_families: string[];
      personality_traits?: string[];
    };
    share_card_theme?: string;
  };
  quiz_session_token?: string;
  quiz_theme?: string;
  recommendations?: any[];
  personality_summary?: {
    traits: string[];
    families: string[];
    confidence: number;
  };
}

export interface ShareResult {
  success: boolean;
  share_id?: string;
  share_url?: string;
  share_token?: string;
  error?: string;
}

export interface ShareMetrics {
  view_count: number;
  click_count: number;
  conversion_count: number;
  platform_breakdown: Record<SharePlatform, number>;
  viral_coefficient: number;
}

/**
 * Social Sharing Service - Task 3.1 (Phase 1C)
 * 
 * Handles creation, tracking, and analytics for collection and quiz result sharing.
 * Provides viral mechanics and social proof features for growth.
 * 
 * Features:
 * - Multi-platform sharing with tracking
 * - Beautiful share URL generation
 * - View/click/conversion analytics
 * - Viral coefficient calculation
 * - Privacy-compliant sharing controls
 * - Share expiration and management
 */
export class SocialSharingService {
  private supabase: ReturnType<typeof createServerSupabase> | null = null;

  constructor() {
    // Lazy initialization
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = createServerSupabase();
    }
    return await this.supabase;
  }

  /**
   * Create a shareable link for collection or quiz results
   */
  async createShare(
    userId: string,
    shareType: ShareType,
    platform: SharePlatform,
    shareData: ShareableData
  ): Promise<ShareResult> {
    const supabase = await this.getSupabase();

    try {
      // Generate unique share token
      const shareToken = this.generateShareToken();
      
      // Determine expiration (30 days for collections, 7 days for quiz results)
      const expirationHours = shareType === 'collection' ? 24 * 30 : 24 * 7;
      const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

      // Create share record
      const { data: shareRecord, error } = await supabase
        .from('collection_shares')
        .insert({
          collection_owner_id: userId,
          shared_by_user_id: userId,
          share_type: shareType,
          share_platform: platform,
          share_data: shareData,
          share_token: shareToken,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Share creation error:', error);
        return {
          success: false,
          error: 'Failed to create share link'
        };
      }

      // Generate share URL
      const shareUrl = this.generateShareUrl(shareType, shareToken);

      // Update share record with URL
      await supabase
        .from('collection_shares')
        .update({ share_url: shareUrl })
        .eq('id', shareRecord.id);

      return {
        success: true,
        share_id: shareRecord.id,
        share_url: shareUrl,
        share_token: shareToken
      };

    } catch (error) {
      console.error('Create share error:', error);
      return {
        success: false,
        error: 'Failed to create shareable link'
      };
    }
  }

  /**
   * Track share interaction (view, click, conversion)
   */
  async trackShareInteraction(
    shareToken: string,
    interactionType: 'view' | 'click' | 'conversion',
    metadata?: Record<string, any>
  ): Promise<void> {
    const supabase = await this.getSupabase();

    try {
      // Get share record
      const { data: share, error: shareError } = await supabase
        .from('collection_shares')
        .select('id, collection_owner_id')
        .eq('share_token', shareToken)
        .single();

      if (shareError || !share) {
        console.warn('Share not found for tracking:', shareToken);
        return;
      }

      // Update interaction counts
      const updateColumn = `${interactionType}_count`;
      const { error: updateError } = await supabase
        .from('collection_shares')
        .update({
          [updateColumn]: (supabase as any).raw(`${updateColumn} + 1`)
        })
        .eq('share_token', shareToken);

      if (updateError) {
        console.warn('Share tracking error:', updateError);
      }

      // Track in analytics events
      await supabase
        .from('collection_analytics_events')
        .insert({
          user_id: share.collection_owner_id,
          event_type: `collection_share_${interactionType}`,
          event_data: {
            share_token: shareToken,
            interaction_type: interactionType,
            metadata: metadata || {}
          },
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.warn('Share interaction tracking error:', error);
    }
  }

  /**
   * Get share metrics for analytics
   */
  async getShareMetrics(userId: string): Promise<ShareMetrics> {
    const supabase = await this.getSupabase();

    try {
      const { data: shares, error } = await supabase
        .from('collection_shares')
        .select('view_count, click_count, conversion_count, share_platform')
        .eq('collection_owner_id', userId);

      if (error || !shares) {
        return {
          view_count: 0,
          click_count: 0,
          conversion_count: 0,
          platform_breakdown: {} as Record<SharePlatform, number>,
          viral_coefficient: 0
        };
      }

      // Calculate totals
      const view_count = shares.reduce((sum, share) => sum + (share.view_count || 0), 0);
      const click_count = shares.reduce((sum, share) => sum + (share.click_count || 0), 0);
      const conversion_count = shares.reduce((sum, share) => sum + (share.conversion_count || 0), 0);

      // Calculate platform breakdown
      const platform_breakdown = shares.reduce((breakdown, share) => {
        const platform = share.share_platform as SharePlatform;
        breakdown[platform] = (breakdown[platform] || 0) + 1;
        return breakdown;
      }, {} as Record<SharePlatform, number>);

      // Calculate viral coefficient (new users generated per existing user)
      const viral_coefficient = shares.length > 0 ? conversion_count / shares.length : 0;

      return {
        view_count,
        click_count,
        conversion_count,
        platform_breakdown,
        viral_coefficient
      };

    } catch (error) {
      console.error('Share metrics error:', error);
      return {
        view_count: 0,
        click_count: 0,
        conversion_count: 0,
        platform_breakdown: {} as Record<SharePlatform, number>,
        viral_coefficient: 0
      };
    }
  }

  /**
   * Get shareable content by token (for public viewing)
   */
  async getShareableContent(shareToken: string): Promise<{
    success: boolean;
    data?: {
      share_type: ShareType;
      share_data: ShareableData;
      owner_name: string;
      created_at: string;
      expired: boolean;
    };
    error?: string;
  }> {
    const supabase = await this.getSupabase();

    try {
      const { data: share, error } = await supabase
        .from('collection_shares')
        .select(`
          share_type,
          share_data,
          created_at,
          expires_at,
          collection_owner:collection_owner_id(
            user_metadata
          )
        `)
        .eq('share_token', shareToken)
        .single();

      if (error || !share) {
        return {
          success: false,
          error: 'Share not found or expired'
        };
      }

      // Check if expired
      const expired = share.expires_at ? new Date() > new Date(share.expires_at) : false;

      if (expired) {
        return {
          success: false,
          error: 'This share has expired'
        };
      }

      // Track view
      await this.trackShareInteraction(shareToken, 'view');

      return {
        success: true,
        data: {
          share_type: share.share_type,
          share_data: share.share_data,
          owner_name: (share.collection_owner as any)?.user_metadata?.first_name || 'User',
          created_at: share.created_at,
          expired
        }
      };

    } catch (error) {
      console.error('Get shareable content error:', error);
      return {
        success: false,
        error: 'Failed to load shared content'
      };
    }
  }

  /**
   * Process share referral (when someone signs up from a share)
   */
  async processShareReferral(
    shareToken: string,
    newUserId: string
  ): Promise<{ success: boolean; reward_granted?: boolean }> {
    const supabase = await this.getSupabase();

    try {
      // Get share record
      const { data: share, error } = await supabase
        .from('collection_shares')
        .select('id, collection_owner_id')
        .eq('share_token', shareToken)
        .single();

      if (error || !share) {
        return { success: false };
      }

      // Track conversion
      await this.trackShareInteraction(shareToken, 'conversion', {
        new_user_id: newUserId,
        referral_completed: true
      });

      // Grant reward to original user (engagement points, etc.)
      await this.grantReferralReward(share.collection_owner_id, newUserId);

      return {
        success: true,
        reward_granted: true
      };

    } catch (error) {
      console.error('Process share referral error:', error);
      return { success: false };
    }
  }

  /**
   * Clean up expired shares
   */
  async cleanupExpiredShares(): Promise<number> {
    const supabase = await this.getSupabase();

    try {
      const { data, error } = await supabase
        .from('collection_shares')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        console.warn('Cleanup expired shares error:', error);
        return 0;
      }

      return data?.length || 0;

    } catch (error) {
      console.warn('Failed to cleanup expired shares:', error);
      return 0;
    }
  }

  // Private helper methods

  private generateShareToken(): string {
    // Generate URL-safe token
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `sm_${token}`;
  }

  private generateShareUrl(shareType: ShareType, shareToken: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://scentmatch.com';
    
    switch (shareType) {
      case 'collection':
        return `${baseUrl}/share/collection/${shareToken}`;
      case 'quiz_results':
        return `${baseUrl}/share/quiz/${shareToken}`;
      case 'single_fragrance':
        return `${baseUrl}/share/fragrance/${shareToken}`;
      default:
        return `${baseUrl}/share/${shareToken}`;
    }
  }

  private async grantReferralReward(
    referrerUserId: string,
    newUserId: string
  ): Promise<void> {
    const supabase = await this.getSupabase();

    try {
      // Grant engagement points to referrer
      await supabase.rpc('update_user_engagement_metrics', {
        target_user_id: referrerUserId
      });

      // Track referral reward
      await supabase
        .from('collection_analytics_events')
        .insert({
          user_id: referrerUserId,
          event_type: 'referral_reward_granted',
          event_data: {
            new_user_id: newUserId,
            reward_type: 'engagement_points',
            reward_amount: 200,
            referral_source: 'collection_share'
          },
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.warn('Referral reward error:', error);
    }
  }

  /**
   * Generate social media optimized images (would integrate with image generation service)
   */
  async generateShareImage(
    shareData: ShareableData,
    platform: SharePlatform,
    theme = 'default'
  ): Promise<{ success: boolean; image_url?: string; error?: string }> {
    try {
      // This would integrate with an image generation service like:
      // - Canvas API for client-side generation
      // - Puppeteer for server-side generation
      // - Third-party service like Bannerbear or Placid
      
      const imageConfig = {
        width: this.getImageDimensions(platform).width,
        height: this.getImageDimensions(platform).height,
        background: this.getThemeBackground(theme),
        data: shareData
      };

      // Placeholder implementation
      const mockImageUrl = `https://api.placeholder.com/${imageConfig.width}x${imageConfig.height}/8B5CF6/FFFFFF?text=ScentMatch+Collection`;

      return {
        success: true,
        image_url: mockImageUrl
      };

    } catch (error) {
      console.error('Share image generation error:', error);
      return {
        success: false,
        error: 'Failed to generate share image'
      };
    }
  }

  /**
   * Get platform-specific image dimensions
   */
  private getImageDimensions(platform: SharePlatform): { width: number; height: number } {
    switch (platform) {
      case 'twitter':
        return { width: 1200, height: 675 }; // 16:9 for Twitter cards
      case 'instagram':
        return { width: 1080, height: 1080 }; // Square for Instagram
      case 'facebook':
        return { width: 1200, height: 630 }; // Facebook recommended
      default:
        return { width: 1200, height: 630 }; // Default social media size
    }
  }

  /**
   * Get theme-specific background styling
   */
  private getThemeBackground(theme: string): string {
    switch (theme) {
      case 'personality':
        return 'linear-gradient(135deg, #8B5CF6, #EC4899, #EF4444)';
      case 'recommendations':
        return 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899)';
      case 'insights':
        return 'linear-gradient(135deg, #10B981, #3B82F6, #8B5CF6)';
      default:
        return 'linear-gradient(135deg, #8B5CF6, #EC4899)';
    }
  }

  /**
   * Get trending shares for social proof
   */
  async getTrendingShares(limit = 10): Promise<Array<{
    share_token: string;
    share_type: ShareType;
    owner_name: string;
    view_count: number;
    created_at: string;
    preview_data: any;
  }>> {
    const supabase = await this.getSupabase();

    try {
      const { data: trending, error } = await supabase
        .from('collection_shares')
        .select(`
          share_token,
          share_type,
          share_data,
          view_count,
          created_at,
          collection_owner:collection_owner_id(
            user_metadata
          )
        `)
        .gt('view_count', 5) // Minimum views to be considered trending
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last week
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error || !trending) {
        return [];
      }

      return trending.map(item => ({
        share_token: item.share_token,
        share_type: item.share_type,
        owner_name: (item.collection_owner as any)?.user_metadata?.first_name || 'User',
        view_count: item.view_count,
        created_at: item.created_at,
        preview_data: this.extractPreviewData(item.share_data)
      }));

    } catch (error) {
      console.warn('Get trending shares error:', error);
      return [];
    }
  }

  /**
   * Extract preview data for trending shares
   */
  private extractPreviewData(shareData: ShareableData): any {
    if (shareData.collection_data) {
      return {
        type: 'collection',
        user_name: shareData.collection_data.user_name,
        total_items: shareData.collection_data.collection_summary.total_items,
        families: shareData.collection_data.collection_summary.dominant_families?.slice(0, 2)
      };
    }

    if (shareData.personality_summary) {
      return {
        type: 'quiz_results',
        traits: shareData.personality_summary.traits?.slice(0, 2),
        confidence: shareData.personality_summary.confidence
      };
    }

    return { type: 'unknown' };
  }

  /**
   * Generate viral mechanics rewards
   */
  async processViralRewards(userId: string): Promise<{
    rewards_earned: Array<{
      type: string;
      amount: number;
      description: string;
    }>;
    next_milestone?: {
      type: string;
      progress: number;
      target: number;
    };
  }> {
    const supabase = await this.getSupabase();

    try {
      // Get user's sharing activity
      const metrics = await this.getShareMetrics(userId);
      const rewards = [];

      // Sharing milestone rewards
      if (metrics.view_count >= 100 && metrics.view_count < 200) {
        rewards.push({
          type: 'engagement_points',
          amount: 500,
          description: 'Social Influencer - 100+ share views!'
        });
      }

      if (metrics.conversion_count >= 5) {
        rewards.push({
          type: 'premium_features',
          amount: 1,
          description: 'Community Builder - 5+ referrals unlocked premium features!'
        });
      }

      // Viral coefficient rewards
      if (metrics.viral_coefficient >= 0.1) {
        rewards.push({
          type: 'engagement_points',
          amount: 300,
          description: 'Viral Catalyst - High engagement rate!'
        });
      }

      // Next milestone calculation
      let next_milestone;
      if (metrics.view_count < 100) {
        next_milestone = {
          type: 'Social Influencer',
          progress: metrics.view_count,
          target: 100
        };
      } else if (metrics.conversion_count < 5) {
        next_milestone = {
          type: 'Community Builder',
          progress: metrics.conversion_count,
          target: 5
        };
      }

      return {
        rewards_earned: rewards,
        next_milestone
      };

    } catch (error) {
      console.error('Process viral rewards error:', error);
      return { rewards_earned: [] };
    }
  }

  /**
   * Get social proof data for display
   */
  async getSocialProofData(): Promise<{
    total_shares_today: number;
    total_collections_shared: number;
    trending_personalities: string[];
    viral_collections: Array<{
      owner_name: string;
      collection_size: number;
      view_count: number;
    }>;
  }> {
    const supabase = await this.getSupabase();

    try {
      // Get today's shares
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: todayShares } = await supabase
        .from('collection_shares')
        .select('id')
        .gte('created_at', todayStart.toISOString());

      // Get total collections shared
      const { data: totalShares } = await supabase
        .from('collection_shares')
        .select('id')
        .eq('share_type', 'collection');

      return {
        total_shares_today: todayShares?.length || 0,
        total_collections_shared: totalShares?.length || 0,
        trending_personalities: ['sophisticated', 'adventurous', 'romantic'], // Would calculate from data
        viral_collections: [] // Would implement with actual viral data
      };

    } catch (error) {
      console.warn('Social proof data error:', error);
      return {
        total_shares_today: 0,
        total_collections_shared: 0,
        trending_personalities: [],
        viral_collections: []
      };
    }
  }
}

// Export singleton instance
export const socialSharingService = new SocialSharingService();