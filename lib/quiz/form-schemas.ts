import { z } from 'zod';

/**
 * Quiz Form Validation Schemas
 *
 * Defines zod schemas for all quiz forms to ensure type safety
 * and validation consistency across the application.
 */

// Gender preference schema
export const genderPreferenceSchema = z.object({
  gender: z.enum(['men', 'women', 'unisex'], {
    required_error: 'Please select a fragrance category',
    invalid_type_error: 'Please select a valid fragrance category',
  }),
});

export type GenderPreferenceFormData = z.infer<typeof genderPreferenceSchema>;

// Experience level schema
export const experienceLevelSchema = z.object({
  experience: z.enum(['beginner', 'enthusiast', 'experienced'], {
    required_error: 'Please select your experience level',
    invalid_type_error: 'Please select a valid experience level',
  }),
});

export type ExperienceLevelFormData = z.infer<typeof experienceLevelSchema>;

// Single quiz question schema (for simple single-choice questions)
export const singleQuestionSchema = z.object({
  answer: z.string().min(1, 'Please select an answer'),
});

export type SingleQuestionFormData = z.infer<typeof singleQuestionSchema>;

// Multiple choice question schema (for questions allowing multiple selections)
export const multipleQuestionSchema = z.object({
  answers: z
    .array(z.string())
    .min(1, 'Please select at least one option')
    .max(8, 'Please select no more than 8 options'),
});

export type MultipleQuestionFormData = z.infer<typeof multipleQuestionSchema>;

// Complete quiz response schema
export const quizResponseSchema = z.object({
  question_id: z.string().min(1, 'Question ID is required'),
  answer_value: z.string().min(1, 'Answer is required'),
  answer_metadata: z.record(z.any()).optional(),
  experience_level: z
    .enum(['beginner', 'enthusiast', 'experienced'])
    .optional(),
  timestamp: z.string().datetime(),
});

export type QuizResponseData = z.infer<typeof quizResponseSchema>;

// Quiz session schema
export const quizSessionSchema = z.object({
  session_token: z.string().min(1, 'Session token is required'),
  gender_preference: z.enum(['men', 'women']).optional(),
  experience_level: z
    .enum(['beginner', 'enthusiast', 'experienced'])
    .optional(),
  responses: z
    .array(quizResponseSchema)
    .min(1, 'At least one response is required'),
});

export type QuizSessionData = z.infer<typeof quizSessionSchema>;

// Simple quiz (like QuizInterface) schema
export const simpleQuizSchema = z.object({
  responses: z
    .array(
      z.object({
        question_id: z.string(),
        answer_value: z.string(),
        timestamp: z.string(),
      })
    )
    .min(5, 'All questions must be answered'),
});

export type SimpleQuizFormData = z.infer<typeof simpleQuizSchema>;

// Form validation helpers
export const createQuestionValidation = (
  allowMultiple: boolean,
  minSelections: number = 1,
  maxSelections: number = 8
) => {
  if (allowMultiple) {
    return z.object({
      selections: z
        .array(z.string())
        .min(
          minSelections,
          `Please select at least ${minSelections} option${minSelections > 1 ? 's' : ''}`
        )
        .max(
          maxSelections,
          `Please select no more than ${maxSelections} options`
        ),
    });
  } else {
    return z.object({
      selection: z.string().min(1, 'Please make a selection'),
    });
  }
};

// Utility function to validate quiz step data
export const validateQuizStep = (step: string, data: any) => {
  switch (step) {
    case 'gender':
      return genderPreferenceSchema.safeParse(data);
    case 'experience':
      return experienceLevelSchema.safeParse(data);
    case 'single-question':
      return singleQuestionSchema.safeParse(data);
    case 'multiple-question':
      return multipleQuestionSchema.safeParse(data);
    default:
      return { success: false, error: { message: 'Unknown quiz step' } };
  }
};
