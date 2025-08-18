'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Gift,
  Star,
  Crown,
  Zap,
  TrendingUp,
  Heart,
  Award,
  Clock,
  Sparkles,
  Users,
  ShoppingBag,
  Mail,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export interface IncentiveData {
  type: 'immediate' | 'future' | 'exclusive' | 'social';
  title: string;
  description: string;
  value: string;
  icon: React.ReactNode;
  urgency?: string;
  claimed_count?: number;
  total_available?: number;
}

interface ConversionIncentivesProps {
  experienceLevel: 'beginner' | 'enthusiast' | 'collector';
  profileData?: {
    profile_name: string;
    uniqueness_score: number;
    style_descriptor: string;
  };
  sessionData?: any;
  onConversionStart?: () => void;
  onIncentiveTracking?: (incentive: string, action: string) => void;
  showLimitedTime?: boolean;
}

/**
 * Conversion Incentives Component
 *
 * Dynamic rewards and incentives system that adapts to user experience level
 * and profile characteristics to maximize conversion motivation.
 */
export function ConversionIncentives({
  experienceLevel,
  profileData,
  sessionData,
  onConversionStart,
  onIncentiveTracking,
  showLimitedTime = true,
}: ConversionIncentivesProps) {
  const [selectedIncentives, setSelectedIncentives] = useState<IncentiveData[]>(
    []
  );
  const [timeRemaining, setTimeRemaining] = useState('24:00:00');
  const [showDetails, setShowDetails] = useState(false);

  // Initialize incentives based on user characteristics
  useEffect(() => {
    const incentives = generatePersonalizedIncentives(
      experienceLevel,
      profileData,
      sessionData
    );
    setSelectedIncentives(incentives);
  }, [experienceLevel, profileData, sessionData]);

  // Countdown timer for urgency
  useEffect(() => {
    if (!showLimitedTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const diff = endOfDay.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [showLimitedTime]);

  const handleIncentiveClick = (incentive: IncentiveData) => {
    if (onIncentiveTracking) {
      onIncentiveTracking(incentive.type, 'clicked');
    }

    // Track incentive engagement
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion_incentive_clicked', {
        incentive_type: incentive.type,
        incentive_title: incentive.title,
        experience_level: experienceLevel,
        profile_uniqueness: profileData?.uniqueness_score,
      });
    }

    if (onConversionStart) {
      onConversionStart();
    }
  };

  const handleShowDetails = () => {
    setShowDetails(!showDetails);

    if (onIncentiveTracking) {
      onIncentiveTracking('details', showDetails ? 'collapsed' : 'expanded');
    }
  };

  const getExperienceConfig = () => {
    switch (experienceLevel) {
      case 'beginner':
        return {
          accentColor: 'text-green-600',
          badgeColor: 'bg-green-100 text-green-800',
          gradientFrom: 'from-green-400',
          gradientTo: 'to-emerald-500',
          borderColor: 'border-green-200',
        };
      case 'enthusiast':
        return {
          accentColor: 'text-purple-600',
          badgeColor: 'bg-purple-100 text-purple-800',
          gradientFrom: 'from-purple-400',
          gradientTo: 'to-pink-500',
          borderColor: 'border-purple-200',
        };
      case 'collector':
        return {
          accentColor: 'text-indigo-600',
          badgeColor: 'bg-indigo-100 text-indigo-800',
          gradientFrom: 'from-indigo-400',
          gradientTo: 'to-purple-500',
          borderColor: 'border-indigo-200',
        };
      default:
        return {
          accentColor: 'text-purple-600',
          badgeColor: 'bg-purple-100 text-purple-800',
          gradientFrom: 'from-purple-400',
          gradientTo: 'to-pink-500',
          borderColor: 'border-purple-200',
        };
    }
  };

  const config = getExperienceConfig();

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Header with Limited Time Offer */}
      {showLimitedTime && (
        <Card
          className={`border-2 ${config.borderColor} bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white`}
        >
          <CardContent className='py-6'>
            <div className='text-center space-y-3'>
              <div className='flex items-center justify-center space-x-2'>
                <Clock className='w-6 h-6' />
                <h2 className='text-2xl font-bold'>
                  Limited Time: Save Your Profile
                </h2>
                <Clock className='w-6 h-6' />
              </div>
              <div className='text-lg font-mono'>
                Expires in: {timeRemaining}
              </div>
              <p className='text-white/90'>
                Your personalized profile and recommendations will be
                permanently lost after 24 hours
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Incentives Grid */}
      <div className='grid md:grid-cols-2 gap-6'>
        {selectedIncentives.map((incentive, index) => (
          <Card
            key={index}
            className={`border-2 ${config.borderColor} hover:shadow-lg transition-all duration-300 cursor-pointer group`}
            onClick={() => handleIncentiveClick(incentive)}
          >
            <CardContent className='p-6'>
              <div className='space-y-4'>
                {/* Incentive Header */}
                <div className='flex items-start justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div
                      className={`${config.accentColor} group-hover:scale-110 transition-transform`}
                    >
                      {incentive.icon}
                    </div>
                    <div>
                      <h3 className='font-semibold text-lg'>
                        {incentive.title}
                      </h3>
                      <Badge className={`${config.badgeColor} text-sm`}>
                        {incentive.value}
                      </Badge>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-5 h-5 ${config.accentColor} opacity-0 group-hover:opacity-100 transition-opacity`}
                  />
                </div>

                {/* Incentive Description */}
                <p className='text-gray-600'>{incentive.description}</p>

                {/* Urgency or Scarcity */}
                {incentive.urgency && (
                  <div className='flex items-center space-x-2 text-sm text-amber-600'>
                    <Zap className='w-4 h-4' />
                    <span>{incentive.urgency}</span>
                  </div>
                )}

                {/* Availability Counter */}
                {incentive.claimed_count !== undefined &&
                  incentive.total_available && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-gray-500'>
                        {incentive.claimed_count} of {incentive.total_available}{' '}
                        claimed
                      </span>
                      <div className='w-24 bg-gray-200 rounded-full h-2'>
                        <div
                          className={`bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} h-2 rounded-full`}
                          style={{
                            width: `${(incentive.claimed_count / incentive.total_available) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Benefits (Expandable) */}
      <Card>
        <CardContent className='py-6'>
          <button
            onClick={handleShowDetails}
            className='w-full flex items-center justify-between text-left'
          >
            <h3 className='text-lg font-semibold'>See All Member Benefits</h3>
            <ArrowRight
              className={`w-5 h-5 ${config.accentColor} transform transition-transform ${showDetails ? 'rotate-90' : ''}`}
            />
          </button>

          {showDetails && (
            <div className='mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {getDetailedBenefits(experienceLevel).map((benefit, index) => (
                <div
                  key={index}
                  className='flex items-start space-x-3 p-3 bg-gray-50 rounded-lg'
                >
                  <div className={config.accentColor}>{benefit.icon}</div>
                  <div>
                    <h4 className='font-medium text-sm'>{benefit.title}</h4>
                    <p className='text-xs text-gray-600'>
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card
        className={`border-2 ${config.borderColor} bg-gradient-to-br from-gray-50 to-gray-100`}
      >
        <CardContent className='py-8 text-center'>
          <div className='space-y-4'>
            <div className='flex items-center justify-center space-x-2'>
              <Crown className={`w-8 h-8 ${config.accentColor}`} />
              <h2 className='text-2xl font-bold'>Unlock All Benefits Now</h2>
            </div>

            <p className='text-gray-600 max-w-md mx-auto'>
              Join thousands of fragrance lovers who've saved their profiles and
              discovered their perfect scents with personalized recommendations.
            </p>

            <Button
              onClick={() => onConversionStart && onConversionStart()}
              className={`bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white px-8 py-4 text-lg hover:shadow-lg transition-all`}
              size='lg'
            >
              <Gift className='w-5 h-5 mr-2' />
              Claim My Rewards & Save Profile
            </Button>

            <div className='flex items-center justify-center space-x-6 text-xs text-gray-500'>
              <div className='flex items-center space-x-1'>
                <CheckCircle className='w-3 h-3' />
                <span>Instant Access</span>
              </div>
              <div className='flex items-center space-x-1'>
                <Gift className='w-3 h-3' />
                <span>Free Forever</span>
              </div>
              <div className='flex items-center space-x-1'>
                <Heart className='w-3 h-3' />
                <span>No Spam</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Generate Personalized Incentives Based on User Characteristics
 */
function generatePersonalizedIncentives(
  experienceLevel: 'beginner' | 'enthusiast' | 'collector',
  profileData?: {
    profile_name: string;
    uniqueness_score: number;
    style_descriptor: string;
  },
  sessionData?: any
): IncentiveData[] {
  const baseIncentives: Record<string, IncentiveData[]> = {
    beginner: [
      {
        type: 'immediate',
        title: "Beginner's Fragrance Guide",
        description:
          'Get instant access to our curated starter collection and expert tips for fragrance beginners.',
        value: '$25 Value',
        icon: <Gift className='w-6 h-6' />,
        urgency: 'Available for first 100 new members today',
        claimed_count: 73,
        total_available: 100,
      },
      {
        type: 'future',
        title: 'Monthly Fragrance Discovery Box',
        description:
          'Receive 3 personalized sample recommendations delivered monthly, curated for your developing taste.',
        value: '$35/month',
        icon: <ShoppingBag className='w-6 h-6' />,
      },
      {
        type: 'exclusive',
        title: 'New Release Early Access',
        description:
          "Be the first to try new fragrances before they're available to the general public.",
        value: 'Priceless',
        icon: <Star className='w-6 h-6' />,
      },
    ],
    enthusiast: [
      {
        type: 'immediate',
        title: 'Sophisticated Profile Insights',
        description:
          'Unlock 15 AI-powered personality insights and detailed fragrance match explanations.',
        value: '$47 Value',
        icon: <Sparkles className='w-6 h-6' />,
        urgency: 'Profile expires in 24 hours',
      },
      {
        type: 'future',
        title: 'Curated Discovery Program',
        description:
          'Access our exclusive fragrance curation program with niche and artisanal discoveries.',
        value: '$60/month',
        icon: <Award className='w-6 h-6' />,
      },
      {
        type: 'social',
        title: 'Fragrance Community Access',
        description:
          'Join our community of fragrance enthusiasts, share reviews, and get recommendations from peers.',
        value: 'Community',
        icon: <Users className='w-6 h-6' />,
      },
    ],
    collector: [
      {
        type: 'immediate',
        title: 'Connoisseur Profile Certification',
        description:
          'Receive official recognition of your sophisticated palate with detailed analysis and recommendations.',
        value: '$85 Value',
        icon: <Crown className='w-6 h-6' />,
        urgency: 'Limited to 50 profiles per month',
        claimed_count: 37,
        total_available: 50,
      },
      {
        type: 'exclusive',
        title: 'Master Perfumer Network',
        description:
          'Direct access to master perfumers for exclusive releases and custom fragrance consultations.',
        value: 'Exclusive',
        icon: <Award className='w-6 h-6' />,
      },
      {
        type: 'future',
        title: 'Rare & Vintage Collection',
        description:
          'Access to our rare and vintage fragrance collection, including discontinued and limited editions.',
        value: '$200+ Value',
        icon: <TrendingUp className='w-6 h-6' />,
      },
    ],
  };

  const incentives = [...(baseIncentives[experienceLevel] || [])];

  // Add uniqueness-based bonus incentive
  if (profileData && profileData.uniqueness_score > 0.85) {
    incentives.unshift({
      type: 'exclusive',
      title: 'Ultra-Rare Profile Bonus',
      description: `Your ${Math.round(profileData.uniqueness_score * 100)}% unique profile qualifies for exclusive rare fragrance access.`,
      value: 'Exclusive',
      icon: <Crown className='w-6 h-6' />,
      urgency: 'Only for top 15% of unique profiles',
    });
  }

  return incentives.slice(0, 4); // Limit to 4 for optimal display
}

/**
 * Get Detailed Benefits for Expandable Section
 */
function getDetailedBenefits(
  experienceLevel: 'beginner' | 'enthusiast' | 'collector'
) {
  const commonBenefits = [
    {
      title: 'Personalized Recommendations',
      description: 'AI-powered fragrance matching',
      icon: <Sparkles className='w-4 h-4' />,
    },
    {
      title: 'Sample Priority Access',
      description: 'First access to new samples',
      icon: <Star className='w-4 h-4' />,
    },
    {
      title: 'Profile Analytics',
      description: 'Deep insights into your taste',
      icon: <TrendingUp className='w-4 h-4' />,
    },
    {
      title: 'Wishlist & Tracking',
      description: 'Save and track favorites',
      icon: <Heart className='w-4 h-4' />,
    },
    {
      title: 'Exclusive Content',
      description: 'Members-only articles & guides',
      icon: <Award className='w-4 h-4' />,
    },
    {
      title: 'Community Access',
      description: 'Connect with fragrance lovers',
      icon: <Users className='w-4 h-4' />,
    },
  ];

  const levelSpecificBenefits = {
    beginner: [
      {
        title: 'Beginner Education',
        description: 'Step-by-step fragrance learning',
        icon: <Gift className='w-4 h-4' />,
      },
      {
        title: 'Safe Recommendations',
        description: 'Crowd-pleasing, approachable scents',
        icon: <CheckCircle className='w-4 h-4' />,
      },
    ],
    enthusiast: [
      {
        title: 'Niche Discovery',
        description: 'Hidden gem fragrances',
        icon: <Zap className='w-4 h-4' />,
      },
      {
        title: 'Trend Alerts',
        description: 'Latest fragrance trends',
        icon: <TrendingUp className='w-4 h-4' />,
      },
    ],
    collector: [
      {
        title: 'Rare Access',
        description: 'Vintage & limited editions',
        icon: <Crown className='w-4 h-4' />,
      },
      {
        title: 'Expert Network',
        description: 'Master perfumer connections',
        icon: <Award className='w-4 h-4' />,
      },
    ],
  };

  return [...commonBenefits, ...levelSpecificBenefits[experienceLevel]];
}
