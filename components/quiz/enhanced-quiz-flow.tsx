'use client';

import React, { useState } from 'react';
import {
  GenderPreferenceSelector,
  type GenderPreference,
} from './gender-preference-selector';
import {
  ExperienceLevelSelector,
  type ExperienceLevel,
} from './experience-level-selector';
import { StableQuizInterface } from './stable-quiz-interface';
import { getNaturalQuizData } from '@/lib/quiz/natural-quiz-data';
import { FragranceRecommendationDisplay } from './fragrance-recommendation-display';
import { QuizResultsStreaming } from './quiz-results-streaming';
import { QuizToCollectionBridge } from './quiz-to-collection-bridge';
// Removed WorkingRecommendationEngine - now using API endpoint
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { QuizSkeleton } from '@/components/ui/skeletons';
import { useProgressiveSession } from '@/lib/quiz/progressive-session-manager';
import { GenderValidationError } from './gender-validation-error';

type QuizStep = 'gender' | 'experience' | 'quiz' | 'results' | 'gender_error';

interface EnhancedQuizFlowProps {
  onConversionReady?: (results: any) => void;
  initialGender?: GenderPreference;
  onQuestionTransition?: () => void;
}

/**
 * Enhanced Quiz Flow Component
 *
 * Complete quiz experience with proper flow:
 * 1. Gender preference selection
 * 2. Experience level selection
 * 3. Adaptive quiz based on experience level
 * 4. Direct 3-recommendation results with AI insights
 */
export function EnhancedQuizFlow({
  onConversionReady,
  initialGender,
  onQuestionTransition,
}: EnhancedQuizFlowProps) {
  const [currentStep, setCurrentStep] = useState<QuizStep>(
    initialGender ? 'experience' : 'gender'
  );
  const [genderPreference, setGenderPreference] = useState<
    GenderPreference | undefined
  >(initialGender);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>();
  const [quizResponses, setQuizResponses] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [genderError, setGenderError] = useState<{
    message: string;
    recoveryAction?: {
      type: string;
      step: string;
      message: string;
    };
  } | null>(null);
  const [quizSessionToken] = useState(
    `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Progressive session management
  const {
    trackEngagement,
    getEngagementScore,
    storeQuizResults,
    trackPageView,
  } = useProgressiveSession();

  // Track initial page view
  React.useEffect(() => {
    trackPageView('/quiz');
    trackEngagement({
      type: 'quiz_started',
      context: 'enhanced_flow',
      value: { initial_gender: initialGender },
    });
  }, [trackPageView, trackEngagement, initialGender]);

  const handleGenderSelect = (gender: GenderPreference) => {
    setGenderPreference(gender);

    // Progressive engagement tracking
    trackEngagement({
      type: 'gender_selected',
      value: gender,
      context: 'quiz_flow',
    });

    // Legacy analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'quiz_gender_selected', {
        gender_preference: gender,
        quiz_session: quizSessionToken,
      });
    }

    // Trigger progressive loading transition
    if (onQuestionTransition) {
      onQuestionTransition();
    }

    setCurrentStep('experience');
  };

  const handleExperienceSelect = (level: ExperienceLevel) => {
    setExperienceLevel(level);

    // Progressive engagement tracking
    trackEngagement({
      type: 'experience_selected',
      value: level,
      context: 'quiz_flow',
    });

    // Legacy analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'quiz_experience_selected', {
        experience_level: level,
        gender_preference: genderPreference,
        quiz_session: quizSessionToken,
      });
    }

    // Trigger progressive loading transition
    if (onQuestionTransition) {
      onQuestionTransition();
    }

    setCurrentStep('quiz');
  };

  const handleQuizComplete = async (responses: any[]) => {
    // Prevent duplicate submissions
    if (isSubmitting || isComplete) {
      console.warn(
        '⚠️ DUPLICATE SUBMISSION PREVENTED: Quiz already being processed'
      );
      return;
    }

    setIsSubmitting(true);
    setQuizResponses(responses);
    setIsGenerating(true);

    // Progressive engagement tracking for quiz completion
    trackEngagement({
      type: 'quiz_completed',
      value: {
        question_count: responses.length,
        gender_preference: genderPreference,
        experience_level: experienceLevel,
      },
      context: 'quiz_flow',
    });

    try {
      // CRITICAL FRONTEND VALIDATION: Ensure gender preference exists to prevent SCE-81
      if (
        !genderPreference ||
        !['men', 'women', 'unisex'].includes(genderPreference)
      ) {
        console.error(
          '❌ CRITICAL FRONTEND VALIDATION: Invalid or missing gender preference'
        );
        console.error('📊 CURRENT STATE:', {
          genderPreference,
          experienceLevel,
          responseCount: responses.length,
        });

        // Set error state instead of throwing
        setGenderError({
          message:
            'Gender preference was not properly selected. This is required for personalized recommendations.',
          recoveryAction: {
            type: 'restart_quiz',
            step: 'gender_selection',
            message:
              'Please restart and select your fragrance preference first',
          },
        });
        setCurrentStep('gender_error');
        return;
      }

      console.log(
        `✅ FRONTEND VALIDATION PASSED: Gender=${genderPreference}, Experience=${experienceLevel}`
      );

      // Add gender and experience context to responses
      const enhancedResponses = [
        {
          question_id: 'gender_preference',
          answer_value: genderPreference,
          timestamp: new Date().toISOString(),
        },
        {
          question_id: 'experience_level',
          answer_value: experienceLevel,
          timestamp: new Date().toISOString(),
        },
        ...responses,
      ];

      console.log(
        `✅ ENHANCED RESPONSES: Gender=${genderPreference}, Experience=${experienceLevel}, Total=${enhancedResponses.length}`
      );

      // Generate recommendations using API endpoint (database-backed)
      console.log(
        '🚀 SUBMITTING TO API: Making single request to prevent duplicates'
      );
      console.log(
        `📊 API REQUEST: Session ${quizSessionToken}, ${enhancedResponses.length} responses`
      );
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: enhancedResponses,
          session_token: quizSessionToken,
        }),
      });

      const result = await response.json();

      // Handle API validation errors with structured recovery
      if (!response.ok) {
        console.error('❌ API ERROR:', result);

        // Handle gender-related errors specifically
        if (
          result.error_code === 'MISSING_GENDER_PREFERENCE' ||
          result.error_code === 'INVALID_GENDER_VALUE'
        ) {
          console.log(
            '🔄 GENDER ERROR RECOVERY: Showing user-friendly error page'
          );

          // Set error information for display
          setGenderError({
            message:
              result.user_message ||
              'Please select your gender preference to continue.',
            recoveryAction: result.recovery_action,
          });

          // Show gender error step
          setCurrentStep('gender_error');
          return;
        }

        // Handle other API errors
        console.error('❌ OTHER API ERROR:', result);
        throw new Error(result.error || 'Quiz processing failed');
      }

      if (result.analysis_complete && result.recommendations?.length >= 3) {
        setRecommendations(result.recommendations);

        // Store results in progressive session
        const quizResultsData = {
          quiz_session_token: result.quiz_session_token || quizSessionToken,
          recommendations: result.recommendations,
          responses: enhancedResponses,
          gender_preference: genderPreference,
          experience_level: experienceLevel,
          processing_time_ms: result.processing_time_ms,
          recommendation_method:
            result.recommendation_method || 'database_functions',
        };

        storeQuizResults(quizResultsData);

        // Progressive engagement tracking for successful completion
        trackEngagement({
          type: 'recommendations_generated',
          value: {
            recommendation_count: result.recommendations.length,
            processing_time_ms: result.processing_time_ms,
            engagement_score: getEngagementScore(),
          },
          context: 'quiz_success',
        });

        // Legacy analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'quiz_completed_successfully', {
            experience_level: experienceLevel,
            gender_preference: genderPreference,
            question_count: responses.length,
            recommendation_count: result.recommendations.length,
            processing_time_ms: result.processing_time_ms,
            quiz_session: quizSessionToken,
          });
        }

        // Prepare data for progressive conversion flow
        if (onConversionReady) {
          onConversionReady(quizResultsData);
        }

        setCurrentStep('results');
        setIsComplete(true); // Mark as complete to prevent further submissions
      } else {
        throw new Error('Failed to generate sufficient recommendations');
      }
    } catch (error) {
      console.error('Quiz completion error:', error);

      // Track error for debugging
      trackEngagement({
        type: 'quiz_api_error',
        value: {
          error_message:
            error instanceof Error ? error.message : 'Unknown error',
          gender_preference: genderPreference,
          experience_level: experienceLevel,
        },
        context: 'quiz_submission_failed',
      });

      // Handle gender-related errors with recovery flow
      if (error instanceof Error && error.message.includes('fetch')) {
        // Network error - treat as generic failure
        setRecommendations([]);
        setCurrentStep('results');
      } else {
        // Assume it's a validation error, show generic recovery
        setRecommendations([]);
        setCurrentStep('results');
      }

      // Reset submission state on error so user can retry
      setIsSubmitting(false);
      setIsComplete(false);
    } finally {
      setIsGenerating(false);
      // Keep isSubmitting true on success to prevent re-submissions
      // Only reset on error so user can retry
      if (!isComplete) {
        setIsSubmitting(false);
      }
    }
  };

  const handleGenderErrorRestart = () => {
    console.log('🔄 RESTARTING QUIZ: User requested restart from gender error');

    // Clear error state
    setGenderError(null);

    // Reset all quiz state
    setCurrentStep('gender');
    setGenderPreference(undefined);
    setExperienceLevel(undefined);
    setQuizResponses([]);
    setRecommendations([]);

    // Track restart event
    trackEngagement({
      type: 'quiz_restarted',
      value: 'gender_validation_error',
      context: 'error_recovery',
    });
  };

  const handleSampleOrder = (fragranceId: string) => {
    // Progressive engagement tracking
    trackEngagement({
      type: 'sample_interest',
      value: fragranceId,
      context: 'quiz_results',
    });

    // Legacy analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'sample_order_from_quiz', {
        fragrance_id: fragranceId,
        experience_level: experienceLevel,
        gender_preference: genderPreference,
        quiz_session: quizSessionToken,
      });
    }

    console.log('Sample order for fragrance:', fragranceId);
    // TODO: Integrate with sample ordering system
  };

  const handleLearnMore = async (fragranceId: string) => {
    // Progressive engagement tracking
    trackEngagement({
      type: 'fragrance_detail_view',
      value: fragranceId,
      context: 'quiz_results',
    });

    // Use safe navigation to prevent 404s (SCE-71 fix)
    const { safeNavigateToFragrance } = await import(
      '@/lib/services/fragrance-validation-client'
    );

    await safeNavigateToFragrance(fragranceId, () => {
      // Fallback action if fragrance not found
      console.error(`❌ NAVIGATION FAILED: Fragrance ${fragranceId} not found`);

      // Track failed navigation for debugging
      trackEngagement({
        type: 'navigation_failed',
        value: fragranceId,
        context: 'quiz_results_404_prevention',
      });

      // Show user-friendly message
      alert(
        `This fragrance is temporarily unavailable. Please try another recommendation from your results!`
      );
    });
  };

  const handleSaveToFavorites = (fragranceId: string) => {
    // Progressive engagement tracking
    trackEngagement({
      type: 'favorite_added',
      value: fragranceId,
      context: 'quiz_results',
    });

    console.log('Save to favorites:', fragranceId);
    // TODO: Integrate with favorites system
  };

  // Step 1: Gender Preference Selection
  if (currentStep === 'gender') {
    return (
      <div className='max-w-4xl mx-auto'>
        <GenderPreferenceSelector
          onGenderSelect={handleGenderSelect}
          selectedGender={genderPreference}
        />
      </div>
    );
  }

  // Step 2: Experience Level Selection
  if (currentStep === 'experience') {
    return (
      <div className='max-w-4xl mx-auto'>
        <ExperienceLevelSelector
          onLevelSelect={handleExperienceSelect}
          selectedLevel={experienceLevel}
        />
      </div>
    );
  }

  // Step 3: Adaptive Quiz Interface
  if (currentStep === 'quiz' && experienceLevel) {
    // Show loading state when submitting final answer
    if (isSubmitting || isGenerating) {
      return (
        <div className='max-w-2xl mx-auto'>
          <Card>
            <CardContent className='text-center py-12'>
              <div className='relative mb-6'>
                <div className='animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto' />
                <Sparkles className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-purple-500' />
              </div>
              <h3 className='text-xl font-semibold mb-2'>
                Processing your results...
              </h3>
              <p className='text-muted-foreground mb-4'>
                Analyzing your responses and finding perfect matches
              </p>
              <div className='text-sm text-muted-foreground space-y-2'>
                <p>🧠 Analyzing your fragrance personality</p>
                <p>💾 Storing your preferences securely</p>
                <p>🎯 Matching against our fragrance database</p>
                <p>✨ Generating personalized explanations</p>
                <p>🎨 Preparing your top 3 recommendations</p>
              </div>

              {/* Loading progress indicator */}
              <div className='mt-6'>
                <div className='text-xs text-muted-foreground mb-2'>
                  This may take 15-30 seconds for the best results
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div className='bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse w-2/3'></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className='max-w-4xl mx-auto'>
        <StableQuizInterface
          mode={experienceLevel}
          isSubmitting={isSubmitting}
          onQuizComplete={handleQuizComplete}
          onProgressUpdate={progress => {
            // Progressive engagement tracking
            trackEngagement({
              type: 'quiz_progress',
              value: {
                current_question: progress.current,
                total_questions: progress.total,
                progress_percentage: Math.round(
                  (progress.current / progress.total) * 100
                ),
              },
              context: 'quiz_interface',
            });

            // Legacy analytics
            if (typeof window !== 'undefined' && (window as any).gtag) {
              (window as any).gtag('event', 'quiz_progress', {
                experience_level: experienceLevel,
                current_question: progress.current,
                total_questions: progress.total,
                progress_percentage: Math.round(
                  (progress.current / progress.total) * 100
                ),
                quiz_session: quizSessionToken,
              });
            }
          }}
        />
      </div>
    );
  }

  // Step 4: Results Display with Streaming
  if (currentStep === 'results') {
    // Use collection-first flow with QuizToCollectionBridge
    const quizResultsData = {
      quiz_session_token: quizSessionToken,
      recommendations: recommendations,
      processing_time_ms: 3000, // Default value
      recommendation_method: 'unified_ai',
    };

    return (
      <QuizToCollectionBridge
        quizResults={quizResultsData}
        onAccountCreated={userData => {
          console.log('Account created:', userData);
          // Handle account creation completion
        }}
        onConversionComplete={result => {
          console.log('Conversion complete:', result);
          // Handle conversion completion
        }}
        forceCollectionFlow={true}
      />
    );
  }

  // Gender Error Recovery Step
  if (currentStep === 'gender_error' && genderError) {
    return (
      <div className='max-w-4xl mx-auto'>
        <GenderValidationError
          errorMessage={genderError.message}
          recoveryAction={genderError.recoveryAction}
          onRestart={handleGenderErrorRestart}
        />
      </div>
    );
  }

  return null;
}
