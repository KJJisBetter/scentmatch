import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/convert-session
 *
 * Convert guest quiz session to authenticated account
 * Preserves all quiz data, preferences, and recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required parameters
    const { session_token, email, password, display_name } = body;

    if (!session_token || !email || !password) {
      return NextResponse.json(
        { error: 'Session token, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 422 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            'Password validation failed: Password must be at least 8 characters long',
        },
        { status: 422 }
      );
    }

    // Additional password validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        {
          error:
            'Password validation failed: Password must contain uppercase, lowercase, and numbers',
        },
        { status: 422 }
      );
    }

    // Get and validate session
    const { data: session, error: sessionError } = await supabase
      .from('user_quiz_sessions')
      .select('*')
      .eq('session_token', session_token)
      .eq('is_guest_session', true)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session token or session expired' },
        { status: 400 }
      );
    }

    // Check if session is expired
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 400 }
      );
    }

    // Create new user account using regular signUp (not admin)
    const { data: newUser, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          display_name: display_name || email.split('@')[0],
          source: 'quiz_conversion',
          converted_from_session: session_token,
          email_confirmed: true,
        },
      },
    });

    if (signupError || !newUser.user) {
      console.error('Account creation failed:', signupError);
      return NextResponse.json(
        { error: 'Account creation failed' },
        { status: 500 }
      );
    }

    const userId = newUser.user.id;

    // Begin transaction-like operations to preserve data integrity
    try {
      // 1. Create user profile using correct schema
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          user_id: userId,
          full_name: display_name || '',
          display_name: display_name || email.split('@')[0],
          experience_level: session.detected_experience_level || 'enthusiast',
          unique_profile_name: session.unique_profile_name,
          profile_completion_step: 'quiz_completed',
          favorite_accords: [],
          disliked_accords: [],
          profile_privacy: 'private',
          onboarding_completed: true,
          onboarding_step: 'completed',
          privacy_settings: {
            show_ratings: false,
            collection_public: false,
            allow_friend_requests: true,
            recommendations_enabled: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile creation failed:', profileError);
      }

      // 2. Transfer quiz session to authenticated user
      const { error: sessionUpdateError } = await supabase
        .from('user_quiz_sessions')
        .update({
          user_id: userId,
          is_guest_session: false,
          conversion_to_account_at: new Date().toISOString(),
          metadata: {
            ...session.metadata,
            converted_to_account: true,
            conversion_timestamp: new Date().toISOString(),
            original_guest_session: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('session_token', session_token);

      if (sessionUpdateError) {
        console.error('Session transfer failed:', sessionUpdateError);
      }

      // 3. Transfer personality data if it exists
      const { data: personalityData } = await supabase
        .from('user_fragrance_personalities')
        .select('*')
        .eq('session_id', session.id)
        .single();

      if (personalityData) {
        await supabase
          .from('user_fragrance_personalities')
          .update({
            user_id: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', session.id);
      }

      // 4. Transfer favorite fragrances if user had selected any
      const favoriteIds = session.metadata?.favorite_fragrance_ids;
      if (favoriteIds && Array.isArray(favoriteIds) && favoriteIds.length > 0) {
        const favoriteRecords = favoriteIds.map(
          (fragranceId: string, index: number) => ({
            user_id: userId,
            fragrance_id: fragranceId,
            selection_source: 'quiz_input',
            confidence_score:
              session.metadata?.favorite_confidence_scores?.[index] || 1.0,
            selected_at: new Date().toISOString(),
            metadata: {
              converted_from_session: session_token,
              original_quiz_selection: true,
            },
          })
        );

        await supabase
          .from('user_favorite_fragrances')
          .upsert(favoriteRecords, { onConflict: 'user_id,fragrance_id' });
      }

      // 5. Create account creation bonus
      const bonusExpiresAt = new Date();
      bonusExpiresAt.setDate(bonusExpiresAt.getDate() + 7); // 7 days to use bonus

      const accountCreationBonus = {
        sample_discount: 0.2, // 20% discount
        expires_at: bonusExpiresAt.toISOString(),
        bonus_code: `WELCOME-${userId.slice(-8).toUpperCase()}`,
        description: 'Welcome bonus for completing quiz and creating account',
      };

      // Store bonus in user metadata or preferences
      await supabase.from('user_preferences').insert({
        user_id: userId,
        preference_type: 'account_bonus',
        preference_value: JSON.stringify(accountCreationBonus),
        preference_strength: 1.0,
        learned_from: 'quiz_conversion',
        created_at: new Date().toISOString(),
      });

      console.log(
        `Successfully converted guest session ${session_token} to account ${userId}`
      );

      return NextResponse.json(
        {
          success: true,
          user_id: userId,
          profile_transferred: true,
          recommendations_preserved: true,
          favorite_fragrances_preserved: favoriteIds?.length || 0,
          account_creation_bonus: accountCreationBonus,
          next_steps: {
            verify_email: false, // Auto-confirmed
            explore_recommendations: true,
            complete_profile: session.detected_experience_level ? false : true,
            try_samples: true,
          },
          conversion_metadata: {
            original_session_id: session.id,
            experience_level: session.detected_experience_level,
            profile_name: session.unique_profile_name,
            quiz_completion_quality:
              session.quiz_completion_quality_score || 0.8,
            has_ai_profile: session.ai_profile_generated,
            conversion_timestamp: new Date().toISOString(),
          },
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (transferError) {
      console.error('Data transfer failed:', transferError);

      // If data transfer fails, we should clean up the created user
      // In production, you might want to implement more sophisticated rollback
      await supabase.auth.admin.deleteUser(userId);

      return NextResponse.json(
        {
          error:
            'Account creation succeeded but data transfer failed. Please try again.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in session conversion:', error);

    return NextResponse.json(
      { error: 'Session conversion temporarily unavailable' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to validate session data integrity
 */
async function validateSessionDataIntegrity(
  supabase: any,
  session: any
): Promise<boolean> {
  try {
    // Check if session has sufficient data for conversion
    if (!session.is_completed) {
      return false;
    }

    // Check if personality analysis exists
    const { data: personalityData } = await supabase
      .from('user_fragrance_personalities')
      .select('id')
      .eq('session_id', session.id)
      .single();

    // Session is valid if it's completed and has some preference data
    return session.current_question >= session.total_questions * 0.5; // At least 50% completion
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

/**
 * Helper function to generate secure bonus code
 */
function generateBonusCode(userId: string): string {
  const timestamp = Date.now().toString(36);
  const userSegment = userId.slice(-8).toUpperCase();
  const randomSegment = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();

  return `WELCOME-${userSegment}-${randomSegment}`;
}

/**
 * Helper function to calculate conversion incentives
 */
function calculateConversionIncentives(session: any) {
  const baseDiscount = 0.15; // 15% base discount
  let bonusDiscount = 0;

  // Bonus for completing advanced quiz
  if (session.detected_experience_level === 'collector') {
    bonusDiscount += 0.05;
  }

  // Bonus for AI profile generation
  if (session.ai_profile_generated) {
    bonusDiscount += 0.03;
  }

  // Bonus for selecting favorite fragrances
  if (session.favorite_fragrances_collected) {
    bonusDiscount += 0.02;
  }

  const totalDiscount = Math.min(baseDiscount + bonusDiscount, 0.25); // Max 25% discount

  return {
    sample_discount: totalDiscount,
    bonus_reasoning: {
      base: baseDiscount,
      experience_bonus:
        session.detected_experience_level === 'collector' ? 0.05 : 0,
      ai_profile_bonus: session.ai_profile_generated ? 0.03 : 0,
      favorites_bonus: session.favorite_fragrances_collected ? 0.02 : 0,
    },
  };
}
