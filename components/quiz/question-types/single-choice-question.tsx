'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { InfoIcon, ChevronRight } from 'lucide-react';
import { QuizQuestionData, QuestionFormData } from '../quiz-question-types';

interface SingleChoiceQuestionProps {
  question: QuizQuestionData;
  form: UseFormReturn<QuestionFormData>;
  onOptionClick: (value: string) => void;
}

/**
 * SingleChoiceQuestion Component
 *
 * Renders radio-button style single choice questions with:
 * - Click-to-select functionality
 * - Educational tooltips
 * - Visual feedback and animations
 * - Mobile-optimized touch targets
 */
export function SingleChoiceQuestion({
  question,
  form,
  onOptionClick,
}: SingleChoiceQuestionProps) {
  return (
    <FormField
      control={form.control}
      name="answer"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <div className="space-y-3">
              {question.options?.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onOptionClick(option.value)}
                  className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  aria-describedby={option.tooltip ? `tooltip-${option.value}` : undefined}
                >
                  <div className="flex items-center space-x-4">
                    {option.emoji && (
                      <div className="text-2xl flex-shrink-0" aria-hidden="true">
                        {option.emoji}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium group-hover:text-purple-700 text-left">
                          {option.text}
                        </span>
                        {option.tooltip && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon 
                                className="w-4 h-4 text-blue-500 hover:text-blue-600 flex-shrink-0" 
                                aria-label="Learn more about this option"
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>{option.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <ChevronRight 
                      className="w-5 h-5 text-gray-400 group-hover:text-purple-500 flex-shrink-0" 
                      aria-hidden="true"
                    />
                  </div>
                </button>
              ))}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}