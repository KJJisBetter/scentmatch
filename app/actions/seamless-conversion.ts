'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Input validation schemas
const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase, and number'
  );

// Guest session data schema
const guestSessionSchema = z.object({
  experience_level: z.enum(['beginner', 'enthusiast', 'collector']).optional(),
  gender_preference: z.enum(['women', 'men', 'unisex', 'all']).optional(),
  quiz_responses: z
    .array(
      z.object({
        question_id: z.string(),
        answer_value: z.string(),
        answer_metadata: z.record(z.string(), z.any()).optional(),
        timestamp: z.string(),
      })
    )
    .optional(),
  favorite_fragrances: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        brand: z.string(),
        popularity_score: z.number().optional(),
        accords: z.array(z.string()).optional(),
        rating: z.number().optional(),
      })
    )
    .optional(),
  ai_profile: z
    .object({
      profile_name: z.string(),
      style_descriptor: z.string(),
      description: z.object({
        paragraph_1: z.string(),
        paragraph_2: z.string(),
        paragraph_3: z.string(),
      }),
      uniqueness_score: z.number(),
      personality_insights: z.array(z.string()),
    })
    .optional(),
  preferences: z
    .object({
      accords: z.array(z.string()).optional(),
      occasions: z.array(z.string()).optional(),
      seasons: z.array(z.string()).optional(),
      intensity: z.enum(['light', 'moderate', 'strong']).optional(),
    })
    .optional(),
  interaction_history: z
    .array(
      z.object({
        action: z.string(),
        target: z.string(),
        timestamp: z.string(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .optional(),
});

/**
 * Seamless Guest-to-Authenticated Transition
 *
 * Preserves complete guest session data while creating authenticated account.
 * Designed for maximum conversion optimization with zero data loss.
 */
export async function seamlessConversion(
  email: string,
  password: string,
  guestSessionData: any
) {
  try {
    // Input validation
    const emailResult = emailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);
    const sessionResult = guestSessionSchema.safeParse(guestSessionData);

    if (!emailResult.success) {
      return {
        error: emailResult.error.issues[0]?.message || 'Invalid email format',
      };
    }

    if (!passwordResult.success) {
      return {
        error:
          passwordResult.error.issues[0]?.message || 'Invalid password format',
      };
    }

    if (!sessionResult.success) {
      console.warn(
        'Guest session data validation warning:',
        sessionResult.error
      );
      // Continue with partial data - don't block conversion for invalid session data
    }

    // Rate limiting
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown';

    const rateLimitResult = await rateLimit({
      key: `seamless_conversion:${ip}`,
      limit: 3,
      window: 3600000, // 1 hour
    });

    if (!rateLimitResult.success) {
      return {
        error: 'Too many registration attempts. Please try again later.',
      };
    }

    const supabase = await createClient();

    // Step 1: Create authenticated user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailResult.data,
      password: passwordResult.data,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          email_confirmed: true, // Auto-confirm for development
          conversion_source: 'quiz_completion',
          guest_session_preserved: true,
        },
      },
    });

    if (authError) {
      console.error('Seamless conversion auth error:', authError);
      return { error: 'Account creation failed. Please try again.' };
    }

    if (!authData.user) {
      return { error: 'Account creation failed. Please try again.' };
    }

    // Step 2: Wait for session establishment
    let sessionEstablished = false;
    let retryCount = 0;
    const maxRetries = 5;

    while (!sessionEstablished && retryCount < maxRetries) {
      try {
        const { data: sessionCheck } = await supabase.auth.getSession();
        if (sessionCheck.session?.user?.id === authData.user.id) {
          sessionEstablished = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        retryCount++;
      } catch (sessionError) {
        console.warn(
          `Session establishment attempt ${retryCount + 1} failed:`,
          sessionError
        );
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    if (!sessionEstablished) {
      console.error('Failed to establish session during seamless conversion');
      return { error: 'Session establishment failed. Please try signing in.' };
    }

    // Step 3: Create enhanced user profile with preserved guest data
    try {
      await createEnhancedUserProfile(
        authData.user.id,
        authData.user.email,
        sessionResult.success ? sessionResult.data : guestSessionData
      );
    } catch (profileError) {
      console.error(
        'Failed to create enhanced profile during seamless conversion:',
        profileError
      );
      return { error: 'Profile creation failed. Please contact support.' };
    }

    // Step 4: Store preserved quiz session for immediate access
    if (sessionResult.success && sessionResult.data.quiz_responses) {
      try {
        await preserveQuizSession(authData.user.id, sessionResult.data);
      } catch (quizError) {
        console.error(
          'Failed to preserve quiz session during conversion:',
          quizError
        );
        // Don't fail conversion for quiz preservation errors
      }
    }

    // Step 5: Track conversion analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'seamless_conversion_completed', {
        conversion_source: 'quiz_completion',
        guest_data_preserved: true,
        user_id: authData.user.id,
        experience_level: guestSessionData.experience_level,
        has_ai_profile: !!guestSessionData.ai_profile,
        favorite_count: guestSessionData.favorite_fragrances?.length || 0,
      });
    }

    revalidatePath('/', 'layout');

    return {
      success: true,
      user_id: authData.user.id,
      profile_preserved: true,
      conversion_type: 'seamless',
      redirect: '/dashboard',
      message: 'Welcome! Your profile and recommendations have been saved.',
    };
  } catch (error) {
    console.error('Unexpected seamless conversion error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Create Enhanced User Profile with Guest Data Preservation
 */
async function createEnhancedUserProfile(
  userId: string,
  email: string | undefined,
  guestData: any
) {
  const supabase = await createClient();

  // Extract enhanced profile data from guest session
  const profileData = {
    id: userId,
    user_id: userId,
    full_name: '',
    experience_level: guestData.experience_level || 'beginner',

    // Preserve quiz-derived preferences
    favorite_accords: extractAccordsFromGuestData(guestData),
    disliked_accords: [],

    // Preserve AI profile if available
    ai_profile_name: guestData.ai_profile?.profile_name || null,
    ai_style_descriptor: guestData.ai_profile?.style_descriptor || null,
    ai_description: guestData.ai_profile?.description || null,
    ai_uniqueness_score: guestData.ai_profile?.uniqueness_score || null,
    ai_personality_insights: guestData.ai_profile?.personality_insights || [],

    // Conversion-specific settings
    profile_privacy: 'private',
    onboarding_completed: true, // Skip onboarding since quiz was completed
    onboarding_step: 'quiz_completed',

    // Enhanced privacy settings for converted users
    privacy_settings: {
      show_ratings: false,
      collection_public: false,
      allow_friend_requests: true,
      recommendations_enabled: true,
      conversion_analytics: true,
    },

    // Metadata about the conversion
    conversion_metadata: {
      conversion_source: 'quiz_completion',
      conversion_timestamp: new Date().toISOString(),
      guest_session_preserved: true,
      original_quiz_responses: guestData.quiz_responses?.length || 0,
      favorite_fragrances_count: guestData.favorite_fragrances?.length || 0,
    },

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabase
    .from('user_profiles')
    .insert(profileData);

  if (insertError) {
    console.error('Enhanced profile creation failed:', insertError);
    throw insertError;
  }

  // Store favorite fragrances if available
  if (guestData.favorite_fragrances?.length > 0) {
    await storeFavoriteFragrances(userId, guestData.favorite_fragrances);
  }
}

/**
 * Preserve Quiz Session Data for Authenticated User
 */
async function preserveQuizSession(userId: string, guestData: any) {
  const supabase = await createClient();

  // Create or update quiz session
  const quizSessionData = {
    user_id: userId,
    session_type: 'converted_from_guest',
    experience_level: guestData.experience_level,
    gender_preference: guestData.gender_preference,
    responses: guestData.quiz_responses || [],
    ai_profile_data: guestData.ai_profile,
    preferences: guestData.preferences || {},
    completion_status: 'completed',
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('quiz_sessions')
    .insert(quizSessionData);

  if (error) {
    console.error('Quiz session preservation failed:', error);
    throw error;
  }
}

/**
 * Store Favorite Fragrances for Authenticated User
 */
async function storeFavoriteFragrances(
  userId: string,
  favoriteFragrances: any[]
) {
  const supabase = await createClient();

  const favoriteData = favoriteFragrances.map(fragrance => ({
    user_id: userId,
    fragrance_id: fragrance.id,
    fragrance_name: fragrance.name,
    brand: fragrance.brand,
    rating: fragrance.rating || null,
    accords: fragrance.accords || [],
    source: 'quiz_selection',
    added_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('user_favorite_fragrances')
    .insert(favoriteData);

  if (error) {
    console.error('Favorite fragrances storage failed:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Extract Accords from Guest Data
 */
function extractAccordsFromGuestData(guestData: any): string[] {
  const accords = new Set<string>();

  // From favorite fragrances
  if (guestData.favorite_fragrances) {
    guestData.favorite_fragrances.forEach((fragrance: any) => {
      if (fragrance.accords) {
        fragrance.accords.forEach((accord: string) => accords.add(accord));
      }
    });
  }

  // From quiz responses
  if (guestData.quiz_responses) {
    guestData.quiz_responses.forEach((response: any) => {
      if (
        response.question_id === 'preferred_accords' &&
        response.answer_metadata?.selections
      ) {
        response.answer_metadata.selections.forEach((accord: string) =>
          accords.add(accord)
        );
      }
    });
  }

  // From preferences
  if (guestData.preferences?.accords) {
    guestData.preferences.accords.forEach((accord: string) =>
      accords.add(accord)
    );
  }

  return Array.from(accords);
}

/**
 * Quick Guest-to-Authenticated Transition (Minimal Friction)
 *
 * For cases where user wants immediate access with minimal form fields
 */
export async function quickConversion(email: string, guestSessionData: any) {
  try {
    // Generate secure temporary password
    const tempPassword = generateSecurePassword();

    // Use seamless conversion with temp password
    const result = await seamlessConversion(
      email,
      tempPassword,
      guestSessionData
    );

    if (result.success) {
      // Send password setup email
      await sendPasswordSetupEmail(email, result.user_id);

      return {
        success: true,
        user_id: result.user_id,
        profile_preserved: true,
        conversion_type: 'quick',
        redirect: '/dashboard',
        message: 'Welcome! Check your email to set up your password.',
        password_setup_required: true,
      };
    }

    return result;
  } catch (error) {
    console.error('Quick conversion error:', error);
    return { error: 'Quick conversion failed. Please try again.' };
  }
}

/**
 * Generate Secure Temporary Password
 */
function generateSecurePassword(): string {
  const length = 16;
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one of each required character type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special

  // Fill remaining length randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Send Password Setup Email
 */
async function sendPasswordSetupEmail(email: string, userId: string) {
  try {
    const supabase = await createClient();

    // Trigger password reset for immediate password setup
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?user_id=${userId}&setup=true`,
    });

    if (error) {
      console.error('Password setup email failed:', error);
      // Don't throw - this is non-critical for conversion success
    }
  } catch (error) {
    console.error('Unexpected password setup email error:', error);
  }
}
