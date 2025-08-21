/**
 * Embedding Service Tests
 *
 * Tests for the new embedding service using Vercel AI SDK
 * that replaces the complex custom embedding system
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  EmbeddingService,
  embeddingService,
} from '../../lib/ai-sdk/embedding-service';

// Mock the embed function from Vercel AI SDK
vi.mock('ai', () => ({
  embed: vi.fn(),
}));

// Mock AI config
vi.mock('../../lib/ai-sdk/config', () => ({
  AI_MODELS: {
    EMBEDDING: 'text-embedding-3-large',
  },
  AI_CONFIG: {
    EMBEDDING: {
      dimensions: 3072,
      batchSize: 10,
    },
  },
  AIError: class AIError extends Error {
    constructor(
      message: string,
      public code: string,
      public cause?: Error
    ) {
      super(message);
      this.name = 'AIError';
    }
  },
}));

describe('EmbeddingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateQueryEmbedding', () => {
    test('should generate embedding for search query', async () => {
      const mockEmbedding = Array.from({ length: 3072 }, () => Math.random());

      const { embed } = await import('ai');
      vi.mocked(embed).mockResolvedValue({
        embedding: mockEmbedding,
        usage: { tokens: 10 },
      });

      const result = await embeddingService.generateQueryEmbedding(
        'luxury evening fragrances'
      );

      expect(result).toEqual({
        embedding: mockEmbedding,
        model: 'text-embedding-3-large',
        dimensions: 3072,
        usage: {
          total_tokens: 10,
        },
        metadata: {
          processing_time_ms: expect.any(Number),
          cache_hit: false,
        },
      });

      expect(embed).toHaveBeenCalledWith({
        model: 'text-embedding-3-large',
        value: 'luxury evening fragrances',
      });
    });

    test('should handle empty query gracefully', async () => {
      await expect(embeddingService.generateQueryEmbedding('')).rejects.toThrow(
        'Search query cannot be empty'
      );
      await expect(
        embeddingService.generateQueryEmbedding('   ')
      ).rejects.toThrow('Search query cannot be empty');
    });

    test('should handle embedding generation errors', async () => {
      const { embed } = await import('ai');
      vi.mocked(embed).mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(
        embeddingService.generateQueryEmbedding('test query')
      ).rejects.toThrow('Failed to generate query embedding');
    });
  });

  describe('generateBatchFragranceEmbeddings', () => {
    test('should generate embeddings for multiple fragrance texts', async () => {
      const mockEmbedding1 = Array.from({ length: 3072 }, () => Math.random());
      const mockEmbedding2 = Array.from({ length: 3072 }, () => Math.random());

      const { embed } = await import('ai');
      vi.mocked(embed)
        .mockResolvedValueOnce({
          embedding: mockEmbedding1,
          usage: { tokens: 8 },
        })
        .mockResolvedValueOnce({
          embedding: mockEmbedding2,
          usage: { tokens: 12 },
        });

      const fragranceTexts = [
        'Tom Ford Black Orchid - luxurious, bold, oriental',
        'Chanel No. 5 - classic, floral, timeless',
      ];

      const results =
        await embeddingService.generateBatchFragranceEmbeddings(fragranceTexts);

      expect(results).toHaveLength(2);
      expect(results[0].embedding).toEqual(mockEmbedding1);
      expect(results[1].embedding).toEqual(mockEmbedding2);
      expect(results[0].dimensions).toBe(3072);
      expect(results[1].dimensions).toBe(3072);
    });

    test('should handle empty input gracefully', async () => {
      const result = await embeddingService.generateBatchFragranceEmbeddings(
        []
      );
      expect(result).toHaveLength(0);
    });

    test('should filter out empty texts', async () => {
      const mockEmbedding = Array.from({ length: 3072 }, () => Math.random());

      const { embed } = await import('ai');
      vi.mocked(embed).mockResolvedValue({
        embedding: mockEmbedding,
        usage: { tokens: 8 },
      });

      const textsWithEmpties = [
        'Valid fragrance description',
        '',
        '   ',
        'Another valid description',
      ];

      const results =
        await embeddingService.generateBatchFragranceEmbeddings(
          textsWithEmpties
        );

      expect(results).toHaveLength(2); // Only valid texts processed
      expect(embed).toHaveBeenCalledTimes(2);
    });

    test('should process large batches in chunks', async () => {
      const mockEmbedding = Array.from({ length: 3072 }, () => Math.random());

      const { embed } = await import('ai');
      vi.mocked(embed).mockResolvedValue({
        embedding: mockEmbedding,
        usage: { tokens: 8 },
      });

      // Create a batch larger than the batch size (10)
      const largeTexts = Array.from(
        { length: 25 },
        (_, i) => `Fragrance ${i + 1}`
      );

      const results =
        await embeddingService.generateBatchFragranceEmbeddings(largeTexts);

      expect(results).toHaveLength(25);
      expect(embed).toHaveBeenCalledTimes(25);
    });
  });

  describe('Similarity Calculations', () => {
    test('should calculate cosine similarity correctly', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0, 0];
      const embedding3 = [0, 1, 0];

      // Identical embeddings should have similarity of 1
      const similarity1 = embeddingService.calculateCosineSimilarity(
        embedding1,
        embedding2
      );
      expect(similarity1).toBeCloseTo(1.0, 5);

      // Orthogonal embeddings should have similarity of 0
      const similarity2 = embeddingService.calculateCosineSimilarity(
        embedding1,
        embedding3
      );
      expect(similarity2).toBeCloseTo(0.0, 5);
    });

    test('should handle dimension mismatch', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0]; // Different dimensions

      expect(() => {
        embeddingService.calculateCosineSimilarity(embedding1, embedding2);
      }).toThrow('Embeddings must have the same dimensions');
    });

    test('should handle zero vectors', () => {
      const zeroVector1 = [0, 0, 0];
      const zeroVector2 = [0, 0, 0];

      const similarity = embeddingService.calculateCosineSimilarity(
        zeroVector1,
        zeroVector2
      );
      expect(similarity).toBe(0);
    });
  });

  describe('findMostSimilar', () => {
    test('should find most similar embeddings above threshold', () => {
      const queryEmbedding = [1, 0, 0];
      const candidates = [
        { id: 'frag1', embedding: [0.9, 0.1, 0] }, // High similarity (~0.99)
        { id: 'frag2', embedding: [0.5, 0.5, 0] }, // Medium similarity (~0.71)
        { id: 'frag3', embedding: [0, 0, 1] }, // Low similarity (0)
        { id: 'frag4', embedding: [0.95, 0.05, 0] }, // Very high similarity (~0.998)
      ];

      const results = embeddingService.findMostSimilar(
        queryEmbedding,
        candidates,
        0.8, // Higher threshold to get only 2 results
        3 // limit
      );

      expect(results).toHaveLength(2); // Only 2 above threshold
      expect(results[0].id).toBe('frag4'); // Highest similarity first
      expect(results[1].id).toBe('frag1'); // Second highest
      expect(results[0].similarity).toBeGreaterThan(results[1].similarity);
    });

    test('should respect limit parameter', () => {
      const queryEmbedding = [1, 0, 0];
      const candidates = Array.from({ length: 10 }, (_, i) => ({
        id: `frag${i}`,
        embedding: [0.9, 0.1, 0], // All similar
      }));

      const results = embeddingService.findMostSimilar(
        queryEmbedding,
        candidates,
        0.5, // low threshold
        3 // limit to 3
      );

      expect(results).toHaveLength(3);
    });
  });

  describe('Health Check', () => {
    test('should report healthy status when embeddings work', async () => {
      const { embed } = await import('ai');
      vi.mocked(embed).mockImplementation(
        () =>
          new Promise(
            resolve =>
              setTimeout(
                () =>
                  resolve({
                    embedding: Array.from({ length: 3072 }, () =>
                      Math.random()
                    ),
                    usage: { tokens: 5 },
                  }),
                50
              ) // 50ms delay
          )
      );

      const health = await embeddingService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.latency_ms).toBeGreaterThan(0);
      expect(health.latency_ms).toBeLessThan(1000);
    });

    test('should report unhealthy status when embeddings fail', async () => {
      const { embed } = await import('ai');
      vi.mocked(embed).mockRejectedValue(new Error('Service unavailable'));

      const health = await embeddingService.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.error).toContain('Service unavailable');
    });

    test('should report degraded status for slow responses', async () => {
      const { embed } = await import('ai');
      vi.mocked(embed).mockImplementation(
        () =>
          new Promise(
            resolve =>
              setTimeout(
                () =>
                  resolve({
                    embedding: Array.from({ length: 3072 }, () =>
                      Math.random()
                    ),
                    usage: { tokens: 5 },
                  }),
                1200
              ) // 1.2 seconds - slow
          )
      );

      const health = await embeddingService.healthCheck();

      expect(health.status).toBe('degraded');
      expect(health.latency_ms).toBeGreaterThan(1000);
    });
  });
});
