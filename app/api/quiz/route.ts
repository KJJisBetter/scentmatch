import { NextRequest, NextResponse } from 'next/server';
import { UnifiedRecommendationEngine } from '@/lib/ai-sdk/unified-recommendation-engine';
import { createServerSupabase } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import { withRateLimit } from '@/lib/rate-limit';

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

  try {
    const body = await request.json();

    // Validate input
    if (!body.responses || !Array.isArray(body.responses) || body.responses.length === 0) {
      return NextResponse.json(
        { error: 'Quiz responses required' },
        { status: 400 }
      );
    }

    // Use session token or generate one
    const sessionToken = body.session_token || `quiz-${nanoid(10)}`;

    // Use modern UnifiedRecommendationEngine with hybrid strategy
    const supabase = await createServerSupabase();
    const engine = new UnifiedRecommendationEngine(supabase as any, 'hybrid');
    
    const result = await engine.generateRecommendations({
      strategy: 'hybrid',
      quizResponses: body.responses.map((r: any) => ({
        question_id: r.question_id,
        answer: r.answer_value || r.answer,
        timestamp: r.timestamp,
      })),
      sessionToken,
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