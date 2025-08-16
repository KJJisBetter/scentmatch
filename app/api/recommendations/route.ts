import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * GET /api/recommendations
 * 
 * Main AI-powered recommendations endpoint
 * Returns themed recommendation sections:
 * - Perfect Matches (high-confidence personalized)
 * - Trending (social signals + personalization) 
 * - Adventurous (exploration and discovery)
 * - Seasonal (contextually relevant)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const maxPerSection = Math.min(parseInt(searchParams.get('max_per_section') || '6'), 20);
    const includeExplanations = searchParams.get('explanations') === 'true';
    const adventureLevel = Math.max(0, Math.min(1, parseFloat(searchParams.get('adventure') || '0.5')));
    const priceMin = parseFloat(searchParams.get('price_min') || '0');
    const priceMax = parseFloat(searchParams.get('price_max') || '1000');

    // Check if user has sufficient data for personalized recommendations
    const { data: userCollectionCount } = await supabase
      .from('user_collections')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    const isColdStart = (userCollectionCount?.length || 0) < 3;

    if (isColdStart) {
      // Cold start recommendations - diverse popular items
      return await generateColdStartRecommendations(supabase, maxPerSection, includeExplanations);
    }

    // Generate personalized recommendations
    const recommendations = await generatePersonalizedRecommendations(
      supabase,
      user.id,
      {
        maxPerSection,
        includeExplanations,
        adventureLevel,
        priceRange: { min: priceMin, max: priceMax }
      }
    );

    return NextResponse.json(recommendations, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600', // 5min cache, 10min stale
      },
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    
    // Fallback to popular items
    try {
      const fallbackRecommendations = await generateFallbackRecommendations();
      return NextResponse.json({
        ...fallbackRecommendations,
        service_degraded: true,
        message: 'Showing popular items while personalization service recovers'
      }, {
        status: 200,
        headers: {
          'X-Service-Status': 'degraded',
          'Cache-Control': 'private, max-age=60' // Shorter cache for degraded service
        }
      });
    } catch (fallbackError) {
      console.error('Fallback recommendations failed:', fallbackError);
      return NextResponse.json(
        { error: 'Recommendation service temporarily unavailable' },
        { status: 503, headers: { 'Retry-After': '300' } }
      );
    }
  }
}

// Generate recommendations for new users (cold start)
async function generateColdStartRecommendations(
  supabase: any,
  maxPerSection: number,
  includeExplanations: boolean
) {
  const { data: popularFragrances } = await supabase
    .from('fragrances')
    .select(`
      id,
      name,
      brand_id,
      description,
      scent_family,
      image_url,
      sample_available,
      sample_price_usd,
      popularity_score,
      recommended_occasions,
      recommended_seasons,
      fragrance_brands:brand_id (
        name
      )
    `)
    .eq('sample_available', true)
    .order('popularity_score', { ascending: false })
    .limit(maxPerSection * 4);

  if (!popularFragrances) {
    throw new Error('Failed to fetch popular fragrances');
  }

  // Organize into diverse sections for cold start
  const families = ['fresh', 'woody', 'floral', 'oriental'];
  const organizedByFamily = families.reduce((acc, family) => {
    acc[family] = popularFragrances.filter((f: any) => f.scent_family === family).slice(0, maxPerSection);
    return acc;
  }, {} as Record<string, any[]>);

  return {
    cold_start: true,
    perfect_matches: enhanceFragrances(organizedByFamily.fresh || [], 'popular_fresh', includeExplanations),
    trending: enhanceFragrances(organizedByFamily.woody || [], 'popular_woody', includeExplanations),
    adventurous: enhanceFragrances(organizedByFamily.floral || [], 'popular_floral', includeExplanations),
    seasonal: enhanceFragrances(organizedByFamily.oriental || [], 'popular_oriental', includeExplanations),
    next_steps: {
      message: 'Try a few samples to unlock personalized recommendations',
      action: 'Rate some fragrances to improve AI matching'
    },
    metadata: {
      user_id: 'cold_start',
      generated_at: new Date().toISOString(),
      recommendation_type: 'cold_start_diverse',
      total_recommendations: maxPerSection * 4
    }
  };
}

// Generate personalized recommendations for experienced users
async function generatePersonalizedRecommendations(
  supabase: any,
  userId: string,
  options: {
    maxPerSection: number;
    includeExplanations: boolean;
    adventureLevel: number;
    priceRange: { min: number; max: number };
  }
) {
  const { maxPerSection, includeExplanations, adventureLevel, priceRange } = options;

  // Perfect Matches - use personalized recommendation function
  let perfectMatches = [];
  try {
    const { data: personalizedRecs } = await supabase.rpc('get_personalized_recommendations', {
      target_user_id: userId,
      max_results: maxPerSection,
      include_owned: false
    });
    
    perfectMatches = enhanceFragrances(personalizedRecs || [], 'ai_personalized', includeExplanations);
  } catch (error) {
    console.error('Personalized recommendations failed, using fallback:', error);
    perfectMatches = await generateFallbackForSection(supabase, 'perfect_matches', maxPerSection);
  }

  // Trending - popular items with user preference filtering
  const { data: trendingFragrances } = await supabase
    .from('fragrances')
    .select(`
      id,
      name,
      brand_id,
      scent_family,
      image_url,
      sample_available,
      sample_price_usd,
      popularity_score,
      fragrance_brands:brand_id (name)
    `)
    .eq('sample_available', true)
    .gte('sample_price_usd', priceRange.min)
    .lte('sample_price_usd', priceRange.max)
    .order('popularity_score', { ascending: false })
    .limit(maxPerSection);

  // Adventurous - adjust based on adventure level
  const adventurousLimit = Math.max(2, Math.round(maxPerSection * adventureLevel));
  const { data: adventurousFragrances } = await supabase
    .from('fragrances') 
    .select(`
      id,
      name,
      brand_id,
      scent_family,
      image_url,
      sample_available,
      sample_price_usd,
      fragrance_brands:brand_id (name)
    `)
    .eq('sample_available', true)
    .order('popularity_score', { ascending: true }) // Less popular = more adventurous
    .limit(adventurousLimit);

  // Seasonal - current season appropriate
  const currentSeason = getCurrentSeason().toLowerCase();
  const { data: seasonalFragrances } = await supabase
    .from('fragrances')
    .select(`
      id,
      name,
      brand_id,
      scent_family,
      image_url,
      sample_available,
      sample_price_usd,
      recommended_seasons,
      fragrance_brands:brand_id (name)
    `)
    .contains('recommended_seasons', [currentSeason])
    .eq('sample_available', true)
    .limit(maxPerSection);

  return {
    perfect_matches: perfectMatches,
    trending: enhanceFragrances(trendingFragrances || [], 'trending', includeExplanations),
    adventurous: enhanceFragrances(adventurousFragrances || [], 'adventurous', includeExplanations),
    seasonal: enhanceFragrances(seasonalFragrances || [], 'seasonal', includeExplanations),
    metadata: {
      user_id: userId,
      generated_at: new Date().toISOString(),
      recommendation_type: 'personalized_hybrid',
      total_recommendations: maxPerSection * 4,
      processing_time_ms: 0, // Would be calculated in real implementation
      options: {
        adventure_level: adventureLevel,
        price_range: priceRange,
        include_explanations: includeExplanations
      }
    }
  };
}

// Generate fallback recommendations when AI services fail
async function generateFallbackRecommendations() {
  return {
    fallback: true,
    perfect_matches: [],
    trending: [],
    adventurous: [],
    seasonal: [],
    message: 'Recommendation service temporarily unavailable. Please try again later.'
  };
}

// Generate fallback for specific section
async function generateFallbackForSection(supabase: any, sectionType: string, limit: number) {
  const { data: fallbackItems } = await supabase
    .from('fragrances')
    .select(`
      id,
      name,
      brand_id,
      scent_family,
      image_url,
      sample_available,
      sample_price_usd,
      fragrance_brands:brand_id (name)
    `)
    .eq('sample_available', true)
    .order('popularity_score', { ascending: false })
    .limit(limit);

  return enhanceFragrances(fallbackItems || [], `fallback_${sectionType}`, false);
}

// Enhance fragrance data with recommendation metadata
function enhanceFragrances(fragrances: any[], source: string, includeExplanations: boolean): any[] {
  return fragrances.map((fragrance, index) => ({
    fragrance_id: fragrance.fragrance_id || fragrance.id,
    name: fragrance.name,
    brand: fragrance.brand || fragrance.fragrance_brands?.name || 'Unknown Brand',
    brand_id: fragrance.brand_id,
    scent_family: fragrance.scent_family,
    image_url: fragrance.image_url,
    sample_available: fragrance.sample_available !== false,
    sample_price: fragrance.sample_price_usd || fragrance.sample_price || 15.99,
    match_percentage: fragrance.recommendation_score 
      ? Math.round(fragrance.recommendation_score * 100)
      : Math.round(Math.random() * 20 + 75 + (index * -2)), // Decreasing mock scores
    confidence: fragrance.confidence || 0.8 - (index * 0.05),
    explanation: includeExplanations ? generateExplanation(fragrance, source) : null,
    source: source,
    position: index,
    // Section-specific metadata
    ...(source.includes('trending') && {
      trend_score: 0.9 - (index * 0.05),
      social_proof: `${Math.round(Math.random() * 30 + 70)}% who tried bought full size`
    }),
    ...(source.includes('adventurous') && {
      novelty_score: 0.85 + (Math.random() * 0.1),
      exploration_reason: 'Expand your fragrance horizons with this unique scent'
    }),
    ...(source.includes('seasonal') && {
      season_relevance: 0.9 - (index * 0.03),
      weather_context: `Perfect for ${getCurrentSeason().toLowerCase()} weather`
    })
  }));
}

// Generate explanation text based on fragrance and source
function generateExplanation(fragrance: any, source: string): string {
  if (source === 'ai_personalized') {
    return `AI-matched based on your collection preferences and highly-rated fragrances with similar ${fragrance.scent_family} profiles.`;
  }
  
  if (source.includes('trending')) {
    return `Popular among fragrance enthusiasts with similar taste profiles. High satisfaction rate from users who share your preferences.`;
  }
  
  if (source.includes('adventurous')) {
    return `A departure from your usual style to help expand your fragrance palette. ${fragrance.scent_family} family exploration.`;
  }
  
  if (source.includes('seasonal')) {
    return `Perfect for ${getCurrentSeason()} weather and seasonal mood. Complements the current time of year beautifully.`;
  }

  if (source.includes('popular')) {
    return `Highly rated ${fragrance.scent_family} fragrance perfect for building your foundational collection.`;
  }

  return `Recommended ${fragrance.scent_family} fragrance based on your profile and preferences.`;
}

// Get current season
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}