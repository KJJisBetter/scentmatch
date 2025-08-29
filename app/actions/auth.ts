'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { checkServerActionRateLimit } from '@/lib/rate-limit';
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

// Generic error message to prevent user enumeration
const GENERIC_AUTH_ERROR =
  'Invalid email or password. Please check your credentials and try again.';
const GENERIC_RESET_MESSAGE =
  'If an account with that email exists, you will receive a password reset link shortly.';

// Helper to get dynamic base URL for email redirects
function getBaseUrl(): string {
  const headersList = headers();
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'http';

  if (host) {
    return `${protocol}://${host}`;
  }

  // Fallback for different environments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}

export async function signUp(email: string, password: string) {
  try {
    // Input validation
    const emailResult = emailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);

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

    // Rate limiting
    const rateLimitResult = await checkServerActionRateLimit('auth_signup');

    if (!rateLimitResult.success) {
      return { error: rateLimitResult.error };
    }

    const supabase = await createServerSupabase();

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email: emailResult.data,
      password: passwordResult.data,
      options: {
        emailRedirectTo: `${getBaseUrl()}/auth/confirm?next=/dashboard`,
      },
    });

    if (error) {
      console.error('Signup error:', error);
      // Generic error to prevent user enumeration
      return { error: 'Registration failed. Please try again.' };
    }

    // Create user profile if user was created
    if (data.user) {
      try {
        // Always attempt to create user profile during signup
        await ensureUserProfile(data.user.id, data.user.email);
        console.log('User profile created/verified for:', data.user.id);
      } catch (profileError) {
        console.error(
          'Failed to create user profile during signup:',
          profileError
        );
        return { error: 'Database error saving new user. Please try again.' };
      }

      if (!data.user.email_confirmed_at) {
        // User needs to confirm email first
        return {
          success: true,
          message: 'Please check your email for a verification link.',
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected signup error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function signIn(email: string, password: string) {
  try {
    // Input validation
    const emailResult = emailSchema.safeParse(email);

    if (!emailResult.success) {
      return { error: 'Please enter a valid email address.' };
    }

    if (!password) {
      return { error: 'Password is required.' };
    }

    // Rate limiting for login attempts
    const rateLimitResult = await checkServerActionRateLimit(
      'auth_login',
      emailResult.data
    );

    if (!rateLimitResult.success) {
      return { error: rateLimitResult.error };
    }

    const supabase = await createServerSupabase();

    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailResult.data,
      password: password,
    });

    if (error) {
      console.error('Sign in error:', error);

      // Handle specific errors with generic responses
      if (error.message === 'Email not confirmed') {
        return {
          error:
            'Please check your email and click the verification link before signing in.',
        };
      }

      // Generic error for all other cases (wrong password, user not found, etc.)
      return { error: GENERIC_AUTH_ERROR };
    }

    if (!data.user) {
      return { error: GENERIC_AUTH_ERROR };
    }

    // Ensure user profile exists
    try {
      await ensureUserProfile(data.user.id, data.user.email);
      console.log('User profile verified for signin:', data.user.id);
    } catch (profileError) {
      console.error(
        'Failed to ensure user profile during signin:',
        profileError
      );
      // Don't block signin for profile creation failures, just log them
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Unexpected sign in error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function signOut() {
  try {
    const supabase = await createServerSupabase();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return { error: 'Failed to sign out. Please try again.' };
    }

    revalidatePath('/', 'layout');
    redirect('/');
  } catch (error) {
    console.error('Unexpected sign out error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function resetPassword(email: string) {
  try {
    // Input validation
    const emailResult = emailSchema.safeParse(email);

    if (!emailResult.success) {
      return { error: 'Please enter a valid email address.' };
    }

    // Rate limiting for password reset requests
    const rateLimitResult = await checkServerActionRateLimit(
      'auth_reset',
      emailResult.data
    );

    if (!rateLimitResult.success) {
      return { error: rateLimitResult.error };
    }

    const supabase = await createServerSupabase();

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(
      emailResult.data,
      {
        redirectTo: `${getBaseUrl()}/auth/confirm?next=/auth/reset`,
      }
    );

    if (error) {
      console.error('Password reset error:', error);
    }

    // Always return success message to prevent user enumeration
    return { success: true, message: GENERIC_RESET_MESSAGE };
  } catch (error) {
    console.error('Unexpected password reset error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function updatePassword(
  newPassword: string,
  accessToken: string,
  refreshToken: string
) {
  try {
    // Input validation
    const passwordResult = passwordSchema.safeParse(newPassword);

    if (!passwordResult.success) {
      return {
        error:
          passwordResult.error.issues[0]?.message || 'Invalid password format',
      };
    }

    const supabase = await createServerSupabase();

    // Set session from tokens
    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

    if (sessionError || !sessionData.user) {
      console.error('Session error:', sessionError);
      return {
        error:
          'Invalid or expired reset link. Please request a new password reset.',
      };
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: passwordResult.data,
    });

    if (error) {
      console.error('Password update error:', error);
      return { error: 'Failed to update password. Please try again.' };
    }

    revalidatePath('/', 'layout');
    redirect('/dashboard');
  } catch (error) {
    console.error('Unexpected password update error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function getUser() {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('Get user error:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Unexpected get user error:', error);
    return null;
  }
}

// Helper function to ensure user profile exists
async function ensureUserProfile(userId: string, email: string | undefined) {
  try {
    console.log('DEBUG: Starting ensureUserProfile', { userId, email });

    const supabase = await createServerSupabase();

    // Check if profile exists
    console.log('DEBUG: Checking for existing profile');
    const { data: existingProfile, error: selectError } = await (
      supabase as any
    )
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log('DEBUG: Profile check result', {
      existingProfile,
      selectError,
    });

    if (!existingProfile) {
      console.log('DEBUG: Creating new profile');
      // Create profile with correct schema - no email field, use user_id
      const { error: insertError } = await (supabase as any)
        .from('user_profiles')
        .insert({
          id: userId, // Primary key
          // Removed email field - it doesn't exist in the table
          onboarding_completed: false,
          onboarding_step: 'getting_started',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      console.log('DEBUG: Profile creation result', { insertError });

      if (insertError) {
        console.error('CRITICAL: Profile creation failed', insertError);
        throw insertError; // Re-throw to surface the actual error
      }
    }
  } catch (error) {
    console.error('CRITICAL: ensureUserProfile failed', error);
    throw error; // Re-throw so signup function sees the real error
  }
}
