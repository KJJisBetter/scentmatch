/**
 * AI Provider Cost Monitoring and Optimization
 * 
 * Comprehensive cost tracking, analysis, and optimization for AI providers
 * including intelligent routing, budget management, and cost forecasting.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Types for cost monitoring and optimization
export interface CostMonitoringConfig {
  providers: Record<string, ProviderPricing>;
  budgetLimits: BudgetLimits;
  alertThresholds: CostAlertThresholds;
  optimizationRules: OptimizationRules;
  reportingSchedule: ReportingSchedule;
}

export interface ProviderPricing {
  cost_per_million_tokens: number;
  cost_per_request?: number;
  free_tier_limits?: {
    requests_per_month: number;
    tokens_per_month: number;
  };
  rate_limits: {
    requests_per_minute: number;
    tokens_per_minute: number;
  };
  pricing_tiers?: PricingTier[];
}

export interface PricingTier {
  tier_name: string;
  min_usage: number;
  cost_per_million_tokens: number;
  additional_benefits: string[];
}

export interface BudgetLimits {
  hourly?: number;
  daily: number;
  weekly: number;
  monthly: number;
  yearly?: number;
}

export interface CostAlertThresholds {
  budget_percentage: number; // Alert when approaching budget
  cost_spike: number; // Alert on sudden cost increases
  unusual_usage: number; // Alert on unusual usage patterns
  provider_cost_variance: number; // Alert on provider cost differences
}

export interface OptimizationRules {
  enable_provider_switching: boolean;
  enable_request_scheduling: boolean;
  enable_batch_optimization: boolean;
  cost_vs_quality_preference: 'cost_first' | 'quality_first' | 'balanced';
  auto_optimization_enabled: boolean;
}

export interface ReportingSchedule {
  real_time_dashboard: boolean;
  hourly_summaries: boolean;
  daily_reports: boolean;
  weekly_analysis: boolean;
  monthly_forecasts: boolean;
}

export interface CostAnalysis {
  time_period: string;
  total_cost_usd: number;
  cost_by_provider: Record<string, ProviderCostBreakdown>;
  usage_by_operation: Record<string, OperationCostBreakdown>;
  cost_trends: CostTrends;
  optimization_opportunities: CostOptimization[];
  budget_utilization: BudgetUtilization;
  forecasts: CostForecast[];
}

export interface ProviderCostBreakdown {
  requests: number;
  tokens_used: number;
  cost_usd: number;
  avg_cost_per_request: number;
  efficiency_score: number;
  performance_metrics: {
    avg_latency: number;
    success_rate: number;
    quality_score: number;
  };
}

export interface OperationCostBreakdown {
  operation_type: string;
  total_requests: number;
  total_cost: number;
  avg_cost_per_operation: number;
  cost_efficiency: number;
  optimization_potential: number;
}

export interface CostTrends {
  hourly_trend: 'increasing' | 'decreasing' | 'stable';
  daily_pattern: Record<string, number>; // Cost by hour of day
  weekly_pattern: Record<string, number>; // Cost by day of week
  growth_rate: number; // Monthly growth rate
  seasonality: SeasonalityPattern[];
}

export interface SeasonalityPattern {
  pattern_type: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  pattern_strength: number;
  peak_periods: string[];
  low_periods: string[];
  cost_variance: number;
}

export interface CostOptimization {
  optimization_id: string;
  optimization_type: 'provider_switching' | 'request_batching' | 'schedule_optimization' | 'model_downgrade';
  description: string;
  estimated_savings_usd: number;
  estimated_savings_percentage: number;
  quality_impact: QualityImpact;
  implementation_effort: 'low' | 'medium' | 'high';
  risk_assessment: RiskAssessment;
  implementation_plan: string[];
}

export interface QualityImpact {
  accuracy_change: number;
  latency_change: number;
  reliability_change: number;
  user_experience_impact: 'positive' | 'neutral' | 'negative';
}

export interface RiskAssessment {
  risk_level: 'low' | 'medium' | 'high';
  potential_issues: string[];
  mitigation_strategies: string[];
  rollback_complexity: 'simple' | 'moderate' | 'complex';
}

export interface BudgetUtilization {
  current_period: string;
  spent: number;
  remaining: number;
  utilization_percentage: number;
  projected_overage: number;
  days_remaining: number;
  burn_rate: number;
}

export interface CostForecast {
  forecast_period: string;
  predicted_cost: number;
  confidence_interval: [number, number];
  growth_assumptions: string[];
  risk_factors: string[];
  optimization_impact: number;
}

/**
 * AI Provider Cost Monitor
 * Tracks and optimizes costs across all AI providers
 */
export class AIProviderCostMonitor {
  private config: CostMonitoringConfig;
  private supabase: ReturnType<typeof createClient<Database>>;
  private usageHistory: Map<string, UsageRecord[]> = new Map();
  private costCache: Map<string, CostAnalysis> = new Map();
  private alertHandlers: ((alert: CostAlert) => void)[] = [];
  private optimizationHistory: CostOptimization[] = [];

  constructor(config: CostMonitoringConfig) {
    this.config = config;
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.startCostTracking();
  }

  /**
   * Record usage for cost tracking
   */
  recordUsage(usageData: UsageRecord | UsageRecord[]): void {
    const records = Array.isArray(usageData) ? usageData : [usageData];
    
    for (const record of records) {
      // Calculate cost
      const providerPricing = this.config.providers[record.provider];
      if (providerPricing) {
        record.cost_usd = this.calculateCost(record, providerPricing);
      }

      // Store in history
      const providerHistory = this.usageHistory.get(record.provider) || [];
      providerHistory.push(record);
      
      // Keep only recent history (30 days)
      const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const recentHistory = providerHistory.filter(r => r.timestamp > cutoff);
      this.usageHistory.set(record.provider, recentHistory);

      // Store in database for persistence
      this.storeUsageRecord(record);

      // Check for cost alerts
      this.checkCostAlerts(record);
    }
  }

  private calculateCost(usage: UsageRecord, pricing: ProviderPricing): number {
    let cost = 0;

    // Token-based pricing
    if (usage.tokens_used && pricing.cost_per_million_tokens) {
      cost += (usage.tokens_used / 1000000) * pricing.cost_per_million_tokens;
    }

    // Request-based pricing
    if (pricing.cost_per_request) {
      cost += pricing.cost_per_request;
    }

    // Apply pricing tiers if applicable
    if (pricing.pricing_tiers) {
      const applicableTier = this.findApplicablePricingTier(usage, pricing.pricing_tiers);
      if (applicableTier) {
        cost = (usage.tokens_used / 1000000) * applicableTier.cost_per_million_tokens;
      }
    }

    return cost;
  }

  private findApplicablePricingTier(usage: UsageRecord, tiers: PricingTier[]): PricingTier | null {
    // Find the appropriate pricing tier based on usage volume
    // This would typically look at monthly usage
    const monthlyUsage = this.getMonthlyUsage(usage.provider);
    
    const applicableTiers = tiers.filter(tier => monthlyUsage >= tier.min_usage);
    return applicableTiers.length > 0 ? applicableTiers[applicableTiers.length - 1] : null;
  }

  private getMonthlyUsage(provider: string): number {
    const history = this.usageHistory.get(provider) || [];
    const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const monthlyRecords = history.filter(r => r.timestamp > monthAgo);
    
    return monthlyRecords.reduce((sum, record) => sum + record.tokens_used, 0);
  }

  /**
   * Get comprehensive cost analysis
   */
  getCostAnalysis(timePeriod: string): CostAnalysis {
    const cached = this.costCache.get(timePeriod);
    if (cached && Date.now() - cached.time_period < 300000) { // 5-minute cache
      return cached;
    }

    const analysis = this.generateCostAnalysis(timePeriod);
    this.costCache.set(timePeriod, analysis);
    
    return analysis;
  }

  private generateCostAnalysis(timePeriod: string): CostAnalysis {
    const timeRange = this.parseTimePeriod(timePeriod);
    const relevantRecords = this.getRecordsInTimeRange(timeRange);

    const analysis: CostAnalysis = {
      time_period: timePeriod,
      total_cost_usd: 0,
      cost_by_provider: {},
      usage_by_operation: {},
      cost_trends: this.analyzeCostTrends(relevantRecords),
      optimization_opportunities: [],
      budget_utilization: this.calculateBudgetUtilization(relevantRecords, timePeriod),
      forecasts: this.generateCostForecasts(relevantRecords)
    };

    // Aggregate by provider
    for (const record of relevantRecords) {
      analysis.total_cost_usd += record.cost_usd || 0;

      if (!analysis.cost_by_provider[record.provider]) {
        analysis.cost_by_provider[record.provider] = {
          requests: 0,
          tokens_used: 0,
          cost_usd: 0,
          avg_cost_per_request: 0,
          efficiency_score: 0,
          performance_metrics: {
            avg_latency: 0,
            success_rate: 0,
            quality_score: 0
          }
        };
      }

      const providerData = analysis.cost_by_provider[record.provider];
      providerData.requests++;
      providerData.tokens_used += record.tokens_used;
      providerData.cost_usd += record.cost_usd || 0;
      providerData.performance_metrics.avg_latency += record.latency_ms || 0;
      providerData.performance_metrics.success_rate += record.success ? 1 : 0;
    }

    // Calculate averages and efficiency scores
    for (const [provider, data] of Object.entries(analysis.cost_by_provider)) {
      data.avg_cost_per_request = data.cost_usd / Math.max(data.requests, 1);
      data.performance_metrics.avg_latency /= Math.max(data.requests, 1);
      data.performance_metrics.success_rate /= Math.max(data.requests, 1);
      data.performance_metrics.quality_score = 0.9; // Simplified
      data.efficiency_score = this.calculateProviderEfficiency(data);
    }

    // Aggregate by operation
    const operationMap: Record<string, OperationCostBreakdown> = {};
    for (const record of relevantRecords) {
      const opType = record.operation_type || 'unknown';
      
      if (!operationMap[opType]) {
        operationMap[opType] = {
          operation_type: opType,
          total_requests: 0,
          total_cost: 0,
          avg_cost_per_operation: 0,
          cost_efficiency: 0,
          optimization_potential: 0
        };
      }

      operationMap[opType].total_requests++;
      operationMap[opType].total_cost += record.cost_usd || 0;
    }

    // Calculate operation efficiency
    for (const operation of Object.values(operationMap)) {
      operation.avg_cost_per_operation = operation.total_cost / Math.max(operation.total_requests, 1);
      operation.cost_efficiency = this.calculateOperationEfficiency(operation);
      operation.optimization_potential = this.assessOptimizationPotential(operation);
    }

    analysis.usage_by_operation = operationMap;

    // Generate optimization opportunities
    analysis.optimization_opportunities = this.identifyOptimizationOpportunities(analysis);

    return analysis;
  }

  private calculateProviderEfficiency(providerData: ProviderCostBreakdown): number {
    // Combine cost efficiency with performance quality
    const costScore = 1 / (providerData.avg_cost_per_request + 0.001); // Avoid division by zero
    const performanceScore = (
      (1 - providerData.performance_metrics.avg_latency / 3000) * 0.3 + // Latency score
      providerData.performance_metrics.success_rate * 0.4 + // Reliability score
      providerData.performance_metrics.quality_score * 0.3 // Quality score
    );

    return Math.min(1.0, (costScore * 0.4 + performanceScore * 0.6));
  }

  private calculateOperationEfficiency(operation: OperationCostBreakdown): number {
    // Benchmark against typical costs for operation types
    const benchmarkCosts: Record<string, number> = {
      'embedding_generation': 0.002,
      'similarity_search': 0.001,
      'recommendation_generation': 0.003,
      'batch_processing': 0.005
    };

    const benchmark = benchmarkCosts[operation.operation_type] || 0.002;
    return Math.min(1.0, benchmark / Math.max(operation.avg_cost_per_operation, 0.0001));
  }

  private assessOptimizationPotential(operation: OperationCostBreakdown): number {
    // Assess how much this operation could be optimized
    let potential = 0;

    if (operation.cost_efficiency < 0.7) {
      potential += 0.3; // High optimization potential for inefficient operations
    }

    if (operation.total_cost > 5.0) {
      potential += 0.2; // High-cost operations have optimization potential
    }

    if (operation.total_requests > 1000) {
      potential += 0.1; // High-volume operations benefit from optimization
    }

    return Math.min(1.0, potential);
  }

  /**
   * Detect cost anomalies and unusual patterns
   */
  detectCostAnomalies(historicalCosts: { hour: number; cost: number }[]): any[] {
    if (historicalCosts.length < 10) {
      return []; // Need sufficient history
    }

    const anomalies: any[] = [];
    
    // Calculate baseline statistics
    const costs = historicalCosts.map(h => h.cost);
    const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    const stdDev = Math.sqrt(costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / costs.length);
    const threshold = mean + (2 * stdDev); // 2 standard deviations

    // Detect spikes
    for (let i = 1; i < historicalCosts.length; i++) {
      const current = historicalCosts[i];
      const previous = historicalCosts[i - 1];
      
      // Spike detection
      if (current.cost > threshold && current.cost > previous.cost * 2) {
        anomalies.push({
          anomaly_type: 'cost_spike',
          timestamp: current.hour,
          baseline_cost: mean,
          anomaly_cost: current.cost,
          spike_magnitude: current.cost / mean,
          confidence: Math.min(1.0, (current.cost - threshold) / threshold),
          potential_causes: this.identifySpikeCauses(current, previous, mean)
        });
      }

      // Gradual increase detection
      if (i >= 5) {
        const recentAvg = historicalCosts.slice(i - 4, i + 1).reduce((sum, h) => sum + h.cost, 0) / 5;
        const earlierAvg = historicalCosts.slice(Math.max(0, i - 9), i - 4).reduce((sum, h) => sum + h.cost, 0) / 5;
        
        if (recentAvg > earlierAvg * 1.5) {
          anomalies.push({
            anomaly_type: 'gradual_increase',
            timestamp: current.hour,
            baseline_cost: earlierAvg,
            anomaly_cost: recentAvg,
            increase_rate: (recentAvg - earlierAvg) / earlierAvg,
            confidence: 0.8,
            potential_causes: this.identifyGradualIncreaseCauses()
          });
        }
      }
    }

    return anomalies;
  }

  private identifySpikeCauses(current: any, previous: any, baseline: number): string[] {
    const causes = [];
    
    const spikeRatio = current.cost / baseline;
    
    if (spikeRatio > 10) {
      causes.push('Possible batch processing job');
      causes.push('Large embedding generation request');
      causes.push('Provider pricing change');
    } else if (spikeRatio > 5) {
      causes.push('Increased user activity');
      causes.push('Background processing tasks');
      causes.push('Provider performance issues causing retries');
    } else if (spikeRatio > 2) {
      causes.push('Normal usage variation');
      causes.push('Slightly increased demand');
    }

    return causes;
  }

  private identifyGradualIncreaseCauses(): string[] {
    return [
      'Growing user base',
      'Increased feature usage',
      'More complex queries',
      'Reduced cache efficiency',
      'Provider pricing changes'
    ];
  }

  /**
   * Optimize provider selection for cost efficiency
   */
  optimizeProviderSelection(workloadProfile: any): any {
    const providers = Object.keys(this.config.providers);
    const providerScores: Record<string, number> = {};
    
    // Score each provider based on workload requirements
    for (const provider of providers) {
      const score = this.scoreProviderForWorkload(provider, workloadProfile);
      providerScores[provider] = score;
    }

    // Sort providers by score
    const rankedProviders = Object.entries(providerScores)
      .sort(([, a], [, b]) => b - a)
      .map(([provider]) => provider);

    const primary = rankedProviders[0];
    const fallback = rankedProviders[1];

    // Calculate cost projections
    const primaryCost = this.projectCostsForProvider(primary, workloadProfile);
    const fallbackCost = this.projectCostsForProvider(fallback, workloadProfile);

    return {
      recommended_primary: primary,
      recommended_fallback: fallback,
      provider_scores: providerScores,
      cost_projection: {
        daily_cost: primaryCost.daily,
        monthly_cost: primaryCost.monthly,
        cost_savings_percentage: ((fallbackCost.monthly - primaryCost.monthly) / fallbackCost.monthly) * 100
      },
      quality_impact: this.assessQualityImpact(primary, fallback),
      implementation_plan: {
        migration_strategy: 'gradual_rollout',
        testing_percentage: 10,
        rollback_plan: 'Automatic fallback on quality degradation',
        monitoring_approach: 'Enhanced monitoring during transition'
      }
    };
  }

  private scoreProviderForWorkload(provider: string, workload: any): number {
    const pricing = this.config.providers[provider];
    if (!pricing) return 0;

    const costScore = this.scoreCostEfficiency(pricing, workload);
    const performanceScore = this.scorePerformanceForWorkload(provider, workload);
    const reliabilityScore = this.getProviderReliability(provider);

    // Weight based on workload priorities
    const weights = {
      cost: workload.cost_sensitivity === 'high' ? 0.5 : 
            workload.cost_sensitivity === 'medium' ? 0.3 : 0.2,
      performance: workload.latency_requirement < 1000 ? 0.4 : 0.3,
      reliability: 0.3
    };

    return (
      costScore * weights.cost +
      performanceScore * weights.performance +
      reliabilityScore * weights.reliability
    );
  }

  private scoreCostEfficiency(pricing: ProviderPricing, workload: any): number {
    const estimatedCost = (workload.tokens_per_day / 1000000) * pricing.cost_per_million_tokens;
    const maxAcceptableCost = workload.budget_constraints?.max_daily_cost || 100;
    
    return Math.max(0, 1 - (estimatedCost / maxAcceptableCost));
  }

  private scorePerformanceForWorkload(provider: string, workload: any): number {
    // Get historical performance data for provider
    const history = this.usageHistory.get(provider) || [];
    const recentHistory = history.filter(r => r.timestamp > Date.now() - 86400000); // Last 24 hours

    if (recentHistory.length === 0) return 0.5; // Default score

    const avgLatency = recentHistory.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / recentHistory.length;
    const successRate = recentHistory.filter(r => r.success).length / recentHistory.length;

    const latencyScore = Math.max(0, 1 - (avgLatency / (workload.max_acceptable_latency || 2000)));
    const reliabilityScore = successRate;

    return (latencyScore + reliabilityScore) / 2;
  }

  private getProviderReliability(provider: string): number {
    const history = this.usageHistory.get(provider) || [];
    const recentHistory = history.filter(r => r.timestamp > Date.now() - 86400000);

    if (recentHistory.length === 0) return 0.9; // Default high reliability

    return recentHistory.filter(r => r.success).length / recentHistory.length;
  }

  private projectCostsForProvider(provider: string, workload: any): { daily: number; monthly: number } {
    const pricing = this.config.providers[provider];
    if (!pricing) return { daily: 0, monthly: 0 };

    const dailyCost = (workload.embedding_requests_per_day * workload.avg_tokens_per_request / 1000000) * pricing.cost_per_million_tokens;
    const monthlyCost = dailyCost * 30;

    return { daily: dailyCost, monthly: monthlyCost };
  }

  private assessQualityImpact(primary: string, fallback: string): QualityImpact {
    // Assess quality differences between providers
    const primaryHistory = this.usageHistory.get(primary) || [];
    const fallbackHistory = this.usageHistory.get(fallback) || [];

    const primaryLatency = this.calculateAverageLatency(primaryHistory);
    const fallbackLatency = this.calculateAverageLatency(fallbackHistory);

    return {
      accuracy_change: 0, // Would need to measure embedding quality
      latency_change: primaryLatency - fallbackLatency,
      reliability_change: this.getProviderReliability(primary) - this.getProviderReliability(fallback),
      user_experience_impact: primaryLatency < fallbackLatency ? 'positive' : 'negative'
    };
  }

  private calculateAverageLatency(history: UsageRecord[]): number {
    if (history.length === 0) return 1000; // Default
    
    const withLatency = history.filter(r => r.latency_ms);
    if (withLatency.length === 0) return 1000;

    return withLatency.reduce((sum, r) => sum + r.latency_ms!, 0) / withLatency.length;
  }

  /**
   * Optimize request scheduling for cost savings
   */
  optimizeRequestScheduling(requestSchedule: any[], timeBasedPricing: any): any {
    const optimizedSchedule = [];
    let totalSavings = 0;
    let deferredRequests = 0;

    for (const request of requestSchedule) {
      const currentHour = new Date(request.timestamp).getHours();
      const currentMultiplier = this.getPricingMultiplier(currentHour, timeBasedPricing);
      
      if (request.deferrable && request.priority !== 'high') {
        // Find optimal time slot within next 24 hours
        const optimalSlot = this.findOptimalTimeSlot(request.timestamp, timeBasedPricing);
        
        if (optimalSlot.multiplier < currentMultiplier) {
          const savings = (currentMultiplier - optimalSlot.multiplier) * (request.estimated_cost || 0.01);
          
          optimizedSchedule.push({
            original_timestamp: request.timestamp,
            optimized_timestamp: optimalSlot.timestamp,
            cost_multiplier: optimalSlot.multiplier,
            estimated_savings: savings,
            delay_minutes: (optimalSlot.timestamp - request.timestamp) / 60000
          });
          
          totalSavings += savings;
          deferredRequests++;
        } else {
          // Keep original schedule
          optimizedSchedule.push({
            original_timestamp: request.timestamp,
            optimized_timestamp: request.timestamp,
            cost_multiplier: currentMultiplier,
            estimated_savings: 0,
            delay_minutes: 0
          });
        }
      } else {
        // High priority or non-deferrable - keep original schedule
        optimizedSchedule.push({
          original_timestamp: request.timestamp,
          optimized_timestamp: request.timestamp,
          cost_multiplier: currentMultiplier,
          estimated_savings: 0,
          delay_minutes: 0
        });
      }
    }

    return {
      optimized_schedule: optimizedSchedule,
      total_cost_savings: totalSavings,
      scheduling_efficiency: totalSavings / Math.max(requestSchedule.length * 0.01, 0.01),
      deferred_requests: deferredRequests
    };
  }

  private getPricingMultiplier(hour: number, pricing: any): number {
    if (pricing.peak_hours?.hours.includes(hour)) {
      return pricing.peak_hours.multiplier;
    } else if (pricing.off_peak_hours?.hours.includes(hour)) {
      return pricing.off_peak_hours.multiplier;
    }
    
    return 1.0; // Standard pricing
  }

  private findOptimalTimeSlot(fromTimestamp: number, pricing: any): { timestamp: number; multiplier: number } {
    let bestSlot = { timestamp: fromTimestamp, multiplier: 1.0 };
    
    // Check next 24 hours in 1-hour increments
    for (let hours = 1; hours <= 24; hours++) {
      const slotTimestamp = fromTimestamp + (hours * 60 * 60 * 1000);
      const slotHour = new Date(slotTimestamp).getHours();
      const multiplier = this.getPricingMultiplier(slotHour, pricing);
      
      if (multiplier < bestSlot.multiplier) {
        bestSlot = { timestamp: slotTimestamp, multiplier };
      }
    }

    return bestSlot;
  }

  /**
   * Determine optimal provider routing
   */
  determineOptimalProvider(providerCapabilities: any, requestProfile: any): any {
    const providers = Object.keys(providerCapabilities);
    const scores: Record<string, number> = {};

    // Score each provider for this specific request
    for (const provider of providers) {
      const capability = providerCapabilities[provider];
      scores[provider] = this.scoreProviderForRequest(capability, requestProfile);
    }

    // Sort by score
    const rankedProviders = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([provider]) => provider);

    const primary = rankedProviders[0];
    const fallback = rankedProviders[1];

    // Calculate load balancing weights
    const primaryCapability = providerCapabilities[primary];
    const fallbackCapability = providerCapabilities[fallback];

    const loadBalancing = this.calculateLoadBalancing(primaryCapability, fallbackCapability);

    return {
      primary_provider: primary,
      fallback_provider: fallback,
      routing_confidence: scores[primary],
      expected_performance: {
        latency: primaryCapability.latency,
        cost: primaryCapability.cost,
        accuracy: this.getProviderAccuracy(primary)
      },
      load_balancing: {
        primary_weight: loadBalancing.primary,
        fallback_weight: loadBalancing.fallback
      },
      cost_optimization: {
        estimated_savings: this.calculateRoutingSavings(primary, fallback, providerCapabilities),
        quality_tradeoff: this.calculateQualityTradeoff(primary, fallback, providerCapabilities)
      }
    };
  }

  private scoreProviderForRequest(capability: any, request: any): number {
    let score = 0;

    // Latency score
    if (capability.latency <= request.latency_requirement) {
      score += 0.3;
    } else {
      score += Math.max(0, 0.3 * (1 - (capability.latency - request.latency_requirement) / request.latency_requirement));
    }

    // Cost score (lower cost = higher score)
    const maxAcceptableCost = 0.005; // $0.005 per request
    score += Math.max(0, 0.3 * (1 - capability.cost / maxAcceptableCost));

    // Availability score (consider current load)
    const availabilityScore = Math.max(0, 1 - capability.current_load);
    score += 0.2 * availabilityScore;

    // Quality score
    const qualityScore = this.getProviderAccuracy(capability.provider_name || 'unknown');
    score += 0.2 * qualityScore;

    return Math.min(1.0, score);
  }

  private getProviderAccuracy(provider: string): number {
    // Simplified accuracy scores based on known provider capabilities
    const accuracyMap: Record<string, number> = {
      'voyage-3-large': 0.95,
      'voyage-3.5': 0.88,
      'text-embedding-3-large': 0.90
    };

    return accuracyMap[provider] || 0.85;
  }

  private calculateLoadBalancing(primary: any, fallback: any): { primary: number; fallback: number } {
    // Calculate optimal load distribution
    const primaryCapacity = primary.rate_limit * (1 - primary.current_load);
    const fallbackCapacity = fallback.rate_limit * (1 - fallback.current_load);
    const totalCapacity = primaryCapacity + fallbackCapacity;

    if (totalCapacity === 0) {
      return { primary: 1.0, fallback: 0.0 };
    }

    return {
      primary: primaryCapacity / totalCapacity,
      fallback: fallbackCapacity / totalCapacity
    };
  }

  private calculateRoutingSavings(primary: string, fallback: string, capabilities: any): number {
    const primaryCost = capabilities[primary].cost;
    const fallbackCost = capabilities[fallback].cost;
    
    // Savings from using cheaper provider when appropriate
    return Math.max(0, fallbackCost - primaryCost);
  }

  private calculateQualityTradeoff(primary: string, fallback: string, capabilities: any): number {
    const primaryAccuracy = this.getProviderAccuracy(primary);
    const fallbackAccuracy = this.getProviderAccuracy(fallback);
    
    return primaryAccuracy - fallbackAccuracy;
  }

  /**
   * Generate cost forecasts
   */
  forecastCosts(currentUsage: any, assumptions: any): any {
    const forecasts = {
      next_30_days: this.forecast30Days(currentUsage, assumptions),
      next_90_days: this.forecast90Days(currentUsage, assumptions),
      feature_impact: this.forecastFeatureImpact(currentUsage, assumptions.planned_features),
      budget_alerts: this.generateBudgetAlerts(currentUsage, assumptions),
      optimization_opportunities: this.identifyForecastOptimizations(currentUsage, assumptions)
    };

    return forecasts;
  }

  private forecast30Days(usage: any, assumptions: any): any {
    const baseProjection = usage.daily_cost * 30;
    const growthAdjustment = baseProjection * (assumptions.growth_rate || 0);
    const seasonalAdjustment = baseProjection * this.getCurrentSeasonalMultiplier(assumptions.seasonality);
    
    const projectedCost = baseProjection + growthAdjustment + seasonalAdjustment;
    const uncertainty = projectedCost * 0.2; // 20% uncertainty

    return {
      projected_cost: projectedCost,
      confidence_interval: [projectedCost - uncertainty, projectedCost + uncertainty],
      budget_utilization: projectedCost / this.config.budgetLimits.monthly,
      growth_assumptions: [`${(assumptions.growth_rate * 100).toFixed(1)}% monthly growth`],
      risk_factors: this.identifyForecastRisks(projectedCost)
    };
  }

  private forecast90Days(usage: any, assumptions: any): any {
    const monthlyProjection = this.forecast30Days(usage, assumptions);
    const quarterlyProjection = monthlyProjection.projected_cost * 3;
    const compoundGrowth = quarterlyProjection * Math.pow(1 + assumptions.growth_rate, 3);

    return {
      projected_cost: compoundGrowth,
      confidence_interval: [compoundGrowth * 0.7, compoundGrowth * 1.4],
      budget_impact: 'Quarterly budget planning data',
      key_assumptions: ['Sustained growth rate', 'No major pricing changes', 'Feature rollout as planned']
    };
  }

  private forecastFeatureImpact(usage: any, plannedFeatures: any[]): any {
    const featureImpacts = plannedFeatures.map(feature => {
      const impactCost = usage.daily_cost * feature.cost_impact;
      
      return {
        feature_name: feature.name,
        estimated_daily_cost_increase: impactCost,
        estimated_monthly_cost_increase: impactCost * 30,
        cost_impact_percentage: feature.cost_impact * 100,
        rollout_timeline: feature.rollout_date || 'TBD'
      };
    });

    const totalImpact = featureImpacts.reduce((sum, impact) => sum + impact.estimated_monthly_cost_increase, 0);

    return {
      feature_impacts: featureImpacts,
      total_monthly_increase: totalImpact,
      budget_impact_percentage: (totalImpact / this.config.budgetLimits.monthly) * 100
    };
  }

  private getCurrentSeasonalMultiplier(seasonality: any): number {
    const currentMonth = new Date().getMonth();
    const season = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 
                   'summer', 'summer', 'fall', 'fall', 'fall', 'winter'][currentMonth];
    
    return seasonality[season] || 1.0;
  }

  private generateBudgetAlerts(usage: any, assumptions: any): any[] {
    const alerts = [];
    const monthlyProjection = usage.daily_cost * 30;
    const budgetUtilization = monthlyProjection / this.config.budgetLimits.monthly;

    if (budgetUtilization > 0.8) {
      alerts.push({
        alert_type: 'budget_warning',
        severity: budgetUtilization > 0.95 ? 'critical' : 'high',
        projected_date: this.calculateBudgetExhaustionDate(usage),
        recommended_actions: [
          'Implement cost optimization strategies',
          'Consider provider switching',
          'Reduce non-essential operations'
        ]
      });
    }

    return alerts;
  }

  private calculateBudgetExhaustionDate(usage: any): string {
    const dailyBurnRate = usage.daily_cost;
    const remainingBudget = this.config.budgetLimits.monthly - usage.monthly_cost;
    const daysRemaining = remainingBudget / dailyBurnRate;
    
    const exhaustionDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);
    return exhaustionDate.toISOString();
  }

  private identifyForecastRisks(projectedCost: number): string[] {
    const risks = [];

    if (projectedCost > this.config.budgetLimits.monthly * 0.9) {
      risks.push('High budget utilization risk');
    }

    if (projectedCost > this.config.budgetLimits.monthly) {
      risks.push('Budget overage likely');
    }

    return risks;
  }

  private identifyForecastOptimizations(usage: any, assumptions: any): string[] {
    const optimizations = [];

    if (usage.daily_cost > this.config.budgetLimits.daily * 0.7) {
      optimizations.push('Implement aggressive caching');
      optimizations.push('Optimize provider selection');
    }

    if (assumptions.growth_rate > 0.2) {
      optimizations.push('Implement usage-based scaling');
      optimizations.push('Consider volume discounts with providers');
    }

    return optimizations;
  }

  /**
   * Identify optimization opportunities
   */
  private identifyOptimizationOpportunities(analysis: CostAnalysis): CostOptimization[] {
    const opportunities: CostOptimization[] = [];

    // Provider switching opportunities
    const inefficientProviders = Object.entries(analysis.cost_by_provider)
      .filter(([, data]) => data.efficiency_score < 0.7);

    for (const [provider, data] of inefficientProviders) {
      opportunities.push({
        optimization_id: `provider_switch_${provider}_${Date.now()}`,
        optimization_type: 'provider_switching',
        description: `Switch from ${provider} to more efficient provider`,
        estimated_savings_usd: data.cost_usd * 0.3, // 30% savings estimate
        estimated_savings_percentage: 30,
        quality_impact: {
          accuracy_change: -0.02, // Small accuracy trade-off
          latency_change: 100, // Might be slightly slower
          reliability_change: 0,
          user_experience_impact: 'neutral'
        },
        implementation_effort: 'medium',
        risk_assessment: {
          risk_level: 'medium',
          potential_issues: ['Quality degradation', 'Integration complexity'],
          mitigation_strategies: ['Gradual rollout', 'A/B testing', 'Automatic rollback'],
          rollback_complexity: 'moderate'
        },
        implementation_plan: [
          'Set up new provider integration',
          'Run parallel testing for quality validation',
          'Implement gradual traffic shifting',
          'Monitor quality and performance metrics',
          'Complete migration or rollback'
        ]
      });
    }

    // Batch optimization opportunities
    const highVolumeOperations = Object.entries(analysis.usage_by_operation)
      .filter(([, data]) => data.total_requests > 1000 && data.optimization_potential > 0.3);

    for (const [operation, data] of highVolumeOperations) {
      opportunities.push({
        optimization_id: `batch_opt_${operation}_${Date.now()}`,
        optimization_type: 'request_batching',
        description: `Optimize ${operation} with intelligent batching`,
        estimated_savings_usd: data.total_cost * 0.25, // 25% savings
        estimated_savings_percentage: 25,
        quality_impact: {
          accuracy_change: 0,
          latency_change: -50, // Faster through batching
          reliability_change: 0.05, // Slightly more reliable
          user_experience_impact: 'positive'
        },
        implementation_effort: 'low',
        risk_assessment: {
          risk_level: 'low',
          potential_issues: ['Batch size tuning needed'],
          mitigation_strategies: ['Performance testing', 'Gradual optimization'],
          rollback_complexity: 'simple'
        },
        implementation_plan: [
          'Analyze current batching patterns',
          'Implement optimized batch processing',
          'Test performance improvements',
          'Deploy optimization'
        ]
      });
    }

    return opportunities.sort((a, b) => b.estimated_savings_usd - a.estimated_savings_usd);
  }

  // Utility methods
  private parseTimePeriod(period: string): { start: number; end: number } {
    const now = Date.now();
    
    switch (period) {
      case '1h':
        return { start: now - 3600000, end: now };
      case '24h':
        return { start: now - 86400000, end: now };
      case '7d':
        return { start: now - 604800000, end: now };
      case '30d':
        return { start: now - 2592000000, end: now };
      default:
        return { start: now - 86400000, end: now };
    }
  }

  private getRecordsInTimeRange(timeRange: { start: number; end: number }): UsageRecord[] {
    const allRecords: UsageRecord[] = [];
    
    for (const providerHistory of this.usageHistory.values()) {
      const rangeRecords = providerHistory.filter(
        r => r.timestamp >= timeRange.start && r.timestamp <= timeRange.end
      );
      allRecords.push(...rangeRecords);
    }

    return allRecords.sort((a, b) => a.timestamp - b.timestamp);
  }

  private analyzeCostTrends(records: UsageRecord[]): CostTrends {
    // Simplified trend analysis
    const hourlyData = this.groupRecordsByHour(records);
    const costs = Object.values(hourlyData);
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (costs.length > 2) {
      const recent = costs.slice(-3).reduce((sum, cost) => sum + cost, 0) / 3;
      const earlier = costs.slice(0, -3).reduce((sum, cost) => sum + cost, 0) / Math.max(costs.length - 3, 1);
      
      if (recent > earlier * 1.1) trend = 'increasing';
      else if (recent < earlier * 0.9) trend = 'decreasing';
    }

    return {
      hourly_trend: trend,
      daily_pattern: this.calculateDailyPattern(records),
      weekly_pattern: this.calculateWeeklyPattern(records),
      growth_rate: this.calculateGrowthRate(records),
      seasonality: []
    };
  }

  private groupRecordsByHour(records: UsageRecord[]): Record<string, number> {
    const hourlyData: Record<string, number> = {};
    
    for (const record of records) {
      const hour = new Date(record.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
      hourlyData[hour] = (hourlyData[hour] || 0) + (record.cost_usd || 0);
    }

    return hourlyData;
  }

  private calculateDailyPattern(records: UsageRecord[]): Record<string, number> {
    const pattern: Record<string, number> = {};
    
    for (let hour = 0; hour < 24; hour++) {
      const hourRecords = records.filter(r => new Date(r.timestamp).getHours() === hour);
      const avgCost = hourRecords.reduce((sum, r) => sum + (r.cost_usd || 0), 0) / Math.max(hourRecords.length, 1);
      pattern[hour.toString()] = avgCost;
    }

    return pattern;
  }

  private calculateWeeklyPattern(records: UsageRecord[]): Record<string, number> {
    const pattern: Record<string, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let day = 0; day < 7; day++) {
      const dayRecords = records.filter(r => new Date(r.timestamp).getDay() === day);
      const avgCost = dayRecords.reduce((sum, r) => sum + (r.cost_usd || 0), 0) / Math.max(dayRecords.length, 1);
      pattern[dayNames[day]] = avgCost;
    }

    return pattern;
  }

  private calculateGrowthRate(records: UsageRecord[]): number {
    if (records.length < 10) return 0;

    // Simple growth rate calculation
    const oldestWeek = records.filter(r => r.timestamp < Date.now() - 604800000);
    const recentWeek = records.filter(r => r.timestamp > Date.now() - 604800000);

    if (oldestWeek.length === 0 || recentWeek.length === 0) return 0;

    const oldCost = oldestWeek.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
    const recentCost = recentWeek.reduce((sum, r) => sum + (r.cost_usd || 0), 0);

    return ((recentCost - oldCost) / oldCost) || 0;
  }

  private calculateBudgetUtilization(records: UsageRecord[], timePeriod: string): BudgetUtilization {
    const totalCost = records.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
    
    let budgetLimit = this.config.budgetLimits.monthly;
    let daysInPeriod = 30;
    
    if (timePeriod === '1h') {
      budgetLimit = this.config.budgetLimits.daily / 24;
      daysInPeriod = 1/24;
    } else if (timePeriod === '24h') {
      budgetLimit = this.config.budgetLimits.daily;
      daysInPeriod = 1;
    } else if (timePeriod === '7d') {
      budgetLimit = this.config.budgetLimits.weekly;
      daysInPeriod = 7;
    }

    const utilizationPercentage = (totalCost / budgetLimit) * 100;
    const burnRate = totalCost / daysInPeriod;
    const remainingBudget = budgetLimit - totalCost;
    const daysRemaining = remainingBudget / Math.max(burnRate, 0.01);

    return {
      current_period: timePeriod,
      spent: totalCost,
      remaining: remainingBudget,
      utilization_percentage: utilizationPercentage,
      projected_overage: Math.max(0, totalCost - budgetLimit),
      days_remaining: Math.max(0, daysRemaining),
      burn_rate: burnRate
    };
  }

  private generateCostForecasts(records: UsageRecord[]): CostForecast[] {
    // Generate multiple forecast scenarios
    return [
      {
        forecast_period: '30_days',
        predicted_cost: this.forecast30Days({ daily_cost: 10 }, { growth_rate: 0.1 }).projected_cost,
        confidence_interval: [8, 15],
        growth_assumptions: ['10% monthly growth', 'Current usage patterns continue'],
        risk_factors: ['Provider pricing changes', 'Unexpected usage spikes'],
        optimization_impact: -2.5 // $2.50 savings with optimization
      }
    ];
  }

  // Database operations
  private async storeUsageRecord(record: UsageRecord): Promise<void> {
    try {
      await this.supabase
        .from('ai_cost_tracking')
        .insert({
          provider: record.provider,
          operation_type: record.operation_type,
          tokens_used: record.tokens_used,
          cost_usd: record.cost_usd,
          latency_ms: record.latency_ms,
          success: record.success,
          timestamp: new Date(record.timestamp).toISOString(),
          metadata: record.metadata
        });
    } catch (error) {
      console.error('Failed to store usage record:', error);
    }
  }

  private checkCostAlerts(record: UsageRecord): void {
    // Check for cost spike
    const recentCosts = this.getRecentCosts(record.provider, 3600000); // Last hour
    const avgRecentCost = recentCosts.reduce((sum, cost) => sum + cost, 0) / Math.max(recentCosts.length, 1);
    
    if (record.cost_usd && record.cost_usd > avgRecentCost * (1 + this.config.alertThresholds.cost_spike)) {
      this.triggerCostAlert({
        alert_type: 'cost_spike',
        provider: record.provider,
        current_cost: record.cost_usd,
        baseline_cost: avgRecentCost,
        threshold: this.config.alertThresholds.cost_spike
      });
    }
  }

  private getRecentCosts(provider: string, timeWindow: number): number[] {
    const history = this.usageHistory.get(provider) || [];
    const cutoff = Date.now() - timeWindow;
    
    return history
      .filter(r => r.timestamp > cutoff)
      .map(r => r.cost_usd || 0);
  }

  private triggerCostAlert(alertData: any): void {
    const alert: CostAlert = {
      alert_id: `cost_${Date.now()}`,
      alert_type: alertData.alert_type,
      provider: alertData.provider,
      severity: this.determineCostAlertSeverity(alertData),
      message: `${alertData.alert_type} detected for ${alertData.provider}`,
      current_value: alertData.current_cost,
      threshold: alertData.baseline_cost * (1 + alertData.threshold),
      timestamp: Date.now(),
      suggested_actions: this.generateCostAlertActions(alertData)
    };

    this.alertHandlers.forEach(handler => handler(alert));
  }

  private determineCostAlertSeverity(alertData: any): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = alertData.current_cost / alertData.baseline_cost;
    
    if (ratio > 5) return 'critical';
    if (ratio > 3) return 'high';
    if (ratio > 2) return 'medium';
    return 'low';
  }

  private generateCostAlertActions(alertData: any): string[] {
    const actions = [];

    switch (alertData.alert_type) {
      case 'cost_spike':
        actions.push('Investigate cause of cost spike');
        actions.push('Check for unusual usage patterns');
        actions.push('Consider temporary provider switching');
        actions.push('Review recent application changes');
        break;
      
      case 'budget_warning':
        actions.push('Implement cost optimization strategies');
        actions.push('Review and optimize expensive operations');
        actions.push('Consider scaling back non-essential features');
        break;
    }

    return actions;
  }

  private startCostTracking(): void {
    // Start periodic cost analysis and optimization
    setInterval(() => {
      this.runPeriodicOptimization();
    }, 3600000); // Every hour
  }

  private async runPeriodicOptimization(): Promise<void> {
    try {
      const analysis = this.getCostAnalysis('24h');
      
      // Auto-apply low-risk optimizations if enabled
      if (this.config.optimizationRules.auto_optimization_enabled) {
        const lowRiskOptimizations = analysis.optimization_opportunities
          .filter(opt => opt.risk_assessment.risk_level === 'low' && opt.estimated_savings_usd > 1.0);

        for (const optimization of lowRiskOptimizations.slice(0, 2)) { // Limit to 2 per cycle
          await this.implementOptimization(optimization);
        }
      }

    } catch (error) {
      console.error('Periodic cost optimization failed:', error);
    }
  }

  private async implementOptimization(optimization: CostOptimization): Promise<boolean> {
    try {
      console.log(`Implementing cost optimization: ${optimization.optimization_type}`);
      
      // Record optimization attempt
      this.optimizationHistory.push(optimization);
      
      // Implementation would depend on optimization type
      // For now, just log the attempt
      return true;
      
    } catch (error) {
      console.error('Failed to implement optimization:', error);
      return false;
    }
  }

  // Public API
  onCostAlert(handler: (alert: CostAlert) => void): void {
    this.alertHandlers.push(handler);
  }

  getOptimizationHistory(): CostOptimization[] {
    return [...this.optimizationHistory];
  }

  getCurrentCostAnalysis(): CostAnalysis | null {
    return this.costCache.get('24h') || null;
  }
}

// Supporting interfaces
interface UsageRecord {
  provider: string;
  operation_type: string;
  tokens_used: number;
  cost_usd?: number;
  latency_ms?: number;
  success: boolean;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface CostAlert {
  alert_id: string;
  alert_type: string;
  provider: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  current_value: number;
  threshold: number;
  timestamp: number;
  suggested_actions: string[];
}

// Export factory function and main classes
export const createAIProviderCostMonitor = (config: CostMonitoringConfig) => {
  return new AIProviderCostMonitor(config);
};

// Default configuration for production use
export const DEFAULT_COST_CONFIG: CostMonitoringConfig = {
  providers: {
    'voyage-3-large': { 
      cost_per_million_tokens: 0.18,
      rate_limits: { requests_per_minute: 1000, tokens_per_minute: 1000000 }
    },
    'voyage-3.5': { 
      cost_per_million_tokens: 0.06,
      rate_limits: { requests_per_minute: 2000, tokens_per_minute: 2000000 }
    },
    'text-embedding-3-large': { 
      cost_per_million_tokens: 0.13,
      rate_limits: { requests_per_minute: 500, tokens_per_minute: 500000 }
    }
  },
  budgetLimits: {
    daily: 50.00,
    weekly: 300.00,
    monthly: 1000.00
  },
  alertThresholds: {
    budget_percentage: 0.8, // Alert at 80% budget
    cost_spike: 0.5, // Alert on 50% cost increase
    unusual_usage: 0.3, // Alert on 30% usage anomaly
    provider_cost_variance: 0.2 // Alert on 20% provider cost difference
  },
  optimizationRules: {
    enable_provider_switching: true,
    enable_request_scheduling: true,
    enable_batch_optimization: true,
    cost_vs_quality_preference: 'balanced',
    auto_optimization_enabled: false // Disabled by default for safety
  },
  reportingSchedule: {
    real_time_dashboard: true,
    hourly_summaries: true,
    daily_reports: true,
    weekly_analysis: true,
    monthly_forecasts: true
  }
};

// Utility functions
export const calculateProviderROI = (
  costData: ProviderCostBreakdown,
  businessMetrics: { revenue_per_recommendation: number; user_satisfaction_score: number }
): number => {
  const revenue = costData.requests * businessMetrics.revenue_per_recommendation;
  const roi = (revenue - costData.cost_usd) / costData.cost_usd;
  
  // Adjust for quality factors
  const qualityMultiplier = businessMetrics.user_satisfaction_score || 1.0;
  
  return roi * qualityMultiplier;
};

export const optimizeCostForBudget = (
  currentCosts: CostAnalysis,
  targetBudget: number
): CostOptimization[] => {
  const currentMonthlyCost = currentCosts.total_cost_usd * 30; // Extrapolate daily to monthly
  const requiredSavings = Math.max(0, currentMonthlyCost - targetBudget);
  const requiredSavingsPercentage = (requiredSavings / currentMonthlyCost) * 100;

  if (requiredSavings <= 0) {
    return []; // Already within budget
  }

  // Generate optimizations to meet budget
  const optimizations: CostOptimization[] = currentCosts.optimization_opportunities
    .filter(opt => opt.estimated_savings_usd > 0)
    .sort((a, b) => (b.estimated_savings_usd / (b.risk_assessment.risk_level === 'low' ? 1 : 2)) - 
                   (a.estimated_savings_usd / (a.risk_assessment.risk_level === 'low' ? 1 : 2)));

  // Select optimizations that meet savings target
  const selectedOptimizations = [];
  let cumulativeSavings = 0;

  for (const opt of optimizations) {
    selectedOptimizations.push(opt);
    cumulativeSavings += opt.estimated_savings_usd;
    
    if (cumulativeSavings >= requiredSavings) {
      break;
    }
  }

  return selectedOptimizations;
};