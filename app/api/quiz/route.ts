import { NextRequest, NextResponse } from 'next/server';
import { UnifiedRecommendationEngine } from '@/lib/ai-sdk/unified-recommendation-engine';
import { createServerSupabase } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import { withRateLimit } from '@/lib/rate-limit';
import {
  quizAnalyzeSchema,
  validateApiInput,
} from '@/lib/validation/api-schemas';

/**
 * POST /api/quiz (formerly /api/quiz/analyze)
 *
 * Unified quiz analysis endpoint using UnifiedRecommendationEngine
 * Essential route for heavy AI processing that can't be a Server Action
 */
export async function POST(request: NextRequest) {
  // Rate limiting check
  const rateLimitCheck = await withRateLimit(request, 'quiz_analyze');
  if (rateLimitCheck.blocked) {
    return rateLimitCheck.response;
  }

  let body: any;
  try {
    const rawBody = await request.json();

    // SECURITY: Comprehensive input validation with Zod
    const validation = validateApiInput(quizAnalyzeSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error,
          error_code: 'VALIDATION_FAILED',
        },
        { status: 400 }
      );
    }

    body = validation.data;

    // CRITICAL: Validate gender preference exists BEFORE processing (SCE-81 Deep Fix)
    const hasGenderResponse = body.responses.some(
      (r: any) =>
        r.question_id === 'gender_preference' &&
        r.answer_value &&
        ['men', 'women', 'unisex'].includes(r.answer_value)
    );

    if (!hasGenderResponse) {
      console.error(
        `❌ EARLY VALIDATION: No valid gender preference in request`
      );
      console.error(
        `📋 REQUEST RESPONSES: ${JSON.stringify(
          body.responses.map((r: any) => ({
            id: r.question_id,
            value: r.answer_value,
          })),
          null,
          2
        )}`
      );
      return NextResponse.json(
        {
          error:
            'Gender preference is required for personalized recommendations',
          error_code: 'MISSING_GENDER_PREFERENCE',
          user_message:
            'Please select your fragrance preference (For Men, For Women, or Unisex) to get personalized recommendations.',
          recovery_action: {
            type: 'restart_quiz',
            step: 'gender_selection',
            message: 'Start over and select your gender preference first',
          },
          analysis_complete: false,
          processing_time_ms: 0,
        },
        { status: 400 }
      );
    }

    // Use session token or generate one
    const sessionToken = body.session_token || `quiz-${nanoid(10)}`;

    // Use modern UnifiedRecommendationEngine with hybrid strategy
    const supabase = await createServerSupabase();

    // CRITICAL FIX: Store quiz responses in database BEFORE generating recommendations
    console.log(
      `💾 STORING QUIZ DATA: Session ${sessionToken} with ${body.responses.length} responses`
    );

    try {
      // Store session in database
      const sessionResult = await supabase
        .from('user_quiz_sessions')
        .upsert(
          {
            session_token: sessionToken,
            is_guest_session: !body.user_id,
            user_id: body.user_id || null,
            is_completed: true,
            created_at: new Date().toISOString(),
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(), // 24 hours
          },
          {
            onConflict: 'session_token',
          }
        )
        .select('id');

      console.log(
        `📝 SESSION STORAGE: ${sessionResult.error ? 'FAILED' : 'SUCCESS'} for token ${sessionToken}`
      );
      if (sessionResult.error) {
        console.error(`❌ SESSION ERROR:`, sessionResult.error);
      }

      // Store individual quiz responses with proper session UUID
      const sessionLookup = await supabase
        .from('user_quiz_sessions')
        .select('id')
        .eq('session_token', sessionToken)
        .single();

      console.log(
        `🔍 SESSION LOOKUP: ${sessionLookup.error ? 'FAILED' : 'SUCCESS'} - Found UUID: ${sessionLookup.data?.id}`
      );

      if (sessionLookup.data?.id) {
        // Map question IDs to question text for database storage
        const questionTextMap: Record<string, string> = {
          style: 'What fragrances do you enjoy most?',
          occasions: 'When do you most want to smell amazing?',
          preferences: 'Which scent style appeals to you most?',
          intensity: 'How noticeable do you want your fragrance to be?',
          budget: 'How do you like to discover new fragrances?',
          gender_preference: 'What type of fragrances interest you?',
          experience_level: "What's your experience with fragrances?",
          scent_preferences_enthusiast:
            'What kinds of scents do you gravitate toward?',
          personality_style: 'How would you describe your style?',
          occasions_enthusiast: 'What occasions are important to you?',
          seasons_vibe: 'What season/vibe speaks to you most?',
          scent_preferences_beginner: 'What kinds of scents appeal to you?',
          occasions_beginner: 'When would you wear fragrance?',
        };

        const responsesToStore = body.responses.map((r: any) => ({
          session_id: sessionLookup.data.id,
          question_id: r.question_id,
          question_text: questionTextMap[r.question_id] || r.question_id,
          question_type: 'multiple_choice', // Default type for quiz questions
          answer_value: r.answer_value || r.answer,
          response_time_ms: 5000, // Default
          created_at: new Date().toISOString(),
        }));

        console.log(
          `🎯 STORING RESPONSES: ${JSON.stringify(responsesToStore, null, 2)}`
        );

        // MANDATORY: Validate gender preference exists (SCE-81 Deep Fix)
        const genderResponse = responsesToStore.find(
          (r: any) => r.question_id === 'gender_preference'
        );
        if (genderResponse && genderResponse.answer_value) {
          console.log(`👫 GENDER DETECTED: ${genderResponse.answer_value}`);
        } else {
          console.error(
            `❌ MANDATORY GENDER MISSING: Quiz requests MUST include gender_preference`
          );
          return NextResponse.json(
            {
              error:
                'Gender preference is required for personalized recommendations',
              error_code: 'MISSING_GENDER_PREFERENCE',
              user_message:
                'Your quiz responses are missing a gender preference. Please restart and select For Men, For Women, or Unisex.',
              recovery_action: {
                type: 'restart_quiz',
                step: 'gender_selection',
                message: 'Go back to select your gender preference',
              },
              analysis_complete: false,
              quiz_session_token: sessionToken,
              processing_time_ms: 0,
            },
            { status: 400 }
          );
        }

        // Additional validation: Ensure gender value is valid
        const validGenders = ['men', 'women', 'unisex'];
        if (!validGenders.includes(genderResponse.answer_value)) {
          console.error(
            `❌ INVALID GENDER VALUE: ${genderResponse.answer_value} not in [${validGenders.join(', ')}]`
          );
          return NextResponse.json(
            {
              error: `Gender preference must be one of: ${validGenders.join(', ')}`,
              error_code: 'INVALID_GENDER_VALUE',
              user_message: `"${genderResponse.answer_value}" is not a valid option. Please choose For Men, For Women, or Unisex.`,
              recovery_action: {
                type: 'restart_quiz',
                step: 'gender_selection',
                message: 'Go back and select a valid gender preference',
              },
              analysis_complete: false,
              quiz_session_token: sessionToken,
              processing_time_ms: 0,
            },
            { status: 400 }
          );
        }

        const responseResult = await supabase
          .from('user_quiz_responses')
          .upsert(responsesToStore, {
            onConflict: 'session_id,question_id',
          });

        console.log(
          `📝 RESPONSES STORAGE: ${responseResult.error ? 'FAILED' : 'SUCCESS'}`
        );
        if (responseResult.error) {
          console.error(`❌ RESPONSES ERROR:`, responseResult.error);
        } else {
          console.log(
            `✅ STORED: ${responsesToStore.length} quiz responses for session UUID ${sessionLookup.data.id}`
          );
        }

        // IMPORTANT: Add small delay to ensure database transaction commits before RPC calls
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(
          `⏱️ WAIT COMPLETE: Database transaction should be committed`
        );
      } else {
        console.error(
          `❌ SESSION UUID NOT FOUND: Cannot store responses without session UUID`
        );
      }
    } catch (storageError) {
      console.error('❌ QUIZ STORAGE COMPLETELY FAILED:', storageError);
      console.warn('Continuing with in-memory processing only');
    }

    const engine = new UnifiedRecommendationEngine(supabase as any, 'hybrid');

    // Extract user experience level from responses for adaptive explanations
    const experienceResponse = body.responses.find(
      (r: any) => r.question_id === 'experience_level'
    );
    const isBeginnerUser =
      experienceResponse?.answer_value === 'beginner' ||
      experienceResponse?.answer_value === 'new';

    // Generate temporary user ID for experience detection if not provided
    const tempUserId = body.user_id || `temp-${sessionToken}`;

    const result = await engine.generateRecommendations({
      strategy: 'hybrid',
      quizResponses: body.responses.map((r: any) => ({
        question_id: r.question_id,
        answer: r.answer_value || r.answer,
        timestamp: r.timestamp,
      })),
      sessionToken,
      userId: tempUserId, // Enable experience detection
      adaptiveExplanations: true, // Enable beginner-friendly explanations
      limit: 10,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          analysis_complete: false,
          error: 'Unable to generate recommendations',
          recommendations: result.recommendations || [],
          quiz_session_token: sessionToken,
          processing_time_ms: result.processing_time_ms,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        analysis_complete: true,
        recommendations: result.recommendations,
        quiz_session_token: result.quiz_session_token,
        processing_time_ms: result.processing_time_ms,
        recommendation_method: result.recommendation_method,
        personality_analysis: result.personality_analysis,
        next_steps: {
          try_samples: result.recommendations.length > 0,
          create_account: true,
          explore_more: result.recommendations.length > 0,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=300',
        },
      }
    );
  } catch (error) {
    console.error('Quiz analysis error:', error);

    return NextResponse.json(
      {
        analysis_complete: false,
        error: 'Failed to analyze quiz responses',
        quiz_session_token: body.session_token || `quiz-${nanoid(10)}`,
        processing_time_ms: 0,
      },
      { status: 500 }
    );
  }
}
