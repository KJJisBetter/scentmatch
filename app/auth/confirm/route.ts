import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Enhanced Supabase email confirmation handler
 * Handles multiple URL formats and provides robust error handling
 * Supports both PKCE flow and legacy confirmation methods
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Support multiple parameter formats for backward compatibility
  const token_hash =
    searchParams.get('token_hash') || searchParams.get('token');
  const code = searchParams.get('code'); // For legacy OAuth flows
  const type = (searchParams.get('type') as EmailOtpType) || 'email';
  const next =
    searchParams.get('next') || searchParams.get('redirect_to') || '/dashboard';

  // Create redirect link without the secret token
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('token');
  redirectTo.searchParams.delete('code');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next');
  redirectTo.searchParams.delete('redirect_to');

  console.log('🔐 Auth confirm handler:', {
    token_hash: !!token_hash,
    code: !!code,
    type,
    next,
    fullUrl: request.url,
  });

  const supabase = await createClient();

  // Try PKCE token verification first
  if (token_hash && type) {
    try {
      console.log(`🔄 Attempting PKCE verification with type: ${type}`);

      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        console.log('✅ PKCE verification successful, redirecting to:', next);
        return NextResponse.redirect(redirectTo);
      } else {
        console.log('❌ PKCE verification failed:', error.message);

        // Try alternative types if the provided type fails
        if (type === 'signup') {
          console.log('🔄 Retrying with type=email for signup');
          const { error: emailError } = await supabase.auth.verifyOtp({
            type: 'email',
            token_hash,
          });

          if (!emailError) {
            console.log('✅ Alternative verification successful');
            return NextResponse.redirect(redirectTo);
          }
        }
      }
    } catch (verificationError) {
      console.error('❌ Token verification exception:', verificationError);
    }
  }

  // Try OAuth code verification for legacy flows
  if (code) {
    try {
      console.log('🔄 Attempting OAuth code verification');

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        console.log('✅ OAuth verification successful');
        return NextResponse.redirect(redirectTo);
      } else {
        console.log('❌ OAuth verification failed:', error.message);
      }
    } catch (oauthError) {
      console.error('❌ OAuth verification exception:', oauthError);
    }
  }

  // Enhanced error handling with specific error codes and retry suggestions
  console.log('❌ All verification methods failed, redirecting to error page');

  const errorPage = request.nextUrl.clone();
  errorPage.pathname = '/auth/verify';
  errorPage.searchParams.set('error', 'verification-failed');
  errorPage.searchParams.set('email', 'check-inbox');
  errorPage.searchParams.set('retry', 'available');

  return NextResponse.redirect(errorPage);
}
