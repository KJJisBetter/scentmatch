import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * FIXED: Official Supabase email confirmation handler for PKCE flow
 * Following official @supabase/ssr pattern with NextResponse.redirect()
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';

  // Create redirect link without the secret token
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');

  console.log('Auth confirm handler:', {
    token_hash: !!token_hash,
    type,
    next,
    fullUrl: request.url,
  });

  if (token_hash && type) {
    const supabase = await createClient();

    try {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      console.log('Token verification result:', { error: !!error });

      if (!error) {
        // Successfully verified - use NextResponse.redirect for proper cookie handling
        console.log('Verification successful, redirecting to:', next);
        redirectTo.searchParams.delete('next');
        return NextResponse.redirect(redirectTo);
      }
    } catch (verificationError) {
      console.error('Token verification exception:', verificationError);
    }
  } else {
    console.log('Missing required parameters:', {
      token_hash: !!token_hash,
      type,
    });
  }

  // Return the user to an error page with instructions
  console.log('Verification failed, redirecting to error page');
  redirectTo.pathname = '/auth/verify';
  redirectTo.searchParams.set('error', 'invalid-token');
  return NextResponse.redirect(redirectTo);
}
