/**
 * Vendor-Agnostic AI Provider System
 * 
 * Multi-provider architecture supporting Voyage AI, OpenAI, and future providers
 * with automatic failover, health monitoring, and cost optimization.
 */

// Core Types and Interfaces
export interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
  model: string;
  provider: string;
  tokens_used: number;
  cost: number;
  processing_time_ms: number;
}

export interface ProviderHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  response_time: number;
  success_rate: number;
  last_checked: Date;
  error_count: number;
  total_requests: number;
}

export interface ProviderConfig {
  primary_provider: string;
  fallback_providers: string[];
  health_check_interval: number;
  max_retries: number;
}

export interface UsageStats {
  total_tokens: number;
  total_cost: number;
  request_count: number;
  average_tokens_per_request: number;
}

// Abstract AI Client Interface
export abstract class AIClient {
  abstract generateEmbedding(text: string): Promise<EmbeddingResponse>;
  abstract generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResponse[]>;
  abstract getHealth(): Promise<ProviderHealth>;
  abstract getCost(tokens: number): number;
  
  protected abstract provider: string;
  protected abstract model: string;
  protected abstract apiKey: string;
  protected abstract baseUrl: string;
}

// Voyage AI Provider Implementation
export class VoyageAIProvider extends AIClient {
  protected provider = 'voyage';
  protected model: string;
  protected apiKey: string;
  protected baseUrl: string;
  protected dimensions: number;
  
  private errorCount = 0;
  private totalRequests = 0;
  private totalResponseTime = 0;

  constructor(config: {
    apiKey: string;
    model?: string;
    dimensions?: number;
    baseUrl?: string;
  }) {
    super();
    this.apiKey = config.apiKey;
    this.model = config.model || 'voyage-3-large';
    this.dimensions = config.dimensions || (this.model === 'voyage-3-large' ? 2048 : 1024);
    this.baseUrl = config.baseUrl || 'https://api.voyageai.com/v1';
  }

  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    const startTime = Date.now();
    this.totalRequests++;

    try {
      // Try primary model first
      const result = await this.callVoyageAPI([text], this.model);
      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;

      return {
        embedding: result.data[0].embedding,
        dimensions: this.dimensions,
        model: this.model,
        provider: this.provider,
        tokens_used: result.usage.total_tokens,
        cost: this.calculateCost(result.usage.total_tokens),
        processing_time_ms: responseTime
      };

    } catch (error) {
      this.errorCount++;

      // Try fallback to voyage-3.5 if using voyage-3-large
      if (this.model === 'voyage-3-large' && this.isRateLimitError(error)) {
        try {
          const fallbackResult = await this.callVoyageAPI([text], 'voyage-3.5');
          const responseTime = Date.now() - startTime;
          this.totalResponseTime += responseTime;

          return {
            embedding: fallbackResult.data[0].embedding,
            dimensions: 1024,
            model: 'voyage-3.5',
            provider: this.provider,
            tokens_used: fallbackResult.usage.total_tokens,
            cost: this.calculateCost(fallbackResult.usage.total_tokens, 'voyage-3.5'),
            processing_time_ms: responseTime
          };
        } catch (fallbackError) {
          this.errorCount++;
          throw fallbackError;
        }
      }

      throw error;
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResponse[]> {
    const startTime = Date.now();
    this.totalRequests++;

    try {
      const result = await this.callVoyageAPI(texts, this.model);
      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;

      return result.data.map((item, index) => ({
        embedding: item.embedding,
        dimensions: this.dimensions,
        model: this.model,
        provider: this.provider,
        tokens_used: Math.floor(result.usage.total_tokens / texts.length), // Approximate
        cost: this.calculateCost(Math.floor(result.usage.total_tokens / texts.length)),
        processing_time_ms: Math.floor(responseTime / texts.length)
      }));

    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async callVoyageAPI(texts: string[], model: string) {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: model,
        input_type: texts.length === 1 ? 'query' : 'document',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Voyage AI API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  private isRateLimitError(error: any): boolean {
    return error.message?.includes('429') || error.message?.includes('Rate limit');
  }

  private calculateCost(tokens: number, model?: string): number {
    const modelToUse = model || this.model;
    const rates: Record<string, number> = {
      'voyage-3-large': 0.18 / 1000000,  // $0.18 per million tokens
      'voyage-3.5': 0.06 / 1000000       // $0.06 per million tokens
    };
    
    return tokens * (rates[modelToUse] || rates['voyage-3-large']);
  }

  async getHealth(): Promise<ProviderHealth> {
    const successRate = this.totalRequests > 0 ? 
      (this.totalRequests - this.errorCount) / this.totalRequests : 1;
    const averageResponseTime = this.totalRequests > 0 ? 
      this.totalResponseTime / this.totalRequests : 0;

    return {
      status: successRate >= 0.8 && averageResponseTime < 2000 ? 'healthy' : 
              successRate >= 0.5 ? 'degraded' : 'unhealthy',
      response_time: averageResponseTime,
      success_rate: successRate,
      last_checked: new Date(),
      error_count: this.errorCount,
      total_requests: this.totalRequests
    };
  }

  getCost(tokens: number): number {
    return this.calculateCost(tokens);
  }
}

// OpenAI Provider Implementation
export class OpenAIProvider extends AIClient {
  protected provider = 'openai';
  protected model: string;
  protected apiKey: string;
  protected baseUrl: string;
  protected dimensions: number;
  
  private errorCount = 0;
  private totalRequests = 0;
  private totalResponseTime = 0;

  constructor(config: {
    apiKey: string;
    model?: string;
    dimensions?: number;
    baseUrl?: string;
  }) {
    super();
    this.apiKey = config.apiKey;
    this.model = config.model || 'text-embedding-3-large';
    this.dimensions = config.dimensions || 3072;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    const startTime = Date.now();
    this.totalRequests++;

    try {
      const result = await this.callOpenAI([text]);
      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;

      return {
        embedding: result.data[0].embedding,
        dimensions: this.dimensions,
        model: this.model,
        provider: this.provider,
        tokens_used: result.usage.total_tokens,
        cost: this.calculateCost(result.usage.total_tokens),
        processing_time_ms: responseTime
      };

    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResponse[]> {
    const startTime = Date.now();
    this.totalRequests++;

    try {
      const result = await this.callOpenAI(texts);
      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;

      return result.data.map((item, index) => ({
        embedding: item.embedding,
        dimensions: this.dimensions,
        model: this.model,
        provider: this.provider,
        tokens_used: Math.floor(result.usage.total_tokens / texts.length),
        cost: this.calculateCost(Math.floor(result.usage.total_tokens / texts.length)),
        processing_time_ms: Math.floor(responseTime / texts.length)
      }));

    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  private async callOpenAI(texts: string[]) {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: this.model,
        dimensions: this.dimensions
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  private calculateCost(tokens: number): number {
    const rates: Record<string, number> = {
      'text-embedding-3-large': 0.13 / 1000000,  // $0.13 per million tokens
      'text-embedding-3-small': 0.02 / 1000000   // $0.02 per million tokens
    };
    
    return tokens * (rates[this.model] || rates['text-embedding-3-large']);
  }

  async getHealth(): Promise<ProviderHealth> {
    const successRate = this.totalRequests > 0 ? 
      (this.totalRequests - this.errorCount) / this.totalRequests : 1;
    const averageResponseTime = this.totalRequests > 0 ? 
      this.totalResponseTime / this.totalRequests : 0;

    return {
      status: successRate >= 0.8 && averageResponseTime < 3000 ? 'healthy' : 
              successRate >= 0.5 ? 'degraded' : 'unhealthy',
      response_time: averageResponseTime,
      success_rate: successRate,
      last_checked: new Date(),
      error_count: this.errorCount,
      total_requests: this.totalRequests
    };
  }

  getCost(tokens: number): number {
    return this.calculateCost(tokens);
  }
}

// AI Provider Manager - Orchestrates multiple providers
export class AIProviderManager {
  private providers: Array<{
    provider: AIClient;
    priority: number;
    name: string;
    circuitBreakerOpen: boolean;
    lastFailure: Date | null;
  }>;
  private healthCheckInterval: number;
  private maxRetries: number;
  private circuitBreakerTimeout = 60000; // 1 minute

  constructor(config: {
    providers: Array<{
      provider: AIClient;
      priority: number;
      name: string;
    }>;
    healthCheckInterval?: number;
    maxRetries?: number;
  }) {
    this.providers = config.providers.map(p => ({
      ...p,
      circuitBreakerOpen: false,
      lastFailure: null
    }));
    this.healthCheckInterval = config.healthCheckInterval || 30000;
    this.maxRetries = config.maxRetries || 3;

    // Start health checking
    this.startHealthChecking();
  }

  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    const sortedProviders = this.getAvailableProviders();
    
    for (const providerInfo of sortedProviders) {
      try {
        const result = await providerInfo.provider.generateEmbedding(text);
        
        // Reset circuit breaker on success
        providerInfo.circuitBreakerOpen = false;
        providerInfo.lastFailure = null;
        
        return result;

      } catch (error) {
        console.warn(`Provider ${providerInfo.name} failed:`, error);
        
        // Open circuit breaker
        providerInfo.circuitBreakerOpen = true;
        providerInfo.lastFailure = new Date();
        
        continue; // Try next provider
      }
    }

    throw new Error('All AI providers are unavailable');
  }

  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResponse[]> {
    const sortedProviders = this.getAvailableProviders();
    
    for (const providerInfo of sortedProviders) {
      try {
        const result = await providerInfo.provider.generateBatchEmbeddings(texts);
        
        providerInfo.circuitBreakerOpen = false;
        providerInfo.lastFailure = null;
        
        return result;

      } catch (error) {
        console.warn(`Provider ${providerInfo.name} failed:`, error);
        
        providerInfo.circuitBreakerOpen = true;
        providerInfo.lastFailure = new Date();
        
        continue;
      }
    }

    throw new Error('All AI providers are unavailable');
  }

  private getAvailableProviders() {
    const now = new Date();
    
    return this.providers
      .filter(p => {
        // Check if circuit breaker should be reset
        if (p.circuitBreakerOpen && p.lastFailure) {
          const timeSinceFailure = now.getTime() - p.lastFailure.getTime();
          if (timeSinceFailure > this.circuitBreakerTimeout) {
            p.circuitBreakerOpen = false;
            p.lastFailure = null;
          }
        }
        
        return !p.circuitBreakerOpen;
      })
      .sort((a, b) => a.priority - b.priority);
  }

  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    available_providers: string[];
    total_providers: number;
  }> {
    const availableProviders = this.getAvailableProviders();
    const totalProviders = this.providers.length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (availableProviders.length === 0) {
      status = 'unhealthy';
    } else if (availableProviders.length < totalProviders) {
      status = 'degraded';
    }

    return {
      status,
      available_providers: availableProviders.map(p => p.name),
      total_providers: totalProviders
    };
  }

  private startHealthChecking() {
    setInterval(async () => {
      for (const providerInfo of this.providers) {
        try {
          const health = await providerInfo.provider.getHealth();
          
          // Reset circuit breaker if provider is healthy again
          if (health.status === 'healthy' && providerInfo.circuitBreakerOpen) {
            providerInfo.circuitBreakerOpen = false;
            providerInfo.lastFailure = null;
          }
          
        } catch (error) {
          console.warn(`Health check failed for ${providerInfo.name}:`, error);
        }
      }
    }, this.healthCheckInterval);
  }
}

// Health Monitor
export class HealthMonitor {
  private providers: AIClient[];
  private checkInterval: number;
  private healthThreshold: number;
  private healthCallbacks: Array<(event: any) => void> = [];
  private previousHealth: Map<string, string> = new Map();

  constructor(config: {
    providers: AIClient[];
    checkInterval?: number;
    healthThreshold?: number;
  }) {
    this.providers = config.providers;
    this.checkInterval = config.checkInterval || 30000;
    this.healthThreshold = config.healthThreshold || 0.8;
  }

  async checkHealth(providerId: string): Promise<ProviderHealth> {
    const provider = this.providers.find((p, index) => 
      p.constructor.name.toLowerCase().includes(providerId) || index.toString() === providerId
    );

    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const health = await provider.getHealth();
    
    // Check for status changes
    const previousStatus = this.previousHealth.get(providerId);
    if (previousStatus && previousStatus !== health.status) {
      this.notifyHealthChange(providerId, previousStatus, health.status);
    }
    
    this.previousHealth.set(providerId, health.status);
    
    return health;
  }

  onHealthChange(callback: (event: any) => void) {
    this.healthCallbacks.push(callback);
  }

  private notifyHealthChange(provider: string, previousStatus: string, currentStatus: string) {
    const event = {
      provider,
      previous_status: previousStatus,
      current_status: currentStatus,
      timestamp: new Date()
    };

    this.healthCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Health change callback error:', error);
      }
    });
  }
}

// Cost Tracker
export class CostTracker {
  private providers: Record<string, { cost_per_million_tokens: number }>;
  private usage: Map<string, UsageStats> = new Map();
  private userUsage: Map<string, UsageStats> = new Map();

  constructor(config: {
    providers: Record<string, { cost_per_million_tokens: number }>;
  }) {
    this.providers = config.providers;
  }

  calculateCost(model: string, tokens: number): number {
    const provider = this.providers[model];
    if (!provider) {
      throw new Error(`Unknown model: ${model}`);
    }
    
    return (tokens / 1000000) * provider.cost_per_million_tokens;
  }

  recordUsage(model: string, tokens: number, cost: number, metadata?: { user_id?: string }) {
    // Record global usage
    const existing = this.usage.get(model) || {
      total_tokens: 0,
      total_cost: 0,
      request_count: 0,
      average_tokens_per_request: 0
    };

    const updated: UsageStats = {
      total_tokens: existing.total_tokens + tokens,
      total_cost: existing.total_cost + cost,
      request_count: existing.request_count + 1,
      average_tokens_per_request: 0
    };

    updated.average_tokens_per_request = updated.total_tokens / updated.request_count;
    this.usage.set(model, updated);

    // Record user-specific usage
    if (metadata?.user_id) {
      const userKey = metadata.user_id;
      const userExisting = this.userUsage.get(userKey) || {
        total_tokens: 0,
        total_cost: 0,
        request_count: 0,
        average_tokens_per_request: 0
      };

      const userUpdated: UsageStats = {
        total_tokens: userExisting.total_tokens + tokens,
        total_cost: userExisting.total_cost + cost,
        request_count: userExisting.request_count + 1,
        average_tokens_per_request: 0
      };

      userUpdated.average_tokens_per_request = userUpdated.total_tokens / userUpdated.request_count;
      this.userUsage.set(userKey, userUpdated);
    }
  }

  getUsageStats(model: string): UsageStats {
    return this.usage.get(model) || {
      total_tokens: 0,
      total_cost: 0,
      request_count: 0,
      average_tokens_per_request: 0
    };
  }

  getUserStats(userId: string): UsageStats {
    return this.userUsage.get(userId) || {
      total_tokens: 0,
      total_cost: 0,
      request_count: 0,
      average_tokens_per_request: 0
    };
  }

  getOptimizationRecommendations() {
    const recommendations = [];

    for (const [model, stats] of this.usage.entries()) {
      // Recommend downgrading if using expensive model with small requests
      if (model === 'voyage-3-large' && stats.average_tokens_per_request < 1000) {
        const currentCost = stats.total_cost;
        const potentialCost = stats.total_tokens * (0.06 / 1000000); // voyage-3.5 cost
        const savings = currentCost - potentialCost;

        recommendations.push({
          type: 'model_downgrade',
          current_model: model,
          suggested_model: 'voyage-3.5',
          estimated_savings: savings,
          confidence: 0.8
        });
      }
    }

    return recommendations;
  }
}

// Config Manager
export class ConfigManager {
  private environment: string;
  private defaultConfig: ProviderConfig;
  private featureFlags: Map<string, boolean> = new Map();

  constructor(config: {
    environment: string;
    defaultConfig: ProviderConfig;
  }) {
    this.environment = config.environment;
    this.defaultConfig = config.defaultConfig;
  }

  getConfig(environment?: string): ProviderConfig {
    const env = environment || this.environment;
    
    // Environment-specific overrides could be loaded here
    const envConfig = { ...this.defaultConfig };
    
    if (env === 'development') {
      envConfig.health_check_interval = 60000; // Longer intervals in dev
    } else if (env === 'production') {
      envConfig.max_retries = 5; // More retries in prod
    }

    return envConfig;
  }

  getActiveConfig(): ProviderConfig {
    return this.getConfig();
  }

  setFeatureFlag(flag: string, value: boolean) {
    this.featureFlags.set(flag, value);
  }

  isFeatureFlagEnabled(flag: string): boolean {
    return this.featureFlags.get(flag) || false;
  }

  validateConfig(config: ProviderConfig) {
    if (!config.primary_provider || config.primary_provider.trim() === '') {
      throw new Error('Invalid configuration: primary_provider cannot be empty');
    }

    if (!Array.isArray(config.fallback_providers)) {
      throw new Error('Invalid configuration: fallback_providers must be an array');
    }

    if (config.health_check_interval <= 0) {
      throw new Error('Invalid configuration: health_check_interval must be positive');
    }

    if (config.max_retries < 0) {
      throw new Error('Invalid configuration: max_retries cannot be negative');
    }
  }

  validateEnvironment(): string[] {
    const warnings: string[] = [];

    if (!process.env.VOYAGE_API_KEY) {
      warnings.push('Missing VOYAGE_API_KEY');
    }

    if (!process.env.OPENAI_API_KEY) {
      warnings.push('Missing OPENAI_API_KEY');
    }

    return warnings;
  }
}