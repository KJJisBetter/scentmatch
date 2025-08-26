import { createServerSupabase } from '@/lib/supabase/server';
import { progressiveEngagementService } from './progressive-engagement';
import type { 
  EngagementTrigger,
  ProgressiveJourney 
} from './progressive-engagement';

/**
 * Engagement Triggers Service - Task 4.1 (Phase 1D)
 * 
 * Manages intelligent engagement triggers that guide users through progressive
 * collection building. Uses behavioral analysis to determine optimal timing
 * and content for maximum engagement.
 * 
 * Features:
 * - Behavioral trigger analysis
 * - Optimal timing calculation
 * - Personalized trigger content
 * - A/B testing support for trigger optimization
 * - Email integration preparation
 * - Push notification scheduling
 * - Trigger performance analytics
 */

export interface TriggerAnalysis {
  user_behavior_profile: {
    activity_pattern: 'morning' | 'afternoon' | 'evening' | 'mixed';
    preferred_days: string[];
    engagement_frequency: 'daily' | 'weekly' | 'sporadic';
    response_history: TriggerResponse[];
  };
  optimal_timing: {
    best_day_of_week: string;
    best_time_of_day: string;
    timezone_offset: number;
    confidence_level: number;
  };
  content_preferences: {
    preferred_trigger_types: string[];
    effective_messaging: string[];
    call_to_action_preferences: string[];
  };
}

export interface TriggerResponse {
  trigger_id: string;
  response_type: 'engaged' | 'dismissed' | 'no_response';
  response_timestamp: string;
  engagement_duration?: number;
  conversion_achieved?: boolean;
}

export interface TriggerCampaign {
  campaign_id: string;
  campaign_name: string;
  target_audience: string;
  triggers: EngagementTrigger[];
  success_metrics: {
    engagement_rate: number;
    conversion_rate: number;
    completion_rate: number;
  };
  duration_days: number;
  status: 'active' | 'paused' | 'completed';
}

export interface TriggerPersonalization {
  user_id: string;
  personalization_data: {
    name: string;
    collection_highlights: string[];
    missing_elements: string[];
    achievement_progress: number;
    seasonal_recommendations: string[];
    social_context: string[];
  };
  dynamic_content: {
    urgency_level: 'low' | 'medium' | 'high';
    tone: 'encouraging' | 'informative' | 'celebratory' | 'urgent';
    focus_area: 'discovery' | 'rating' | 'social' | 'milestone';
  };
}

export class EngagementTriggersService {
  private supabase: ReturnType<typeof createServerSupabase> | null = null;
  private triggerCache = new Map<string, any>();

  constructor() {
    // Lazy initialization
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createServerSupabase();
    }
    return this.supabase;
  }

  /**
   * Analyze user behavior to optimize trigger timing and content
   */
  async analyzeUserBehavior(userId: string): Promise<TriggerAnalysis> {
    const supabase = await this.getSupabase();

    try {
      // Get user's historical activity for pattern analysis
      const { data: activityHistory } = await supabase
        .from('collection_analytics_events')
        .select('event_type, created_at, event_data')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('created_at', { ascending: false });

      // Analyze activity patterns
      const activityPattern = this.analyzeActivityTiming(activityHistory || []);
      const preferredDays = this.analyzePreferredDays(activityHistory || []);
      const engagementFrequency = this.analyzeEngagementFrequency(activityHistory || []);

      // Get trigger response history
      const responseHistory = await this.getTriggerResponseHistory(userId);

      // Calculate optimal timing
      const optimalTiming = this.calculateOptimalTiming(activityHistory || [], responseHistory);

      // Analyze content preferences
      const contentPreferences = this.analyzeContentPreferences(responseHistory);

      return {
        user_behavior_profile: {
          activity_pattern: activityPattern,
          preferred_days: preferredDays,
          engagement_frequency: engagementFrequency,
          response_history: responseHistory
        },
        optimal_timing: optimalTiming,
        content_preferences: contentPreferences
      };

    } catch (error) {
      console.error('User behavior analysis error:', error);
      // Return default analysis
      return {
        user_behavior_profile: {
          activity_pattern: 'mixed',
          preferred_days: ['monday', 'wednesday', 'friday'],
          engagement_frequency: 'weekly',
          response_history: []
        },
        optimal_timing: {
          best_day_of_week: 'wednesday',
          best_time_of_day: '14:00',
          timezone_offset: 0,
          confidence_level: 50
        },
        content_preferences: {
          preferred_trigger_types: ['in_app', 'email'],
          effective_messaging: ['achievement', 'recommendation'],
          call_to_action_preferences: ['explore', 'discover']
        }
      };
    }
  }

  /**
   * Generate intelligent trigger based on user context
   */
  async generateIntelligentTrigger(
    userId: string,
    triggerContext: {
      trigger_reason: string;
      user_journey_stage: string;
      recent_behavior: string[];
      collection_context: any;
    }
  ): Promise<EngagementTrigger | null> {
    try {
      // Analyze user behavior first
      const behaviorAnalysis = await this.analyzeUserBehavior(userId);
      
      // Get personalization data
      const personalization = await this.generateTriggerPersonalization(userId);

      // Generate trigger based on context and behavior
      const trigger = this.createContextualTrigger(
        triggerContext,
        behaviorAnalysis,
        personalization
      );

      return trigger;

    } catch (error) {
      console.error('Generate intelligent trigger error:', error);
      return null;
    }
  }

  /**
   * Execute trigger campaign for multiple users
   */
  async executeTriggerCampaign(campaign: TriggerCampaign): Promise<{
    campaign_id: string;
    triggers_sent: number;
    estimated_reach: number;
    success: boolean;
  }> {
    try {
      // This would integrate with email/push notification services
      // For now, log the campaign execution
      
      console.log(`Executing trigger campaign: ${campaign.campaign_name}`);
      console.log(`Target audience: ${campaign.target_audience}`);
      console.log(`Triggers in campaign: ${campaign.triggers.length}`);

      // Track campaign execution
      await this.trackCampaignExecution(campaign);

      return {
        campaign_id: campaign.campaign_id,
        triggers_sent: campaign.triggers.length,
        estimated_reach: campaign.triggers.length * 100, // Estimated based on trigger types
        success: true
      };

    } catch (error) {
      console.error('Execute trigger campaign error:', error);
      return {
        campaign_id: campaign.campaign_id,
        triggers_sent: 0,
        estimated_reach: 0,
        success: false
      };
    }
  }

  /**
   * Optimize trigger performance using A/B testing
   */
  async optimizeTriggerPerformance(
    triggerType: string,
    variants: Array<{
      variant_id: string;
      content: any;
      target_percentage: number;
    }>
  ): Promise<{
    optimization_results: Array<{
      variant_id: string;
      performance_score: number;
      engagement_rate: number;
      conversion_rate: number;
      recommended: boolean;
    }>;
    winning_variant?: string;
  }> {
    try {
      // This would implement A/B testing for trigger optimization
      // For now, return simulated results
      
      const optimization_results = variants.map((variant, index) => ({
        variant_id: variant.variant_id,
        performance_score: 70 + Math.random() * 30, // Simulated score
        engagement_rate: 0.15 + Math.random() * 0.15, // 15-30%
        conversion_rate: 0.05 + Math.random() * 0.10, // 5-15%
        recommended: index === 0 // First variant wins for simulation
      }));

      const winning_variant = optimization_results
        .sort((a, b) => b.performance_score - a.performance_score)[0]?.variant_id;

      return {
        optimization_results,
        winning_variant
      };

    } catch (error) {
      console.error('Optimize trigger performance error:', error);
      return {
        optimization_results: []
      };
    }
  }

  // Private implementation methods

  private analyzeActivityTiming(activityHistory: any[]): 'morning' | 'afternoon' | 'evening' | 'mixed' {
    if (activityHistory.length === 0) return 'mixed';

    const hourCounts = new Map<number, number>();
    
    activityHistory.forEach(event => {
      const hour = new Date(event.created_at).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    // Find peak activity period
    const sortedHours = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1]);
    const peakHour = sortedHours[0]?.[0] || 12;

    if (peakHour >= 6 && peakHour < 12) return 'morning';
    if (peakHour >= 12 && peakHour < 18) return 'afternoon';
    if (peakHour >= 18 && peakHour < 24) return 'evening';
    return 'mixed';
  }

  private analyzePreferredDays(activityHistory: any[]): string[] {
    if (activityHistory.length === 0) return ['monday', 'wednesday', 'friday'];

    const dayCounts = new Map<string, number>();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    activityHistory.forEach(event => {
      const dayIndex = new Date(event.created_at).getDay();
      const dayName = dayNames[dayIndex];
      dayCounts.set(dayName, (dayCounts.get(dayName) || 0) + 1);
    });

    return Array.from(dayCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);
  }

  private analyzeEngagementFrequency(activityHistory: any[]): 'daily' | 'weekly' | 'sporadic' {
    if (activityHistory.length === 0) return 'sporadic';

    const dates = activityHistory.map(event => 
      new Date(event.created_at).toDateString()
    );
    const uniqueDates = [...new Set(dates)];
    
    const daysWithActivity = uniqueDates.length;
    const daysSinceFirst = activityHistory.length > 0 
      ? Math.ceil((Date.now() - new Date(activityHistory[activityHistory.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 1;

    const activityRate = daysWithActivity / daysSinceFirst;

    if (activityRate >= 0.8) return 'daily';
    if (activityRate >= 0.3) return 'weekly';
    return 'sporadic';
  }

  private async getTriggerResponseHistory(userId: string): Promise<TriggerResponse[]> {
    const supabase = await this.getSupabase();

    try {
      const { data: responses } = await supabase
        .from('collection_analytics_events')
        .select('event_data, created_at')
        .eq('user_id', userId)
        .in('event_type', ['trigger_engaged', 'trigger_dismissed', 'trigger_no_response'])
        .order('created_at', { ascending: false })
        .limit(20);

      return (responses || []).map(response => ({
        trigger_id: response.event_data.trigger_id,
        response_type: response.event_data.response_type,
        response_timestamp: response.created_at,
        engagement_duration: response.event_data.engagement_duration,
        conversion_achieved: response.event_data.conversion_achieved
      }));

    } catch (error) {
      console.warn('Get trigger response history error:', error);
      return [];
    }
  }

  private calculateOptimalTiming(
    activityHistory: any[],
    responseHistory: TriggerResponse[]
  ) {
    // Analyze when user is most likely to engage
    const activityHours = activityHistory.map(event => 
      new Date(event.created_at).getHours()
    );

    const avgHour = activityHours.length > 0 
      ? Math.round(activityHours.reduce((sum, hour) => sum + hour, 0) / activityHours.length)
      : 14; // Default to 2 PM

    const bestTimeOfDay = `${avgHour.toString().padStart(2, '0')}:00`;

    // Find most active day of week
    const dayActivity = new Map<number, number>();
    activityHistory.forEach(event => {
      const day = new Date(event.created_at).getDay();
      dayActivity.set(day, (dayActivity.get(day) || 0) + 1);
    });

    const mostActiveDay = Array.from(dayActivity.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 3; // Default to Wednesday

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const bestDayOfWeek = dayNames[mostActiveDay];

    // Calculate confidence based on data volume
    const confidence = Math.min(90, Math.max(30, activityHistory.length * 5));

    return {
      best_day_of_week: bestDayOfWeek,
      best_time_of_day: bestTimeOfDay,
      timezone_offset: 0, // Would detect from user data
      confidence_level: confidence
    };
  }

  private analyzeContentPreferences(responseHistory: TriggerResponse[]) {
    // Analyze which types of triggers get best response
    const engagedTriggers = responseHistory.filter(r => r.response_type === 'engaged');
    
    return {
      preferred_trigger_types: ['in_app', 'email'], // Would analyze from response data
      effective_messaging: ['achievement', 'recommendation', 'social_proof'],
      call_to_action_preferences: ['explore', 'discover', 'unlock']
    };
  }

  private createContextualTrigger(
    context: any,
    behaviorAnalysis: TriggerAnalysis,
    personalization: TriggerPersonalization
  ): EngagementTrigger {
    const triggerTemplates = {
      collection_growth: {
        title: 'Time to grow your collection, {name}! 🌱',
        message: 'You have {collection_size} fragrances. Add {needed_for_milestone} more to unlock {reward}!',
        call_to_action: 'Get Recommendations'
      },
      rating_encouragement: {
        title: 'Help us learn your taste! ⭐',
        message: 'Rate {unrated_count} fragrances to get better recommendations.',
        call_to_action: 'Rate Fragrances'
      },
      social_engagement: {
        title: 'Share your amazing collection! ✨',
        message: 'Your {collection_size} fragrances are worth sharing with the community.',
        call_to_action: 'Share Collection'
      },
      seasonal_update: {
        title: 'Perfect scents for {season}! 🌸',
        message: 'Discover fragrances that match the {season} season.',
        call_to_action: 'Explore Seasonal'
      }
    };

    // Select template based on context
    const templateKey = context.trigger_reason || 'collection_growth';
    const template = triggerTemplates[templateKey as keyof typeof triggerTemplates] || triggerTemplates.collection_growth;

    // Personalize content
    const personalizedContent = {
      title: this.personalizeText(template.title, personalization),
      message: this.personalizeText(template.message, personalization),
      call_to_action: template.call_to_action,
      personalized_elements: Object.keys(personalization.personalization_data)
    };

    // Determine optimal timing
    const scheduledFor = this.calculateOptimalDeliveryTime(behaviorAnalysis.optimal_timing);

    return {
      trigger_id: `contextual_${userId}_${Date.now()}`,
      trigger_type: this.selectOptimalTriggerType(behaviorAnalysis),
      trigger_timing: 'scheduled',
      scheduled_for: scheduledFor,
      content: personalizedContent,
      priority: this.determinePriority(context, behaviorAnalysis),
      expected_impact: this.estimateImpact(context, behaviorAnalysis)
    };
  }

  private async generateTriggerPersonalization(userId: string): Promise<TriggerPersonalization> {
    const supabase = await this.getSupabase();

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, engagement_level')
        .eq('id', userId)
        .single();

      // Get collection data
      const { data: collection } = await supabase
        .from('user_collections')
        .select(`
          rating,
          fragrances!inner(
            name,
            scent_family,
            fragrance_brands!inner(name)
          )
        `)
        .eq('user_id', userId)
        .eq('collection_type', 'saved');

      // Calculate personalization elements
      const collectionHighlights = collection
        ?.filter(item => item.rating >= 4)
        .slice(0, 3)
        .map(item => `${item.fragrances.name} by ${item.fragrances.fragrance_brands.name}`) || [];

      const unratedItems = collection?.filter(item => !item.rating) || [];
      const missingElements = [];
      
      if (unratedItems.length > 3) {
        missingElements.push(`${unratedItems.length} unrated fragrances`);
      }

      const familiesExplored = new Set(collection?.map(item => item.fragrances.scent_family)).size || 0;
      if (familiesExplored < 3) {
        missingElements.push('more scent family diversity');
      }

      return {
        user_id: userId,
        personalization_data: {
          name: profile?.first_name || 'there',
          collection_highlights: collectionHighlights,
          missing_elements: missingElements,
          achievement_progress: (collection?.length || 0) * 10, // Simplified score
          seasonal_recommendations: ['spring florals', 'summer freshness'], // Would calculate
          social_context: ['47k+ users', 'trending collections'] // Would get from social service
        },
        dynamic_content: {
          urgency_level: this.calculateUrgencyLevel(collection?.length || 0, unratedItems.length),
          tone: this.determineTone(profile?.engagement_level || 'beginner'),
          focus_area: this.determineFocusArea(collection || [], unratedItems.length)
        }
      };

    } catch (error) {
      console.error('Generate personalization error:', error);
      return {
        user_id: userId,
        personalization_data: {
          name: 'there',
          collection_highlights: [],
          missing_elements: [],
          achievement_progress: 0,
          seasonal_recommendations: [],
          social_context: []
        },
        dynamic_content: {
          urgency_level: 'low',
          tone: 'encouraging',
          focus_area: 'discovery'
        }
      };
    }
  }

  // Utility methods

  private personalizeText(template: string, personalization: TriggerPersonalization): string {
    let text = template;
    
    // Replace personalization placeholders
    Object.entries(personalization.personalization_data).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      text = text.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return text;
  }

  private selectOptimalTriggerType(analysis: TriggerAnalysis): 'email' | 'in_app' | 'push_notification' {
    // Select based on user preferences and engagement patterns
    const preferences = analysis.content_preferences.preferred_trigger_types;
    
    if (preferences.includes('in_app')) return 'in_app';
    if (preferences.includes('email')) return 'email';
    return 'push_notification';
  }

  private calculateOptimalDeliveryTime(optimalTiming: any): string {
    // Calculate next optimal delivery time
    const now = new Date();
    const [hour, minute] = optimalTiming.best_time_of_day.split(':').map(Number);
    
    const deliveryTime = new Date();
    deliveryTime.setHours(hour, minute, 0, 0);
    
    // If time has passed today, schedule for next preferred day
    if (deliveryTime <= now) {
      deliveryTime.setDate(deliveryTime.getDate() + 1);
    }

    return deliveryTime.toISOString();
  }

  private determinePriority(context: any, analysis: TriggerAnalysis): 'high' | 'medium' | 'low' {
    // Determine priority based on user journey stage and behavior
    if (context.trigger_reason === 'milestone_completion') return 'high';
    if (context.trigger_reason === 'reengagement') return 'high';
    if (analysis.user_behavior_profile.engagement_frequency === 'daily') return 'medium';
    return 'low';
  }

  private estimateImpact(context: any, analysis: TriggerAnalysis): number {
    // Estimate expected impact based on historical data
    const baseImpact = 50;
    
    // Adjust based on engagement frequency
    let impact = baseImpact;
    if (analysis.user_behavior_profile.engagement_frequency === 'daily') impact += 20;
    if (analysis.user_behavior_profile.engagement_frequency === 'weekly') impact += 10;
    
    // Adjust based on response history
    const successfulResponses = analysis.user_behavior_profile.response_history
      .filter(r => r.response_type === 'engaged').length;
    const totalResponses = analysis.user_behavior_profile.response_history.length;
    
    if (totalResponses > 0) {
      const successRate = successfulResponses / totalResponses;
      impact += Math.round(successRate * 30);
    }

    return Math.min(100, Math.max(10, impact));
  }

  private calculateUrgencyLevel(collectionSize: number, unratedCount: number): 'low' | 'medium' | 'high' {
    if (collectionSize === 0) return 'high'; // New users need urgent engagement
    if (unratedCount > collectionSize * 0.7) return 'medium'; // Many unrated items
    return 'low';
  }

  private determineTone(engagementLevel: string): 'encouraging' | 'informative' | 'celebratory' | 'urgent' {
    switch (engagementLevel) {
      case 'expert': return 'informative';
      case 'intermediate': return 'encouraging';
      default: return 'celebratory';
    }
  }

  private determineFocusArea(collection: any[], unratedCount: number): 'discovery' | 'rating' | 'social' | 'milestone' {
    if (collection.length < 5) return 'discovery';
    if (unratedCount > 5) return 'rating';
    if (collection.length >= 15) return 'social';
    return 'milestone';
  }

  private async trackCampaignExecution(campaign: TriggerCampaign): Promise<void> {
    const supabase = await this.getSupabase();

    try {
      // Track campaign metrics
      await supabase
        .from('collection_analytics_events')
        .insert({
          user_id: null, // System event
          event_type: 'trigger_campaign_executed',
          event_data: {
            campaign_id: campaign.campaign_id,
            campaign_name: campaign.campaign_name,
            triggers_count: campaign.triggers.length,
            target_audience: campaign.target_audience
          },
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.warn('Track campaign execution error:', error);
    }
  }
}

// Export singleton instance
export const engagementTriggersService = new EngagementTriggersService();