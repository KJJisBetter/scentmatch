import { NextRequest, NextResponse } from 'next/server';
import {
  seamlessConversion,
  quickConversion,
} from '@/app/actions/seamless-conversion';
import { z } from 'zod';

// Request validation schema
const conversionRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional(),
  conversion_type: z.enum(['full', 'quick']),
  guest_session_data: z.object({
    experience_level: z
      .enum(['beginner', 'enthusiast', 'collector'])
      .optional(),
    gender_preference: z.enum(['women', 'men', 'unisex', 'all']).optional(),
    quiz_responses: z
      .array(
        z.object({
          question_id: z.string(),
          answer_value: z.string(),
          answer_metadata: z.record(z.string(), z.any()).optional(),
          timestamp: z.string(),
        })
      )
      .optional(),
    favorite_fragrances: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          brand: z.string(),
          popularity_score: z.number().optional(),
          accords: z.array(z.string()).optional(),
          rating: z.number().optional(),
        })
      )
      .optional(),
    ai_profile: z
      .object({
        profile_name: z.string(),
        style_descriptor: z.string(),
        description: z.object({
          paragraph_1: z.string(),
          paragraph_2: z.string(),
          paragraph_3: z.string(),
        }),
        uniqueness_score: z.number(),
        personality_insights: z.array(z.string()),
      })
      .optional(),
    preferences: z
      .object({
        accords: z.array(z.string()).optional(),
        occasions: z.array(z.string()).optional(),
        seasons: z.array(z.string()).optional(),
        intensity: z.enum(['light', 'moderate', 'strong']).optional(),
      })
      .optional(),
    interaction_history: z
      .array(
        z.object({
          action: z.string(),
          target: z.string(),
          timestamp: z.string(),
          metadata: z.record(z.string(), z.any()).optional(),
        })
      )
      .optional(),
    session_metadata: z
      .object({
        session_id: z.string(),
        started_at: z.string(),
        last_updated: z.string(),
        completion_percentage: z.number(),
        time_spent_seconds: z.number(),
      })
      .optional(),
  }),
});

/**
 * POST /api/auth/seamless-conversion
 *
 * Handles seamless guest-to-authenticated user conversion with full data preservation.
 * Supports both full account creation and quick email-only conversion.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const validationResult = conversionRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues[0]?.message,
        },
        { status: 400 }
      );
    }

    const { email, password, conversion_type, guest_session_data } =
      validationResult.data;

    // Track conversion attempt
    const conversionMetrics = {
      conversion_type,
      email_provided: !!email,
      password_provided: !!password,
      guest_data_quality: calculateGuestDataQuality(guest_session_data),
      session_completion:
        guest_session_data.session_metadata?.completion_percentage || 0,
      has_ai_profile: !!guest_session_data.ai_profile,
      favorite_count: guest_session_data.favorite_fragrances?.length || 0,
      quiz_response_count: guest_session_data.quiz_responses?.length || 0,
    };

    console.log('Seamless conversion attempt:', conversionMetrics);

    let result;

    if (conversion_type === 'quick') {
      // Quick conversion with email only
      result = await quickConversion(email, guest_session_data);
    } else {
      // Full conversion with email and password
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required for full account creation' },
          { status: 400 }
        );
      }
      result = await seamlessConversion(email, password, guest_session_data);
    }

    // Track conversion result
    if (result.success) {
      console.log('Seamless conversion successful:', {
        user_id: result.user_id,
        conversion_type: result.conversion_type,
        profile_preserved: result.profile_preserved,
      });
    } else {
      console.error('Seamless conversion failed:', result);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Seamless conversion API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during conversion' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/seamless-conversion/validate
 *
 * Validates guest session data quality for conversion readiness
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionDataParam = searchParams.get('session_data');

    if (!sessionDataParam) {
      return NextResponse.json(
        { error: 'Session data parameter required' },
        { status: 400 }
      );
    }

    const sessionData = JSON.parse(decodeURIComponent(sessionDataParam));
    const quality = calculateGuestDataQuality(sessionData);
    const readiness = calculateConversionReadiness(sessionData);

    const validation = {
      quality_score: quality,
      readiness_score: readiness,
      is_ready_for_conversion: readiness >= 0.6,
      recommendations: getConversionRecommendations(
        sessionData,
        quality,
        readiness
      ),
      estimated_value: calculateEstimatedValue(sessionData),
    };

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Session validation failed' },
      { status: 500 }
    );
  }
}

/**
 * Calculate Guest Data Quality Score
 */
function calculateGuestDataQuality(sessionData: any): number {
  let quality = 0;

  if (sessionData.experience_level) quality += 0.2;
  if (sessionData.gender_preference) quality += 0.1;
  if (sessionData.quiz_responses?.length >= 2) quality += 0.3;
  if (sessionData.favorite_fragrances?.length > 0) quality += 0.2;
  if (sessionData.ai_profile) quality += 0.2;

  return Math.round(quality * 100) / 100;
}

/**
 * Calculate Conversion Readiness Score
 */
function calculateConversionReadiness(sessionData: any): number {
  let readiness = 0;

  // Core requirements
  if (sessionData.experience_level) readiness += 0.3;
  if (sessionData.quiz_responses?.length >= 2) readiness += 0.3;

  // Enhancement factors
  if (sessionData.ai_profile) readiness += 0.2;
  if (sessionData.favorite_fragrances?.length > 0) readiness += 0.15;
  if (sessionData.quiz_responses?.length >= 4) readiness += 0.05;

  return Math.round(readiness * 100) / 100;
}

/**
 * Get Conversion Recommendations
 */
function getConversionRecommendations(
  sessionData: any,
  quality: number,
  readiness: number
): string[] {
  const recommendations = [];

  if (quality < 0.6) {
    recommendations.push(
      'Complete more quiz questions to increase profile quality'
    );
  }

  if (!sessionData.ai_profile) {
    recommendations.push(
      'Generate AI profile for stronger conversion incentive'
    );
  }

  if (
    !sessionData.favorite_fragrances?.length &&
    sessionData.experience_level !== 'beginner'
  ) {
    recommendations.push('Add favorite fragrances to improve recommendations');
  }

  if (readiness >= 0.8) {
    recommendations.push(
      'High conversion readiness - present conversion flow immediately'
    );
  } else if (readiness >= 0.6) {
    recommendations.push(
      'Good conversion readiness - use standard conversion messaging'
    );
  } else {
    recommendations.push('Build more value before presenting conversion');
  }

  return recommendations;
}

/**
 * Calculate Estimated Value for Loss Aversion Messaging
 */
function calculateEstimatedValue(sessionData: any): number {
  let baseValue = 25;

  if (sessionData.experience_level === 'collector') baseValue += 15;
  else if (sessionData.experience_level === 'enthusiast') baseValue += 10;

  if (sessionData.favorite_fragrances?.length > 0) {
    baseValue += sessionData.favorite_fragrances.length * 3;
  }

  if (sessionData.ai_profile?.uniqueness_score > 0.8) baseValue += 12;
  else if (sessionData.ai_profile?.uniqueness_score > 0.6) baseValue += 8;

  if (sessionData.quiz_responses?.length >= 4) baseValue += 8;

  return Math.min(baseValue, 65);
}
