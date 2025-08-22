'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  FeedbackProcessor,
  RecommendationCache,
  createThompsonSamplingService,
  type FeedbackEvent,
  type BanditFeedbackEvent,
} from '@/lib/ai-sdk/feedback-processor';
import {
  FeedbackParams,
  FeedbackResult,
  FeedbackParamsSchema,
  validateFeedbackParams,
} from '@/lib/schemas/entities';

// Export types from schemas for backward compatibility
export type { 
  FeedbackParams,
  FeedbackResult,
};

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
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        feedback_processed: false,
        user_message: 'Authentication required',
        error: 'Authentication required',
      };
    }

    // Validate input using Zod schema
    const validation = validateFeedbackParams(params);
    if (!validation.success) {
      return {
        success: false,
        feedback_processed: false,
        user_message: validation.error!,
        error: validation.error,
      };
    }

    const validatedParams = validation.data!;

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

    // Create feedback event using validated parameters
    const feedbackEvent: FeedbackEvent = {
      user_id: user.id,
      fragrance_id: validatedParams.fragrance_id,
      feedback_type: validatedParams.feedback_type,
      rating_value: validatedParams.rating_value,
      confidence: validatedParams.confidence,
      reason: validatedParams.reason,
      context: {
        recommendation_id: validatedParams.recommendation_id,
        recommendation_source: validatedParams.source || 'unknown',
        recommendation_position: validatedParams.position,
        ...validatedParams.context,
      },
    };

    // Process explicit feedback through AI system
    const processingResult =
      await feedbackProcessor.processExplicitFeedback(feedbackEvent);

    // Process Thompson Sampling bandit feedback
    let banditProcessingResult = null;
    try {
      const thompsonService = createThompsonSamplingService(supabase);

      // Convert to bandit feedback format using validated parameters
      const banditFeedback: BanditFeedbackEvent = {
        user_id: user.id,
        fragrance_id: validatedParams.fragrance_id,
        algorithm_used: validatedParams.algorithm_used || 'hybrid', // Should be provided by frontend
        action: mapFeedbackTypeToAction(validatedParams.feedback_type),
        action_value: validatedParams.rating_value,
        immediate_reward: 0, // Will be calculated by processor
        contextual_factors: extractContextualFactors(validatedParams.context || {}),
        session_id: validatedParams.session_id || `session_${Date.now()}`,
        time_to_action_seconds: validatedParams.time_to_action_seconds,
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
            fragrance_id: validatedParams.fragrance_id,
            rating: validatedParams.rating_value,
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

    // Store interaction in new AI system format using validated parameters
    const { error: interactionError } = await supabase
      .from('user_interactions')
      .insert({
        user_id: user.id,
        fragrance_id: validatedParams.fragrance_id,
        interaction_type: validatedParams.feedback_type,
        interaction_value:
          validatedParams.rating_value ||
          (validatedParams.feedback_type === 'like'
            ? 1
            : validatedParams.feedback_type === 'dislike'
              ? 0
              : 0.5),
        interaction_context: {
          recommendation_context: validatedParams.context || {},
          feedback_source: 'explicit',
          recommendation_id: validatedParams.recommendation_id,
          processing_result: processingResult,
        },
      });

    if (interactionError) {
      console.warn('Error storing interaction:', interactionError.message);
    }

    // Assess feedback quality for learning weight using validated parameters
    const feedbackQuality = await feedbackProcessor.assessFeedbackQuality({
      user_id: user.id,
      fragrance_id: validatedParams.fragrance_id,
      feedback_type: validatedParams.feedback_type,
      rating_value: validatedParams.rating_value,
      time_spent_before_rating: validatedParams.time_spent_before_rating || 30,
      previous_interactions: validatedParams.previous_interactions || 0,
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
      user_message: getFeedbackMessage(validatedParams.feedback_type),
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

/**
 * Simplified Server Action: Submit Recommendation Feedback
 * 
 * Clean, simple interface for submitting recommendation feedback.
 * This wraps the comprehensive processFeedback function with a 
 * simplified interface that matches the API specification requirements.
 * 
 * Replaces POST /api/recommendations/feedback API route.
 */
export async function submitRecommendationFeedback(
  recommendationId: string,
  feedback: {
    rating: number;
    helpful: boolean;
    notes?: string;
    feedback_type?: 'like' | 'dislike' | 'love' | 'maybe' | 'dismiss';
    confidence?: number;
    time_to_feedback_seconds?: number;
    context?: Record<string, any>;
  }
): Promise<{
  success: boolean;
  error?: string;
  feedback_id?: string;
  learning_applied: boolean;
  recommendations_refreshed: boolean;
  message: string;
}> {
  try {
    // Map the simplified interface to the comprehensive processFeedback params
    const processFeedbackParams: FeedbackParams = {
      fragrance_id: feedback.context?.fragrance_id || recommendationId, // Use recommendation context
      feedback_type: feedback.feedback_type || (feedback.rating >= 4 ? 'like' : feedback.rating <= 2 ? 'dislike' : 'maybe'),
      rating_value: feedback.rating,
      confidence: feedback.confidence || (feedback.helpful ? 0.9 : 0.5),
      reason: feedback.notes,
      recommendation_id: recommendationId,
      source: 'recommendation_feedback',
      time_to_action_seconds: feedback.time_to_feedback_seconds,
      context: {
        helpful: feedback.helpful,
        simplified_interface: true,
        ...feedback.context,
      },
    };

    // Call the comprehensive feedback processor
    const result = await processFeedback(processFeedbackParams);

    // Map the result to the simplified interface
    return {
      success: result.success,
      error: result.error,
      feedback_id: result.feedback_id,
      learning_applied: result.metadata?.ai_learning_applied || false,
      recommendations_refreshed: result.recommendation_refresh?.cache_invalidated || false,
      message: result.user_message,
    };
  } catch (error) {
    console.error('Error in submitRecommendationFeedback:', error);
    return {
      success: false,
      error: 'Failed to submit recommendation feedback',
      learning_applied: false,
      recommendations_refreshed: false,
      message: 'Failed to process your feedback',
    };
  }
}
