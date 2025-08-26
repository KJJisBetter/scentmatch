'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { InfoIcon, ChevronRight } from 'lucide-react';
import { QuizQuestionData, QuestionFormData } from '../quiz-question-types';

interface MultipleChoiceQuestionProps {
  question: QuizQuestionData;
  form: UseFormReturn<QuestionFormData>;
}

/**
 * MultipleChoiceQuestion Component
 *
 * Renders checkbox-style multiple choice questions with:
 * - Multi-select functionality
 * - Educational tooltips
 * - Visual feedback for selections
 * - Continue button when selections are made
 * - Accessibility support
 */
export function MultipleChoiceQuestion({
  question,
  form,
}: MultipleChoiceQuestionProps) {
  const watchedAnswers = form.watch('answers') || [];
  const hasSelections = watchedAnswers.length > 0;

  return (
    <>
      <FormField
        control={form.control}
        name="answers"
        render={() => (
          <FormItem>
            <div className="space-y-3">
              {question.options?.map((option) => (
                <FormField
                  key={option.value}
                  control={form.control}
                  name="answers"
                  render={({ field }) => {
                    const isChecked = field.value?.includes(option.value) || false;
                    
                    return (
                      <FormItem className={`flex items-center space-x-3 border-2 rounded-lg p-4 transition-all duration-200 ${
                        isChecked 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}>
                        <FormControl>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const currentValues = field.value || [];
                              if (checked) {
                                field.onChange([...currentValues, option.value]);
                              } else {
                                field.onChange(
                                  currentValues.filter((value: string) => value !== option.value)
                                );
                              }
                            }}
                            aria-describedby={option.tooltip ? `tooltip-${option.value}` : undefined}
                          />
                        </FormControl>
                        <div className="flex-1 flex items-center space-x-3">
                          {option.emoji && (
                            <div className="text-xl flex-shrink-0" aria-hidden="true">
                              {option.emoji}
                            </div>
                          )}
                          <FormLabel className="cursor-pointer font-medium flex-1 text-left">
                            {option.text}
                          </FormLabel>
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
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Continue Button */}
      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={!hasSelections}
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
        {!hasSelections && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            Please select at least one option to continue
          </p>
        )}
      </div>
    </>
  );
}