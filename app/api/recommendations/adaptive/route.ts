/**
 * Adaptive Recommendations API Route
 * 
 * Demonstrates integration of the new experience-adaptive AI explanation system
 * Addresses SCE-66 (verbose explanations) and SCE-67 (beginner education)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { 
  UnifiedRecommendationEngine, 
  type UnifiedRecommendationRequest 
} from '@/lib/ai-sdk/unified-recommendation-engine'

// Request validation schema
const AdaptiveRecommendationRequestSchema = z.object({
  strategy: z.enum(['database', 'ai', 'hybrid']).default('hybrid'),
  userId: z.string().uuid().optional(),
  sessionToken: z.string().optional(),
  quizResponses: z.array(z.object({
    question_id: z.string(),
    answer: z.string(),
    timestamp: z.string().optional(),
  })).optional(),
  userPreferences: z.object({
    scent_families: z.array(z.string()).optional(),
    intensity: z.number().min(1).max(10).optional(),
    occasions: z.array(z.string()).optional(),
    gender: z.string().optional(),
    price_range: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  }).optional(),
  limit: z.number().min(1).max(50).default(10),
  adaptiveExplanations: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json()
    const validatedRequest = AdaptiveRecommendationRequestSchema.parse(body)

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => {},
          remove: (name: string, options: any) => {},
        },
      }
    )

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || validatedRequest.userId

    // Create recommendation engine
    const engine = new UnifiedRecommendationEngine(supabase, validatedRequest.strategy)

    // Build recommendation request with adaptive explanations
    const recommendationRequest: UnifiedRecommendationRequest = {
      strategy: validatedRequest.strategy,
      userId: userId,
      quizResponses: validatedRequest.quizResponses,
      userPreferences: validatedRequest.userPreferences,
      limit: validatedRequest.limit,
      sessionToken: validatedRequest.sessionToken,
      adaptiveExplanations: validatedRequest.adaptiveExplanations,
    }

    // Generate recommendations with adaptive explanations
    const result = await engine.generateRecommendations(recommendationRequest)

    // Success response with adaptive explanation metadata
    return NextResponse.json({
      success: true,
      data: {
        recommendations: result.recommendations,
        personality_analysis: result.personality_analysis,
        processing_time_ms: result.processing_time_ms,
        recommendation_method: result.recommendation_method,
        confidence_score: result.confidence_score,
        metadata: {
          ...result.metadata,
          adaptive_explanations_enabled: validatedRequest.adaptiveExplanations,
          beginner_recommendations_count: result.recommendations.filter(
            r => r.adaptive_explanation?.user_experience_level === 'beginner'
          ).length,
        }
      },
      message: getSuccessMessage(result.recommendations)
    })

  } catch (error) {
    console.error('Adaptive recommendations API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate adaptive recommendations',
        message: 'Please try again later'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate success message based on recommendation results
 */
function getSuccessMessage(recommendations: any[]): string {
  const beginnerCount = recommendations.filter(
    r => r.adaptive_explanation?.user_experience_level === 'beginner'
  ).length

  if (beginnerCount > 0) {
    return `Generated ${recommendations.length} personalized recommendations with beginner-friendly explanations`
  }

  return `Generated ${recommendations.length} personalized recommendations with detailed explanations`
}

/**
 * GET endpoint for health check and configuration
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    service: 'Adaptive AI Recommendations',
    features: {
      experience_level_detection: true,
      beginner_education: true,
      progressive_disclosure: true,
      vocabulary_adaptation: true,
      confidence_building: true
    },
    addressing_issues: [
      'SCE-66: Verbose AI explanations reduced to 30-40 words for beginners',
      'SCE-67: Educational fragrance terminology system for beginners'
    ],
    usage: {
      endpoint: '/api/recommendations/adaptive',
      method: 'POST',
      authentication: 'Optional (better results with user context)',
      rate_limit: '60 requests per minute'
    }
  })
}