import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * POST /api/quiz/submit-experience-level
 *
 * Process experience level selection and adapt quiz flow accordingly
 * Updates session with detected experience level and returns next question
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const body = await request.json();

    // Validate required parameters
    const { session_token, experience_level, previous_experience } = body;

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

    // Determine adaptive mode
    const adaptiveMode = getAdaptiveMode(experience_level);

    // Update session with experience level and adaptive mode
    const { error: updateError } = await supabase
      .from('user_quiz_sessions')
      .update({
        detected_experience_level: experience_level,
        current_question: 2, // Move to next question
        total_questions: getUpdatedQuestionCount(experience_level),
        metadata: {
          ...session.metadata,
          detected_experience_level: experience_level,
          adaptive_ui_mode: adaptiveMode,
          previous_experience_description: previous_experience,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('session_token', session_token);

    if (updateError) {
      console.error(
        'Error updating session with experience level:',
        updateError
      );
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    // Determine if we should show favorites input for advanced users
    const showFavoritesInput = experience_level === 'collector';

    // Get next question based on experience level
    const nextQuestion = getNextQuestionForExperience(experience_level, 2);

    // Generate personality hints if collector level (has sophisticated preferences)
    const personalityHints =
      experience_level === 'collector'
        ? generateInitialPersonalityHints(previous_experience)
        : null;

    console.log(
      `Experience level detected: ${experience_level} for session ${session_token}`
    );

    return NextResponse.json(
      {
        success: true,
        adaptive_mode: adaptiveMode,
        next_question: nextQuestion,
        show_favorites_input: showFavoritesInput,
        personality_hints: personalityHints,
        quiz_flow_updates: {
          total_questions: getUpdatedQuestionCount(experience_level),
          current_question: 2,
          skip_basic_questions: experience_level === 'collector',
          enable_advanced_vocabulary: experience_level !== 'beginner',
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error in submit experience level:', error);

    return NextResponse.json(
      { error: 'Experience level processing temporarily unavailable' },
      { status: 500 }
    );
  }
}

/**
 * Get adaptive mode based on experience level
 */
function getAdaptiveMode(
  experienceLevel: string
): 'beginner' | 'standard' | 'advanced' {
  switch (experienceLevel) {
    case 'beginner':
      return 'beginner';
    case 'enthusiast':
      return 'standard';
    case 'collector':
      return 'advanced';
    default:
      return 'standard';
  }
}

/**
 * Get updated question count based on detected experience level
 */
function getUpdatedQuestionCount(experienceLevel: string): number {
  switch (experienceLevel) {
    case 'beginner':
      return 8; // Shorter, focused quiz
    case 'enthusiast':
      return 12; // Standard comprehensive quiz
    case 'collector':
      return 15; // Detailed quiz with nuanced questions
    default:
      return 10;
  }
}

/**
 * Get next question appropriate for experience level
 */
function getNextQuestionForExperience(
  experienceLevel: string,
  questionNumber: number
) {
  const baseQuestion = {
    id: `${experienceLevel}_question_${questionNumber}`,
    complexity_level: getComplexityLevel(experienceLevel),
    ui_hints: {
      layout: 'cards',
      show_descriptions: experienceLevel !== 'beginner',
      progress_bar: true,
      enable_search: experienceLevel === 'collector',
    },
  };

  switch (experienceLevel) {
    case 'beginner':
      return {
        ...baseQuestion,
        text: 'When do you most want to wear fragrance?',
        options: [
          {
            id: 'everyday_confidence',
            text: 'Every day for confidence',
            description: 'A signature scent for daily wear',
          },
          {
            id: 'special_occasions',
            text: 'Special occasions only',
            description: 'Something memorable for important moments',
          },
          {
            id: 'mood_enhancement',
            text: 'When I want to feel different',
            description: 'To express or change my mood',
          },
          {
            id: 'social_situations',
            text: 'When meeting people',
            description: 'To make a good impression',
          },
        ],
      };

    case 'enthusiast':
      return {
        ...baseQuestion,
        text: 'What fragrance characteristic is most important to you?',
        options: [
          {
            id: 'longevity_performance',
            text: 'Longevity & Performance',
            description: 'Stays strong throughout the day',
          },
          {
            id: 'uniqueness_compliments',
            text: 'Uniqueness & Compliments',
            description: 'Stands out and gets noticed',
          },
          {
            id: 'versatility_seasons',
            text: 'Versatility & Seasonality',
            description: 'Works for multiple occasions',
          },
          {
            id: 'emotional_connection',
            text: 'Emotional Connection',
            description: 'Evokes specific feelings or memories',
          },
        ],
      };

    case 'collector':
      return {
        ...baseQuestion,
        text: 'Which aspect of perfumery most captivates your interest?',
        options: [
          {
            id: 'molecular_artistry',
            text: 'Molecular Innovation & Artistry',
            description:
              'Cutting-edge molecules and creative composition techniques',
          },
          {
            id: 'terroir_authenticity',
            text: 'Terroir & Authentic Materials',
            description:
              'Raw material provenance and natural extraction methods',
          },
          {
            id: 'cultural_narrative',
            text: 'Cultural Heritage & Narrative',
            description:
              'Historical significance and storytelling through scent',
          },
          {
            id: 'olfactory_architecture',
            text: 'Olfactory Architecture',
            description:
              'Complex structural development and evolution over time',
          },
        ],
      };

    default:
      return {
        ...baseQuestion,
        text: 'What draws you to a fragrance?',
        options: [
          { id: 'scent_appeal', text: 'The scent itself' },
          { id: 'brand_reputation', text: 'Brand reputation' },
          { id: 'recommendations', text: 'Recommendations from others' },
          { id: 'mood_expression', text: 'How it makes me feel' },
        ],
      };
  }
}

/**
 * Get complexity level based on experience
 */
function getComplexityLevel(
  experienceLevel: string
): 'simple' | 'intermediate' | 'advanced' {
  switch (experienceLevel) {
    case 'beginner':
      return 'simple';
    case 'enthusiast':
      return 'intermediate';
    case 'collector':
      return 'advanced';
    default:
      return 'intermediate';
  }
}

/**
 * Generate initial personality hints for collectors based on their description
 */
function generateInitialPersonalityHints(previousExperience?: string) {
  if (!previousExperience) {
    return {
      emerging_families: ['sophisticated'],
      style_indicators: ['discerning'],
    };
  }

  const text = previousExperience.toLowerCase();
  const emergingFamilies = [];
  const styleIndicators = [];

  // Analyze text for fragrance family indicators
  if (
    text.includes('floral') ||
    text.includes('rose') ||
    text.includes('jasmine')
  ) {
    emergingFamilies.push('floral');
  }
  if (
    text.includes('woody') ||
    text.includes('cedar') ||
    text.includes('sandalwood')
  ) {
    emergingFamilies.push('woody');
  }
  if (
    text.includes('oriental') ||
    text.includes('spicy') ||
    text.includes('amber')
  ) {
    emergingFamilies.push('oriental');
  }
  if (
    text.includes('fresh') ||
    text.includes('citrus') ||
    text.includes('aquatic')
  ) {
    emergingFamilies.push('fresh');
  }

  // Analyze for style indicators
  if (
    text.includes('sophisticated') ||
    text.includes('elegant') ||
    text.includes('refined')
  ) {
    styleIndicators.push('sophisticated');
  }
  if (
    text.includes('bold') ||
    text.includes('statement') ||
    text.includes('strong')
  ) {
    styleIndicators.push('bold');
  }
  if (
    text.includes('unique') ||
    text.includes('different') ||
    text.includes('niche')
  ) {
    styleIndicators.push('avant-garde');
  }
  if (
    text.includes('classic') ||
    text.includes('timeless') ||
    text.includes('traditional')
  ) {
    styleIndicators.push('classic');
  }

  // Default fallbacks for collectors
  if (emergingFamilies.length === 0) {
    emergingFamilies.push('sophisticated', 'complex');
  }
  if (styleIndicators.length === 0) {
    styleIndicators.push('discerning', 'connoisseur');
  }

  return {
    emerging_families: emergingFamilies,
    style_indicators: styleIndicators,
  };
}
