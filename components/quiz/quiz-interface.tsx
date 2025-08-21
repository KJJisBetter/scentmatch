'use client';

import React, { useState } from 'react';
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
import { DirectDatabaseEngine as DirectRecommendationEngine } from '@/lib/ai-sdk/compatibility-layer';
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
    if (!currentQ) return;

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
    form.setValue('answer', answer);
    form.handleSubmit(handleAnswerSubmit)();
  };

  const analyzeQuiz = async (allResponses: any[]) => {
    setIsAnalyzing(true);

    try {
      // Generate direct recommendations (no personality profiling)
      const engine = new DirectRecommendationEngine();
      const result = await engine.generateRecommendations(
        allResponses,
        quizSessionToken
      );

      if (result.success && result.recommendations.length >= 3) {
        // Prepare simplified data for conversion flow (exactly 3 recommendations)
        setPersonalityResults({
          quiz_session_token: quizSessionToken,
          recommendations: result.recommendations, // Exactly 3 recommendations with AI insights
          processing_time_ms: result.total_processing_time_ms,
          recommendation_method: 'direct_matching',
        });
      } else {
        // Fallback if direct recommendations fail
        setPersonalityResults({
          quiz_session_token: quizSessionToken,
          recommendations: result.recommendations, // Fallback recommendations
          processing_time_ms: result.total_processing_time_ms,
          recommendation_method: 'fallback',
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
    } finally {
      setIsAnalyzing(false);
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

  if (isAnalyzing) {
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
            <p>✨ Analyzing your preferences</p>
            <p>🧪 Matching against 1,467 fragrances</p>
            <p>🎯 Selecting your top 3 matches</p>
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
                      <div className='space-y-4'>
                        {question.options.map(option => (
                          <button
                            key={option.value}
                            type='button'
                            onClick={() => handleOptionClick(option.value)}
                            className='w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group transform hover:scale-[1.02] active:scale-[0.98]'
                          >
                            <div className='flex items-center space-x-4'>
                              <div className='text-2xl'>{option.emoji}</div>
                              <div className='flex-1'>
                                <span className='font-medium group-hover:text-purple-700'>
                                  {option.text}
                                </span>
                              </div>
                              <ChevronRight className='w-5 h-5 text-gray-400 group-hover:text-purple-500' />
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
