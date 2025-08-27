'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  CheckCircle,
  Gift,
  Heart,
  ShoppingCart,
  Star,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { createClientSupabase } from '@/lib/supabase';
import { FragranceRecommendationDisplay } from './fragrance-recommendation-display';
import { convertToAccount } from '@/lib/actions';

interface ConversionFlowProps {
  quizResults: {
    quiz_session_token: string;
    recommendations: any[];
    processing_time_ms?: number;
    recommendation_method?: string;
    error?: string;
    collection_context?: {
      saved: boolean;
      size: number;
    };
  };
  onAccountCreated: (userData: any) => void;
  onConversionComplete: (result: any) => void;
  collectionFirst?: boolean; // Flag for collection-first flow
}

/**
 * ConversionFlow Component
 *
 * Critical business conversion component for MVP
 * Optimized for maximum quiz-to-account conversion:
 * - Clear value proposition for account creation
 * - Frictionless signup form with minimal fields
 * - Immediate enhanced value delivery
 * - Strategic guest limitation messaging
 */
export function ConversionFlow({
  quizResults,
  onAccountCreated,
  onConversionComplete,
  collectionFirst = false,
}: ConversionFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<
    'quiz_results' | 'account_form' | 'conversion_success' | 'guest_limitations'
  >(collectionFirst ? 'account_form' : 'quiz_results');
  const [accountData, setAccountData] = useState({
    email: '',
    password: '',
  });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // Remove personality display names - using direct recommendations now

  const handleAccountCreation = async () => {
    setIsCreatingAccount(true);
    setErrors([]);

    try {
      const supabase = createClientSupabase();

      // Basic validation
      if (!accountData.email || !accountData.password) {
        setErrors(['Please fill in all required fields']);
        setIsCreatingAccount(false);
        return;
      }

      if (accountData.password.length < 8) {
        setErrors(['Password must be at least 8 characters']);
        setIsCreatingAccount(false);
        return;
      }

      // Create account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountData.email,
        password: accountData.password,
        options: {
          data: {
            quiz_session_token: quizResults.quiz_session_token,
            recommendation_count: quizResults.recommendations.length,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setErrors(['Email already exists. Try signing in instead.']);
        } else {
          setErrors([authError.message]);
        }
        setIsCreatingAccount(false);
        return;
      }

      if (authData.user) {
        // Transfer quiz data to new account using Server Action
        startTransition(async () => {
          try {
            const transferResult = await convertToAccount({
              session_token: quizResults.quiz_session_token,
              user_data: {
                user_id: authData.user!.id,
                email: accountData.email,
              },
            });

            if (transferResult.success) {
              const newUser = {
                id: authData.user!.id,
                email: accountData.email,
                quiz_completed_at: new Date().toISOString(),
                recommendations_generated: quizResults.recommendations.length,
                onboarding_step: 'recommendations_unlocked',
              };

              const conversionResult = {
                account_created: true,
                quiz_data_transferred: transferResult.quiz_data_transferred,
                enhanced_recommendations_unlocked: true,
                immediate_benefits: transferResult.immediate_benefits || {
                  recommendation_count: 15,
                  personalization_boost: 0.18,
                  collection_features_unlocked: true,
                  sample_discount: '20% off first order',
                },
              };

              onAccountCreated(newUser);
              onConversionComplete(conversionResult);
              setStep('conversion_success');
            } else {
              setErrors([
                transferResult.error ||
                  'Failed to transfer quiz data. Please try again.',
              ]);
            }
          } catch (error) {
            console.error('Transfer error:', error);
            setErrors(['Failed to transfer quiz data. Please try again.']);
          }
        });
      }
    } catch (error) {
      console.error('Account creation error:', error);
      setErrors(['Something went wrong. Please try again.']);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Quiz Results Step
  if (step === 'quiz_results') {
    return (
      <div className='max-w-4xl mx-auto space-y-8'>
        {/* New Simplified Results Display - No Personality Profile */}
        <FragranceRecommendationDisplay
          recommendations={quizResults.recommendations}
          onSampleOrder={fragranceId => {
            // Track sample order intent
            if (typeof window !== 'undefined' && (window as any).gtag) {
              (window as any).gtag('event', 'sample_order_intent', {
                fragrance_id: fragranceId,
                source: 'quiz_results',
                recommendation_count: quizResults.recommendations.length,
              });
            }
            // Handle sample order
            console.log('Sample order for:', fragranceId);
          }}
          onLearnMore={async fragranceId => {
            // Use safe navigation to prevent 404s (SCE-71 fix)
            const { safeNavigateToFragrance } = await import(
              '@/lib/services/fragrance-validation-client'
            );

            await safeNavigateToFragrance(fragranceId, () => {
              console.error(
                `❌ NAVIGATION FAILED: Fragrance ${fragranceId} not found in ConversionFlow`
              );
              alert(
                `This fragrance is temporarily unavailable. Please try another recommendation!`
              );
            });
          }}
          onSaveToFavorites={fragranceId => {
            // Handle save to favorites
            console.log('Save to favorites:', fragranceId);
          }}
        />

        {/* Conversion Prompt - Simplified */}
        <div>
          {/* Conversion Prompt - The Money Shot */}
          <Card className='border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50'>
            <CardContent className='text-center py-8'>
              <div className='relative'>
                <Sparkles className='w-8 h-8 text-purple-500 mx-auto mb-4' />
                <h3 className='text-2xl font-bold mb-2 text-purple-900'>
                  Save Your Matches & Get Sample Discounts
                </h3>
                <p className='text-lg text-purple-700 mb-6'>
                  Create your free account to save these recommendations and
                  unlock special offers
                </p>

                {/* Value Props - Simplified */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-sm'>
                  <div className='flex items-center space-x-3 text-purple-800'>
                    <Heart className='w-5 h-5 text-red-500' />
                    <span>Save your 3 perfect matches</span>
                  </div>
                  <div className='flex items-center space-x-3 text-purple-800'>
                    <Gift className='w-5 h-5 text-purple-500' />
                    <span>20% off your first sample order</span>
                  </div>
                  <div className='flex items-center space-x-3 text-purple-800'>
                    <CheckCircle className='w-5 h-5 text-green-500' />
                    <span>Track favorites & reorder easily</span>
                  </div>
                  <div className='flex items-center space-x-3 text-purple-800'>
                    <Star className='w-5 h-5 text-amber-500' />
                    <span>Get notified of new arrivals</span>
                  </div>
                </div>

                <div className='space-y-3'>
                  <Button
                    size='lg'
                    className='w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200'
                    onClick={() => {
                      // Track conversion intent for affiliate analytics
                      if (
                        typeof window !== 'undefined' &&
                        (window as any).gtag
                      ) {
                        (window as any).gtag(
                          'event',
                          'account_creation_started',
                          {
                            source: 'quiz_conversion',
                            recommendation_count:
                              quizResults.recommendations.length,
                            recommendation_method:
                              quizResults.recommendation_method || 'direct',
                          }
                        );
                      }
                      setStep('account_form');
                    }}
                  >
                    Create Free Account - Save These Matches
                  </Button>

                  <button
                    onClick={() => setStep('guest_limitations')}
                    className='text-sm text-gray-500 hover:text-gray-700 hover:underline'
                  >
                    Continue without account (limited features)
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Account Creation Form Step
  if (step === 'account_form') {
    return (
      <div className='max-w-lg mx-auto'>
        <Card>
          <CardContent className='py-8'>
            <div className='text-center mb-6'>
              {collectionFirst && quizResults.collection_context?.saved ? (
                <>
                  <div className='text-4xl mb-4'>🎉</div>
                  <h2 className='text-2xl font-bold mb-2'>
                    Enhance Your Collection Experience
                  </h2>
                  <p className='text-muted-foreground'>
                    Your {quizResults.collection_context.size} fragrances are
                    saved! Create an account to unlock advanced collection
                    features.
                  </p>
                </>
              ) : (
                <>
                  <h2 className='text-2xl font-bold mb-2'>
                    Create Your ScentMatch Account
                  </h2>
                  <p className='text-muted-foreground'>
                    Unlock all your personalized matches
                  </p>
                </>
              )}
            </div>

            {/* Collection Context Indicator */}
            <Alert className='mb-6' variant='default'>
              <CheckCircle className='w-4 h-4' />
              <AlertDescription>
                {collectionFirst && quizResults.collection_context?.saved
                  ? `Your collection of ${quizResults.collection_context.size} fragrances is secure and will be linked to your account`
                  : 'Your quiz results and recommendations will be saved'}
              </AlertDescription>
            </Alert>

            {errors.length > 0 && (
              <Alert variant='destructive' className='mb-4'>
                <AlertDescription>
                  {errors.map(error => (
                    <div key={error}>{error}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <div className='space-y-4'>
              <div>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={accountData.email}
                  onChange={e =>
                    setAccountData(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder='your@email.com'
                  className='mt-1'
                  disabled={isCreatingAccount}
                />
              </div>

              <div>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  value={accountData.password}
                  onChange={e =>
                    setAccountData(prev => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder='Minimum 8 characters'
                  className='mt-1'
                  disabled={isCreatingAccount}
                />
              </div>

              <Button
                onClick={handleAccountCreation}
                disabled={
                  isCreatingAccount ||
                  isPending ||
                  !accountData.email ||
                  !accountData.password
                }
                className='w-full bg-purple-600 hover:bg-purple-700 py-3 font-semibold'
                size='lg'
              >
                {isCreatingAccount ? (
                  <div className='flex items-center space-x-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    <span>Creating Account...</span>
                  </div>
                ) : collectionFirst && quizResults.collection_context?.saved ? (
                  'Create Account & Enhance Collection'
                ) : (
                  'Create Account & Unlock All Matches'
                )}
              </Button>

              <div className='text-center'>
                <button
                  onClick={() => setStep('quiz_results')}
                  className='flex items-center space-x-2 text-gray-600 hover:text-gray-800 text-sm mx-auto'
                  disabled={isCreatingAccount || isPending}
                >
                  <ArrowLeft className='w-4 h-4' />
                  <span>Back to Results</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Conversion Success Step
  if (step === 'conversion_success') {
    return (
      <div className='max-w-3xl mx-auto text-center space-y-8'>
        <Card className='bg-gradient-to-br from-green-50 to-blue-50'>
          <CardContent className='py-8'>
            <div className='text-4xl mb-4'>🎉</div>
            <h2 className='text-3xl font-bold mb-4'>Welcome to ScentMatch!</h2>
            <p className='text-lg text-muted-foreground mb-6'>
              {collectionFirst && quizResults.collection_context?.saved
                ? `Your account is ready and your collection of ${quizResults.collection_context.size} fragrances is now enhanced with premium features`
                : 'Your account is ready and your quiz results have been saved'}
            </p>

            {/* Immediate Benefits Display */}
            <div className='bg-white p-6 rounded-lg border border-green-200 mb-6'>
              <h3 className='font-bold mb-4 text-green-800'>
                Account Created Successfully!
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                <div className='flex items-center space-x-2'>
                  <Sparkles className='w-5 h-5 text-purple-500' />
                  <span>15 personalized recommendations unlocked</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <Star className='w-5 h-5 text-amber-500' />
                  <span>18% better AI matching with account data</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <Heart className='w-5 h-5 text-red-500' />
                  <span>Collection management now available</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <Gift className='w-5 h-5 text-green-500' />
                  <span>20% off your first sample order</span>
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              <Button
                size='lg'
                className='w-full bg-purple-600 hover:bg-purple-700 font-semibold py-4'
                onClick={() => {
                  if (
                    collectionFirst &&
                    quizResults.collection_context?.saved
                  ) {
                    router.push(
                      '/collection?source=account_creation&enhanced=true'
                    );
                  } else {
                    router.push('/recommendations?quiz_completed=true');
                  }
                }}
              >
                <ExternalLink className='w-5 h-5 mr-2' />
                {collectionFirst && quizResults.collection_context?.saved
                  ? 'Manage Your Collection'
                  : 'View All 15 Recommendations'}
              </Button>

              <Button
                size='lg'
                variant='outline'
                className='w-full border-green-500 text-green-700 hover:bg-green-50 font-semibold py-4'
                onClick={() => router.push('/samples/personality-set')}
              >
                <ShoppingCart className='w-5 h-5 mr-2' />
                Order Your Personality Sample Set
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card>
          <CardContent className='py-6'>
            <h3 className='font-bold mb-4'>Quick Start Guide</h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
              <div className='text-center'>
                <div className='text-2xl mb-2'>1️⃣</div>
                <h4 className='font-medium'>Explore Recommendations</h4>
                <p className='text-muted-foreground'>
                  See more matches based on your quiz responses
                </p>
              </div>
              <div className='text-center'>
                <div className='text-2xl mb-2'>2️⃣</div>
                <h4 className='font-medium'>Order Samples</h4>
                <p className='text-muted-foreground'>
                  Try 2-3 samples risk-free with your discount
                </p>
              </div>
              <div className='text-center'>
                <div className='text-2xl mb-2'>3️⃣</div>
                <h4 className='font-medium'>Build Collection</h4>
                <p className='text-muted-foreground'>
                  Save favorites and track your fragrance journey
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Guest Limitations Step (Conversion Recovery)
  if (step === 'guest_limitations') {
    return (
      <div className='max-w-2xl mx-auto'>
        <Card>
          <CardContent className='py-8'>
            <h3 className='text-xl font-bold mb-6 text-center'>
              Continuing as Guest
            </h3>

            {/* What They're Missing */}
            <Alert className='mb-6 border-yellow-200 bg-yellow-50'>
              <AlertDescription>
                <h4 className='font-medium text-yellow-800 mb-3'>
                  Limited Guest Experience:
                </h4>
                <div className='space-y-2 text-sm text-yellow-700'>
                  <div>
                    ⚠️ Only 3 recommendations (missing 12 perfect matches)
                  </div>
                  <div>⚠️ Cannot save favorites or build collection</div>
                  <div>
                    ⚠️ No enhanced AI recommendations based on your activity
                  </div>
                  <div>⚠️ Quiz results will be deleted in 24 hours</div>
                  <div>⚠️ No sample order discount</div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Reconsideration Opportunity */}
            <div className='text-center space-y-4'>
              <p className='text-muted-foreground mb-4'>
                Most users create accounts to unlock their full matches and save
                their results
              </p>

              <Button
                size='lg'
                className='w-full bg-purple-600 hover:bg-purple-700 font-semibold py-3'
                onClick={() => setStep('account_form')}
              >
                Actually, I Want All My Matches
              </Button>

              <Button
                variant='outline'
                size='lg'
                className='w-full'
                onClick={() => router.push('/recommendations?guest=true')}
              >
                Continue with Limited Features
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
