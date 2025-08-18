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
import { DirectRecommendationEngine } from '@/lib/quiz/direct-recommendation-engine';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

type QuizStep = 'gender' | 'experience' | 'quiz' | 'results';

interface EnhancedQuizFlowProps {
  onConversionReady?: (results: any) => void;
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
export function EnhancedQuizFlow({ onConversionReady }: EnhancedQuizFlowProps) {
  const [currentStep, setCurrentStep] = useState<QuizStep>('gender');
  const [genderPreference, setGenderPreference] = useState<GenderPreference>();
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

      // Generate recommendations using the enhanced responses
      const engine = new DirectRecommendationEngine();
      const result = await engine.generateRecommendations(
        enhancedResponses,
        quizSessionToken
      );

      if (result.success && result.recommendations.length >= 3) {
        setRecommendations(result.recommendations);

        // Track successful quiz completion
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'quiz_completed_successfully', {
            experience_level: experienceLevel,
            gender_preference: genderPreference,
            question_count: responses.length,
            recommendation_count: result.recommendations.length,
            processing_time_ms: result.total_processing_time_ms,
            quiz_session: quizSessionToken,
          });
        }

        // Prepare data for conversion flow
        if (onConversionReady) {
          onConversionReady({
            quiz_session_token: quizSessionToken,
            recommendations: result.recommendations,
            gender_preference: genderPreference,
            experience_level: experienceLevel,
            processing_time_ms: result.total_processing_time_ms,
            recommendation_method: 'direct_matching',
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

  // Loading State
  if (isGenerating) {
    return (
      <Card className='max-w-2xl mx-auto'>
        <CardContent className='text-center py-12'>
          <div className='relative mb-6'>
            <div className='animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto' />
            <Sparkles className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-purple-500' />
          </div>
          <h3 className='text-xl font-semibold mb-2'>
            Finding Your Perfect Matches...
          </h3>
          <p className='text-muted-foreground mb-4'>
            Selecting 3 ideal fragrances for you
          </p>
          <div className='text-sm text-muted-foreground space-y-1'>
            <p>✨ Analyzing your {experienceLevel} preferences</p>
            <p>🧪 Matching against 1,467 fragrances</p>
            <p>🎯 Selecting your top 3 matches</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 4: Results Display
  if (currentStep === 'results') {
    if (recommendations.length === 0) {
      return (
        <Card className='max-w-2xl mx-auto'>
          <CardContent className='text-center py-12'>
            <p className='text-muted-foreground'>
              Sorry, we couldn't generate recommendations at this time. Please
              try again.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className='max-w-6xl mx-auto'>
        <FragranceRecommendationDisplay
          recommendations={recommendations}
          onSampleOrder={handleSampleOrder}
          onLearnMore={handleLearnMore}
          onSaveToFavorites={handleSaveToFavorites}
        />
      </div>
    );
  }

  return null;
}
