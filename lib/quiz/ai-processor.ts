/**
 * Quiz AI Processing Module
 * Extracted from /api/quiz/route.ts to comply with 200-line rule
 */

import { UnifiedRecommendationEngine } from '@/lib/ai-sdk/unified-recommendation-engine';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface QuizProcessingResult {
  success: boolean;
  recommendations?: any[];
  error?: string;
  processing_time_ms: number;
  session_token: string;
}

export interface QuizRequestData {
  responses: Array<{
    question_id: string;
    answer_value: string;
    answer?: string;
  }>;
  session_token?: string;
  user_id?: string;
  experience_level?: string;
  quiz_version?: string;
}

export class QuizAIProcessor {
  constructor(private supabase: SupabaseClient) {}

  async processQuizRecommendations(
    data: QuizRequestData
  ): Promise<QuizProcessingResult> {
    const startTime = performance.now();

    try {
      // Initialize AI engine with hybrid strategy for best performance
      const engine = new UnifiedRecommendationEngine(
        this.supabase as any,
        'hybrid'
      );

      // Transform responses to the expected format
      const quizResponses = data.responses.map(r => ({
        question_id: r.question_id,
        answer: r.answer_value || r.answer || '',
      }));

      // Process recommendations using the unified engine
      const result = await engine.generateRecommendations({
        strategy: 'hybrid',
        quizResponses,
        limit: 10,
        sessionToken: data.session_token,
        userId: data.user_id,
        adaptiveExplanations: true,
      });

      const processingTime = performance.now() - startTime;

      if (
        !result.success ||
        !result.recommendations ||
        result.recommendations.length === 0
      ) {
        return {
          success: false,
          error: 'Failed to generate sufficient recommendations',
          processing_time_ms: processingTime,
          session_token: data.session_token || '',
        };
      }

      return {
        success: true,
        recommendations: result.recommendations,
        processing_time_ms: processingTime,
        session_token: data.session_token || '',
      };
    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error('Quiz AI processing error:', error);

      return {
        success: false,
        error: 'AI recommendation engine failed',
        processing_time_ms: processingTime,
        session_token: data.session_token || '',
      };
    }
  }

  validateGenderPreference(responses: any[]): boolean {
    return responses.some(
      (r: any) =>
        r.question_id === 'gender_preference' &&
        r.answer_value &&
        ['men', 'women', 'unisex'].includes(r.answer_value)
    );
  }
}
