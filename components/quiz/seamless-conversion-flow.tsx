'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Heart,
} from 'lucide-react';
import {
  seamlessConversion,
  quickConversion,
} from '@/app/actions/seamless-conversion';

interface ConversionFlowProps {
  guestSessionData: any;
  profileData?: {
    profile_name: string;
    style_descriptor: string;
    uniqueness_score: number;
  };
  onConversionComplete?: (result: any) => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
}

/**
 * Seamless Conversion Flow Component
 *
 * Optimized for maximum conversion rate with minimal friction.
 * Implements loss aversion, social proof, and value communication.
 */
export function SeamlessConversionFlow({
  guestSessionData,
  profileData,
  onConversionComplete,
  onSkip,
  showSkipOption = true,
}: ConversionFlowProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionType, setConversionType] = useState<'full' | 'quick'>(
    'full'
  );
  const [showSuccess, setShowSuccess] = useState(false);

  // Calculate estimated value for loss aversion messaging
  const estimatedValue = calculateEstimatedValue(guestSessionData);
  const uniquenessPercent = profileData
    ? Math.round(profileData.uniqueness_score * 100)
    : 85;

  // Track component mounting for analytics
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion_flow_displayed', {
        profile_name: profileData?.profile_name,
        estimated_value: estimatedValue,
        uniqueness_score: uniquenessPercent,
        guest_data_quality: calculateDataQuality(guestSessionData),
      });
    }
  }, [
    estimatedValue,
    guestSessionData,
    profileData?.profile_name,
    uniquenessPercent,
  ]);

  const handleFullConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Track conversion attempt
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion_attempt_started', {
          conversion_type: 'full',
          email_provided: !!email,
          password_provided: !!password,
        });
      }

      const result = await seamlessConversion(
        email,
        password,
        guestSessionData
      );

      if (result.success) {
        setShowSuccess(true);

        // Track successful conversion
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion_completed', {
            conversion_type: 'full',
            user_id: result.user_id,
            profile_preserved: result.profile_preserved,
          });
        }

        // Clear guest session data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('guest_quiz_session');
        }

        setTimeout(() => {
          if (onConversionComplete) {
            onConversionComplete(result);
          }
        }, 2000);
      } else {
        setError(
          'error' in result && result.error ? result.error : 'Conversion failed'
        );

        // Track conversion failure
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion_failed', {
            conversion_type: 'full',
            error_type: 'error' in result ? result.error : 'unknown',
          });
        }
      }
    } catch (error) {
      console.error('Conversion error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickConversion = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Track quick conversion attempt
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion_attempt_started', {
          conversion_type: 'quick',
          email_provided: !!email,
        });
      }

      const result = await quickConversion(email, guestSessionData);

      if (result.success) {
        setShowSuccess(true);

        // Track successful quick conversion
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion_completed', {
            conversion_type: 'quick',
            user_id: result.user_id,
            password_setup_required:
              'password_setup_required' in result
                ? result.password_setup_required
                : false,
          });
        }

        // Clear guest session data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('guest_quiz_session');
        }

        setTimeout(() => {
          if (onConversionComplete) {
            onConversionComplete(result);
          }
        }, 2000);
      } else {
        setError(
          'error' in result && result.error
            ? result.error
            : 'Quick conversion failed'
        );
      }
    } catch (error) {
      console.error('Quick conversion error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Track skip action
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion_skipped', {
        estimated_value: estimatedValue,
        profile_name: profileData?.profile_name,
      });
    }

    if (onSkip) {
      onSkip();
    }
  };

  // Success state
  if (showSuccess) {
    return (
      <div className='max-w-lg mx-auto text-center space-y-6'>
        <Card className='border-green-200 bg-green-50'>
          <CardContent className='py-8'>
            <CheckCircle className='w-16 h-16 text-green-600 mx-auto mb-4' />
            <h2 className='text-2xl font-semibold text-green-900 mb-2'>
              Welcome to ScentMatch!
            </h2>
            <p className='text-green-700'>
              Your profile and recommendations have been saved.
              {conversionType === 'quick' &&
                ' Check your email to set up your password.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      {/* Value Proposition Header */}
      <Card className='border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50'>
        <CardContent className='py-6'>
          <div className='text-center space-y-4'>
            <Sparkles className='w-8 h-8 text-purple-600 mx-auto' />
            <div>
              <h2 className='text-2xl font-semibold text-gray-900 mb-2'>
                Save Your Unique Profile
              </h2>
              {profileData && (
                <Badge className='bg-purple-100 text-purple-800 text-lg px-4 py-1 mb-3'>
                  "{profileData.profile_name}"
                </Badge>
              )}
              <div className='flex items-center justify-center space-x-6 text-sm text-gray-600'>
                <div className='flex items-center space-x-1'>
                  <Sparkles className='w-4 h-4 text-purple-500' />
                  <span>{uniquenessPercent}% Unique</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <Heart className='w-4 h-4 text-red-500' />
                  <span>${estimatedValue}/month value</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <Clock className='w-4 h-4 text-amber-500' />
                  <span>Expires in 24h</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loss Aversion Warning */}
      <Card className='border-amber-200 bg-amber-50'>
        <CardContent className='py-4'>
          <div className='flex items-start space-x-3'>
            <AlertCircle className='w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0' />
            <div className='text-sm text-amber-800'>
              <p className='font-medium mb-1'>
                Don't lose your personalized profile!
              </p>
              <p>
                Your {uniquenessPercent}% unique fragrance profile and $
                {estimatedValue}/month in personalized recommendations will be
                lost if you don't save it now. This level of personalization
                cannot be recreated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Form */}
      <Card>
        <CardContent className='py-8'>
          <div className='space-y-6'>
            {/* Social Proof */}
            <div className='text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg'>
              <p>
                <strong>94% of users with your profile type</strong> save their
                results. Users who save find{' '}
                <strong>3x better fragrance matches</strong> on average.
              </p>
            </div>

            {/* Tab Selection */}
            <div className='flex space-x-2 bg-gray-100 rounded-lg p-1'>
              <button
                onClick={() => setConversionType('full')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  conversionType === 'full'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Create Full Account
              </button>
              <button
                onClick={() => setConversionType('quick')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  conversionType === 'quick'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Quick Save (Email Only)
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFullConversion} className='space-y-4'>
              {/* Email Input */}
              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Email Address
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <Input
                    id='email'
                    type='email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder='Enter your email'
                    className='pl-10'
                    required
                  />
                </div>
              </div>

              {/* Password Input (Full Account Only) */}
              {conversionType === 'full' && (
                <div>
                  <label
                    htmlFor='password'
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    Password
                  </label>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                    <Input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder='Create a password'
                      className='pl-10 pr-12'
                      required
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                    >
                      {showPassword ? (
                        <EyeOff className='w-5 h-5' />
                      ) : (
                        <Eye className='w-5 h-5' />
                      )}
                    </button>
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    Must contain uppercase, lowercase, and number (8+
                    characters)
                  </p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                  <div className='flex items-center space-x-2'>
                    <AlertCircle className='w-4 h-4 text-red-500' />
                    <p className='text-sm text-red-700'>{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className='space-y-3'>
                {conversionType === 'full' ? (
                  <Button
                    type='submit'
                    disabled={isLoading || !email || !password}
                    className='w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg'
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                        Creating Your Account...
                      </>
                    ) : (
                      <>
                        <Shield className='w-5 h-5 mr-2' />
                        Save My Profile & Create Account
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type='button'
                    onClick={handleQuickConversion}
                    disabled={isLoading || !email}
                    className='w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg'
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                        Quick Saving...
                      </>
                    ) : (
                      <>
                        <ArrowRight className='w-5 h-5 mr-2' />
                        Quick Save (Set Password Later)
                      </>
                    )}
                  </Button>
                )}

                {/* Skip Option */}
                {showSkipOption && (
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={handleSkip}
                    className='w-full text-gray-600 hover:text-gray-800'
                  >
                    Continue as Guest (Profile Will Be Lost)
                  </Button>
                )}
              </div>
            </form>

            {/* Trust Signals */}
            <div className='flex items-center justify-center space-x-6 text-xs text-gray-500 pt-4 border-t'>
              <div className='flex items-center space-x-1'>
                <Shield className='w-3 h-3' />
                <span>Secure & Private</span>
              </div>
              <div className='flex items-center space-x-1'>
                <Mail className='w-3 h-3' />
                <span>No Spam Promise</span>
              </div>
              <div className='flex items-center space-x-1'>
                <CheckCircle className='w-3 h-3' />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Calculate Estimated Monthly Value from Guest Session Data
 */
function calculateEstimatedValue(guestData: any): number {
  let baseValue = 25; // Base value for any completed quiz

  // Add value for experience level
  if (guestData.experience_level === 'collector') baseValue += 15;
  else if (guestData.experience_level === 'enthusiast') baseValue += 10;

  // Add value for favorite fragrances provided
  if (guestData.favorite_fragrances?.length > 0) {
    baseValue += guestData.favorite_fragrances.length * 3;
  }

  // Add value for AI profile uniqueness
  if (guestData.ai_profile?.uniqueness_score > 0.8) baseValue += 12;
  else if (guestData.ai_profile?.uniqueness_score > 0.6) baseValue += 8;

  // Add value for comprehensive quiz responses
  if (guestData.quiz_responses?.length >= 4) baseValue += 8;

  return Math.min(baseValue, 65); // Cap at $65
}

/**
 * Calculate Data Quality Score for Analytics
 */
function calculateDataQuality(guestData: any): number {
  let quality = 0;

  if (guestData.experience_level) quality += 0.2;
  if (guestData.gender_preference) quality += 0.1;
  if (guestData.quiz_responses?.length >= 3) quality += 0.3;
  if (guestData.favorite_fragrances?.length > 0) quality += 0.2;
  if (guestData.ai_profile) quality += 0.2;

  return Math.round(quality * 100) / 100;
}
