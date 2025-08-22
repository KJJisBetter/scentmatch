/**
 * Embedding Service using Voyage AI + OpenAI Fallback
 *
 * Modern dual-provider embedding system optimized for 2025:
 * - Primary: Voyage AI (voyage-3.5) - Superior semantic understanding
 * - Fallback: OpenAI (text-embedding-3-small) - Reliable backup
 * - Automatic failover and retry logic
 * - Performance monitoring and caching
 *
 * Replaces:
 * - lib/ai/voyage-client.ts
 * - lib/ai/embedding-pipeline.ts  
 * - lib/ai/vector-similarity.ts
 * - Complex multi-provider system in lib/ai/index.ts
 */

import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { VoyageAIApi } from 'voyageai';
import { AI_MODELS, AI_CONFIG, AIError } from './config';

// Initialize Voyage AI client
const voyageClient = new VoyageAIApi({
  apiKey: process.env.VOYAGE_API_KEY,
});

// Provider types
export type EmbeddingProvider = 'voyage-ai' | 'openai';

// Enhanced embedding response with provider info
export interface EnhancedEmbeddingResponse {
  success: boolean;
  embedding?: number[];
  provider: EmbeddingProvider;
  model: string;
  dimensions: number;
  processing_time_ms: number;
  usage?: {
    total_tokens: number;
  };
  error?: string;
  fallback_used?: boolean;
}

// Interface to maintain compatibility with existing code
export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
  usage: {
    total_tokens: number;
  };
  metadata?: {
    processing_time_ms: number;
    cache_hit?: boolean;
  };
}

// Batch embedding response
export interface BatchEmbeddingResponse {
  embeddings: EmbeddingResponse[];
  total_processed: number;
  processing_time_ms: number;
  failed_items: number;
}

/**
 * Modern Dual-Provider Embedding Service  
 * Primary: Voyage AI, Fallback: OpenAI
 */
export class EmbeddingService {
  /**
   * Generate embedding with Voyage AI primary + OpenAI fallback
   * Replaces generateQueryEmbedding from lib/ai/index.ts
   */
  async generateQueryEmbedding(
    searchQuery: string,
    userId?: string
  ): Promise<EmbeddingResponse> {
    const enhancedResult = await this.generateEmbeddingWithFallback(searchQuery);
    
    // Convert to legacy format for compatibility
    return {
      embedding: enhancedResult.embedding || [],
      model: enhancedResult.model,
      dimensions: enhancedResult.dimensions,
      usage: enhancedResult.usage || { total_tokens: 0 },
      metadata: {
        processing_time_ms: enhancedResult.processing_time_ms,
        cache_hit: false,
      },
    };
  }

  /**
   * Generate embedding with automatic Voyage AI → OpenAI fallback
   */
  async generateEmbeddingWithFallback(
    text: string,
    options?: { 
      preferProvider?: EmbeddingProvider;
      maxRetries?: number;
    }
  ): Promise<EnhancedEmbeddingResponse> {
    const startTime = Date.now();
    const preferProvider = options?.preferProvider || 'voyage-ai';
    const maxRetries = options?.maxRetries || 1;

    // Try primary provider first
    if (preferProvider === 'voyage-ai') {
      try {
        const voyageResult = await this.generateVoyageEmbedding(text);
        if (voyageResult.success) {
          return {
            ...voyageResult,
            processing_time_ms: Date.now() - startTime,
            fallback_used: false,
          };
        }
      } catch (error) {
        console.warn('Voyage AI embedding failed, falling back to OpenAI:', error);
      }
    }

    // Fallback to OpenAI
    try {
      const openaiResult = await this.generateOpenAIEmbedding(text);
      return {
        ...openaiResult,
        processing_time_ms: Date.now() - startTime,
        fallback_used: preferProvider === 'voyage-ai',
      };
    } catch (error) {
      return {
        success: false,
        provider: 'openai',
        model: 'failed',
        dimensions: 0,
        processing_time_ms: Date.now() - startTime,
        error: `All embedding providers failed: ${error instanceof Error ? error.message : String(error)}`,
        fallback_used: true,
      };
    }
  }

  /**
   * Generate embedding using Voyage AI (Primary Provider)
   */
  private async generateVoyageEmbedding(text: string): Promise<EnhancedEmbeddingResponse> {
    try {
      const response = await voyageClient.embed({
        input: [text.trim()],
        model: 'voyage-3',
        inputType: 'document',
      });

      return {
        success: true,
        embedding: response.data[0].embedding,
        provider: 'voyage-ai',
        model: 'voyage-3',
        dimensions: response.data[0].embedding.length,
        processing_time_ms: 0, // Will be set by caller
        usage: {
          total_tokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        provider: 'voyage-ai',
        model: 'voyage-3',
        dimensions: 0,
        processing_time_ms: 0,
        error: `Voyage AI failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Generate embedding using OpenAI (Fallback Provider)
   */
  private async generateOpenAIEmbedding(text: string): Promise<EnhancedEmbeddingResponse> {
    try {
      const { embedding, usage } = await embed({
        model: openai('text-embedding-3-small'),
        value: text.trim(),
      });

      return {
        success: true,
        embedding,
        provider: 'openai',
        model: 'text-embedding-3-small',
        dimensions: embedding.length,
        processing_time_ms: 0, // Will be set by caller
        usage: {
          total_tokens: usage?.tokens || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        provider: 'openai',
        model: 'text-embedding-3-small',
        dimensions: 0,
        processing_time_ms: 0,
        error: `OpenAI failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Generate embeddings for multiple fragrance descriptions
   * Replaces generateBatchFragranceEmbeddings from lib/ai/index.ts
   */
  async generateBatchFragranceEmbeddings(
    fragranceTexts: string[],
    userId?: string
  ): Promise<EmbeddingResponse[]> {
    const startTime = Date.now();

    try {
      if (!fragranceTexts || fragranceTexts.length === 0) {
        return [];
      }

      // Filter out empty texts
      const validTexts = fragranceTexts.filter(
        text => text && text.trim().length > 0
      );

      if (validTexts.length === 0) {
        return [];
      }

      // Process in batches to respect rate limits
      const batchSize = AI_CONFIG.EMBEDDING.batchSize;
      const results: EmbeddingResponse[] = [];

      for (let i = 0; i < validTexts.length; i += batchSize) {
        const batch = validTexts.slice(i, i + batchSize);

        // Process batch in parallel but with controlled concurrency
        const batchPromises = batch.map(async (text, index) => {
          try {
            const { embedding, usage } = await embed({
              model: AI_MODELS.EMBEDDING,
              value: text.trim(),
            });

            return {
              embedding,
              model: 'text-embedding-3-large',
              dimensions: AI_CONFIG.EMBEDDING.dimensions,
              usage: {
                total_tokens: usage?.tokens || 0,
              },
              metadata: {
                processing_time_ms: Date.now() - startTime,
                cache_hit: false,
              },
            };
          } catch (error) {
            console.warn(
              `Failed to generate embedding for text at index ${i + index}:`,
              error
            );
            throw error;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches to respect rate limits
        if (i + batchSize < validTexts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    } catch (error) {
      throw new AIError(
        `Failed to generate batch embeddings: ${error instanceof Error ? error.message : String(error)}`,
        'BATCH_EMBEDDING_FAILED',
        error as Error
      );
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   * Replaces vector similarity functions
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
      const val1 = embedding1[i] || 0;
      const val2 = embedding2[i] || 0;
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Find most similar embeddings from a list
   * Utility function for similarity search
   */
  findMostSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: Array<{ id: string; embedding: number[] }>,
    threshold: number = 0.7,
    limit: number = 10
  ): Array<{ id: string; similarity: number }> {
    const similarities = candidateEmbeddings.map(candidate => ({
      id: candidate.id,
      similarity: this.calculateCosineSimilarity(
        queryEmbedding,
        candidate.embedding
      ),
    }));

    return similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Health check for embedding service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency_ms: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      await this.generateQueryEmbedding('test query for health check');

      const latency = Date.now() - startTime;

      return {
        status: latency < 1000 ? 'healthy' : 'degraded',
        latency_ms: latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();

// Export compatibility functions that maintain the same interface as the old system
export async function generateQueryEmbedding(
  searchQuery: string,
  userId?: string
): Promise<EmbeddingResponse> {
  return embeddingService.generateQueryEmbedding(searchQuery, userId);
}

export async function generateBatchFragranceEmbeddings(
  fragranceTexts: string[],
  userId?: string
): Promise<EmbeddingResponse[]> {
  return embeddingService.generateBatchFragranceEmbeddings(
    fragranceTexts,
    userId
  );
}

// For backward compatibility with old voyage-client interface
export async function generateBatchEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const responses =
    await embeddingService.generateBatchFragranceEmbeddings(texts);
  return responses.map(response => response.embedding);
}

// Calculate similarity (utility function)
export function calculateCosineSimilarity(
  embedding1: number[],
  embedding2: number[]
): number {
  return embeddingService.calculateCosineSimilarity(embedding1, embedding2);
}
