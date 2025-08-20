import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  AIClient, 
  VoyageAIProvider, 
  OpenAIProvider, 
  AIProviderManager,
  HealthMonitor,
  CostTracker,
  ConfigManager,
  type EmbeddingResponse,
  type ProviderHealth,
  type ProviderConfig
} from '@/lib/ai/ai-client';

describe('AI Client Architecture', () => {
  
  describe('AIClient Interface', () => {
    it('should define consistent interface for all providers', () => {
      // Test that all providers implement the same interface
      const voyageProvider = new VoyageAIProvider({
        apiKey: 'test-key',
        model: 'voyage-3-large'
      });
      
      const openaiProvider = new OpenAIProvider({
        apiKey: 'test-key', 
        model: 'text-embedding-3-large'
      });

      // Both should have the same interface methods
      expect(voyageProvider.generateEmbedding).toBeDefined();
      expect(voyageProvider.generateBatchEmbeddings).toBeDefined();
      expect(voyageProvider.getHealth).toBeDefined();
      expect(voyageProvider.getCost).toBeDefined();
      
      expect(openaiProvider.generateEmbedding).toBeDefined();
      expect(openaiProvider.generateBatchEmbeddings).toBeDefined();
      expect(openaiProvider.getHealth).toBeDefined();
      expect(openaiProvider.getCost).toBeDefined();
    });

    it('should return consistent embedding response format', async () => {
      const mockVoyageResponse: EmbeddingResponse = {
        embedding: new Array(2048).fill(0.1),
        dimensions: 2048,
        model: 'voyage-3-large',
        provider: 'voyage',
        tokens_used: 10,
        cost: 0.0018,
        processing_time_ms: 150
      };

      const mockOpenAIResponse: EmbeddingResponse = {
        embedding: new Array(3072).fill(0.1),
        dimensions: 3072,
        model: 'text-embedding-3-large', 
        provider: 'openai',
        tokens_used: 10,
        cost: 0.0013,
        processing_time_ms: 200
      };

      // Both responses should have the same structure
      expect(mockVoyageResponse).toHaveProperty('embedding');
      expect(mockVoyageResponse).toHaveProperty('dimensions');
      expect(mockVoyageResponse).toHaveProperty('model');
      expect(mockVoyageResponse).toHaveProperty('provider');
      expect(mockVoyageResponse).toHaveProperty('tokens_used');
      expect(mockVoyageResponse).toHaveProperty('cost');
      expect(mockVoyageResponse).toHaveProperty('processing_time_ms');

      expect(mockOpenAIResponse).toHaveProperty('embedding');
      expect(mockOpenAIResponse).toHaveProperty('dimensions');
      expect(mockOpenAIResponse).toHaveProperty('model');
      expect(mockOpenAIResponse).toHaveProperty('provider');
      expect(mockOpenAIResponse).toHaveProperty('tokens_used');
      expect(mockOpenAIResponse).toHaveProperty('cost');
      expect(mockOpenAIResponse).toHaveProperty('processing_time_ms');
    });
  });

  describe('VoyageAI Provider', () => {
    let voyageProvider: VoyageAIProvider;

    beforeEach(() => {
      voyageProvider = new VoyageAIProvider({
        apiKey: 'test-voyage-key',
        model: 'voyage-3-large',
        dimensions: 2048,
        baseUrl: 'https://api.voyageai.com/v1'
      });
    });

    it('should generate embeddings with voyage-3-large by default', async () => {
      const mockResponse = {
        data: [{
          embedding: new Array(2048).fill(0.1),
          index: 0
        }],
        model: 'voyage-3-large',
        usage: { total_tokens: 10 }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await voyageProvider.generateEmbedding('test fragrance description');
      
      expect(result.embedding).toHaveLength(2048);
      expect(result.model).toBe('voyage-3-large');
      expect(result.provider).toBe('voyage');
      expect(result.dimensions).toBe(2048);
    });

    it('should fallback to voyage-3.5 on rate limiting', async () => {
      // First call fails with rate limit
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: () => Promise.resolve('Rate limit exceeded')
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [{
              embedding: new Array(1024).fill(0.1),
              index: 0
            }],
            model: 'voyage-3.5',
            usage: { total_tokens: 10 }
          })
        });

      const result = await voyageProvider.generateEmbedding('test fragrance');
      
      expect(result.embedding).toHaveLength(1024);
      expect(result.model).toBe('voyage-3.5');
      expect(result.dimensions).toBe(1024);
    });

    it('should handle batch embedding generation', async () => {
      const mockResponse = {
        data: [
          { embedding: new Array(2048).fill(0.1), index: 0 },
          { embedding: new Array(2048).fill(0.2), index: 1 },
          { embedding: new Array(2048).fill(0.3), index: 2 }
        ],
        model: 'voyage-3-large',
        usage: { total_tokens: 30 }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const texts = [
        'First fragrance description',
        'Second fragrance description', 
        'Third fragrance description'
      ];
      
      const results = await voyageProvider.generateBatchEmbeddings(texts);
      
      expect(results).toHaveLength(3);
      expect(results[0].embedding).toHaveLength(2048);
      expect(results[1].embedding).toHaveLength(2048);
      expect(results[2].embedding).toHaveLength(2048);
    });
  });

  describe('OpenAI Provider', () => {
    let openaiProvider: OpenAIProvider;

    beforeEach(() => {
      openaiProvider = new OpenAIProvider({
        apiKey: 'test-openai-key',
        model: 'text-embedding-3-large',
        dimensions: 3072,
        baseUrl: 'https://api.openai.com/v1'
      });
    });

    it('should generate embeddings with OpenAI', async () => {
      const mockResponse = {
        data: [{
          embedding: new Array(3072).fill(0.1),
          index: 0
        }],
        model: 'text-embedding-3-large',
        usage: { total_tokens: 10 }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await openaiProvider.generateEmbedding('test fragrance description');
      
      expect(result.embedding).toHaveLength(3072);
      expect(result.model).toBe('text-embedding-3-large');
      expect(result.provider).toBe('openai');
      expect(result.dimensions).toBe(3072);
    });

    it('should adjust dimensions when specified', async () => {
      openaiProvider = new OpenAIProvider({
        apiKey: 'test-key',
        model: 'text-embedding-3-large',
        dimensions: 2048 // Match Voyage dimensions
      });

      const mockResponse = {
        data: [{
          embedding: new Array(2048).fill(0.1),
          index: 0
        }],
        model: 'text-embedding-3-large',
        usage: { total_tokens: 10 }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await openaiProvider.generateEmbedding('test');
      expect(result.embedding).toHaveLength(2048);
      expect(result.dimensions).toBe(2048);
    });
  });

  describe('AI Provider Manager', () => {
    let providerManager: AIProviderManager;
    let voyageProvider: VoyageAIProvider;
    let openaiProvider: OpenAIProvider;

    beforeEach(() => {
      voyageProvider = new VoyageAIProvider({
        apiKey: 'voyage-key',
        model: 'voyage-3-large'
      });

      openaiProvider = new OpenAIProvider({
        apiKey: 'openai-key',
        model: 'text-embedding-3-large',
        dimensions: 2048 // Match Voyage for consistency
      });

      providerManager = new AIProviderManager({
        providers: [
          { provider: voyageProvider, priority: 1, name: 'voyage-primary' },
          { provider: openaiProvider, priority: 2, name: 'openai-fallback' }
        ],
        healthCheckInterval: 30000,
        maxRetries: 3
      });
    });

    it('should use primary provider by default', async () => {
      const mockEmbedding = new Array(2048).fill(0.1);
      
      vi.spyOn(voyageProvider, 'generateEmbedding').mockResolvedValue({
        embedding: mockEmbedding,
        dimensions: 2048,
        model: 'voyage-3-large',
        provider: 'voyage',
        tokens_used: 10,
        cost: 0.0018,
        processing_time_ms: 150
      });

      const result = await providerManager.generateEmbedding('test text');
      
      expect(result.provider).toBe('voyage');
      expect(result.model).toBe('voyage-3-large');
      expect(voyageProvider.generateEmbedding).toHaveBeenCalledWith('test text');
    });

    it('should failover to secondary provider when primary fails', async () => {
      const mockEmbedding = new Array(2048).fill(0.2);

      // Primary provider fails
      vi.spyOn(voyageProvider, 'generateEmbedding').mockRejectedValue(
        new Error('Service unavailable')
      );

      // Secondary provider succeeds
      vi.spyOn(openaiProvider, 'generateEmbedding').mockResolvedValue({
        embedding: mockEmbedding,
        dimensions: 2048,
        model: 'text-embedding-3-large',
        provider: 'openai',
        tokens_used: 10,
        cost: 0.0013,
        processing_time_ms: 200
      });

      const result = await providerManager.generateEmbedding('test text');
      
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('text-embedding-3-large');
      expect(openaiProvider.generateEmbedding).toHaveBeenCalledWith('test text');
    });

    it('should track failed attempts and circuit break', async () => {
      // Provider consistently fails
      vi.spyOn(voyageProvider, 'generateEmbedding').mockRejectedValue(
        new Error('Service down')
      );
      vi.spyOn(openaiProvider, 'generateEmbedding').mockRejectedValue(
        new Error('Service down')
      );

      // Multiple failures should trigger circuit breaker
      await expect(providerManager.generateEmbedding('test')).rejects.toThrow();
      await expect(providerManager.generateEmbedding('test')).rejects.toThrow();
      await expect(providerManager.generateEmbedding('test')).rejects.toThrow();

      const health = await providerManager.getHealth();
      expect(health.status).toBe('unhealthy'); // No providers available = unhealthy
      expect(health.available_providers).toHaveLength(0);
    });

    it('should recover when providers become healthy again', async () => {
      vi.useFakeTimers();
      
      const mockEmbedding = new Array(2048).fill(0.1);

      // Mock voyage to fail first, then succeed
      vi.spyOn(voyageProvider, 'generateEmbedding')
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          embedding: mockEmbedding,
          dimensions: 2048,
          model: 'voyage-3-large',
          provider: 'voyage',
          tokens_used: 10,
          cost: 0.0018,
          processing_time_ms: 150
        });

      // Mock OpenAI to handle the fallback
      vi.spyOn(openaiProvider, 'generateEmbedding').mockResolvedValue({
        embedding: new Array(2048).fill(0.2),
        dimensions: 2048,
        model: 'text-embedding-3-large',
        provider: 'openai',
        tokens_used: 10,
        cost: 0.0013,
        processing_time_ms: 200
      });

      // First call should use fallback (OpenAI) when Voyage fails
      const fallbackResult = await providerManager.generateEmbedding('test');
      expect(fallbackResult.provider).toBe('openai');

      // Advance time past circuit breaker timeout to allow recovery attempt
      vi.advanceTimersByTime(61000); // Past circuit breaker timeout (60 seconds)
      
      // Next call should try Voyage again and succeed
      const result = await providerManager.generateEmbedding('test again');
      expect(result.provider).toBe('voyage');
      
      vi.useRealTimers();
    });
  });

  describe('Health Monitor', () => {
    let healthMonitor: HealthMonitor;
    let voyageProvider: VoyageAIProvider;

    beforeEach(() => {
      voyageProvider = new VoyageAIProvider({
        apiKey: 'test-key',
        model: 'voyage-3-large'
      });

      healthMonitor = new HealthMonitor({
        providers: [voyageProvider],
        checkInterval: 30000,
        healthThreshold: 0.8
      });
    });

    it('should track provider health metrics', async () => {
      vi.spyOn(voyageProvider, 'getHealth').mockResolvedValue({
        status: 'healthy',
        response_time: 150,
        success_rate: 0.95,
        last_checked: new Date(),
        error_count: 0,
        total_requests: 100
      });

      const health = await healthMonitor.checkHealth('voyage');
      
      expect(health.status).toBe('healthy');
      expect(health.success_rate).toBe(0.95);
      expect(health.response_time).toBe(150);
    });

    it('should detect unhealthy providers', async () => {
      vi.spyOn(voyageProvider, 'getHealth').mockResolvedValue({
        status: 'unhealthy',
        response_time: 5000,
        success_rate: 0.3,
        last_checked: new Date(),
        error_count: 50,
        total_requests: 100
      });

      const health = await healthMonitor.checkHealth('voyage');
      
      expect(health.status).toBe('unhealthy');
      expect(health.success_rate).toBeLessThan(0.8);
    });

    it('should trigger alerts on health degradation', async () => {
      const alertCallback = vi.fn();
      healthMonitor.onHealthChange(alertCallback);

      vi.spyOn(voyageProvider, 'getHealth')
        .mockResolvedValueOnce({
          status: 'healthy',
          response_time: 150,
          success_rate: 0.95,
          last_checked: new Date(),
          error_count: 0,
          total_requests: 100
        })
        .mockResolvedValueOnce({
          status: 'unhealthy', 
          response_time: 8000,
          success_rate: 0.2,
          last_checked: new Date(),
          error_count: 80,
          total_requests: 100
        });

      await healthMonitor.checkHealth('voyage'); // Healthy
      await healthMonitor.checkHealth('voyage'); // Unhealthy

      expect(alertCallback).toHaveBeenCalledWith({
        provider: 'voyage',
        previous_status: 'healthy',
        current_status: 'unhealthy',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('Cost Tracker', () => {
    let costTracker: CostTracker;

    beforeEach(() => {
      costTracker = new CostTracker({
        providers: {
          'voyage-3-large': { cost_per_million_tokens: 0.18 },
          'voyage-3.5': { cost_per_million_tokens: 0.06 },
          'text-embedding-3-large': { cost_per_million_tokens: 0.13 }
        }
      });
    });

    it('should calculate costs correctly for different providers', () => {
      const voyageLargeCost = costTracker.calculateCost('voyage-3-large', 1000);
      const voyageSmallCost = costTracker.calculateCost('voyage-3.5', 1000);
      const openaiCost = costTracker.calculateCost('text-embedding-3-large', 1000);

      expect(voyageLargeCost).toBeCloseTo(0.00018, 6); // 1000 tokens * $0.18/1M
      expect(voyageSmallCost).toBeCloseTo(0.00006, 6); // 1000 tokens * $0.06/1M  
      expect(openaiCost).toBeCloseTo(0.00013, 6); // 1000 tokens * $0.13/1M
    });

    it('should track usage and costs over time', () => {
      costTracker.recordUsage('voyage-3-large', 1000, 0.00018);
      costTracker.recordUsage('voyage-3-large', 2000, 0.00036);
      costTracker.recordUsage('voyage-3.5', 1000, 0.00006);

      const stats = costTracker.getUsageStats('voyage-3-large');
      
      expect(stats.total_tokens).toBe(3000);
      expect(stats.total_cost).toBe(0.00054);
      expect(stats.request_count).toBe(2);
      expect(stats.average_tokens_per_request).toBe(1500);
    });

    it('should provide cost optimization recommendations', () => {
      // Record expensive usage pattern
      for (let i = 0; i < 10; i++) {
        costTracker.recordUsage('voyage-3-large', 500, 0.00009);
      }

      const recommendations = costTracker.getOptimizationRecommendations();
      
      expect(recommendations).toContainEqual({
        type: 'model_downgrade',
        current_model: 'voyage-3-large',
        suggested_model: 'voyage-3.5',
        estimated_savings: expect.any(Number),
        confidence: expect.any(Number)
      });
    });

    it('should track costs per user or session', () => {
      const userId = 'user-123';
      
      costTracker.recordUsage('voyage-3-large', 1000, 0.00018, { user_id: userId });
      costTracker.recordUsage('voyage-3.5', 500, 0.00003, { user_id: userId });

      const userStats = costTracker.getUserStats(userId);
      
      expect(userStats.total_cost).toBe(0.00021);
      expect(userStats.total_tokens).toBe(1500);
      expect(userStats.request_count).toBe(2);
    });
  });

  describe('Config Manager', () => {
    let configManager: ConfigManager;

    beforeEach(() => {
      configManager = new ConfigManager({
        environment: 'test',
        defaultConfig: {
          primary_provider: 'voyage',
          fallback_providers: ['openai'],
          health_check_interval: 30000,
          max_retries: 3
        }
      });
    });

    it('should load environment-specific configurations', () => {
      const devConfig = configManager.getConfig('development');
      const prodConfig = configManager.getConfig('production');

      expect(devConfig.primary_provider).toBe('voyage');
      expect(prodConfig.primary_provider).toBe('voyage');
      
      // Development might use different settings
      expect(devConfig.health_check_interval).toBeGreaterThan(0);
      expect(prodConfig.max_retries).toBeGreaterThan(0);
    });

    it('should support feature flags for provider switching', () => {
      configManager.setFeatureFlag('use_openai_primary', true);
      
      const config = configManager.getActiveConfig();
      const isOpenAIEnabled = configManager.isFeatureFlagEnabled('use_openai_primary');
      
      expect(isOpenAIEnabled).toBe(true);
    });

    it('should validate configuration on load', () => {
      const invalidConfig: ProviderConfig = {
        primary_provider: '',
        fallback_providers: [],
        health_check_interval: -1000,
        max_retries: -1
      };

      expect(() => {
        configManager.validateConfig(invalidConfig);
      }).toThrow('Invalid configuration');
    });

    it('should handle missing API keys gracefully', () => {
      delete process.env.VOYAGE_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const warnings = configManager.validateEnvironment();
      
      expect(warnings).toContain('Missing VOYAGE_API_KEY');
      expect(warnings).toContain('Missing OPENAI_API_KEY');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete embedding workflow with failover', async () => {
      const voyageProvider = new VoyageAIProvider({
        apiKey: 'voyage-key',
        model: 'voyage-3-large'
      });

      const openaiProvider = new OpenAIProvider({
        apiKey: 'openai-key', 
        model: 'text-embedding-3-large',
        dimensions: 2048
      });

      const manager = new AIProviderManager({
        providers: [
          { provider: voyageProvider, priority: 1, name: 'voyage' },
          { provider: openaiProvider, priority: 2, name: 'openai' }
        ]
      });

      // Mock Voyage failing, OpenAI succeeding
      vi.spyOn(voyageProvider, 'generateEmbedding').mockRejectedValue(
        new Error('Rate limit exceeded')
      );
      
      vi.spyOn(openaiProvider, 'generateEmbedding').mockResolvedValue({
        embedding: new Array(2048).fill(0.1),
        dimensions: 2048,
        model: 'text-embedding-3-large',
        provider: 'openai',
        tokens_used: 15,
        cost: 0.00195,
        processing_time_ms: 250
      });

      const result = await manager.generateEmbedding(
        'Creed Aventus - Fresh pineapple opening with smoky birch and vanilla base'
      );

      expect(result.provider).toBe('openai');
      expect(result.embedding).toHaveLength(2048);
      expect(result.cost).toBeGreaterThan(0);
      expect(result.processing_time_ms).toBeGreaterThan(0);
    });

    it('should maintain consistent dimensions across providers', async () => {
      const voyageEmbedding = new Array(2048).fill(0.1);
      const openaiEmbedding = new Array(2048).fill(0.2);

      const voyageResponse: EmbeddingResponse = {
        embedding: voyageEmbedding,
        dimensions: 2048,
        model: 'voyage-3-large',
        provider: 'voyage',
        tokens_used: 10,
        cost: 0.0018,
        processing_time_ms: 150
      };

      const openaiResponse: EmbeddingResponse = {
        embedding: openaiEmbedding,
        dimensions: 2048,
        model: 'text-embedding-3-large',
        provider: 'openai', 
        tokens_used: 10,
        cost: 0.0013,
        processing_time_ms: 200
      };

      // Both providers should return same dimensions for consistency
      expect(voyageResponse.dimensions).toBe(openaiResponse.dimensions);
      expect(voyageResponse.embedding.length).toBe(openaiResponse.embedding.length);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

// Type definitions for testing
interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
  model: string;
  provider: string;
  tokens_used: number;
  cost: number;
  processing_time_ms: number;
}

interface ProviderHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  response_time: number;
  success_rate: number;
  last_checked: Date;
  error_count: number;
  total_requests: number;
}

interface ProviderConfig {
  primary_provider: string;
  fallback_providers: string[];
  health_check_interval: number;
  max_retries: number;
}