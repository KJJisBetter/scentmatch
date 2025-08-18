import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

/**
 * POST /api/quiz/select-favorites
 *
 * Allow advanced users (collectors/enthusiasts) to input favorite fragrances
 * This data helps personalize quiz flow and improve recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required parameters
    const { session_token, fragrance_ids, confidence_scores } = body;

    if (!session_token || !fragrance_ids || !Array.isArray(fragrance_ids)) {
      return NextResponse.json(
        { error: 'Session token and fragrance_ids array are required' },
        { status: 400 }
      );
    }

    // Validate confidence scores if provided
    if (
      confidence_scores &&
      (!Array.isArray(confidence_scores) ||
        confidence_scores.length !== fragrance_ids.length)
    ) {
      return NextResponse.json(
        {
          error:
            'confidence_scores must be an array with same length as fragrance_ids',
        },
        { status: 400 }
      );
    }

    // Validate confidence score values
    if (
      confidence_scores &&
      confidence_scores.some(
        (score: any) => typeof score !== 'number' || score < 0 || score > 1
      )
    ) {
      return NextResponse.json(
        { error: 'confidence_scores must be numbers between 0.0 and 1.0' },
        { status: 400 }
      );
    }

    // Limit number of favorites to prevent abuse
    if (fragrance_ids.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 favorite fragrances allowed' },
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

    // Verify fragrance IDs exist in database (using actual column names)
    const { data: fragrances, error: fragranceError } = await supabase
      .from('fragrances')
      .select(
        'id, name, brand_name, brand_id, gender, accords, personality_tags, embedding'
      )
      .in('id', fragrance_ids);

    if (fragranceError) {
      console.error('Error fetching fragrances:', fragranceError);
      return NextResponse.json(
        { error: 'Failed to validate fragrance selections' },
        { status: 500 }
      );
    }

    if (!fragrances || fragrances.length === 0) {
      return NextResponse.json(
        { error: 'No valid fragrances found with provided IDs' },
        { status: 400 }
      );
    }

    // Get current user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Store favorite fragrances if user is authenticated
    if (user?.id) {
      const favoriteRecords = fragrance_ids.map((fragranceId, index) => ({
        user_id: user.id,
        fragrance_id: fragranceId,
        selection_source: 'quiz_input',
        confidence_score: confidence_scores ? confidence_scores[index] : 1.0,
        selected_at: new Date().toISOString(),
        metadata: {
          session_token,
          quiz_context: 'enhanced_adaptive_quiz',
        },
      }));

      const { error: favoritesError } = await supabase
        .from('user_favorite_fragrances')
        .upsert(favoriteRecords, {
          onConflict: 'user_id,fragrance_id',
        });

      if (favoritesError) {
        console.error('Error storing favorite fragrances:', favoritesError);
        // Don't fail the entire request for this - continue with analysis
      }
    }

    // Analyze selected fragrances for personality hints
    const personalityHints = await analyzeFragranceSelections(fragrances);

    // Determine if we can skip basic questions based on sophistication of selections
    const skipBasicQuestions = shouldSkipBasicQuestions(
      fragrances,
      confidence_scores
    );

    // Update session with favorite fragrance data
    const { error: updateError } = await supabase
      .from('user_quiz_sessions')
      .update({
        favorite_fragrances_collected: true,
        metadata: {
          ...session.metadata,
          favorite_fragrance_ids: fragrance_ids,
          favorite_confidence_scores: confidence_scores,
          skip_basic_questions: skipBasicQuestions,
          personality_hints: personalityHints,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('session_token', session_token);

    if (updateError) {
      console.error('Error updating session with favorites:', updateError);
      return NextResponse.json(
        { error: 'Failed to save favorite selections' },
        { status: 500 }
      );
    }

    // Get next question based on collected data
    const nextQuestion = getNextQuestionAfterFavorites(
      session.detected_experience_level,
      skipBasicQuestions
    );

    console.log(
      `Processed ${fragrance_ids.length} favorite fragrances for session ${session_token}`
    );

    return NextResponse.json(
      {
        success: true,
        favorites_processed: fragrance_ids.length,
        personality_hints: personalityHints,
        skip_basic_questions: skipBasicQuestions,
        next_question: nextQuestion,
        insights: {
          dominant_families: personalityHints.emerging_families,
          sophistication_level: personalityHints.style_indicators.includes(
            'sophisticated'
          )
            ? 'high'
            : 'moderate',
          quiz_optimization: skipBasicQuestions
            ? 'advanced_track'
            : 'standard_track',
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error in select favorites:', error);

    return NextResponse.json(
      { error: 'Favorite selection processing temporarily unavailable' },
      { status: 500 }
    );
  }
}

/**
 * Analyze selected fragrances to extract personality hints
 */
async function analyzeFragranceSelections(fragrances: any[]) {
  const emergingFamilies: string[] = [];
  const styleIndicators: string[] = [];
  const accordCounts: Record<string, number> = {};
  const brandTypes: Record<string, number> = {};

  // Count accords from selected fragrances (using actual column)
  fragrances.forEach(fragrance => {
    if (fragrance.accords && Array.isArray(fragrance.accords)) {
      fragrance.accords.forEach((accord: string) => {
        const accordKey = accord.toLowerCase();
        accordCounts[accordKey] = (accordCounts[accordKey] || 0) + 1;
      });
    }

    // Analyze brand sophistication
    if (fragrance.brand_name) {
      const brand = fragrance.brand_name.toLowerCase();
      brandTypes[brand] = (brandTypes[brand] || 0) + 1;

      // Check for luxury/niche brands
      if (
        [
          'chanel',
          'tom ford',
          'creed',
          'by kilian',
          'maison margiela',
        ].includes(brand)
      ) {
        styleIndicators.push('luxury_preference');
      }
    }
  });

  // Identify dominant fragrance families from accords
  const totalFragrances = fragrances.length;
  const familyMapping = {
    rose: 'floral',
    jasmine: 'floral',
    peony: 'floral',
    lily: 'floral',
    bergamot: 'fresh',
    lemon: 'fresh',
    mint: 'fresh',
    marine: 'fresh',
    amber: 'oriental',
    vanilla: 'oriental',
    spices: 'oriental',
    oud: 'oriental',
    sandalwood: 'woody',
    cedar: 'woody',
    vetiver: 'woody',
    patchouli: 'woody',
    apple: 'fruity',
    berry: 'fruity',
    citrus: 'fruity',
    peach: 'fruity',
  };

  // Map accords to families
  const scentFamilies: Record<string, number> = {};
  Object.entries(accordCounts).forEach(([accord, count]) => {
    const family =
      familyMapping[accord as keyof typeof familyMapping] || 'balanced';
    scentFamilies[family] = (scentFamilies[family] || 0) + count;
  });

  // Find dominant families (>25% representation)
  Object.entries(scentFamilies).forEach(([family, count]) => {
    if (count / Math.max(totalFragrances, 1) >= 0.25) {
      emergingFamilies.push(family);
    }
  });

  // Analyze sophistication level based on selection patterns
  const averageAccordComplexity =
    fragrances.reduce((sum, fragrance) => {
      return sum + (fragrance.accords ? fragrance.accords.length : 3);
    }, 0) / Math.max(fragrances.length, 1);

  if (averageAccordComplexity > 5) {
    styleIndicators.push('sophisticated');
  }

  if (totalFragrances >= 5) {
    styleIndicators.push('experienced');
  }

  if (totalFragrances >= 3) {
    styleIndicators.push('discerning');
  }

  // Ensure we have fallback values
  if (emergingFamilies.length === 0) {
    const topFamily = Object.entries(scentFamilies).sort(
      ([, a], [, b]) => b - a
    )[0];
    if (topFamily) {
      emergingFamilies.push(topFamily[0]);
    } else {
      emergingFamilies.push('balanced');
    }
  }

  if (styleIndicators.length === 0) {
    styleIndicators.push('developing');
  }

  return {
    emerging_families: emergingFamilies,
    style_indicators: styleIndicators,
    selection_analysis: {
      total_selections: totalFragrances,
      family_distribution: scentFamilies,
      complexity_score: averageAccordComplexity,
      accord_distribution: accordCounts,
    },
  };
}

/**
 * Determine if basic questions can be skipped based on sophisticated selections
 */
function shouldSkipBasicQuestions(
  fragrances: any[],
  confidenceScores?: number[]
): boolean {
  // Skip if 3+ selections with high confidence
  if (fragrances.length >= 3) {
    if (confidenceScores) {
      const averageConfidence =
        confidenceScores.reduce((sum, score) => sum + score, 0) /
        confidenceScores.length;
      return averageConfidence >= 0.8;
    }
    return true; // If no confidence scores provided but 3+ selections, assume sophisticated
  }

  return false;
}

/**
 * Get next question after processing favorites
 */
function getNextQuestionAfterFavorites(
  experienceLevel: string,
  skipBasicQuestions: boolean
) {
  const questionId = skipBasicQuestions
    ? 'advanced_preference_1'
    : 'standard_preference_1';

  const baseQuestion = {
    id: questionId,
    complexity_level: skipBasicQuestions ? 'advanced' : 'intermediate',
    ui_hints: {
      layout: 'cards',
      show_descriptions: true,
      progress_bar: true,
    },
  };

  if (skipBasicQuestions) {
    return {
      ...baseQuestion,
      text: 'Based on your favorites, what aspect would you like to explore further?',
      options: [
        {
          id: 'similar_sophistication',
          text: 'Similar sophistication level',
          description: 'Fragrances with comparable complexity and refinement',
        },
        {
          id: 'complementary_families',
          text: 'Complementary scent families',
          description: 'Expand your collection with harmonious new territories',
        },
        {
          id: 'seasonal_variations',
          text: 'Seasonal variations',
          description: 'Adaptations of your style for different occasions',
        },
        {
          id: 'innovative_interpretations',
          text: 'Modern interpretations',
          description: 'Contemporary takes on your established preferences',
        },
      ],
    };
  }

  return {
    ...baseQuestion,
    text: 'How would you like your recommendations to relate to your favorites?',
    options: [
      {
        id: 'very_similar',
        text: 'Very similar to what I selected',
        description: 'Safe choices close to your comfort zone',
      },
      {
        id: 'somewhat_different',
        text: 'Somewhat different but related',
        description: 'Gentle exploration of new territories',
      },
      {
        id: 'adventurous',
        text: 'Adventurous and surprising',
        description: 'Bold discoveries that expand your horizons',
      },
    ],
  };
}
