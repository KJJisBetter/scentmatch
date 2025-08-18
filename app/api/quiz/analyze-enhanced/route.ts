import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { AIProfileGenerator } from '@/lib/ai/ai-profile-generator';
import { ProfileCache } from '@/lib/ai/profile-cache';

export type ExperienceLevel = 'beginner' | 'enthusiast' | 'collector';

// Global cache instance for profile generation
const globalProfileCache = new ProfileCache();

interface QuizResponse {
  question_id: string;
  answer_value: string;
  experience_level: ExperienceLevel;
  metadata?: any;
  timestamp: string;
}

interface AnalysisRequest {
  responses: QuizResponse[];
  experience_level: ExperienceLevel;
  selected_favorites: Array<{ id: string; name: string; brand: string }>;
  quiz_session_token: string;
}

/**
 * Enhanced Quiz Analysis API
 *
 * Analyzes quiz responses with experience-level context to provide:
 * - Experience-appropriate personality profiling
 * - Adaptive recommendation generation
 * - Unique AI-generated profile descriptions
 * - Favorite fragrance integration for advanced users
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const headersList = await headers();
    const ip =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown';

    const rateLimitResult = await rateLimit({
      key: `quiz-analysis:${ip}`,
      limit: 10,
      window: 300000, // 5 minutes
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body: AnalysisRequest = await request.json();
    const {
      responses,
      experience_level,
      selected_favorites,
      quiz_session_token,
    } = body;

    // Validate input
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: 'Quiz responses are required' },
        { status: 400 }
      );
    }

    if (
      !experience_level ||
      !['beginner', 'enthusiast', 'collector'].includes(experience_level)
    ) {
      return NextResponse.json(
        { error: 'Valid experience level is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store quiz session and responses
    const sessionData = {
      session_token: quiz_session_token,
      quiz_version: 'adaptive-v1',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      current_question: responses.length,
      total_questions: responses.length,
      is_completed: true,
      is_guest_session: true,
      referral_source: 'adaptive_quiz',
    };

    const { data: sessionInsert, error: sessionError } = await supabase
      .from('user_quiz_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('Failed to create quiz session:', sessionError);
      console.error('Session data attempted:', sessionData);

      // For now, continue with processing even if session creation fails
      const sessionId = `fake-session-${Date.now()}`;
      console.log(
        'Session creation failed, continuing with direct recommendations'
      );

      // Analyze personality even without session storage
      const personalityAnalysis = await analyzePersonalityByExperience(
        responses,
        experience_level,
        selected_favorites
      );

      // Generate AI profile using the new system
      const profileKey = `${experience_level}_${personalityAnalysis.personality_type}_${quiz_session_token}`;
      const profileResult = await globalProfileCache.getOrGenerateProfile(
        profileKey,
        {
          ...personalityAnalysis,
          experience_level,
          selected_favorites,
        }
      );

      const aiProfile = profileResult.profile;

      // Get real recommendations directly from database
      const { data: realRecommendations, error: recsError } =
        await supabase.rpc('get_enhanced_recommendations_by_experience', {
          experience_level: experience_level,
          personality_traits: personalityAnalysis.dimensions || {},
          max_results:
            experience_level === 'collector'
              ? 12
              : experience_level === 'enthusiast'
                ? 10
                : 8,
        });

      const recommendations = realRecommendations
        ? realRecommendations.map((rec: any) => ({
            ...rec,
            experience_context: experience_level,
            explanation: rec.reasoning,
            confidence_level: adjustConfidenceForExperience(
              rec.match_score,
              experience_level
            ),
            complexity_rating: getComplexityRating(rec, experience_level),
            sample_price: '$8',
            match_percentage: Math.round(rec.match_score * 100),
          }))
        : getFallbackRecommendations(experience_level);

      return NextResponse.json({
        success: true,
        session_id: sessionId,
        experience_level,
        personality_analysis: personalityAnalysis,
        ai_profile: aiProfile,
        profile_generation_source: profileResult.source,
        recommendations: recommendations.slice(0, 8),
        selected_favorites: selected_favorites,
        conversion_data: {
          quiz_session_token,
          profile_uniqueness_score: aiProfile.uniqueness_score,
          recommendation_confidence: personalityAnalysis.confidence_score,
          cache_performance: profileResult.fromCache
            ? 'cache_hit'
            : 'generated',
          recommendations_source: realRecommendations ? 'database' : 'fallback',
        },
      });
    }

    const sessionId = sessionInsert.id;

    // Store individual responses
    const responsesToInsert = responses.map(response => ({
      session_id: sessionId,
      question_id: response.question_id,
      question_text: getQuestionText(response.question_id, experience_level),
      question_type: 'multiple_choice',
      answer_value: response.answer_value,
      answer_metadata: response.metadata || {},
      created_at: response.timestamp,
    }));

    const { error: responsesError } = await supabase
      .from('user_quiz_responses')
      .insert(responsesToInsert);

    if (responsesError) {
      console.error('Failed to store quiz responses:', responsesError);
      // Continue with analysis even if storage fails
    }

    // Analyze personality based on experience level
    const personalityAnalysis = await analyzePersonalityByExperience(
      responses,
      experience_level,
      selected_favorites
    );

    // Generate unique AI profile using the new system
    const profileKey = `${experience_level}_${personalityAnalysis.personality_type}_${quiz_session_token}`;
    const profileResult = await globalProfileCache.getOrGenerateProfile(
      profileKey,
      {
        ...personalityAnalysis,
        experience_level,
        selected_favorites,
      }
    );

    const aiProfile = profileResult.profile;

    // Get recommendations with experience-level context
    const recommendations = await getExperienceLevelRecommendations(
      personalityAnalysis,
      experience_level,
      selected_favorites,
      supabase,
      sessionId
    );

    // Store personality analysis
    const personalityData = {
      session_id: sessionId,
      personality_type: personalityAnalysis.personality_type,
      secondary_type: personalityAnalysis.secondary_type,
      style_descriptor: aiProfile.style_descriptor,
      confidence_score: personalityAnalysis.confidence_score,
      dimension_fresh: personalityAnalysis.dimensions.fresh,
      dimension_floral: personalityAnalysis.dimensions.floral,
      dimension_oriental: personalityAnalysis.dimensions.oriental,
      dimension_woody: personalityAnalysis.dimensions.woody,
      dimension_fruity: personalityAnalysis.dimensions.fruity,
      dimension_gourmand: personalityAnalysis.dimensions.gourmand,
      lifestyle_factors: personalityAnalysis.lifestyle_factors,
      preferred_intensity: personalityAnalysis.preferred_intensity,
      occasion_preferences: personalityAnalysis.occasion_preferences,
      seasonal_preferences: personalityAnalysis.seasonal_preferences,
      brand_preferences: personalityAnalysis.brand_preferences,
      quiz_version: 'adaptive-v1',
      analysis_method: `experience_level_${experience_level}`,
      ai_enhanced: true,
    };

    const { error: personalityError } = await supabase
      .from('user_fragrance_personalities')
      .insert(personalityData);

    if (personalityError) {
      console.error('Failed to store personality analysis:', personalityError);
    }

    // Return comprehensive results
    return NextResponse.json({
      success: true,
      session_id: sessionId,
      experience_level,
      personality_analysis: personalityAnalysis,
      ai_profile: aiProfile,
      profile_generation_source: profileResult.source,
      recommendations: recommendations.slice(0, 8), // Top 8 recommendations
      selected_favorites: selected_favorites,
      conversion_data: {
        quiz_session_token,
        profile_uniqueness_score: aiProfile.uniqueness_score,
        recommendation_confidence: personalityAnalysis.confidence_score,
        cache_performance: profileResult.fromCache ? 'cache_hit' : 'generated',
      },
    });
  } catch (error) {
    console.error('Quiz analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze quiz responses' },
      { status: 500 }
    );
  }
}

/**
 * Analyze personality with experience-level specific algorithms
 */
async function analyzePersonalityByExperience(
  responses: QuizResponse[],
  experienceLevel: ExperienceLevel,
  selectedFavorites: Array<{ id: string; name: string; brand: string }>
) {
  // Initialize scoring dimensions
  const dimensions = {
    fresh: 0,
    floral: 0,
    oriental: 0,
    woody: 0,
    fruity: 0,
    gourmand: 0,
  };

  let intensity = 0.5;
  const occasionPreferences: string[] = [];
  const seasonalPreferences: string[] = [];
  const brandPreferences: string[] = [];
  const lifestyleFactors: any = {
    experience_level: experienceLevel,
    sophistication_level:
      experienceLevel === 'collector'
        ? 'high'
        : experienceLevel === 'enthusiast'
          ? 'medium'
          : 'developing',
  };

  // Experience-level specific analysis weights
  const experienceWeights = {
    beginner: { simplicity: 1.2, popularity: 1.1, complexity: 0.8 },
    enthusiast: { balance: 1.1, exploration: 1.2, quality: 1.1 },
    collector: { uniqueness: 1.3, complexity: 1.2, artistry: 1.2 },
  };

  const weights = experienceWeights[experienceLevel];

  // Analyze each response with experience context
  responses.forEach(response => {
    const { question_id, answer_value } = response;

    switch (question_id) {
      case 'style_simple':
      case 'style_moderate':
      case 'collection_style':
        analyzeStyleResponse(
          answer_value,
          dimensions,
          experienceLevel,
          weights
        );
        break;

      case 'occasions_simple':
      case 'occasions_detailed':
      case 'wearing_occasions':
        analyzeOccasionResponse(
          answer_value,
          occasionPreferences,
          experienceLevel
        );
        break;

      case 'scent_preference_simple':
      case 'fragrance_families':
      case 'composition_preferences':
        analyzeScentResponse(
          answer_value,
          dimensions,
          experienceLevel,
          weights
        );
        break;

      case 'intensity_simple':
        intensity = analyzeIntensityResponse(answer_value, experienceLevel);
        break;

      case 'complexity_preference':
        analyzeComplexityResponse(answer_value, dimensions, lifestyleFactors);
        break;

      case 'investment_approach':
        analyzeInvestmentResponse(
          answer_value,
          brandPreferences,
          lifestyleFactors
        );
        break;
    }
  });

  // Factor in selected favorites for advanced users
  if (selectedFavorites.length > 0) {
    await integrateFavoritePreferences(
      selectedFavorites,
      dimensions,
      brandPreferences
    );
  }

  // Determine personality type based on dominant dimensions and experience level
  const personalityType = determinePersonalityType(
    dimensions,
    experienceLevel,
    lifestyleFactors
  );
  const secondaryType = determineSecondaryType(dimensions, experienceLevel);

  // Calculate confidence score based on response consistency and experience level
  const confidenceScore = calculateConfidenceScore(
    responses,
    experienceLevel,
    selectedFavorites.length
  );

  return {
    personality_type: personalityType,
    secondary_type: secondaryType,
    confidence_score: confidenceScore,
    dimensions,
    preferred_intensity: intensity,
    occasion_preferences: occasionPreferences,
    seasonal_preferences: seasonalPreferences,
    brand_preferences: brandPreferences,
    lifestyle_factors: lifestyleFactors,
  };
}

/**
 * Get recommendations with experience-level filtering and explanations
 */
async function getExperienceLevelRecommendations(
  personalityAnalysis: any,
  experienceLevel: ExperienceLevel,
  selectedFavorites: Array<{ id: string; name: string; brand: string }>,
  supabase: any,
  sessionId: string
) {
  try {
    // Use the new enhanced recommendations function
    const { data: recommendations, error } = await supabase.rpc(
      'get_enhanced_recommendations_by_experience',
      {
        experience_level: experienceLevel,
        personality_traits: personalityAnalysis.dimensions || {},
        max_results:
          experienceLevel === 'collector'
            ? 12
            : experienceLevel === 'enthusiast'
              ? 10
              : 8,
      }
    );

    if (error) {
      console.error('Failed to get enhanced recommendations:', error);
      // Return fallback recommendations
      return getFallbackRecommendations(experienceLevel);
    }

    // Enhance recommendations with additional context (database function already provides reasoning)
    const enhancedRecommendations = recommendations.map((rec: any) => ({
      ...rec,
      experience_context: experienceLevel,
      explanation: rec.reasoning, // Use database-generated reasoning
      confidence_level: adjustConfidenceForExperience(
        rec.match_score,
        experienceLevel
      ),
      complexity_rating: getComplexityRating(rec, experienceLevel),
      // Add sample info for conversion optimization
      sample_price: '$8', // Default sample price
      match_percentage: Math.round(rec.match_score * 100),
    }));

    // Sort by experience-appropriate criteria
    return sortRecommendationsByExperience(
      enhancedRecommendations,
      experienceLevel
    );
  } catch (error) {
    console.error('Error getting experience-level recommendations:', error);
    return [];
  }
}

// Helper functions (simplified implementations)
function getQuestionText(
  questionId: string,
  experienceLevel: ExperienceLevel
): string {
  // Return appropriate question text based on ID and experience level
  const questionTexts: Record<string, Record<ExperienceLevel, string>> = {
    style_simple: {
      beginner: 'How would you describe yourself?',
      enthusiast: 'How would you describe your personal style?',
      collector: 'How would you characterize your aesthetic?',
    },
    // Add more question mappings as needed
  };

  return questionTexts[questionId]?.[experienceLevel] || 'Question';
}

function analyzeStyleResponse(
  answer: string,
  dimensions: any,
  experienceLevel: ExperienceLevel,
  weights: any
) {
  // Analyze style response and update dimensions based on experience level
  const styleMapping: Record<string, Partial<typeof dimensions>> = {
    casual_relaxed: { fresh: 0.3, fruity: 0.2 },
    polished_professional: { woody: 0.3, oriental: 0.2 },
    romantic_feminine: { floral: 0.4, fruity: 0.2 },
    bold_confident: { oriental: 0.3, woody: 0.2 },
    classical_heritage: { woody: 0.4, oriental: 0.3 },
    avant_garde_modern: { fresh: 0.2, oriental: 0.3 },
    niche_artisanal: { woody: 0.3, oriental: 0.2 },
  };

  const mapping = styleMapping[answer] || {};
  Object.entries(mapping).forEach(([key, value]) => {
    dimensions[key] += value * (weights.complexity || 1);
  });
}

function analyzeOccasionResponse(
  answer: string,
  occasions: string[],
  experienceLevel: ExperienceLevel
) {
  const occasionMapping: Record<string, string[]> = {
    everyday_casual: ['daily', 'casual'],
    work_professional: ['professional', 'office'],
    evening_special: ['evening', 'date'],
    romantic_dates: ['romantic', 'intimate'],
    social_gatherings: ['social', 'party'],
  };

  const mappedOccasions = occasionMapping[answer] || [answer];
  occasions.push(...mappedOccasions);
}

function analyzeScentResponse(
  answer: string,
  dimensions: any,
  experienceLevel: ExperienceLevel,
  weights: any
) {
  const scentMapping: Record<string, Partial<typeof dimensions>> = {
    fresh_clean: { fresh: 0.5 },
    sweet_fruity: { fruity: 0.4, gourmand: 0.2 },
    floral_pretty: { floral: 0.5 },
    warm_cozy: { gourmand: 0.3, woody: 0.3 },
    fresh_citrus: { fresh: 0.4, fruity: 0.2 },
    floral_bouquet: { floral: 0.5 },
    oriental_spicy: { oriental: 0.5 },
    woody_earthy: { woody: 0.5 },
    gourmand_sweet: { gourmand: 0.5 },
  };

  const mapping = scentMapping[answer] || {};
  Object.entries(mapping).forEach(([key, value]) => {
    dimensions[key] += value * (weights.balance || 1);
  });
}

function analyzeIntensityResponse(
  answer: string,
  experienceLevel: ExperienceLevel
): number {
  const intensityMapping: Record<string, number> = {
    subtle_gentle: 0.2,
    subtle_personal: 0.3,
    moderate_noticed: 0.6,
    moderate_noticeable: 0.6,
    strong_memorable: 0.9,
  };

  return intensityMapping[answer] || 0.5;
}

function analyzeComplexityResponse(
  answer: string,
  dimensions: any,
  lifestyleFactors: any
) {
  if (answer.includes('complex') || answer.includes('evolving')) {
    lifestyleFactors.complexity_preference = 'high';
    dimensions.oriental += 0.2;
    dimensions.woody += 0.2;
  } else if (answer.includes('consistent') || answer.includes('linear')) {
    lifestyleFactors.complexity_preference = 'low';
    dimensions.fresh += 0.2;
  }
}

function analyzeInvestmentResponse(
  answer: string,
  brandPreferences: string[],
  lifestyleFactors: any
) {
  if (answer.includes('masterpiece') || answer.includes('exclusive')) {
    brandPreferences.push('luxury', 'niche');
    lifestyleFactors.investment_level = 'high';
  } else if (answer.includes('emerging') || answer.includes('discovery')) {
    brandPreferences.push('artisan', 'indie');
    lifestyleFactors.investment_level = 'medium';
  }
}

async function integrateFavoritePreferences(
  favorites: Array<{ id: string; name: string; brand: string }>,
  dimensions: any,
  brandPreferences: string[]
) {
  // In a real implementation, this would fetch fragrance data and analyze
  // the scent families and characteristics of selected favorites
  favorites.forEach(favorite => {
    brandPreferences.push(favorite.brand.toLowerCase());
  });
}

function determinePersonalityType(
  dimensions: any,
  experienceLevel: ExperienceLevel,
  lifestyleFactors: any
): string {
  const dominantDimension = Object.entries(dimensions).reduce((a, b) =>
    dimensions[a[0] as keyof typeof dimensions] >
    dimensions[b[0] as keyof typeof dimensions]
      ? a
      : b
  )[0];

  const experiencePrefix = {
    beginner: '',
    enthusiast: 'refined_',
    collector: 'sophisticated_',
  }[experienceLevel];

  return `${experiencePrefix}${dominantDimension}_lover`;
}

function determineSecondaryType(
  dimensions: any,
  experienceLevel: ExperienceLevel
): string | null {
  const sorted = Object.entries(dimensions).sort(
    ([, a], [, b]) => (b as number) - (a as number)
  );

  return sorted.length > 1 ? sorted[1]?.[0] || null : null;
}

function calculateConfidenceScore(
  responses: QuizResponse[],
  experienceLevel: ExperienceLevel,
  favoritesCount: number
): number {
  // Base confidence from response count
  let confidence = Math.min(responses.length / 5, 1);

  // Boost confidence for experience level
  const experienceBoost = {
    beginner: 0.0,
    enthusiast: 0.1,
    collector: 0.2,
  }[experienceLevel];

  confidence += experienceBoost;

  // Boost for favorites selection
  if (favoritesCount > 0) {
    confidence += Math.min(favoritesCount * 0.05, 0.15);
  }

  return Math.min(confidence, 1);
}

function generateRecommendationExplanation(
  recommendation: any,
  personalityAnalysis: any,
  experienceLevel: ExperienceLevel,
  selectedFavorites: Array<{ id: string; name: string; brand: string }>
): string {
  // Generate AI explanation for why this fragrance matches the user
  const explanations = {
    beginner: `This fragrance aligns beautifully with your ${personalityAnalysis.personality_type} style. Its approachable composition makes it perfect for someone discovering their signature scent.`,
    enthusiast: `Based on your refined preferences and ${personalityAnalysis.personality_type} profile, this fragrance offers the perfect balance of sophistication and wearability that you're seeking.`,
    collector: `This exceptional piece resonates with your ${personalityAnalysis.personality_type} aesthetic and sophisticated palate. Its complex composition showcases the artistry you appreciate in fine perfumery.`,
  };

  return explanations[experienceLevel];
}

function adjustConfidenceForExperience(
  baseScore: number,
  experienceLevel: ExperienceLevel
): number {
  const adjustments = {
    beginner: 0.9, // Slightly lower confidence for beginners
    enthusiast: 1.0, // Standard confidence
    collector: 1.1, // Higher confidence for collectors
  };

  return Math.min(baseScore * adjustments[experienceLevel], 1);
}

function getComplexityRating(
  recommendation: any,
  experienceLevel: ExperienceLevel
): string {
  const ratings = {
    beginner: 'Simple & Elegant',
    enthusiast: 'Balanced Complexity',
    collector: 'Sophisticated Artistry',
  };

  return ratings[experienceLevel];
}

function sortRecommendationsByExperience(
  recommendations: any[],
  experienceLevel: ExperienceLevel
): any[] {
  // Sort based on experience-level appropriate criteria
  const sortCriteria = {
    beginner: (a: any, b: any) => b.confidence_level - a.confidence_level, // Prioritize high confidence
    enthusiast: (a: any, b: any) =>
      b.match_score + b.confidence_level - (a.match_score + a.confidence_level), // Balance match and confidence
    collector: (a: any, b: any) => b.match_score - a.match_score, // Prioritize match quality
  };

  return recommendations.sort(sortCriteria[experienceLevel]);
}

function getFallbackRecommendations(experienceLevel: ExperienceLevel): any[] {
  // Fallback recommendations when database function fails
  const fallbackRecs = [
    {
      fragrance_id: 'fallback-1',
      match_score: 0.85,
      quiz_reasoning: 'Popular choice for your experience level',
      archetype_alignment: 0.8,
      name: 'Sample Fragrance 1',
      brand: 'Popular Brand',
      experience_context: experienceLevel,
      explanation: generateRecommendationExplanation(
        {},
        {},
        experienceLevel,
        []
      ),
      confidence_level: 0.8,
      complexity_rating: getComplexityRating({}, experienceLevel),
    },
  ];

  return fallbackRecs.slice(0, experienceLevel === 'collector' ? 3 : 2);
}
