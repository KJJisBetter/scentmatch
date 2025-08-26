/**
 * Vercel AI SDK - Main Export
 *
 * Centralized exports for the new AI system that replaces
 * the complex custom implementation with modern libraries
 */

// Main AI client
export { VercelAIClient, aiClient } from './client';

// Unified recommendation engine
export {
  UnifiedRecommendationEngine,
  createUnifiedEngine,
  type RecommendationStrategy,
  type UnifiedRecommendationRequest,
  type UnifiedRecommendationResult,
  type RecommendationItem,
} from './unified-recommendation-engine';

// Experience-level detection and adaptive prompts
export {
  UserExperienceDetector,
  experienceDetector,
  type UserExperienceLevel,
  type ExperienceAnalysis,
  type ExplanationStyle,
} from './user-experience-detector';

export {
  AdaptivePromptEngine,
  adaptivePromptEngine,
  validateBeginnerExplanation,
  FRAGRANCE_EDUCATION,
  VOCABULARY_SIMPLIFICATION,
  ADAPTIVE_PROMPT_TEMPLATES,
  type AdaptivePromptConfig,
  type FragranceEducationTerms,
} from './adaptive-prompts';

// Specialized beginner explanation engine (SCE-66 & SCE-67)
export {
  BeginnerExplanationEngine,
  beginnerExplanationEngine,
  generateBeginnerExplanation,
  type BeginnerExplanationRequest,
  type BeginnerExplanationResult,
} from './beginner-explanation-engine';

// Legacy compatibility layer removed - all code now uses UnifiedRecommendationEngine

// Embedding service
export {
  EmbeddingService,
  embeddingService,
  generateQueryEmbedding,
  generateBatchFragranceEmbeddings,
  generateBatchEmbeddings,
  calculateCosineSimilarity,
  type EmbeddingResponse,
  type BatchEmbeddingResponse,
} from './embedding-service';

// Feedback processing
export {
  FeedbackProcessor,
  RecommendationCache,
  createThompsonSamplingService,
  type FeedbackEvent,
  type BanditFeedbackEvent,
  type FeedbackProcessingResult,
  type FeedbackQualityAssessment,
  type ThompsonSamplingResult,
} from './feedback-processor';

// Search service
export {
  SearchSuggestionEngine,
  QueryProcessor,
  type SearchSuggestion,
  type QueryAnalysis,
} from './search-service';

// Configuration and types
export {
  AI_MODELS,
  AI_CONFIG,
  PROMPT_TEMPLATES,
  RATE_LIMITS,
  AIError,
} from './config';

// Type exports
export type {
  AIRecommendationResponse,
  AIPersonalityResponse,
  AIEmbeddingResponse,
} from './client';

// Convenience re-exports from Vercel AI SDK
export { embed, generateText, generateObject } from 'ai';
export { openai } from '@ai-sdk/openai';

/**
 * Quick usage examples:
 *
 * Basic embedding generation:
 * ```typescript
 * import { aiClient } from '@/lib/ai-sdk';
 * const embedding = await aiClient.generateEmbedding('fragrance description');
 * ```
 *
 * Generate beginner-friendly recommendations:
 * ```typescript
 * import { createUnifiedEngine } from '@/lib/ai-sdk';
 * const engine = await createUnifiedEngine(supabase);
 * const result = await engine.generateRecommendations({
 *   strategy: 'hybrid',
 *   userId: 'user123',
 *   adaptiveExplanations: true,
 *   quizResponses: [...]
 * });
 * ```
 *
 * Generate specialized beginner explanations:
 * ```typescript
 * import { generateBeginnerExplanation } from '@/lib/ai-sdk';
 * const explanation = await generateBeginnerExplanation({
 *   fragranceId: 'fragrance123',
 *   fragranceName: 'Sauvage',
 *   brand: 'Dior',
 *   scentFamily: 'fresh',
 *   userContext: 'new to fragrances, likes fresh scents'
 * });
 * ```
 *
 * Experience-level detection:
 * ```typescript
 * import { experienceDetector } from '@/lib/ai-sdk';
 * const detector = experienceDetector(supabase);
 * const analysis = await detector.analyzeUserExperience('user123');
 * console.log(analysis.level); // 'beginner' | 'intermediate' | 'advanced'
 * ```
 */
