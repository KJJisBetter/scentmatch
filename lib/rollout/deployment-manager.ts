/**
 * Deployment Manager - Production Rollout System
 * Handles phased rollouts, feature flags, and automated rollbacks
 */

import { featureFlags } from '../ab-testing/feature-flags';
import { analytics } from '../analytics/analytics-client';
import { performanceMonitor } from '../performance/performance-monitor';

interface RolloutConfig {
  feature: string;
  name: string;
  description: string;
  phases: RolloutPhase[];
  rollbackTriggers: RollbackTrigger[];
  successMetrics: SuccessMetric[];
  enabled: boolean;
}

interface RolloutPhase {
  name: string;
  percentage: number;
  duration: string; // e.g., "24h", "3d", "1w"
  targetingRules?: TargetingRule[];
  successCriteria: SuccessCriteria;
}

interface RolloutPhase {
  name: string;
  percentage: number;
  duration: string;
  targetingRules?: any[];
  successCriteria: SuccessCriteria;
}

interface SuccessCriteria {
  minSampleSize: number;
  maxErrorRate: number; // percentage
  minConversionRate?: number; // percentage
  maxP95ResponseTime?: number; // milliseconds
  minUserSatisfaction?: number; // 1-5 scale
}

interface RollbackTrigger {
  type: 'error_rate' | 'performance' | 'conversion' | 'manual';
  threshold: number;
  timeWindow: string; // e.g., "5m", "1h"
  severity: 'warning' | 'critical';
}

interface SuccessMetric {
  name: string;
  target: number;
  comparison: 'greater_than' | 'less_than' | 'equals';
  timeWindow: string;
}

interface TargetingRule {
  type: 'percentage' | 'user_property' | 'device' | 'location';
  property?: string;
  operator?: 'equals' | 'contains' | 'greater_than';
  value?: any;
}

interface DeploymentStatus {
  feature: string;
  currentPhase: string;
  phaseProgress: number; // 0-100
  usersAffected: number;
  errorRate: number;
  conversionRate?: number;
  performanceImpact: PerformanceImpact;
  canProceed: boolean;
  shouldRollback: boolean;
  metrics: Record<string, number>;
}

interface PerformanceImpact {
  responseTimeChange: number; // percentage change
  errorRateChange: number; // percentage change
  loadTimeChange: number; // percentage change
}

class DeploymentManager {
  private rollouts: Map<string, RolloutConfig> = new Map();
  private statuses: Map<string, DeploymentStatus> = new Map();
  private isInitialized = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private async initialize() {
    if (this.isInitialized) return;

    try {
      await this.loadRolloutConfigs();
      this.setupMonitoring();
      this.isInitialized = true;
      console.log('🚀 Deployment Manager initialized');
    } catch (error) {
      console.error('Deployment Manager initialization failed:', error);
    }
  }

  private async loadRolloutConfigs() {
    // Load rollout configurations - in production, this would come from a config service
    const configs: RolloutConfig[] = [
      {
        feature: 'bottom_navigation_v2',
        name: 'Mobile-First Bottom Navigation',
        description: 'Phased rollout of new mobile-first bottom navigation',
        phases: [
          {
            name: 'Canary',
            percentage: 5,
            duration: '24h',
            targetingRules: [
              { type: 'device', property: 'is_mobile', operator: 'equals', value: true }
            ],
            successCriteria: {
              minSampleSize: 100,
              maxErrorRate: 1.0,
              minConversionRate: 15.0,
              maxP95ResponseTime: 2000,
            }
          },
          {
            name: 'Limited',
            percentage: 25,
            duration: '48h',
            targetingRules: [
              { type: 'device', property: 'is_mobile', operator: 'equals', value: true }
            ],
            successCriteria: {
              minSampleSize: 500,
              maxErrorRate: 0.5,
              minConversionRate: 18.0,
              maxP95ResponseTime: 2000,
            }
          },
          {
            name: 'Gradual',
            percentage: 50,
            duration: '72h',
            successCriteria: {
              minSampleSize: 1000,
              maxErrorRate: 0.3,
              minConversionRate: 20.0,
              maxP95ResponseTime: 1800,
            }
          },
          {
            name: 'Full',
            percentage: 100,
            duration: '168h', // 1 week
            successCriteria: {
              minSampleSize: 5000,
              maxErrorRate: 0.2,
              minConversionRate: 22.0,
              maxP95ResponseTime: 1500,
            }
          }
        ],
        rollbackTriggers: [
          {
            type: 'error_rate',
            threshold: 2.0,
            timeWindow: '10m',
            severity: 'critical'
          },
          {
            type: 'performance',
            threshold: 3000, // ms
            timeWindow: '15m',
            severity: 'critical'
          },
          {
            type: 'conversion',
            threshold: -10.0, // -10% conversion rate
            timeWindow: '1h',
            severity: 'warning'
          }
        ],
        successMetrics: [
          {
            name: 'mobile_conversion_rate',
            target: 25.0,
            comparison: 'greater_than',
            timeWindow: '24h'
          },
          {
            name: 'bottom_nav_engagement',
            target: 80.0,
            comparison: 'greater_than',
            timeWindow: '24h'
          },
          {
            name: 'quiz_completion_rate',
            target: 90.0,
            comparison: 'greater_than',
            timeWindow: '24h'
          }
        ],
        enabled: true
      }
    ];

    configs.forEach(config => {
      this.rollouts.set(config.feature, config);
      this.initializeDeploymentStatus(config);
    });
  }

  private initializeDeploymentStatus(config: RolloutConfig) {
    const status: DeploymentStatus = {
      feature: config.feature,
      currentPhase: config.phases[0].name,
      phaseProgress: 0,
      usersAffected: 0,
      errorRate: 0,
      performanceImpact: {
        responseTimeChange: 0,
        errorRateChange: 0,
        loadTimeChange: 0,
      },
      canProceed: true,
      shouldRollback: false,
      metrics: {},
    };

    this.statuses.set(config.feature, status);
  }

  private setupMonitoring() {
    // Monitor deployments every minute
    this.monitoringInterval = setInterval(() => {
      this.evaluateDeployments();
    }, 60000); // 1 minute

    // Also monitor on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.evaluateDeployments();
      }
    });
  }

  private async evaluateDeployments() {
    for (const [feature, config] of this.rollouts) {
      if (!config.enabled) continue;

      try {
        await this.evaluateDeployment(feature);
      } catch (error) {
        console.error(`Failed to evaluate deployment for ${feature}:`, error);
      }
    }
  }

  private async evaluateDeployment(feature: string) {
    const config = this.rollouts.get(feature);
    const status = this.statuses.get(feature);
    
    if (!config || !status) return;

    // Get current metrics from analytics
    const metrics = await this.getCurrentMetrics(feature);
    status.metrics = metrics;

    // Check rollback triggers
    const shouldRollback = this.checkRollbackTriggers(config, metrics);
    if (shouldRollback) {
      await this.triggerRollback(feature, 'automated');
      return;
    }

    // Check if current phase is successful
    const currentPhase = this.getCurrentPhase(config, status);
    const isPhaseSuccessful = this.evaluatePhaseSuccess(currentPhase, metrics);

    if (isPhaseSuccessful && this.canProceedToNextPhase(config, status)) {
      await this.proceedToNextPhase(feature);
    }

    // Update status
    status.canProceed = isPhaseSuccessful;
    status.shouldRollback = shouldRollback;
    status.errorRate = metrics.error_rate || 0;
    status.conversionRate = metrics.conversion_rate;

    // Report status
    this.reportDeploymentStatus(feature, status);
  }

  private async getCurrentMetrics(feature: string): Promise<Record<string, number>> {
    try {
      // In production, fetch from analytics API
      const response = await fetch(`/api/analytics/track?metric=deployment_metrics&feature=${feature}&timeframe=1h`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.debug('Failed to fetch deployment metrics:', error);
    }

    // Fallback to mock metrics for development
    return this.getMockMetrics(feature);
  }

  private getMockMetrics(feature: string): Record<string, number> {
    // Generate realistic mock metrics for development
    const baseConversionRate = 20 + Math.random() * 10; // 20-30%
    const baseErrorRate = Math.random() * 0.5; // 0-0.5%
    const baseResponseTime = 1000 + Math.random() * 1000; // 1-2s

    return {
      conversion_rate: baseConversionRate,
      error_rate: baseErrorRate,
      response_time_p95: baseResponseTime,
      user_satisfaction: 4.2 + Math.random() * 0.6, // 4.2-4.8
      engagement_rate: 75 + Math.random() * 20, // 75-95%
      sample_size: Math.floor(Math.random() * 1000) + 100,
    };
  }

  private checkRollbackTriggers(config: RolloutConfig, metrics: Record<string, number>): boolean {
    return config.rollbackTriggers.some(trigger => {
      switch (trigger.type) {
        case 'error_rate':
          return (metrics.error_rate || 0) > trigger.threshold;
        case 'performance':
          return (metrics.response_time_p95 || 0) > trigger.threshold;
        case 'conversion':
          const conversionChange = (metrics.conversion_rate_change || 0);
          return conversionChange < trigger.threshold;
        default:
          return false;
      }
    });
  }

  private getCurrentPhase(config: RolloutConfig, status: DeploymentStatus): RolloutPhase {
    return config.phases.find(phase => phase.name === status.currentPhase) || config.phases[0];
  }

  private evaluatePhaseSuccess(phase: RolloutPhase, metrics: Record<string, number>): boolean {
    const criteria = phase.successCriteria;

    // Check sample size
    if ((metrics.sample_size || 0) < criteria.minSampleSize) {
      return false;
    }

    // Check error rate
    if ((metrics.error_rate || 0) > criteria.maxErrorRate) {
      return false;
    }

    // Check conversion rate
    if (criteria.minConversionRate && (metrics.conversion_rate || 0) < criteria.minConversionRate) {
      return false;
    }

    // Check response time
    if (criteria.maxP95ResponseTime && (metrics.response_time_p95 || 0) > criteria.maxP95ResponseTime) {
      return false;
    }

    // Check user satisfaction
    if (criteria.minUserSatisfaction && (metrics.user_satisfaction || 0) < criteria.minUserSatisfaction) {
      return false;
    }

    return true;
  }

  private canProceedToNextPhase(config: RolloutConfig, status: DeploymentStatus): boolean {
    const currentPhaseIndex = config.phases.findIndex(phase => phase.name === status.currentPhase);
    return currentPhaseIndex < config.phases.length - 1;
  }

  private async proceedToNextPhase(feature: string) {
    const config = this.rollouts.get(feature);
    const status = this.statuses.get(feature);
    
    if (!config || !status) return;

    const currentPhaseIndex = config.phases.findIndex(phase => phase.name === status.currentPhase);
    const nextPhase = config.phases[currentPhaseIndex + 1];

    if (nextPhase) {
      status.currentPhase = nextPhase.name;
      status.phaseProgress = 0;

      // Update feature flag allocation
      await this.updateFeatureFlagAllocation(feature, nextPhase.percentage);

      // Track phase advancement
      analytics.track('deployment_phase_advanced', {
        feature,
        previous_phase: config.phases[currentPhaseIndex].name,
        new_phase: nextPhase.name,
        new_percentage: nextPhase.percentage,
      });

      console.log(`🚀 Advanced ${feature} to ${nextPhase.name} phase (${nextPhase.percentage}%)`);
    }
  }

  private async updateFeatureFlagAllocation(feature: string, percentage: number) {
    // Update feature flag allocation - in production, this would call the feature flag service
    console.log(`Updating ${feature} allocation to ${percentage}%`);
    
    // Track the allocation change
    analytics.track('feature_flag_allocation_updated', {
      feature,
      new_percentage: percentage,
      timestamp: new Date().toISOString(),
    });
  }

  private async triggerRollback(feature: string, reason: string) {
    const status = this.statuses.get(feature);
    if (!status) return;

    // Set feature to 0% allocation
    await this.updateFeatureFlagAllocation(feature, 0);

    // Track rollback
    analytics.track('deployment_rollback_triggered', {
      feature,
      reason,
      phase: status.currentPhase,
      error_rate: status.errorRate,
      timestamp: new Date().toISOString(),
    });

    // Reset status
    status.currentPhase = 'rolled_back';
    status.phaseProgress = 0;
    status.shouldRollback = true;

    console.error(`🚨 Rolled back ${feature} due to: ${reason}`);

    // Send alert (in production, this would integrate with alerting systems)
    this.sendRollbackAlert(feature, reason, status);
  }

  private sendRollbackAlert(feature: string, reason: string, status: DeploymentStatus) {
    // In production, this would send alerts via Slack, PagerDuty, etc.
    console.error('🚨 ROLLBACK ALERT:', {
      feature,
      reason,
      status: status.currentPhase,
      errorRate: status.errorRate,
      metrics: status.metrics,
    });
  }

  private reportDeploymentStatus(feature: string, status: DeploymentStatus) {
    analytics.track('deployment_status_report', {
      feature,
      phase: status.currentPhase,
      progress: status.phaseProgress,
      users_affected: status.usersAffected,
      error_rate: status.errorRate,
      conversion_rate: status.conversionRate,
      can_proceed: status.canProceed,
      should_rollback: status.shouldRollback,
    });
  }

  // Public API
  public getDeploymentStatus(feature: string): DeploymentStatus | null {
    return this.statuses.get(feature) || null;
  }

  public getAllDeploymentStatuses(): Record<string, DeploymentStatus> {
    const result: Record<string, DeploymentStatus> = {};
    this.statuses.forEach((status, feature) => {
      result[feature] = status;
    });
    return result;
  }

  public async manualRollback(feature: string, reason: string) {
    await this.triggerRollback(feature, `manual: ${reason}`);
  }

  public async pauseDeployment(feature: string) {
    const config = this.rollouts.get(feature);
    if (config) {
      config.enabled = false;
      analytics.track('deployment_paused', { feature });
    }
  }

  public async resumeDeployment(feature: string) {
    const config = this.rollouts.get(feature);
    if (config) {
      config.enabled = true;
      analytics.track('deployment_resumed', { feature });
    }
  }

  public destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

// Singleton instance
export const deploymentManager = new DeploymentManager();

// React hook for deployment status
import { useState, useEffect } from 'react';

export function useDeploymentStatus(feature: string) {
  const [status, setStatus] = useState<DeploymentStatus | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      const currentStatus = deploymentManager.getDeploymentStatus(feature);
      setStatus(currentStatus);
    };

    updateStatus();
    
    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000);
    
    return () => clearInterval(interval);
  }, [feature]);

  return status;
}

export type { RolloutConfig, RolloutPhase, DeploymentStatus, PerformanceImpact };