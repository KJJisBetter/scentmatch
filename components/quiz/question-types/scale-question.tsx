'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { ChevronRight } from 'lucide-react';
import { QuizQuestionData, QuestionFormData } from '../quiz-question-types';

interface ScaleQuestionProps {
  question: QuizQuestionData;
  form: UseFormReturn<QuestionFormData>;
}

/**
 * ScaleQuestion Component
 *
 * Renders slider-based scale questions with:
 * - Interactive slider control
 * - Real-time value display
 * - Label markers for context
 * - Accessible slider implementation
 * - Continue button
 */
export function ScaleQuestion({
  question,
  form,
}: ScaleQuestionProps) {
  if (!question.scaleConfig) {
    return (
      <div className="text-center text-red-500">
        Scale configuration is required for scale questions
      </div>
    );
  }

  const { min, max, step, labels } = question.scaleConfig;
  const watchedRating = form.watch('rating') || [min];
  const currentValue = watchedRating[0] || min;

  return (
    <>
      <FormField
        control={form.control}
        name="rating"
        render={({ field }) => (
          <FormItem>
            <div className="space-y-6">
              {/* Slider */}
              <div className="px-4 py-6">
                <FormControl>
                  <Slider
                    min={min}
                    max={max}
                    step={step}
                    value={field.value || [min]}
                    onValueChange={field.onChange}
                    className="w-full"
                    aria-label={`Rating scale from ${min} to ${max}`}
                  />
                </FormControl>
              </div>

              {/* Labels */}
              <div className="flex justify-between text-sm text-muted-foreground px-2">
                {labels.map((label) => (
                  <span 
                    key={label.value} 
                    className="text-center flex-1"
                    role="note"
                    aria-label={`Scale marker: ${label.label} at value ${label.value}`}
                  >
                    {label.label}
                  </span>
                ))}
              </div>

              {/* Current Value Display */}
              <div className="text-center">
                <Badge variant="secondary" className="text-base px-4 py-2">
                  Current Rating: {currentValue}
                </Badge>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Continue Button */}
      <div className="pt-4">
        <Button type="submit" className="w-full" size="lg">
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </>
  );
}