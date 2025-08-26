'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Form } from '@/components/ui/form';
import {
  QuizQuestionProps,
  QuizQuestionData,
  QuestionFormData,
  createQuestionSchema,
  getDefaultValues,
} from './quiz-question-types';
import { SingleChoiceQuestion } from './question-types/single-choice-question';
import { MultipleChoiceQuestion } from './question-types/multiple-choice-question';
import { ScaleQuestion } from './question-types/scale-question';
import { TextInputQuestion } from './question-types/text-input-question';
import { FragranceTermsGlossary } from './components/fragrance-terms-glossary';

/**
 * QuizQuestion Component
 *
 * Supports multiple question types with beginner-friendly features:
 * - Single choice (radio buttons)
 * - Multiple choice (checkboxes) 
 * - Scale/slider ratings
 * - Text input responses
 * - Educational tooltips for fragrance terms
 * - Mobile-first responsive design
 * - Full accessibility support
 */
export function QuizQuestion({
  question,
  onAnswer,
  progress,
  questionNumber,
  totalQuestions,
}: QuizQuestionProps) {
  const schema = createQuestionSchema(question);
  type FormData = QuestionFormData;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(question.type, question.scaleConfig),
  });

  const onSubmit = (data: FormData) => {
    // Normalize answer format for different question types
    let normalizedAnswer: string | string[] | number;
    switch (question.type) {
      case 'single-choice':
        normalizedAnswer = data.answer || '';
        break;
      case 'multiple-choice':
        normalizedAnswer = data.answers || [];
        break;
      case 'scale':
        normalizedAnswer = data.rating?.[0] || 0;
        break;
      case 'text-input':
        normalizedAnswer = data.text || '';
        break;
      default:
        normalizedAnswer = '';
    }
    
    onAnswer({
      questionId: question.id,
      questionType: question.type,
      answer: normalizedAnswer,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSingleChoiceClick = (value: string) => {
    form.setValue('answer' as any, value);
    setTimeout(() => form.handleSubmit(onSubmit)(), 100);
  };

  return (
    <TooltipProvider>
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              {questionNumber && totalQuestions && (
                <span>Question {questionNumber} of {totalQuestions}</span>
              )}
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Question Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl md:text-2xl">{question.text}</CardTitle>
            {question.subtext && (
              <p className="text-muted-foreground mt-2">{question.subtext}</p>
            )}
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {question.type === 'single-choice' && (
                  <SingleChoiceQuestion
                    question={question}
                    form={form}
                    onOptionClick={handleSingleChoiceClick}
                  />
                )}

                {question.type === 'multiple-choice' && (
                  <MultipleChoiceQuestion question={question} form={form} />
                )}

                {question.type === 'scale' && (
                  <ScaleQuestion question={question} form={form} />
                )}

                {question.type === 'text-input' && (
                  <TextInputQuestion question={question} form={form} />
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Beginner-friendly encouragement */}
        <div className="mt-6 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>No wrong answers!</strong> We're here to learn your preferences and find fragrances you'll love.
            </p>
          </div>
        </div>

        {/* Fragrance Terms Glossary */}
        {question.fragranceTerms && question.fragranceTerms.length > 0 && (
          <FragranceTermsGlossary fragranceTerms={question.fragranceTerms} />
        )}
      </div>
    </TooltipProvider>
  );
}