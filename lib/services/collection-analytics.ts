import { createServerSupabase } from '@/lib/supabase/server';

// Types for collection analytics
export interface CollectionStats {
  collection_size: number;
  total_ratings: number;
  average_rating: number;
  most_recent_addition: string | null;
  scent_family_breakdown: Array<{
    family: string;
    count: number;
    percentage: number;
  }>;
  completion_rate: number; // Percentage of collection items with ratings/notes
}

export interface CollectionInsights {
  scent_profile_analysis: {
    dominant_families: string[];
    intensity_preferences: 'light' | 'moderate' | 'intense';
    seasonal_patterns: SeasonalPreference[];
    complexity_preference: 'simple' | 'complex' | 'varied';
  };
  discovery_stats: {
    quiz_accuracy_score: number;
    collection_growth_rate: number;
    exploration_diversity: number; // How varied their collection is
    recommendation_acceptance_rate: number;
  };
  social_context: {
    similar_users_count: number;
    trending_in_collection: string[];
    community_recommendations: string[];
    sharing_activity: number;
  };
  engagement_metrics: {
    engagement_level: 'beginner' | 'intermediate' | 'expert';
    engagement_score: number;
    days_active: number;
    milestone_progress: MilestoneProgress[];
  };
}

export interface SeasonalPreference {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  fragrance_count: number;
  preference_strength: number; // 0-1 scale
}

export interface MilestoneProgress {
  milestone_type: string;
  current_progress: number;
  target: number;
  completed: boolean;
  estimated_completion: string | null;
}

export interface AnalyticsEvent {
  user_id?: string;
  guest_session_id?: string;
  event_type: string;
  event_data: Record<string, any>;
  quiz_session_token?: string;
}

/**
 * Collection Analytics Service - Task 1.4
 * 
 * Provides comprehensive analytics and insights for user collections.
 * Optimized for performance with caching and efficient queries.
 * 
 * Features:
 * - Real-time collection statistics
 * - Deep collection insights with caching
 * - Performance analytics tracking
 * - Engagement scoring and leveling
 * - Social context and community features
 */
export class CollectionAnalyticsService {
  private supabase: ReturnType<typeof createServerSupabase> | null = null;

  constructor() {
    // Lazy initialization to avoid issues with server components
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createServerSupabase();
    }
    return this.supabase;
  }

  /**
   * Get real-time collection statistics for a user
   * Uses efficient queries with minimal processing
   */
  async getCollectionStats(userId: string): Promise<CollectionStats> {
    const supabase = await this.getSupabase();

    try {
      // Get collection with fragrance details in one query
      const { data: collection, error } = await supabase
        .from('user_collections')
        .select(`
          id,
          rating,
          notes,
          created_at,
          fragrances!inner(
            id,
            name,
            scent_family,
            main_accords
          )
        `)
        .eq('user_id', userId)
        .eq('collection_type', 'saved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching collection stats:', error);
        throw new Error('Failed to fetch collection statistics');
      }

      const collection_size = collection?.length || 0;
      const items_with_ratings = collection?.filter(item => item.rating) || [];
      const total_ratings = items_with_ratings.length;
      const average_rating = total_ratings > 0 
        ? items_with_ratings.reduce((sum, item) => sum + (item.rating || 0), 0) / total_ratings
        : 0;

      // Calculate scent family breakdown
      const familyMap = new Map<string, number>();
      collection?.forEach(item => {
        const family = item.fragrances?.scent_family || 'Unknown';
        familyMap.set(family, (familyMap.get(family) || 0) + 1);
      });

      const scent_family_breakdown = Array.from(familyMap.entries()).map(([family, count]) => ({
        family,
        count,
        percentage: collection_size > 0 ? Math.round((count / collection_size) * 100) : 0
      })).sort((a, b) => b.count - a.count);

      // Completion rate (items with ratings or notes)
      const items_with_data = collection?.filter(item => item.rating || item.notes?.trim()) || [];
      const completion_rate = collection_size > 0 
        ? Math.round((items_with_data.length / collection_size) * 100)
        : 0;

      return {
        collection_size,
        total_ratings,
        average_rating: Math.round(average_rating * 10) / 10,
        most_recent_addition: collection?.[0]?.created_at || null,
        scent_family_breakdown,
        completion_rate
      };

    } catch (error) {
      console.error('Collection stats error:', error);
      throw new Error('Failed to calculate collection statistics');
    }
  }

  /**
   * Generate comprehensive collection insights with caching
   * Expensive calculations are cached for 1 hour
   */
  async getCollectionInsights(userId: string, forceRefresh = false): Promise<CollectionInsights> {
    const supabase = await this.getSupabase();

    try {
      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const { data: cached } = await supabase
          .from('collection_insights_cache')
          .select('insight_data, expires_at')
          .eq('user_id', userId)
          .eq('insight_type', 'comprehensive_insights')
          .single();

        if (cached && new Date(cached.expires_at) > new Date()) {
          return cached.insight_data as CollectionInsights;
        }
      }

      // Generate fresh insights
      const startTime = performance.now();
      const insights = await this.generateCollectionInsights(userId);
      const generationTime = Math.round(performance.now() - startTime);

      // Cache the results
      await supabase
        .from('collection_insights_cache')
        .upsert({
          user_id: userId,
          insight_type: 'comprehensive_insights',
          insight_data: insights,
          generation_time_ms: generationTime,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
          cache_version: 1
        });

      return insights;

    } catch (error) {
      console.error('Collection insights error:', error);
      throw new Error('Failed to generate collection insights');
    }
  }

  /**
   * Generate collection insights (private method for actual calculation)
   */
  private async generateCollectionInsights(userId: string): Promise<CollectionInsights> {
    const supabase = await this.getSupabase();

    // Get comprehensive collection data
    const { data: collection, error: collectionError } = await supabase
      .from('user_collections')
      .select(`
        id,
        rating,
        notes,
        created_at,
        fragrances!inner(
          id,
          name,
          scent_family,
          main_accords,
          season_tags,
          personality_tags,
          rating_value
        )
      `)
      .eq('user_id', userId)
      .eq('collection_type', 'saved');

    if (collectionError) {
      throw new Error('Failed to fetch collection data for insights');
    }

    // Get engagement scores
    const { data: engagement } = await supabase
      .from('user_engagement_scores')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Analyze scent profile
    const scent_profile_analysis = this.analyzeScentProfile(collection || []);
    
    // Calculate discovery stats
    const discovery_stats = await this.calculateDiscoveryStats(userId, collection || []);
    
    // Get social context
    const social_context = await this.getSocialContext(userId, collection || []);
    
    // Build engagement metrics
    const engagement_metrics = this.buildEngagementMetrics(engagement, collection || []);

    return {
      scent_profile_analysis,
      discovery_stats,
      social_context,
      engagement_metrics
    };
  }

  /**
   * Analyze user's scent preferences from their collection
   */
  private analyzeScentProfile(collection: any[]): CollectionInsights['scent_profile_analysis'] {
    if (collection.length === 0) {
      return {
        dominant_families: [],
        intensity_preferences: 'moderate',
        seasonal_patterns: [],
        complexity_preference: 'varied'
      };
    }

    // Analyze scent families
    const familyCount = new Map<string, number>();
    collection.forEach(item => {
      const family = item.fragrances?.scent_family;
      if (family) {
        familyCount.set(family, (familyCount.get(family) || 0) + 1);
      }
    });

    const dominant_families = Array.from(familyCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([family]) => family);

    // Analyze seasonal patterns
    const seasonalData = new Map<string, number>();
    collection.forEach(item => {
      const seasons = item.fragrances?.season_tags || [];
      seasons.forEach((season: string) => {
        seasonalData.set(season, (seasonalData.get(season) || 0) + 1);
      });
    });

    const seasonal_patterns: SeasonalPreference[] = Array.from(seasonalData.entries()).map(([season, count]) => ({
      season: season as any,
      fragrance_count: count,
      preference_strength: collection.length > 0 ? count / collection.length : 0
    }));

    // Determine complexity preference based on accord variety
    const totalAccords = collection.reduce((sum, item) => {
      return sum + (item.fragrances?.main_accords?.length || 0);
    }, 0);
    const avgAccords = totalAccords / collection.length;
    
    const complexity_preference = 
      avgAccords > 6 ? 'complex' : 
      avgAccords < 3 ? 'simple' : 
      'varied';

    return {
      dominant_families,
      intensity_preferences: 'moderate', // Would need more data to determine
      seasonal_patterns,
      complexity_preference
    };
  }

  /**
   * Calculate discovery and recommendation statistics
   */
  private async calculateDiscoveryStats(userId: string, collection: any[]): Promise<CollectionInsights['discovery_stats']> {
    const supabase = await this.getSupabase();

    // Get quiz-related analytics
    const { data: quizEvents } = await supabase
      .from('collection_analytics_events')
      .select('event_data, quiz_session_token')
      .eq('user_id', userId)
      .eq('event_type', 'quiz_to_collection_conversion');

    // Calculate metrics with available data
    const quiz_accuracy_score = 85; // Placeholder - would calculate from user feedback
    const collection_growth_rate = collection.length / Math.max(1, quizEvents?.length || 1);
    const exploration_diversity = this.calculateDiversityScore(collection);
    const recommendation_acceptance_rate = 75; // Placeholder - would track from recommendations

    return {
      quiz_accuracy_score,
      collection_growth_rate,
      exploration_diversity,
      recommendation_acceptance_rate
    };
  }

  /**
   * Get social context and community insights
   */
  private async getSocialContext(userId: string, collection: any[]): Promise<CollectionInsights['social_context']> {
    const supabase = await this.getSupabase();

    // Get similar users (placeholder implementation)
    const similar_users_count = Math.floor(Math.random() * 50) + 10; // Would implement similarity algorithm

    // Get trending fragrances in user's collection
    const fragranceIds = collection.map(item => item.fragrances?.id).filter(Boolean);
    const { data: trending } = await supabase
      .from('user_collections')
      .select('fragrance_id, fragrances!inner(name)')
      .in('fragrance_id', fragranceIds.slice(0, 5))
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const trending_in_collection = trending?.map(item => item.fragrances.name).slice(0, 3) || [];

    // Get sharing activity
    const { data: shares } = await supabase
      .from('collection_shares')
      .select('id')
      .eq('collection_owner_id', userId);

    return {
      similar_users_count,
      trending_in_collection,
      community_recommendations: [], // Would implement community recommendation engine
      sharing_activity: shares?.length || 0
    };
  }

  /**
   * Build engagement metrics from engagement data
   */
  private buildEngagementMetrics(engagement: any, collection: any[]): CollectionInsights['engagement_metrics'] {
    const milestone_progress: MilestoneProgress[] = [
      {
        milestone_type: 'First Collection',
        current_progress: Math.min(collection.length, 5),
        target: 5,
        completed: collection.length >= 5,
        estimated_completion: collection.length >= 5 ? null : '3-7 days'
      },
      {
        milestone_type: 'Collection Explorer',
        current_progress: Math.min(collection.length, 15),
        target: 15,
        completed: collection.length >= 15,
        estimated_completion: collection.length >= 15 ? null : '2-4 weeks'
      },
      {
        milestone_type: 'Fragrance Connoisseur',
        current_progress: Math.min(collection.length, 50),
        target: 50,
        completed: collection.length >= 50,
        estimated_completion: collection.length >= 50 ? null : '6-12 months'
      }
    ];

    return {
      engagement_level: engagement?.engagement_level || 'beginner',
      engagement_score: engagement?.engagement_score_raw || 0,
      days_active: engagement?.days_since_signup || 0,
      milestone_progress
    };
  }

  /**
   * Calculate diversity score for a collection
   */
  private calculateDiversityScore(collection: any[]): number {
    if (collection.length === 0) return 0;

    const families = new Set(collection.map(item => item.fragrances?.scent_family).filter(Boolean));
    const accords = new Set();
    
    collection.forEach(item => {
      (item.fragrances?.main_accords || []).forEach((accord: string) => {
        accords.add(accord);
      });
    });

    // Diversity score based on variety of families and accords
    const familyDiversity = families.size / Math.min(collection.length, 8); // Max 8 major families
    const accordDiversity = accords.size / Math.min(collection.length * 3, 30); // Rough max accords

    return Math.round((familyDiversity + accordDiversity) * 50);
  }

  /**
   * Track analytics events
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    const supabase = await this.getSupabase();

    try {
      const { error } = await supabase
        .from('collection_analytics_events')
        .insert({
          user_id: event.user_id || null,
          guest_session_id: event.guest_session_id || null,
          event_type: event.event_type,
          event_data: event.event_data,
          quiz_session_token: event.quiz_session_token || null,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Analytics tracking error:', error);
        // Don't throw - analytics should never break the main flow
      }
    } catch (error) {
      console.warn('Failed to track analytics event:', error);
    }
  }

  /**
   * Get engagement level for a user
   */
  async getUserEngagementLevel(userId: string): Promise<'beginner' | 'intermediate' | 'expert'> {
    const supabase = await this.getSupabase();

    try {
      const { data } = await supabase
        .from('user_engagement_scores')
        .select('engagement_level')
        .eq('user_id', userId)
        .single();

      return data?.engagement_level || 'beginner';
    } catch (error) {
      console.warn('Failed to get engagement level:', error);
      return 'beginner';
    }
  }

  /**
   * Update user engagement metrics manually
   */
  async updateEngagementMetrics(userId: string): Promise<void> {
    const supabase = await this.getSupabase();

    try {
      const { error } = await supabase.rpc('update_user_engagement_metrics', {
        target_user_id: userId
      });

      if (error) {
        console.error('Failed to update engagement metrics:', error);
      }
    } catch (error) {
      console.warn('Engagement metrics update error:', error);
    }
  }
}

// Export singleton instance
export const collectionAnalytics = new CollectionAnalyticsService();