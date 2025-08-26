'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, CheckCircle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import {
  getNaturalQuizData,
  type ExperienceLevel,
  type NaturalQuizData,
} from '@/lib/quiz/natural-quiz-data';
import {
  createQuestionValidation,
  singleQuestionSchema,
  multipleQuestionSchema,
  type SingleQuestionFormData,
  type MultipleQuestionFormData,
} from '@/lib/quiz/form-schemas';

export type QuizMode = ExperienceLevel;

interface AdaptiveQuizInterfaceProps {
  mode: QuizMode;
  onQuizComplete: (responses: any[]) => void;
  onProgressUpdate?: (progress: { current: number; total: number }) => void;
}

/**
 * AdaptiveQuizInterface Component
 *
 * Uses React Hook Form with zod validation for robust form handling.
 * Provides experience-adaptive quiz interface with three distinct modes:
 * - Beginner: 4 questions, 4 options each, simplified language
 * - Enthusiast: 6 questions, 6 options each, balanced complexity
 * - Collector: 8 questions, 8-10 options each, sophisticated choices
 */
export function AdaptiveQuizInterface({
  mode,
  onQuizComplete,
  onProgressUpdate,
}: AdaptiveQuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [localSelections, setLocalSelections] = useState<string[]>([]);

  const quizData = getNaturalQuizData(mode);
  const questions = quizData.questions;
  const currentQuestion = questions[currentQuestionIndex];

  const progress = useMemo(
    () => ({
      current: currentQuestionIndex + 1,
      total: questions.length,
    }),
    [currentQuestionIndex, questions.length]
  );
  const progressPercent = (progress.current / progress.total) * 100;

  // Single selection form
  const singleForm = useForm<SingleQuestionFormData>({
    resolver: zodResolver(singleQuestionSchema),
    defaultValues: {
      answer: '',
    },
  });

  // Multiple selection form  
  const multipleForm = useForm<{ selections: string[] }>({
    resolver: zodResolver(
      createQuestionValidation(
        true,
        currentQuestion?.minSelections || 1,
        currentQuestion?.maxSelections || 8
      ) as any
    ),
    defaultValues: {
      selections: [],
    },
  });

  // Reset forms when question changes
  useEffect(() => {
    singleForm.reset({ answer: '' });
    multipleForm.reset({ selections: [] });
    setLocalSelections([]);
  }, [currentQuestionIndex, singleForm, multipleForm]);

  // Notify parent of progress updates
  useEffect(() => {
    if (onProgressUpdate) {
      const currentProgress = {
        current: currentQuestionIndex + 1,
        total: questions.length,
      };
      onProgressUpdate(currentProgress);
    }
  }, [currentQuestionIndex, questions.length, onProgressUpdate]);

  const proceedToNext = (newResponse: any) => {
    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    if (currentQuestionIndex >= questions.length - 1) {
      // Quiz complete
      onQuizComplete(updatedResponses);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSingleSelection = (data: SingleQuestionFormData) => {
    if (!currentQuestion) return;

    const newResponse = {
      question_id: currentQuestion.id,
      answer_value: data.answer,
      experience_level: mode,
      timestamp: new Date().toISOString(),
    };

    // Track selection
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'quiz_question_answered', {
        question_id: currentQuestion.id,
        answer: data.answer,
        mode: mode,
        question_number: currentQuestionIndex + 1,
      });
    }

    proceedToNext(newResponse);
  };

  const handleMultipleSelection = (data: { selections: string[] }) => {
    if (!currentQuestion) return;

    const newResponse = {
      question_id: currentQuestion.id,
      answer_value: data.selections.join(','),
      answer_metadata: { selections: data.selections },
      experience_level: mode,
      timestamp: new Date().toISOString(),
    };

    // Track multiple selection
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'quiz_multiple_selection', {
        question_id: currentQuestion.id,
        selections: data.selections,
        selection_count: data.selections.length,
        mode: mode,
        question_number: currentQuestionIndex + 1,
      });
    }

    proceedToNext(newResponse);
  };

  const handleSingleClick = (answer: string) => {
    singleForm.setValue('answer', answer);
    singleForm.handleSubmit(handleSingleSelection)();
  };

  const handleMultipleToggle = (answer: string, checked: boolean) => {
    if (!currentQuestion) return;

    const selectedOption = currentQuestion.options.find(
      opt => opt.value === answer
    );

    // Handle auto-select options
    if (selectedOption?.autoSelectAll && checked) {
      const allOtherValues = currentQuestion.options
        .filter(opt => !opt.autoSelectAll)
        .map(opt => opt.value);
      const newSelections = [answer, ...allOtherValues];
      setLocalSelections(newSelections);
      multipleForm.setValue('selections', newSelections);
      return;
    }

    // Handle regular multiple selection
    let newSelections: string[];
    if (checked) {
      // Add selection
      newSelections = [...localSelections.filter(s => s !== answer), answer];

      // Remove auto-select options if selecting non-auto option
      if (!selectedOption?.autoSelectAll) {
        newSelections = newSelections.filter(selection => {
          const opt = currentQuestion.options.find(o => o.value === selection);
          return !opt?.autoSelectAll;
        });
      }

      // Check max selections
      if (newSelections.length > (currentQuestion.maxSelections || 8)) {
        return;
      }
    } else {
      // Remove selection
      newSelections = localSelections.filter(s => s !== answer);
    }

    setLocalSelections(newSelections);
    multipleForm.setValue('selections', newSelections);
  };

  // Get mode-specific styling and text
  const getModeConfig = () => {
    switch (mode) {
      case 'beginner':
        return {
          badge: '🌱 Beginner-Friendly',
          badgeColor: 'bg-green-100 text-green-800',
          encouragement:
            "🌟 You're doing great! • ✨ Almost there! • 🎯 Finding your perfect scent",
          buttonStyle: 'hover:border-green-300 hover:bg-green-50',
        };
      case 'enthusiast':
        return {
          badge: '🌸 Enthusiast Mode',
          badgeColor: 'bg-purple-100 text-purple-800',
          encouragement:
            '🌸 Excellent choices! • 🎯 Refining your profile • ✨ Discovering new favorites',
          buttonStyle: 'hover:border-purple-300 hover:bg-purple-50',
        };
      case 'experienced':
        return {
          badge: '🎭 Love Trying New Things',
          badgeColor: 'bg-indigo-100 text-indigo-800',
          encouragement:
            '🎭 Great exploration • 💎 Discovering new favorites • 🌟 Finding hidden gems',
          buttonStyle: 'hover:border-indigo-300 hover:bg-indigo-50',
        };
      default:
        return {
          badge: '🌸 Enthusiast Mode',
          badgeColor: 'bg-purple-100 text-purple-800',
          encouragement: '🎯 Great progress!',
          buttonStyle: 'hover:border-purple-300 hover:bg-purple-50',
        };
    }
  };

  const modeConfig = getModeConfig();

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className='max-w-2xl mx-auto'>
      {/* Progress Bar */}
      <div className='mb-8'>
        <div className='flex justify-between text-sm text-muted-foreground mb-2'>
          <span>
            Question {progress.current} of {progress.total}
          </span>
          <span>{Math.round(progressPercent)}% complete</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300'
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Experience Level Badge */}
      <div className='flex justify-center mb-4'>
        <Badge className={`px-3 py-1 ${modeConfig.badgeColor}`}>
          {modeConfig.badge}
        </Badge>
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className='py-8'>
          <h2 className='text-2xl font-semibold text-center mb-2'>
            {currentQuestion.text}
          </h2>
          {currentQuestion.subtitle && (
            <p className='text-center text-muted-foreground mb-8'>
              {currentQuestion.subtitle}
            </p>
          )}

          {currentQuestion.allowMultiple ? (
            // Multiple Selection Form
            <Form {...multipleForm}>
              <form
                onSubmit={multipleForm.handleSubmit(handleMultipleSelection)}
              >
                <FormField
                  control={multipleForm.control}
                  name='selections'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className='space-y-4'>
                          {currentQuestion.options.map(option => {
                            const isSelected = localSelections.includes(
                              option.value
                            );

                            return (
                              <div
                                key={option.value}
                                className={`w-full p-4 border-2 rounded-lg transition-all duration-200 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] ${
                                  isSelected
                                    ? 'border-purple-500 bg-purple-50'
                                    : `border-gray-200 ${modeConfig.buttonStyle}`
                                }`}
                                onClick={() =>
                                  handleMultipleToggle(
                                    option.value,
                                    !isSelected
                                  )
                                }
                              >
                                <div className='flex items-center space-x-4'>
                                  <div className='text-2xl'>{option.emoji}</div>
                                  <div className='flex-1'>
                                    <span
                                      className={`font-medium ${
                                        isSelected
                                          ? 'text-purple-700'
                                          : 'hover:text-purple-700'
                                      }`}
                                    >
                                      {option.text}
                                    </span>
                                  </div>
                                  <Checkbox
                                    checked={isSelected}
                                    className='pointer-events-none'
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Continue Button for Multiple Selection */}
                <div className='mt-6 text-center'>
                  <Button
                    type='submit'
                    disabled={
                      localSelections.length <
                      (currentQuestion.minSelections || 1)
                    }
                    className='px-8 py-3'
                  >
                    Continue with {localSelections.length}{' '}
                    {localSelections.length === 1 ? 'choice' : 'choices'}
                  </Button>
                  <p className='text-xs text-muted-foreground mt-2'>
                    {localSelections.length}/
                    {currentQuestion.maxSelections || 3} selected
                    {currentQuestion.minSelections &&
                      ` (minimum ${currentQuestion.minSelections})`}
                  </p>
                </div>
              </form>
            </Form>
          ) : (
            // Single Selection Form
            <Form {...singleForm}>
              <form onSubmit={singleForm.handleSubmit(handleSingleSelection)}>
                <FormField
                  control={singleForm.control}
                  name='answer'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className='space-y-4'>
                          {currentQuestion.options.map(option => (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() => handleSingleClick(option.value)}
                              className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 group transform hover:scale-[1.02] active:scale-[0.98] border-gray-200 ${modeConfig.buttonStyle}`}
                              style={{ minHeight: '48px' }}
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
          )}
        </CardContent>
      </Card>

      {/* Mode-specific Encouragement */}
      <div className='mt-6 text-center text-sm text-muted-foreground'>
        <p>{modeConfig.encouragement}</p>
      </div>
    </div>
  );
}
