'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, CheckCircle, XCircle, Heart, TestTube, Users, ArrowRight, Loader2 } from 'lucide-react';

type VerificationState = 'loading' | 'success' | 'error' | 'already_verified';

export default function AuthCallbackPage() {
  const [verificationState, setVerificationState] = useState<VerificationState>('loading');
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();
      
      try {
        // Get the code from URL parameters
        const code = searchParams.get('code');
        const error_code = searchParams.get('error_code');
        const error_description = searchParams.get('error_description');

        // Handle errors from Supabase
        if (error_code) {
          console.error('Auth callback error:', error_description);
          if (error_code === 'email_not_confirmed') {
            setError('This email verification link has expired or already been used.');
          } else {
            setError('Email verification failed. Please try signing up again.');
          }
          setVerificationState('error');
          return;
        }

        if (!code) {
          setError('No verification code found. Please check your email link.');
          setVerificationState('error');
          return;
        }

        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('Code exchange error:', exchangeError);
          
          // Handle specific error cases
          if (exchangeError.message.includes('expired')) {
            setError('This verification link has expired. Please request a new one.');
          } else if (exchangeError.message.includes('already been used')) {
            setError('This verification link has already been used.');
          } else {
            setError('Email verification failed. Please try again.');
          }
          setVerificationState('error');
          return;
        }

        // Check if user exists and email is verified
        if (data.user) {
          setUserEmail(data.user.email || '');
          
          if (data.user.email_confirmed_at) {
            setVerificationState('success');
            
            // Redirect to dashboard after showing success for a moment
            setTimeout(() => {
              router.push('/dashboard');
              router.refresh();
            }, 3000);
          } else {
            setError('Email verification is still pending. Please check your email.');
            setVerificationState('error');
          }
        } else {
          setError('No user found. Please try signing up again.');
          setVerificationState('error');
        }

      } catch (error) {
        console.error('Unexpected callback error:', error);
        setError('An unexpected error occurred. Please try again.');
        setVerificationState('error');
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  // Loading state
  if (verificationState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-background to-plum-50/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="card-elevated border-0 shadow-strong">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="space-y-6">
                {/* Loading spinner */}
                <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-plum-600 to-plum-800 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>

                {/* Loading message */}
                <div className="space-y-3">
                  <h1 className="font-serif text-2xl font-bold text-gradient-primary">
                    Verifying Your Email
                  </h1>
                  <p className="text-muted-foreground leading-relaxed">
                    Please wait while we confirm your account...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state with helpful recovery options
  if (verificationState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-background to-plum-50/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Brand header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-plum-600 to-plum-800 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-serif text-xl font-bold text-gradient-primary">ScentMatch</span>
            </Link>
          </div>

          <Card className="card-elevated border-0 shadow-strong">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="space-y-6">
                {/* Error icon */}
                <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>

                {/* Error message */}
                <div className="space-y-3">
                  <h1 className="font-serif text-xl font-bold text-foreground">
                    Verification Issue
                  </h1>
                  <p className="text-muted-foreground leading-relaxed">
                    {error}
                  </p>
                </div>

                {/* Helpful actions */}
                <div className="space-y-4">
                  {error.includes('expired') || error.includes('used') ? (
                    <Button variant="premium" className="w-full" asChild>
                      <Link href="/auth/signup">
                        Request New Verification
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="premium" className="w-full" asChild>
                      <Link href="/auth/signup">
                        Try Signing Up Again
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/auth/login">
                      Sign In Instead
                    </Link>
                  </Button>
                </div>

                {/* Support contact */}
                <div className="pt-4 border-t border-border/40">
                  <p className="text-xs text-muted-foreground">
                    Need help?{' '}
                    <Link 
                      href="/contact" 
                      className="text-plum-600 hover:text-plum-700 font-medium underline"
                    >
                      Contact support
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state with celebration and excitement
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-background to-plum-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="card-elevated border-0 shadow-strong">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="space-y-6">
              {/* Celebration icon with animation */}
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center animate-scale-in active">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>

              {/* Success celebration */}
              <div className="space-y-3">
                <h1 className="font-serif text-2xl font-bold text-gradient-primary">
                  Welcome to ScentMatch!
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  {userEmail && (
                    <>
                      Your email <span className="font-medium text-foreground">{userEmail}</span> has been verified successfully.
                    </>
                  )}
                  You're now part of our fragrance discovery community!
                </p>
              </div>

              {/* Excitement building for what's next */}
              <div className="bg-gradient-to-r from-plum-50 to-cream-50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-plum-900">Your fragrance journey starts now:</h3>
                <div className="space-y-2 text-sm text-plum-700">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-plum-600 flex-shrink-0" />
                    <span>Get personalized AI recommendations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TestTube className="h-4 w-4 text-plum-600 flex-shrink-0" />
                    <span>Discover affordable sample sets</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-plum-600 flex-shrink-0" />
                    <span>Build your personal collection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-plum-600 flex-shrink-0" />
                    <span>Connect with fellow fragrance lovers</span>
                  </div>
                </div>
              </div>

              {/* Call to action with automatic redirect info */}
              <div className="space-y-4">
                <Button variant="premium" className="w-full" asChild>
                  <Link href="/dashboard">
                    Explore My Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  You'll be automatically redirected to your dashboard in a few seconds
                </p>
              </div>

              {/* Welcome community message */}
              <div className="pt-4 border-t border-border/40">
                <p className="text-xs text-muted-foreground">
                  🎉 You've joined over{' '}
                  <span className="font-medium text-plum-600">10,000 fragrance enthusiasts</span>{' '}
                  on their scent discovery journey
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}