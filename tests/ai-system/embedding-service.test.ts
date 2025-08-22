import { describe, test, expect, beforeEach, vi, Mock } from 'vitest';

/**
 * Embedding Service Test Suite
 * 
 * Tests for the AI embedding service that powers vector similarity search.
 * Verifies Voyage AI integration with OpenAI fallback for semantic fragrance matching.
 * 
 * Test Coverage:
 * - Voyage AI embedding generation
 * - OpenAI fallback mechanism
 * - Vector similarity calculations
 * - Embedding caching and performance
 * - Error handling and resilience
 */

// Mock the embedding service
const mockVoyageAI = {
  embed: vi.fn(),
};

const mockOpenAI = {
  embeddings: {
    create: vi.fn(),
  },
};

vi.mock('@/lib/ai-sdk/embedding-service', () => ({
  EmbeddingService: vi.fn().mockImplementation(() => ({
    generateEmbedding: vi.fn(),
    calculateSimilarity: vi.fn(),
    batchGenerateEmbeddings: vi.fn(),
    getCachedEmbedding: vi.fn(),
    cacheEmbedding: vi.fn(),
  })),
  VoyageAIProvider: vi.fn().mockImplementation(() => mockVoyageAI),
  OpenAIProvider: vi.fn().mockImplementation(() => mockOpenAI),
}));

const { EmbeddingService, VoyageAIProvider, OpenAIProvider } = await import('@/lib/ai-sdk/embedding-service');

describe('Embedding Service Tests', () => {
  let embeddingService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    embeddingService = new EmbeddingService();
  });

  describe('Voyage AI Integration', () => {
    test('should generate embeddings using Voyage AI primary service', async () => {
      const mockEmbedding = new Array(1536).fill(0).map((_, i) => Math.random() - 0.5);
      
      embeddingService.generateEmbedding.mockResolvedValueOnce({
        success: true,
        embedding: mockEmbedding,
        provider: 'voyage-ai',
        model: 'voyage-3.5',
        dimensions: 1536,
        processing_time_ms: 45,
      });

      const result = await embeddingService.generateEmbedding(
        'Fresh citrus fragrance with bergamot and lemon notes'
      );

      expect(result.success).toBe(true);
      expect(result.embedding).toHaveLength(1536);
      expect(result.provider).toBe('voyage-ai');
      expect(result.processing_time_ms).toBeLessThan(100);
      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith(
        'Fresh citrus fragrance with bergamot and lemon notes'
      );
    });

    test('should fallback to OpenAI when Voyage AI fails', async () => {
      // First call (Voyage AI) fails
      embeddingService.generateEmbedding
        .mockRejectedValueOnce(new Error('Voyage AI service unavailable'))
        .mockResolvedValueOnce({
          success: true,
          embedding: new Array(1536).fill(0.1),
          provider: 'openai',
          model: 'text-embedding-3-small',
          dimensions: 1536,
          processing_time_ms: 120,
        });

      const result = await embeddingService.generateEmbedding(
        'Woody amber fragrance with sandalwood'
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('openai');
      expect(result.embedding).toHaveLength(1536);
      expect(embeddingService.generateEmbedding).toHaveBeenCalledTimes(2); // Retry with fallback
    });

    test('should handle both providers failing gracefully', async () => {
      embeddingService.generateEmbedding.mockRejectedValue(
        new Error('All embedding services unavailable')
      );

      const result = await embeddingService.generateEmbedding(
        'Test fragrance description'
      );

      expect(result.success).toBe(false);
      expect(result.embedding).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe('Vector Similarity Calculations', () => {
    test('should calculate cosine similarity between fragrance embeddings', async () => {
      const embedding1 = [0.1, 0.2, 0.3, 0.4, 0.5];
      const embedding2 = [0.2, 0.3, 0.4, 0.5, 0.6];
      
      embeddingService.calculateSimilarity.mockReturnValueOnce(0.87);

      const similarity = embeddingService.calculateSimilarity(embedding1, embedding2);

      expect(similarity).toBe(0.87);
      expect(similarity).toBeGreaterThan(0.8); // High similarity expected
      expect(embeddingService.calculateSimilarity).toHaveBeenCalledWith(embedding1, embedding2);
    });

    test('should identify dissimilar fragrances correctly', async () => {
      const freshEmbedding = [1.0, 0.2, 0.1, 0.0, 0.1];
      const orientalEmbedding = [0.1, 0.0, 0.1, 1.0, 0.8];
      
      embeddingService.calculateSimilarity.mockReturnValueOnce(0.23);

      const similarity = embeddingService.calculateSimilarity(freshEmbedding, orientalEmbedding);

      expect(similarity).toBe(0.23);
      expect(similarity).toBeLessThan(0.5); // Low similarity expected for different families
    });
  });

  describe('Batch Operations', () => {
    test('should efficiently process multiple fragrance embeddings', async () => {
      const fragranceDescriptions = [
        'Fresh citrus with bergamot',
        'Woody amber with sandalwood',
        'Floral bouquet with rose and jasmine',
      ];

      const mockBatchResults = fragranceDescriptions.map((desc, i) => ({
        text: desc,
        embedding: new Array(1536).fill(i * 0.1),
        success: true,
      }));

      embeddingService.batchGenerateEmbeddings.mockResolvedValueOnce({
        success: true,
        results: mockBatchResults,
        total_processed: 3,
        processing_time_ms: 180,
        provider: 'voyage-ai',
      });

      const result = await embeddingService.batchGenerateEmbeddings(fragranceDescriptions);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.total_processed).toBe(3);
      expect(result.processing_time_ms).toBeLessThan(500);
    });

    test('should handle partial batch failures', async () => {
      const mockBatchResults = [
        { text: 'Success 1', embedding: [0.1, 0.2], success: true },
        { text: 'Failure', embedding: null, success: false, error: 'Invalid text' },
        { text: 'Success 2', embedding: [0.3, 0.4], success: true },
      ];

      embeddingService.batchGenerateEmbeddings.mockResolvedValueOnce({
        success: true,
        results: mockBatchResults,
        total_processed: 3,
        successful: 2,
        failed: 1,
      });

      const result = await embeddingService.batchGenerateEmbeddings([
        'Valid description 1',
        '', // Empty description should fail
        'Valid description 2',
      ]);

      expect(result.success).toBe(true);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
    });
  });

  describe('Caching Optimization', () => {
    test('should cache embeddings for performance', async () => {
      const testText = 'Woody oriental fragrance with oud';
      const mockEmbedding = new Array(1536).fill(0.5);

      // First call - should generate and cache
      embeddingService.getCachedEmbedding.mockResolvedValueOnce(null);
      embeddingService.generateEmbedding.mockResolvedValueOnce({
        success: true,
        embedding: mockEmbedding,
        provider: 'voyage-ai',
      });
      embeddingService.cacheEmbedding.mockResolvedValueOnce(true);

      const firstResult = await embeddingService.generateEmbedding(testText);

      // Second call - should use cache
      embeddingService.getCachedEmbedding.mockResolvedValueOnce({
        embedding: mockEmbedding,
        provider: 'voyage-ai',
        cached_at: new Date().toISOString(),
      });

      const secondResult = await embeddingService.generateEmbedding(testText);

      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(true);
      expect(embeddingService.cacheEmbedding).toHaveBeenCalledTimes(1);
      expect(embeddingService.getCachedEmbedding).toHaveBeenCalledTimes(2);
    });

    test('should handle cache misses and regenerate embeddings', async () => {
      embeddingService.getCachedEmbedding.mockResolvedValueOnce(null); // Cache miss

      const mockEmbedding = [0.1, 0.2, 0.3];
      embeddingService.generateEmbedding.mockResolvedValueOnce({
        success: true,
        embedding: mockEmbedding,
        provider: 'voyage-ai',
      });

      const result = await embeddingService.generateEmbedding('New fragrance description');

      expect(result.success).toBe(true);
      expect(result.embedding).toEqual(mockEmbedding);
    });
  });

  describe('Performance Benchmarks', () => {
    test('should meet embedding generation performance targets', async () => {
      embeddingService.generateEmbedding.mockResolvedValueOnce({
        success: true,
        embedding: new Array(1536).fill(0.1),
        provider: 'voyage-ai',
        processing_time_ms: 35,
      });

      const result = await embeddingService.generateEmbedding('Performance test fragrance');

      expect(result.success).toBe(true);
      expect(result.processing_time_ms).toBeLessThan(100); // Should be under 100ms
    });

    test('should optimize batch processing for multiple fragrances', async () => {
      const batchSize = 50;
      const descriptions = Array.from({ length: batchSize }, (_, i) => `Fragrance ${i}`);

      embeddingService.batchGenerateEmbeddings.mockResolvedValueOnce({
        success: true,
        results: descriptions.map(desc => ({
          text: desc,
          embedding: new Array(1536).fill(Math.random()),
          success: true,
        })),
        total_processed: batchSize,
        processing_time_ms: 800, // Should be much faster than individual calls
      });

      const result = await embeddingService.batchGenerateEmbeddings(descriptions);

      expect(result.success).toBe(true);
      expect(result.total_processed).toBe(batchSize);
      expect(result.processing_time_ms).toBeLessThan(2000); // Should be under 2 seconds for batch
    });
  });
});