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
  AI_TIMEOUTS,
  PROMPT_TEMPLATES,
  AIRecommendationResponse,
  AIPersonalityResponse,
  AIEmbeddingResponse,
  AIError,
} from './config';
import {
  adaptivePromptEngine,
  type AdaptivePromptConfig,
} from './adaptive-prompts';
import type {
  UserExperienceLevel,
  ExplanationStyle,
} from './user-experience-detector';
import {
  beginnerExplanationEngine,
  type BeginnerExplanationRequest,
  type BeginnerExplanationResult,
} from './beginner-explanation-engine';
import {
  withTimeout,
  DATABASE_FALLBACK,
  AITimeoutError,
} from './timeout-wrapper';

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
   * FIXED: Added timeout handling for production stability
   */
  async generateEmbedding(text: string): Promise<AIEmbeddingResponse> {
    try {
      const embedOperation = embed({
        model: AI_MODELS.EMBEDDING,
        value: text,
      });

      const { embedding } = await withTimeout(embedOperation, {
        timeout: AI_TIMEOUTS.STANDARD,
        operation: 'generateEmbedding',
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
   * FIXED: Added timeout handling for production stability
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

      const recommendOperation = generateObject({
        model: AI_MODELS.RECOMMENDATION,
        schema: z.array(RecommendationSchema),
        prompt,
        temperature: AI_CONFIG.RECOMMENDATION.temperature,
      });

      const { object } = await withTimeout(recommendOperation, {
        timeout: AI_TIMEOUTS.COMPLEX,
        operation: 'generateRecommendations',
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
   * FIXED: Added timeout handling and database fallback for production stability
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

      const personalityOperation = generateObject({
        model: AI_MODELS.RECOMMENDATION,
        schema: PersonalityAnalysisSchema,
        prompt,
      });

      const { object } = await withTimeout(personalityOperation, {
        timeout: AI_TIMEOUTS.FAST,
        operation: 'analyzePersonality',
        fallback: async () => ({ object: DATABASE_FALLBACK.PERSONALITY }),
      });

      return object;
    } catch (error) {
      console.warn(
        'Personality analysis failed, using database fallback:',
        error
      );
      return DATABASE_FALLBACK.PERSONALITY;
    }
  }

  /**
   * Generate explanations for recommendations
   * Provides transparent AI reasoning for user trust
   * FIXED: Added timeout handling and database fallback for production stability
   * @deprecated Use explainRecommendationAdaptive for experience-level aware explanations
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

      const explanationOperation = generateText({
        model: AI_MODELS.RECOMMENDATION,
        prompt,
      });

      const { text } = await withTimeout(explanationOperation, {
        timeout: AI_TIMEOUTS.STANDARD,
        operation: 'explainRecommendation',
        fallback: async () => {
          const fragName =
            fragranceDetails.split(' by ')[0] || 'this fragrance';
          const scentFamily =
            fragranceDetails.match(/\(([^)]+)\)$/)?.[1] || 'fragrance';
          return { text: DATABASE_FALLBACK.EXPLANATION(fragName, scentFamily) };
        },
      });

      return text;
    } catch (error) {
      console.warn('Explanation failed, using database fallback:', error);
      const fragName = fragranceDetails.split(' by ')[0] || 'this fragrance';
      const scentFamily =
        fragranceDetails.match(/\(([^)]+)\)$/)?.[1] || 'fragrance';
      return DATABASE_FALLBACK.EXPLANATION(fragName, scentFamily);
    }
  }

  /**
   * Generate adaptive explanations based on user experience level
   * Solves SCE-66 (verbose explanations) and SCE-67 (beginner education)
   */
  async explainRecommendationAdaptive(
    fragranceId: string,
    userProfile: string,
    fragranceDetails: string,
    experienceLevel: UserExperienceLevel,
    explanationStyle: ExplanationStyle
  ): Promise<{
    explanation: string;
    summary?: string;
    expandedContent?: string;
    educationalTerms?: Record<string, any>;
  }> {
    try {
      // Generate adaptive prompt
      const prompt = adaptivePromptEngine.generateExplanationPrompt({
        experienceLevel,
        explanationStyle,
        fragranceDetails,
        userContext: userProfile,
      });

      // Generate explanation with experience-appropriate complexity
      const { text } = await generateText({
        model: AI_MODELS.RECOMMENDATION,
        prompt,
        maxOutputTokens: this.calculateMaxTokens(explanationStyle.maxWords),
      });

      // Adapt vocabulary for experience level
      const adaptedText = adaptivePromptEngine.adaptVocabulary(
        text,
        experienceLevel
      );

      // Build result object with conditional properties
      const disclosure = explanationStyle.useProgressiveDisclosure
        ? adaptivePromptEngine.generateProgressiveDisclosureSummary(adaptedText)
        : null;

      const terms = explanationStyle.includeEducation
        ? this.extractFragranceTerms(fragranceDetails + ' ' + adaptedText)
        : null;

      const educationalTerms = terms
        ? adaptivePromptEngine.generateEducationalContent(terms)
        : null;

      const result: any = {
        explanation: adaptedText,
        ...(disclosure && {
          summary: disclosure.summary,
          expandedContent: disclosure.expandedContent,
        }),
        ...(educationalTerms && {
          educationalTerms,
        }),
      };

      return result;
    } catch (error) {
      throw new AIError(
        'Failed to generate adaptive explanation',
        'ADAPTIVE_EXPLANATION_FAILED',
        error as Error
      );
    }
  }

  /**
   * Generate beginner-friendly explanations with education
   * Specific implementation for SCE-66 (30-40 word limit)
   * FIXED: Added timeout handling and database fallback for production stability
   */
  async explainForBeginner(
    fragranceId: string,
    userProfile: string,
    fragranceDetails: string,
    includeEducation: boolean = true
  ): Promise<{
    explanation: string;
    summary: string;
    expandedContent?: string;
    educationalTerms?: Record<string, any>;
    confidenceBoost: string;
  }> {
    try {
      // Parse fragrance details
      const { name, brand, scentFamily } =
        this.parseFragranceDetails(fragranceDetails);

      const request: BeginnerExplanationRequest = {
        fragranceId,
        fragranceName: name,
        brand,
        scentFamily,
        userContext: userProfile,
      };

      const beginnerOperation =
        beginnerExplanationEngine.generateExplanation(request);

      const result = await withTimeout(beginnerOperation, {
        timeout: AI_TIMEOUTS.STANDARD,
        operation: 'explainForBeginner',
        fallback: async () =>
          DATABASE_FALLBACK.BEGINNER_EXPLANATION(name, brand),
      });

      return {
        explanation: result.explanation,
        summary: result.summary,
        expandedContent: result.educationalContent.tips.join(' '),
        educationalTerms: result.educationalContent.terms,
        confidenceBoost: result.educationalContent.confidenceBooster,
      };
    } catch (error) {
      console.warn(
        'BeginnerExplanationEngine failed, using database fallback:',
        error
      );

      // Database fallback for complete AI failure
      const { name, brand } = this.parseFragranceDetails(fragranceDetails);
      const fallback = DATABASE_FALLBACK.BEGINNER_EXPLANATION(name, brand);

      return {
        explanation: fallback.explanation,
        summary: fallback.summary,
        expandedContent: fallback.educationalContent.tips.join(' '),
        educationalTerms: fallback.educationalContent.terms,
        confidenceBoost: fallback.educationalContent.confidenceBooster,
      };
    }
  }

  /**
   * Fallback beginner explanation method (uses adaptive prompts)
   */
  private async explainForBeginnerFallback(
    fragranceId: string,
    userProfile: string,
    fragranceDetails: string,
    includeEducation: boolean = true
  ): Promise<{
    explanation: string;
    summary: string;
    expandedContent?: string;
    educationalTerms?: Record<string, any>;
    confidenceBoost: string;
  }> {
    const explanationStyle: ExplanationStyle = {
      maxWords: 35,
      complexity: 'simple',
      includeEducation,
      useProgressiveDisclosure: true,
      vocabularyLevel: 'basic',
    };

    const adaptiveResult = await this.explainRecommendationAdaptive(
      fragranceId,
      userProfile,
      fragranceDetails,
      'beginner',
      explanationStyle
    );

    // Generate confidence-building message
    const confidenceBoost = await this.generateConfidenceBoost(userProfile);

    return {
      ...adaptiveResult,
      confidenceBoost,
    };
  }

  /**
   * Generate confidence-building message for beginners
   */
  private async generateConfidenceBoost(userProfile: string): Promise<string> {
    const prompt = `
      Generate a short, encouraging message for someone new to fragrances.
      Maximum 15 words. Focus on building confidence in their fragrance exploration.
      
      User context: ${userProfile}
      
      Examples:
      - "Trust your instincts - everyone's fragrance journey is unique!"
      - "You're building great taste - every scent teaches you something new!"
      - "Perfect starting point - you'll discover what you love through trying!"
    `;

    const { text } = await generateText({
      model: AI_MODELS.FAST,
      prompt,
      maxOutputTokens: 50,
    });

    return text.trim();
  }

  /**
   * Parse fragrance details string into components
   */
  private parseFragranceDetails(fragranceDetails: string): {
    name: string;
    brand: string;
    scentFamily: string;
  } {
    // Parse format: "Name by Brand (Family)"
    const match = fragranceDetails.match(/(.*?)\s+by\s+(.*?)\s*\(([^)]+)\)/);

    if (match) {
      return {
        name: match[1].trim(),
        brand: match[2].trim(),
        scentFamily: match[3].trim(),
      };
    }

    // Fallback parsing
    const parts = fragranceDetails.split(' ');
    return {
      name: parts[0] || 'Unknown',
      brand: parts[parts.length - 1] || 'Unknown',
      scentFamily: 'fragrance',
    };
  }

  /**
   * Extract fragrance-related terms from text for education
   */
  private extractFragranceTerms(text: string): string[] {
    const fragranceKeywords = [
      'edp',
      'edt',
      'parfum',
      'notes',
      'projection',
      'longevity',
      'sillage',
      'dry down',
      'scent family',
      'fresh',
      'floral',
      'woody',
      'oriental',
      'concentration',
      'olfactory',
      'accord',
      'facet',
      'composition',
    ];

    const lowerText = text.toLowerCase();
    return fragranceKeywords.filter(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );
  }

  /**
   * Calculate max tokens based on word count target
   */
  private calculateMaxTokens(maxWords: number): number {
    // Rough conversion: 1 token ≈ 0.75 words
    return Math.ceil(maxWords / 0.75) + 20; // Add buffer for prompt overhead
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
   * Generate explanations in batch for multiple fragrances (beginner-optimized)
   */
  async generateBeginnerExplanationsBatch(
    requests: Array<{
      fragranceId: string;
      userProfile: string;
      fragranceDetails: string;
    }>
  ): Promise<
    Array<{
      fragranceId: string;
      explanation: string;
      summary: string;
      educationalTerms?: Record<string, any>;
      confidenceBoost: string;
    }>
  > {
    try {
      const beginnerRequests: BeginnerExplanationRequest[] = requests.map(
        req => {
          const { name, brand, scentFamily } = this.parseFragranceDetails(
            req.fragranceDetails
          );
          return {
            fragranceId: req.fragranceId,
            fragranceName: name,
            brand,
            scentFamily,
            userContext: req.userProfile,
          };
        }
      );

      const results =
        await beginnerExplanationEngine.generateBatchExplanations(
          beginnerRequests
        );

      return results.map((result, index) => ({
        fragranceId: requests[index].fragranceId,
        explanation: result.explanation,
        summary: result.summary,
        educationalTerms: result.educationalContent.terms,
        confidenceBoost: result.educationalContent.confidenceBooster,
      }));
    } catch (error) {
      throw new AIError(
        'Failed to generate batch beginner explanations',
        'BATCH_BEGINNER_EXPLANATION_FAILED',
        error as Error
      );
    }
  }

  /**
   * Health check for AI services including beginner explanation engine
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

    try {
      // Test beginner explanation engine
      const testRequest: BeginnerExplanationRequest = {
        fragranceId: 'test',
        fragranceName: 'Test Fragrance',
        brand: 'Test Brand',
        scentFamily: 'fresh',
        userContext: 'new fragrance explorer',
      };

      const result =
        await beginnerExplanationEngine.generateExplanation(testRequest);
      checks.beginner_explanations = result.explanation.length > 0;
    } catch {
      checks.beginner_explanations = false;
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
