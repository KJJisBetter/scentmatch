'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressiveCollectionPreview } from '../collection/progressive-collection-preview';
import { ConversionFlow } from './conversion-flow';
import { saveQuizRecommendations, getQuizSessionCollectionStatus } from '@/lib/actions/quiz-collection';
import type { RecommendationItem as FragranceRecommendation } from '@/lib/ai-sdk/unified-recommendation-engine';

interface QuizToCollectionBridgeProps {
  quizResults: {
    quiz_session_token: string;
    recommendations: FragranceRecommendation[];
    processing_time_ms?: number;
    recommendation_method?: string;
    error?: string;
  };
  onAccountCreated?: (userData: any) => void;
  onConversionComplete?: (result: any) => void;
  forceCollectionFlow?: boolean; // For testing purposes
}

type FlowStep = 'collection_preview' | 'collection_saved' | 'account_creation' | 'completed';

interface CollectionSaveState {
  saved: boolean;
  collection_size: number;
  analytics_tracked: boolean;
  error?: string;
}

/**
 * Quiz-to-Collection Bridge Component - Task 1.3
 * 
 * Orchestrates the enhanced conversion flow that prioritizes collection building
 * over immediate account creation. This is the key component for implementing
 * the new strategic approach: collection-first, then optional account creation.
 * 
 * Flow Design:
 * 1. Quiz Complete → Collection Preview (NEW)
 * 2. Save Collection → Collection Success
 * 3. Optional Account Creation → Enhanced Benefits
 * 4. Collection Dashboard → Long-term engagement
 */
export function QuizToCollectionBridge({
  quizResults,
  onAccountCreated,
  onConversionComplete,
  forceCollectionFlow = true
}: QuizToCollectionBridgeProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FlowStep>('collection_preview');
  const [collectionState, setCollectionState] = useState<CollectionSaveState>({
    saved: false,
    collection_size: 0,
    analytics_tracked: false
  });
  const [isPending, startTransition] = useTransition();

  // Handle collection save from preview
  const handleSaveCollection = async (data: {
    quiz_session_token: string;
    fragrance_ids: string[];
    collection_name?: string;
  }) => {
    startTransition(async () => {
      try {
        // Track collection save intent
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'collection_save_attempt', {
            quiz_session_token: data.quiz_session_token,
            fragrance_count: data.fragrance_ids.length,
            source: 'collection_preview'
          });
        }

        const result = await saveQuizRecommendations(data);

        if (result.success && result.data) {
          setCollectionState({
            saved: true,
            collection_size: result.data.collection_size,
            analytics_tracked: result.data.analytics_tracked,
          });

          // Track successful collection save
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'collection_saved_successfully', {
              quiz_session_token: data.quiz_session_token,
              fragrance_count: result.data.collection_size,
              analytics_tracked: result.data.analytics_tracked
            });
          }

          setCurrentStep('collection_saved');

          // Auto-advance to account creation after brief celebration
          setTimeout(() => {
            if (onConversionComplete) {
              onConversionComplete({
                collection_saved: true,
                collection_size: result.data!.collection_size,
                step: 'ready_for_account_creation'
              });
            }
            setCurrentStep('account_creation');
          }, 2000);

        } else {
          setCollectionState(prev => ({
            ...prev,
            error: result.error || 'Failed to save collection'
          }));

          // Track collection save failure
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'collection_save_failed', {
              quiz_session_token: data.quiz_session_token,
              error: result.error
            });
          }
        }
      } catch (error) {
        console.error('Collection save error:', error);
        setCollectionState(prev => ({
          ...prev,
          error: 'Unexpected error saving collection'
        }));
      }
    });
  };

  // Handle skip collection (fallback to original flow)
  const handleSkipCollection = () => {
    // Track collection skip
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'collection_save_skipped', {
        quiz_session_token: quizResults.quiz_session_token,
        recommendation_count: quizResults.recommendations.length,
        source: 'collection_preview'
      });
    }

    setCurrentStep('account_creation');
  };

  // Handle account creation completion
  const handleAccountCreated = (userData: any) => {
    // Enhanced user data with collection context
    const enhancedUserData = {
      ...userData,
      collection_context: {
        has_saved_collection: collectionState.saved,
        collection_size: collectionState.collection_size,
        quiz_session_token: quizResults.quiz_session_token
      }
    };

    if (onAccountCreated) {
      onAccountCreated(enhancedUserData);
    }

    setCurrentStep('completed');
  };

  // Handle final conversion completion
  const handleConversionComplete = (result: any) => {
    // Enhanced conversion result with collection metrics
    const enhancedResult = {
      ...result,
      collection_metrics: {
        collection_saved: collectionState.saved,
        collection_size: collectionState.collection_size,
        analytics_tracked: collectionState.analytics_tracked,
        conversion_flow: 'collection_first'
      }
    };

    if (onConversionComplete) {
      onConversionComplete(enhancedResult);
    }

    // Navigate to guest-accessible collection dashboard if collection was saved
    if (collectionState.saved) {
      router.push(`/my-collection?source=quiz_completion&new_collection=true&quiz_session=${quizResults.quiz_session_token}`);
    } else {
      // Fallback to recommendations page
      router.push('/recommendations?quiz_completed=true');
    }
  };

  // Render current flow step
  switch (currentStep) {
    case 'collection_preview':
      return (
        <ProgressiveCollectionPreview
          recommendations={quizResults.recommendations.map(item => ({
            fragrance: {
              id: item.fragrance_id,
              name: item.name,
              brand: item.brand,
              description: item.explanation,
              scent_family: item.scent_family,
              image_url: item.image_url,
            },
            match_score: item.score,
            reasoning: item.explanation,
            sample_available: item.sample_available,
            sample_price_usd: item.sample_price_usd,
          }))}
          quiz_session_token={quizResults.quiz_session_token}
          onSaveCollection={handleSaveCollection}
          onSkip={handleSkipCollection}
          isLoading={isPending}
          socialProofData={{
            total_users: 47832,
            users_this_week: 1243,
            collections_created_today: 89
          }}
        />
      );

    case 'collection_saved':
      return (
        <CollectionSuccessState
          collectionSize={collectionState.collection_size}
          onContinue={() => setCurrentStep('account_creation')}
        />
      );

    case 'account_creation':
      return (
        <ConversionFlow
          quizResults={{
            ...quizResults,
            // Enhanced quiz results with collection context
            collection_context: {
              saved: collectionState.saved,
              size: collectionState.collection_size
            }
          }}
          onAccountCreated={handleAccountCreated}
          onConversionComplete={handleConversionComplete}
          collectionFirst={true} // Flag to modify messaging in ConversionFlow
        />
      );

    case 'completed':
      // This should not render as we navigate away
      return null;

    default:
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading conversion flow...</p>
        </div>
      );
  }
}

/**
 * Collection Success State Component
 * 
 * Shows immediate positive feedback when collection is saved successfully
 * before transitioning to account creation.
 */
function CollectionSuccessState({
  collectionSize,
  onContinue
}: {
  collectionSize: number;
  onContinue: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <div className="space-y-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-bold text-green-800">Collection Saved!</h2>
        <p className="text-lg text-muted-foreground">
          Your {collectionSize} perfect matches have been saved to your collection
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Never lose your matches</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Track what you try</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Get personalized updates</span>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Creating your account to unlock enhanced features...
      </div>
    </div>
  );
}