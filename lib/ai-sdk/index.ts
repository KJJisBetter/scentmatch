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
 * Generate recommendations:
 * ```typescript
 * import { aiClient } from '@/lib/ai-sdk';
 * const recommendations = await aiClient.generateRecommendations(
 *   userPreferences,
 *   fragranceData,
 *   10
 * );
 * ```
 *
 * Analyze personality:
 * ```typescript
 * import { aiClient } from '@/lib/ai-sdk';
 * const personality = await aiClient.analyzePersonality(quizResponses);
 * ```
 */
