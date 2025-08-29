import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Handle both token_hash (PKCE flow) and token (implicit flow) parameters
  const token_hash =
    searchParams.get('token_hash') || searchParams.get('token');
  const typeParam = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  // Convert signup type to email for verifyOtp
  const type: EmailOtpType = (
    typeParam === 'signup' ? 'email' : typeParam
  ) as EmailOtpType;

  console.log('Auth confirm handler:', {
    token_hash: !!token_hash,
    originalType: typeParam,
    convertedType: type,
    next,
    fullUrl: request.url,
  });

  if (token_hash && type) {
    const supabase = await createServerSupabase();

    try {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      console.log('Token verification result:', { error: !!error });

      if (!error) {
        // Successfully verified - redirect to dashboard or specified page
        console.log('Verification successful, redirecting to:', next);
        redirect(next);
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

  // If verification failed, redirect to error page with helpful message
  console.log('Verification failed, redirecting to error page');
  redirect('/auth/verify?error=invalid-token');
}
