/**
 * Vercel AI SDK Configuration
 *
 * Centralized configuration for the new AI system using Vercel AI SDK
 * Replaces the complex custom AI implementation with modern, proven libraries
 */

import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';

// Environment configuration
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

// Primary OpenAI configuration
export const openaiClient = createOpenAI({
  apiKey: openaiApiKey,
});

// Model configurations for different use cases with timeout settings
export const AI_MODELS = {
  // For generating recommendations and analysis (gpt-4o supports structured output)
  RECOMMENDATION: openai('gpt-4o'),

  // For embeddings (text similarity)
  EMBEDDING: openai.embedding('text-embedding-3-large'),

  // For chat and conversational features (gpt-4o supports structured output)
  CHAT: openai('gpt-4o'),

  // For quick analysis and lightweight tasks
  FAST: openai('gpt-3.5-turbo'),
} as const;

// Timeout configurations for AI operations (in milliseconds)
export const AI_TIMEOUTS = {
  // Quick operations (personality analysis, simple explanations)
  FAST: 8000, // 8 seconds
  // Standard operations (recommendations, detailed explanations)
  STANDARD: 15000, // 15 seconds
  // Complex operations (batch processing, embeddings)
  COMPLEX: 30000, // 30 seconds
} as const;

// Configuration for different AI operations
export const AI_CONFIG = {
  EMBEDDING: {
    // Embedding dimensions for text-embedding-3-large
    dimensions: 3072,
    // Batch size for processing multiple texts
    batchSize: 100,
  },

  RECOMMENDATION: {
    // Default number of recommendations to generate
    defaultLimit: 10,
    // Maximum number of recommendations
    maxLimit: 50,
    // Temperature for recommendation generation (0 = deterministic, 1 = creative)
    temperature: 0.3,
    // Maximum tokens for recommendation explanations
    maxTokens: 500,
    // Enable database-only fallback when AI fails
    enableFallback: true,
    // Maximum time to wait for AI enhancement before fallback
    maxWaitTime: 10000, // 10 seconds
  },

  SIMILARITY: {
    // Default similarity threshold for related items
    defaultThreshold: 0.7,
    // Minimum threshold (below this, items are not considered similar)
    minThreshold: 0.5,
    // Maximum threshold (1.0 = identical)
    maxThreshold: 1.0,
  },
} as const;

// Prompt templates for consistent AI interactions
export const PROMPT_TEMPLATES = {
  FRAGRANCE_RECOMMENDATION: `
    Based on the user's fragrance preferences and collection, recommend similar fragrances.
    Consider scent families, notes, intensity, and occasions.
    Provide reasoning for each recommendation.
  `,

  PERSONALITY_ANALYSIS: `
    Analyze the user's quiz responses to determine their fragrance personality type.
    Categories: sophisticated, romantic, natural, classic.
    Provide confidence score and key traits.
  `,

  FRAGRANCE_COMPARISON: `
    Compare two fragrances and explain their similarities and differences.
    Focus on scent profile, longevity, projection, and suitable occasions.
  `,
} as const;

// Type definitions for AI responses
export interface AIRecommendationResponse {
  fragrance_id: string;
  score: number;
  reasoning: string;
  confidence: number;
}

export interface AIPersonalityResponse {
  personality_type: 'sophisticated' | 'romantic' | 'natural' | 'classic';
  confidence: number;
  traits: string[];
  description: string;
}

export interface AIEmbeddingResponse {
  embedding: number[];
  dimensions: number;
}

// Error handling for AI operations
export class AIError extends Error {
  public readonly code: string;
  public readonly cause?: Error;

  constructor(message: string, code: string, cause?: Error) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.cause = cause;
  }
}

// Rate limiting configuration
export const RATE_LIMITS = {
  // Requests per minute for different operation types
  EMBEDDING: 1000,
  RECOMMENDATION: 60,
  ANALYSIS: 100,
} as const;
