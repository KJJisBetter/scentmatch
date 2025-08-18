'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { createClientSupabase } from '@/lib/supabase-client';

interface ConversionFlowProps {
  quizResults: {
    personality_type: string;
    confidence: number;
    quiz_session_token: string;
    recommendations: any[];
    ai_profile?: {
      profile_name: string;
      description: string;
      style_descriptor?: string;
      uniqueness_score?: number;
    };
    personality_analysis?: {
      dimensions: {
        fresh: number;
        floral: number;
        oriental: number;
        woody: number;
        fruity: number;
        gourmand: number;
      };
      occasion_preferences: string[];
    };
  };
  onAccountCreated: (userData: any) => void;
  onConversionComplete: (result: any) => void;
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
}: ConversionFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<
    'quiz_results' | 'account_form' | 'conversion_success' | 'guest_limitations'
  >('quiz_results');
  const [accountData, setAccountData] = useState({
    email: '',
    password: '',
    firstName: '',
  });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const personalityDisplayNames = {
    sophisticated: 'Sophisticated Evening Enthusiast',
    romantic: 'Romantic Floral Lover',
    natural: 'Natural Fresh Spirit',
    classic: 'Classic Fragrance Appreciator',
  };

  const handleAccountCreation = async () => {
    setIsCreatingAccount(true);
    setErrors([]);

    try {
      const supabase = createClientSupabase();

      // Basic validation
      if (
        !accountData.email ||
        !accountData.password ||
        !accountData.firstName
      ) {
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
            first_name: accountData.firstName,
            quiz_personality: quizResults.personality_type,
            quiz_session_token: quizResults.quiz_session_token,
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
        // Transfer quiz data to new account
        const transferResponse = await fetch('/api/quiz/convert-to-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_token: quizResults.quiz_session_token,
            user_data: {
              email: accountData.email,
              first_name: accountData.firstName,
            },
            preserve_quiz_data: true,
            immediate_recommendations: true,
          }),
        });

        if (transferResponse.ok) {
          const transferResult = await transferResponse.json();

          const newUser = {
            id: authData.user.id,
            email: accountData.email,
            firstName: accountData.firstName,
            quiz_completed_at: new Date().toISOString(),
            personality_type: quizResults.personality_type,
            onboarding_step: 'recommendations_unlocked',
          };

          const conversionResult = {
            account_created: true,
            quiz_data_transferred: transferResult.quiz_data_transferred,
            enhanced_recommendations_unlocked: true,
            immediate_benefits: {
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
          setErrors(['Failed to transfer quiz data. Please try again.']);
        }
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
        {/* Enhanced AI Profile Display */}
        <Card className='bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200'>
          <CardContent className='py-8'>
            <div className='text-center mb-6'>
              <div className='text-4xl mb-4'>🎉</div>
              <h2 className='text-3xl font-bold text-purple-800 mb-2'>
                {quizResults.ai_profile?.profile_name ||
                  personalityDisplayNames[
                    quizResults.personality_type as keyof typeof personalityDisplayNames
                  ] ||
                  'Your Fragrance Personality'}
              </h2>
              <div className='text-sm text-purple-600 mb-4'>
                {Math.round(quizResults.confidence * 100)}% match confidence
              </div>
            </div>

            {/* AI Profile Description */}
            {quizResults.ai_profile?.description && (
              <div className='text-center mb-6 max-w-2xl mx-auto'>
                <p className='text-lg text-purple-700 leading-relaxed'>
                  {quizResults.ai_profile.description}
                </p>
              </div>
            )}

            {/* Fragrance Preferences Visualization */}
            {quizResults.personality_analysis?.dimensions && (
              <div className='mt-6'>
                <h3 className='font-semibold text-center mb-4 text-purple-800'>
                  Your Fragrance Family Preferences
                </h3>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto'>
                  {Object.entries(quizResults.personality_analysis.dimensions)
                    .filter(([_, score]) => (score as number) > 0.1)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 6)
                    .map(([family, score]) => (
                      <div key={family} className='text-center'>
                        <div className='w-16 h-16 mx-auto mb-2 bg-white rounded-full flex items-center justify-center border-2 border-purple-200'>
                          <span className='text-2xl'>
                            {family === 'fresh' && '🍋'}
                            {family === 'floral' && '🌸'}
                            {family === 'oriental' && '🌶️'}
                            {family === 'woody' && '🌲'}
                            {family === 'fruity' && '🍓'}
                            {family === 'gourmand' && '🍰'}
                          </span>
                        </div>
                        <div className='text-sm font-medium capitalize text-purple-700'>
                          {family}
                        </div>
                        <div className='text-xs text-purple-600'>
                          {Math.round((score as number) * 100)}%
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            {quizResults.personality_analysis?.occasion_preferences && (
              <div className='mt-6 p-4 bg-white/60 rounded-lg max-w-2xl mx-auto'>
                <p className='text-sm text-purple-800 text-center'>
                  Based on your preferences for{' '}
                  <strong>
                    {Object.entries(quizResults.personality_analysis.dimensions)
                      .filter(([_, score]) => (score as number) > 0.2)
                      .map(([family]) => family)
                      .join(', ')}{' '}
                    scents
                  </strong>{' '}
                  and{' '}
                  <strong>
                    {quizResults.personality_analysis.occasion_preferences
                      .slice(0, 2)
                      .join(', ')}{' '}
                    occasions
                  </strong>
                  , you're a{' '}
                  <strong>
                    {quizResults.ai_profile?.profile_name ||
                      'unique fragrance personality'}
                  </strong>
                  .
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Limited Recommendations (Conversion Hook) */}
        <div>
          <h3 className='text-2xl font-bold text-center mb-6'>
            Your Top 3 Fragrance Discoveries
          </h3>
          <p className='text-center text-sm text-muted-foreground mb-6'>
            ScentMatch guides you to discover fragrances through trusted retail
            partners • We earn commission from partner sales
          </p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            {quizResults.recommendations.slice(0, 3).map((rec, index) => (
              <Card key={rec.fragrance_id} className='relative'>
                <CardContent className='p-6'>
                  <div className='aspect-square bg-gradient-to-br from-cream-100 to-cream-200 rounded-lg mb-4 flex items-center justify-center'>
                    <div className='text-3xl'>🌸</div>
                  </div>

                  <h4 className='font-semibold mb-1'>{rec.name}</h4>
                  <p className='text-sm text-muted-foreground mb-2'>
                    {rec.brand}
                  </p>

                  <Badge variant='accent' className='mb-3'>
                    {rec.match_percentage}% match
                  </Badge>

                  <Button size='sm' className='w-full'>
                    <ExternalLink className='w-4 h-4 mr-2' />
                    Try Sample at Partner
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Conversion Prompt - The Money Shot */}
          <Card className='border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50'>
            <CardContent className='text-center py-8'>
              <div className='relative'>
                <Sparkles className='w-8 h-8 text-purple-500 mx-auto mb-4' />
                <h3 className='text-2xl font-bold mb-2 text-purple-900'>
                  Unlock 12 More Perfect Matches
                </h3>
                <p className='text-lg text-purple-700 mb-6'>
                  Create your free account to see all your personalized
                  recommendations
                </p>

                {/* Value Props */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-sm'>
                  <div className='flex items-center space-x-3 text-purple-800'>
                    <CheckCircle className='w-5 h-5 text-green-500' />
                    <span>15 total personalized recommendations</span>
                  </div>
                  <div className='flex items-center space-x-3 text-purple-800'>
                    <Heart className='w-5 h-5 text-red-500' />
                    <span>Save favorites & build your collection</span>
                  </div>
                  <div className='flex items-center space-x-3 text-purple-800'>
                    <Star className='w-5 h-5 text-amber-500' />
                    <span>Enhanced AI matching gets better over time</span>
                  </div>
                  <div className='flex items-center space-x-3 text-purple-800'>
                    <Gift className='w-5 h-5 text-purple-500' />
                    <span>20% off your first sample order</span>
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
                            personality_type: quizResults.personality_type,
                            confidence: quizResults.confidence,
                          }
                        );
                      }
                      setStep('account_form');
                    }}
                  >
                    Create Free Account - See All Matches
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
              <h2 className='text-2xl font-bold mb-2'>
                Create Your ScentMatch Account
              </h2>
              <p className='text-muted-foreground'>
                Unlock all your personalized matches
              </p>
            </div>

            {/* Quiz Data Preservation Indicator */}
            <div className='bg-green-50 border border-green-200 p-3 rounded-lg mb-6'>
              <div className='flex items-center space-x-2'>
                <CheckCircle className='w-5 h-5 text-green-600' />
                <span className='text-sm text-green-800'>
                  Your {quizResults.personality_type} personality and quiz
                  results will be saved
                </span>
              </div>
            </div>

            {errors.length > 0 && (
              <div className='bg-red-50 border border-red-200 p-3 rounded-lg mb-4'>
                {errors.map(error => (
                  <div key={error} className='text-sm text-red-800'>
                    {error}
                  </div>
                ))}
              </div>
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

              <div>
                <Label htmlFor='firstName'>First Name</Label>
                <Input
                  id='firstName'
                  type='text'
                  value={accountData.firstName}
                  onChange={e =>
                    setAccountData(prev => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder='What should we call you?'
                  className='mt-1'
                  disabled={isCreatingAccount}
                />
              </div>

              <Button
                onClick={handleAccountCreation}
                disabled={
                  isCreatingAccount ||
                  !accountData.email ||
                  !accountData.password ||
                  !accountData.firstName
                }
                className='w-full bg-purple-600 hover:bg-purple-700 py-3 font-semibold'
                size='lg'
              >
                {isCreatingAccount ? (
                  <div className='flex items-center space-x-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account & Unlock All Matches'
                )}
              </Button>

              <div className='text-center'>
                <button
                  onClick={() => setStep('quiz_results')}
                  className='flex items-center space-x-2 text-gray-600 hover:text-gray-800 text-sm mx-auto'
                  disabled={isCreatingAccount}
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
              Your account is ready and your {quizResults.personality_type}{' '}
              personality has been saved
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
                onClick={() =>
                  router.push('/recommendations?quiz_completed=true')
                }
              >
                <ExternalLink className='w-5 h-5 mr-2' />
                View All 15 Recommendations
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
                  See all 15 matches based on your{' '}
                  {quizResults.personality_type} style
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
            <div className='bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6'>
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
            </div>

            {/* Reconsideration Opportunity */}
            <div className='text-center space-y-4'>
              <p className='text-muted-foreground mb-4'>
                Most {quizResults.personality_type} users create accounts to
                unlock their full matches
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
