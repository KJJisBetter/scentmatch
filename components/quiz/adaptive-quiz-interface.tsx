'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, CheckCircle } from 'lucide-react';
import {
  getAdaptiveQuizData,
  type ExperienceLevel,
  type AdaptiveQuizData,
} from '@/lib/quiz/adaptive-question-data';

export type QuizMode = ExperienceLevel;

interface AdaptiveQuizInterfaceProps {
  mode: QuizMode;
  onQuizComplete: (responses: any[]) => void;
  onProgressUpdate?: (progress: { current: number; total: number }) => void;
}

/**
 * AdaptiveQuizInterface Component
 *
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
  const [currentSelections, setCurrentSelections] = useState<string[]>([]);

  const quizData = getAdaptiveQuizData(mode);
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

  // Notify parent of progress updates
  React.useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(progress);
    }
  }, [currentQuestionIndex, onProgressUpdate, progress]);

  const handleAnswerSelect = (answer: string) => {
    if (!currentQuestion) return;

    if (currentQuestion.allowMultiple) {
      // Handle multiple selection
      const newSelections = currentSelections.includes(answer)
        ? currentSelections.filter(s => s !== answer)
        : [...currentSelections, answer];

      // Check max selections
      if (newSelections.length > (currentQuestion.maxSelections || 3)) {
        return;
      }

      setCurrentSelections(newSelections);
    } else {
      // Handle single selection (continue immediately)
      const newResponse = {
        question_id: currentQuestion.id,
        answer_value: answer,
        experience_level: mode,
        timestamp: new Date().toISOString(),
      };

      const updatedResponses = [...responses, newResponse];
      setResponses(updatedResponses);
      setCurrentSelections([]);

      // Track selection
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'quiz_question_answered', {
          question_id: currentQuestion.id,
          answer: answer,
          mode: mode,
          question_number: currentQuestionIndex + 1,
        });
      }

      proceedToNext(updatedResponses);
    }
  };

  const handleMultipleSelectionContinue = () => {
    if (
      !currentQuestion ||
      currentSelections.length < (currentQuestion.minSelections || 1)
    ) {
      return;
    }

    const newResponse = {
      question_id: currentQuestion.id,
      answer_value: currentSelections.join(','),
      answer_metadata: { selections: currentSelections },
      experience_level: mode,
      timestamp: new Date().toISOString(),
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);
    setCurrentSelections([]);

    // Track multiple selection
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'quiz_multiple_selection', {
        question_id: currentQuestion.id,
        selections: currentSelections,
        selection_count: currentSelections.length,
        mode: mode,
        question_number: currentQuestionIndex + 1,
      });
    }

    proceedToNext(updatedResponses);
  };

  const proceedToNext = (updatedResponses: any[]) => {
    if (currentQuestionIndex >= questions.length - 1) {
      // Quiz complete
      onQuizComplete(updatedResponses);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
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
      case 'collector':
        return {
          badge: '🎭 Collector Advanced',
          badgeColor: 'bg-indigo-100 text-indigo-800',
          encouragement:
            '🎭 Sophisticated selections • 💎 Curating your profile • 🌟 Exploring rare finds',
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

          <div className='space-y-4'>
            {currentQuestion.options.map(option => {
              const isSelected =
                currentQuestion.allowMultiple &&
                currentSelections.includes(option.value);

              return (
                <button
                  key={option.value}
                  onClick={() => handleAnswerSelect(option.value)}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 group transform hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50'
                      : `border-gray-200 ${modeConfig.buttonStyle}`
                  }`}
                  style={{ minHeight: '48px' }} // Touch-friendly minimum
                >
                  <div className='flex items-center space-x-4'>
                    <div className='text-2xl'>{option.emoji}</div>
                    <div className='flex-1'>
                      <span
                        className={`font-medium ${isSelected ? 'text-purple-700' : 'group-hover:text-purple-700'}`}
                      >
                        {option.text}
                      </span>
                    </div>
                    {currentQuestion.allowMultiple ? (
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle className='w-3 h-3 text-white' />
                        )}
                      </div>
                    ) : (
                      <ChevronRight className='w-5 h-5 text-gray-400 group-hover:text-purple-500' />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Continue Button for Multiple Selection Questions */}
          {currentQuestion.allowMultiple && (
            <div className='mt-6 text-center'>
              <Button
                onClick={handleMultipleSelectionContinue}
                disabled={
                  currentSelections.length <
                  (currentQuestion.minSelections || 1)
                }
                className='px-8 py-3'
              >
                Continue with {currentSelections.length}{' '}
                {currentSelections.length === 1 ? 'choice' : 'choices'}
              </Button>
              <p className='text-xs text-muted-foreground mt-2'>
                {currentSelections.length}/{currentQuestion.maxSelections || 3}{' '}
                selected
                {currentQuestion.minSelections &&
                  ` (minimum ${currentQuestion.minSelections})`}
              </p>
            </div>
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
