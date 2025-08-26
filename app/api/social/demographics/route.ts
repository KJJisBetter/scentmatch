import { NextRequest, NextResponse } from 'next/server';
import { socialContextService } from '@/lib/services/social-context';
import { z } from 'zod';

// Base validation schema for demographics
const baseDemographicsSchema = z.object({
  user_id: z.string().uuid().optional(),
  guest_session_id: z.string().min(1).optional(),
  age_group: z.enum(['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']),
  experience_level: z.enum(['beginner', 'intermediate', 'experienced', 'expert']),
  gender_preference: z.enum(['men', 'women', 'unisex', 'no_preference']).optional(),
  social_influence_level: z.number().min(1).max(10).default(5),
  uniqueness_preference: z.number().min(1).max(10).default(5),
  style_preferences: z.array(z.string()).optional(),
  occasion_preferences: z.array(z.string()).optional()
});

const demographicsSchema = baseDemographicsSchema.refine(
  (data) => data.user_id || data.guest_session_id,
  { message: "Either user_id or guest_session_id must be provided" }
);

/**
 * GET /api/social/demographics
 * Get user demographics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const guestSessionId = searchParams.get('guest_session_id');

    if (!userId && !guestSessionId) {
      return NextResponse.json({
        success: false,
        error: 'Either user_id or guest_session_id is required'
      }, { status: 400 });
    }

    const demographics = await socialContextService.getUserDemographics(userId || undefined, guestSessionId || undefined);

    return NextResponse.json({
      success: true,
      data: demographics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get demographics error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get demographics'
    }, { status: 500 });
  }
}

/**
 * POST /api/social/demographics
 * Create or update user demographics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = demographicsSchema.parse(body);

    const updatedDemographics = await socialContextService.updateUserDemographics(validatedData);

    return NextResponse.json({
      success: true,
      data: updatedDemographics,
      message: 'Demographics updated successfully'
    });

  } catch (error) {
    console.error('Update demographics error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid demographics data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update demographics'
    }, { status: 500 });
  }
}

/**
 * PUT /api/social/demographics
 * Update specific demographic fields
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For partial updates, make most fields optional
    const partialSchema = baseDemographicsSchema.partial().extend({
      user_id: z.string().uuid().optional(),
      guest_session_id: z.string().min(1).optional()
    }).refine(
      (data) => data.user_id || data.guest_session_id,
      { message: "Either user_id or guest_session_id must be provided" }
    );

    const validatedData = partialSchema.parse(body);

    // Get existing demographics first
    const existing = await socialContextService.getUserDemographics(
      validatedData.user_id, 
      validatedData.guest_session_id
    );

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Demographics not found. Use POST to create new demographics.'
      }, { status: 404 });
    }

    // Merge with existing data
    const updatedData = { ...existing, ...validatedData };
    const result = await socialContextService.updateUserDemographics(updatedData);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Demographics updated successfully'
    });

  } catch (error) {
    console.error('Partial update demographics error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid demographics data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update demographics'
    }, { status: 500 });
  }
}