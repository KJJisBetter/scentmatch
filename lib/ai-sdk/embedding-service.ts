/**
 * Embedding Service using Vercel AI SDK
 *
 * Replaces complex custom embedding system with simple, reliable
 * Vercel AI SDK implementation. Maintains compatibility with existing APIs.
 *
 * Replaces:
 * - lib/ai/voyage-client.ts
 * - lib/ai/embedding-pipeline.ts
 * - lib/ai/vector-similarity.ts
 * - Complex multi-provider system in lib/ai/index.ts
 */

import { embed } from 'ai';
import { AI_MODELS, AI_CONFIG, AIError } from './config';

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
 * Embedding Service using Vercel AI SDK
 * Replaces all custom embedding implementations
 */
export class EmbeddingService {
  /**
   * Generate single embedding for search queries
   * Replaces generateQueryEmbedding from lib/ai/index.ts
   */
  async generateQueryEmbedding(
    searchQuery: string,
    userId?: string
  ): Promise<EmbeddingResponse> {
    const startTime = Date.now();

    try {
      if (!searchQuery || searchQuery.trim().length === 0) {
        throw new AIError('Search query cannot be empty', 'EMPTY_QUERY');
      }

      const { embedding, usage } = await embed({
        model: AI_MODELS.EMBEDDING,
        value: searchQuery.trim(),
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
      throw new AIError(
        `Failed to generate query embedding: ${error instanceof Error ? error.message : String(error)}`,
        'EMBEDDING_GENERATION_FAILED',
        error as Error
      );
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
