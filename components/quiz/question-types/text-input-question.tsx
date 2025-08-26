'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { ChevronRight } from 'lucide-react';
import { QuizQuestionData, QuestionFormData } from '../quiz-question-types';

interface TextInputQuestionProps {
  question: QuizQuestionData;
  form: UseFormReturn<QuestionFormData>;
}

/**
 * TextInputQuestion Component
 *
 * Renders text input questions with:
 * - Single-line text input
 * - Character count display
 * - Placeholder guidance
 * - Real-time validation
 * - Continue button
 */
export function TextInputQuestion({
  question,
  form,
}: TextInputQuestionProps) {
  if (!question.textConfig) {
    return (
      <div className="text-center text-red-500">
        Text configuration is required for text input questions
      </div>
    );
  }

  const { placeholder, maxLength } = question.textConfig;
  const watchedText = form.watch('text') || '';
  const hasInput = watchedText.trim().length > 0;

  return (
    <>
      <FormField
        control={form.control}
        name="text"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                placeholder={placeholder}
                maxLength={maxLength}
                {...field}
                className="text-base p-4 min-h-[3rem]"
                aria-describedby={maxLength ? 'character-count' : undefined}
              />
            </FormControl>
            <FormMessage />
            
            {/* Character Count */}
            {maxLength && (
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-muted-foreground">
                  Share as much or as little as you'd like
                </p>
                <p 
                  id="character-count"
                  className="text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  {field.value?.length || 0}/{maxLength}
                </p>
              </div>
            )}
          </FormItem>
        )}
      />

      {/* Continue Button */}
      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={!hasInput}
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
        {!hasInput && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            Please provide an answer to continue
          </p>
        )}
      </div>
    </>
  );
}