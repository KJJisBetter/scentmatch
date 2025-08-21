'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase';
import {
  FeedbackProcessor,
  RecommendationCache,
  createThompsonSamplingService,
  type FeedbackEvent,
  type BanditFeedbackEvent,
} from '@/lib/ai-sdk/feedback-processor';

export interface FeedbackParams {
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
  confidence?: number;
  reason?: string;
  recommendation_id?: string;
  source?: string;
  position?: number;
  context?: Record<string, any>;
  algorithm_used?: string;
  session_id?: string;
  time_to_action_seconds?: number;
  time_spent_before_rating?: number;
  previous_interactions?: number;
}

export interface FeedbackResult {
  success: boolean;
  feedback_processed: boolean;
  feedback_id?: string;
  learning_impact?: number;
  preference_update?: {
    preferences_updated: boolean;
    embedding_updated: boolean;
    confidence_change: number;
    learning_weight: number;
  };
  recommendation_refresh?: {
    cache_invalidated: boolean;
    new_recommendations_available: boolean;
    refresh_recommended: boolean;
  };
  feedback_quality?: {
    reliability_score: number;
    quality_level: string;
    trust_factors: any;
  };
  bandit_optimization?: {
    algorithm_updated: boolean;
    new_success_rate: number;
    bandit_learning_impact: number;
    processing_time_ms: number;
  } | null;
  user_message: string;
  metadata?: {
    processing_time_ms: number;
    ai_learning_applied: boolean;
    bandit_learning_applied: boolean;
    preference_adjustment_type: any;
  };
  error?: string;
}

/**
 * Server Action: Process recommendation feedback
 *
 * Converts POST /api/recommendations/feedback functionality to Server Action
 * AI-enhanced feedback processing with real-time preference learning,
 * embedding updates, and recommendation cache invalidation.
 */
export async function processFeedback(
  params: FeedbackParams
): Promise<FeedbackResult> {
  const startTime = Date.now();

  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        feedback_processed: false,
        user_message: 'Authentication required',
        error: 'Authentication required',
      };
    }

    // Validate required fields
    if (!params.fragrance_id || !params.feedback_type) {
      return {
        success: false,
        feedback_processed: false,
        user_message: 'Missing required feedback information',
        error: 'fragrance_id and feedback_type are required',
      };
    }

    // Validate feedback type
    const validFeedbackTypes = [
      'like',
      'dislike',
      'rating',
      'purchase_intent',
      'love',
      'maybe',
      'dismiss',
    ];

    if (!validFeedbackTypes.includes(params.feedback_type)) {
      return {
        success: false,
        feedback_processed: false,
        user_message: 'Invalid feedback type',
        error: 'Invalid feedback type',
      };
    }

    // Initialize AI feedback processor
    const feedbackProcessor = new FeedbackProcessor({
      supabase,
      enableImplicitFeedback: true,
      enableExplicitFeedback: true,
      learningRate: 0.1,
      feedbackDecayDays: 90,
    });

    const recommendationCache = new RecommendationCache({
      supabase,
      defaultTTL: 3600,
      enableRealTimeInvalidation: true,
    });

    // Create feedback event
    const feedbackEvent: FeedbackEvent = {
      user_id: user.id,
      fragrance_id: params.fragrance_id,
      feedback_type: params.feedback_type,
      rating_value: params.rating_value,
      confidence: params.confidence || 0.8,
      reason: params.reason,
      context: {
        recommendation_id: params.recommendation_id,
        recommendation_source: params.source || 'unknown',
        recommendation_position: params.position,
        ...params.context,
      },
    };

    // Process explicit feedback through AI system
    const processingResult =
      await feedbackProcessor.processExplicitFeedback(feedbackEvent);

    // Process Thompson Sampling bandit feedback
    let banditProcessingResult = null;
    try {
      const thompsonService = createThompsonSamplingService(supabase);

      // Convert to bandit feedback format
      const banditFeedback: BanditFeedbackEvent = {
        user_id: user.id,
        fragrance_id: params.fragrance_id,
        algorithm_used: params.algorithm_used || 'hybrid', // Should be provided by frontend
        action: mapFeedbackTypeToAction(params.feedback_type),
        action_value: params.rating_value,
        immediate_reward: 0, // Will be calculated by processor
        contextual_factors: extractContextualFactors(params.context || {}),
        session_id: params.session_id || `session_${Date.now()}`,
        time_to_action_seconds: params.time_to_action_seconds,
      };

      banditProcessingResult =
        await thompsonService.processFeedback(banditFeedback);
    } catch (banditError) {
      console.warn(
        'Thompson Sampling feedback processing failed:',
        banditError
      );
    }

    // Invalidate recommendation cache if significant feedback
    let cacheInvalidated = false;
    if (processingResult.learning_impact > 0.1) {
      try {
        const invalidationResult =
          await recommendationCache.invalidateUserCache(user.id, {
            type: 'feedback_received',
            fragrance_id: params.fragrance_id,
            rating: params.rating_value,
            impact_level:
              processingResult.learning_impact > 0.2 ? 'high' : 'medium',
          });

        cacheInvalidated = invalidationResult.invalidated;
      } catch (cacheError) {
        console.warn(
          'Cache invalidation failed:',
          cacheError instanceof Error ? cacheError.message : cacheError
        );
      }
    }

    // Store interaction in new AI system format
    const { error: interactionError } = await (supabase as any)
      .from('user_interactions')
      .insert({
        user_id: user.id,
        fragrance_id: params.fragrance_id,
        interaction_type: params.feedback_type,
        interaction_value:
          params.rating_value ||
          (params.feedback_type === 'like'
            ? 1
            : params.feedback_type === 'dislike'
              ? 0
              : 0.5),
        interaction_context: {
          recommendation_context: params.context || {},
          feedback_source: 'explicit',
          recommendation_id: params.recommendation_id,
          processing_result: processingResult,
        },
      });

    if (interactionError) {
      console.warn('Error storing interaction:', interactionError.message);
    }

    // Assess feedback quality for learning weight
    const feedbackQuality = await feedbackProcessor.assessFeedbackQuality({
      user_id: user.id,
      fragrance_id: params.fragrance_id,
      feedback_type: params.feedback_type,
      rating_value: params.rating_value,
      time_spent_before_rating: params.time_spent_before_rating || 30,
      previous_interactions: params.previous_interactions || 0,
    });

    // Revalidate paths that use recommendation data
    if (cacheInvalidated) {
      revalidatePath('/recommendations');
      revalidatePath('/dashboard');
      revalidatePath('/quiz/results');
    }

    const response: FeedbackResult = {
      success: true,
      feedback_processed: true,
      feedback_id: `feedback_${Date.now()}`,
      learning_impact: processingResult.learning_impact,
      preference_update: {
        preferences_updated: processingResult.preference_update_applied,
        embedding_updated: processingResult.updated_embedding,
        confidence_change: processingResult.learning_impact * 0.05,
        learning_weight: feedbackQuality.learning_weight,
      },
      recommendation_refresh: {
        cache_invalidated: cacheInvalidated,
        new_recommendations_available: cacheInvalidated,
        refresh_recommended: processingResult.learning_impact > 0.15,
      },
      feedback_quality: {
        reliability_score: feedbackQuality.reliability_score,
        quality_level: feedbackQuality.quality_level,
        trust_factors: feedbackQuality.trust_factors,
      },
      // Thompson Sampling bandit results
      bandit_optimization: banditProcessingResult
        ? {
            algorithm_updated: banditProcessingResult.algorithm_updated,
            new_success_rate: banditProcessingResult.new_success_rate,
            bandit_learning_impact: banditProcessingResult.learning_impact,
            processing_time_ms: banditProcessingResult.processing_time_ms,
          }
        : null,
      user_message: getFeedbackMessage(params.feedback_type),
      metadata: {
        processing_time_ms: Date.now() - startTime,
        ai_learning_applied: true,
        bandit_learning_applied: banditProcessingResult?.processed || false,
        preference_adjustment_type: processingResult.preference_adjustment,
      },
    };

    return response;
  } catch (error) {
    console.error('Error processing feedback:', error);
    unstable_rethrow(error);

    return {
      success: false,
      feedback_processed: false,
      user_message: 'Failed to process feedback',
      error: 'Failed to process feedback',
      metadata: {
        processing_time_ms: Date.now() - startTime,
        ai_learning_applied: false,
        bandit_learning_applied: false,
        preference_adjustment_type: null,
      },
    };
  }
}

// Get user-friendly feedback message
function getFeedbackMessage(feedbackType: string): string {
  const messages = {
    like: "Great! We'll show you more fragrances like this.",
    dislike: "Noted! We'll avoid similar recommendations.",
    love: 'Excellent! This will significantly improve your matches.',
    maybe: "Thanks! We'll keep this in mind for future suggestions.",
    dismiss: "Understood! This won't appear in your recommendations again.",
    sample_request: 'Perfect! Sample interest is a strong learning signal.',
    detailed_rating:
      'Thank you for the detailed feedback! This helps us understand your preferences better.',
  };

  return (
    messages[feedbackType as keyof typeof messages] ||
    'Thanks for your feedback!'
  );
}

// Get current season for seasonal relevance
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

// Map feedback types to bandit actions
function mapFeedbackTypeToAction(
  feedbackType: string
): BanditFeedbackEvent['action'] {
  const actionMap: Record<string, BanditFeedbackEvent['action']> = {
    like: 'click',
    dislike: 'ignore',
    love: 'add_to_collection',
    maybe: 'view',
    dismiss: 'ignore',
    sample_request: 'purchase_intent',
    detailed_rating: 'rating',
  };

  return actionMap[feedbackType] || 'view';
}

// Extract contextual factors from request context
function extractContextualFactors(context: any): any {
  return {
    time_of_day: context.time_of_day || getTimeOfDay(),
    season: context.season || getCurrentSeason().toLowerCase(),
    device_type: context.device_type || 'desktop',
    user_type: context.user_type || 'intermediate',
    session_duration: context.session_duration,
    interaction_velocity: context.interaction_velocity,
    occasion: context.occasion,
    location_type: context.location_type,
  };
}

// Get current time of day
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}
