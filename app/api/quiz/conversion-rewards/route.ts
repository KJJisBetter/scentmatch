import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const rewardsRequestSchema = z.object({
  user_id: z.string().optional(),
  experience_level: z.enum(['beginner', 'enthusiast', 'collector']),
  profile_data: z
    .object({
      profile_name: z.string(),
      uniqueness_score: z.number().min(0).max(1),
      style_descriptor: z.string(),
    })
    .optional(),
  session_data: z
    .object({
      quiz_responses_count: z.number(),
      favorite_fragrances_count: z.number(),
      time_spent_minutes: z.number(),
      completion_percentage: z.number(),
    })
    .optional(),
  action: z.enum(['get_rewards', 'claim_reward', 'track_engagement']),
  reward_id: z.string().optional(),
});

/**
 * POST /api/quiz/conversion-rewards
 *
 * Manages dynamic conversion rewards and incentives system
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const validationResult = rewardsRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const {
      user_id,
      experience_level,
      profile_data,
      session_data,
      action,
      reward_id,
    } = validationResult.data;

    switch (action) {
      case 'get_rewards':
        return NextResponse.json(
          await getPersonalizedRewards(
            experience_level,
            profile_data,
            session_data
          )
        );

      case 'claim_reward':
        if (!reward_id) {
          return NextResponse.json(
            { error: 'Reward ID required for claiming' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          await claimReward(user_id, reward_id, experience_level)
        );

      case 'track_engagement':
        return NextResponse.json(
          await trackRewardEngagement(
            user_id,
            reward_id,
            experience_level,
            session_data
          )
        );

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Conversion rewards API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get Personalized Rewards Based on User Characteristics
 */
async function getPersonalizedRewards(
  experienceLevel: 'beginner' | 'enthusiast' | 'collector',
  profileData?: any,
  sessionData?: any
) {
  const rewards = {
    immediate_rewards: generateImmediateRewards(experienceLevel, profileData),
    future_benefits: generateFutureBenefits(experienceLevel, sessionData),
    exclusive_access: generateExclusiveAccess(experienceLevel, profileData),
    social_benefits: generateSocialBenefits(experienceLevel),
    gamification: generateGamificationRewards(experienceLevel, sessionData),
  };

  // Calculate total reward value
  const totalValue = calculateTotalRewardValue(rewards);

  // Generate urgency messaging
  const urgencyData = generateUrgencyMessaging(experienceLevel, profileData);

  return {
    ...rewards,
    total_value: totalValue,
    urgency: urgencyData,
    personalization_score: calculatePersonalizationScore(
      profileData,
      sessionData
    ),
    conversion_confidence: calculateConversionConfidence(
      experienceLevel,
      profileData,
      sessionData
    ),
  };
}

/**
 * Generate Immediate Rewards
 */
function generateImmediateRewards(experienceLevel: string, profileData?: any) {
  const rewards = {
    beginner: [
      {
        id: 'starter_guide',
        title: 'Fragrance Starter Guide',
        description: "Complete beginner's guide to understanding fragrances",
        value: '$25',
        type: 'educational',
        available_immediately: true,
      },
      {
        id: 'first_sample_discount',
        title: '50% Off First Sample Set',
        description: 'Try 3 recommended fragrances at half price',
        value: '$15 savings',
        type: 'discount',
        available_immediately: true,
      },
    ],
    enthusiast: [
      {
        id: 'ai_insights',
        title: 'AI Personality Insights',
        description: '15 detailed insights about your fragrance personality',
        value: '$47',
        type: 'premium_content',
        available_immediately: true,
      },
      {
        id: 'niche_discovery',
        title: 'Niche Fragrance Discovery List',
        description:
          'Personalized list of 10 niche fragrances for your profile',
        value: '$35',
        type: 'recommendations',
        available_immediately: true,
      },
    ],
    collector: [
      {
        id: 'connoisseur_analysis',
        title: 'Expert Connoisseur Analysis',
        description: 'Detailed analysis of your sophisticated taste profile',
        value: '$85',
        type: 'expert_service',
        available_immediately: true,
      },
      {
        id: 'rare_access_pass',
        title: 'Rare Fragrance Access Pass',
        description: 'Immediate access to our rare and vintage collection',
        value: '$150',
        type: 'exclusive_access',
        available_immediately: true,
      },
    ],
  };

  const levelRewards = [
    ...(rewards[experienceLevel as keyof typeof rewards] || rewards.enthusiast),
  ];

  // Add uniqueness bonus
  if (profileData?.uniqueness_score > 0.85) {
    levelRewards.push({
      id: 'uniqueness_bonus',
      title: 'Ultra-Rare Profile Bonus',
      description: `Your ${Math.round(profileData.uniqueness_score * 100)}% unique profile unlocks exclusive rare finds`,
      value: 'Exclusive',
      type: 'uniqueness_bonus',
      available_immediately: true,
    });
  }

  return levelRewards;
}

/**
 * Generate Future Benefits
 */
function generateFutureBenefits(experienceLevel: string, sessionData?: any) {
  const benefits = {
    beginner: [
      {
        id: 'learning_path',
        title: 'Personalized Learning Path',
        description: 'Structured fragrance education based on your preferences',
        timeline: 'Ongoing',
        value: '$60/year',
      },
      {
        id: 'taste_evolution',
        title: 'Taste Evolution Tracking',
        description:
          'See how your preferences evolve and get updated recommendations',
        timeline: 'Monthly updates',
        value: '$40/year',
      },
    ],
    enthusiast: [
      {
        id: 'advanced_matching',
        title: 'Advanced AI Matching',
        description: 'Sophisticated algorithm that learns from your feedback',
        timeline: 'Improves weekly',
        value: '$120/year',
      },
      {
        id: 'seasonal_curation',
        title: 'Seasonal Fragrance Curation',
        description:
          'Quarterly curated selections based on your evolving taste',
        timeline: 'Every 3 months',
        value: '$80/quarter',
      },
    ],
    collector: [
      {
        id: 'master_perfumer_access',
        title: 'Master Perfumer Network',
        description: 'Direct access to renowned perfumers for consultations',
        timeline: 'On-demand',
        value: '$500+/year',
      },
      {
        id: 'vintage_collection',
        title: 'Vintage & Rare Collection Access',
        description: 'Exclusive access to discontinued and rare fragrances',
        timeline: 'Priority access',
        value: '$300+/year',
      },
    ],
  };

  return (
    benefits[experienceLevel as keyof typeof benefits] || benefits.enthusiast
  );
}

/**
 * Generate Exclusive Access Rewards
 */
function generateExclusiveAccess(experienceLevel: string, profileData?: any) {
  const exclusiveRewards = {
    beginner: [
      {
        id: 'vip_support',
        title: 'VIP Customer Support',
        description: 'Priority support for all your fragrance questions',
        access_level: 'VIP',
      },
    ],
    enthusiast: [
      {
        id: 'beta_features',
        title: 'Beta Feature Access',
        description: 'Early access to new platform features and improvements',
        access_level: 'Beta Tester',
      },
      {
        id: 'expert_reviews',
        title: 'Expert Review Library',
        description:
          'Access to professional fragrance critic reviews and insights',
        access_level: 'Expert Content',
      },
    ],
    collector: [
      {
        id: 'curator_program',
        title: 'Fragrance Curator Program',
        description:
          'Influence our collection and help curate recommendations for others',
        access_level: 'Curator',
      },
      {
        id: 'private_events',
        title: 'Private Fragrance Events',
        description:
          'Invitation-only events with perfumers and industry experts',
        access_level: 'VIP Events',
      },
    ],
  };

  return (
    exclusiveRewards[experienceLevel as keyof typeof exclusiveRewards] || []
  );
}

/**
 * Generate Social Benefits
 */
function generateSocialBenefits(experienceLevel: string) {
  return [
    {
      id: 'community_access',
      title: 'Fragrance Community',
      description: 'Connect with like-minded fragrance enthusiasts',
      benefit_type: 'community',
    },
    {
      id: 'profile_sharing',
      title: 'Profile Sharing',
      description: 'Share your unique fragrance personality with friends',
      benefit_type: 'social_sharing',
    },
    {
      id: 'recommendation_gifting',
      title: 'Gift Recommendations',
      description: 'Send personalized fragrance recommendations to friends',
      benefit_type: 'gifting',
    },
  ];
}

/**
 * Generate Gamification Rewards
 */
function generateGamificationRewards(
  experienceLevel: string,
  sessionData?: any
) {
  const basePoints = sessionData?.quiz_responses_count * 10 || 50;
  const bonusPoints = sessionData?.favorite_fragrances_count * 5 || 0;
  const totalPoints = basePoints + bonusPoints;

  return {
    points_earned: totalPoints,
    level_achieved: calculateUserLevel(totalPoints),
    next_level_points: calculateNextLevelPoints(totalPoints),
    achievements_unlocked: generateAchievements(experienceLevel, sessionData),
    leaderboard_position: generateLeaderboardPosition(
      totalPoints,
      experienceLevel
    ),
  };
}

/**
 * Claim Reward Function
 */
async function claimReward(
  userId?: string,
  rewardId?: string,
  experienceLevel?: string
) {
  // Track reward claim
  console.log('Reward claimed:', { userId, rewardId, experienceLevel });

  // In production, this would update user's reward status in database
  return {
    success: true,
    reward_claimed: rewardId,
    claim_timestamp: new Date().toISOString(),
    message: 'Reward successfully claimed! Check your dashboard for details.',
  };
}

/**
 * Track Reward Engagement
 */
async function trackRewardEngagement(
  userId?: string,
  rewardId?: string,
  experienceLevel?: string,
  sessionData?: any
) {
  console.log('Reward engagement tracked:', {
    userId,
    rewardId,
    experienceLevel,
    session_quality: sessionData ? calculateSessionQuality(sessionData) : 0,
  });

  return {
    success: true,
    engagement_recorded: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper Functions
 */
function calculateTotalRewardValue(rewards: any): number {
  let total = 0;

  // Sum immediate rewards
  rewards.immediate_rewards.forEach((reward: any) => {
    const value = parseFloat(reward.value.replace(/[^0-9.]/g, ''));
    if (!isNaN(value)) total += value;
  });

  return total;
}

function calculatePersonalizationScore(
  profileData?: any,
  sessionData?: any
): number {
  let score = 0.5; // Base score

  if (profileData?.uniqueness_score)
    score += profileData.uniqueness_score * 0.3;
  if (sessionData?.completion_percentage)
    score += (sessionData.completion_percentage / 100) * 0.2;

  return Math.min(score, 1.0);
}

function calculateConversionConfidence(
  experienceLevel: string,
  profileData?: any,
  sessionData?: any
): number {
  let confidence = 0.3; // Base confidence

  // Experience level multiplier
  const levelMultipliers = { beginner: 0.8, enthusiast: 1.0, collector: 1.2 };
  confidence *=
    levelMultipliers[experienceLevel as keyof typeof levelMultipliers];

  // Profile quality boost
  if (profileData?.uniqueness_score > 0.8) confidence += 0.3;
  else if (profileData?.uniqueness_score > 0.6) confidence += 0.2;

  // Session completeness boost
  if (sessionData?.completion_percentage > 80) confidence += 0.2;

  return Math.min(confidence, 1.0);
}

function calculateSessionQuality(sessionData: any): number {
  let quality = 0;

  if (sessionData.quiz_responses_count >= 3) quality += 0.4;
  if (sessionData.favorite_fragrances_count > 0) quality += 0.3;
  if (sessionData.completion_percentage > 75) quality += 0.3;

  return Math.min(quality, 1.0);
}

function calculateUserLevel(points: number): string {
  if (points >= 200) return 'Fragrance Expert';
  if (points >= 150) return 'Scent Enthusiast';
  if (points >= 100) return 'Fragrance Explorer';
  if (points >= 50) return 'Scent Seeker';
  return 'Fragrance Newcomer';
}

function calculateNextLevelPoints(currentPoints: number): number {
  const levels = [50, 100, 150, 200];
  for (const level of levels) {
    if (currentPoints < level) {
      return level - currentPoints;
    }
  }
  return 0; // At max level
}

function generateAchievements(experienceLevel: string, sessionData?: any) {
  const achievements = [];

  if (sessionData?.quiz_responses_count >= 4) {
    achievements.push({
      id: 'quiz_completionist',
      title: 'Quiz Completionist',
      description: 'Completed the full fragrance personality quiz',
      badge: '🏆',
    });
  }

  if (sessionData?.favorite_fragrances_count >= 3) {
    achievements.push({
      id: 'taste_curator',
      title: 'Taste Curator',
      description: 'Shared multiple favorite fragrances',
      badge: '🎨',
    });
  }

  if (experienceLevel === 'collector') {
    achievements.push({
      id: 'connoisseur',
      title: 'Fragrance Connoisseur',
      description: 'Demonstrated sophisticated fragrance knowledge',
      badge: '👑',
    });
  }

  return achievements;
}

function generateLeaderboardPosition(
  points: number,
  experienceLevel: string
): any {
  // Simulate leaderboard position based on points and experience level
  const basePosition = Math.max(1, Math.floor(Math.random() * 100) - points);

  return {
    position: basePosition,
    percentile: Math.max(1, 100 - Math.floor((basePosition / 1000) * 100)),
    experience_rank: calculateExperienceRank(experienceLevel, points),
    total_users: 12847, // Dynamic count in production
  };
}

function calculateExperienceRank(
  experienceLevel: string,
  points: number
): string {
  const ranks = {
    beginner: points >= 75 ? 'Top Newcomer' : 'Rising Star',
    enthusiast: points >= 125 ? 'Expert Enthusiast' : 'Growing Explorer',
    collector: points >= 175 ? 'Master Collector' : 'Seasoned Connoisseur',
  };

  return ranks[experienceLevel as keyof typeof ranks] || 'Fragrance Lover';
}

/**
 * Generate Urgency Messaging
 */
function generateUrgencyMessaging(experienceLevel: string, profileData?: any) {
  const urgencyLevels = {
    high: {
      message:
        'Extremely rare profile - only 5% of users achieve this uniqueness',
      time_pressure: 'Profile expires in 24 hours',
      scarcity: 'Limited to 50 unique profiles per month',
    },
    medium: {
      message: 'Distinctive profile ready for saving',
      time_pressure: 'Profile available for 24 hours only',
      scarcity: 'Join 12,000+ satisfied members',
    },
    low: {
      message: 'Your personalized profile is waiting',
      time_pressure: 'Limited time offer',
      scarcity: 'Thousands of users love their saved profiles',
    },
  };

  const urgencyLevel =
    profileData?.uniqueness_score > 0.85
      ? 'high'
      : profileData?.uniqueness_score > 0.7
        ? 'medium'
        : 'low';

  return urgencyLevels[urgencyLevel];
}
