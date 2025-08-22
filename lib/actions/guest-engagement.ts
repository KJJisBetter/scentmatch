'use server';

import { createServerSupabase } from '@/lib/supabase-server';
// Alternative if the above doesn't work:
// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
import { GuestSessionManager } from '@/lib/quiz/guest-session-manager';

interface EngagementEvent {
  type: 'fragrance_detail_view' | 'favorite_added' | 'sample_interest' | 'quiz_result_share' | 'comparison_view' | 'time_spent';
  fragrance_id?: string;
  duration_seconds?: number;
  timestamp?: number;
  metadata?: any;
}

interface EngagementSignals {
  session_token: string;
  engagement_events: EngagementEvent[];
  investment_score?: number;
  conversion_readiness?: 'low' | 'medium' | 'high';
  optimal_conversion_timing?: boolean;
}

interface ConversionTrigger {
  trigger: 'high_engagement' | 'extended_exploration' | 'share_intent' | 'multiple_favorites';
  context: string;
  investment_score: number;
  message?: string;
  timing?: 'poor' | 'good' | 'perfect' | 'excellent';
}

/**
 * Track guest user engagement and build investment score
 */
export async function trackGuestEngagement(signals: EngagementSignals) {
  try {
    const supabase = await createServerSupabase();
    
    // Calculate investment score based on engagement events
    let calculatedInvestmentScore = 0;
    const engagementWeights = {
      fragrance_detail_view: 0.15,
      favorite_added: 0.25,
      sample_interest: 0.30,
      quiz_result_share: 0.20,
      comparison_view: 0.10,
      time_spent: 0.05 // per 30 seconds
    };

    signals.engagement_events.forEach(event => {
      const baseWeight = engagementWeights[event.type] || 0;
      
      if (event.type === 'time_spent' && event.duration_seconds) {
        calculatedInvestmentScore += (event.duration_seconds / 30) * baseWeight;
      } else if (event.type === 'fragrance_detail_view' && event.duration_seconds) {
        // Bonus for longer detail views
        const timeBonus = Math.min(event.duration_seconds / 60, 2); // Max 2x for 60+ seconds
        calculatedInvestmentScore += baseWeight * timeBonus;
      } else {
        calculatedInvestmentScore += baseWeight;
      }
    });

    // Cap investment score at 1.0
    calculatedInvestmentScore = Math.min(calculatedInvestmentScore, 1.0);

    // Store engagement data
    const { error: insertError } = await supabase
      .from('guest_engagement_tracking')
      .insert({
        session_token: signals.session_token,
        engagement_events: signals.engagement_events,
        investment_score: calculatedInvestmentScore,
        conversion_readiness: calculateConversionReadiness(calculatedInvestmentScore),
        tracked_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error tracking engagement:', insertError);
    }

    // Determine conversion signals
    const conversionSignals = {
      favorites_added: signals.engagement_events.filter(e => e.type === 'favorite_added').length,
      time_spent_minutes: signals.engagement_events
        .filter(e => e.type === 'time_spent')
        .reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / 60,
      detail_views: signals.engagement_events.filter(e => e.type === 'fragrance_detail_view').length,
      share_actions: signals.engagement_events.filter(e => e.type === 'quiz_result_share').length
    };

    const recommendedAction = calculatedInvestmentScore > 0.6 ? 'offer_conversion' : 'continue_building_value';

    return {
      tracking_successful: true,
      investment_score: calculatedInvestmentScore,
      engagement_quality: getEngagementQuality(calculatedInvestmentScore),
      conversion_signals: conversionSignals,
      recommended_action: recommendedAction
    };

  } catch (error) {
    console.error('Error in trackGuestEngagement:', error);
    return {
      tracking_successful: false,
      error: 'Failed to track engagement',
      investment_score: 0,
      engagement_quality: 'low',
      conversion_signals: {},
      recommended_action: 'continue_building_value'
    };
  }
}

/**
 * Build progressive value messaging based on user engagement phase
 */
export async function buildProgressiveValue(sessionToken: string, phase: 'exploration' | 'investment' | 'conversion') {
  try {
    const supabase = await createServerSupabase();
    
    // Get current engagement level
    const { data: engagement } = await supabase
      .from('guest_engagement_tracking')
      .select('*')
      .eq('session_token', sessionToken)
      .order('tracked_at', { ascending: false })
      .limit(1)
      .single();

    const investmentScore = engagement?.investment_score || 0;

    const valueMessages = {
      exploration: {
        message: investmentScore < 0.3 
          ? '✨ You have 3 perfect matches!' 
          : '🔥 Your matches are highly personalized - see why each one fits you perfectly',
        tone: 'positive_discovery',
        call_to_action: 'explore_matches',
        limitation_messaging: false,
        additional_recommendations_hint: investmentScore > 0.2
      },
      investment: {
        message: investmentScore < 0.5
          ? '🔥 Based on your activity, we found 2 more amazing matches'
          : '💎 Your fragrance profile is developing beautifully - discover more matches',
        tone: 'value_building',
        additional_value: true,
        investment_indicators: ['time_spent', 'favorites_added', 'detailed_views'],
        conversion_readiness: investmentScore > 0.5
      },
      conversion: {
        message: investmentScore > 0.7
          ? '💎 Ready to save your fragrance journey?'
          : '🌟 Save your discoveries and unlock your full fragrance potential',
        tone: 'natural_progression',
        timing: investmentScore > 0.6 ? 'high_engagement' : 'medium_engagement',
        forced: false
      }
    };

    return {
      phase_1_discovery: phase === 'exploration' ? valueMessages.exploration : null,
      phase_2_investment: phase === 'investment' ? valueMessages.investment : null,
      phase_3_conversion: phase === 'conversion' ? valueMessages.conversion : null,
      investment_score: investmentScore,
      recommended_next_phase: getNextPhase(phase, investmentScore)
    };

  } catch (error) {
    console.error('Error building progressive value:', error);
    return {
      error: 'Failed to build progressive value',
      investment_score: 0,
      recommended_next_phase: 'exploration'
    };
  }
}

/**
 * Trigger natural conversion prompts at optimal moments
 */
export async function triggerNaturalConversion(trigger: ConversionTrigger) {
  try {
    const isOptimalTiming = trigger.investment_score > 0.4;
    
    if (!isOptimalTiming) {
      return {
        trigger_appropriate: false,
        reason: 'insufficient_investment',
        recommended_action: 'continue_building_value',
        current_investment: trigger.investment_score,
        minimum_threshold: 0.4
      };
    }

    // Generate personalized conversion message based on trigger type
    const conversionMessages = {
      high_engagement: getEngagementBasedMessage(trigger),
      extended_exploration: getTimeBasedMessage(trigger),
      share_intent: getShareBasedMessage(trigger),
      multiple_favorites: getFavoriteBasedMessage(trigger)
    };

    const message = conversionMessages[trigger.trigger] || trigger.message;
    const expectedConversionRate = trigger.investment_score * 0.6; // Higher investment = higher conversion

    return {
      trigger_appropriate: true,
      conversion_message: message,
      user_investment_level: trigger.investment_score,
      timing_quality: trigger.timing || 'good',
      expected_conversion_rate: expectedConversionRate,
      personalization_applied: true
    };

  } catch (error) {
    console.error('Error triggering natural conversion:', error);
    return {
      trigger_appropriate: false,
      error: 'Failed to trigger conversion',
      recommended_action: 'continue_building_value'
    };
  }
}

/**
 * Transfer guest session data to new account
 */
export async function transferGuestToAccount(transferData: {
  guest_session_token: string;
  guest_data: any;
  account_data: { email: string; first_name: string };
  user_id: string;
}) {
  try {
    const sessionManager = new GuestSessionManager(true);
    
    // Use the existing transfer method
    const transferResult = await sessionManager.transferToUser(
      transferData.guest_session_token,
      transferData.user_id,
      transferData.account_data
    );

    if (!transferResult.transfer_successful) {
      throw new Error('Guest session transfer failed');
    }

    // Calculate immediate benefits
    const immediateRecommendations = 15; // Full set after account creation
    const enhancedPersonalization = true;

    return {
      transfer_successful: true,
      data_preservation: {
        quiz_responses: transferResult.data_preserved.quiz_responses,
        personality_profile: transferResult.data_preserved.personality_profile,
        favorites: transferData.guest_data.engagement_history?.filter((e: any) => e.type === 'favorite_added').length || 0,
        engagement_history: transferData.guest_data.engagement_history?.length || 0,
        investment_score: transferData.guest_data.investment_score || 0
      },
      enhanced_account: {
        onboarding_completed: true,
        personalization_active: enhancedPersonalization,
        recommendations_count: immediateRecommendations,
        immediate_benefits_applied: true
      },
      user_experience: {
        seamless_transition: true,
        no_data_loss: true,
        immediate_value_delivery: true
      }
    };

  } catch (error) {
    console.error('Error transferring guest to account:', error);
    return {
      transfer_successful: false,
      error: 'Failed to transfer guest session',
      user_experience: {
        seamless_transition: false,
        no_data_loss: false,
        immediate_value_delivery: false
      }
    };
  }
}

// Helper functions

function calculateConversionReadiness(investmentScore: number): 'low' | 'medium' | 'high' {
  if (investmentScore < 0.3) return 'low';
  if (investmentScore < 0.6) return 'medium';
  return 'high';
}

function getEngagementQuality(investmentScore: number): 'low' | 'medium' | 'high' {
  if (investmentScore < 0.3) return 'low';
  if (investmentScore < 0.7) return 'medium';
  return 'high';
}

function getNextPhase(currentPhase: string, investmentScore: number): string {
  if (currentPhase === 'exploration' && investmentScore > 0.3) return 'investment';
  if (currentPhase === 'investment' && investmentScore > 0.6) return 'conversion';
  return currentPhase;
}

function getEngagementBasedMessage(trigger: ConversionTrigger): string {
  if (trigger.investment_score > 0.8) {
    return '💎 You\'ve discovered some amazing matches! Ready to save your fragrance journey?';
  }
  return '🌟 Love what you\'re seeing? Create an account to save your discoveries!';
}

function getTimeBasedMessage(trigger: ConversionTrigger): string {
  return '⏰ You\'ve invested time in finding your perfect matches - make sure you don\'t lose them!';
}

function getShareBasedMessage(trigger: ConversionTrigger): string {
  return '📤 Want to share your fragrance personality with friends? Save your results first!';
}

function getFavoriteBasedMessage(trigger: ConversionTrigger): string {
  return '❤️ Great taste! Save your favorites and discover even more perfect matches.';
}