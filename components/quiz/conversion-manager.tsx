'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SeamlessConversionFlow } from './seamless-conversion-flow';
import { AIProfileDisplay } from './ai-profile-display';
import { useGuestSession } from '@/lib/hooks/use-guest-session';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Clock,
  Shield,
  Heart,
  Users,
  Award,
  ArrowRight,
  Sparkles,
  Mail,
} from 'lucide-react';

interface ConversionManagerProps {
  onConversionComplete?: (result: any) => void;
  onContinueAsGuest?: () => void;
  showConversionFlow?: boolean;
  profileData?: {
    profile_name: string;
    style_descriptor: string;
    description: {
      paragraph_1: string;
      paragraph_2: string;
      paragraph_3: string;
    };
    uniqueness_score: number;
    personality_insights: string[];
  };
}

/**
 * Conversion Manager Component
 *
 * Orchestrates the complete conversion optimization experience:
 * - Analyzes guest session quality
 * - Determines optimal conversion timing
 * - Implements loss aversion and social proof
 * - Manages seamless transition flow
 */
export function ConversionManager({
  onConversionComplete,
  onContinueAsGuest,
  showConversionFlow = false,
  profileData,
}: ConversionManagerProps) {
  const {
    sessionData,
    isLoading,
    sessionId,
    getSessionQuality,
    isReadyForConversion,
    getConversionReadiness,
  } = useGuestSession();

  const [showConversion, setShowConversion] = useState(showConversionFlow);
  const [conversionStrategy, setConversionStrategy] = useState<
    'immediate' | 'value_build' | 'delayed'
  >('immediate');
  const [socialProofData, setSocialProofData] = useState<any>(null);

  // Calculate conversion metrics
  const sessionQuality = sessionData ? getSessionQuality() : 0;
  const conversionReadiness = sessionData ? getConversionReadiness() : 0;
  const estimatedValue = calculateEstimatedValue(sessionData);

  // Load relevant social proof data
  const loadSocialProofData = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/social-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience_level: sessionData?.experience_level,
          profile_type: profileData?.style_descriptor,
          uniqueness_score: profileData?.uniqueness_score,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSocialProofData(data);
      }
    } catch (error) {
      console.error('Failed to load social proof data:', error);
    }
  }, [sessionData, profileData]);

  // Determine conversion strategy based on session data
  useEffect(() => {
    if (!sessionData || isLoading) return;

    if (conversionReadiness >= 0.8) {
      setConversionStrategy('immediate');
    } else if (conversionReadiness >= 0.6) {
      setConversionStrategy('value_build');
    } else {
      setConversionStrategy('delayed');
    }

    // Load social proof data for current user profile
    loadSocialProofData();
  }, [sessionData, conversionReadiness, isLoading, loadSocialProofData]);

  const handleShowConversion = () => {
    setShowConversion(true);

    // Track conversion flow display
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion_flow_displayed', {
        session_id: sessionId,
        conversion_strategy: conversionStrategy,
        session_quality: sessionQuality,
        readiness_score: conversionReadiness,
      });
    }
  };

  const handleConversionComplete = (result: any) => {
    // Track conversion success
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion_manager_success', {
        user_id: result.user_id,
        conversion_type: result.conversion_type,
        profile_preserved: result.profile_preserved,
        session_quality: sessionQuality,
      });
    }

    if (onConversionComplete) {
      onConversionComplete(result);
    }
  };

  const handleContinueAsGuest = () => {
    // Track guest continuation
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'continue_as_guest_selected', {
        session_id: sessionId,
        estimated_value_lost: estimatedValue,
        conversion_strategy: conversionStrategy,
        missed_opportunity: true,
      });
    }

    if (onContinueAsGuest) {
      onContinueAsGuest();
    }
  };

  if (isLoading) {
    return (
      <div className='max-w-lg mx-auto text-center py-8'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2'></div>
          <div className='h-4 bg-gray-200 rounded w-1/2 mx-auto'></div>
        </div>
      </div>
    );
  }

  // Show conversion flow if requested
  if (showConversion) {
    return (
      <SeamlessConversionFlow
        guestSessionData={sessionData}
        profileData={profileData}
        onConversionComplete={handleConversionComplete}
        onSkip={handleContinueAsGuest}
      />
    );
  }

  // Render conversion prompt based on strategy
  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      {/* Value Communication Card */}
      <Card className='border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50'>
        <CardContent className='py-8'>
          <div className='text-center space-y-4'>
            <div className='flex items-center justify-center space-x-2'>
              <Sparkles className='w-6 h-6 text-purple-600' />
              <h2 className='text-2xl font-semibold'>
                Your Personalized Profile is Ready!
              </h2>
            </div>

            {profileData && (
              <div className='space-y-2'>
                <h3 className='text-xl font-semibold text-purple-700'>
                  "{profileData.profile_name}"
                </h3>
                <Badge className='bg-purple-100 text-purple-800'>
                  {Math.round(profileData.uniqueness_score * 100)}% Unique
                  Profile
                </Badge>
              </div>
            )}

            {/* Value Metrics */}
            <div className='grid grid-cols-3 gap-4 max-w-md mx-auto'>
              <div className='text-center'>
                <Heart className='w-6 h-6 text-red-500 mx-auto mb-1' />
                <div className='text-lg font-semibold'>${estimatedValue}</div>
                <div className='text-xs text-gray-600'>Monthly Value</div>
              </div>
              <div className='text-center'>
                <TrendingUp className='w-6 h-6 text-green-500 mx-auto mb-1' />
                <div className='text-lg font-semibold'>
                  {Math.round(sessionQuality * 100)}%
                </div>
                <div className='text-xs text-gray-600'>Profile Quality</div>
              </div>
              <div className='text-center'>
                <Award className='w-6 h-6 text-amber-500 mx-auto mb-1' />
                <div className='text-lg font-semibold'>3x</div>
                <div className='text-xs text-gray-600'>Better Matches</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loss Aversion Warning */}
      <Card className='border-amber-200 bg-amber-50'>
        <CardContent className='py-4'>
          <div className='flex items-center space-x-3'>
            <Clock className='w-5 h-5 text-amber-600 flex-shrink-0' />
            <div className='text-sm text-amber-800'>
              <p className='font-medium'>
                Your ${estimatedValue}/month personalized profile expires in 24
                hours
              </p>
              <p className='text-xs mt-1'>
                This level of personalization cannot be recreated without
                retaking the full quiz
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Proof */}
      {socialProofData && (
        <Card className='border-blue-200 bg-blue-50'>
          <CardContent className='py-4'>
            <div className='flex items-center space-x-3'>
              <Users className='w-5 h-5 text-blue-600 flex-shrink-0' />
              <div className='text-sm text-blue-800'>
                <p>
                  <strong>
                    {socialProofData.percentage}% of {socialProofData.user_type}{' '}
                    users
                  </strong>{' '}
                  save their profiles. They find{' '}
                  <strong>
                    {socialProofData.improvement_factor}x better fragrance
                    matches
                  </strong>{' '}
                  on average.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Action */}
      <div className='space-y-4'>
        <Button
          onClick={handleShowConversion}
          className='w-full bg-purple-600 hover:bg-purple-700 text-white py-4 text-lg'
          size='lg'
        >
          <Shield className='w-5 h-5 mr-2' />
          Save My ${estimatedValue}/Month Profile Now
        </Button>

        <div className='grid grid-cols-2 gap-3'>
          <Button
            onClick={handleShowConversion}
            variant='outline'
            className='text-center py-3'
          >
            <Mail className='w-4 h-4 mr-2' />
            Quick Save (Email Only)
          </Button>

          <Button
            onClick={handleContinueAsGuest}
            variant='ghost'
            className='text-center py-3 text-gray-600'
          >
            Continue as Guest
          </Button>
        </div>
      </div>

      {/* Trust Signals */}
      <div className='flex items-center justify-center space-x-6 text-xs text-gray-500'>
        <div className='flex items-center space-x-1'>
          <Shield className='w-3 h-3' />
          <span>Secure & Private</span>
        </div>
        <div className='flex items-center space-x-1'>
          <Heart className='w-3 h-3' />
          <span>No Spam Promise</span>
        </div>
        <div className='flex items-center space-x-1'>
          <Clock className='w-3 h-3' />
          <span>Cancel Anytime</span>
        </div>
      </div>

      {/* Conversion Strategy Specific Content */}
      {conversionStrategy === 'value_build' && (
        <Card className='border-green-200 bg-green-50'>
          <CardContent className='py-4'>
            <div className='text-center text-sm text-green-800'>
              <p className='font-medium mb-1'>💡 Pro Tip:</p>
              <p>
                Users with profiles like yours typically save them to unlock
                exclusive fragrance discoveries and get notified about new
                releases that match their taste.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {conversionStrategy === 'immediate' && (
        <Card className='border-purple-200 bg-purple-50'>
          <CardContent className='py-4'>
            <div className='text-center text-sm text-purple-800'>
              <p className='font-medium mb-1'>🎯 Perfect Profile Detected!</p>
              <p>
                Your {Math.round(profileData?.uniqueness_score || 0.85 * 100)}%
                unique profile is ready. Save it now to unlock personalized
                fragrance recommendations and exclusive access.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Calculate Estimated Value from Session Data
 */
function calculateEstimatedValue(sessionData: any): number {
  if (!sessionData) return 25;

  let baseValue = 25;

  if (sessionData.experience_level === 'collector') baseValue += 15;
  else if (sessionData.experience_level === 'enthusiast') baseValue += 10;

  if (sessionData.favorite_fragrances?.length > 0) {
    baseValue += sessionData.favorite_fragrances.length * 3;
  }

  if (sessionData.ai_profile?.uniqueness_score > 0.8) baseValue += 12;
  else if (sessionData.ai_profile?.uniqueness_score > 0.6) baseValue += 8;

  if (sessionData.quiz_responses?.length >= 4) baseValue += 8;

  return Math.min(baseValue, 65);
}
