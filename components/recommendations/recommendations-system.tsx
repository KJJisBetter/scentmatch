'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  Settings,
  TrendingUp,
  Compass,
  Snowflake,
  RefreshCw,
} from 'lucide-react';
import { createClientSupabase } from '@/lib/supabase';
import { PreferenceRefinement } from './preference-refinement';
import { ThemedSections } from './themed-sections';
import { RecommendationFeedback } from './recommendation-feedback';
import { InteractionTracker } from '../fragrance/interaction-tracker';
import { processFeedback } from '@/lib/actions';

interface RecommendationsSystemProps {
  userId: string;
  userProfile?: any;
  collectionStats?: any;
  recentInteractions?: any[];
  initialRecommendations?: any[];
}

interface RecommendationSections {
  perfect_matches: any[];
  trending: any[];
  adventurous: any[];
  seasonal: any[];
}

interface UserPreferences {
  adventure_level: number;
  price_sensitivity: number;
  brand_openness: number;
  seasonal_adherence: number;
  confidence_level: number;
}

/**
 * RecommendationsSystem Component
 *
 * Main orchestration component for AI-powered fragrance recommendations
 * Implements research-backed patterns:
 * - Progressive disclosure to prevent cognitive overload
 * - Explainable AI with transparent reasoning
 * - Real-time personalization based on user feedback
 * - Sample-first conversion psychology
 * - Mobile-first interaction patterns
 */
export function RecommendationsSystem({
  userId,
  userProfile,
  collectionStats,
  recentInteractions = [],
  initialRecommendations = [],
}: RecommendationsSystemProps) {
  const router = useRouter();

  // Core state management
  const [recommendations, setRecommendations] =
    useState<RecommendationSections>({
      perfect_matches: [],
      trending: [],
      adventurous: [],
      seasonal: [],
    });

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    adventure_level: 0.4,
    price_sensitivity: 0.6,
    brand_openness: 0.8,
    seasonal_adherence: 0.7,
    confidence_level: collectionStats?.diversity_score || 0.5,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showPreferenceControls, setShowPreferenceControls] = useState(
    (collectionStats?.total_fragrances || 0) > 5 // Show controls for experienced users
  );
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>(
    {}
  );
  const [trackInteraction, setTrackInteraction] = useState<{
    type: string;
    context: string;
    metadata?: any;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load AI-powered personalized recommendations
  const loadPersonalizedRecommendationsInternal = useCallback(async () => {
    const supabase = createClientSupabase();

    try {
      // Get personalized recommendations
      const { data: personalizedRecs } = await (supabase as any).rpc(
        'get_personalized_recommendations',
        {
          target_user_id: userId,
          max_results: 8,
          include_owned: false,
        }
      );

      // Get trending recommendations (with personalization)
      const { data: trendingRecs } = await (supabase as any)
        .from('fragrances')
        .select(
          `
          id,
          name,
          brand_id,
          scent_family,
          image_url,
          sample_available,
          sample_price_usd,
          popularity_score,
          fragrance_brands:brand_id (name)
        `
        )
        .order('popularity_score', { ascending: false })
        .limit(6);

      // Get seasonal recommendations
      const currentSeason = getCurrentSeason();
      const { data: seasonalRecs } = await (supabase as any)
        .from('fragrances')
        .select(
          `
          id,
          name,
          brand_id,
          scent_family,
          image_url,
          recommended_seasons,
          sample_available,
          sample_price_usd,
          fragrance_brands:brand_id (name)
        `
        )
        .contains('recommended_seasons', [currentSeason])
        .limit(6);

      // Organize into sections
      setRecommendations({
        perfect_matches: enhanceRecommendations(
          personalizedRecs || [],
          'perfect_matches'
        ),
        trending: enhanceRecommendations(trendingRecs || [], 'trending'),
        adventurous: generateAdventurousRecs(personalizedRecs || []),
        seasonal: enhanceRecommendations(seasonalRecs || [], 'seasonal'),
      });
    } catch (error) {
      console.error('Error loading personalized recommendations:', error);
      throw error;
    }
  }, []);

  // Load fallback recommendations when AI fails
  const loadFallbackRecommendations = async () => {
    const supabase = createClientSupabase();

    const { data: fallbackRecs } = await (supabase as any)
      .from('fragrances')
      .select(
        `
        id,
        name,
        brand_id,
        scent_family,
        image_url,
        sample_available,
        sample_price_usd,
        fragrance_brands:brand_id (name)
      `
      )
      .eq('sample_available', true)
      .limit(12);

    if (fallbackRecs) {
      setRecommendations({
        perfect_matches: fallbackRecs
          .slice(0, 4)
          .map((f: any) => ({
            ...f,
            match_percentage: 75,
            source: 'fallback',
          })),
        trending: fallbackRecs
          .slice(4, 8)
          .map((f: any) => ({
            ...f,
            match_percentage: 70,
            source: 'fallback',
          })),
        adventurous: fallbackRecs
          .slice(8, 10)
          .map((f: any) => ({
            ...f,
            match_percentage: 65,
            source: 'fallback',
          })),
        seasonal: fallbackRecs
          .slice(10, 12)
          .map((f: any) => ({
            ...f,
            match_percentage: 68,
            source: 'fallback',
          })),
      });
    }
  };

  // Load recommendations based on user data
  const loadRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = createClientSupabase();

      // Determine if this is a cold start user
      const isColdStart = (collectionStats?.total_fragrances || 0) < 3;

      if (isColdStart) {
        // Cold start recommendations - diverse popular items
        const { data: coldStartRecs } = await (supabase as any)
          .from('fragrances')
          .select(
            `
            id,
            name,
            brand_id,
            description,
            scent_family,
            image_url,
            sample_available,
            sample_price_usd,
            popularity_score,
            fragrance_brands:brand_id (name)
          `
          )
          .eq('sample_available', true)
          .order('popularity_score', { ascending: false })
          .limit(16);

        if (coldStartRecs) {
          // Organize into themed sections for cold start
          const organized = organizeColdStartRecommendations(coldStartRecs);
          setRecommendations(organized);
        }
      } else {
        // Experienced user - use AI recommendations
        await loadPersonalizedRecommendationsInternal();
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      // Fallback to popular items
      await loadFallbackRecommendations();
    } finally {
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  }, [userId, collectionStats, loadPersonalizedRecommendationsInternal]);

  // Handle user feedback on recommendations
  const handleFeedback = async (
    item: any,
    feedbackType: string,
    context: string
  ) => {
    // Optimistic update
    setFeedbackState(prev => ({ ...prev, [item.fragrance_id]: feedbackType }));

    // Track interaction
    setTrackInteraction({
      type:
        feedbackType === 'like'
          ? 'like'
          : feedbackType === 'dislike'
            ? 'dislike'
            : 'sample_request',
      context: `recommendations_${context}`,
      metadata: {
        fragrance_id: item.fragrance_id,
        match_percentage: item.match_percentage,
        section: context,
        feedback_type: feedbackType,
      },
    });

    startTransition(async () => {
      try {
        // Submit feedback using Server Action
        const result = await processFeedback({
          fragrance_id: item.fragrance_id,
          feedback_type: feedbackType as any,
          confidence: 0.8, // Default confidence for UI feedback
          context: {
            section: context,
            position: 0, // Would calculate actual position
            algorithm_version: 'hybrid_v2.1',
          },
        });

        if (result.success) {
          if (result.recommendation_refresh?.refresh_recommended) {
            // Refresh recommendations if preferences significantly changed
            await loadRecommendations();
          }

          // Update user confidence if provided
          if (
            result.preference_update &&
            result.preference_update.confidence_change
          ) {
            setUserPreferences(prev => ({
              ...prev,
              confidence_level: Math.min(
                prev.confidence_level +
                  (result.preference_update?.confidence_change || 0),
                1.0
              ),
            }));
          }
        } else {
          console.error('Feedback processing failed:', result.error);
          // Revert optimistic update on failure
          setFeedbackState(prev => {
            const newState = { ...prev };
            delete newState[item.fragrance_id];
            return newState;
          });
        }
      } catch (error) {
        console.error('Error processing feedback:', error);
        // Revert optimistic update
        setFeedbackState(prev => {
          const newState = { ...prev };
          delete newState[item.fragrance_id];
          return newState;
        });
      }
    });
  };

  // Handle item clicks (navigation or sample ordering)
  const handleItemClick = async (item: any, context: string) => {
    if (context === 'sample_order') {
      // Handle sample ordering
      await handleFeedback(item, 'sample_request', 'sample_conversion');

      // Navigate to sample ordering flow or add to cart
      // This would integrate with e-commerce system
      console.log('Sample order for:', item.fragrance_id);
    } else {
      // Navigate to fragrance detail page
      setTrackInteraction({
        type: 'view',
        context: 'recommendation_click',
        metadata: {
          fragrance_id: item.fragrance_id,
          source_section: context,
          match_percentage: item.match_percentage,
        },
      });

      router.push(`/fragrance/${item.fragrance_id}`);
    }
  };

  // Handle preference changes with debouncing
  const handlePreferenceChange = useCallback(
    async (newPreferences: Partial<UserPreferences>) => {
      setUserPreferences(prev => ({ ...prev, ...newPreferences }));

      // Debounce recommendation refresh
      const timeoutId = setTimeout(async () => {
        try {
          setIsLoading(true);

          // Update preferences in backend
          const response = await fetch('/api/recommendations/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trigger: 'preference_change',
              preferences: { ...userPreferences, ...newPreferences },
              immediate_refresh: true,
            }),
          });

          if (response.ok) {
            // Reload recommendations with new preferences
            await loadRecommendations();
          }
        } catch (error) {
          console.error('Error updating preferences:', error);
        } finally {
          setIsLoading(false);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    },
    [userPreferences, loadRecommendations]
  );

  // Load initial recommendations
  useEffect(() => {
    if (initialRecommendations.length > 0) {
      // Use server-provided initial recommendations
      const organized = organizeInitialRecommendations(initialRecommendations);
      setRecommendations(organized);
    } else {
      // Load fresh recommendations
      loadRecommendations();
    }
  }, [loadRecommendations, initialRecommendations]);

  // Real-time updates subscription
  useEffect(() => {
    const supabase = createClientSupabase();

    // Subscribe to user collection changes for recommendation updates
    const subscription = supabase
      .channel('recommendation-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_collections',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          console.log(
            'Collection change detected, refreshing recommendations:',
            payload
          );
          loadRecommendations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, loadRecommendations]);

  return (
    <>
      {trackInteraction && (
        <InteractionTracker
          fragranceId={trackInteraction.metadata?.fragrance_id || ''}
          interactionType={trackInteraction.type as any}
          interactionContext={trackInteraction.context}
          metadata={trackInteraction.metadata}
        />
      )}

      <div className='space-y-12'>
        {/* Preference Refinement Controls */}
        {showPreferenceControls && (
          <Card className='bg-gradient-to-r from-purple-50 to-blue-50'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center space-x-2'>
                  <Settings className='h-5 w-5 text-purple-500' />
                  <span>Refine Your Recommendations</span>
                </CardTitle>

                <div className='flex items-center space-x-3'>
                  <Badge variant='accent' className='text-xs'>
                    {Math.round(userPreferences.confidence_level * 100)}%
                    confident
                  </Badge>

                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      setShowPreferenceControls(!showPreferenceControls)
                    }
                  >
                    {showPreferenceControls ? 'Hide' : 'Show'} Controls
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <PreferenceRefinement
                userId={userId}
                currentPreferences={userPreferences}
                onPreferenceChange={handlePreferenceChange}
                showExplanations={true}
                allowAdvancedControls={userPreferences.confidence_level > 0.7}
              />
            </CardContent>
          </Card>
        )}

        {/* Loading State Overlay */}
        {(isLoading || isPending) && (
          <div className='relative'>
            <div className='absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center'>
              <div className='bg-card p-6 rounded-xl shadow-lg border flex items-center space-x-3'>
                <RefreshCw className='h-5 w-5 animate-spin text-primary' />
                <span className='font-medium'>
                  Personalizing your recommendations...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Perfect Matches Section (Primary) */}
        <section>
          <div className='flex items-center space-x-3 mb-6'>
            <Sparkles className='h-6 w-6 text-amber-500' />
            <h2 className='text-2xl font-serif font-bold text-foreground'>
              Perfect Matches
            </h2>
            <Badge variant='premium' className='text-xs'>
              AI Curated
            </Badge>
          </div>

          {recommendations.perfect_matches.length > 0 ? (
            <ThemedSections
              sectionData={recommendations.perfect_matches}
              sectionType='perfect_matches'
              onItemClick={item => handleItemClick(item, 'perfect_matches')}
              onFeedback={(item, feedback) =>
                handleFeedback(item, feedback, 'perfect_matches')
              }
              feedbackState={feedbackState}
              showExplanations={true}
              layout='featured' // Larger cards for perfect matches
            />
          ) : (
            <div className='text-center py-12 text-muted-foreground'>
              <Sparkles className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p>Building your perfect matches...</p>
              <p className='text-sm mt-2'>
                Rate a few fragrances to unlock personalized recommendations
              </p>
            </div>
          )}
        </section>

        {/* Trending Section */}
        <section>
          <div className='flex items-center space-x-3 mb-6'>
            <TrendingUp className='h-6 w-6 text-green-500' />
            <h2 className='text-2xl font-serif font-bold text-foreground'>
              Trending in Your Style
            </h2>
            <Badge variant='accent' className='text-xs'>
              Community Picks
            </Badge>
          </div>

          <ThemedSections
            sectionData={recommendations.trending}
            sectionType='trending'
            onItemClick={item => handleItemClick(item, 'trending')}
            onFeedback={(item, feedback) =>
              handleFeedback(item, feedback, 'trending')
            }
            feedbackState={feedbackState}
            showExplanations={false} // Trending relies more on social proof
            layout='standard'
          />
        </section>

        {/* Adventurous Section */}
        <section>
          <div className='flex items-center space-x-3 mb-6'>
            <Compass className='h-6 w-6 text-purple-500' />
            <h2 className='text-2xl font-serif font-bold text-foreground'>
              Adventurous Picks
            </h2>
            <Badge variant='outline' className='text-xs'>
              Expand Your Style
            </Badge>
          </div>

          <ThemedSections
            sectionData={recommendations.adventurous}
            sectionType='adventurous'
            onItemClick={item => handleItemClick(item, 'adventurous')}
            onFeedback={(item, feedback) =>
              handleFeedback(item, feedback, 'adventurous')
            }
            feedbackState={feedbackState}
            showExplanations={true}
            layout='exploration' // Different styling for exploration
          />
        </section>

        {/* Seasonal Section */}
        <section>
          <div className='flex items-center space-x-3 mb-6'>
            <Snowflake className='h-6 w-6 text-blue-500' />
            <h2 className='text-2xl font-serif font-bold text-foreground'>
              Perfect for {getCurrentSeason()}
            </h2>
            <Badge variant='secondary' className='text-xs'>
              Seasonal Match
            </Badge>
          </div>

          <ThemedSections
            sectionData={recommendations.seasonal}
            sectionType='seasonal'
            onItemClick={item => handleItemClick(item, 'seasonal')}
            onFeedback={(item, feedback) =>
              handleFeedback(item, feedback, 'seasonal')
            }
            feedbackState={feedbackState}
            showExplanations={false}
            layout='standard'
          />
        </section>

        {/* System Status and Last Update */}
        <div className='text-center text-sm text-muted-foreground'>
          <div className='flex items-center justify-center space-x-2'>
            <div
              className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}
            />
            <span>
              {isLoading
                ? 'Learning your preferences...'
                : `Last updated: ${lastUpdate.toLocaleTimeString()}`}
            </span>
          </div>

          <div className='mt-2'>
            <button
              onClick={loadRecommendations}
              disabled={isLoading || isPending}
              className='text-primary hover:underline disabled:opacity-50'
            >
              Refresh Recommendations
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper functions
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

function organizeColdStartRecommendations(
  fragrances: any[]
): RecommendationSections {
  // Organize cold start recommendations by fragrance families
  const families = ['fresh', 'woody', 'floral', 'oriental'];

  return {
    perfect_matches: fragrances.slice(0, 4).map(f => ({
      ...f,
      fragrance_id: f.id,
      brand: f.fragrance_brands?.name || 'Unknown',
      match_percentage: 85,
      explanation: `Popular ${f.scent_family} fragrance perfect for beginners`,
      source: 'cold_start',
    })),
    trending: fragrances.slice(4, 8).map(f => ({
      ...f,
      fragrance_id: f.id,
      brand: f.fragrance_brands?.name || 'Unknown',
      match_percentage: 78,
      trend_score: 0.9,
      source: 'cold_start',
    })),
    adventurous: fragrances.slice(8, 10).map(f => ({
      ...f,
      fragrance_id: f.id,
      brand: f.fragrance_brands?.name || 'Unknown',
      match_percentage: 65,
      novelty_score: 0.8,
      source: 'cold_start',
    })),
    seasonal: fragrances.slice(10, 12).map(f => ({
      ...f,
      fragrance_id: f.id,
      brand: f.fragrance_brands?.name || 'Unknown',
      match_percentage: 72,
      season_relevance: 0.85,
      source: 'cold_start',
    })),
  };
}

function enhanceRecommendations(recs: any[], sectionType: string): any[] {
  return recs.map(rec => ({
    ...rec,
    fragrance_id: rec.fragrance_id || rec.id,
    brand: rec.brand || rec.fragrance_brands?.name || 'Unknown',
    match_percentage: rec.recommendation_score
      ? Math.round(rec.recommendation_score * 100)
      : Math.round(Math.random() * 30 + 70), // Fallback scoring
    section_type: sectionType,
    sample_available: rec.sample_available !== false,
    sample_price: rec.sample_price_usd || rec.sample_price || 15.99,
  }));
}

function generateAdventurousRecs(baseRecs: any[]): any[] {
  // For adventurous picks, we'd typically use lower similarity scores
  // to encourage exploration. This is a placeholder implementation.
  return baseRecs.slice(0, 3).map(rec => ({
    ...rec,
    fragrance_id: rec.fragrance_id || rec.id,
    match_percentage: Math.max(45, (rec.recommendation_score || 0.7) * 70), // Lower match for exploration
    novelty_score: 0.85 + Math.random() * 0.1,
    exploration_reason: 'Expand your fragrance horizons',
    source: 'adventurous',
  }));
}

function organizeInitialRecommendations(recs: any[]): RecommendationSections {
  // Organize server-provided recommendations into themed sections
  return {
    perfect_matches: recs.slice(0, 5),
    trending: recs.slice(5, 10),
    adventurous: recs.slice(10, 13),
    seasonal: recs.slice(13, 16),
  };
}
