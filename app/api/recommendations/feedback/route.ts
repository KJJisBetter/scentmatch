import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import {
  FeedbackProcessor,
  RecommendationCache,
  createThompsonSamplingService,
  type FeedbackEvent,
  type BanditFeedbackEvent,
} from '@/lib/ai-sdk/feedback-processor';
import { withRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/recommendations/feedback
 *
 * AI-enhanced feedback processing with real-time preference learning,
 * embedding updates, and recommendation cache invalidation.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Rate limiting check
  const rateLimitCheck = await withRateLimit(request, 'recommendations');
  if (rateLimitCheck.blocked) {
    return rateLimitCheck.response;
  }

  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await (supabase as any).auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.fragrance_id || !body.feedback_type) {
      return NextResponse.json(
        { error: 'fragrance_id and feedback_type are required' },
        { status: 400 }
      );
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

    if (!validFeedbackTypes.includes(body.feedback_type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Initialize AI feedback processor
    const feedbackProcessor = new FeedbackProcessor({
      supabase: supabase as any,
      enableImplicitFeedback: true,
      enableExplicitFeedback: true,
      learningRate: 0.1,
      feedbackDecayDays: 90,
    });

    const recommendationCache = new RecommendationCache({
      supabase: supabase as any,
      defaultTTL: 3600,
      enableRealTimeInvalidation: true,
    });

    // Create feedback event
    const feedbackEvent: FeedbackEvent = {
      user_id: user.id,
      fragrance_id: body.fragrance_id,
      feedback_type: body.feedback_type,
      rating_value: body.rating_value,
      confidence: body.confidence || 0.8,
      reason: body.reason,
      context: {
        recommendation_id: body.recommendation_id,
        recommendation_source: body.source || 'unknown',
        recommendation_position: body.position,
        ...body.context,
      },
    };

    // Process explicit feedback through AI system
    const processingResult =
      await feedbackProcessor.processExplicitFeedback(feedbackEvent);

    // Process Thompson Sampling bandit feedback
    let banditProcessingResult = null;
    try {
      const thompsonService = createThompsonSamplingService(supabase as any);

      // Convert to bandit feedback format
      const banditFeedback: BanditFeedbackEvent = {
        user_id: user.id,
        fragrance_id: body.fragrance_id,
        algorithm_used: body.algorithm_used || 'hybrid', // Should be provided by frontend
        action: mapFeedbackTypeToAction(body.feedback_type),
        action_value: body.rating_value,
        immediate_reward: 0, // Will be calculated by processor
        contextual_factors: extractContextualFactors(body.context || {}),
        session_id: body.session_id || `session_${Date.now()}`,
        time_to_action_seconds: body.time_to_action_seconds,
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
            fragrance_id: body.fragrance_id,
            rating: body.rating_value,
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
        fragrance_id: body.fragrance_id,
        interaction_type: body.feedback_type,
        interaction_value:
          body.rating_value ||
          (body.feedback_type === 'like'
            ? 1
            : body.feedback_type === 'dislike'
              ? 0
              : 0.5),
        interaction_context: {
          recommendation_context: body.context || {},
          feedback_source: 'explicit',
          recommendation_id: body.recommendation_id,
          processing_result: processingResult,
        },
      });

    if (interactionError) {
      console.warn('Error storing interaction:', interactionError.message);
    }

    // Assess feedback quality for learning weight
    const feedbackQuality = await feedbackProcessor.assessFeedbackQuality({
      user_id: user.id,
      fragrance_id: body.fragrance_id,
      feedback_type: body.feedback_type,
      rating_value: body.rating_value,
      time_spent_before_rating: body.time_spent_before_rating || 30,
      previous_interactions: body.previous_interactions || 0,
    });

    const response = {
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
      user_message: getFeedbackMessage(body.feedback_type),
      metadata: {
        processing_time_ms: Date.now() - startTime,
        ai_learning_applied: true,
        bandit_learning_applied: banditProcessingResult?.processed || false,
        preference_adjustment_type: processingResult.preference_adjustment,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'X-Learning-Impact': processingResult.learning_impact.toString(),
        'X-Cache-Invalidated': cacheInvalidated.toString(),
        'X-Processing-Time': (Date.now() - startTime).toString(),
      },
    });
  } catch (error) {
    console.error('Error processing feedback:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process feedback',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
        metadata: {
          processing_time_ms: Date.now() - startTime,
          ai_learning_applied: false,
        },
      },
      { status: 500 }
    );
  }
}

// Process feedback for preference learning
async function processPreferenceLearning(
  supabase: any,
  userId: string,
  feedback: any
): Promise<any> {
  try {
    // Get fragrance details for learning
    const { data: fragrance } = await (supabase as any)
      .from('fragrances')
      .select(
        `
        id,
        scent_family,
        notes,
        intensity_score,
        brand_id,
        fragrance_brands:brand_id (name)
      `
      )
      .eq('id', feedback.fragrance_id)
      .single();

    if (!fragrance) {
      return { error: 'Fragrance not found for learning' };
    }

    // Calculate learning weight based on feedback type
    const learningWeights = {
      love: 1.0,
      like: 0.7,
      sample_request: 0.8,
      maybe: 0.3,
      dislike: -0.5,
      dismiss: -0.3,
      detailed_rating: 0.5,
    };

    const weight =
      learningWeights[feedback.feedback_type as keyof typeof learningWeights] ||
      0.1;

    // Update user preferences (simplified learning - would be more sophisticated in production)
    const preferenceUpdates = [];
    let confidenceChange = 0;

    if (weight > 0) {
      // Positive feedback - strengthen preferences
      if (fragrance.scent_family) {
        preferenceUpdates.push(
          `increased_${fragrance.scent_family}_preference`
        );
        confidenceChange = Math.abs(weight) * 0.05;
      }

      if (fragrance.notes && Array.isArray(fragrance.notes)) {
        // Learn from specific notes
        const topNotes = fragrance.notes.slice(0, 3);
        preferenceUpdates.push(
          ...topNotes.map((note: string) => `learned_${note}_preference`)
        );
      }
    } else {
      // Negative feedback - adjust away from these characteristics
      if (fragrance.scent_family) {
        preferenceUpdates.push(
          `decreased_${fragrance.scent_family}_preference`
        );
        confidenceChange = Math.abs(weight) * 0.03; // Smaller confidence change for negative
      }
    }

    // Store preference update (in a real implementation, this would update user_preferences table)
    const { error: prefError } = await (supabase as any)
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preference_type: 'feedback_learning',
        preference_value: JSON.stringify({
          fragrance_id: feedback.fragrance_id,
          feedback_type: feedback.feedback_type,
          weight: weight,
          learned_at: new Date().toISOString(),
        }),
        preference_strength: Math.abs(weight),
        learned_from: 'recommendation_feedback',
      });

    return {
      updated_preferences: preferenceUpdates,
      confidence_change: confidenceChange,
      embedding_updated: Math.abs(weight) > 0.5, // Update embedding for strong signals
      learning_weight: weight,
      fragrance_analyzed: {
        family: fragrance.scent_family,
        brand: fragrance.fragrance_brands?.name,
        intensity: fragrance.intensity_score,
      },
    };
  } catch (error) {
    console.error('Error in preference learning:', error);
    return {
      error: 'Preference learning failed',
      fallback_applied: true,
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
