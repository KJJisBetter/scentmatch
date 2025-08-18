import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

export type ExperienceLevel = 'beginner' | 'enthusiast' | 'collector';
export type GenderPreference = 'women' | 'men' | 'unisex' | 'all';

interface StartEnhancedRequest {
  gender_preference: GenderPreference;
  experience_level: ExperienceLevel;
  referral_source?: string;
  is_guest_session?: boolean;
}

/**
 * Enhanced Quiz Start API
 *
 * Initializes a new enhanced quiz session with:
 * - Gender preference for filtering recommendations
 * - Experience level for adaptive question complexity
 * - Session tracking with 24-hour expiration
 * - Adaptive question generation based on user level
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
      key: `quiz-start:${ip}`,
      limit: 5,
      window: 300000, // 5 minutes
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', success: false },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body: StartEnhancedRequest = await request.json();
    const {
      gender_preference,
      experience_level,
      referral_source,
      is_guest_session = true,
    } = body;

    // Validation
    if (
      !gender_preference ||
      !['women', 'men', 'unisex', 'all'].includes(gender_preference)
    ) {
      return NextResponse.json(
        {
          error:
            'Valid gender_preference is required (women, men, unisex, all)',
          success: false,
        },
        { status: 400 }
      );
    }

    if (
      !experience_level ||
      !['beginner', 'enthusiast', 'collector'].includes(experience_level)
    ) {
      return NextResponse.json(
        {
          error:
            'Valid experience_level is required (beginner, enthusiast, collector)',
          success: false,
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate session token
    const sessionToken = `enhanced-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create quiz session
    const sessionData = {
      session_token: sessionToken,
      quiz_version: 'enhanced-v1',
      started_at: new Date().toISOString(),
      current_question: 0,
      total_questions: getQuestionCount(experience_level),
      is_completed: false,
      is_guest_session,
      detected_experience_level: experience_level,
      referral_source: referral_source || 'direct',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: sessionInsert, error: sessionError } = await supabase
      .from('user_quiz_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('Failed to create enhanced quiz session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create quiz session', success: false },
        { status: 500 }
      );
    }

    // Generate adaptive questions based on experience level
    const adaptiveQuestions = generateAdaptiveQuestions(
      experience_level,
      gender_preference
    );

    // Return session info and questions
    return NextResponse.json({
      success: true,
      session_token: sessionToken,
      session_id: sessionInsert.id,
      quiz_version: 'enhanced-v1',
      gender_preference,
      experience_level,
      is_guest_session,
      expires_at: sessionData.expires_at,
      adaptive_questions: adaptiveQuestions,
      total_questions: adaptiveQuestions.length,
      ui_mode: getUIMode(experience_level),
      personalization_features: getPersonalizationFeatures(experience_level),
    });
  } catch (error) {
    console.error('Error starting enhanced quiz:', error);
    return NextResponse.json(
      { error: 'Failed to start enhanced quiz', success: false },
      { status: 500 }
    );
  }
}

/**
 * Get question count based on experience level
 */
function getQuestionCount(experienceLevel: ExperienceLevel): number {
  switch (experienceLevel) {
    case 'beginner':
      return 4; // Simplified path
    case 'enthusiast':
      return 4; // Balanced path with favorites
    case 'collector':
      return 4; // Comprehensive path with collection questions
    default:
      return 4;
  }
}

/**
 * Generate adaptive questions based on experience level and gender
 */
function generateAdaptiveQuestions(
  experienceLevel: ExperienceLevel,
  genderPreference: GenderPreference
) {
  const baseQuestions = {
    beginner: [
      {
        id: 'personality_style',
        text: 'What describes your personality?',
        subtitle: 'Choose all that describe you - be yourself!',
        allowMultiple: true,
        minSelections: 1,
        maxSelections: 4,
        options: [
          { value: 'casual', text: 'Casual', emoji: '😊' },
          { value: 'professional', text: 'Professional', emoji: '💼' },
          { value: 'romantic', text: 'Romantic', emoji: '💕' },
          { value: 'confident', text: 'Confident', emoji: '✨' },
          { value: 'creative', text: 'Creative', emoji: '🎨' },
          { value: 'adventurous', text: 'Adventurous', emoji: '🌟' },
        ],
      },
      {
        id: 'occasions_multiple',
        text: 'When do you want to smell amazing?',
        subtitle: 'Select all times you want to wear fragrance',
        allowMultiple: true,
        minSelections: 1,
        maxSelections: 5,
        options: [
          { value: 'everyday', text: 'Every day', emoji: '☀️' },
          { value: 'work', text: 'At work', emoji: '🏢' },
          { value: 'dates', text: 'Romantic dates', emoji: '💕' },
          { value: 'parties', text: 'Parties & social events', emoji: '🎉' },
          {
            value: 'special_occasions',
            text: 'Special occasions',
            emoji: '🌟',
          },
        ],
      },
      {
        id: 'scent_families_multiple',
        text: 'Which scent types appeal to you?',
        subtitle: 'Choose all that sound interesting',
        allowMultiple: true,
        minSelections: 1,
        maxSelections: 4,
        options: [
          { value: 'fresh', text: 'Fresh & clean', emoji: '🌿' },
          { value: 'floral', text: 'Floral & pretty', emoji: '🌺' },
          { value: 'fruity', text: 'Sweet & fruity', emoji: '🍓' },
          { value: 'warm', text: 'Warm & cozy', emoji: '🤗' },
          { value: 'spicy', text: 'Spicy & exotic', emoji: '🌶️' },
        ],
      },
      {
        id: 'intensity_preference',
        text: 'How noticeable should your fragrance be?',
        options: [
          { value: 'subtle', text: 'Subtle - just for me', emoji: '🤫' },
          {
            value: 'moderate',
            text: 'Moderate - noticed when close',
            emoji: '👥',
          },
          { value: 'strong', text: 'Strong - memorable presence', emoji: '💫' },
        ],
      },
    ],
    enthusiast: [
      {
        id: 'style_aspects',
        text: 'What aspects describe your style?',
        subtitle: 'Choose all that resonate with you',
        allowMultiple: true,
        minSelections: 2,
        maxSelections: 5,
        options: [
          { value: 'classic', text: 'Classic', emoji: '👑' },
          { value: 'modern', text: 'Modern', emoji: '🏙️' },
          { value: 'romantic', text: 'Romantic', emoji: '🌹' },
          { value: 'bold', text: 'Bold', emoji: '⚡' },
          { value: 'natural', text: 'Natural', emoji: '🌿' },
          { value: 'sophisticated', text: 'Sophisticated', emoji: '💎' },
          { value: 'playful', text: 'Playful', emoji: '🎭' },
        ],
      },
      {
        id: 'fragrance_families_multiple',
        text: 'Which fragrance families appeal to you?',
        subtitle: 'Select all families you enjoy or want to try',
        allowMultiple: true,
        minSelections: 2,
        maxSelections: 5,
        options: [
          { value: 'fresh', text: 'Fresh', emoji: '🍋' },
          { value: 'floral', text: 'Floral', emoji: '🌸' },
          { value: 'oriental', text: 'Oriental', emoji: '🌶️' },
          { value: 'woody', text: 'Woody', emoji: '🌲' },
          { value: 'gourmand', text: 'Gourmand', emoji: '🍰' },
          { value: 'citrus', text: 'Citrus', emoji: '🍊' },
        ],
      },
      {
        id: 'occasions_detailed_multiple',
        text: 'When do you want to make a fragrance impression?',
        subtitle: 'Choose all occasions that matter to you',
        allowMultiple: true,
        minSelections: 1,
        maxSelections: 5,
        options: [
          { value: 'professional', text: 'Professional settings', emoji: '💼' },
          { value: 'romantic', text: 'Romantic occasions', emoji: '💕' },
          { value: 'social', text: 'Social gatherings', emoji: '🎊' },
          { value: 'confidence', text: 'Personal confidence', emoji: '💪' },
          { value: 'seasonal', text: 'Seasonal moods', emoji: '🍂' },
        ],
      },
      {
        id: 'fragrance_characteristics',
        text: 'What fragrance characteristics do you love?',
        subtitle: 'Select all that appeal to you',
        allowMultiple: true,
        minSelections: 2,
        maxSelections: 4,
        options: [
          { value: 'long_lasting', text: 'Long-lasting', emoji: '⏰' },
          { value: 'evolving', text: 'Changes throughout day', emoji: '🌅' },
          { value: 'unique', text: 'Unique & distinctive', emoji: '💎' },
          { value: 'comforting', text: 'Comforting & familiar', emoji: '🤗' },
          { value: 'energizing', text: 'Energizing & uplifting', emoji: '⚡' },
        ],
      },
    ],
    collector: [
      {
        id: 'olfactory_aesthetic',
        text: 'How would you characterize your olfactory aesthetic?',
        subtitle: 'Select all that define your sophisticated taste',
        allowMultiple: true,
        minSelections: 2,
        maxSelections: 4,
        options: [
          { value: 'classical', text: 'Classical heritage', emoji: '🏛️' },
          { value: 'avant_garde', text: 'Avant-garde modern', emoji: '🎨' },
          { value: 'niche', text: 'Niche artisanal', emoji: '🎭' },
          { value: 'vintage', text: 'Vintage & rare', emoji: '💎' },
          { value: 'experimental', text: 'Experimental', emoji: '⚗️' },
          { value: 'cultural', text: 'Cultural influences', emoji: '🌍' },
        ],
      },
      {
        id: 'compositional_elements',
        text: 'Which compositional elements resonate with your taste?',
        subtitle: 'Choose all that appeal to your refined palate',
        allowMultiple: true,
        minSelections: 2,
        maxSelections: 5,
        options: [
          {
            value: 'natural_materials',
            text: 'Natural raw materials',
            emoji: '🌿',
          },
          {
            value: 'synthetic_innovation',
            text: 'Innovative synthetics',
            emoji: '⚛️',
          },
          {
            value: 'harmonic_balance',
            text: 'Harmonic structures',
            emoji: '⚖️',
          },
          { value: 'bold_accords', text: 'Bold accords', emoji: '🔥' },
          {
            value: 'subtle_complexity',
            text: 'Subtle complexity',
            emoji: '🕊️',
          },
        ],
      },
      {
        id: 'wearing_philosophy',
        text: 'How do you approach fragrance wearing and rotation?',
        subtitle: 'Select your wearing philosophies',
        allowMultiple: true,
        minSelections: 1,
        maxSelections: 4,
        options: [
          {
            value: 'signature_rotation',
            text: 'Curated signature rotation',
            emoji: '👑',
          },
          {
            value: 'seasonal_themes',
            text: 'Seasonal collection themes',
            emoji: '🌸',
          },
          {
            value: 'mood_expression',
            text: 'Mood and energy expression',
            emoji: '🎭',
          },
          {
            value: 'artistic_exploration',
            text: 'Artistic exploration',
            emoji: '🎨',
          },
          {
            value: 'occasion_specific',
            text: 'Occasion-specific choices',
            emoji: '🎪',
          },
        ],
      },
      {
        id: 'investment_approach',
        text: 'What is your approach to fragrance acquisition?',
        subtitle: 'Choose your collection strategies',
        allowMultiple: true,
        minSelections: 1,
        maxSelections: 3,
        options: [
          {
            value: 'masterpieces',
            text: 'Recognized masterpieces',
            emoji: '🏆',
          },
          { value: 'emerging_talents', text: 'Emerging talents', emoji: '🌟' },
          { value: 'limited_editions', text: 'Limited editions', emoji: '💎' },
          {
            value: 'value_quality',
            text: 'Quality at various prices',
            emoji: '⚖️',
          },
          {
            value: 'complete_lines',
            text: 'Complete lines & houses',
            emoji: '📚',
          },
        ],
      },
    ],
  };

  return baseQuestions[experienceLevel] || baseQuestions.beginner;
}

/**
 * Get UI mode based on experience level
 */
function getUIMode(experienceLevel: ExperienceLevel): string {
  switch (experienceLevel) {
    case 'beginner':
      return 'simplified';
    case 'enthusiast':
      return 'balanced';
    case 'collector':
      return 'advanced';
    default:
      return 'balanced';
  }
}

/**
 * Get personalization features available for experience level
 */
function getPersonalizationFeatures(experienceLevel: ExperienceLevel) {
  const baseFeatures = {
    ai_profile_generation: true,
    real_recommendations: true,
    sample_optimization: true,
  };

  switch (experienceLevel) {
    case 'beginner':
      return {
        ...baseFeatures,
        simplified_vocabulary: true,
        guided_discovery: true,
        choice_assistance: true,
      };
    case 'enthusiast':
      return {
        ...baseFeatures,
        favorite_fragrance_input: true,
        preference_learning: true,
        comparison_tools: true,
      };
    case 'collector':
      return {
        ...baseFeatures,
        collection_management: true,
        advanced_filtering: true,
        niche_recommendations: true,
        expert_insights: true,
        investment_guidance: true,
      };
    default:
      return baseFeatures;
  }
}
