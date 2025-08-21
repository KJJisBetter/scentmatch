'use client';

import { useEffect } from 'react';
import { createClientSupabase } from '@/lib/supabase-client';

interface InteractionTrackerProps {
  fragranceId: string;
  interactionType:
    | 'view'
    | 'like'
    | 'dislike'
    | 'sample_request'
    | 'add_to_collection'
    | 'remove_from_collection';
  interactionContext: string;
  metadata?: Record<string, any>;
}

/**
 * InteractionTracker Component
 *
 * Client-side component that tracks user interactions with fragrances
 * Follows research-backed patterns for minimal hydration and optimal performance
 */
export function InteractionTracker({
  fragranceId,
  interactionType,
  interactionContext,
  metadata,
}: InteractionTrackerProps) {
  useEffect(() => {
    const trackInteraction = async () => {
      try {
        const supabase = createClientSupabase();

        // Check if user is authenticated
        const {
          data: { user },
        } = await (supabase as any).auth.getUser();

        if (!user) {
          // Don't track interactions for unauthenticated users
          return;
        }

        // Track the interaction
        const { error } = await (supabase as any)
          .from('user_fragrance_interactions')
          .insert({
            user_id: user.id,
            fragrance_id: fragranceId,
            interaction_type: interactionType,
            interaction_context: interactionContext,
            interaction_metadata: metadata || null,
          });

        if (error) {
          console.error('Failed to track interaction:', error);
          // Fail silently to not disrupt user experience
        }
      } catch (error) {
        console.error('Error tracking interaction:', error);
        // Fail silently to not disrupt user experience
      }
    };

    // Track immediately for view interactions, delay for others to avoid spam
    if (interactionType === 'view') {
      trackInteraction();
      return; // No cleanup needed for immediate execution
    } else {
      const timeoutId = setTimeout(trackInteraction, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [fragranceId, interactionType, interactionContext, metadata]);

  // This component renders nothing - it's purely for side effects
  return null;
}
