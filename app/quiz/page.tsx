'use client';

import React, { useState, Suspense } from 'react';
import { ProgressiveQuizFlow } from '@/components/quiz/progressive-quiz-flow';
import { ProgressiveConversionFlow } from '@/components/quiz/progressive-conversion-flow';
import { QuizSkeleton } from '@/components/ui/skeletons/quiz-skeleton';
import { ProgressiveQuizErrorBoundary } from '@/components/quiz/progressive-quiz-error-boundary';
import { storeGuestQuizResults, trackConversionFunnelStep } from '@/lib/actions/quiz-conversion';

/**
 * Fragrance Personality Quiz Page
 *
 * Enhanced quiz with adaptive complexity and improved UX:
 * - Gender preference selection
 * - Experience level selection (beginner/enthusiast/collector)
 * - Adaptive quiz questions based on experience
 * - Direct 3-recommendation results with AI insights
 */

export default function QuizPage() {
  const [showProgressiveFlow, setShowProgressiveFlow] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [storedGender, setStoredGender] = useState<string | null>(null);
  const [sessionStartTime] = useState(Date.now());

  // Check for stored gender preference from redirect
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('quiz-gender-preference');
      if (stored) {
        setStoredGender(stored);
        // Clear the stored preference
        localStorage.removeItem('quiz-gender-preference');
      }
    }
  }, []);

  const handleConversionReady = async (results: any) => {
    try {
      // Store guest quiz results for 24-hour persistence
      const storageResult = await storeGuestQuizResults({
        quiz_session_token: results.quiz_session_token,
        responses: results.responses || [],
        recommendations: results.recommendations,
        gender_preference: results.gender_preference,
        experience_level: results.experience_level,
        processing_time_ms: results.processing_time_ms,
        recommendation_method: results.recommendation_method
      });

      // Track funnel step
      await trackConversionFunnelStep({
        session_token: results.quiz_session_token,
        funnel_step: 'quiz_completed',
        time_spent_seconds: Math.floor((Date.now() - sessionStartTime) / 1000),
        metadata: {
          recommendations_count: results.recommendations.length,
          storage_successful: storageResult.storage_successful
        }
      });

      // Set up progressive flow instead of immediate conversion
      setQuizResults({
        ...results,
        storage_result: storageResult
      });
      setShowProgressiveFlow(true);

    } catch (error) {
      console.error('Error in quiz completion flow:', error);
      // Fallback to basic results display
      setQuizResults(results);
      setShowProgressiveFlow(true);
    }
  };

  const handleAccountCreated = async (userData: any) => {
    console.log('Progressive conversion successful:', userData);
    
    // Track successful conversion
    if (quizResults?.quiz_session_token) {
      await trackConversionFunnelStep({
        session_token: quizResults.quiz_session_token,
        funnel_step: 'account_created',
        investment_score: userData.engagement_data?.investment_score,
        metadata: {
          onboarding_step: userData.onboarding_step,
          conversion_source: 'progressive_flow'
        }
      });
    }

    // Redirect to personalized onboarding
    window.location.href = '/onboarding?source=quiz&step=welcome';
  };

  const handleConversionComplete = async (result: any) => {
    console.log('Conversion flow complete:', result);
    
    // Track completion
    if (quizResults?.quiz_session_token) {
      await trackConversionFunnelStep({
        session_token: quizResults.quiz_session_token,
        funnel_step: 'engagement_building',
        metadata: {
          completion_type: result.type,
          continued_as_guest: result.guest_mode
        }
      });
    }
  };

  // Use EnhancedQuizFlow with results step instead of ProgressiveConversionFlow
  // This ensures QuizToCollectionBridge is used for the collection-first approach

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Quiz Header */}
        <header className='text-center mb-8' role="banner">
          <h1 className='text-4xl font-serif font-bold text-foreground mb-4'>
            Discover Your Fragrance Personality
          </h1>
          <p className='text-xl text-muted-foreground mb-6'>
            Answer a few questions to find fragrances perfectly matched to your
            style
          </p>

          <div className='flex items-center justify-center space-x-6 text-sm text-muted-foreground' role="list" aria-label="Quiz features">
            <div className='flex items-center space-x-2' role="listitem">
              <div className='w-2 h-2 bg-purple-500 rounded-full' aria-hidden="true" />
              <span>2-8 minutes</span>
            </div>
            <div className='flex items-center space-x-2' role="listitem">
              <div className='w-2 h-2 bg-pink-500 rounded-full' aria-hidden="true" />
              <span>No pressure exploration</span>
            </div>
            <div className='flex items-center space-x-2' role="listitem">
              <div className='w-2 h-2 bg-amber-500 rounded-full' aria-hidden="true" />
              <span>Progressive personalization</span>
            </div>
          </div>
        </header>

        {/* Progressive Quiz Flow with Error Boundary and Suspense */}
        <ProgressiveQuizErrorBoundary>
          <Suspense fallback={<QuizSkeleton />}>
            <ProgressiveQuizFlow
              onConversionReady={handleConversionReady}
              initialGender={storedGender as any}
            />
          </Suspense>
        </ProgressiveQuizErrorBoundary>

        {/* Trust Signals */}
        <footer className='mt-12 text-center' role="contentinfo">
          <h2 className="sr-only">Quiz Benefits and Features</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground' role="group" aria-label="Quiz benefits">
            <div>
              <div className='text-2xl mb-2' aria-hidden="true">🎯</div>
              <h3 className='font-medium text-foreground mb-1'>
                Adaptive Experience
              </h3>
              <p>
                Your journey adapts to your engagement level - explore at your own pace
              </p>
            </div>
            <div>
              <div className='text-2xl mb-2' aria-hidden="true">🌟</div>
              <h3 className='font-medium text-foreground mb-1'>
                Progressive Discovery
              </h3>
              <p>
                Start with 3 matches, unlock more value as you explore your preferences
              </p>
            </div>
            <div>
              <div className='text-2xl mb-2' aria-hidden="true">🔒</div>
              <h3 className='font-medium text-foreground mb-1'>
                No Pressure Policy
              </h3>
              <p>
                Explore freely for 24 hours. Save your progress only when you're ready
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
