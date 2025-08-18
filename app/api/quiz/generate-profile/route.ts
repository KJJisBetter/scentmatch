import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { AIProfileGenerator } from '@/lib/ai/ai-profile-generator';

/**
 * POST /api/quiz/generate-profile
 *
 * Generate AI-powered unique profile name and description based on quiz data
 * Uses 3-tier caching system: cache/template/AI for optimal performance
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const body = await request.json();

    // Validate required parameters
    const { session_token, experience_level, force_new = false } = body;

    if (!session_token || !experience_level) {
      return NextResponse.json(
        { error: 'Session token and experience level are required' },
        { status: 400 }
      );
    }

    // Validate experience level
    if (!['beginner', 'enthusiast', 'collector'].includes(experience_level)) {
      return NextResponse.json(
        {
          error:
            'Invalid experience level. Must be: beginner, enthusiast, or collector',
        },
        { status: 400 }
      );
    }

    // Get and validate session
    const { data: session, error: sessionError } = await supabase
      .from('user_quiz_sessions')
      .select('*')
      .eq('session_token', session_token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session token or session expired' },
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

    // Get personality data if it exists
    const { data: personalityData } = await supabase
      .from('user_fragrance_personalities')
      .select('*')
      .eq('session_id', session.id)
      .single();

    // Check cache first unless forcing new generation
    if (!force_new) {
      const cachedProfile = await getCachedProfile(
        supabase,
        experience_level,
        personalityData?.personality_type
      );
      if (cachedProfile) {
        // Update session with cached profile
        await updateSessionWithProfile(
          supabase,
          session.id,
          cachedProfile,
          'cached'
        );

        return NextResponse.json({
          success: true,
          unique_profile_name: cachedProfile.unique_profile_name,
          profile_description: parseProfileDescription(
            cachedProfile.profile_description
          ),
          personality_type:
            personalityData?.personality_type || 'balanced_explorer',
          confidence_score: cachedProfile.uniqueness_score || 0.8,
          generation_method: 'cached',
        });
      }
    }

    // Prepare personality analysis for AI generation
    const personalityAnalysis = preparePersonalityAnalysis(
      session,
      personalityData,
      experience_level
    );

    // Get selected favorite fragrances if available
    const selectedFavorites = await getSelectedFavorites(supabase, session);

    // Initialize AI Profile Generator
    const aiGenerator = new AIProfileGenerator();

    // Generate new profile using AI system
    const generatedProfile = await aiGenerator.generateProfileFromQuizResults({
      experience_level,
      personality_analysis: personalityAnalysis,
      selected_favorites: selectedFavorites,
    });

    // Cache the generated profile for future use
    await cacheGeneratedProfile(
      supabase,
      experience_level,
      personalityAnalysis.personality_type,
      generatedProfile
    );

    // Update session with generated profile
    await updateSessionWithProfile(
      supabase,
      session.id,
      generatedProfile,
      generatedProfile.generation_method
    );

    // Format profile description into paragraphs
    const formattedDescription = formatProfileDescription(
      generatedProfile.description
    );

    console.log(
      `Generated profile "${generatedProfile.profile_name}" for session ${session_token} (${generatedProfile.generation_method})`
    );

    return NextResponse.json(
      {
        success: true,
        unique_profile_name: generatedProfile.profile_name,
        profile_description: formattedDescription,
        personality_type: personalityAnalysis.personality_type,
        confidence_score: generatedProfile.uniqueness_score,
        generation_method: generatedProfile.generation_method,
        style_descriptor: generatedProfile.style_descriptor,
        personality_insights: generatedProfile.personality_insights,
        seasonal_preferences: generatedProfile.seasonal_preferences,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=3600', // 1 hour cache for user
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in generate profile:', error);

    return NextResponse.json(
      { error: 'Profile generation temporarily unavailable' },
      { status: 500 }
    );
  }
}

/**
 * Check cache for existing profile
 */
async function getCachedProfile(
  supabase: any,
  experienceLevel: string,
  personalityType?: string
) {
  if (!personalityType) return null;

  const { data: cachedProfile } = await supabase
    .from('ai_profile_cache')
    .select('*')
    .eq('experience_level', experienceLevel)
    .eq('personality_type', personalityType)
    .lt('usage_count', 3) // Limit reuse to maintain uniqueness
    .gt('expires_at', new Date().toISOString())
    .order('usage_count', { ascending: true })
    .limit(1)
    .single();

  if (cachedProfile) {
    // Update usage count
    await supabase
      .from('ai_profile_cache')
      .update({
        usage_count: cachedProfile.usage_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', cachedProfile.id);

    return cachedProfile;
  }

  return null;
}

/**
 * Prepare personality analysis for AI generation
 */
function preparePersonalityAnalysis(
  session: any,
  personalityData: any,
  experienceLevel: string
) {
  // Extract personality hints from session metadata
  const personalityHints = session.metadata?.personality_hints || {};

  // Create default personality analysis if none exists
  const defaultAnalysis = {
    personality_type: personalityData?.personality_type || 'balanced_explorer',
    experience_level: experienceLevel,
    dimensions: {
      fresh: 0.3,
      floral: 0.2,
      oriental: 0.2,
      woody: 0.2,
      fruity: 0.1,
    },
    confidence_score: personalityData?.confidence_score || 0.7,
    style_descriptor: personalityData?.style_descriptor || 'discovering',
  };

  // Enhance with quiz session data if available
  if (personalityHints.emerging_families) {
    personalityHints.emerging_families.forEach((family: string) => {
      if (
        defaultAnalysis.dimensions[
          family as keyof typeof defaultAnalysis.dimensions
        ] !== undefined
      ) {
        defaultAnalysis.dimensions[
          family as keyof typeof defaultAnalysis.dimensions
        ] += 0.2;
      }
    });
  }

  // Normalize dimensions to sum to 1
  const dimensionSum = Object.values(defaultAnalysis.dimensions).reduce(
    (sum, val) => sum + val,
    0
  );
  Object.keys(defaultAnalysis.dimensions).forEach(key => {
    defaultAnalysis.dimensions[
      key as keyof typeof defaultAnalysis.dimensions
    ] /= dimensionSum;
  });

  return defaultAnalysis;
}

/**
 * Get selected favorite fragrances from session
 */
async function getSelectedFavorites(supabase: any, session: any) {
  const favoriteIds = session.metadata?.favorite_fragrance_ids;
  if (!favoriteIds || !Array.isArray(favoriteIds) || favoriteIds.length === 0) {
    return [];
  }

  const { data: favorites } = await supabase
    .from('fragrances')
    .select(
      `
      id,
      name,
      fragrance_brands!inner(name)
    `
    )
    .in('id', favoriteIds);

  return (
    favorites?.map((fav: any) => ({
      id: fav.id,
      name: fav.name,
      brand: fav.fragrance_brands.name,
    })) || []
  );
}

/**
 * Cache generated profile for future use
 */
async function cacheGeneratedProfile(
  supabase: any,
  experienceLevel: string,
  personalityType: string,
  generatedProfile: any
) {
  try {
    await supabase.from('ai_profile_cache').insert({
      personality_type: personalityType,
      experience_level: experienceLevel,
      unique_profile_name: generatedProfile.profile_name,
      profile_description: generatedProfile.description,
      style_descriptor: generatedProfile.style_descriptor,
      usage_count: 1,
      uniqueness_score: generatedProfile.uniqueness_score,
      generation_method: generatedProfile.generation_method,
      ai_token_usage: generatedProfile.ai_token_usage || 0,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });
  } catch (error) {
    // Don't fail the request if caching fails
    console.error('Failed to cache profile:', error);
  }
}

/**
 * Update session with generated profile
 */
async function updateSessionWithProfile(
  supabase: any,
  sessionId: string,
  profile: any,
  method: string
) {
  await supabase
    .from('user_quiz_sessions')
    .update({
      ai_profile_generated: true,
      unique_profile_name: profile.profile_name || profile.unique_profile_name,
      metadata: {
        profile_generation_method: method,
        profile_uniqueness_score: profile.uniqueness_score,
        generated_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
}

/**
 * Parse profile description from cache format
 */
function parseProfileDescription(description: string) {
  // If description is already in paragraph format, split and return
  const paragraphs = description.split('\n\n').filter(p => p.trim().length > 0);

  if (paragraphs.length >= 3) {
    return {
      paragraph_1: paragraphs[0]?.trim() || '',
      paragraph_2: paragraphs[1]?.trim() || '',
      paragraph_3: paragraphs[2]?.trim() || '',
    };
  }

  // If single paragraph, try to split by sentences
  const sentences = description.split('. ').filter(s => s.trim().length > 0);
  if (sentences.length >= 3) {
    const thirdPoint = Math.floor(sentences.length / 3);
    const twoThirds = Math.floor((sentences.length * 2) / 3);

    return {
      paragraph_1: sentences.slice(0, thirdPoint).join('. ') + '.',
      paragraph_2: sentences.slice(thirdPoint, twoThirds).join('. ') + '.',
      paragraph_3: sentences.slice(twoThirds).join('. '),
    };
  }

  // Fallback: single paragraph divided equally
  return {
    paragraph_1: description,
    paragraph_2:
      'Your fragrance journey reflects your unique personality and evolving taste.',
    paragraph_3:
      'Continue exploring to discover scents that perfectly express your individual style.',
  };
}

/**
 * Format generated profile description into structured paragraphs
 */
function formatProfileDescription(description: string) {
  const paragraphs = description.split('\n\n').filter(p => p.trim().length > 0);

  if (paragraphs.length >= 3) {
    return {
      paragraph_1: paragraphs[0]?.trim() || '',
      paragraph_2: paragraphs[1]?.trim() || '',
      paragraph_3: paragraphs[2]?.trim() || '',
    };
  }

  // If AI didn't generate proper paragraphs, create structure
  const sentences = description.split('. ').filter(s => s.trim().length > 0);

  if (sentences.length >= 3) {
    const thirdPoint = Math.floor(sentences.length / 3);
    const twoThirds = Math.floor((sentences.length * 2) / 3);

    return {
      paragraph_1: sentences.slice(0, thirdPoint).join('. ') + '.',
      paragraph_2: sentences.slice(thirdPoint, twoThirds).join('. ') + '.',
      paragraph_3: sentences.slice(twoThirds).join('. '),
    };
  }

  // Fallback for short descriptions
  return {
    paragraph_1: description,
    paragraph_2:
      'Your unique fragrance profile reflects your personal journey and developing preferences.',
    paragraph_3:
      'Explore recommendations tailored specifically to your individual style and personality.',
  };
}
