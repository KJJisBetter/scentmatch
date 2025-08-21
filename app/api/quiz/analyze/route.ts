import { NextRequest, NextResponse } from 'next/server';
import { DirectDatabaseEngine } from '@/lib/ai-sdk/compatibility-layer';

/**
 * POST /api/quiz/analyze
 *
 * Database-integrated endpoint for quiz analysis using Supabase RPC functions
 * Uses analyze_quiz_personality() and get_quiz_recommendations() database functions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input - more flexible validation
    if (
      !body.responses ||
      !Array.isArray(body.responses) ||
      body.responses.length === 0
    ) {
      return NextResponse.json(
        { error: 'Quiz responses required' },
        { status: 400 }
      );
    }

    // Use session token or generate one
    const sessionToken =
      body.session_token ||
      `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Use direct database engine (working RPC functions)
    const engine = new DirectDatabaseEngine();
    const result = await engine.generateRecommendations(
      body.responses,
      sessionToken
    );

    if (!result.success) {
      return NextResponse.json(
        {
          analysis_complete: false,
          error: 'Unable to generate recommendations',
          recommendations: result.recommendations || [],
          quiz_session_token: sessionToken,
          processing_time_ms: result.total_processing_time_ms,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        analysis_complete: true,
        recommendations: result.recommendations,
        quiz_session_token: result.quiz_session_token,
        processing_time_ms: result.total_processing_time_ms,
        recommendation_method: result.recommendation_method,
        personality_analysis: result.personality_analysis,
        next_steps: {
          try_samples: result.recommendations.length > 0,
          create_account: true, // Database integration supports account creation
          explore_more: result.recommendations.length > 0,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=300', // 5 minute cache
        },
      }
    );
  } catch (error) {
    console.error('Error in quiz analysis:', error);

    return NextResponse.json(
      {
        error: 'Quiz analysis temporarily unavailable',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function for style descriptions
function getStyleDescription(personalityType: string): string {
  const descriptions = {
    sophisticated:
      'You love complex, elegant fragrances perfect for evening and professional settings',
    romantic:
      'You prefer beautiful, feminine scents with floral and fruity notes',
    natural:
      'You enjoy fresh, clean fragrances that capture the essence of nature',
    classic:
      'You appreciate timeless, balanced fragrances that work for any occasion',
  };

  return (
    descriptions[personalityType as keyof typeof descriptions] ||
    descriptions.classic
  );
}
