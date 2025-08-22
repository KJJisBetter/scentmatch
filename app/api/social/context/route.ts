import { NextRequest, NextResponse } from 'next/server';
import { socialContextService } from '@/lib/services/social-context';
import { z } from 'zod';

// Validation schema for social context request
const socialContextSchema = z.object({
  fragrance_id: z.string().min(1, 'Fragrance ID is required'),
  user_age_group: z.enum(['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']).optional(),
  user_experience_level: z.enum(['beginner', 'intermediate', 'experienced', 'expert']).optional(),
  include_badges: z.boolean().default(false),
  include_alternatives: z.boolean().default(false)
});

/**
 * GET /api/social/context
 * Get social context and validation badges for a fragrance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      fragrance_id: searchParams.get('fragrance_id'),
      user_age_group: searchParams.get('user_age_group'),
      user_experience_level: searchParams.get('user_experience_level'),
      include_badges: searchParams.get('include_badges') === 'true',
      include_alternatives: searchParams.get('include_alternatives') === 'true'
    };

    // Validate request parameters
    const validatedParams = socialContextSchema.parse(params);

    // Get social context
    const context = await socialContextService.getFragranceSocialContext(
      validatedParams.fragrance_id,
      validatedParams.user_age_group,
      validatedParams.user_experience_level
    );

    const response: any = { context };

    // Include social validation badges if requested
    if (validatedParams.include_badges) {
      const badges = await socialContextService.getSocialValidationBadges(
        validatedParams.fragrance_id,
        validatedParams.user_age_group,
        validatedParams.user_experience_level
      );
      response.badges = badges;
    }

    // Include unique alternatives if requested
    if (validatedParams.include_alternatives) {
      const alternatives = await socialContextService.getUniqueAlternatives(
        validatedParams.fragrance_id
      );
      response.alternatives = alternatives;
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Social context API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get social context'
    }, { status: 500 });
  }
}

/**
 * POST /api/social/context/track
 * Track user interaction for popularity trends
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const trackingSchema = z.object({
      fragrance_id: z.string().min(1),
      interaction_type: z.enum(['view', 'search', 'collection_add', 'sample_request'])
    });

    const { fragrance_id, interaction_type } = trackingSchema.parse(body);

    await socialContextService.trackInteraction(fragrance_id, interaction_type);

    return NextResponse.json({
      success: true,
      message: 'Interaction tracked successfully'
    });

  } catch (error) {
    console.error('Interaction tracking error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid tracking data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to track interaction'
    }, { status: 500 });
  }
}