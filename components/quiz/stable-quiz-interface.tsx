'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, CheckCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  getNaturalQuizData,
  type ExperienceLevel,
} from '@/lib/quiz/natural-quiz-data';

export type QuizMode = ExperienceLevel;

interface StableQuizInterfaceProps {
  mode: QuizMode;
  onQuizComplete: (responses: any[]) => void;
  onProgressUpdate?: (progress: { current: number; total: number }) => void;
  isSubmitting?: boolean;
}

/**
 * Stable Quiz Interface - No React Hook Form
 *
 * Uses plain React state management for maximum stability.
 * Eliminates infinite re-render loops and form validation complexity.
 */
export function StableQuizInterface({
  mode,
  onQuizComplete,
  onProgressUpdate,
  isSubmitting = false,
}: StableQuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simple state for current selections
  const [singleSelection, setSingleSelection] = useState<string>('');
  const [multipleSelections, setMultipleSelections] = useState<string[]>([]);

  const quizData = getNaturalQuizData(mode);
  const questions = quizData.questions;
  const currentQuestion = questions[currentQuestionIndex];

  const progress = {
    current: currentQuestionIndex + 1,
    total: questions.length,
  };
  const progressPercent = (progress.current / progress.total) * 100;

  // Reset selections when question changes
  React.useEffect(() => {
    setSingleSelection('');
    setMultipleSelections([]);

    if (onProgressUpdate) {
      onProgressUpdate(progress);
    }
  }, [currentQuestionIndex]);

  const handleSingleOptionClick = (value: string) => {
    // Prevent duplicate submissions
    if (isSubmitting || isProcessing) return;

    setSingleSelection(value);

    // Immediate proceed for single selection
    const newResponse = {
      question_id: currentQuestion.id,
      answer_value: value,
      experience_level: mode,
      timestamp: new Date().toISOString(),
    };

    proceedToNext(newResponse);
  };

  const handleMultipleToggle = (value: string, checked: boolean) => {
    if (!currentQuestion) return;

    let newSelections: string[];
    if (checked) {
      newSelections = [...multipleSelections, value];

      // Check max selections
      if (newSelections.length > (currentQuestion.maxSelections || 8)) {
        return;
      }
    } else {
      newSelections = multipleSelections.filter(s => s !== value);
    }

    setMultipleSelections(newSelections);
  };

  const handleMultipleContinue = () => {
    // Prevent duplicate submissions
    if (isSubmitting || isProcessing) return;

    if (
      !currentQuestion ||
      multipleSelections.length < (currentQuestion.minSelections || 1)
    ) {
      return;
    }

    const newResponse = {
      question_id: currentQuestion.id,
      answer_value: multipleSelections.join(','),
      answer_metadata: { selections: multipleSelections },
      experience_level: mode,
      timestamp: new Date().toISOString(),
    };

    proceedToNext(newResponse);
  };

  const proceedToNext = (newResponse: any) => {
    // Prevent double processing
    if (isProcessing) return;

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);

    if (currentQuestionIndex >= questions.length - 1) {
      // Quiz complete - set processing state immediately
      setIsProcessing(true);
      onQuizComplete(updatedResponses);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Get mode-specific styling
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

  if (!currentQuestion) {
    return null;
  }

  const modeConfig = getModeConfig();
  const isMultipleChoice = currentQuestion.allowMultiple;

  return (
    <div className='max-w-2xl mx-auto'>
      {/* Progress Bar */}
      <div className='mb-8'>
        <div className='flex justify-between text-sm text-muted-foreground mb-2'>
          <span>
            Question {currentQuestionIndex + 1} of {questions.length}
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
      <div className='text-center mb-6'>
        <Badge className={modeConfig.badgeColor}>{modeConfig.badge}</Badge>
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className='py-8'>
          <h2 className='text-2xl font-semibold text-center mb-8'>
            {currentQuestion.text}
          </h2>

          {isMultipleChoice ? (
            // Multiple Selection Interface
            <div className='space-y-4'>
              <p className='text-center text-muted-foreground mb-6'>
                Pick what sounds nice - you can choose multiple
              </p>

              {currentQuestion.options.map(option => {
                const isSelected = multipleSelections.includes(option.value);

                return (
                  <div
                    key={option.value}
                    className={`w-full p-4 border-2 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : `border-gray-200 ${modeConfig.buttonStyle}`
                    } ${
                      isSubmitting || isProcessing
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer'
                    }`}
                    onClick={() =>
                      !isSubmitting &&
                      !isProcessing &&
                      handleMultipleToggle(option.value, !isSelected)
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

              {/* Continue Button for Multiple Selection */}
              <div className='mt-6 text-center'>
                <Button
                  onClick={handleMultipleContinue}
                  disabled={
                    multipleSelections.length <
                      (currentQuestion.minSelections || 1) ||
                    isSubmitting ||
                    isProcessing
                  }
                  className='px-8 py-3'
                >
                  Continue with {multipleSelections.length}{' '}
                  {multipleSelections.length === 1 ? 'choice' : 'choices'}
                </Button>
                <p className='text-xs text-muted-foreground mt-2'>
                  {multipleSelections.length}/
                  {currentQuestion.maxSelections || 3} selected
                  {currentQuestion.minSelections &&
                    ` (minimum ${currentQuestion.minSelections})`}
                </p>
              </div>
            </div>
          ) : (
            // Single Selection Interface
            <div className='space-y-4'>
              {currentQuestion.options.map(option => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => handleSingleOptionClick(option.value)}
                  disabled={isSubmitting || isProcessing}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 group transform hover:scale-[1.02] active:scale-[0.98] border-gray-200 ${modeConfig.buttonStyle} ${
                    isSubmitting || isProcessing
                      ? 'cursor-not-allowed opacity-50'
                      : ''
                  }`}
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
          )}
        </CardContent>
      </Card>

      {/* Encouragement */}
      <div className='mt-8 text-center text-sm text-muted-foreground'>
        <p>{modeConfig.encouragement}</p>
      </div>
    </div>
  );
}
