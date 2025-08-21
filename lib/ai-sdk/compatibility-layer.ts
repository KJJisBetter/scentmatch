/**
 * Compatibility Layer for Unified Recommendation Engine
 *
 * Provides the same interfaces as the old quiz engines to ensure
 * API compatibility while using the new unified system underneath.
 *
 * This allows gradual migration without breaking existing endpoints.
 */

import { createServerSupabase } from '@/lib/supabase';
import {
  UnifiedRecommendationEngine,
  type UnifiedRecommendationRequest,
} from './unified-recommendation-engine';
import { nanoid } from 'nanoid';

// Legacy interfaces that need to be maintained
export interface LegacyQuizResponse {
  question_id: string;
  answer_value: string;
  answer?: string;
  timestamp?: string;
  experience_level?: string;
}

export interface LegacyFragranceRecommendation {
  id: string;
  name: string;
  brand: string;
  image_url?: string;
  sample_price_usd: number;
  match_percentage: number;
  ai_insight: string;
  reasoning: string;
  confidence_level: 'high' | 'medium' | 'good';
  why_recommended: string;
  sample_available: boolean;
  fragrance_id?: string;
  score?: number;
  explanation?: string;
}

export interface LegacyRecommendationResult {
  recommendations: LegacyFragranceRecommendation[];
  quiz_session_token: string;
  total_processing_time_ms: number;
  recommendation_method: string;
  success: boolean;
  personality_analysis?: any;
}

/**
 * DirectDatabaseEngine Compatibility
 * Replaces lib/quiz/direct-database-engine.ts
 */
export class DirectDatabaseEngine {
  private unifiedEngine: UnifiedRecommendationEngine | null = null;

  private async getUnifiedEngine(): Promise<UnifiedRecommendationEngine> {
    if (!this.unifiedEngine) {
      const supabase = await createServerSupabase();
      this.unifiedEngine = new UnifiedRecommendationEngine(
        supabase,
        'database'
      );
    }
    return this.unifiedEngine;
  }

  async generateRecommendations(
    responses: LegacyQuizResponse[],
    sessionToken?: string
  ): Promise<LegacyRecommendationResult> {
    try {
      // Get the unified engine (handling async supabase creation)
      const unifiedEngine = await this.getUnifiedEngine();

      // Convert legacy responses to new format
      const unifiedRequest: UnifiedRecommendationRequest = {
        strategy: 'database',
        quizResponses: responses.map(r => ({
          question_id: r.question_id,
          answer: r.answer_value || r.answer || '',
          timestamp: r.timestamp,
        })),
        sessionToken,
        limit: 10,
      };

      const result =
        await unifiedEngine.generateRecommendations(unifiedRequest);

      // Convert back to legacy format
      const legacyRecommendations: LegacyFragranceRecommendation[] =
        result.recommendations.map(rec => ({
          id: rec.fragrance_id,
          fragrance_id: rec.fragrance_id,
          name: rec.name,
          brand: rec.brand,
          image_url: rec.image_url,
          sample_price_usd: rec.sample_price_usd || 15,
          match_percentage: Math.round(rec.score * 100),
          ai_insight: rec.explanation,
          reasoning: rec.why_recommended,
          confidence_level:
            rec.confidence_level === 'low'
              ? 'medium'
              : (rec.confidence_level as 'high' | 'medium' | 'good'),
          why_recommended: rec.why_recommended,
          sample_available: rec.sample_available,
          score: rec.score,
          explanation: rec.explanation,
        }));

      return {
        recommendations: legacyRecommendations,
        quiz_session_token:
          result.quiz_session_token || sessionToken || `quiz-${nanoid(10)}`,
        total_processing_time_ms: result.processing_time_ms,
        recommendation_method: result.recommendation_method,
        success: result.success,
        personality_analysis: result.personality_analysis,
      };
    } catch (error) {
      console.error('DirectDatabaseEngine compatibility error:', error);

      return {
        recommendations: [],
        quiz_session_token: sessionToken || `quiz-${nanoid(10)}`,
        total_processing_time_ms: 100,
        recommendation_method: 'error_fallback',
        success: false,
      };
    }
  }
}

/**
 * DatabaseRecommendationEngine Compatibility
 * Replaces lib/quiz/database-recommendation-engine.ts
 */
export class DatabaseRecommendationEngine {
  private unifiedEngine: UnifiedRecommendationEngine | null = null;

  private async getUnifiedEngine(): Promise<UnifiedRecommendationEngine> {
    if (!this.unifiedEngine) {
      const supabase = await createServerSupabase();
      this.unifiedEngine = new UnifiedRecommendationEngine(
        supabase,
        'database'
      );
    }
    return this.unifiedEngine;
  }

  async generateRecommendations(
    responses: LegacyQuizResponse[],
    options?: { limit?: number; sessionToken?: string }
  ): Promise<LegacyRecommendationResult> {
    const unifiedEngine = await this.getUnifiedEngine();

    const unifiedRequest: UnifiedRecommendationRequest = {
      strategy: 'database', // Use database strategy for compatibility
      quizResponses: responses.map(r => ({
        question_id: r.question_id,
        answer: r.answer_value || r.answer || '',
        timestamp: r.timestamp,
      })),
      sessionToken: options?.sessionToken,
      limit: options?.limit || 10,
    };

    const result = await unifiedEngine.generateRecommendations(unifiedRequest);

    // Convert to legacy format
    const legacyRecommendations: LegacyFragranceRecommendation[] =
      result.recommendations.map(rec => ({
        id: rec.fragrance_id,
        fragrance_id: rec.fragrance_id,
        name: rec.name,
        brand: rec.brand,
        image_url: rec.image_url,
        sample_price_usd: rec.sample_price_usd || 15,
        match_percentage: Math.round(rec.score * 100),
        ai_insight: rec.explanation,
        reasoning: rec.why_recommended,
        confidence_level:
          rec.confidence_level === 'low'
            ? 'medium'
            : (rec.confidence_level as 'high' | 'medium' | 'good'),
        why_recommended: rec.why_recommended,
        sample_available: rec.sample_available,
        score: rec.score,
        explanation: rec.explanation,
      }));

    return {
      recommendations: legacyRecommendations,
      quiz_session_token: result.quiz_session_token || `quiz-${nanoid(10)}`,
      total_processing_time_ms: result.processing_time_ms,
      recommendation_method: result.recommendation_method,
      success: result.success,
      personality_analysis: result.personality_analysis,
    };
  }
}

/**
 * WorkingRecommendationEngine Compatibility
 * Replaces lib/quiz/working-recommendation-engine.ts
 */
export class WorkingRecommendationEngine {
  private unifiedEngine: UnifiedRecommendationEngine | null = null;

  private async getUnifiedEngine(): Promise<UnifiedRecommendationEngine> {
    if (!this.unifiedEngine) {
      const supabase = await createServerSupabase();
      this.unifiedEngine = new UnifiedRecommendationEngine(supabase, 'ai');
    }
    return this.unifiedEngine;
  }

  async generateRecommendations(
    responses: LegacyQuizResponse[],
    options?: { enhanceWithAI?: boolean; limit?: number }
  ): Promise<LegacyRecommendationResult> {
    const unifiedEngine = await this.getUnifiedEngine();
    const strategy = options?.enhanceWithAI ? 'ai' : 'hybrid';

    const unifiedRequest: UnifiedRecommendationRequest = {
      strategy,
      quizResponses: responses.map(r => ({
        question_id: r.question_id,
        answer: r.answer_value || r.answer || '',
        timestamp: r.timestamp,
      })),
      limit: options?.limit || 10,
    };

    const result = await unifiedEngine.generateRecommendations(unifiedRequest);

    // Convert to legacy format
    const legacyRecommendations: LegacyFragranceRecommendation[] =
      result.recommendations.map(rec => ({
        id: rec.fragrance_id,
        fragrance_id: rec.fragrance_id,
        name: rec.name,
        brand: rec.brand,
        image_url: rec.image_url,
        sample_price_usd: rec.sample_price_usd || 15,
        match_percentage: Math.round(rec.score * 100),
        ai_insight: rec.explanation,
        reasoning: rec.why_recommended,
        confidence_level:
          rec.confidence_level === 'low'
            ? 'medium'
            : (rec.confidence_level as 'high' | 'medium' | 'good'),
        why_recommended: rec.why_recommended,
        sample_available: rec.sample_available,
        score: rec.score,
        explanation: rec.explanation,
      }));

    return {
      recommendations: legacyRecommendations,
      quiz_session_token: result.quiz_session_token || `quiz-${nanoid(10)}`,
      total_processing_time_ms: result.processing_time_ms,
      recommendation_method: result.recommendation_method,
      success: result.success,
      personality_analysis: result.personality_analysis,
    };
  }
}

/**
 * QuizEngine Compatibility
 * Replaces lib/quiz/quiz-engine.ts
 */
export class QuizEngine {
  private unifiedEngine: UnifiedRecommendationEngine | null = null;

  private async getUnifiedEngine(): Promise<UnifiedRecommendationEngine> {
    if (!this.unifiedEngine) {
      const supabase = await createServerSupabase();
      this.unifiedEngine = new UnifiedRecommendationEngine(supabase, 'hybrid');
    }
    return this.unifiedEngine;
  }

  async analyzeQuizAndGenerateRecommendations(
    responses: LegacyQuizResponse[],
    userId?: string
  ): Promise<LegacyRecommendationResult> {
    const unifiedEngine = await this.getUnifiedEngine();

    const unifiedRequest: UnifiedRecommendationRequest = {
      strategy: 'hybrid',
      quizResponses: responses.map(r => ({
        question_id: r.question_id,
        answer: r.answer_value || r.answer || '',
        timestamp: r.timestamp,
      })),
      limit: 12,
    };

    const result = await unifiedEngine.generateRecommendations(unifiedRequest);

    // Convert to legacy format
    const legacyRecommendations: LegacyFragranceRecommendation[] =
      result.recommendations.map(rec => ({
        id: rec.fragrance_id,
        fragrance_id: rec.fragrance_id,
        name: rec.name,
        brand: rec.brand,
        image_url: rec.image_url,
        sample_price_usd: rec.sample_price_usd || 15,
        match_percentage: Math.round(rec.score * 100),
        ai_insight: rec.explanation,
        reasoning: rec.why_recommended,
        confidence_level:
          rec.confidence_level === 'low'
            ? 'medium'
            : (rec.confidence_level as 'high' | 'medium' | 'good'),
        why_recommended: rec.why_recommended,
        sample_available: rec.sample_available,
        score: rec.score,
        explanation: rec.explanation,
      }));

    return {
      recommendations: legacyRecommendations,
      quiz_session_token: result.quiz_session_token || `quiz-${nanoid(10)}`,
      total_processing_time_ms: result.processing_time_ms,
      recommendation_method: result.recommendation_method,
      success: result.success,
      personality_analysis: result.personality_analysis,
    };
  }
}

// Export compatibility functions for existing code that imports directly
export function createDirectDatabaseEngine(): DirectDatabaseEngine {
  return new DirectDatabaseEngine();
}

export function createDatabaseRecommendationEngine(): DatabaseRecommendationEngine {
  return new DatabaseRecommendationEngine();
}

export function createWorkingRecommendationEngine(): WorkingRecommendationEngine {
  return new WorkingRecommendationEngine();
}

export function createQuizEngine(): QuizEngine {
  return new QuizEngine();
}
