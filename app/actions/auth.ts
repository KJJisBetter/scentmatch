'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
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

// Generic error message to prevent user enumeration
const GENERIC_AUTH_ERROR =
  'Invalid email or password. Please check your credentials and try again.';
const GENERIC_RESET_MESSAGE =
  'If an account with that email exists, you will receive a password reset link shortly.';

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
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown';

    const rateLimitResult = await rateLimit({
      key: `signup:${ip}`,
      limit: 3,
      window: 3600000, // 1 hour
    });

    if (!rateLimitResult.success) {
      return {
        error: 'Too many registration attempts. Please try again later.',
      };
    }

    const supabase = await createClient();

    // Sign up user with auto-confirm for development
    const { data, error } = await supabase.auth.signUp({
      email: emailResult.data,
      password: passwordResult.data,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        // Auto-confirm email for development
        data: {
          email_confirmed: true,
        },
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
        // Wait for session to be fully established before profile creation
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            // Verify session is established
            const { data: sessionCheck } = await supabase.auth.getSession();
            if (sessionCheck.session?.user?.id === data.user.id) {
              // Session established, safe to create profile
              await ensureUserProfile(data.user.id, data.user.email);
              console.log('User profile created/verified for:', data.user.id);
              break;
            } else {
              // Wait briefly and retry
              await new Promise(resolve => setTimeout(resolve, 500));
              retryCount++;
            }
          } catch (sessionError) {
            console.warn(
              `Session check attempt ${retryCount + 1} failed:`,
              sessionError
            );
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }

        if (retryCount >= maxRetries) {
          console.error('Failed to establish session after multiple attempts');
          return {
            error: 'Session establishment failed. Please try signing in.',
          };
        }
      } catch (profileError) {
        console.error(
          'Failed to create user profile during signup:',
          profileError
        );
        return { error: 'Database error saving new user. Please try again.' };
      }

      // For development: redirect to login after successful signup
      return {
        success: true,
        redirect: '/auth/signin',
        message: 'Account created successfully! Please sign in to continue.',
      };
    }

    return { success: true, redirect: '/auth/signin' };
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
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown';

    const rateLimitResult = await rateLimit({
      key: `login:${ip}:${emailResult.data}`,
      limit: 5,
      window: 900000, // 15 minutes
    });

    if (!rateLimitResult.success) {
      return {
        error:
          'Too many failed login attempts. Please try again in 15 minutes.',
      };
    }

    const supabase = await createClient();

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
    const supabase = await createClient();

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
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown';

    const rateLimitResult = await rateLimit({
      key: `reset:${ip}:${emailResult.data}`,
      limit: 3,
      window: 300000, // 5 minutes
    });

    if (!rateLimitResult.success) {
      return {
        error:
          'Too many password reset requests. Please try again in 5 minutes.',
      };
    }

    const supabase = await createClient();

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(
      emailResult.data,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset`,
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

    const supabase = await createClient();

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
    const supabase = await createClient();

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

    const supabase = await createClient();

    // Check if profile exists using user_id field (not id)
    console.log('DEBUG: Checking for existing profile');
    const { data: existingProfile, error: selectError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId) // Changed from 'id' to 'user_id'
      .single();

    console.log('DEBUG: Profile check result', {
      existingProfile,
      selectError,
    });

    if (!existingProfile) {
      console.log('DEBUG: Creating new profile');
      // Create profile with actual database schema
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId, // Primary key
          user_id: userId, // Foreign key to auth.users (required)
          full_name: '', // Default empty string
          experience_level: 'beginner', // Default experience level
          favorite_accords: [], // Default empty array
          disliked_accords: [], // Default empty array
          profile_privacy: 'private', // Default privacy setting
          onboarding_completed: false, // Default not completed
          onboarding_step: 'created', // Default initial step
          privacy_settings: {
            // Default privacy settings object
            show_ratings: false,
            collection_public: false,
            allow_friend_requests: true,
            recommendations_enabled: true,
          },
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
