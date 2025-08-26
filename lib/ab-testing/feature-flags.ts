/**
 * A/B Testing Feature Flags System
 * Production-ready feature flagging with statistical significance tracking
 */

import { analytics } from '../analytics/analytics-client';

interface ABTestConfig {
  key: string;
  name: string;
  description: string;
  variants: {
    control: ABTestVariant;
    treatment: ABTestVariant;
  };
  allocation: {
    control: number; // 0-100
    treatment: number; // 0-100
  };
  enabled: boolean;
  startDate: string;
  endDate?: string;
  targetingRules?: TargetingRule[];
}

interface ABTestVariant {
  name: string;
  description: string;
  config?: Record<string, any>;
}

interface TargetingRule {
  type: 'user_property' | 'device' | 'location' | 'custom';
  property: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

interface UserABTestState {
  userId?: string;
  sessionId: string;
  assignments: Record<string, string>;
  exposures: Record<string, number>;
}

class FeatureFlagManager {
  private userState: UserABTestState;
  private testConfigs: Map<string, ABTestConfig> = new Map();
  private isInitialized = false;

  constructor() {
    this.userState = {
      sessionId: this.generateSessionId(),
      assignments: {},
      exposures: {},
    };
    this.loadStoredState();
    this.initializeTests();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadStoredState() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('ab_test_state');
      if (stored) {
        const parsedState = JSON.parse(stored);
        this.userState = { ...this.userState, ...parsedState };
      }
    } catch (error) {
      console.debug('Failed to load A/B test state:', error);
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('ab_test_state', JSON.stringify(this.userState));
    } catch (error) {
      console.debug('Failed to save A/B test state:', error);
    }
  }

  private async initializeTests() {
    // Load test configurations from API or static config
    const configs = await this.loadTestConfigs();
    configs.forEach(config => {
      this.testConfigs.set(config.key, config);
    });
    this.isInitialized = true;
  }

  private async loadTestConfigs(): Promise<ABTestConfig[]> {
    // In production, load from API. For now, return static config
    return [
      {
        key: 'bottom_navigation_v2',
        name: 'Bottom Navigation V2',
        description: 'Test new mobile-first bottom navigation vs old top nav',
        variants: {
          control: {
            name: 'Traditional Top Navigation',
            description: 'Standard top navigation bar',
            config: { showBottomNav: false }
          },
          treatment: {
            name: 'Mobile-First Bottom Navigation',
            description: 'Bottom navigation with mobile-optimized UX',
            config: { showBottomNav: true }
          }
        },
        allocation: {
          control: 10, // Start with 10% control
          treatment: 90 // 90% treatment for mobile-first
        },
        enabled: true,
        startDate: '2025-08-26T00:00:00Z',
        targetingRules: [
          {
            type: 'device',
            property: 'is_mobile',
            operator: 'equals',
            value: true
          }
        ]
      },
      {
        key: 'quiz_progressive_loading',
        name: 'Progressive Quiz Loading',
        description: 'Test progressive loading vs all-at-once quiz rendering',
        variants: {
          control: {
            name: 'Standard Loading',
            description: 'Load full quiz at once',
            config: { useProgressiveLoading: false }
          },
          treatment: {
            name: 'Progressive Loading',
            description: 'Load quiz questions progressively',
            config: { useProgressiveLoading: true }
          }
        },
        allocation: {
          control: 50,
          treatment: 50
        },
        enabled: true,
        startDate: '2025-08-26T00:00:00Z'
      },
      {
        key: 'collection_preview_cards',
        name: 'Collection Preview Cards',
        description: 'Test enhanced collection cards vs basic cards',
        variants: {
          control: {
            name: 'Basic Cards',
            description: 'Simple collection display cards',
            config: { enhancedCards: false }
          },
          treatment: {
            name: 'Enhanced Preview Cards',
            description: 'Rich collection cards with previews',
            config: { enhancedCards: true }
          }
        },
        allocation: {
          control: 30,
          treatment: 70
        },
        enabled: true,
        startDate: '2025-08-26T00:00:00Z'
      }
    ];
  }

  private hashUserId(userId: string, testKey: string): number {
    // Simple hash function for consistent user assignment
    let hash = 0;
    const input = userId + testKey;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }

  private evaluateTargetingRules(rules: TargetingRule[]): boolean {
    if (!rules || rules.length === 0) return true;

    return rules.every(rule => {
      switch (rule.type) {
        case 'device':
          if (rule.property === 'is_mobile') {
            const isMobile = typeof window !== 'undefined' && 
              (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768);
            return rule.operator === 'equals' ? isMobile === rule.value : isMobile !== rule.value;
          }
          break;
        case 'user_property':
          const userProperty = analytics.getUserProperty(rule.property as any);
          switch (rule.operator) {
            case 'equals':
              return userProperty === rule.value;
            case 'contains':
              return String(userProperty).includes(String(rule.value));
            default:
              return false;
          }
        default:
          return true;
      }
      return true;
    });
  }

  public getVariant(testKey: string): string | null {
    const config = this.testConfigs.get(testKey);
    if (!config || !config.enabled) return null;

    // Check if user already has assignment
    if (this.userState.assignments[testKey]) {
      return this.userState.assignments[testKey];
    }

    // Check targeting rules
    if (!this.evaluateTargetingRules(config.targetingRules || [])) {
      return null;
    }

    // Generate assignment based on user ID or session ID
    const identifier = this.userState.userId || this.userState.sessionId;
    const hash = this.hashUserId(identifier, testKey);

    let variant: string;
    if (hash < config.allocation.control) {
      variant = 'control';
    } else if (hash < config.allocation.control + config.allocation.treatment) {
      variant = 'treatment';
    } else {
      return null; // Not in test
    }

    // Store assignment
    this.userState.assignments[testKey] = variant;
    this.saveState();

    // Track assignment
    analytics.track('ab_test_assigned', {
      test_key: testKey,
      variant,
      test_name: config.name,
    });

    return variant;
  }

  public getVariantConfig(testKey: string): Record<string, any> | null {
    const variant = this.getVariant(testKey);
    if (!variant) return null;

    const config = this.testConfigs.get(testKey);
    if (!config) return null;

    return config.variants[variant as keyof typeof config.variants].config || {};
  }

  public trackExposure(testKey: string, variant: string) {
    if (!this.userState.exposures[testKey]) {
      this.userState.exposures[testKey] = 0;
    }
    this.userState.exposures[testKey]++;
    this.saveState();

    // Track exposure for statistical analysis
    analytics.track('ab_test_exposure', {
      test_key: testKey,
      variant,
      exposure_count: this.userState.exposures[testKey],
    });
  }

  public trackConversion(testKey: string, conversionType: string, value?: number) {
    const variant = this.userState.assignments[testKey];
    if (!variant) return;

    analytics.track('ab_test_conversion', {
      test_key: testKey,
      variant,
      conversion_type: conversionType,
      conversion_value: value,
    });
  }

  // Specific test helpers
  public shouldShowBottomNav(): boolean {
    const config = this.getVariantConfig('bottom_navigation_v2');
    const defaultValue = true; // Default to new bottom nav
    return config?.showBottomNav ?? defaultValue;
  }

  public shouldUseProgressiveLoading(): boolean {
    const config = this.getVariantConfig('quiz_progressive_loading');
    return config?.useProgressiveLoading ?? false;
  }

  public shouldShowEnhancedCards(): boolean {
    const config = this.getVariantConfig('collection_preview_cards');
    return config?.enhancedCards ?? false;
  }

  public setUserId(userId: string) {
    this.userState.userId = userId;
    this.saveState();
  }

  public getTestAssignments(): Record<string, string> {
    return { ...this.userState.assignments };
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager();

// React hook for feature flags
import { useState, useEffect } from 'react';

export function useFeatureFlag(testKey: string) {
  const [variant, setVariant] = useState<string | null>(null);
  const [config, setConfig] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const variantResult = featureFlags.getVariant(testKey);
    const configResult = featureFlags.getVariantConfig(testKey);
    
    setVariant(variantResult);
    setConfig(configResult);

    if (variantResult) {
      featureFlags.trackExposure(testKey, variantResult);
    }
  }, [testKey]);

  return { variant, config };
}

export type { ABTestConfig, ABTestVariant, UserABTestState };