/**
 * Quiz Question Types and Interfaces
 * 
 * Defines all types, interfaces, and schemas for the QuizQuestion component system.
 * Supports multiple question types with beginner-friendly features.
 */

import { z } from 'zod';

// Question types enum
export type QuestionType = 'single-choice' | 'multiple-choice' | 'scale' | 'text-input';

// Option interface for choice questions
export interface QuestionOption {
  value: string;
  text: string;
  emoji?: string;
  tooltip?: string;
}

// Tooltip for fragrance terms
export interface FragranceTerm {
  term: string;
  definition: string;
}

// Scale configuration for slider questions
export interface ScaleConfig {
  min: number;
  max: number;
  step: number;
  labels: { value: number; label: string }[];
}

// Text input configuration
export interface TextConfig {
  placeholder: string;
  maxLength?: number;
  multiline?: boolean;
}

// Main question interface
export interface QuizQuestionData {
  id: string;
  type: QuestionType;
  text: string;
  subtext?: string;
  options?: QuestionOption[];
  scaleConfig?: ScaleConfig;
  textConfig?: TextConfig;
  fragranceTerms?: FragranceTerm[];
  required?: boolean;
}

// Answer response interface
export interface QuizAnswerResponse {
  questionId: string;
  questionType: QuestionType;
  answer: string | string[] | number;
  timestamp: string;
}

// Props interface for QuizQuestion component
export interface QuizQuestionProps {
  question: QuizQuestionData;
  onAnswer: (answer: QuizAnswerResponse) => void;
  progress?: number;
  questionNumber?: number;
  totalQuestions?: number;
}

// Dynamic form schemas based on question type
export const createQuestionSchema = (question: QuizQuestionData) => {
  switch (question.type) {
    case 'single-choice':
      return z.object({
        answer: z.string().min(1, 'Please select an option'),
      });
    case 'multiple-choice':
      return z.object({
        answers: z
          .array(z.string())
          .min(1, 'Please select at least one option')
          .max(5, 'Please select no more than 5 options'),
      });
    case 'scale':
      return z.object({
        rating: z.array(z.number()).min(1, 'Please set a rating'),
      });
    case 'text-input':
      return z.object({
        text: z
          .string()
          .min(1, 'Please provide an answer')
          .max(question.textConfig?.maxLength || 500, 'Answer too long'),
      });
    default:
      return z.object({});
  }
};

// Form data type
export type QuestionFormData = {
  answer?: string;
  answers?: string[];
  rating?: number[];
  text?: string;
};

// Default values helper
export function getDefaultValues(type: QuestionType, scaleConfig?: ScaleConfig): QuestionFormData {
  switch (type) {
    case 'single-choice':
      return { answer: '' };
    case 'multiple-choice':
      return { answers: [] };
    case 'scale':
      return { rating: [scaleConfig?.min || 1] };
    case 'text-input':
      return { text: '' };
    default:
      return {};
  }
}