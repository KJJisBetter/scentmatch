import { createServerSupabase } from '@/lib/supabase/server';
import { collectionAnalytics } from '@/lib/services/collection-analytics';
import type { 
  MilestoneProgress,
  EngagementLevel,
  AnalyticsEvent
} from '@/lib/types/collection-analytics';

/**
 * Progressive Engagement Service - Task 4.1 (Phase 1D)
 * 
 * Orchestrates progressive collection building through timed engagement triggers,
 * milestone tracking, and personalized recommendations. Guides users through
 * their fragrance discovery journey with strategic touchpoints.
 * 
 * Features:
 * - Progressive onboarding timeline (Day 1, Week 1, Month 1)
 * - Milestone-based progression with rewards
 * - Personalized recommendation engine integration
 * - Email trigger preparation and scheduling
 * - Behavioral analysis and optimization
 * - Retention optimization through engagement
 */

export interface ProgressiveJourney {
  user_id: string;
  current_stage: ProgressiveStage;
  next_milestone: MilestoneProgress | null;
  upcoming_triggers: EngagementTrigger[];
  personalized_recommendations: PersonalizedRecommendation[];
  journey_health_score: number;
  estimated_completion_timeline: EstimatedTimeline;
}

export interface ProgressiveStage {
  stage_id: string;
  stage_name: string;
  description: string;
  target_collection_size: number;
  expected_duration_days: number;
  completion_criteria: CompletionCriteria;
  rewards: StageReward[];
  current_progress: number;
  completed: boolean;
}

export interface EngagementTrigger {
  trigger_id: string;
  trigger_type: 'email' | 'in_app' | 'push_notification';
  trigger_timing: 'immediate' | 'scheduled' | 'conditional';
  scheduled_for?: string;
  condition?: string;
  content: {
    title: string;
    message: string;
    call_to_action: string;
    personalized_elements: string[];
  };
  priority: 'high' | 'medium' | 'low';
  expected_impact: number; // 0-100 score
}

export interface PersonalizedRecommendation {
  recommendation_id: string;
  fragrance_id: string;
  fragrance_name: string;
  brand_name: string;
  match_score: number;
  reasoning: string[];
  recommendation_source: 'progressive_engine' | 'community' | 'ai_insights' | 'seasonal';
  priority_score: number;
  timing_optimal: boolean;
  category_fit: string;
}

export interface CompletionCriteria {
  min_collection_size: number;
  min_rated_items: number;
  min_engagement_actions: number;
  required_scent_families?: number;
  optional_social_actions?: number;
}

export interface StageReward {
  reward_type: 'engagement_points' | 'feature_unlock' | 'discount' | 'badge' | 'insights';
  reward_value: number | string;
  reward_description: string;
  auto_grant: boolean;
}

export interface EstimatedTimeline {
  days_to_next_milestone: number;
  estimated_completion_date: string;
  confidence_level: 'high' | 'medium' | 'low';
  factors_affecting_timeline: string[];
}

export class ProgressiveEngagementService {
  private supabase: ReturnType<typeof createServerSupabase> | null = null;

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
   * Get user's complete progressive journey status
   */
  async getUserProgressiveJourney(userId: string): Promise<ProgressiveJourney> {
    try {
      const [
        currentStage,
        nextMilestone,
        upcomingTriggers,
        personalizedRecs,
        healthScore,
        timeline
      ] = await Promise.all([
        this.getCurrentStage(userId),
        this.getNextMilestone(userId),
        this.getUpcomingTriggers(userId),
        this.getPersonalizedRecommendations(userId),
        this.calculateJourneyHealthScore(userId),
        this.calculateTimeline(userId)
      ]);

      return {
        user_id: userId,
        current_stage: currentStage,
        next_milestone: nextMilestone,
        upcoming_triggers: upcomingTriggers,
        personalized_recommendations: personalizedRecs,
        journey_health_score: healthScore,
        estimated_completion_timeline: timeline
      };

    } catch (error) {
      console.error('Progressive journey error:', error);
      throw new Error('Failed to get progressive journey');
    }
  }

  /**
   * Process engagement trigger execution
   */
  async executeTrigger(
    userId: string, 
    triggerId: string
  ): Promise<{
    success: boolean;
    trigger_executed: boolean;
    user_response?: 'engaged' | 'dismissed' | 'no_response';
    next_triggers?: EngagementTrigger[];
  }> {
    const supabase = await this.getSupabase();

    try {
      // Log trigger execution
      await this.trackEngagementEvent(userId, 'trigger_executed', {
        trigger_id: triggerId,
        execution_time: new Date().toISOString()
      });

      // Get the trigger and mark as executed
      const trigger = await this.getTriggerById(triggerId);
      
      if (!trigger) {
        return {
          success: false,
          trigger_executed: false
        };
      }

      // Schedule follow-up triggers based on trigger type
      const nextTriggers = await this.scheduleFollowUpTriggers(userId, trigger);

      return {
        success: true,
        trigger_executed: true,
        next_triggers: nextTriggers
      };

    } catch (error) {
      console.error('Execute trigger error:', error);
      return {
        success: false,
        trigger_executed: false
      };
    }
  }

  /**
   * Update milestone progress and check for completions
   */
  async updateMilestoneProgress(
    userId: string,
    actionType: string,
    actionData: Record<string, any>
  ): Promise<{
    milestones_completed: MilestoneProgress[];
    rewards_granted: StageReward[];
    new_triggers_scheduled: EngagementTrigger[];
  }> {
    try {
      // Get current milestones
      const currentMilestones = await this.getUserMilestones(userId);
      
      // Check which milestones were completed by this action
      const completedMilestones = [];
      const rewardsGranted = [];
      const newTriggers = [];

      for (const milestone of currentMilestones) {
        if (!milestone.completed && this.checkMilestoneCompletion(milestone, actionType, actionData)) {
          // Mark milestone as completed
          milestone.completed = true;
          completedMilestones.push(milestone);

          // Process rewards
          const stageRewards = await this.processMilestoneRewards(userId, milestone);
          rewardsGranted.push(...stageRewards);

          // Schedule celebration and next steps
          const celebrationTriggers = await this.scheduleMilestoneCelebration(userId, milestone);
          newTriggers.push(...celebrationTriggers);
        }
      }

      // Track milestone updates
      if (completedMilestones.length > 0) {
        await this.trackEngagementEvent(userId, 'milestones_completed', {
          completed_milestones: completedMilestones.map(m => m.milestone_type),
          rewards_granted: rewardsGranted.length,
          action_trigger: actionType
        });
      }

      return {
        milestones_completed: completedMilestones,
        rewards_granted: rewardsGranted,
        new_triggers_scheduled: newTriggers
      };

    } catch (error) {
      console.error('Update milestone progress error:', error);
      return {
        milestones_completed: [],
        rewards_granted: [],
        new_triggers_scheduled: []
      };
    }
  }

  /**
   * Generate contextual engagement triggers based on user behavior
   */
  async generateContextualTriggers(
    userId: string,
    context: {
      current_collection_size: number;
      last_activity_date: string;
      engagement_level: EngagementLevel;
      recent_actions: string[];
    }
  ): Promise<EngagementTrigger[]> {
    const triggers: EngagementTrigger[] = [];
    const daysSinceLastActivity = this.calculateDaysSince(context.last_activity_date);

    // Re-engagement triggers for inactive users
    if (daysSinceLastActivity >= 7) {
      triggers.push({
        trigger_id: `reengagement_${userId}_${Date.now()}`,
        trigger_type: 'email',
        trigger_timing: 'immediate',
        content: {
          title: 'Your fragrance collection is waiting! 🌸',
          message: `Hi! You haven't visited your collection in ${daysSinceLastActivity} days. We've got some new recommendations that might interest you.`,
          call_to_action: 'View New Recommendations',
          personalized_elements: ['recent_recommendations', 'milestone_progress']
        },
        priority: 'high',
        expected_impact: 75
      });
    }

    // Collection growth triggers
    if (context.current_collection_size >= 3 && context.current_collection_size < 10) {
      triggers.push({
        trigger_id: `growth_${userId}_${Date.now()}`,
        trigger_type: 'in_app',
        trigger_timing: 'conditional',
        condition: 'user_visits_collection',
        content: {
          title: 'Complete your fragrance profile',
          message: 'Add 2 more fragrances to unlock detailed personality insights and better recommendations.',
          call_to_action: 'Get Recommendations',
          personalized_elements: ['scent_family_gaps', 'seasonal_suggestions']
        },
        priority: 'medium',
        expected_impact: 60
      });
    }

    // Engagement level progression triggers
    if (context.engagement_level === 'beginner' && context.current_collection_size >= 5) {
      triggers.push({
        trigger_id: `levelup_${userId}_${Date.now()}`,
        trigger_type: 'in_app',
        trigger_timing: 'immediate',
        content: {
          title: 'You\'re becoming a fragrance explorer! 🎯',
          message: 'Rate a few more fragrances to unlock advanced collection insights and community features.',
          call_to_action: 'Rate Fragrances',
          personalized_elements: ['unrated_items', 'rating_benefits']
        },
        priority: 'medium',
        expected_impact: 65
      });
    }

    // Social engagement triggers
    if (!context.recent_actions.includes('shared') && context.current_collection_size >= 8) {
      triggers.push({
        trigger_id: `social_${userId}_${Date.now()}`,
        trigger_type: 'in_app',
        trigger_timing: 'conditional',
        condition: 'collection_milestone_reached',
        content: {
          title: 'Share your amazing collection! ✨',
          message: 'Your collection has grown beautifully! Share it with friends and earn community recognition.',
          call_to_action: 'Share Collection',
          personalized_elements: ['collection_highlights', 'sharing_benefits']
        },
        priority: 'low',
        expected_impact: 40
      });
    }

    return triggers.sort((a, b) => {
      // Sort by priority and expected impact
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.expected_impact - a.expected_impact;
    });
  }

  /**
   * Schedule email engagement sequence
   */
  async scheduleEmailSequence(
    userId: string,
    sequenceType: 'onboarding' | 'reengagement' | 'milestone' | 'seasonal'
  ): Promise<{
    scheduled_emails: Array<{
      email_id: string;
      scheduled_for: string;
      email_type: string;
      personalization_data: Record<string, any>;
    }>;
    sequence_duration_days: number;
  }> {
    const supabase = await this.getSupabase();

    try {
      // Get user data for personalization
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: collection } = await supabase
        .from('user_collections')
        .select(`
          id,
          rating,
          created_at,
          fragrances!inner(
            name,
            scent_family,
            fragrance_brands!inner(name)
          )
        `)
        .eq('user_id', userId)
        .eq('collection_type', 'saved');

      // Generate email sequence based on type
      const emailSequence = this.generateEmailSequence(
        sequenceType, 
        userProfile, 
        collection || []
      );

      // Schedule emails (in production, this would integrate with email service)
      const scheduledEmails = emailSequence.map((email, index) => {
        const scheduleDate = new Date();
        scheduleDate.setDate(scheduleDate.getDate() + email.delay_days);

        return {
          email_id: `${sequenceType}_${index + 1}_${userId}`,
          scheduled_for: scheduleDate.toISOString(),
          email_type: email.template,
          personalization_data: {
            user_name: userProfile?.first_name || 'there',
            collection_size: collection?.length || 0,
            ...email.personalization
          }
        };
      });

      // Track sequence scheduling
      await this.trackEngagementEvent(userId, 'email_sequence_scheduled', {
        sequence_type: sequenceType,
        email_count: scheduledEmails.length,
        total_duration_days: Math.max(...emailSequence.map(e => e.delay_days))
      });

      return {
        scheduled_emails: scheduledEmails,
        sequence_duration_days: Math.max(...emailSequence.map(e => e.delay_days))
      };

    } catch (error) {
      console.error('Schedule email sequence error:', error);
      return {
        scheduled_emails: [],
        sequence_duration_days: 0
      };
    }
  }

  // Private implementation methods

  private async getCurrentStage(userId: string): Promise<ProgressiveStage> {
    const supabase = await this.getSupabase();

    try {
      // Get collection size and engagement data
      const { data: collection } = await supabase
        .from('user_collections')
        .select('id, rating', { count: 'exact' })
        .eq('user_id', userId)
        .eq('collection_type', 'saved');

      const { data: engagement } = await supabase
        .from('user_engagement_scores')
        .select('*')
        .eq('user_id', userId)
        .single();

      const collectionSize = collection?.length || 0;
      const ratedItems = collection?.filter((item: any) => item.rating).length || 0;

      // Define progressive stages
      const stages: ProgressiveStage[] = [
        {
          stage_id: 'discovery',
          stage_name: 'Discovery',
          description: 'Build your first fragrance collection',
          target_collection_size: 5,
          expected_duration_days: 7,
          completion_criteria: {
            min_collection_size: 5,
            min_rated_items: 1,
            min_engagement_actions: 3
          },
          rewards: [
            {
              reward_type: 'insights' as const,
              reward_value: 'basic_insights',
              reward_description: 'Unlock basic collection insights',
              auto_grant: true
            }
          ],
          current_progress: 0,
          completed: false
        },
        {
          stage_id: 'exploration',
          stage_name: 'Exploration',
          description: 'Diversify and refine your collection',
          target_collection_size: 15,
          expected_duration_days: 21,
          completion_criteria: {
            min_collection_size: 15,
            min_rated_items: 8,
            min_engagement_actions: 10,
            required_scent_families: 3
          },
          rewards: [
            {
              reward_type: 'feature_unlock' as const,
              reward_value: 'advanced_analytics',
              reward_description: 'Advanced analytics and insights',
              auto_grant: true
            }
          ],
          current_progress: 0,
          completed: false
        },
        {
          stage_id: 'curation',
          stage_name: 'Curation',
          description: 'Become a fragrance connoisseur',
          target_collection_size: 50,
          expected_duration_days: 90,
          completion_criteria: {
            min_collection_size: 50,
            min_rated_items: 30,
            min_engagement_actions: 25,
            required_scent_families: 5,
            optional_social_actions: 3
          },
          rewards: [
            {
              reward_type: 'badge' as const,
              reward_value: 'fragrance_connoisseur',
              reward_description: 'Fragrance Connoisseur badge',
              auto_grant: true
            }
          ],
          current_progress: 0,
          completed: false
        }
      ];

      // Determine current stage
      let currentStage = stages[0]; // Default to discovery
      
      for (const stage of stages) {
        const progress = this.calculateStageProgress(stage, {
          collection_size: collectionSize,
          rated_items: ratedItems,
          engagement_score: engagement?.engagement_score_raw || 0
        });

        if (progress.current_progress < 100) {
          currentStage = {
            ...stage,
            current_progress: progress.current_progress,
            completed: false
          };
          break;
        }
      }

      // If all stages completed, user is in "mastery" stage
      if (currentStage === stages[stages.length - 1] && currentStage.current_progress >= 100) {
        currentStage = {
          stage_id: 'mastery',
          stage_name: 'Mastery',
          description: 'Fragrance expert and community leader',
          target_collection_size: 100,
          expected_duration_days: 365,
          completion_criteria: {
            min_collection_size: 100,
            min_rated_items: 75,
            min_engagement_actions: 100,
            required_scent_families: 8,
            optional_social_actions: 10
          },
          rewards: [],
          current_progress: Math.min(100, (collectionSize / 100) * 100),
          completed: collectionSize >= 100
        };
      }

      return currentStage;

    } catch (error) {
      console.error('Get current stage error:', error);
      // Return default stage
      return {
        stage_id: 'discovery',
        stage_name: 'Discovery',
        description: 'Build your first fragrance collection',
        target_collection_size: 5,
        expected_duration_days: 7,
        completion_criteria: {
          min_collection_size: 5,
          min_rated_items: 1,
          min_engagement_actions: 3
        },
        rewards: [],
        current_progress: 0,
        completed: false
      };
    }
  }

  private async getNextMilestone(userId: string): Promise<MilestoneProgress | null> {
    const insights = await collectionAnalytics.getCollectionInsights(userId);
    
    // Get the next incomplete milestone
    const milestones = insights.engagement_metrics.milestone_progress;
    const nextMilestone = milestones.find(m => !m.completed);
    
    return nextMilestone || null;
  }

  private async getUpcomingTriggers(userId: string): Promise<EngagementTrigger[]> {
    const supabase = await this.getSupabase();

    try {
      // Get user context for trigger generation
      const { data: collection } = await supabase
        .from('user_collections')
        .select('id, created_at, rating')
        .eq('user_id', userId)
        .eq('collection_type', 'saved');

      const { data: lastActivity } = await supabase
        .from('collection_analytics_events')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const context = {
        current_collection_size: collection?.length || 0,
        last_activity_date: lastActivity?.created_at || new Date().toISOString(),
        engagement_level: 'beginner' as EngagementLevel, // Would get from engagement table
        recent_actions: [] // Would analyze recent events
      };

      return await this.generateContextualTriggers(userId, context);

    } catch (error) {
      console.warn('Get upcoming triggers error:', error);
      return [];
    }
  }

  private async getPersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendation[]> {
    // This would integrate with the existing recommendation engine
    // For now, return structured recommendations
    
    return [
      {
        recommendation_id: `prog_rec_${userId}_1`,
        fragrance_id: 'example-fragrance-1',
        fragrance_name: 'Example Fragrance',
        brand_name: 'Example Brand',
        match_score: 89,
        reasoning: ['Matches your scent family preferences', 'Seasonal fit for current time'],
        recommendation_source: 'progressive_engine',
        priority_score: 85,
        timing_optimal: true,
        category_fit: 'exploration'
      }
    ];
  }

  private async calculateJourneyHealthScore(userId: string): Promise<number> {
    const supabase = await this.getSupabase();

    try {
      // Get various health indicators
      const { data: collection } = await supabase
        .from('user_collections')
        .select('rating, created_at')
        .eq('user_id', userId);

      const { data: recentActivity } = await supabase
        .from('collection_analytics_events')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate health score components
      const collectionSize = collection?.length || 0;
      const ratedItems = collection?.filter(item => item.rating).length || 0;
      const recentActivityCount = recentActivity?.length || 0;

      // Health score calculation (0-100)
      const sizeScore = Math.min(30, collectionSize * 3); // Up to 30 points for collection size
      const ratingScore = Math.min(25, (ratedItems / Math.max(collectionSize, 1)) * 25); // Up to 25 points for rating completion
      const activityScore = Math.min(25, recentActivityCount * 5); // Up to 25 points for recent activity
      const consistencyScore = this.calculateConsistencyScore(collection || []); // Up to 20 points for consistency

      return Math.round(sizeScore + ratingScore + activityScore + consistencyScore);

    } catch (error) {
      console.warn('Journey health score calculation error:', error);
      return 50; // Default moderate health score
    }
  }

  private async calculateTimeline(userId: string): Promise<EstimatedTimeline> {
    // Simplified timeline calculation
    const currentStage = await this.getCurrentStage(userId);
    const progressRemaining = 100 - currentStage.current_progress;
    const daysPerPercent = currentStage.expected_duration_days / 100;
    const daysToCompletion = Math.ceil(progressRemaining * daysPerPercent);

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysToCompletion);

    return {
      days_to_next_milestone: daysToCompletion,
      estimated_completion_date: completionDate.toISOString(),
      confidence_level: 'medium',
      factors_affecting_timeline: [
        'Collection building frequency',
        'Rating and engagement activity',
        'Seasonal fragrance preferences'
      ]
    };
  }

  // Helper methods

  private calculateStageProgress(
    stage: ProgressiveStage, 
    userMetrics: {
      collection_size: number;
      rated_items: number;
      engagement_score: number;
    }
  ): { current_progress: number; completion_factors: Record<string, number> } {
    const criteria = stage.completion_criteria;
    
    const sizeProgress = Math.min(100, (userMetrics.collection_size / criteria.min_collection_size) * 100);
    const ratingProgress = Math.min(100, (userMetrics.rated_items / criteria.min_rated_items) * 100);
    const engagementProgress = Math.min(100, (userMetrics.engagement_score / criteria.min_engagement_actions) * 20);

    // Weighted average progress
    const currentProgress = Math.round((sizeProgress * 0.5) + (ratingProgress * 0.3) + (engagementProgress * 0.2));

    return {
      current_progress: currentProgress,
      completion_factors: {
        collection_size: sizeProgress,
        rated_items: ratingProgress,
        engagement: engagementProgress
      }
    };
  }

  private checkMilestoneCompletion(
    milestone: MilestoneProgress,
    actionType: string,
    actionData: Record<string, any>
  ): boolean {
    // Check if the recent action completed a milestone
    return milestone.current_progress >= milestone.target;
  }

  private async processMilestoneRewards(
    userId: string,
    milestone: MilestoneProgress
  ): Promise<StageReward[]> {
    // Process and grant milestone rewards
    const rewards: StageReward[] = [
      {
        reward_type: 'engagement_points',
        reward_value: 200,
        reward_description: `Milestone reward: ${milestone.milestone_type}`,
        auto_grant: true
      }
    ];

    // Track reward granting
    await this.trackEngagementEvent(userId, 'milestone_reward_granted', {
      milestone_type: milestone.milestone_type,
      rewards: rewards.length
    });

    return rewards;
  }

  private async scheduleMilestoneCelebration(
    userId: string,
    milestone: MilestoneProgress
  ): Promise<EngagementTrigger[]> {
    return [
      {
        trigger_id: `celebration_${milestone.milestone_type}_${userId}`,
        trigger_type: 'in_app',
        trigger_timing: 'immediate',
        content: {
          title: `🎉 Milestone Achieved: ${milestone.milestone_type}!`,
          message: `Congratulations! You've reached a significant milestone in your fragrance journey.`,
          call_to_action: 'View Achievement',
          personalized_elements: ['milestone_details', 'next_goals']
        },
        priority: 'high',
        expected_impact: 90
      }
    ];
  }

  private generateEmailSequence(
    sequenceType: string,
    userProfile: any,
    collection: any[]
  ): Array<{
    template: string;
    delay_days: number;
    personalization: Record<string, any>;
  }> {
    switch (sequenceType) {
      case 'onboarding':
        return [
          {
            template: 'welcome_day1',
            delay_days: 1,
            personalization: {
              collection_size: collection.length,
              next_recommendations: 3
            }
          },
          {
            template: 'complete_profile_week1',
            delay_days: 7,
            personalization: {
              missing_ratings: collection.filter(item => !item.rating).length,
              suggested_additions: 3
            }
          },
          {
            template: 'monthly_insights',
            delay_days: 30,
            personalization: {
              collection_growth: collection.length,
              insights_available: true
            }
          }
        ];

      case 'reengagement':
        return [
          {
            template: 'we_miss_you',
            delay_days: 0,
            personalization: {
              last_fragrance: collection[0]?.fragrances?.name || 'your favorites',
              new_recommendations: 3
            }
          }
        ];

      default:
        return [];
    }
  }

  private calculateConsistencyScore(collection: any[]): number {
    if (collection.length < 3) return 0;

    // Calculate consistency in adding and rating items
    const addingConsistency = this.calculateAddingConsistency(collection);
    const ratingConsistency = this.calculateRatingConsistency(collection);

    return Math.round((addingConsistency + ratingConsistency) / 2);
  }

  private calculateAddingConsistency(collection: any[]): number {
    // Measure how regularly user adds to collection
    const dates = collection.map(item => new Date(item.created_at).getTime()).sort();
    
    if (dates.length < 2) return 10; // Default score for new users

    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push(dates[i] - dates[i - 1]);
    }

    // Calculate coefficient of variation (lower = more consistent)
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgInterval;

    // Convert to score (lower CV = higher score)
    return Math.max(0, Math.min(20, 20 - (cv * 10)));
  }

  private calculateRatingConsistency(collection: any[]): number {
    const ratedItems = collection.filter(item => item.rating);
    const ratingRate = collection.length > 0 ? ratedItems.length / collection.length : 0;
    
    return Math.round(ratingRate * 20); // Up to 20 points
  }

  private calculateDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async getUserMilestones(userId: string): Promise<MilestoneProgress[]> {
    const insights = await collectionAnalytics.getCollectionInsights(userId);
    return insights.engagement_metrics.milestone_progress;
  }

  private async getTriggerById(triggerId: string): Promise<EngagementTrigger | null> {
    // In production, this would fetch from database
    // For now, return null as triggers are generated dynamically
    return null;
  }

  private async scheduleFollowUpTriggers(
    userId: string, 
    executedTrigger: EngagementTrigger
  ): Promise<EngagementTrigger[]> {
    // Generate follow-up triggers based on the executed trigger
    return [];
  }

  private async trackEngagementEvent(
    userId: string,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        user_id: userId,
        event_type: eventType as AnalyticsEventType,
        event_data: eventData
      };

      await collectionAnalytics.trackEvent(event);
    } catch (error) {
      console.warn('Track engagement event error:', error);
    }
  }
}

// Export singleton instance
export const progressiveEngagementService = new ProgressiveEngagementService();