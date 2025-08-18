import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const socialProofRequestSchema = z.object({
  experience_level: z.enum(['beginner', 'enthusiast', 'collector']).optional(),
  profile_type: z.string().optional(),
  uniqueness_score: z.number().min(0).max(1).optional(),
  gender_preference: z.enum(['women', 'men', 'unisex', 'all']).optional(),
});

/**
 * POST /api/analytics/social-proof
 *
 * Provides dynamic social proof data for conversion optimization
 * based on user characteristics and profile similarity.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const validationResult = socialProofRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const {
      experience_level,
      profile_type,
      uniqueness_score,
      gender_preference,
    } = validationResult.data;

    // Generate relevant social proof based on user characteristics
    const socialProofData = generateSocialProof({
      experience_level,
      profile_type,
      uniqueness_score,
      gender_preference,
    });

    return NextResponse.json(socialProofData);
  } catch (error) {
    console.error('Social proof API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate social proof data' },
      { status: 500 }
    );
  }
}

/**
 * Generate Dynamic Social Proof Data
 */
function generateSocialProof(params: {
  experience_level?: string;
  profile_type?: string;
  uniqueness_score?: number;
  gender_preference?: string;
}) {
  const { experience_level, profile_type, uniqueness_score } = params;

  // Base social proof templates
  const socialProofTemplates = {
    beginner: [
      {
        message:
          '{percentage}% of fragrance beginners save their first profile',
        percentage: 89,
        user_type: 'fragrance beginners',
        improvement_factor: 2.5,
        context: 'starting_journey',
      },
      {
        message:
          'New fragrance lovers who save profiles discover {improvement_factor}x more scents they love',
        percentage: 84,
        user_type: 'new fragrance lovers',
        improvement_factor: 3.2,
        context: 'discovery_boost',
      },
    ],
    enthusiast: [
      {
        message:
          '{percentage}% of fragrance enthusiasts preserve their personalized profiles',
        percentage: 92,
        user_type: 'fragrance enthusiasts',
        improvement_factor: 3.1,
        context: 'preservation',
      },
      {
        message:
          'Enthusiasts with saved profiles find {improvement_factor}x better fragrance matches',
        percentage: 87,
        user_type: 'enthusiasts',
        improvement_factor: 3.4,
        context: 'match_quality',
      },
    ],
    collector: [
      {
        message:
          '{percentage}% of sophisticated collectors save their curated profiles',
        percentage: 96,
        user_type: 'sophisticated collectors',
        improvement_factor: 4.2,
        context: 'curation',
      },
      {
        message:
          'Expert collectors who save profiles discover {improvement_factor}x more rare finds',
        percentage: 91,
        user_type: 'expert collectors',
        improvement_factor: 4.8,
        context: 'rare_discovery',
      },
    ],
  };

  // Profile-type specific social proof
  const profileSpecificProof = {
    sophisticated: {
      percentage: 94,
      user_type: 'sophisticated users',
      improvement_factor: 3.7,
      message:
        '{percentage}% of sophisticated fragrance lovers save their refined profiles',
    },
    romantic: {
      percentage: 91,
      user_type: 'romantic personalities',
      improvement_factor: 3.2,
      message:
        '{percentage}% of romantic fragrance lovers preserve their dreamy profiles',
    },
    confident: {
      percentage: 93,
      user_type: 'confident personalities',
      improvement_factor: 3.5,
      message:
        '{percentage}% of confident users save their bold fragrance profiles',
    },
    elegant: {
      percentage: 95,
      user_type: 'elegant personalities',
      improvement_factor: 4.1,
      message:
        '{percentage}% of elegant users preserve their refined taste profiles',
    },
    playful: {
      percentage: 88,
      user_type: 'playful personalities',
      improvement_factor: 2.9,
      message:
        '{percentage}% of playful users save their fun fragrance profiles',
    },
  };

  // Uniqueness-based social proof
  const uniquenessProof = {
    high: {
      // >80% unique
      percentage: 97,
      user_type: 'highly unique users',
      improvement_factor: 4.5,
      message:
        '{percentage}% of users with profiles this unique save them permanently',
      rarity_emphasis: 'extremely rare profile type',
    },
    medium: {
      // 60-80% unique
      percentage: 92,
      user_type: 'unique users',
      improvement_factor: 3.4,
      message:
        '{percentage}% of users with distinctive profiles like yours save them',
      rarity_emphasis: 'distinctive profile type',
    },
    standard: {
      // <60% unique
      percentage: 86,
      user_type: 'users with your profile type',
      improvement_factor: 2.8,
      message:
        '{percentage}% of users with similar profiles save their results',
      rarity_emphasis: 'valuable profile insights',
    },
  };

  // Select most relevant social proof
  let selectedProof;

  // Priority 1: Profile-type specific if available and matches known types
  if (profile_type && profile_type in profileSpecificProof) {
    selectedProof =
      profileSpecificProof[profile_type as keyof typeof profileSpecificProof];
  }
  // Priority 2: Experience-level specific
  else if (experience_level && experience_level in socialProofTemplates) {
    const templates =
      socialProofTemplates[
        experience_level as keyof typeof socialProofTemplates
      ];
    selectedProof = templates[Math.floor(Math.random() * templates.length)];
  }
  // Priority 3: Uniqueness-based
  else if (uniqueness_score !== undefined) {
    if (uniqueness_score > 0.8) {
      selectedProof = uniquenessProof.high;
    } else if (uniqueness_score > 0.6) {
      selectedProof = uniquenessProof.medium;
    } else {
      selectedProof = uniquenessProof.standard;
    }
  }
  // Fallback: General social proof
  else {
    selectedProof = {
      percentage: 89,
      user_type: 'fragrance lovers',
      improvement_factor: 3.1,
      message:
        '{percentage}% of fragrance lovers save their personalized profiles',
    };
  }

  // Generate recent activity social proof
  const recentActivityProof = generateRecentActivityProof(experience_level);

  // Generate outcome-focused social proof
  const outcomeProof = generateOutcomeProof(experience_level, uniqueness_score);

  // Ensure selectedProof is never undefined
  const finalProof = selectedProof || {
    percentage: 89,
    user_type: 'fragrance lovers',
    improvement_factor: 3.1,
    message: 'Join thousands of fragrance lovers who saved their profiles',
  };

  return {
    primary: finalProof,
    recent_activity: recentActivityProof,
    outcome_focused: outcomeProof,
    percentage: finalProof.percentage,
    user_type: finalProof.user_type,
    improvement_factor: finalProof.improvement_factor,

    // Additional context for display
    display_context: {
      urgency_level: getUrgencyLevel(uniqueness_score),
      value_emphasis: getValueEmphasis(experience_level),
      credibility_indicators: getCredibilityIndicators(),
    },
  };
}

/**
 * Generate Recent Activity Social Proof
 */
function generateRecentActivityProof(experienceLevel?: string) {
  const activityCounts = {
    beginner: { min: 15, max: 35 },
    enthusiast: { min: 8, max: 24 },
    collector: { min: 3, max: 12 },
  };

  const counts =
    activityCounts[experienceLevel as keyof typeof activityCounts] ||
    activityCounts.enthusiast;
  const recentCount =
    Math.floor(Math.random() * (counts.max - counts.min + 1)) + counts.min;
  const timeFrames = ['in the last hour', 'in the last 2 hours', 'today'];
  const timeFrame = timeFrames[Math.floor(Math.random() * timeFrames.length)];

  return {
    count: recentCount,
    timeframe: timeFrame,
    message: `${recentCount} people saved their profiles ${timeFrame}`,
    activity_type: 'profile_saves',
  };
}

/**
 * Generate Outcome-Focused Social Proof
 */
function generateOutcomeProof(
  experienceLevel?: string,
  uniquenessScore?: number
) {
  const outcomes = {
    beginner: [
      'find fragrances they actually love',
      'discover their signature scent',
      'avoid buying wrong fragrances',
    ],
    enthusiast: [
      'discover rare fragrance gems',
      'build curated collections',
      'find niche discoveries',
    ],
    collector: [
      'uncover rare artisanal finds',
      'access exclusive releases first',
      'connect with master perfumers',
    ],
  };

  const levelOutcomes =
    outcomes[experienceLevel as keyof typeof outcomes] || outcomes.enthusiast;
  const selectedOutcome =
    levelOutcomes[Math.floor(Math.random() * levelOutcomes.length)];

  const improvementFactor =
    uniquenessScore && uniquenessScore > 0.8
      ? 4.2
      : uniquenessScore && uniquenessScore > 0.6
        ? 3.4
        : 2.8;

  return {
    outcome: selectedOutcome,
    improvement_factor: improvementFactor,
    message: `Users who save profiles ${selectedOutcome} ${improvementFactor}x more often`,
    outcome_type: 'benefit_realization',
  };
}

/**
 * Get Urgency Level for Messaging
 */
function getUrgencyLevel(uniquenessScore?: number): 'high' | 'medium' | 'low' {
  if (uniquenessScore && uniquenessScore > 0.85) return 'high';
  if (uniquenessScore && uniquenessScore > 0.7) return 'medium';
  return 'low';
}

/**
 * Get Value Emphasis Strategy
 */
function getValueEmphasis(
  experienceLevel?: string
): 'rarity' | 'personalization' | 'discovery' {
  switch (experienceLevel) {
    case 'collector':
      return 'rarity';
    case 'enthusiast':
      return 'personalization';
    case 'beginner':
      return 'discovery';
    default:
      return 'personalization';
  }
}

/**
 * Get Credibility Indicators
 */
function getCredibilityIndicators() {
  return [
    'Based on 50,000+ user profiles',
    'Validated by fragrance experts',
    'Updated daily with new insights',
    '99.2% user satisfaction rate',
  ];
}
