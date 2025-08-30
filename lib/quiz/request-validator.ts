/**
 * Quiz Request Validation Module
 * Extracted from /api/quiz/route.ts to comply with 200-line rule
 */

import {
  quizAnalyzeSchema,
  validateApiInput,
} from '@/lib/validation/api-schemas';

export interface ValidationResult {
  success: boolean;
  data?: any;
  error?: any;
}

export interface ValidationErrorResponse {
  error: string;
  details: any;
  error_code: string;
  user_message?: string;
  recovery_action?: {
    type: string;
    step: string;
    message: string;
  };
}

export class QuizRequestValidator {
  static validateQuizRequest(rawBody: any): ValidationResult {
    try {
      const validation = validateApiInput(quizAnalyzeSchema, rawBody);

      if (!validation.success) {
        return {
          success: false,
          error: validation.error,
        };
      }

      return {
        success: true,
        data: validation.data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Request parsing failed',
      };
    }
  }

  static validateGenderPreference(responses: any[]): {
    valid: boolean;
    error?: ValidationErrorResponse;
  } {
    const hasGenderResponse = responses.some(
      (r: any) =>
        r.question_id === 'gender_preference' &&
        r.answer_value &&
        ['men', 'women', 'unisex'].includes(r.answer_value)
    );

    if (!hasGenderResponse) {
      return {
        valid: false,
        error: {
          error:
            'Gender preference is required for personalized recommendations',
          error_code: 'MISSING_GENDER_PREFERENCE',
          details: 'No valid gender preference found in responses',
          user_message:
            'Please select your fragrance preference (For Men, For Women, or Unisex) to get personalized recommendations.',
          recovery_action: {
            type: 'restart_quiz',
            step: 'gender_selection',
            message: 'Start over and select your gender preference first',
          },
        },
      };
    }

    return { valid: true };
  }

  static getQuestionTextMap(): Record<string, string> {
    return {
      style: 'What fragrances do you enjoy most?',
      occasions: 'When do you most want to smell amazing?',
      preferences: 'Which scent style appeals to you most?',
      intensity: 'How noticeable do you want your fragrance to be?',
      budget: 'How do you like to discover new fragrances?',
      gender_preference: 'What type of fragrances interest you?',
      experience_level: "What's your experience with fragrances?",
      scent_preferences_enthusiast:
        'What kinds of scents do you gravitate toward?',
      personality_style: 'How would you describe your style?',
      occasions_enthusiast: 'What occasions are important to you?',
      seasons_vibe: 'What season/vibe speaks to you most?',
      scent_preferences_beginner: 'What kinds of scents appeal to you?',
      occasions_beginner: 'When would you wear fragrance?',
    };
  }
}
