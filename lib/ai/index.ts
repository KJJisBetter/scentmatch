/**
 * AI System Main Entry Point
 * 
 * Unified interface for all AI operations with automatic provider management,
 * health monitoring, and cost optimization.
 */

import {
  AIProviderManager,
  VoyageAIProvider,
  OpenAIProvider,
  HealthMonitor,
  CostTracker,
  type EmbeddingResponse
} from './ai-client';
import { AIConfigManager, getAIConfig, isAIFeatureEnabled } from './ai-config';

// Main AI Service Class
export class AIService {
  private providerManager: AIProviderManager;
  private healthMonitor: HealthMonitor;
  private costTracker: CostTracker;
  private config: AIConfigManager;

  constructor(configManager?: AIConfigManager) {
    this.config = configManager || getAIConfig();
    this.initialize();
  }

  private initialize() {
    const config = this.config.getConfig();

    // Initialize providers based on configuration
    const providers = [];
    
    // Setup Voyage AI if enabled
    if (isAIFeatureEnabled('use_voyage_primary')) {
      const voyageConfig = this.config.getVoyageConfig();
      
      if (voyageConfig.apiKey) {
        const voyageProvider = new VoyageAIProvider({
          apiKey: voyageConfig.apiKey,
          model: voyageConfig.primaryModel,
          dimensions: voyageConfig.primaryModel === 'voyage-3-large' ? 2048 : 1024,
        });

        providers.push({
          provider: voyageProvider,
          priority: 1,
          name: 'voyage-primary'
        });
      }
    }

    // Setup OpenAI if enabled
    if (isAIFeatureEnabled('use_openai_fallback')) {
      const openaiConfig = this.config.getOpenAIConfig();
      
      if (openaiConfig.apiKey) {
        const openaiProvider = new OpenAIProvider({
          apiKey: openaiConfig.apiKey,
          model: openaiConfig.model,
          dimensions: openaiConfig.dimensions
        });

        providers.push({
          provider: openaiProvider,
          priority: 2,
          name: 'openai-fallback'
        });
      }
    }

    if (providers.length === 0) {
      throw new Error('No AI providers are configured and enabled');
    }

    // Initialize provider manager
    this.providerManager = new AIProviderManager({
      providers,
      healthCheckInterval: config.health_check_interval,
      maxRetries: config.max_retries
    });

    // Initialize health monitoring if enabled
    if (isAIFeatureEnabled('enable_health_monitoring')) {
      this.healthMonitor = new HealthMonitor({
        providers: providers.map(p => p.provider),
        checkInterval: config.health_check_interval,
        healthThreshold: 0.8
      });

      // Setup health change notifications
      this.healthMonitor.onHealthChange((event) => {
        if (isAIFeatureEnabled('debug_logging')) {
          console.log('AI Provider health change:', event);
        }

        // Send to webhook if configured
        const monitoringConfig = this.config.getMonitoringConfig();
        if (monitoringConfig.alert_webhook_url) {
          this.sendHealthAlert(event, monitoringConfig.alert_webhook_url);
        }
      });
    }

    // Initialize cost tracking if enabled
    if (isAIFeatureEnabled('enable_cost_optimization')) {
      this.costTracker = new CostTracker({
        providers: {
          'voyage-3-large': { cost_per_million_tokens: 0.18 },
          'voyage-3.5': { cost_per_million_tokens: 0.06 },
          'text-embedding-3-large': { cost_per_million_tokens: 0.13 },
          'text-embedding-3-small': { cost_per_million_tokens: 0.02 }
        }
      });
    }

    if (isAIFeatureEnabled('debug_logging')) {
      this.config.dumpConfig();
      console.log(`AI Service initialized with ${providers.length} providers`);
    }
  }

  // Main public API
  async generateEmbedding(text: string, userId?: string): Promise<EmbeddingResponse> {
    try {
      const result = await this.providerManager.generateEmbedding(text);
      
      // Track usage if cost tracking enabled
      if (isAIFeatureEnabled('enable_cost_optimization') && this.costTracker) {
        this.costTracker.recordUsage(
          result.model,
          result.tokens_used,
          result.cost,
          userId ? { user_id: userId } : undefined
        );
      }

      return result;

    } catch (error) {
      if (isAIFeatureEnabled('debug_logging')) {
        console.error('AI embedding generation failed:', error);
      }
      throw error;
    }
  }

  async generateBatchEmbeddings(
    texts: string[], 
    userId?: string
  ): Promise<EmbeddingResponse[]> {
    if (!isAIFeatureEnabled('enable_batch_processing')) {
      // Fallback to individual requests if batch processing disabled
      const results = [];
      for (const text of texts) {
        const result = await this.generateEmbedding(text, userId);
        results.push(result);
      }
      return results;
    }

    try {
      const results = await this.providerManager.generateBatchEmbeddings(texts);
      
      // Track batch usage
      if (isAIFeatureEnabled('enable_cost_optimization') && this.costTracker) {
        for (const result of results) {
          this.costTracker.recordUsage(
            result.model,
            result.tokens_used,
            result.cost,
            userId ? { user_id: userId } : undefined
          );
        }
      }

      return results;

    } catch (error) {
      if (isAIFeatureEnabled('debug_logging')) {
        console.error('AI batch embedding generation failed:', error);
      }
      throw error;
    }
  }

  // Health and monitoring
  async getSystemHealth() {
    const providerHealth = await this.providerManager.getHealth();
    
    const systemHealth = {
      ...providerHealth,
      environment: this.config.getEnvironment(),
      feature_flags: this.config.getConfig().feature_flags,
      timestamp: new Date()
    };

    return systemHealth;
  }

  async getProviderHealth(providerId: string) {
    if (!this.healthMonitor) {
      throw new Error('Health monitoring is disabled');
    }
    
    return await this.healthMonitor.checkHealth(providerId);
  }

  // Cost analysis
  getCostAnalysis(userId?: string) {
    if (!isAIFeatureEnabled('enable_cost_optimization') || !this.costTracker) {
      throw new Error('Cost tracking is disabled');
    }

    if (userId) {
      return {
        user_stats: this.costTracker.getUserStats(userId),
        recommendations: this.costTracker.getOptimizationRecommendations()
      };
    }

    return {
      global_stats: {
        'voyage-3-large': this.costTracker.getUsageStats('voyage-3-large'),
        'voyage-3.5': this.costTracker.getUsageStats('voyage-3.5'),
        'text-embedding-3-large': this.costTracker.getUsageStats('text-embedding-3-large')
      },
      recommendations: this.costTracker.getOptimizationRecommendations()
    };
  }

  // Feature flag management
  enableFeature(flag: keyof import('./ai-config').FeatureFlags) {
    this.config.setFeatureFlag(flag, true);
    
    if (isAIFeatureEnabled('debug_logging')) {
      console.log(`AI Feature enabled: ${flag}`);
    }
  }

  disableFeature(flag: keyof import('./ai-config').FeatureFlags) {
    this.config.setFeatureFlag(flag, false);
    
    if (isAIFeatureEnabled('debug_logging')) {
      console.log(`AI Feature disabled: ${flag}`);
    }
  }

  // Private helpers
  private async sendHealthAlert(event: any, webhookUrl: string) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'ai_provider_health_change',
          data: event,
          environment: this.config.getEnvironment(),
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to send health alert:', error);
    }
  }
}

// Global AI service instance
let globalAIService: AIService | null = null;

export function getAIService(): AIService {
  if (!globalAIService) {
    globalAIService = new AIService();
  }
  return globalAIService;
}

// Convenience functions for common operations
export async function generateFragranceEmbedding(
  fragranceText: string,
  userId?: string
): Promise<EmbeddingResponse> {
  return await getAIService().generateEmbedding(fragranceText, userId);
}

export async function generateQueryEmbedding(
  searchQuery: string,
  userId?: string
): Promise<EmbeddingResponse> {
  return await getAIService().generateEmbedding(searchQuery, userId);
}

export async function generateBatchFragranceEmbeddings(
  fragranceTexts: string[],
  userId?: string
): Promise<EmbeddingResponse[]> {
  return await getAIService().generateBatchEmbeddings(fragranceTexts, userId);
}

// System utilities
export async function checkAISystemHealth() {
  return await getAIService().getSystemHealth();
}

export function getAICostAnalysis(userId?: string) {
  return getAIService().getCostAnalysis(userId);
}

// Re-export types and key classes
export type {
  EmbeddingResponse,
  ProviderHealth,
  ProviderConfig,
  Environment,
  FeatureFlags,
  AIProviderConfig
} from './ai-client';
export type { Environment as AIEnvironment, FeatureFlags as AIFeatureFlags } from './ai-config';

export {
  AIProviderManager,
  VoyageAIProvider,
  OpenAIProvider,
  HealthMonitor,
  CostTracker
} from './ai-client';
export { 
  AIConfigManager,
  getAIConfig, 
  isAIFeatureEnabled, 
  getAIEnvironment 
} from './ai-config';