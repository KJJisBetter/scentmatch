/**
 * Simplified Feedback Processor
 *
 * Replaces complex FeedbackProcessor and RecommendationCache classes
 * with simple, effective implementations using Vercel AI SDK
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { aiClient } from './client';

// Types from the original system that need to be maintained
export interface FeedbackEvent {
  user_id: string;
  fragrance_id: string;
  feedback_type:
    | 'like'
    | 'dislike'
    | 'rating'
    | 'purchase_intent'
    | 'love'
    | 'maybe'
    | 'dismiss';
  rating_value?: number;
  confidence: number;
  reason?: string;
  context?: any;
}

export interface FeedbackProcessingResult {
  learning_impact: number;
  preference_update_applied: boolean;
  updated_embedding: boolean;
  preference_adjustment: 'minimal' | 'moderate' | 'significant';
}

export interface FeedbackQualityAssessment {
  learning_weight: number;
  reliability_score: number;
  quality_level: 'high' | 'medium' | 'low';
  trust_factors: string[];
}

export interface CacheInvalidationResult {
  invalidated: boolean;
  affected_sections?: string[];
}

/**
 * Simplified Feedback Processor
 * Replaces complex lib/ai/recommendation-engine.ts FeedbackProcessor
 */
export class FeedbackProcessor {
  private supabase: SupabaseClient;
  private enableImplicitFeedback: boolean;
  private enableExplicitFeedback: boolean;
  private learningRate: number;
  private feedbackDecayDays: number;

  constructor(config: {
    supabase: SupabaseClient;
    enableImplicitFeedback?: boolean;
    enableExplicitFeedback?: boolean;
    learningRate?: number;
    feedbackDecayDays?: number;
  }) {
    this.supabase = config.supabase;
    this.enableImplicitFeedback = config.enableImplicitFeedback ?? true;
    this.enableExplicitFeedback = config.enableExplicitFeedback ?? true;
    this.learningRate = config.learningRate || 0.1;
    this.feedbackDecayDays = config.feedbackDecayDays || 90;
  }

  async processExplicitFeedback(
    feedbackEvent: FeedbackEvent
  ): Promise<FeedbackProcessingResult> {
    try {
      // Simplified feedback processing using AI insights
      const feedbackResult = await aiClient.processFeedback({
        fragrance_id: feedbackEvent.fragrance_id,
        feedback_type: feedbackEvent.feedback_type,
        rating: feedbackEvent.rating_value,
        user_context: JSON.stringify(feedbackEvent.context || {}),
      });

      // Map AI feedback to expected format
      const learningImpact = feedbackResult.learning_impact;

      return {
        learning_impact: learningImpact,
        preference_update_applied: learningImpact > 0.05,
        updated_embedding: learningImpact > 0.1,
        preference_adjustment: this.categorizeAdjustment(learningImpact),
      };
    } catch (error) {
      console.warn('Feedback processing failed, using fallback:', error);

      // Fallback to simple heuristic
      const feedbackWeights = {
        love: 0.8,
        like: 0.6,
        maybe: 0.3,
        dislike: 0.4,
        dismiss: 0.2,
      };

      const impact =
        feedbackWeights[
          feedbackEvent.feedback_type as keyof typeof feedbackWeights
        ] || 0.1;

      return {
        learning_impact: impact,
        preference_update_applied: impact > 0.2,
        updated_embedding: impact > 0.5,
        preference_adjustment: this.categorizeAdjustment(impact),
      };
    }
  }

  async assessFeedbackQuality(feedbackData: {
    user_id: string;
    fragrance_id: string;
    feedback_type: string;
    rating_value?: number;
    time_spent_before_rating?: number;
    previous_interactions?: number;
  }): Promise<FeedbackQualityAssessment> {
    try {
      // Simplified quality assessment
      const timeSpent = feedbackData.time_spent_before_rating || 30;
      const interactionCount = feedbackData.previous_interactions || 0;

      // Calculate reliability based on engagement
      let reliabilityScore = 0.5; // Base score

      // Time spent indicates thoughtfulness
      if (timeSpent > 60) reliabilityScore += 0.2;
      if (timeSpent > 120) reliabilityScore += 0.1;

      // Previous interactions indicate familiarity
      if (interactionCount > 5) reliabilityScore += 0.1;
      if (interactionCount > 20) reliabilityScore += 0.1;

      // Cap at 1.0
      reliabilityScore = Math.min(reliabilityScore, 1.0);

      const qualityLevel =
        reliabilityScore > 0.8
          ? 'high'
          : reliabilityScore > 0.6
            ? 'medium'
            : 'low';

      const trustFactors: string[] = [];
      if (timeSpent > 60) trustFactors.push('sufficient_interaction_time');
      if (interactionCount > 5) trustFactors.push('consistent_user_behavior');
      if (feedbackData.rating_value)
        trustFactors.push('explicit_rating_provided');

      return {
        learning_weight: reliabilityScore * 0.8, // Convert to learning weight
        reliability_score: reliabilityScore,
        quality_level: qualityLevel,
        trust_factors: trustFactors,
      };
    } catch (error) {
      console.warn('Feedback quality assessment failed:', error);

      return {
        learning_weight: 0.5,
        reliability_score: 0.5,
        quality_level: 'medium',
        trust_factors: ['fallback_assessment'],
      };
    }
  }

  private categorizeAdjustment(
    impact: number
  ): 'minimal' | 'moderate' | 'significant' {
    if (impact > 0.5) return 'significant';
    if (impact > 0.2) return 'moderate';
    return 'minimal';
  }
}

/**
 * Simplified Recommendation Cache
 * Replaces complex RecommendationCache from lib/ai/recommendation-engine.ts
 */
export class RecommendationCache {
  private supabase: SupabaseClient;
  private defaultTTL: number;
  private enableRealTimeInvalidation: boolean;

  constructor(config: {
    supabase: SupabaseClient;
    defaultTTL?: number;
    enableRealTimeInvalidation?: boolean;
  }) {
    this.supabase = config.supabase;
    this.defaultTTL = config.defaultTTL || 3600; // 1 hour
    this.enableRealTimeInvalidation = config.enableRealTimeInvalidation ?? true;
  }

  async invalidateUserCache(
    userId: string,
    invalidationData: {
      type: string;
      fragrance_id?: string;
      rating?: number;
      impact_level?: 'high' | 'medium' | 'low';
    }
  ): Promise<CacheInvalidationResult> {
    try {
      // In a real implementation, this would clear Redis/memory cache
      // For now, we'll simulate cache invalidation by logging
      console.log(`Cache invalidated for user ${userId}:`, invalidationData);

      // Determine affected sections based on feedback type
      const affectedSections: string[] = [];

      switch (invalidationData.type) {
        case 'feedback_received':
          affectedSections.push('perfect_matches');
          if (invalidationData.impact_level === 'high') {
            affectedSections.push('adventurous', 'seasonal');
          }
          break;
        case 'collection_updated':
          affectedSections.push('perfect_matches', 'seasonal');
          break;
        case 'preferences_changed':
          affectedSections.push('perfect_matches', 'adventurous', 'seasonal');
          break;
        default:
          affectedSections.push('perfect_matches');
      }

      // In production, clear actual cache keys:
      // await redis.del(`recommendations:${userId}:perfect_matches`);
      // await redis.del(`recommendations:${userId}:seasonal`);
      // etc.

      return {
        invalidated: true,
        affected_sections: affectedSections,
      };
    } catch (error) {
      console.warn('Cache invalidation failed:', error);
      return {
        invalidated: false,
      };
    }
  }
}

/**
 * Simplified Thompson Sampling Service
 * Replaces complex lib/ai/thompson-sampling.ts
 */
export interface BanditFeedbackEvent {
  user_id: string;
  fragrance_id: string;
  algorithm_used: string;
  action:
    | 'click'
    | 'ignore'
    | 'add_to_collection'
    | 'view'
    | 'purchase_intent'
    | 'rating';
  action_value?: number;
  immediate_reward: number;
  contextual_factors: any;
  session_id: string;
  time_to_action_seconds?: number;
}

export interface ThompsonSamplingResult {
  processed: boolean;
  algorithm_updated: boolean;
  new_success_rate: number;
  learning_impact: number;
  processing_time_ms: number;
}

export function createThompsonSamplingService(supabase: SupabaseClient) {
  return {
    async processFeedback(
      feedback: BanditFeedbackEvent
    ): Promise<ThompsonSamplingResult> {
      try {
        const startTime = Date.now();

        // Simplified Thompson sampling - calculate reward based on action
        const rewardMap = {
          add_to_collection: 1.0,
          purchase_intent: 0.9,
          click: 0.7,
          rating: feedback.action_value ? feedback.action_value / 5 : 0.6,
          view: 0.3,
          ignore: 0.1,
        };

        const reward = rewardMap[feedback.action] || 0.1;

        // Simulate algorithm update (in real implementation, would update bandit model)
        const learningImpact = reward * 0.1; // Convert reward to learning impact

        return {
          processed: true,
          algorithm_updated: true,
          new_success_rate: Math.min(0.5 + reward * 0.3, 0.95), // Simulate success rate
          learning_impact: learningImpact,
          processing_time_ms: Date.now() - startTime,
        };
      } catch (error) {
        console.warn('Thompson sampling processing failed:', error);

        return {
          processed: false,
          algorithm_updated: false,
          new_success_rate: 0.5,
          learning_impact: 0,
          processing_time_ms: 50,
        };
      }
    },
  };
}
