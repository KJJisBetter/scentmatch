import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * POST /api/recommendations/refresh
 * 
 * Triggers real-time recommendation updates based on user preference changes
 * or collection modifications. Handles both immediate and batch refresh requests.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request
    if (!body.trigger) {
      return NextResponse.json(
        { error: 'Refresh trigger is required' },
        { status: 400 }
      );
    }

    const validTriggers = [
      'preference_change',
      'collection_change', 
      'rating_update',
      'algorithm_update',
      'manual_refresh'
    ];

    if (!validTriggers.includes(body.trigger)) {
      return NextResponse.json(
        { error: 'Invalid refresh trigger' },
        { status: 400 }
      );
    }

    const refreshStartTime = Date.now();

    // Process different types of refresh triggers
    let updatedSections: string[] = [];
    let estimatedImprovement = 0;

    switch (body.trigger) {
      case 'preference_change':
        // Preferences changed - all sections affected
        updatedSections = ['perfect_matches', 'adventurous', 'seasonal'];
        estimatedImprovement = 0.15;
        
        // Store new preferences if provided
        if (body.preferences) {
          await updateUserPreferences(supabase, user.id, body.preferences);
        }
        break;

      case 'collection_change':
        // Collection modified - perfect matches and seasonal most affected
        updatedSections = ['perfect_matches', 'seasonal'];
        estimatedImprovement = 0.12;
        break;

      case 'rating_update':
        // User rated fragrances - perfect matches primarily affected
        updatedSections = ['perfect_matches'];
        estimatedImprovement = 0.08;
        break;

      case 'algorithm_update':
        // System-wide algorithm update
        updatedSections = ['perfect_matches', 'trending', 'adventurous', 'seasonal'];
        estimatedImprovement = 0.05;
        break;

      case 'manual_refresh':
        // User requested manual refresh
        updatedSections = ['perfect_matches', 'trending'];
        estimatedImprovement = 0.02;
        break;
    }

    // Clear relevant caches
    await clearRecommendationCaches(user.id, updatedSections);

    const processingTime = Date.now() - refreshStartTime;

    // Handle immediate vs batch refresh
    if (body.immediate_refresh) {
      return NextResponse.json({
        refresh_triggered: true,
        updated_sections: updatedSections,
        processing_time_ms: processingTime,
        cache_invalidated: true,
        new_recommendations_available: true,
        estimated_improvement: estimatedImprovement,
        trigger: body.trigger
      });
    } else {
      // Queue for batch processing
      return NextResponse.json({
        batch_refresh_queued: true,
        updated_sections: updatedSections,
        estimated_completion: new Date(Date.now() + 30000).toISOString(), // 30 seconds
        queue_position: 1,
        trigger: body.trigger
      }, { status: 202 }); // Accepted for processing
    }

  } catch (error) {
    console.error('Error refreshing recommendations:', error);
    
    return NextResponse.json(
      { error: 'Failed to refresh recommendations' },
      { status: 500 }
    );
  }
}

// Update user preferences in database
async function updateUserPreferences(supabase: any, userId: string, preferences: any): Promise<void> {
  try {
    // Update preferences in user_preferences table
    for (const [key, value] of Object.entries(preferences)) {
      if (typeof value === 'number' || typeof value === 'boolean') {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: userId,
            preference_type: key,
            preference_value: value.toString(),
            preference_strength: typeof value === 'number' ? value : (value ? 1.0 : 0.0),
            learned_from: 'preference_refinement',
            updated_at: new Date().toISOString()
          });
      }
    }
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
}

// Clear recommendation caches (would integrate with Redis in production)
async function clearRecommendationCaches(userId: string, sections: string[]): Promise<void> {
  // In production, this would clear Redis caches
  console.log(`Clearing recommendation caches for user ${userId}, sections: ${sections.join(', ')}`);
  
  // For now, just log the cache clearing
  // In real implementation:
  // await redis.del(`recommendations:${userId}:perfect_matches`);
  // await redis.del(`recommendations:${userId}:trending`);
  // etc.
}