import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * Save Advanced Profile API
 * Handles saving detailed multi-dimensional personality profiles to database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, profile, quiz_responses, recommendations } = body;

    if (!user_id || !profile) {
      return NextResponse.json(
        { error: 'User ID and profile are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    // Verify user exists and is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== user_id) {
      return NextResponse.json(
        { error: 'Invalid user authentication' },
        { status: 401 }
      );
    }

    // Save detailed profile to user_profile_vectors table
    const { error: profileError } = await supabase
      .from('user_profile_vectors')
      .upsert({
        user_id: user_id,
        profile_vector: profile.profile_vector || Array(256).fill(0),
        personality_traits: {
          trait_combinations: profile.trait_combinations,
          primary_archetype: profile.primary_archetype,
          confidence_score: profile.confidence_score,
          detailed_traits: profile.traits,
        },
        trait_weights: {
          primary: profile.trait_combinations[0] || 'balanced',
          secondary: profile.trait_combinations[1] || null,
          tertiary: profile.trait_combinations[2] || null,
          confidence: profile.confidence_score,
        },
        quiz_session_token: profile.session_token,
        confidence_score: profile.confidence_score,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile save error:', profileError);
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500 }
      );
    }

    // Save enhanced quiz responses
    if (quiz_responses && quiz_responses.length > 0) {
      const enhancedResponses = quiz_responses.map((response: any) => ({
        user_id: user_id,
        session_token: profile.session_token,
        question_id: response.question_id,
        selected_traits: response.selected_options || [
          response.selected_option,
        ],
        trait_weights: response.selected_options?.map(() => 1.0) || [1.0],
        response_timestamp: response.timestamp,
        question_version: 2, // Advanced quiz version
      }));

      const { error: responsesError } = await supabase
        .from('quiz_responses_enhanced')
        .insert(enhancedResponses);

      if (responsesError) {
        console.error('Quiz responses save error:', responsesError);
        // Don't fail profile save for response save issues
      }
    }

    // Update user profile with quiz completion
    const { error: userProfileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user_id,
        email: user.email,
        quiz_completed_at: new Date().toISOString(),
        quiz_personality_type: profile.primary_archetype,
        personality_trait_combinations: profile.trait_combinations,
        onboarding_step: 'advanced_profile_complete',
        profile_confidence: profile.confidence_score,
        enhanced_quiz_version: 2,
      });

    if (userProfileError) {
      console.error('User profile update error:', userProfileError);
      // Don't fail for user profile update issues
    }

    // Return successful save response
    return NextResponse.json(
      {
        profile_saved: true,
        user_id: user_id,
        profile_summary: {
          trait_combinations: profile.trait_combinations,
          primary_archetype: profile.primary_archetype,
          confidence_score: profile.confidence_score,
          recommendations_count: recommendations?.length || 0,
        },
        enhanced_features: {
          ai_personalization_active: true,
          profile_aware_recommendations: true,
          purchase_confidence_scores: true,
          personality_based_insights: true,
        },
        immediate_benefits: {
          personalized_recommendations: recommendations?.length || 15,
          ai_accuracy_boost: '35%',
          high_confidence_matches:
            recommendations?.filter((r: any) => r.purchase_confidence > 0.8)
              ?.length || 0,
          sample_discount: '20% off personality-matched orders',
        },
        next_steps: {
          redirect_to: `/recommendations?profile_active=true&traits=${profile.trait_combinations.join(',')}`,
          onboarding_step: 'explore_personalized_recommendations',
          recommended_actions: [
            `View all personality-matched recommendations`,
            `Order high-confidence samples with discount`,
            `Explore AI insights based on your ${profile.trait_combinations.join(' + ')} profile`,
          ],
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Advanced profile save error:', error);

    return NextResponse.json(
      {
        error: 'Failed to save advanced profile',
        message: 'Please try again or contact support',
        support_available: true,
      },
      { status: 500 }
    );
  }
}
