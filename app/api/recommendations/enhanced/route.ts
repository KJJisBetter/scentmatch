import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/recommendations/enhanced
 *
 * Enhanced quiz-based recommendations with AI explanations
 * Integrates with enhanced quiz session data and experience levels
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    // Extract parameters
    const sessionToken = searchParams.get('session_token');
    const maxResults = Math.min(
      parseInt(searchParams.get('max_results') || '8'),
      20
    );
    const includeAdventurous =
      searchParams.get('include_adventurous') !== 'false';
    const priceMax = searchParams.get('price_max')
      ? parseFloat(searchParams.get('price_max')!)
      : null;

    // Validate session token
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 400 }
      );
    }

    // Get and validate session
    const { data: session, error: sessionError } = await supabase
      .from('user_quiz_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid or expired session token' },
        { status: 400 }
      );
    }

    // Check if session is expired
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 400 }
      );
    }

    // Get enhanced recommendations using database function
    const startTime = Date.now();

    try {
      // Use the working enhanced recommendations function
      const { data: recommendations, error: recError } = await supabase.rpc(
        'get_enhanced_recommendations_by_experience',
        {
          experience_level: session.detected_experience_level || 'enthusiast',
          personality_traits: {},
          max_results: maxResults,
        }
      );

      if (recError) {
        console.error('Enhanced recommendations function failed:', recError);
        // Fall back to manual recommendation logic
        const fallbackRecs = await generateFallbackRecommendations(
          supabase,
          session,
          maxResults,
          priceMax
        );
        return NextResponse.json(fallbackRecs);
      }

      // Process and enhance recommendations with experience-level context
      const enhancedRecommendations = (recommendations || []).map(
        (rec: any, index: number) => ({
          fragrance_id: rec.fragrance_id,
          name: rec.name,
          brand: rec.brand,
          match_score: parseFloat(rec.match_score),
          quiz_reasoning: rec.reasoning,
          experience_relevance: rec.experience_relevance,
          sample_available: true,
          sample_price_usd: 8,
          notes: rec.accords || ['bergamot', 'rose', 'amber'],
          scent_family: deriveFamily(rec.name),
          recommendation_rank: index + 1,
          confidence_level:
            rec.match_score >= 0.8
              ? 'high'
              : rec.match_score >= 0.6
                ? 'medium'
                : 'exploratory',
          exploration_factor: includeAdventurous ? 1 - rec.match_score : 0,
          seasonal_context: getCurrentSeason(),
          purchase_incentive: 'Try this recommended sample',
        })
      );

      const processingTime = Date.now() - startTime;

      // Categorize recommendations
      const categorizedRecommendations = categorizeRecommendations(
        enhancedRecommendations
      );

      console.log(
        `Generated ${enhancedRecommendations.length} enhanced recommendations for session ${sessionToken} in ${processingTime}ms`
      );

      return NextResponse.json(
        {
          recommendations: enhancedRecommendations,
          total_found: enhancedRecommendations.length,
          recommendation_categories: categorizedRecommendations,
          session_metadata: {
            experience_level: session.detected_experience_level,
            profile_name: session.unique_profile_name,
            quiz_version: session.quiz_version,
            session_id: session.id,
          },
          performance: {
            processing_time_ms: processingTime,
            cache_status: 'fresh',
            recommendation_engine: 'enhanced_adaptive',
          },
        },
        {
          headers: {
            'Cache-Control':
              'private, max-age=600, stale-while-revalidate=1200', // 10min cache, 20min stale
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (functionError) {
      console.error('Database function error:', functionError);

      // Generate fallback recommendations
      const fallbackRecs = await generateFallbackRecommendations(
        supabase,
        session,
        maxResults,
        priceMax
      );
      return NextResponse.json(fallbackRecs);
    }
  } catch (error) {
    console.error('Error in enhanced recommendations:', error);

    return NextResponse.json(
      { error: 'Enhanced recommendations temporarily unavailable' },
      { status: 500 }
    );
  }
}

/**
 * Enhance recommendations with AI-generated explanations
 */
async function enhanceRecommendationsWithAI(
  supabase: any,
  baseRecommendations: any[],
  session: any,
  includeAdventurous: boolean,
  priceMax?: number | null
) {
  const experienceLevel = session.detected_experience_level || 'enthusiast';
  const personalityType =
    session.user_fragrance_personalities?.[0]?.personality_type ||
    'balanced_explorer';

  return baseRecommendations
    .filter(rec => {
      // Apply price filter if specified
      if (priceMax && rec.sample_price_usd > priceMax) {
        return false;
      }

      // Include all if adventurous is enabled
      if (includeAdventurous) {
        return true;
      }

      // Filter out very low match scores if not including adventurous
      return rec.match_score >= 0.6;
    })
    .map((rec, index) => ({
      fragrance_id: rec.fragrance_id,
      name: rec.name,
      brand: rec.brand,
      match_score: parseFloat(rec.match_score),
      quiz_reasoning: generateEnhancedReasoning(
        rec,
        personalityType,
        experienceLevel
      ),
      experience_relevance:
        rec.experience_relevance ||
        generateExperienceRelevance(rec, experienceLevel),
      sample_available: rec.sample_available,
      sample_price_usd: rec.sample_price_usd,
      notes: extractNotesFromFragrance(rec),
      scent_family: getFragranceScentFamily(rec),
      recommendation_rank: index + 1,
      confidence_level: calculateConfidenceLevel(
        rec.match_score,
        experienceLevel
      ),
      exploration_factor: calculateExplorationFactor(
        rec.match_score,
        includeAdventurous
      ),
      seasonal_context: generateSeasonalContext(rec),
      purchase_incentive: generatePurchaseIncentive(rec, experienceLevel),
    }));
}

/**
 * Generate enhanced reasoning based on personality and experience
 */
function generateEnhancedReasoning(
  recommendation: any,
  personalityType: string,
  experienceLevel: string
): string {
  const baseReasoning =
    recommendation.quiz_reasoning ||
    'This fragrance matches your profile preferences.';

  // Enhance based on experience level
  const experienceEnhancements = {
    beginner: [
      'This approachable fragrance is perfect for building confidence with scent.',
      'A beautiful introduction to the world of fragrance.',
      'Easy to wear and universally appealing.',
    ],
    enthusiast: [
      'This sophisticated choice reflects your developing expertise.',
      'A quality addition that showcases your refined taste.',
      'Perfect for someone who appreciates fragrance craftsmanship.',
    ],
    collector: [
      'This exceptional piece demonstrates the artistry you value.',
      'A masterful composition worthy of your discerning collection.',
      'Represents the pinnacle of perfumery that resonates with your expertise.',
    ],
  };

  // Enhance based on personality type patterns
  const personalityEnhancements = {
    fresh: 'energizing and uplifting qualities',
    floral: 'romantic and sophisticated beauty',
    oriental: 'mysterious and complex character',
    woody: 'grounding and authentic presence',
    fruity: 'joyful and vibrant spirit',
    gourmand: 'comforting and indulgent nature',
  };

  // Find matching personality enhancement
  const personalityMatch = Object.keys(personalityEnhancements).find(key =>
    personalityType.toLowerCase().includes(key)
  );

  let enhancedReasoning = baseReasoning;

  // Add experience-appropriate enhancement
  const expEnhancements =
    experienceEnhancements[
      experienceLevel as keyof typeof experienceEnhancements
    ];
  if (expEnhancements) {
    const randomEnhancement =
      expEnhancements[Math.floor(Math.random() * expEnhancements.length)];
    enhancedReasoning += ` ${randomEnhancement}`;
  }

  // Add personality-based enhancement
  if (personalityMatch) {
    const personalityNote =
      personalityEnhancements[
        personalityMatch as keyof typeof personalityEnhancements
      ];
    enhancedReasoning += ` Its ${personalityNote} aligns beautifully with your style.`;
  }

  return enhancedReasoning;
}

/**
 * Generate experience-appropriate relevance
 */
function generateExperienceRelevance(
  recommendation: any,
  experienceLevel: string
): string {
  const matchScore = parseFloat(recommendation.match_score);

  const relevanceTemplates = {
    beginner: {
      high: 'Perfect starting point for your fragrance journey',
      medium: 'Great choice as you develop your preferences',
      low: 'Interesting option to explore when ready',
    },
    enthusiast: {
      high: 'Excellent match for your sophisticated taste',
      medium: 'Quality addition to your growing expertise',
      low: 'Adventurous choice for fragrance exploration',
    },
    collector: {
      high: 'Exceptional quality worthy of your collection',
      medium: 'Refined piece for the discerning collector',
      low: 'Unique find for specialized collection themes',
    },
  };

  const level =
    matchScore >= 0.8 ? 'high' : matchScore >= 0.6 ? 'medium' : 'low';
  const templates =
    relevanceTemplates[experienceLevel as keyof typeof relevanceTemplates];

  return (
    templates[level as keyof typeof templates] ||
    'Matches your profile preferences'
  );
}

/**
 * Extract or mock fragrance notes
 */
function extractNotesFromFragrance(rec: any): string[] {
  // In a real implementation, this would fetch from fragrance table
  // For now, generate based on scent family
  const scentFamily = getFragranceScentFamily(rec);

  const notesByFamily = {
    fresh: ['bergamot', 'lemon', 'marine', 'mint'],
    floral: ['rose', 'jasmine', 'peony', 'lily'],
    oriental: ['amber', 'vanilla', 'spices', 'oud'],
    woody: ['sandalwood', 'cedar', 'vetiver', 'patchouli'],
    fruity: ['apple', 'berries', 'citrus', 'peach'],
    gourmand: ['vanilla', 'caramel', 'chocolate', 'honey'],
  };

  const familyNotes = notesByFamily[
    scentFamily as keyof typeof notesByFamily
  ] || ['bergamot', 'rose', 'amber'];
  return familyNotes.slice(0, 3);
}

/**
 * Get or infer scent family
 */
function getFragranceScentFamily(rec: any): string {
  if (rec.scent_family) return rec.scent_family;

  // Infer from name patterns (simplified)
  const name = rec.name.toLowerCase();
  if (name.includes('fresh') || name.includes('aqua')) return 'fresh';
  if (name.includes('rose') || name.includes('floral')) return 'floral';
  if (name.includes('wood') || name.includes('cedar')) return 'woody';
  if (name.includes('orient') || name.includes('amber')) return 'oriental';

  return 'fresh'; // Default fallback
}

/**
 * Calculate confidence level
 */
function calculateConfidenceLevel(
  matchScore: number,
  experienceLevel: string
): 'very_high' | 'high' | 'medium' | 'exploratory' {
  // Adjust thresholds based on experience level
  const thresholds = {
    beginner: { very_high: 0.85, high: 0.75, medium: 0.6 },
    enthusiast: { very_high: 0.9, high: 0.8, medium: 0.7 },
    collector: { very_high: 0.95, high: 0.85, medium: 0.75 },
  };

  const levels =
    thresholds[experienceLevel as keyof typeof thresholds] ||
    thresholds.enthusiast;

  if (matchScore >= levels.very_high) return 'very_high';
  if (matchScore >= levels.high) return 'high';
  if (matchScore >= levels.medium) return 'medium';
  return 'exploratory';
}

/**
 * Calculate exploration factor
 */
function calculateExplorationFactor(
  matchScore: number,
  includeAdventurous: boolean
): number {
  if (!includeAdventurous) return 0;

  // Higher exploration factor for lower match scores
  return Math.max(0, Math.min(1, (1 - matchScore) * 1.2));
}

/**
 * Generate seasonal context
 */
function generateSeasonalContext(rec: any): string {
  const currentSeason = getCurrentSeason();
  const scentFamily = getFragranceScentFamily(rec);

  const seasonalFit = {
    spring: {
      fresh: 'perfect',
      floral: 'ideal',
      woody: 'good',
      oriental: 'moderate',
    },
    summer: {
      fresh: 'perfect',
      fruity: 'ideal',
      floral: 'good',
      oriental: 'light',
    },
    autumn: {
      woody: 'perfect',
      oriental: 'ideal',
      gourmand: 'good',
      fresh: 'crisp',
    },
    winter: {
      oriental: 'perfect',
      woody: 'ideal',
      gourmand: 'cozy',
      floral: 'warm',
    },
  };

  const fit =
    seasonalFit[currentSeason.toLowerCase() as keyof typeof seasonalFit]?.[
      scentFamily as keyof (typeof seasonalFit)[keyof typeof seasonalFit]
    ] || 'suitable';

  return `${fit} for ${currentSeason}`;
}

/**
 * Generate purchase incentive
 */
function generatePurchaseIncentive(rec: any, experienceLevel: string): string {
  const incentives = {
    beginner: 'Start your collection with this crowd-pleaser',
    enthusiast: 'Add this sophisticated choice to your rotation',
    collector: 'Secure this exceptional piece for your collection',
  };

  return (
    incentives[experienceLevel as keyof typeof incentives] ||
    'Try this recommended sample'
  );
}

/**
 * Categorize recommendations for structured response
 */
function categorizeRecommendations(recommendations: any[]) {
  let perfectMatches = 0;
  let adventurous = 0;
  let seasonal = 0;

  recommendations.forEach(rec => {
    if (
      rec.confidence_level === 'very_high' ||
      rec.confidence_level === 'high'
    ) {
      perfectMatches++;
    } else if (rec.exploration_factor > 0.5) {
      adventurous++;
    } else {
      seasonal++;
    }
  });

  return {
    perfect_matches: perfectMatches,
    adventurous,
    seasonal,
  };
}

/**
 * Generate fallback recommendations when database function fails
 */
async function generateFallbackRecommendations(
  supabase: any,
  session: any,
  maxResults: number,
  priceMax?: number | null
) {
  let query = supabase
    .from('fragrances')
    .select(
      `
      id,
      name,
      brand_id,
      scent_family,
      sample_available,
      sample_price_usd,
      popularity_score,
      fragrance_brands!inner(name)
    `
    )
    .eq('sample_available', true)
    .order('popularity_score', { ascending: false })
    .limit(maxResults);

  if (priceMax) {
    query = query.lte('sample_price_usd', priceMax);
  }

  const { data: fragrances } = await query;

  const fallbackRecommendations = (fragrances || []).map(
    (frag: any, index: number) => ({
      fragrance_id: frag.id,
      name: frag.name,
      brand: frag.fragrance_brands.name,
      match_score: 0.75 - index * 0.02, // Decreasing mock scores
      quiz_reasoning: 'Popular choice based on general preferences',
      experience_relevance: 'Great option for fragrance exploration',
      sample_available: true,
      sample_price_usd: frag.sample_price_usd,
      notes: ['bergamot', 'rose', 'amber'],
      scent_family: frag.scent_family || 'fresh',
      recommendation_rank: index + 1,
      confidence_level: 'medium',
      exploration_factor: 0.3,
      seasonal_context: 'suitable year-round',
      purchase_incentive: 'Popular sample choice',
    })
  );

  return {
    recommendations: fallbackRecommendations,
    total_found: fallbackRecommendations.length,
    recommendation_categories: categorizeRecommendations(
      fallbackRecommendations
    ),
    fallback_mode: true,
    session_metadata: {
      experience_level: session.detected_experience_level,
      profile_name: session.unique_profile_name,
    },
    performance: {
      processing_time_ms: 50,
      cache_status: 'fallback',
      recommendation_engine: 'basic_popularity',
    },
  };
}

/**
 * Get current season
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

/**
 * Derive fragrance family from name (simple mapping)
 */
function deriveFamily(name: string): string {
  const nameLower = name.toLowerCase();
  if (
    nameLower.includes('fresh') ||
    nameLower.includes('aqua') ||
    nameLower.includes('marine')
  )
    return 'fresh';
  if (
    nameLower.includes('rose') ||
    nameLower.includes('floral') ||
    nameLower.includes('jasmine')
  )
    return 'floral';
  if (
    nameLower.includes('wood') ||
    nameLower.includes('cedar') ||
    nameLower.includes('sandalwood')
  )
    return 'woody';
  if (
    nameLower.includes('orient') ||
    nameLower.includes('amber') ||
    nameLower.includes('spice')
  )
    return 'oriental';
  if (
    nameLower.includes('vanilla') ||
    nameLower.includes('sweet') ||
    nameLower.includes('caramel')
  )
    return 'gourmand';
  if (
    nameLower.includes('citrus') ||
    nameLower.includes('lemon') ||
    nameLower.includes('bergamot')
  )
    return 'citrus';
  return 'balanced';
}
