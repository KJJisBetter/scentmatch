import { createServiceSupabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

// Type definitions for social validation system
export interface UserDemographics {
  user_id?: string;
  guest_session_id?: string;
  age_group: '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
  experience_level: 'beginner' | 'intermediate' | 'experienced' | 'expert';
  gender_preference?: 'men' | 'women' | 'unisex' | 'no_preference';
  social_influence_level: number; // 1-10
  uniqueness_preference: number; // 1-10
  style_preferences?: string[];
  occasion_preferences?: string[];
}

export interface PeerApprovalRating {
  user_id?: string;
  guest_session_id?: string;
  fragrance_id: string;
  overall_rating: number; // 0.0-5.0
  would_recommend: boolean;
  experience_rating: 'love' | 'like' | 'neutral' | 'dislike' | 'hate';
  usage_occasion?: string;
  experience_level_when_rated: 'beginner' | 'intermediate' | 'experienced' | 'expert';
  confidence_in_rating: number; // 1-10
  quick_review?: string;
}

export interface SocialMetrics {
  demographic_group: string;
  total_users: number;
  approval_rating: number;
  approval_count: number;
  love_percentage: number;
  beginner_approval: number;
  experienced_approval: number;
  confidence_score: number;
}

export interface PopularityTrend {
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  search_count: number;
  view_count: number;
  collection_adds: number;
  trending_score: number;
  velocity_score: number;
  rank_in_category?: number;
  percentile_score?: number;
}

export interface UniquenessScore {
  popularity_score: number; // 1-10, where 10 = very common
  distinctiveness_score: number; // 1-10, where 10 = very unique
  market_saturation: number; // Percentage
  conformity_pressure: number; // 1-10
  similar_but_unique?: Array<{
    id: string;
    name: string;
    similarity: number;
  }>;
}

export interface SocialContext {
  overall: {
    demographic_groups: number;
    avg_approval: number;
    total_approvals: number;
    love_percentage: number;
    confidence: number;
  };
  peer_context?: {
    approval_rating: number;
    approval_count: number;
    love_percentage: number;
    beginner_friendly: number;
    experienced_approval: number;
    confidence: number;
  };
  trending?: {
    trending_score: number;
    velocity: number;
    rank_in_category: number;
    percentile: number;
  };
  uniqueness?: {
    popularity_level: number;
    distinctiveness: number;
    market_saturation: number;
    conformity_pressure: number;
  };
}

export interface SocialValidationBadge {
  type: 'demographic' | 'peer_approval' | 'trending' | 'uniqueness';
  label: string;
  value: string | number;
  confidence: number;
  description: string;
  icon?: string;
}

/**
 * Social Context Service
 * Handles all social validation and peer context operations
 */
export class SocialContextService {
  private supabase = createServiceSupabase();

  /**
   * Get or create user demographics
   */
  async getUserDemographics(userId?: string, guestSessionId?: string): Promise<UserDemographics | null> {
    if (!userId && !guestSessionId) {
      throw new Error('Either userId or guestSessionId must be provided');
    }

    const query = this.supabase
      .from('user_demographics')
      .select('*');

    if (userId) {
      query.eq('user_id', userId);
    } else {
      query.eq('guest_session_id', guestSessionId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get user demographics: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user demographics
   */
  async updateUserDemographics(demographics: UserDemographics): Promise<UserDemographics> {
    const { data, error } = await this.supabase
      .from('user_demographics')
      .upsert(demographics)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user demographics: ${error.message}`);
    }

    return data;
  }

  /**
   * Submit peer approval rating
   */
  async submitPeerRating(rating: PeerApprovalRating): Promise<void> {
    const { error } = await this.supabase
      .from('peer_approval_ratings')
      .upsert(rating);

    if (error) {
      throw new Error(`Failed to submit peer rating: ${error.message}`);
    }

    // Social metrics will be updated automatically via trigger
  }

  /**
   * Get social context for a fragrance
   */
  async getFragranceSocialContext(
    fragranceId: string,
    userAgeGroup?: string,
    userExperienceLevel?: string
  ): Promise<SocialContext | null> {
    const { data, error } = await this.supabase.rpc('get_fragrance_social_context', {
      p_fragrance_id: fragranceId,
      p_user_age_group: userAgeGroup,
      p_user_experience_level: userExperienceLevel
    });

    if (error) {
      throw new Error(`Failed to get social context: ${error.message}`);
    }

    return data;
  }

  /**
   * Get social validation badges for a fragrance
   */
  async getSocialValidationBadges(
    fragranceId: string,
    userAgeGroup?: string,
    userExperienceLevel?: string
  ): Promise<SocialValidationBadge[]> {
    const context = await this.getFragranceSocialContext(fragranceId, userAgeGroup, userExperienceLevel);
    
    if (!context) return [];

    const badges: SocialValidationBadge[] = [];

    // Demographic context badge
    if (context.peer_context && userAgeGroup && userExperienceLevel) {
      const ageDisplay = userAgeGroup.replace('-', '–');
      const expDisplay = userExperienceLevel === 'beginner' ? 'beginners' : `${userExperienceLevel} users`;
      
      badges.push({
        type: 'demographic',
        label: `Popular with ${ageDisplay} ${expDisplay}`,
        value: `${Math.round(context.peer_context.love_percentage)}%`,
        confidence: context.peer_context.confidence,
        description: `${context.peer_context.approval_count} similar users rated this fragrance`,
        icon: '👥'
      });
    }

    // Peer approval badge
    if (context.overall.total_approvals >= 10) {
      const approvalText = context.overall.avg_approval >= 4.0 ? 'highly recommended' : 
                          context.overall.avg_approval >= 3.5 ? 'well-liked' : 'mixed reviews';
      
      badges.push({
        type: 'peer_approval',
        label: `${approvalText.charAt(0).toUpperCase() + approvalText.slice(1)}`,
        value: `${context.overall.avg_approval.toFixed(1)}/5`,
        confidence: context.overall.confidence,
        description: `Based on ${context.overall.total_approvals} peer reviews`,
        icon: context.overall.avg_approval >= 4.0 ? '⭐' : '👍'
      });
    }

    // Trending badge
    if (context.trending && context.trending.trending_score > 6.0) {
      badges.push({
        type: 'trending',
        label: 'Trending now',
        value: `+${Math.round(context.trending.velocity * 100)}%`,
        confidence: 0.9,
        description: `Rising popularity this month`,
        icon: '🔥'
      });
    }

    // Uniqueness badge
    if (context.uniqueness) {
      const { popularity_level, distinctiveness } = context.uniqueness;
      
      if (popularity_level >= 8.0) {
        badges.push({
          type: 'uniqueness',
          label: 'Very popular choice',
          value: 'Common',
          confidence: 0.85,
          description: 'You might smell like others wearing this',
          icon: '📊'
        });
      } else if (distinctiveness >= 7.0) {
        badges.push({
          type: 'uniqueness',
          label: 'Distinctive choice',
          value: 'Unique',
          confidence: 0.85,
          description: 'Stand out from the crowd',
          icon: '💎'
        });
      }
    }

    return badges.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get demographic breakdown for a fragrance
   */
  async getDemographicBreakdown(fragranceId: string): Promise<Array<{
    age_group: string;
    experience_level: string;
    approval_rating: number;
    user_count: number;
    confidence: number;
  }>> {
    const { data, error } = await this.supabase
      .from('fragrance_social_metrics')
      .select('*')
      .eq('fragrance_id', fragranceId)
      .gte('confidence_score', 0.5)
      .order('approval_rating', { ascending: false });

    if (error) {
      throw new Error(`Failed to get demographic breakdown: ${error.message}`);
    }

    return data?.map(metric => {
      const [agePart, expPart] = metric.demographic_group.split(',');
      const age_group = agePart.replace('age:', '');
      const experience_level = expPart.replace('exp:', '');

      return {
        age_group,
        experience_level,
        approval_rating: metric.approval_rating || 0,
        user_count: metric.total_users || 0,
        confidence: metric.confidence_score || 0
      };
    }) || [];
  }

  /**
   * Get popularity trends for a fragrance
   */
  async getPopularityTrends(fragranceId: string, periodType: 'weekly' | 'monthly' = 'monthly'): Promise<PopularityTrend[]> {
    const { data, error } = await this.supabase
      .from('fragrance_popularity_trends')
      .select('*')
      .eq('fragrance_id', fragranceId)
      .eq('period_type', periodType)
      .order('period_start', { ascending: false })
      .limit(12); // Last 12 periods

    if (error) {
      throw new Error(`Failed to get popularity trends: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get uniqueness score for a fragrance
   */
  async getUniquenessScore(fragranceId: string): Promise<UniquenessScore | null> {
    const { data, error } = await this.supabase
      .from('fragrance_uniqueness_scores')
      .select('*')
      .eq('fragrance_id', fragranceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get uniqueness score: ${error.message}`);
    }

    return data;
  }

  /**
   * Get alternative fragrances (similar but more unique)
   */
  async getUniqueAlternatives(fragranceId: string, limit: number = 3): Promise<Array<{
    id: string;
    name: string;
    brand: string;
    similarity: number;
    uniqueness_advantage: number;
  }>> {
    const uniquenessScore = await this.getUniquenessScore(fragranceId);
    
    if (!uniquenessScore?.similar_but_unique) {
      return [];
    }

    const alternatives = typeof uniquenessScore.similar_but_unique === 'string' 
      ? JSON.parse(uniquenessScore.similar_but_unique)
      : uniquenessScore.similar_but_unique || [];
    
    // Get full fragrance details for alternatives
    const alternativeIds = alternatives.slice(0, limit).map((alt: any) => alt.id);
    
    const { data: fragrances, error } = await this.supabase
      .from('fragrances')
      .select('id, name, brand_id, fragrance_brands(name)')
      .in('id', alternativeIds);

    if (error) {
      throw new Error(`Failed to get alternative fragrances: ${error.message}`);
    }

    return fragrances?.map(frag => {
      const altData = alternatives.find((alt: any) => alt.id === frag.id);
      return {
        id: frag.id,
        name: frag.name,
        brand: (frag.fragrance_brands as any)?.name || 'Unknown',
        similarity: altData?.similarity || 0,
        uniqueness_advantage: Math.round((7.0 - uniquenessScore.popularity_score) * 10) / 10
      };
    }) || [];
  }

  /**
   * Track fragrance interaction for popularity trends
   */
  async trackInteraction(
    fragranceId: string,
    interactionType: 'view' | 'search' | 'collection_add' | 'sample_request'
  ): Promise<void> {
    // This would typically be called from API endpoints to track interactions
    // For now, we'll just increment the current period's count
    
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const updateField = interactionType === 'search' ? 'search_count' :
                       interactionType === 'view' ? 'view_count' :
                       interactionType === 'collection_add' ? 'collection_adds' :
                       'sample_requests';

    const { error } = await this.supabase
      .from('fragrance_popularity_trends')
      .upsert({
        fragrance_id: fragranceId,
        period_type: 'weekly',
        period_start: startOfWeek.toISOString().split('T')[0],
        period_end: endOfWeek.toISOString().split('T')[0],
        [updateField]: 1
      });

    if (error) {
      console.error('Failed to track interaction:', error);
    }
  }

  /**
   * Generate social proof text for display
   */
  generateSocialProofText(context: SocialContext, userAgeGroup?: string): string {
    if (!context.overall.total_approvals) {
      return "Be the first to rate this fragrance";
    }

    const approval = context.overall.avg_approval;
    const total = context.overall.total_approvals;
    
    let text = "";
    
    if (approval >= 4.5) {
      text = `❤️ Loved by ${total} users`;
    } else if (approval >= 4.0) {
      text = `👍 ${Math.round(context.overall.love_percentage)}% of ${total} users recommend this`;
    } else if (approval >= 3.5) {
      text = `${total} user reviews · Mixed opinions`;
    } else {
      text = `${total} user reviews · Polarizing fragrance`;
    }

    // Add peer context if available
    if (context.peer_context && userAgeGroup) {
      const ageDisplay = userAgeGroup.replace('-', '–');
      text += ` · Popular with ${ageDisplay}`;
    }

    return text;
  }

  /**
   * Calculate confidence boost for user decision
   */
  calculateConfidenceBoost(
    context: SocialContext,
    userPreferences: { uniqueness_preference: number; social_influence_level: number }
  ): {
    confidence_boost: number;
    reasoning: string[];
  } {
    const reasoning: string[] = [];
    let boost = 0;

    // High peer approval boosts confidence
    if (context.overall.avg_approval >= 4.0 && context.overall.total_approvals >= 10) {
      boost += 0.3;
      reasoning.push(`Strong peer approval (${context.overall.avg_approval.toFixed(1)}/5 stars)`);
    }

    // Demographic match boosts confidence
    if (context.peer_context && context.peer_context.confidence >= 0.7) {
      boost += 0.2;
      reasoning.push(`Good match for people like you`);
    }

    // Uniqueness alignment
    if (context.uniqueness) {
      const userWantsUnique = userPreferences.uniqueness_preference >= 7;
      const fragranceIsUnique = context.uniqueness.distinctiveness >= 7;
      const userWantsPopular = userPreferences.uniqueness_preference <= 4;
      const fragranceIsPopular = context.uniqueness.popularity_level >= 7;

      if ((userWantsUnique && fragranceIsUnique) || (userWantsPopular && fragranceIsPopular)) {
        boost += 0.15;
        reasoning.push(`Matches your uniqueness preference`);
      }
    }

    // Social influence consideration
    const socialInfluence = userPreferences.social_influence_level / 10;
    boost = boost * (0.5 + socialInfluence * 0.5);

    return {
      confidence_boost: Math.min(1.0, boost),
      reasoning
    };
  }
}

// Export singleton instance
export const socialContextService = new SocialContextService();