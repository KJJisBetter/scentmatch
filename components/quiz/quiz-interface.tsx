'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Sparkles, Heart, ShoppingCart } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { UnifiedRecommendationEngine } from '@/lib/ai-sdk/unified-recommendation-engine';
import { createServerSupabase } from '@/lib/supabase/server';
import { ConversionFlow } from './conversion-flow';
import {
  singleQuestionSchema,
  type SingleQuestionFormData,
} from '@/lib/quiz/form-schemas';

/**
 * QuizInterface Component (MVP)
 *
 * Uses React Hook Form with zod validation for robust form handling.
 * Simple but effective quiz flow for MVP:
 * - 5 essential questions for personality classification
 * - Immediate analysis and results
 * - Direct path to fragrance recommendations
 * - Sample ordering integration
 */
export function QuizInterface() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [personalityResults, setPersonalityResults] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [quizSessionToken] = useState(
    `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Form for each question
  const form = useForm<SingleQuestionFormData>({
    resolver: zodResolver(singleQuestionSchema),
    defaultValues: {
      answer: '',
    },
  });

  // MVP Quiz Questions (5 essential questions)
  const mvpQuestions = [
    {
      id: 'style',
      text: 'What fragrances do you enjoy most?',
      options: [
        {
          value: 'professional_sophisticated',
          text: 'Elegant and polished scents',
          emoji: '💼',
        },
        {
          value: 'romantic_feminine',
          text: 'Soft, romantic florals',
          emoji: '🌸',
        },
        {
          value: 'casual_natural',
          text: 'Fresh, everyday scents',
          emoji: '🌿',
        },
        {
          value: 'bold_confident',
          text: 'Rich, memorable fragrances',
          emoji: '✨',
        },
      ],
    },
    {
      id: 'occasions',
      text: 'When do you most want to smell amazing?',
      options: [
        {
          value: 'work_professional',
          text: 'At work & professional events',
          emoji: '🏢',
        },
        {
          value: 'evening_dinner',
          text: 'Evening dinners & dates',
          emoji: '🌙',
        },
        {
          value: 'everyday_casual',
          text: 'Everyday & casual outings',
          emoji: '☀️',
        },
        {
          value: 'special_celebrations',
          text: 'Special occasions & celebrations',
          emoji: '🎉',
        },
      ],
    },
    {
      id: 'preferences',
      text: 'Which scent style appeals to you most?',
      options: [
        {
          value: 'complex_layered',
          text: 'Scents that change throughout the day',
          emoji: '🎭',
        },
        { value: 'fresh_clean', text: 'Clean, refreshing scents', emoji: '🚿' },
        {
          value: 'sweet_floral',
          text: 'Sweet, garden-like florals',
          emoji: '🌺',
        },
        { value: 'warm_cozy', text: 'Warm, comforting scents', emoji: '🤗' },
      ],
    },
    {
      id: 'intensity',
      text: 'How noticeable do you want your fragrance to be?',
      options: [
        { value: 'subtle_personal', text: 'Subtle - just for me', emoji: '🤫' },
        {
          value: 'moderate_noticeable',
          text: 'Moderate - people notice when close',
          emoji: '👥',
        },
        {
          value: 'strong_memorable',
          text: 'Strong - memorable and impactful',
          emoji: '💫',
        },
      ],
    },
    {
      id: 'budget',
      text: 'How do you like to discover new fragrances?',
      options: [
        {
          value: 'try_samples_first',
          text: 'Try small samples before buying',
          emoji: '🧪',
        },
        {
          value: 'invest_in_quality',
          text: 'Choose fewer, special fragrances',
          emoji: '💎',
        },
        {
          value: 'explore_variety',
          text: 'Try many different scents',
          emoji: '🎨',
        },
        {
          value: 'budget_conscious',
          text: 'Find amazing scents at great prices',
          emoji: '💰',
        },
      ],
    },
  ];

  // Reset form when question changes
  React.useEffect(() => {
    form.reset({ answer: '' });
  }, [currentQuestion, form]);

  const handleAnswerSubmit = async (data: SingleQuestionFormData) => {
    const currentQ = mvpQuestions[currentQuestion];
    if (!currentQ || isAnalyzing || isSubmitting || isComplete) return; // Prevent duplicate submissions

    const newResponse = {
      question_id: currentQ.id,
      answer_value: data.answer,
      timestamp: new Date().toISOString(),
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    // Track quiz progress for affiliate conversion analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'quiz_question_answered', {
        question_number: currentQuestion + 1,
        question_id: currentQ.id,
        answer: data.answer,
        quiz_session: quizSessionToken,
      });
    }

    // Move to next question or analyze
    if (currentQuestion < mvpQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Track quiz completion
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'quiz_completed', {
          total_questions: mvpQuestions.length,
          quiz_session: quizSessionToken,
        });
      }
      analyzeQuiz(updatedResponses);
    }
  };

  const handleOptionClick = (answer: string) => {
    if (isAnalyzing || isSubmitting || isComplete) return; // Prevent clicks during submission

    form.setValue('answer', answer);
    form.handleSubmit(handleAnswerSubmit)();
  };

  const analyzeQuiz = async (allResponses: any[]) => {
    // Prevent duplicate API calls
    if (isSubmitting || isComplete) {
      console.warn(
        '⚠️ DUPLICATE API CALL PREVENTED: Quiz already being processed'
      );
      return;
    }

    setIsSubmitting(true);
    setIsAnalyzing(true);

    try {
      // FIXED: Use API route to store quiz data and generate personalized recommendations
      console.log(
        `🎯 QUIZ ANALYSIS: Starting analysis for session ${quizSessionToken}`
      );

      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: allResponses.map(r => ({
            question_id: r.question_id,
            answer_value: r.answer_value,
            timestamp: r.timestamp,
          })),
          session_token: quizSessionToken,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Quiz analysis failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (
        result.analysis_complete &&
        result.recommendations &&
        result.recommendations.length >= 3
      ) {
        console.log(
          `✅ QUIZ ANALYSIS COMPLETE: Got ${result.recommendations.length} personalized recommendations`
        );
        console.log(
          `📊 RECOMMENDATION METHOD: ${result.recommendation_method}`
        );

        // Prepare simplified data for conversion flow (exactly 3 recommendations)
        setPersonalityResults({
          quiz_session_token: result.quiz_session_token || quizSessionToken,
          recommendations: result.recommendations.slice(0, 3), // Take top 3 recommendations
          processing_time_ms: result.processing_time_ms,
          recommendation_method: result.recommendation_method,
          personality_analysis: result.personality_analysis,
        });

        setIsComplete(true); // Mark as complete to prevent further submissions
      } else {
        console.warn(
          '⚠️ QUIZ ANALYSIS: Incomplete results, using available recommendations'
        );
        // Fallback if analysis incomplete but has some recommendations
        setPersonalityResults({
          quiz_session_token: result.quiz_session_token || quizSessionToken,
          recommendations: result.recommendations || [], // Available recommendations
          processing_time_ms: result.processing_time_ms || 0,
          recommendation_method: 'api_fallback',
          error: result.error,
        });
      }

      setShowResults(true);
    } catch (error) {
      console.error('Direct recommendation error:', error);
      // Ultimate fallback
      setPersonalityResults({
        quiz_session_token: quizSessionToken,
        recommendations: [],
        error: 'Unable to generate recommendations',
      });
      setShowResults(true);
      // Reset submission state on error so user can retry
      setIsSubmitting(false);
    } finally {
      setIsAnalyzing(false);
      // Keep isSubmitting true on success to prevent re-submissions
    }
  };

  const handleAccountCreated = (userData: any) => {
    console.log('Account created:', userData);
    // Track conversion success
  };

  const handleConversionComplete = (result: any) => {
    console.log('Conversion complete:', result);
    // Track business conversion metrics
  };

  const progress = ((currentQuestion + 1) / mvpQuestions.length) * 100;

  if (isAnalyzing || isSubmitting) {
    return (
      <Card className='max-w-2xl mx-auto'>
        <CardContent className='text-center py-12'>
          <div className='relative mb-6'>
            <div className='animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto' />
            <Sparkles className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-purple-500' />
          </div>
          <h3 className='text-xl font-semibold mb-2'>
            {isSubmitting
              ? 'Processing your results...'
              : 'Creating Your Personalized Fragrance Profile...'}
          </h3>
          <p className='text-muted-foreground mb-4'>
            Analyzing your responses and finding perfect matches
          </p>
          <div className='text-sm text-muted-foreground space-y-2'>
            <p>🧠 Analyzing your fragrance personality from quiz responses</p>
            <p>💾 Storing your preferences for personalized recommendations</p>
            <p>🎯 Matching your profile against our fragrance database</p>
            <p>
              ✨ Generating educational explanations for your experience level
            </p>
            <p>🎨 Preparing your top 3 personalized matches</p>
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
    );
  }

  if (showResults && personalityResults) {
    return (
      <ConversionFlow
        quizResults={personalityResults}
        onAccountCreated={handleAccountCreated}
        onConversionComplete={handleConversionComplete}
      />
    );
  }

  // Current question display
  const question = mvpQuestions[currentQuestion];
  if (!question) return null;

  return (
    <div className='max-w-2xl mx-auto'>
      {/* Progress Bar */}
      <div className='mb-8'>
        <div className='flex justify-between text-sm text-muted-foreground mb-2'>
          <span>
            Question {currentQuestion + 1} of {mvpQuestions.length}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className='py-8'>
          <h2 className='text-2xl font-semibold text-center mb-8'>
            {question.text}
          </h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAnswerSubmit)}>
              <FormField
                control={form.control}
                name='answer'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className='touch-spacing'>
                        {question.options.map(option => (
                          <button
                            key={option.value}
                            type='button'
                            onClick={() => handleOptionClick(option.value)}
                            className={`w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group touch-target-xl touch-feedback touch-action-area ${
                              isAnalyzing || isSubmitting || isComplete
                                ? 'cursor-not-allowed opacity-50'
                                : ''
                            }`}
                            disabled={isAnalyzing || isSubmitting || isComplete}
                            aria-describedby={`option-${option.value}-desc`}
                          >
                            <div className='flex items-center space-x-4'>
                              <div
                                className='text-2xl flex-shrink-0'
                                role='img'
                                aria-label={`${option.text} emoji`}
                              >
                                {option.emoji}
                              </div>
                              <div className='flex-1 min-w-0'>
                                <span className='font-medium group-hover:text-purple-700 text-sm sm:text-base leading-tight'>
                                  {option.text}
                                </span>
                              </div>
                              <ChevronRight className='w-5 h-5 text-gray-400 group-hover:text-purple-500 flex-shrink-0' />
                            </div>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Quiz Benefits */}
      <div className='mt-8 text-center text-sm text-muted-foreground'>
        <p>
          ✨ Get instant recommendations • 🧪 Try samples risk-free • 💝 Find
          your signature scent
        </p>
      </div>
    </div>
  );
}
