/**
 * Vercel AI SDK Client
 *
 * Main AI client that replaces the complex custom AI implementation
 * Provides embedding generation, text analysis, and recommendation capabilities
 */

import { embed, generateText, generateObject } from 'ai';
import { z } from 'zod';
import {
  AI_MODELS,
  AI_CONFIG,
  PROMPT_TEMPLATES,
  AIRecommendationResponse,
  AIPersonalityResponse,
  AIEmbeddingResponse,
  AIError,
} from './config';

// Validation schemas for AI responses
const RecommendationSchema = z.object({
  fragrance_id: z.string(),
  score: z.number().min(0).max(1),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

const PersonalityAnalysisSchema = z.object({
  personality_type: z.enum(['sophisticated', 'romantic', 'natural', 'classic']),
  confidence: z.number().min(0).max(1),
  traits: z.array(z.string()),
  description: z.string(),
});

/**
 * Main AI SDK Client
 * Replaces all custom AI implementations with modern Vercel AI SDK
 */
export class VercelAIClient {
  /**
   * Generate text embeddings for similarity search
   * Replaces custom embedding generation with OpenAI's embedding model
   */
  async generateEmbedding(text: string): Promise<AIEmbeddingResponse> {
    try {
      const { embedding } = await embed({
        model: AI_MODELS.EMBEDDING,
        value: text,
      });

      return {
        embedding,
        dimensions: AI_CONFIG.EMBEDDING.dimensions,
      };
    } catch (error) {
      throw new AIError(
        'Failed to generate embedding',
        'EMBEDDING_FAILED',
        error as Error
      );
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * More efficient than individual calls for large datasets
   */
  async generateEmbeddingsBatch(
    texts: string[]
  ): Promise<AIEmbeddingResponse[]> {
    try {
      const results: AIEmbeddingResponse[] = [];

      // Process in batches to avoid rate limits
      for (let i = 0; i < texts.length; i += AI_CONFIG.EMBEDDING.batchSize) {
        const batch = texts.slice(i, i + AI_CONFIG.EMBEDDING.batchSize);

        const embeddings = await Promise.all(
          batch.map(text => this.generateEmbedding(text))
        );

        results.push(...embeddings);
      }

      return results;
    } catch (error) {
      throw new AIError(
        'Failed to generate embeddings batch',
        'BATCH_EMBEDDING_FAILED',
        error as Error
      );
    }
  }

  /**
   * Generate fragrance recommendations with AI reasoning
   * Replaces complex custom recommendation logic
   */
  async generateRecommendations(
    userPreferences: string,
    fragranceData: string,
    limit: number = AI_CONFIG.RECOMMENDATION.defaultLimit
  ): Promise<AIRecommendationResponse[]> {
    try {
      const prompt = `
        ${PROMPT_TEMPLATES.FRAGRANCE_RECOMMENDATION}
        
        User Preferences: ${userPreferences}
        Available Fragrances: ${fragranceData}
        
        Generate ${limit} recommendations with scores (0-1) and reasoning.
        Return as JSON array matching the schema.
      `;

      const { object } = await generateObject({
        model: AI_MODELS.RECOMMENDATION,
        schema: z.array(RecommendationSchema),
        prompt,
        temperature: AI_CONFIG.RECOMMENDATION.temperature,
      });

      return object.slice(0, limit);
    } catch (error) {
      throw new AIError(
        'Failed to generate recommendations',
        'RECOMMENDATION_FAILED',
        error as Error
      );
    }
  }

  /**
   * Analyze user quiz responses to determine personality type
   * Replaces custom personality analysis engines
   */
  async analyzePersonality(
    quizResponses: any[]
  ): Promise<AIPersonalityResponse> {
    try {
      const responsesText = quizResponses
        .map(r => `${r.question_id}: ${r.answer}`)
        .join(', ');

      const prompt = `
        ${PROMPT_TEMPLATES.PERSONALITY_ANALYSIS}
        
        Quiz Responses: ${responsesText}
        
        Analyze these responses and determine the user's fragrance personality.
        Return analysis as JSON matching the schema.
      `;

      const { object } = await generateObject({
        model: AI_MODELS.RECOMMENDATION,
        schema: PersonalityAnalysisSchema,
        prompt,
      });

      return object;
    } catch (error) {
      throw new AIError(
        'Failed to analyze personality',
        'PERSONALITY_ANALYSIS_FAILED',
        error as Error
      );
    }
  }

  /**
   * Generate explanations for recommendations
   * Provides transparent AI reasoning for user trust
   */
  async explainRecommendation(
    fragranceId: string,
    userProfile: string,
    fragranceDetails: string
  ): Promise<string> {
    try {
      const prompt = `
        Explain why this fragrance is recommended for this user:
        
        Fragrance: ${fragranceDetails}
        User Profile: ${userProfile}
        
        Provide a clear, human-readable explanation focusing on:
        - Scent profile match
        - Occasion suitability
        - Personal style alignment
        
        Keep explanation concise but informative.
      `;

      const { text } = await generateText({
        model: AI_MODELS.RECOMMENDATION,
        prompt,
      });

      return text;
    } catch (error) {
      throw new AIError(
        'Failed to explain recommendation',
        'EXPLANATION_FAILED',
        error as Error
      );
    }
  }

  /**
   * Calculate similarity between two text embeddings
   * Utility function for vector similarity search
   */
  calculateCosineSimilarity(
    embedding1: number[],
    embedding2: number[]
  ): number {
    if (embedding1.length !== embedding2.length) {
      throw new AIError(
        'Embeddings must have the same dimensions',
        'DIMENSION_MISMATCH'
      );
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Process user feedback to improve recommendations
   * Simplified feedback processing with AI insights
   */
  async processFeedback(feedbackData: {
    fragrance_id: string;
    feedback_type: string;
    rating?: number;
    user_context: string;
  }): Promise<{
    processed: boolean;
    insights: string;
    learning_impact: number;
  }> {
    try {
      const prompt = `
        Analyze this user feedback to improve future recommendations:
        
        Fragrance: ${feedbackData.fragrance_id}
        Feedback: ${feedbackData.feedback_type}
        Rating: ${feedbackData.rating || 'N/A'}
        Context: ${feedbackData.user_context}
        
        Provide insights about user preferences and estimate learning impact (0-1).
        Format as JSON: { insights: string, learning_impact: number }
      `;

      const { object } = await generateObject({
        model: AI_MODELS.FAST,
        schema: z.object({
          insights: z.string(),
          learning_impact: z.number().min(0).max(1),
        }),
        prompt,
      });

      return {
        processed: true,
        insights: object.insights,
        learning_impact: object.learning_impact,
      };
    } catch (error) {
      throw new AIError(
        'Failed to process feedback',
        'FEEDBACK_PROCESSING_FAILED',
        error as Error
      );
    }
  }

  /**
   * Health check for AI services
   * Verifies that AI models are accessible and working
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: string;
  }> {
    const checks: Record<string, boolean> = {};

    try {
      // Test embedding generation
      const embedding = await this.generateEmbedding('test');
      checks.embedding = embedding.embedding.length > 0;
    } catch {
      checks.embedding = false;
    }

    try {
      // Test text generation
      const result = await generateText({
        model: AI_MODELS.FAST,
        prompt: 'Respond with "OK" if you are working',
      });
      checks.text_generation = result.text.toLowerCase().includes('ok');
    } catch {
      checks.text_generation = false;
    }

    const healthyCount = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalChecks) {
      status = 'healthy';
    } else if (healthyCount > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const aiClient = new VercelAIClient();

// Export types for external use
export type {
  AIRecommendationResponse,
  AIPersonalityResponse,
  AIEmbeddingResponse,
};
