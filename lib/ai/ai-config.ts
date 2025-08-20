/**
 * AI Provider Configuration Management
 * 
 * Environment-based configuration with feature flags for AI provider management
 */

import { ProviderConfig } from './ai-client';

// Environment Types
export type Environment = 'development' | 'test' | 'staging' | 'production';

// Feature Flags Interface
export interface FeatureFlags {
  use_voyage_primary: boolean;
  use_openai_fallback: boolean;
  enable_cost_optimization: boolean;
  enable_batch_processing: boolean;
  use_circuit_breaker: boolean;
  enable_health_monitoring: boolean;
  debug_logging: boolean;
}

// Provider Configuration per Environment
export interface AIProviderConfig extends ProviderConfig {
  voyage: {
    api_key?: string;
    primary_model: string;
    fallback_model: string;
    max_tokens_per_request: number;
    rate_limit_rpm: number;
    timeout_ms: number;
  };
  openai: {
    api_key?: string;
    model: string;
    dimensions: number;
    max_tokens_per_request: number;
    rate_limit_rpm: number;
    timeout_ms: number;
  };
  feature_flags: FeatureFlags;
  monitoring: {
    health_check_interval: number;
    circuit_breaker_timeout: number;
    max_consecutive_failures: number;
    alert_webhook_url?: string;
  };
}

// Default configurations for each environment
const defaultConfigurations: Record<Environment, AIProviderConfig> = {
  development: {
    primary_provider: 'voyage',
    fallback_providers: ['openai'],
    health_check_interval: 60000, // 1 minute in dev
    max_retries: 2,
    voyage: {
      primary_model: 'voyage-3.5', // Use cheaper model in dev
      fallback_model: 'voyage-3.5',
      max_tokens_per_request: 8000,
      rate_limit_rpm: 100,
      timeout_ms: 10000
    },
    openai: {
      model: 'text-embedding-3-large',
      dimensions: 2048, // Match Voyage for consistency
      max_tokens_per_request: 8000,
      rate_limit_rpm: 100,
      timeout_ms: 15000
    },
    feature_flags: {
      use_voyage_primary: true,
      use_openai_fallback: true,
      enable_cost_optimization: false, // Disabled in dev
      enable_batch_processing: true,
      use_circuit_breaker: true,
      enable_health_monitoring: true,
      debug_logging: true
    },
    monitoring: {
      health_check_interval: 60000,
      circuit_breaker_timeout: 30000, // Faster recovery in dev
      max_consecutive_failures: 3,
    }
  },

  test: {
    primary_provider: 'voyage',
    fallback_providers: ['openai'],
    health_check_interval: 5000, // Fast checks in tests
    max_retries: 1,
    voyage: {
      primary_model: 'voyage-3.5',
      fallback_model: 'voyage-3.5',
      max_tokens_per_request: 1000,
      rate_limit_rpm: 10,
      timeout_ms: 5000
    },
    openai: {
      model: 'text-embedding-3-small',
      dimensions: 1024, // Smaller for tests
      max_tokens_per_request: 1000,
      rate_limit_rpm: 10,
      timeout_ms: 5000
    },
    feature_flags: {
      use_voyage_primary: true,
      use_openai_fallback: true,
      enable_cost_optimization: false,
      enable_batch_processing: true,
      use_circuit_breaker: false, // Disabled for predictable tests
      enable_health_monitoring: false,
      debug_logging: false
    },
    monitoring: {
      health_check_interval: 5000,
      circuit_breaker_timeout: 5000,
      max_consecutive_failures: 1,
    }
  },

  staging: {
    primary_provider: 'voyage',
    fallback_providers: ['openai'],
    health_check_interval: 30000,
    max_retries: 3,
    voyage: {
      primary_model: 'voyage-3-large', // Production model in staging
      fallback_model: 'voyage-3.5',
      max_tokens_per_request: 32000,
      rate_limit_rpm: 500,
      timeout_ms: 30000
    },
    openai: {
      model: 'text-embedding-3-large',
      dimensions: 2048,
      max_tokens_per_request: 8000,
      rate_limit_rpm: 300,
      timeout_ms: 20000
    },
    feature_flags: {
      use_voyage_primary: true,
      use_openai_fallback: true,
      enable_cost_optimization: true,
      enable_batch_processing: true,
      use_circuit_breaker: true,
      enable_health_monitoring: true,
      debug_logging: true
    },
    monitoring: {
      health_check_interval: 30000,
      circuit_breaker_timeout: 60000,
      max_consecutive_failures: 5,
    }
  },

  production: {
    primary_provider: 'voyage',
    fallback_providers: ['openai'],
    health_check_interval: 30000,
    max_retries: 5, // More aggressive retries in prod
    voyage: {
      primary_model: 'voyage-3-large', // Best model for production
      fallback_model: 'voyage-3.5',
      max_tokens_per_request: 32000,
      rate_limit_rpm: 1000,
      timeout_ms: 60000
    },
    openai: {
      model: 'text-embedding-3-large',
      dimensions: 2048,
      max_tokens_per_request: 8000,
      rate_limit_rpm: 500,
      timeout_ms: 30000
    },
    feature_flags: {
      use_voyage_primary: true,
      use_openai_fallback: true,
      enable_cost_optimization: true,
      enable_batch_processing: true,
      use_circuit_breaker: true,
      enable_health_monitoring: true,
      debug_logging: false // No debug logs in prod
    },
    monitoring: {
      health_check_interval: 30000,
      circuit_breaker_timeout: 300000, // 5 minutes in prod
      max_consecutive_failures: 10,
      alert_webhook_url: process.env.AI_ALERT_WEBHOOK_URL
    }
  }
};

// Enhanced Configuration Manager
export class AIConfigManager {
  private environment: Environment;
  private config: AIProviderConfig;
  private featureFlagOverrides: Map<keyof FeatureFlags, boolean> = new Map();

  constructor(environment?: Environment) {
    this.environment = environment || this.detectEnvironment();
    this.config = this.loadConfiguration();
    this.validateEnvironmentVariables();
  }

  private detectEnvironment(): Environment {
    const nodeEnv = process.env.NODE_ENV?.toLowerCase() || 'development';
    const vercelEnv = process.env.VERCEL_ENV?.toLowerCase();
    
    // Vercel-specific environment detection
    if (vercelEnv === 'production') return 'production';
    if (vercelEnv === 'preview') return 'staging';
    if (nodeEnv === 'test') return 'test';
    if (nodeEnv === 'production') return 'production';
    if (nodeEnv === 'staging') return 'staging';
    
    return 'development';
  }

  private loadConfiguration(): AIProviderConfig {
    const baseConfig = { ...defaultConfigurations[this.environment] };
    
    // Apply environment variable overrides
    baseConfig.voyage.api_key = process.env.VOYAGE_API_KEY;
    baseConfig.openai.api_key = process.env.OPENAI_API_KEY;
    
    // Override with environment-specific variables if they exist
    if (process.env.AI_HEALTH_CHECK_INTERVAL) {
      baseConfig.health_check_interval = parseInt(process.env.AI_HEALTH_CHECK_INTERVAL);
    }
    
    if (process.env.AI_MAX_RETRIES) {
      baseConfig.max_retries = parseInt(process.env.AI_MAX_RETRIES);
    }

    if (process.env.VOYAGE_PRIMARY_MODEL) {
      baseConfig.voyage.primary_model = process.env.VOYAGE_PRIMARY_MODEL;
    }

    // Feature flag overrides from environment
    if (process.env.AI_FEATURE_FLAGS) {
      try {
        const envFlags = JSON.parse(process.env.AI_FEATURE_FLAGS);
        baseConfig.feature_flags = { ...baseConfig.feature_flags, ...envFlags };
      } catch (error) {
        console.warn('Invalid AI_FEATURE_FLAGS JSON, using defaults');
      }
    }

    return baseConfig;
  }

  private validateEnvironmentVariables(): void {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required API keys
    if (!this.config.voyage.api_key && this.isFeatureEnabled('use_voyage_primary')) {
      errors.push('VOYAGE_API_KEY is required when use_voyage_primary is enabled');
    }

    if (!this.config.openai.api_key && this.isFeatureEnabled('use_openai_fallback')) {
      errors.push('OPENAI_API_KEY is required when use_openai_fallback is enabled');
    }

    // Validate configuration values
    if (this.config.health_check_interval <= 0) {
      errors.push('health_check_interval must be greater than 0');
    }

    if (this.config.max_retries < 0) {
      errors.push('max_retries cannot be negative');
    }

    // Production-specific validations
    if (this.environment === 'production') {
      if (!this.config.monitoring.alert_webhook_url) {
        warnings.push('No alert webhook URL configured for production');
      }
      
      if (this.config.feature_flags.debug_logging) {
        warnings.push('Debug logging is enabled in production');
      }
    }

    if (errors.length > 0) {
      throw new Error(`AI Configuration errors: ${errors.join(', ')}`);
    }

    if (warnings.length > 0) {
      console.warn('AI Configuration warnings:', warnings);
    }
  }

  // Public API
  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  isFeatureEnabled(flag: keyof FeatureFlags): boolean {
    // Check for runtime override first
    const override = this.featureFlagOverrides.get(flag);
    if (override !== undefined) {
      return override;
    }
    
    return this.config.feature_flags[flag];
  }

  setFeatureFlag(flag: keyof FeatureFlags, value: boolean): void {
    this.featureFlagOverrides.set(flag, value);
  }

  getVoyageConfig() {
    return {
      apiKey: this.config.voyage.api_key,
      primaryModel: this.config.voyage.primary_model,
      fallbackModel: this.config.voyage.fallback_model,
      maxTokensPerRequest: this.config.voyage.max_tokens_per_request,
      rateLimitRpm: this.config.voyage.rate_limit_rpm,
      timeoutMs: this.config.voyage.timeout_ms
    };
  }

  getOpenAIConfig() {
    return {
      apiKey: this.config.openai.api_key,
      model: this.config.openai.model,
      dimensions: this.config.openai.dimensions,
      maxTokensPerRequest: this.config.openai.max_tokens_per_request,
      rateLimitRpm: this.config.openai.rate_limit_rpm,
      timeoutMs: this.config.openai.timeout_ms
    };
  }

  getMonitoringConfig() {
    return { ...this.config.monitoring };
  }

  // Debug and monitoring helpers
  dumpConfig(): void {
    if (this.isFeatureEnabled('debug_logging')) {
      console.log('AI Configuration:', {
        environment: this.environment,
        primary_provider: this.config.primary_provider,
        fallback_providers: this.config.fallback_providers,
        feature_flags: this.config.feature_flags,
        voyage_model: this.config.voyage.primary_model,
        openai_model: this.config.openai.model,
        has_voyage_key: !!this.config.voyage.api_key,
        has_openai_key: !!this.config.openai.api_key
      });
    }
  }

  getHealthCheckConfig() {
    return {
      interval: this.config.health_check_interval,
      circuitBreakerTimeout: this.config.monitoring.circuit_breaker_timeout,
      maxConsecutiveFailures: this.config.monitoring.max_consecutive_failures,
      alertWebhookUrl: this.config.monitoring.alert_webhook_url
    };
  }
}

// Global configuration instance
let globalConfigManager: AIConfigManager | null = null;

export function getAIConfig(): AIConfigManager {
  if (!globalConfigManager) {
    globalConfigManager = new AIConfigManager();
  }
  return globalConfigManager;
}

// Helper functions for easy access
export function isAIFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return getAIConfig().isFeatureEnabled(flag);
}

export function getAIEnvironment(): Environment {
  return getAIConfig().getEnvironment();
}

// Configuration validation helper
export function validateAIConfiguration(): { valid: boolean; errors: string[] } {
  try {
    new AIConfigManager();
    return { valid: true, errors: [] };
  } catch (error) {
    return { 
      valid: false, 
      errors: [error instanceof Error ? error.message : 'Unknown configuration error'] 
    };
  }
}