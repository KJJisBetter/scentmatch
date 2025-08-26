'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { GuestSessionManager } from '@/lib/quiz/guest-session-manager';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface QuizCompletionData {
  quiz_session_token: string;
  responses: any[];
  recommendations: any[];
  gender_preference?: string;
  experience_level?: string;
  processing_time_ms?: number;
  recommendation_method?: string;
}

interface AccountConversionData {
  email: string;
  first_name: string;
  marketing_consent?: boolean;
  guest_session_token: string;
  engagement_data?: any;
}

/**
 * Store quiz results for guest users with 24-hour persistence
 */
export async function storeGuestQuizResults(completionData: QuizCompletionData) {
  try {
    const supabase = await createServerSupabase();
    const sessionManager = new GuestSessionManager(true);

    // Create or update guest session with results
    const sessionData = {
      session_token: completionData.quiz_session_token,
      quiz_responses: completionData.responses,
      recommendations: completionData.recommendations,
      personality_profile: {
        gender_preference: completionData.gender_preference,
        experience_level: completionData.experience_level,
        processing_time_ms: completionData.processing_time_ms,
        recommendation_method: completionData.recommendation_method,
        completed_at: new Date().toISOString()
      },
      is_completed: true,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    // Store in guest quiz sessions table
    const { data: session, error } = await supabase
      .from('user_quiz_sessions')
      .upsert({
        session_token: completionData.quiz_session_token,
        is_guest_session: true,
        quiz_version: 'v1.0',
        current_question: completionData.responses.length,
        total_questions: completionData.responses.length,
        is_completed: true,
        expires_at: sessionData.expires_at,
        personality_profile: sessionData.personality_profile,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'session_token'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store guest results: ${error.message}`);
    }

    // Store detailed responses
    const { error: responsesError } = await supabase
      .from('user_quiz_responses')
      .upsert(
        completionData.responses.map(response => ({
          session_id: session.id,
          question_id: response.question_id,
          answer_value: response.answer_value,
          timestamp: response.timestamp || new Date().toISOString()
        })),
        { onConflict: 'session_id,question_id' }
      );

    if (responsesError) {
      console.error('Warning: Failed to store detailed responses:', responsesError);
    }

    return {
      storage_successful: true,
      session_id: session.id,
      session_token: completionData.quiz_session_token,
      expires_at: sessionData.expires_at,
      recommendations_stored: completionData.recommendations.length,
      data_retention_hours: 24
    };

  } catch (error) {
    console.error('Error storing guest quiz results:', error);
    return {
      storage_successful: false,
      error: 'Failed to store quiz results',
      recommendations_stored: 0
    };
  }
}

/**
 * Retrieve stored guest quiz results by session token
 */
export async function getGuestQuizResults(sessionToken: string) {
  try {
    const supabase = await createServerSupabase();

    // Get session with results
    const { data: session, error } = await supabase
      .from('user_quiz_sessions')
      .select(`
        *,
        quiz_responses (*)
      `)
      .eq('session_token', sessionToken)
      .eq('is_guest_session', true)
      .eq('is_completed', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to retrieve results: ${error.message}`);
    }

    if (!session) {
      return {
        results_found: false,
        reason: 'session_not_found'
      };
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      return {
        results_found: false,
        reason: 'session_expired',
        expired_at: session.expires_at
      };
    }

    return {
      results_found: true,
      session_data: {
        quiz_session_token: session.session_token,
        recommendations: session.personality_profile?.recommendations || [],
        gender_preference: session.personality_profile?.gender_preference,
        experience_level: session.personality_profile?.experience_level,
        processing_time_ms: session.personality_profile?.processing_time_ms,
        completed_at: session.personality_profile?.completed_at,
        expires_at: session.expires_at
      },
      responses: session.quiz_responses || [],
      time_remaining_hours: Math.ceil((new Date(session.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))
    };

  } catch (error) {
    console.error('Error retrieving guest quiz results:', error);
    return {
      results_found: false,
      error: 'Failed to retrieve results'
    };
  }
}

/**
 * Convert guest user to account with progressive onboarding
 */
export async function convertGuestToAccount(conversionData: AccountConversionData) {
  try {
    const supabase = await createServerSupabase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(conversionData.email)) {
      return {
        conversion_successful: false,
        error: 'invalid_email_format'
      };
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', conversionData.email.toLowerCase())
      .single();

    if (existingUser) {
      return {
        conversion_successful: false,
        error: 'email_already_exists',
        suggested_action: 'sign_in'
      };
    }

    // Create new user account
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: conversionData.email.toLowerCase(),
      password: generateTemporaryPassword(), // User will set password via reset flow
      options: {
        data: {
          first_name: conversionData.first_name,
          onboarding_source: 'quiz_conversion',
          marketing_consent: conversionData.marketing_consent || false
        }
      }
    });

    if (authError) {
      throw new Error(`Account creation failed: ${authError.message}`);
    }

    if (!authUser.user) {
      throw new Error('User creation returned null');
    }

    // Transfer guest session data to new account
    const sessionManager = new GuestSessionManager(true);
    const transferResult = await sessionManager.transferToUser(
      conversionData.guest_session_token,
      authUser.user.id,
      {
        email: conversionData.email,
        first_name: conversionData.first_name,
        engagement_data: conversionData.engagement_data
      }
    );

    if (!transferResult.transfer_successful) {
      console.error('Warning: Guest data transfer failed, but account created');
    }

    // Update user profile with quiz completion status
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        first_name: conversionData.first_name,
        onboarding_step: 'quiz_completed',
        quiz_completed_at: new Date().toISOString(),
        marketing_consent: conversionData.marketing_consent || false,
        conversion_source: 'progressive_quiz_flow',
        updated_at: new Date().toISOString()
      })
      .eq('id', authUser.user.id);

    if (profileError) {
      console.error('Warning: Profile update failed:', profileError);
    }

    // Generate immediate value for new account
    const immediateValue = await generateImmediateAccountValue(authUser.user.id);

    revalidatePath('/recommendations');
    revalidatePath('/profile');

    return {
      conversion_successful: true,
      user_id: authUser.user.id,
      email: conversionData.email,
      first_name: conversionData.first_name,
      onboarding_step: 'quiz_completed',
      data_transfer: {
        guest_data_preserved: transferResult.transfer_successful,
        quiz_responses_transferred: transferResult.data_preserved?.quiz_responses || false,
        personality_profile_transferred: transferResult.data_preserved?.personality_profile || false
      },
      immediate_value: immediateValue,
      next_steps: {
        password_setup_required: true,
        recommendations_unlocked: true,
        personalization_active: true
      }
    };

  } catch (error) {
    console.error('Error converting guest to account:', error);
    return {
      conversion_successful: false,
      error: 'account_creation_failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Track conversion funnel metrics for optimization
 */
export async function trackConversionFunnelStep(stepData: {
  session_token: string;
  funnel_step: 'quiz_completed' | 'results_viewed' | 'engagement_building' | 'conversion_offered' | 'account_created';
  investment_score?: number;
  time_spent_seconds?: number;
  metadata?: any;
}) {
  try {
    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from('conversion_funnel_tracking')
      .insert({
        session_token: stepData.session_token,
        funnel_step: stepData.funnel_step,
        investment_score: stepData.investment_score,
        time_spent_seconds: stepData.time_spent_seconds,
        metadata: stepData.metadata,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error tracking funnel step:', error);
    }

    return {
      tracking_successful: !error,
      step_recorded: stepData.funnel_step
    };

  } catch (error) {
    console.error('Error in trackConversionFunnelStep:', error);
    return {
      tracking_successful: false,
      step_recorded: stepData.funnel_step
    };
  }
}

/**
 * Get conversion optimization insights
 */
export async function getConversionOptimizationData(sessionToken: string) {
  try {
    const supabase = await createServerSupabase();

    // Get funnel progression for this session
    const { data: funnelSteps } = await supabase
      .from('conversion_funnel_tracking')
      .select('*')
      .eq('session_token', sessionToken)
      .order('timestamp', { ascending: true });

    // Get engagement data
    const { data: engagementData } = await supabase
      .from('guest_engagement_tracking')
      .select('*')
      .eq('session_token', sessionToken)
      .order('tracked_at', { ascending: false })
      .limit(1)
      .single();

    const optimization = {
      current_funnel_position: getCurrentFunnelPosition(funnelSteps || []),
      investment_score: engagementData?.investment_score || 0,
      conversion_readiness: engagementData?.conversion_readiness || 'low',
      time_in_funnel_minutes: calculateTimeInFunnel(funnelSteps || []),
      engagement_quality: getEngagementQuality(engagementData?.investment_score || 0),
      recommended_next_action: getRecommendedNextAction(engagementData?.investment_score || 0, funnelSteps || [])
    };

    return {
      optimization_successful: true,
      optimization_data: optimization
    };

  } catch (error) {
    console.error('Error getting optimization data:', error);
    return {
      optimization_successful: false,
      error: 'Failed to get optimization data'
    };
  }
}

// Helper functions

function generateTemporaryPassword(): string {
  return crypto.randomUUID().slice(0, 16);
}

async function generateImmediateAccountValue(userId: string) {
  // This would generate personalized content, additional recommendations, etc.
  return {
    additional_recommendations_unlocked: 12,
    personalization_features_enabled: ['advanced_filtering', 'scent_notes_analysis', 'seasonal_recommendations'],
    exclusive_content_unlocked: true,
    sample_ordering_enabled: true
  };
}

function getCurrentFunnelPosition(funnelSteps: any[]): string {
  if (funnelSteps.length === 0) return 'not_started';
  
  const latestStep = funnelSteps[funnelSteps.length - 1];
  return latestStep.funnel_step;
}

function calculateTimeInFunnel(funnelSteps: any[]): number {
  if (funnelSteps.length < 2) return 0;
  
  const firstStep = new Date(funnelSteps[0].timestamp);
  const lastStep = new Date(funnelSteps[funnelSteps.length - 1].timestamp);
  
  return Math.floor((lastStep.getTime() - firstStep.getTime()) / (1000 * 60));
}

function getEngagementQuality(investmentScore: number): 'low' | 'medium' | 'high' {
  if (investmentScore < 0.3) return 'low';
  if (investmentScore < 0.7) return 'medium';
  return 'high';
}

function getRecommendedNextAction(investmentScore: number, funnelSteps: any[]): string {
  const currentPosition = getCurrentFunnelPosition(funnelSteps);
  
  if (currentPosition === 'account_created') return 'onboarding_complete';
  if (investmentScore > 0.6 && currentPosition !== 'conversion_offered') return 'offer_conversion';
  if (investmentScore > 0.3) return 'build_engagement';
  return 'continue_exploration';
}