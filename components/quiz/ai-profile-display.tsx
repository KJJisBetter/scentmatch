'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Check, Sparkles, User, TrendingUp } from 'lucide-react';

export type ExperienceContext = 'beginner' | 'enthusiast' | 'collector';

interface ProfileData {
  profile_name: string;
  style_descriptor: string;
  description: {
    paragraph_1: string;
    paragraph_2: string;
    paragraph_3: string;
  };
  uniqueness_score: number;
  experience_context: ExperienceContext;
  personality_insights: string[];
}

interface AIProfileDisplayProps {
  profileData: ProfileData;
  enableSharing?: boolean;
  onAccountConversion?: () => void;
  onContinueToRecommendations?: () => void;
}

/**
 * AIProfileDisplay Component
 *
 * Displays AI-generated unique fragrance personality profiles with:
 * - Distinctive profile names (e.g., "Velvet Wanderer of Midnight Gardens")
 * - Multi-paragraph personality insights
 * - Experience-level adaptive presentation
 * - Social sharing capabilities
 * - Account conversion incentives
 */
export function AIProfileDisplay({
  profileData,
  enableSharing = false,
  onAccountConversion,
  onContinueToRecommendations,
}: AIProfileDisplayProps) {
  const [showSharing, setShowSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleShare = () => {
    setShowSharing(!showSharing);

    // Track sharing action
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'profile_share_clicked', {
        profile_name: profileData.profile_name,
        experience_context: profileData.experience_context,
        uniqueness_score: profileData.uniqueness_score,
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      const profileUrl = `${window.location.origin}/profile/shared?name=${encodeURIComponent(profileData.profile_name)}`;
      await navigator.clipboard.writeText(profileUrl);
      setCopySuccess(true);

      // Track successful copy
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'profile_link_copied', {
          profile_name: profileData.profile_name,
        });
      }

      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy profile link:', error);
    }
  };

  const handleAccountConversion = () => {
    if (onAccountConversion) {
      // Track conversion attempt
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'profile_account_conversion_clicked', {
          profile_name: profileData.profile_name,
          experience_context: profileData.experience_context,
        });
      }

      onAccountConversion();
    }
  };

  const handleContinue = () => {
    if (onContinueToRecommendations) {
      onContinueToRecommendations();
    }
  };

  // Get experience-level specific styling and text
  const getExperienceConfig = () => {
    switch (profileData.experience_context) {
      case 'beginner':
        return {
          badge: '🌱 Your Fragrance Journey Begins',
          badgeColor: 'bg-green-100 text-green-800 border-green-300',
          encouragement: 'Welcome to the wonderful world of fragrances!',
          accentColor: 'text-green-600',
          gradientFrom: 'from-green-400',
          gradientTo: 'to-emerald-500',
        };
      case 'enthusiast':
        return {
          badge: '🌸 Your Fragrance Identity',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
          encouragement: 'Your sophisticated taste shines through',
          accentColor: 'text-purple-600',
          gradientFrom: 'from-purple-400',
          gradientTo: 'to-pink-500',
        };
      case 'collector':
        return {
          badge: '🎭 Your Connoisseur Profile',
          badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          encouragement: 'A true fragrance connoisseur revealed',
          accentColor: 'text-indigo-600',
          gradientFrom: 'from-indigo-400',
          gradientTo: 'to-purple-500',
        };
      default:
        return {
          badge: '✨ Your Unique Profile',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
          encouragement: 'Your fragrance personality revealed',
          accentColor: 'text-purple-600',
          gradientFrom: 'from-purple-400',
          gradientTo: 'to-pink-500',
        };
    }
  };

  const experienceConfig = getExperienceConfig();
  const uniquenessPercent = Math.round(profileData.uniqueness_score * 100);

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Header with Profile Name */}
      <div className='text-center'>
        <Badge
          className={`px-4 py-2 text-lg font-medium border ${experienceConfig.badgeColor} mb-4`}
        >
          {experienceConfig.badge}
        </Badge>

        <h1
          className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${experienceConfig.gradientFrom} ${experienceConfig.gradientTo} bg-clip-text text-transparent leading-tight mb-2`}
        >
          {profileData.profile_name}
        </h1>

        <p
          className={`text-xl ${experienceConfig.accentColor} font-medium mb-4`}
        >
          {profileData.style_descriptor}
        </p>

        <p className='text-muted-foreground mb-6'>
          {experienceConfig.encouragement}
        </p>
      </div>

      {/* Uniqueness Score */}
      <Card className='border-2 border-dashed border-purple-200'>
        <CardContent className='py-6'>
          <div className='flex items-center justify-center space-x-4'>
            <Sparkles className={`w-8 h-8 ${experienceConfig.accentColor}`} />
            <div className='text-center'>
              <div
                className={`text-3xl font-bold ${experienceConfig.accentColor}`}
              >
                {uniquenessPercent}% Uniqueness
              </div>
              <p className='text-sm text-muted-foreground'>
                Your profile is more unique than {uniquenessPercent}% of
                fragrance lovers
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${experienceConfig.accentColor}`} />
          </div>
        </CardContent>
      </Card>

      {/* Profile Description */}
      <Card>
        <CardContent className='py-8'>
          <div className='space-y-6 text-lg leading-relaxed'>
            <div className='flex items-start space-x-3'>
              <User
                className={`w-6 h-6 ${experienceConfig.accentColor} mt-1 flex-shrink-0`}
              />
              <p className='text-gray-700'>
                {profileData.description.paragraph_1}
              </p>
            </div>

            <div className='flex items-start space-x-3'>
              <Sparkles
                className={`w-6 h-6 ${experienceConfig.accentColor} mt-1 flex-shrink-0`}
              />
              <p className='text-gray-700'>
                {profileData.description.paragraph_2}
              </p>
            </div>

            <div className='flex items-start space-x-3'>
              <TrendingUp
                className={`w-6 h-6 ${experienceConfig.accentColor} mt-1 flex-shrink-0`}
              />
              <p className='text-gray-700'>
                {profileData.description.paragraph_3}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personality Insights */}
      {profileData.personality_insights &&
        profileData.personality_insights.length > 0 && (
          <Card>
            <CardContent className='py-6'>
              <h3 className='text-xl font-semibold mb-4'>
                Your Fragrance Insights
              </h3>
              <div className='flex flex-wrap gap-2'>
                {profileData.personality_insights.map((insight, index) => (
                  <Badge
                    key={index}
                    variant='secondary'
                    className='px-3 py-1 text-sm'
                  >
                    {insight}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Sharing Options */}
      {enableSharing && (
        <Card>
          <CardContent className='py-6'>
            <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
              <div className='text-center sm:text-left'>
                <h3 className='font-semibold'>Love your profile?</h3>
                <p className='text-sm text-muted-foreground'>
                  Share your unique fragrance personality with friends
                </p>
              </div>

              <div className='flex gap-3'>
                <Button
                  variant='outline'
                  onClick={handleShare}
                  className='flex items-center gap-2'
                >
                  <Share2 className='w-4 h-4' />
                  Share Profile
                </Button>

                {showSharing && (
                  <Button
                    variant='outline'
                    onClick={handleCopyLink}
                    className='flex items-center gap-2'
                  >
                    {copySuccess ? (
                      <>
                        <Check className='w-4 h-4 text-green-500' />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className='w-4 h-4' />
                        Copy Link
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <Button
          onClick={handleContinue}
          className='flex-1 py-4 text-lg'
          size='lg'
        >
          <Sparkles className='w-5 h-5 mr-2' />
          See Your Fragrance Recommendations
        </Button>

        {onAccountConversion && (
          <Button
            variant='outline'
            onClick={handleAccountConversion}
            className='py-4 px-8'
            size='lg'
          >
            Save Profile & Create Account
          </Button>
        )}
      </div>

      {/* Conversion Incentive */}
      {onAccountConversion && (
        <Card className='border-amber-200 bg-amber-50'>
          <CardContent className='py-4'>
            <p className='text-center text-sm text-amber-800'>
              💎 <strong>Save your unique profile:</strong> Create an account to
              access your recommendations anytime and get personalized updates
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
