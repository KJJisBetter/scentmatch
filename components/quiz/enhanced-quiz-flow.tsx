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
import { AdaptiveQuizInterface } from './adaptive-quiz-interface';
import { getNaturalQuizData } from '@/lib/quiz/natural-quiz-data';
import { FragranceRecommendationDisplay } from './fragrance-recommendation-display';
import { QuizResultsStreaming } from './quiz-results-streaming';
// Removed WorkingRecommendationEngine - now using API endpoint
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { QuizSkeleton } from '@/components/ui/skeletons';

type QuizStep = 'gender' | 'experience' | 'quiz' | 'results';

interface EnhancedQuizFlowProps {
  onConversionReady?: (results: any) => void;
  initialGender?: GenderPreference;
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
}: EnhancedQuizFlowProps) {
  const [currentStep, setCurrentStep] = useState<QuizStep>(
    initialGender ? 'experience' : 'gender'
  );
  const [genderPreference, setGenderPreference] =
    useState<GenderPreference>(initialGender);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>();
  const [quizResponses, setQuizResponses] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizSessionToken] = useState(
    `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  const handleGenderSelect = (gender: GenderPreference) => {
    setGenderPreference(gender);

    // Track gender selection
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'quiz_gender_selected', {
        gender_preference: gender,
        quiz_session: quizSessionToken,
      });
    }

    setCurrentStep('experience');
  };

  const handleExperienceSelect = (level: ExperienceLevel) => {
    setExperienceLevel(level);

    // Track experience level selection
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'quiz_experience_selected', {
        experience_level: level,
        gender_preference: genderPreference,
        quiz_session: quizSessionToken,
      });
    }

    setCurrentStep('quiz');
  };

  const handleQuizComplete = async (responses: any[]) => {
    setQuizResponses(responses);
    setIsGenerating(true);

    try {
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

      // Generate recommendations using API endpoint (database-backed)
      const response = await fetch('/api/quiz/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: enhancedResponses,
          session_token: quizSessionToken,
        }),
      });

      const result = await response.json();

      if (result.analysis_complete && result.recommendations?.length >= 3) {
        setRecommendations(result.recommendations);

        // Track successful quiz completion
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

        // Prepare data for conversion flow
        if (onConversionReady) {
          onConversionReady({
            quiz_session_token: result.quiz_session_token || quizSessionToken,
            recommendations: result.recommendations,
            gender_preference: genderPreference,
            experience_level: experienceLevel,
            processing_time_ms: result.processing_time_ms,
            recommendation_method:
              result.recommendation_method || 'database_functions',
          });
        }

        setCurrentStep('results');
      } else {
        throw new Error('Failed to generate sufficient recommendations');
      }
    } catch (error) {
      console.error('Quiz completion error:', error);

      // Fallback with error message
      setRecommendations([]);
      setCurrentStep('results');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSampleOrder = (fragranceId: string) => {
    // Track sample order intent
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

  const handleLearnMore = (fragranceId: string) => {
    window.open(`/fragrance/${fragranceId}`, '_blank');
  };

  const handleSaveToFavorites = (fragranceId: string) => {
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
    return (
      <div className='max-w-4xl mx-auto'>
        <AdaptiveQuizInterface
          mode={experienceLevel}
          onQuizComplete={handleQuizComplete}
          onProgressUpdate={progress => {
            // Track quiz progress
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
    return (
      <QuizResultsStreaming
        recommendations={recommendations}
        isGenerating={isGenerating}
        onSampleOrder={handleSampleOrder}
        onLearnMore={handleLearnMore}
        onSaveToFavorites={handleSaveToFavorites}
      />
    );
  }

  return null;
}
