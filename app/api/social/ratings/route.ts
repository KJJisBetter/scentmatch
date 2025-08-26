import { NextRequest, NextResponse } from 'next/server';
import { socialContextService } from '@/lib/services/social-context';
import { z } from 'zod';

// Validation schema for peer ratings
const peerRatingSchema = z.object({
  user_id: z.string().uuid().optional(),
  guest_session_id: z.string().min(1).optional(),
  fragrance_id: z.string().min(1, 'Fragrance ID is required'),
  overall_rating: z.number().min(0).max(5, 'Rating must be between 0 and 5'),
  would_recommend: z.boolean().default(false),
  experience_rating: z.enum(['love', 'like', 'neutral', 'dislike', 'hate']),
  usage_occasion: z.string().optional(),
  wear_duration_hours: z.number().int().min(0).max(48).optional(),
  experience_level_when_rated: z.enum(['beginner', 'intermediate', 'experienced', 'expert']),
  confidence_in_rating: z.number().int().min(1).max(10).default(5),
  quick_review: z.string().max(500).optional(),
  is_verified_purchase: z.boolean().default(false),
  is_sample_experience: z.boolean().default(true)
}).refine(
  (data) => data.user_id || data.guest_session_id,
  { message: "Either user_id or guest_session_id must be provided" }
);

// Query schema for getting ratings
const getRatingsSchema = z.object({
  fragrance_id: z.string().min(1).optional(),
  user_id: z.string().uuid().optional(),
  guest_session_id: z.string().min(1).optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'experienced', 'expert']).optional(),
  min_rating: z.coerce.number().min(0).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

/**
 * GET /api/social/ratings
 * Get peer approval ratings with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      fragrance_id: searchParams.get('fragrance_id'),
      user_id: searchParams.get('user_id'),
      guest_session_id: searchParams.get('guest_session_id'),
      experience_level: searchParams.get('experience_level'),
      min_rating: searchParams.get('min_rating'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    };

    const validatedParams = getRatingsSchema.parse(params);

    // Build query
    let query = socialContextService['supabase']
      .from('peer_approval_ratings')
      .select(`
        *,
        user_demographics (
          age_group,
          experience_level,
          gender_preference
        )
      `);

    // Apply filters
    if (validatedParams.fragrance_id) {
      query = query.eq('fragrance_id', parseInt(validatedParams.fragrance_id));
    }

    if (validatedParams.user_id) {
      query = query.eq('user_id', validatedParams.user_id);
    }

    if (validatedParams.guest_session_id) {
      query = query.eq('guest_session_id', validatedParams.guest_session_id);
    }

    if (validatedParams.experience_level) {
      query = query.eq('experience_level_when_rated', validatedParams.experience_level);
    }

    if (validatedParams.min_rating) {
      query = query.gte('overall_rating', validatedParams.min_rating);
    }

    // Order by created_at desc and apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(validatedParams.offset, validatedParams.offset + validatedParams.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get ratings: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        offset: validatedParams.offset,
        limit: validatedParams.limit,
        total: count || data?.length || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get ratings error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get ratings'
    }, { status: 500 });
  }
}

/**
 * POST /api/social/ratings
 * Submit a peer approval rating
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = peerRatingSchema.parse(body);

    // Submit the rating
    await socialContextService.submitPeerRating(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Submit rating error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid rating data',
        details: error.errors
      }, { status: 400 });
    }

    // Handle duplicate rating errors
    if (error instanceof Error && error.message.includes('duplicate key value')) {
      return NextResponse.json({
        success: false,
        error: 'You have already rated this fragrance. Use PUT to update your existing rating.'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit rating'
    }, { status: 500 });
  }
}

/**
 * PUT /api/social/ratings
 * Update an existing peer rating
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For updates, we need to identify the existing rating
    const updateSchema = z.object({
      rating_id: z.number().int().positive().optional(),
      user_id: z.string().uuid().optional(),
      guest_session_id: z.string().min(1).optional(),
      fragrance_id: z.string().min(1, 'Fragrance ID is required'),
      overall_rating: z.number().min(0).max(5, 'Rating must be between 0 and 5'),
      would_recommend: z.boolean().default(false),
      experience_rating: z.enum(['love', 'like', 'neutral', 'dislike', 'hate']),
      usage_occasion: z.string().optional(),
      wear_duration_hours: z.number().int().min(0).max(48).optional(),
      experience_level_when_rated: z.enum(['beginner', 'intermediate', 'experienced', 'expert']),
      confidence_in_rating: z.number().int().min(1).max(10).default(5),
      quick_review: z.string().max(500).optional(),
      is_verified_purchase: z.boolean().default(false),
      is_sample_experience: z.boolean().default(true)
    }).refine(
      (data) => data.user_id || data.guest_session_id,
      { message: "Either user_id or guest_session_id must be provided" }
    );

    const validatedData = updateSchema.parse(body);

    // Check if rating exists
    let query = socialContextService['supabase']
      .from('peer_approval_ratings')
      .select('id');

    if (validatedData.rating_id) {
      query = query.eq('id', validatedData.rating_id);
    } else if (validatedData.user_id) {
      query = query.eq('user_id', validatedData.user_id).eq('fragrance_id', validatedData.fragrance_id);
    } else if (validatedData.guest_session_id) {
      query = query.eq('guest_session_id', validatedData.guest_session_id).eq('fragrance_id', validatedData.fragrance_id);
    }

    const { data: existingRating, error: findError } = await query.single();

    if (findError || !existingRating) {
      return NextResponse.json({
        success: false,
        error: 'Rating not found. Use POST to create a new rating.'
      }, { status: 404 });
    }

    // Update the rating
    const { rating_id, ...updateData } = validatedData;
    
    const { error: updateError } = await socialContextService['supabase']
      .from('peer_approval_ratings')
      .update(updateData)
      .eq('id', existingRating.id);

    if (updateError) {
      throw new Error(`Failed to update rating: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Rating updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update rating error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid rating data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update rating'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/social/ratings
 * Delete a peer rating
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const deleteSchema = z.object({
      rating_id: z.coerce.number().int().positive().optional(),
      user_id: z.string().uuid().optional(),
      guest_session_id: z.string().min(1).optional(),
      fragrance_id: z.string().min(1).optional()
    }).refine(
      (data) => data.rating_id || (data.fragrance_id && (data.user_id || data.guest_session_id)),
      { message: "Either rating_id or (fragrance_id + user_id/guest_session_id) must be provided" }
    );

    const params = {
      rating_id: searchParams.get('rating_id'),
      user_id: searchParams.get('user_id'),
      guest_session_id: searchParams.get('guest_session_id'),
      fragrance_id: searchParams.get('fragrance_id')
    };

    const validatedParams = deleteSchema.parse(params);

    // Build delete query
    let query = socialContextService['supabase']
      .from('peer_approval_ratings')
      .delete();

    if (validatedParams.rating_id) {
      query = query.eq('id', validatedParams.rating_id);
    } else {
      query = query.eq('fragrance_id', validatedParams.fragrance_id!);
      
      if (validatedParams.user_id) {
        query = query.eq('user_id', validatedParams.user_id);
      } else if (validatedParams.guest_session_id) {
        query = query.eq('guest_session_id', validatedParams.guest_session_id);
      }
    }

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to delete rating: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Rating deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete rating error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid delete parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete rating'
    }, { status: 500 });
  }
}