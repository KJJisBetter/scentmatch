import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/rate-limit';
import { QuizRequestValidator } from '@/lib/quiz/request-validator';
import { QuizAIProcessor } from '@/lib/quiz/ai-processor';
import { QuizSessionStorage } from '@/lib/quiz/session-storage';

/**
 * POST /api/quiz - Optimized quiz analysis endpoint
 * Refactored to comply with 200-line rule and performance standards
 */
export async function POST(request: NextRequest) {
  // Rate limiting check
  const rateLimitCheck = await withRateLimit(request, 'quiz_analyze');
  if (rateLimitCheck.blocked) {
    return rateLimitCheck.response;
  }

  try {
    const rawBody = await request.json();

    // Input validation
    const validation = QuizRequestValidator.validateQuizRequest(rawBody);
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

    const body = validation.data;

    // Validate gender preference
    const genderValidation = QuizRequestValidator.validateGenderPreference(
      body.responses
    );
    if (!genderValidation.valid) {
      return NextResponse.json(genderValidation.error, { status: 400 });
    }

    // Generate or use existing session token
    const sessionToken =
      body.session_token || QuizSessionStorage.generateSessionToken();

    // Initialize components
    const supabase = await createServerSupabase();
    const sessionStorage = new QuizSessionStorage(supabase as any);
    const aiProcessor = new QuizAIProcessor(supabase as any);

    console.log(
      `💾 PROCESSING QUIZ: Session ${sessionToken} with ${body.responses.length} responses`
    );

    // Store session and responses
    const sessionResult = await sessionStorage.storeQuizSession(
      sessionToken,
      body.user_id
    );
    if (!sessionResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to store quiz session',
          error_code: 'SESSION_STORAGE_FAILED',
        },
        { status: 500 }
      );
    }

    if (sessionResult.session_id) {
      const responseResult = await sessionStorage.storeQuizResponses(
        sessionResult.session_id,
        body.responses
      );

      if (!responseResult.success) {
        console.error('Response storage failed:', responseResult.error);
        // Continue processing even if response storage fails
      }
    }

    // Generate AI recommendations
    const aiResult = await aiProcessor.processQuizRecommendations({
      responses: body.responses,
      session_token: sessionToken,
      user_id: body.user_id,
      experience_level: body.experience_level,
      quiz_version: body.quiz_version,
    });

    if (!aiResult.success) {
      return NextResponse.json(
        {
          error: aiResult.error,
          error_code: 'AI_PROCESSING_FAILED',
          session_token: sessionToken,
          analysis_complete: false,
          processing_time_ms: aiResult.processing_time_ms,
        },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      session_token: sessionToken,
      recommendations: aiResult.recommendations,
      analysis_complete: true,
      processing_time_ms: aiResult.processing_time_ms,
      quiz_personality_type: 'determined', // Will be enhanced in separate processor
      user_guidance: {
        quiz_completion_step: 'recommendations_ready',
        next_suggested_action: 'save_collection',
        personalization_confidence: 0.85,
      },
    });
  } catch (error) {
    console.error('Unexpected quiz processing error:', error);

    return NextResponse.json(
      {
        error: 'Quiz processing failed',
        error_code: 'UNEXPECTED_ERROR',
        user_message: 'Something went wrong. Please try again.',
        analysis_complete: false,
        processing_time_ms: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/quiz - Quiz status check
 * Lightweight endpoint for checking quiz session status
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const sessionToken = url.searchParams.get('session_token');

  if (!sessionToken) {
    return NextResponse.json(
      { error: 'Session token required' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServerSupabase();

    const { data: session, error } = await supabase
      .from('user_quiz_sessions')
      .select('id, is_completed, created_at, expires_at')
      .eq('session_token', sessionToken)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      session_token: sessionToken,
      is_completed: session.is_completed,
      created_at: session.created_at,
      expires_at: session.expires_at,
    });
  } catch (error) {
    console.error('Quiz status check error:', error);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
