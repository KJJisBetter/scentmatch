import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { MVPPersonalityEngine } from '@/lib/quiz/mvp-personality-engine';

/**
 * POST /api/quiz/analyze
 * 
 * MVP endpoint for quiz analysis and immediate recommendations
 * Simplified flow: quiz responses → personality type → fragrance recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const body = await request.json();

    // Validate input
    if (!body.session_token || !body.responses || body.responses.length < 3) {
      return NextResponse.json(
        { error: 'Session token and at least 3 responses required' },
        { status: 400 }
      );
    }

    // Get session
    const { data: session } = await supabase
      .from('user_quiz_sessions')
      .select('*')
      .eq('session_token', body.session_token)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // Analyze with MVP engine
    const engine = new MVPPersonalityEngine();
    const analysis = await engine.analyzeQuizResponses(body.responses);

    if (!analysis.sufficient_data) {
      return NextResponse.json({
        analysis_complete: false,
        personality_type: analysis.personality_type,
        confidence: analysis.confidence,
        needs_more_questions: true,
        message: 'Complete a few more questions for better recommendations'
      });
    }

    // Get fragrance recommendations
    const recommendations = await engine.getFragranceRecommendations(analysis.personality_type);

    // Store personality profile
    if (analysis.confidence > 0.7) {
      await supabase
        .from('user_fragrance_personalities')
        .upsert({
          session_id: session.id,
          user_id: session.user_id,
          personality_type: analysis.personality_type,
          style_descriptor: getStyleDescription(analysis.personality_type),
          confidence_score: analysis.confidence,
          quiz_version: 'v1.0',
          analysis_method: 'mvp_rule_based'
        });

      // Mark session as completed
      await supabase
        .from('user_quiz_sessions')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', session.id);
    }

    return NextResponse.json({
      analysis_complete: true,
      personality_profile: {
        type: analysis.personality_type,
        confidence: analysis.confidence,
        style_description: getStyleDescription(analysis.personality_type)
      },
      recommendations: recommendations.slice(0, 5), // Top 5 for MVP
      next_steps: {
        create_account: session.is_guest_session,
        try_samples: recommendations.length > 0,
        explore_more: false // Keep MVP simple
      },
      processing_time_ms: analysis.processing_time_ms
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300' // 5 minute cache
      }
    });

  } catch (error) {
    console.error('Error in quiz analysis:', error);
    
    return NextResponse.json(
      { error: 'Analysis temporarily unavailable' },
      { status: 500 }
    );
  }

  // Helper function for style descriptions
  function getStyleDescription(personalityType: string): string {
    const descriptions = {
      sophisticated: 'You love complex, elegant fragrances perfect for evening and professional settings',
      romantic: 'You prefer beautiful, feminine scents with floral and fruity notes',
      natural: 'You enjoy fresh, clean fragrances that capture the essence of nature',
      classic: 'You appreciate timeless, balanced fragrances that work for any occasion'
    };

    return descriptions[personalityType as keyof typeof descriptions] || descriptions.classic;
  }
}