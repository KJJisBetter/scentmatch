/**
 * Quiz Session Storage Module
 * Extracted from /api/quiz/route.ts to comply with 200-line rule
 */

import { nanoid } from 'nanoid';
import type { SupabaseClient } from '@supabase/supabase-js';
import { QuizRequestValidator } from './request-validator';

export interface SessionStorageResult {
  success: boolean;
  session_id?: string;
  session_token: string;
  error?: string;
}

export class QuizSessionStorage {
  constructor(private supabase: SupabaseClient) {}

  async storeQuizSession(
    sessionToken: string,
    userId?: string
  ): Promise<SessionStorageResult> {
    try {
      const sessionResult = await this.supabase
        .from('user_quiz_sessions')
        .upsert(
          {
            session_token: sessionToken,
            is_guest_session: !userId,
            user_id: userId || null,
            is_completed: true,
            created_at: new Date().toISOString(),
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          { onConflict: 'session_token' }
        )
        .select('id');

      if (sessionResult.error) {
        console.error('Session storage error:', sessionResult.error);
        return {
          success: false,
          session_token: sessionToken,
          error: 'Failed to store quiz session',
        };
      }

      return {
        success: true,
        session_id: sessionResult.data[0]?.id,
        session_token: sessionToken,
      };
    } catch (error) {
      console.error('Session storage exception:', error);
      return {
        success: false,
        session_token: sessionToken,
        error: 'Session storage failed',
      };
    }
  }

  async storeQuizResponses(
    sessionId: string,
    responses: any[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const questionTextMap = QuizRequestValidator.getQuestionTextMap();

      const responsesToStore = responses.map((r: any) => ({
        session_id: sessionId,
        question_id: r.question_id,
        question_text: questionTextMap[r.question_id] || r.question_id,
        question_type: 'multiple_choice',
        answer_value: r.answer_value || r.answer,
        response_time_ms: 5000, // Default
        created_at: new Date().toISOString(),
      }));

      const { error } = await this.supabase
        .from('user_quiz_responses')
        .upsert(responsesToStore, { onConflict: 'session_id,question_id' });

      if (error) {
        console.error('Response storage error:', error);
        return {
          success: false,
          error: 'Failed to store quiz responses',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Response storage exception:', error);
      return {
        success: false,
        error: 'Response storage failed',
      };
    }
  }

  static generateSessionToken(): string {
    return `quiz-${Date.now()}-${nanoid(9)}`;
  }
}
