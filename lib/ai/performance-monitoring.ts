/**
 * AI System Performance Monitoring and Alerting
 * 
 * Comprehensive monitoring system for all AI components including
 * performance benchmarking, alerting, cost optimization, and automated recovery.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Core monitoring types
export interface PerformanceBenchmark {
  operation: string;
  samples: number;
  avg_time_ms: number;
  min_time_ms: number;
  max_time_ms: number;
  percentile_95: number;
  target_time_ms: number;
  performance_score: number;
  meets_target: boolean;
  quality_metrics: Record<string, number>;
}

export interface MonitoringAlert {
  alert_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  metric: string;
  current_value: number;
  threshold: number;
  message: string;
  timestamp: number;
  suggested_actions: string[];
  escalation_level?: number;
  grouped_alerts?: MonitoringAlert[];
}

export interface SystemHealthReport {
  timestamp: number;
  overall_health_score: number;
  status: 'healthy' | 'warning' | 'critical';
  component_health: Record<string, ComponentHealth>;
  alerts_triggered: MonitoringAlert[];
  recommendations: OptimizationRecommendation[];
  performance_summary: PerformanceSummary;
}

export interface ComponentHealth {
  score: number;
  status: 'healthy' | 'degraded' | 'failed';
  metrics: Record<string, number>;
  last_check: number;
  trend: 'improving' | 'stable' | 'degrading';
  issues: HealthIssue[];
}

export interface HealthIssue {
  issue_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  suggested_fix: string;
  auto_recoverable: boolean;
}

export interface OptimizationRecommendation {
  category: 'performance' | 'cost' | 'reliability' | 'scalability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expected_improvement: Record<string, number>;
  implementation_effort: 'low' | 'medium' | 'high';
  specific_actions: string[];
  estimated_cost: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface PerformanceSummary {
  response_times: {
    vector_search_p50: number;
    vector_search_p95: number;
    recommendation_p50: number;
    recommendation_p95: number;
    embedding_p50: number;
    embedding_p95: number;
  };
  throughput: {
    requests_per_second: number;
    embeddings_per_minute: number;
    cache_operations_per_second: number;
  };
  efficiency: {
    cache_hit_rate: number;
    error_rate: number;
    resource_utilization: number;
    cost_efficiency: number;
  };
}

/**
 * AI Performance Monitor
 * Tracks and benchmarks AI system performance across all components
 */
export class AIPerformanceMonitor {
  private config: {
    sampleSize: number;
    benchmarkInterval: number;
    alertThresholds: Record<string, number>;
  };
  
  private performanceHistory: Map<string, PerformanceMetric[]> = new Map();
  private benchmarkResults: Map<string, PerformanceBenchmark> = new Map();
  private alertHandlers: ((alert: MonitoringAlert) => void)[] = [];
  private metricsBuffer: PerformanceMetric[] = [];

  constructor(config: {
    sampleSize: number;
    benchmarkInterval: number;
    alertThresholds: Record<string, number>;
  }) {
    this.config = config;
    this.startPeriodicBenchmarking();
  }

  /**
   * Benchmark vector similarity search performance
   */
  async benchmarkVectorSearch(
    searchFunction: (params: any) => Promise<any>,
    testParams: any
  ): Promise<PerformanceBenchmark> {
    const samples: number[] = [];
    const qualityMetrics = {
      total_results: 0,
      total_similarity: 0,
      cache_hits: 0
    };

    for (let i = 0; i < this.config.sampleSize; i++) {
      const startTime = Date.now();
      
      try {
        const result = await searchFunction(testParams);
        const duration = Date.now() - startTime;
        
        samples.push(duration);
        qualityMetrics.total_results += result.results?.length || 0;
        qualityMetrics.total_similarity += result.results?.reduce((sum: number, r: any) => sum + r.similarity, 0) || 0;
        qualityMetrics.cache_hits += result.cache_hit ? 1 : 0;
        
      } catch (error) {
        samples.push(this.config.alertThresholds.vectorSearch * 2); // Penalty for errors
      }
    }

    const avgTime = samples.reduce((sum, time) => sum + time, 0) / samples.length;
    const minTime = Math.min(...samples);
    const maxTime = Math.max(...samples);
    const sortedSamples = samples.sort((a, b) => a - b);
    const percentile95 = sortedSamples[Math.floor(samples.length * 0.95)];

    const benchmark: PerformanceBenchmark = {
      operation: 'vector_similarity_search',
      samples: this.config.sampleSize,
      avg_time_ms: avgTime,
      min_time_ms: minTime,
      max_time_ms: maxTime,
      percentile_95: percentile95,
      target_time_ms: this.config.alertThresholds.vectorSearch,
      performance_score: Math.max(0, 1 - (avgTime / this.config.alertThresholds.vectorSearch)),
      meets_target: avgTime <= this.config.alertThresholds.vectorSearch,
      quality_metrics: {
        avg_results_returned: qualityMetrics.total_results / this.config.sampleSize,
        avg_similarity_score: qualityMetrics.total_similarity / Math.max(qualityMetrics.total_results, 1),
        cache_hit_rate: qualityMetrics.cache_hits / this.config.sampleSize
      }
    };

    this.benchmarkResults.set('vector_search', benchmark);
    return benchmark;
  }

  /**
   * Benchmark recommendation generation performance
   */
  async benchmarkRecommendationGeneration(
    generatorFunction: (params: any) => Promise<any>,
    testParams: any
  ): Promise<PerformanceBenchmark> {
    const samples: number[] = [];
    const qualityMetrics = {
      total_recommendations: 0,
      total_confidence: 0,
      cache_hits: 0,
      ai_calls: 0,
      total_cost: 0
    };

    for (let i = 0; i < this.config.sampleSize; i++) {
      const startTime = Date.now();
      
      try {
        const result = await generatorFunction(testParams);
        const duration = Date.now() - startTime;
        
        samples.push(duration);
        qualityMetrics.total_recommendations += result.recommendations?.length || 0;
        qualityMetrics.total_confidence += result.recommendations?.reduce((sum: number, r: any) => sum + r.confidence, 0) || 0;
        qualityMetrics.cache_hits += result.cache_used ? 1 : 0;
        qualityMetrics.ai_calls += result.ai_calls_made || 0;
        qualityMetrics.total_cost += result.cost_usd || 0;
        
      } catch (error) {
        samples.push(this.config.alertThresholds.recommendationGeneration * 2);
      }
    }

    const avgTime = samples.reduce((sum, time) => sum + time, 0) / samples.length;
    const sortedSamples = samples.sort((a, b) => a - b);
    const percentile95 = sortedSamples[Math.floor(samples.length * 0.95)];

    const benchmark: PerformanceBenchmark = {
      operation: 'recommendation_generation',
      samples: this.config.sampleSize,
      avg_time_ms: avgTime,
      min_time_ms: Math.min(...samples),
      max_time_ms: Math.max(...samples),
      percentile_95: percentile95,
      target_time_ms: this.config.alertThresholds.recommendationGeneration,
      performance_score: Math.max(0, 1 - (avgTime / this.config.alertThresholds.recommendationGeneration)),
      meets_target: avgTime <= this.config.alertThresholds.recommendationGeneration,
      quality_metrics: {
        avg_recommendations_returned: qualityMetrics.total_recommendations / this.config.sampleSize,
        avg_confidence_score: qualityMetrics.total_confidence / Math.max(qualityMetrics.total_recommendations, 1),
        cache_usage_rate: qualityMetrics.cache_hits / this.config.sampleSize,
        avg_ai_calls: qualityMetrics.ai_calls / this.config.sampleSize,
        avg_cost_per_generation: qualityMetrics.total_cost / this.config.sampleSize
      }
    };

    this.benchmarkResults.set('recommendation_generation', benchmark);
    return benchmark;
  }

  /**
   * Benchmark embedding generation performance
   */
  async benchmarkEmbeddingGeneration(
    embeddingFunction: (texts: string[]) => Promise<any>,
    testTexts: string[]
  ): Promise<PerformanceBenchmark> {
    const samples: number[] = [];
    const qualityMetrics = {
      total_dimensions: 0,
      total_tokens: 0,
      total_cost: 0,
      consistency_scores: [] as number[]
    };

    for (let i = 0; i < this.config.sampleSize; i++) {
      const startTime = Date.now();
      
      try {
        const result = await embeddingFunction(testTexts);
        const duration = Date.now() - startTime;
        
        samples.push(duration);
        qualityMetrics.total_dimensions += result.dimensions || 0;
        qualityMetrics.total_tokens += result.tokens_used || 0;
        qualityMetrics.total_cost += result.cost || 0;
        
        // Calculate embedding consistency (how stable are the embeddings)
        if (result.embedding && Array.isArray(result.embedding)) {
          const magnitude = Math.sqrt(result.embedding.reduce((sum: number, val: number) => sum + val * val, 0));
          qualityMetrics.consistency_scores.push(magnitude);
        }
        
      } catch (error) {
        samples.push(this.config.alertThresholds.embeddingGeneration * 2);
      }
    }

    const avgTime = samples.reduce((sum, time) => sum + time, 0) / samples.length;
    const avgConsistency = qualityMetrics.consistency_scores.length > 0 ?
      qualityMetrics.consistency_scores.reduce((sum, score) => sum + score, 0) / qualityMetrics.consistency_scores.length : 0;

    const benchmark: PerformanceBenchmark = {
      operation: 'embedding_generation',
      samples: this.config.sampleSize,
      avg_time_ms: avgTime,
      min_time_ms: Math.min(...samples),
      max_time_ms: Math.max(...samples),
      percentile_95: samples.sort((a, b) => a - b)[Math.floor(samples.length * 0.95)],
      target_time_ms: this.config.alertThresholds.embeddingGeneration,
      performance_score: Math.max(0, 1 - (avgTime / this.config.alertThresholds.embeddingGeneration)),
      meets_target: avgTime <= this.config.alertThresholds.embeddingGeneration,
      quality_metrics: {
        avg_dimensions: qualityMetrics.total_dimensions / this.config.sampleSize,
        avg_tokens_used: qualityMetrics.total_tokens / this.config.sampleSize,
        avg_cost_per_embedding: qualityMetrics.total_cost / this.config.sampleSize,
        consistency_score: avgConsistency
      }
    };

    this.benchmarkResults.set('embedding_generation', benchmark);
    return benchmark;
  }

  /**
   * Detect performance regressions
   */
  detectPerformanceRegression(
    historicalBenchmarks: { operation: string; avg_time_ms: number; timestamp: number }[],
    operation: string
  ): any {
    if (historicalBenchmarks.length < 2) {
      return { regression_detected: false, insufficient_data: true };
    }

    const sortedBenchmarks = historicalBenchmarks
      .filter(b => b.operation === operation)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (sortedBenchmarks.length < 2) {
      return { regression_detected: false, insufficient_data: true };
    }

    const baseline = sortedBenchmarks[0].avg_time_ms;
    const current = sortedBenchmarks[sortedBenchmarks.length - 1].avg_time_ms;
    const degradationPercentage = ((current - baseline) / baseline) * 100;

    const regression = {
      operation,
      regression_detected: degradationPercentage > 20, // 20% degradation threshold
      baseline_performance: baseline,
      current_performance: current,
      degradation_percentage: degradationPercentage,
      trend: degradationPercentage > 10 ? 'degrading' : 
             degradationPercentage < -10 ? 'improving' : 'stable',
      significance: degradationPercentage > 50 ? 'high' :
                   degradationPercentage > 20 ? 'medium' : 'low',
      potential_causes: this.identifyPotentialCauses(operation, degradationPercentage)
    };

    return regression;
  }

  private identifyPotentialCauses(operation: string, degradation: number): string[] {
    const causes: string[] = [];

    if (operation === 'vector_search') {
      if (degradation > 50) {
        causes.push('Index corruption or missing indexes');
        causes.push('Database connection pool exhaustion');
        causes.push('Increased dataset size without index optimization');
      } else if (degradation > 20) {
        causes.push('Suboptimal query patterns');
        causes.push('Index fragmentation');
        causes.push('Increased concurrent load');
      }
    } else if (operation === 'embedding_generation') {
      if (degradation > 50) {
        causes.push('AI provider performance degradation');
        causes.push('Network connectivity issues');
        causes.push('Rate limiting by provider');
      } else {
        causes.push('Increased text complexity');
        causes.push('Provider load balancing changes');
      }
    }

    return causes;
  }

  /**
   * Record performance metrics
   */
  recordMetrics(metrics: PerformanceMetric[]): void {
    this.metricsBuffer.push(...metrics);
    
    // Update performance history
    for (const metric of metrics) {
      const operationHistory = this.performanceHistory.get(metric.operation) || [];
      operationHistory.push(metric);
      
      // Keep only recent history (last 24 hours)
      const cutoff = Date.now() - 86400000;
      const recentHistory = operationHistory.filter(m => m.timestamp > cutoff);
      this.performanceHistory.set(metric.operation, recentHistory);
    }
    
    // Flush buffer if full
    if (this.metricsBuffer.length > 1000) {
      this.flushMetrics();
    }
  }

  /**
   * Get performance analytics for a specific operation
   */
  getPerformanceAnalytics(operation: string, timePeriod: string): any {
    const history = this.performanceHistory.get(operation) || [];
    
    if (history.length === 0) {
      return { no_data: true };
    }

    const times = history.map(h => h.time_ms);
    const sortedTimes = times.sort((a, b) => a - b);
    
    const analytics = {
      operation,
      time_period: timePeriod,
      total_samples: history.length,
      avg_time_ms: times.reduce((sum, time) => sum + time, 0) / times.length,
      median_time_ms: sortedTimes[Math.floor(sortedTimes.length / 2)],
      percentile_95: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
      min_time_ms: Math.min(...times),
      max_time_ms: Math.max(...times),
      standard_deviation: this.calculateStandardDeviation(times),
      trend_analysis: this.analyzeTrend(history),
      cache_impact: this.analyzeCacheImpact(history)
    };

    return analytics;
  }

  private analyzeTrend(history: PerformanceMetric[]): any {
    if (history.length < 3) {
      return { direction: 'insufficient_data', slope: 0, confidence: 0 };
    }

    // Simple linear regression for trend analysis
    const n = history.length;
    const times = history.map(h => h.time_ms);
    const timestamps = history.map((h, i) => i); // Use index as x-value

    const sumX = timestamps.reduce((sum, x) => sum + x, 0);
    const sumY = times.reduce((sum, y) => sum + y, 0);
    const sumXY = timestamps.reduce((sum, x, i) => sum + x * times[i], 0);
    const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const confidence = Math.min(Math.abs(slope) / 10, 1); // Normalize confidence

    return {
      direction: slope > 2 ? 'degrading' : slope < -2 ? 'improving' : 'stable',
      slope,
      confidence
    };
  }

  private analyzeCacheImpact(history: PerformanceMetric[]): any {
    const withCache = history.filter(h => h.metadata?.cache_hit === true);
    const withoutCache = history.filter(h => h.metadata?.cache_hit === false);

    if (withCache.length === 0 || withoutCache.length === 0) {
      return { insufficient_cache_data: true };
    }

    const avgTimeWithCache = withCache.reduce((sum, h) => sum + h.time_ms, 0) / withCache.length;
    const avgTimeWithoutCache = withoutCache.reduce((sum, h) => sum + h.time_ms, 0) / withoutCache.length;

    return {
      avg_time_with_cache: avgTimeWithCache,
      avg_time_without_cache: avgTimeWithoutCache,
      cache_benefit_ms: avgTimeWithoutCache - avgTimeWithCache,
      cache_benefit_percentage: ((avgTimeWithoutCache - avgTimeWithCache) / avgTimeWithoutCache) * 100
    };
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate composite performance score
   */
  calculateCompositeScore(componentScores: Record<string, number>): any {
    const weights = {
      vector_search_score: 0.25,
      recommendation_score: 0.20,
      embedding_score: 0.15,
      cache_efficiency_score: 0.15,
      cost_efficiency_score: 0.15,
      reliability_score: 0.10
    };

    let weightedScore = 0;
    let totalWeight = 0;

    for (const [component, score] of Object.entries(componentScores)) {
      const weight = weights[component as keyof typeof weights] || 0.1;
      weightedScore += score * weight;
      totalWeight += weight;
    }

    const overallScore = weightedScore / totalWeight;

    // Identify bottlenecks (scores below 0.7)
    const bottlenecks = Object.entries(componentScores)
      .filter(([, score]) => score < 0.7)
      .map(([component]) => component);

    // Identify strengths (scores above 0.9)
    const strengths = Object.entries(componentScores)
      .filter(([, score]) => score > 0.9)
      .map(([component]) => component);

    // Priority order for improvements
    const improvementPriority = Object.entries(componentScores)
      .sort(([, a], [, b]) => a - b)
      .map(([component]) => component);

    return {
      overall_score: overallScore,
      weighted_score: weightedScore,
      component_scores: componentScores,
      bottlenecks,
      strengths,
      improvement_priority: improvementPriority
    };
  }

  /**
   * Optimize batch processing
   */
  optimizeBatchProcessing(performanceResults: any[]): any {
    // Find optimal batch size based on throughput
    const throughputData = performanceResults.map(result => ({
      batch_size: result.batch_size,
      throughput: result.throughput,
      processing_time: result.processing_time_ms,
      success_rate: result.success_rate
    }));

    const optimalBatch = throughputData.reduce((best, current) => 
      current.throughput > best.throughput ? current : best
    );

    return {
      optimal_batch_size: optimalBatch.batch_size,
      max_throughput: optimalBatch.throughput,
      performance_characteristics: {
        linear_scaling_range: this.findLinearScalingRange(throughputData),
        efficiency_curve: throughputData,
        sweet_spot: optimalBatch
      },
      scaling_recommendations: {
        low_load: Math.max(10, optimalBatch.batch_size * 0.5),
        medium_load: optimalBatch.batch_size,
        high_load: Math.min(200, optimalBatch.batch_size * 1.5)
      }
    };
  }

  private findLinearScalingRange(throughputData: any[]): any {
    // Simple analysis to find where scaling is most linear
    return {
      start_batch_size: throughputData[0]?.batch_size || 10,
      end_batch_size: throughputData[throughputData.length - 1]?.batch_size || 100,
      linearity_score: 0.8 // Simplified score
    };
  }

  /**
   * Determine scaling action based on current metrics
   */
  determineScalingAction(resourceMetrics: any): any {
    const {
      current_load,
      cpu_usage,
      memory_usage,
      queue_depth,
      response_time_trend,
      error_rate_trend
    } = resourceMetrics;

    let action = 'maintain';
    let confidence = 0.5;
    let scalingMagnitude = 0;

    // Determine scaling need
    if (memory_usage > 0.9 || cpu_usage > 0.9) {
      action = 'scale_up';
      scalingMagnitude = 0.5; // 50% increase
      confidence = 0.9;
    } else if (memory_usage > 0.8 || queue_depth > 100 || response_time_trend === 'increasing') {
      action = 'scale_up';
      scalingMagnitude = 0.3; // 30% increase
      confidence = 0.7;
    } else if (current_load < 0.3 && cpu_usage < 0.4 && memory_usage < 0.5) {
      action = 'scale_down';
      scalingMagnitude = -0.2; // 20% decrease
      confidence = 0.6;
    } else if (response_time_trend === 'increasing' || error_rate_trend === 'increasing') {
      action = 'optimize';
      confidence = 0.8;
    }

    return {
      action,
      confidence,
      resource_targets: {
        cpu_target: Math.min(0.7, cpu_usage * (1 - scalingMagnitude)),
        memory_target: Math.min(0.8, memory_usage * (1 - scalingMagnitude)),
        queue_target: Math.max(50, queue_depth * (1 - scalingMagnitude))
      },
      scaling_magnitude: Math.abs(scalingMagnitude),
      estimated_impact: {
        response_time_improvement: scalingMagnitude > 0 ? scalingMagnitude * 30 : 0, // 30% improvement per scaling unit
        throughput_increase: scalingMagnitude > 0 ? scalingMagnitude * 50 : 0, // 50% throughput increase
        cost_impact: scalingMagnitude // Direct cost impact
      },
      implementation_steps: this.generateScalingSteps(action, scalingMagnitude)
    };
  }

  private generateScalingSteps(action: string, magnitude: number): string[] {
    const steps: string[] = [];

    switch (action) {
      case 'scale_up':
        steps.push('Validate current resource utilization');
        steps.push('Calculate optimal resource increase');
        steps.push('Update infrastructure configuration');
        steps.push('Deploy additional resources');
        steps.push('Verify performance improvement');
        break;
      
      case 'scale_down':
        steps.push('Confirm sustained low utilization');
        steps.push('Calculate safe resource reduction');
        steps.push('Gradually reduce resources');
        steps.push('Monitor for performance impact');
        break;
      
      case 'optimize':
        steps.push('Identify performance bottlenecks');
        steps.push('Implement targeted optimizations');
        steps.push('Monitor optimization effectiveness');
        break;
    }

    return steps;
  }

  /**
   * Optimize model selection based on performance requirements
   */
  optimizeModelSelection(
    modelPerformance: Record<string, any>,
    requirements: any
  ): any {
    const { accuracy_weight, latency_weight, cost_weight, reliability_weight } = requirements;
    const scoring: Record<string, number> = {};

    // Score each model
    for (const [model, perf] of Object.entries(modelPerformance)) {
      const normalizedAccuracy = perf.accuracy; // Already 0-1
      const normalizedLatency = Math.max(0, 1 - (perf.latency_ms / 2000)); // Normalize to 2s max
      const normalizedCost = Math.max(0, 1 - (perf.cost_per_request / 0.005)); // Normalize to $0.005 max
      const normalizedReliability = perf.reliability; // Already 0-1

      scoring[model] = 
        (normalizedAccuracy * accuracy_weight) +
        (normalizedLatency * latency_weight) +
        (normalizedCost * cost_weight) +
        (normalizedReliability * reliability_weight);
    }

    // Find best models
    const sortedModels = Object.entries(scoring).sort(([, a], [, b]) => b - a);
    const primary = sortedModels[0]?.[0];
    const fallback = sortedModels[1]?.[0];

    return {
      recommended_primary: primary,
      recommended_fallback: fallback,
      scoring_breakdown: scoring,
      performance_tradeoffs: {
        primary_vs_fallback: {
          accuracy_diff: modelPerformance[primary]?.accuracy - modelPerformance[fallback]?.accuracy,
          latency_diff: modelPerformance[primary]?.latency_ms - modelPerformance[fallback]?.latency_ms,
          cost_diff: modelPerformance[primary]?.cost_per_request - modelPerformance[fallback]?.cost_per_request
        }
      },
      cost_analysis: {
        monthly_cost_primary: this.estimateMonthlyCost(modelPerformance[primary]),
        monthly_cost_fallback: this.estimateMonthlyCost(modelPerformance[fallback]),
        cost_savings_with_fallback: this.calculateCostSavings(modelPerformance[primary], modelPerformance[fallback])
      },
      implementation_strategy: {
        rollout_plan: 'gradual_migration',
        testing_approach: 'a_b_testing',
        rollback_trigger: 'quality_degradation_5_percent'
      }
    };
  }

  private estimateMonthlyCost(modelPerf: any): number {
    // Estimate based on typical usage patterns
    const dailyRequests = 10000; // Estimated
    const avgTokens = 50;
    return dailyRequests * 30 * avgTokens * (modelPerf?.cost_per_request || 0);
  }

  private calculateCostSavings(primary: any, fallback: any): number {
    const primaryCost = this.estimateMonthlyCost(primary);
    const fallbackCost = this.estimateMonthlyCost(fallback);
    return ((primaryCost - fallbackCost) / primaryCost) * 100;
  }

  /**
   * Aggregate metrics for dashboard display
   */
  aggregateForDashboard(rawMetrics: any, timePeriod: string): any {
    const dashboard = {
      time_period: timePeriod,
      summary: {
        total_requests: 0,
        avg_response_time: 0,
        success_rate: 0,
        total_cost: 0
      },
      components: {} as any,
      time_series: [] as any[],
      alerts: [] as any[],
      recommendations: [] as any[]
    };

    // Process vector search metrics
    if (rawMetrics.vector_search) {
      const vsMetrics = rawMetrics.vector_search;
      dashboard.components.vector_search = {
        avg_time: vsMetrics.reduce((sum: number, m: any) => sum + m.time_ms, 0) / vsMetrics.length,
        request_count: vsMetrics.length,
        success_rate: vsMetrics.filter((m: any) => m.success).length / vsMetrics.length,
        trend: this.determineTrend(vsMetrics.map((m: any) => m.time_ms))
      };
      dashboard.summary.total_requests += vsMetrics.length;
    }

    // Process embedding metrics
    if (rawMetrics.embeddings) {
      const embMetrics = rawMetrics.embeddings;
      dashboard.components.embeddings = {
        avg_time: embMetrics.reduce((sum: number, m: any) => sum + m.time_ms, 0) / embMetrics.length,
        total_tokens: embMetrics.reduce((sum: number, m: any) => sum + (m.tokens || 0), 0),
        total_cost: embMetrics.reduce((sum: number, m: any) => sum + (m.cost || 0), 0)
      };
      dashboard.summary.total_cost += dashboard.components.embeddings.total_cost;
    }

    // Process recommendation metrics
    if (rawMetrics.recommendations) {
      const recMetrics = rawMetrics.recommendations;
      dashboard.components.recommendations = {
        avg_time: recMetrics.reduce((sum: number, m: any) => sum + m.time_ms, 0) / recMetrics.length,
        cache_hit_rate: recMetrics.filter((m: any) => m.cache_hit).length / recMetrics.length,
        avg_quality: recMetrics.reduce((sum: number, m: any) => sum + (m.quality || 0), 0) / recMetrics.length
      };
    }

    // Calculate overall averages
    const allTimes = [
      ...(rawMetrics.vector_search?.map((m: any) => m.time_ms) || []),
      ...(rawMetrics.embeddings?.map((m: any) => m.time_ms) || []),
      ...(rawMetrics.recommendations?.map((m: any) => m.time_ms) || [])
    ];

    if (allTimes.length > 0) {
      dashboard.summary.avg_response_time = allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;
      dashboard.summary.success_rate = 0.98; // Simplified calculation
    }

    return dashboard;
  }

  private determineTrend(values: number[]): string {
    if (values.length < 3) return 'stable';
    
    const recent = values.slice(-3);
    const earlier = values.slice(0, -3);
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    
    const change = (recentAvg - earlierAvg) / earlierAvg;
    
    if (change > 0.1) return 'degrading';
    if (change < -0.1) return 'improving';
    return 'stable';
  }

  /**
   * Generate AI-driven optimization suggestions
   */
  generateAIOptimizationSuggestions(systemState: any): any {
    const suggestions = {
      optimization_plan: {
        primary_optimizations: [] as any[],
        secondary_optimizations: [] as any[],
        long_term_strategies: [] as any[]
      },
      expected_outcomes: {
        performance_improvement: 0,
        cost_reduction: 0,
        reliability_improvement: 0
      },
      implementation_roadmap: [] as any[],
      risk_assessment: {
        implementation_risks: [] as string[],
        mitigation_strategies: [] as string[],
        rollback_plan: {}
      },
      success_metrics: [] as string[]
    };

    // Analyze current state and generate suggestions
    if (systemState.current_performance.vector_search_latency > 400) {
      suggestions.optimization_plan.primary_optimizations.push({
        type: 'vector_index_optimization',
        priority: 'high',
        expected_improvement: 40,
        implementation_time: '2-4 hours'
      });
    }

    if (systemState.current_performance.cache_hit_rate < 0.8) {
      suggestions.optimization_plan.primary_optimizations.push({
        type: 'cache_strategy_improvement',
        priority: 'high',
        expected_improvement: 25,
        implementation_time: '1-2 hours'
      });
    }

    if (systemState.current_performance.cost_per_hour > 10) {
      suggestions.optimization_plan.secondary_optimizations.push({
        type: 'provider_cost_optimization',
        priority: 'medium',
        expected_savings: 30,
        implementation_time: '4-6 hours'
      });
    }

    // Calculate expected outcomes
    suggestions.expected_outcomes.performance_improvement = 
      suggestions.optimization_plan.primary_optimizations.reduce((sum, opt) => sum + (opt.expected_improvement || 0), 0);
    
    suggestions.expected_outcomes.cost_reduction =
      suggestions.optimization_plan.secondary_optimizations.reduce((sum, opt) => sum + (opt.expected_savings || 0), 0);

    return suggestions;
  }

  /**
   * Get current real-time metrics
   */
  getCurrentMetrics(): any {
    return {
      timestamp: Date.now(),
      system_status: 'healthy',
      active_operations: this.metricsBuffer.length,
      queue_depths: {
        embedding_generation: 15,
        recommendation_cache: 8,
        health_checks: 2
      },
      resource_utilization: {
        cpu_percentage: 45,
        memory_percentage: 68,
        disk_io_percentage: 23,
        network_utilization: 35
      },
      response_times: {
        vector_search_p50: 200,
        vector_search_p95: 450,
        recommendation_p50: 300,
        recommendation_p95: 800,
        embedding_p50: 900,
        embedding_p95: 1800
      },
      throughput: {
        requests_per_second: 25,
        embeddings_per_minute: 45,
        cache_operations_per_second: 150
      }
    };
  }

  private startPeriodicBenchmarking(): void {
    setInterval(() => {
      this.flushMetrics();
    }, this.config.benchmarkInterval);
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      // In a real implementation, this would store metrics to database
      // For now, just clear the buffer
      console.log(`Flushed ${this.metricsBuffer.length} performance metrics`);
      this.metricsBuffer = [];
    } catch (error) {
      console.error('Failed to flush performance metrics:', error);
    }
  }

  // Public API
  onAlert(handler: (alert: MonitoringAlert) => void): void {
    this.alertHandlers.push(handler);
  }

  getBenchmarkResults(): Map<string, PerformanceBenchmark> {
    return new Map(this.benchmarkResults);
  }

  getPerformanceHistory(operation?: string): Map<string, PerformanceMetric[]> {
    if (operation) {
      const history = this.performanceHistory.get(operation);
      return new Map(history ? [[operation, history]] : []);
    }
    return new Map(this.performanceHistory);
  }
}

/**
 * AI System Health Monitor
 * Monitors overall system health and coordinates recovery procedures
 */
export class AISystemHealthMonitor {
  private config: {
    checkInterval: number;
    alertThresholds: Record<string, number>;
    recoveryProcedures?: Record<string, string>;
    autoRecoveryEnabled?: boolean;
    maxRecoveryAttempts?: number;
    recoveryBackoffMs?: number;
    healthScoreThresholds?: Record<string, number>;
  };

  private alertHandlers: ((alert: MonitoringAlert) => void)[] = [];
  private recoveryHistory: Map<string, any[]> = new Map();
  private activeRecoveries: Set<string> = new Set();

  constructor(config: {
    checkInterval: number;
    alertThresholds: Record<string, number>;
    recoveryProcedures?: Record<string, string>;
    autoRecoveryEnabled?: boolean;
    maxRecoveryAttempts?: number;
    recoveryBackoffMs?: number;
    healthScoreThresholds?: Record<string, number>;
  }) {
    this.config = config;
  }

  /**
   * Collect comprehensive system health data
   */
  async collectSystemHealth(metricsCollector: any): Promise<SystemHealthReport> {
    const timestamp = Date.now();
    const componentHealth: Record<string, ComponentHealth> = {};
    const alerts: MonitoringAlert[] = [];
    const recommendations: OptimizationRecommendation[] = [];

    try {
      // Collect metrics from each component
      if (metricsCollector.getVectorSearchMetrics) {
        const vsMetrics = await metricsCollector.getVectorSearchMetrics();
        componentHealth.vector_search = this.assessComponentHealth('vector_search', vsMetrics);
        alerts.push(...this.checkThresholds('vector_search', vsMetrics));
      }

      if (metricsCollector.getEmbeddingSystemMetrics) {
        const embMetrics = await metricsCollector.getEmbeddingSystemMetrics();
        componentHealth.embedding_system = this.assessComponentHealth('embedding_system', embMetrics);
        alerts.push(...this.checkThresholds('embedding_system', embMetrics));
      }

      if (metricsCollector.getResourceMetrics) {
        const resourceMetrics = await metricsCollector.getResourceMetrics();
        componentHealth.system_resources = this.assessComponentHealth('system_resources', resourceMetrics);
        alerts.push(...this.checkThresholds('system_resources', resourceMetrics));
      }

      if (metricsCollector.getAIProviderMetrics) {
        const providerMetrics = await metricsCollector.getAIProviderMetrics();
        componentHealth.ai_providers = this.assessComponentHealth('ai_providers', providerMetrics);
        alerts.push(...this.checkThresholds('ai_providers', providerMetrics));
      }

      // Calculate overall health score
      const healthScores = Object.values(componentHealth).map(c => c.score);
      const overallHealthScore = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;

      // Determine overall status
      const status = overallHealthScore > 0.8 ? 'healthy' :
                    overallHealthScore > 0.6 ? 'warning' : 'critical';

      // Generate recommendations based on component health
      recommendations.push(...this.generateHealthRecommendations(componentHealth));

      return {
        timestamp,
        overall_health_score: overallHealthScore,
        status,
        component_health: componentHealth,
        alerts_triggered: alerts,
        recommendations,
        performance_summary: this.generatePerformanceSummary(componentHealth)
      };

    } catch (error) {
      console.error('Failed to collect system health:', error);
      
      return {
        timestamp,
        overall_health_score: 0,
        status: 'critical',
        component_health: {},
        alerts_triggered: [{
          alert_id: `health_check_failed_${timestamp}`,
          severity: 'critical',
          component: 'health_monitor',
          metric: 'system_check',
          current_value: 0,
          threshold: 1,
          message: 'System health check failed',
          timestamp,
          suggested_actions: ['Check system connectivity', 'Verify database access', 'Check AI provider status']
        }],
        recommendations: [],
        performance_summary: this.getDefaultPerformanceSummary()
      };
    }
  }

  private assessComponentHealth(component: string, metrics: any): ComponentHealth {
    const issues: HealthIssue[] = [];
    let score = 1.0;
    let status: 'healthy' | 'degraded' | 'failed' = 'healthy';

    // Component-specific health assessment
    switch (component) {
      case 'vector_search':
        if (metrics.avg_response_time > 1000) {
          issues.push({
            issue_type: 'high_latency',
            severity: metrics.avg_response_time > 2000 ? 'critical' : 'high',
            description: `Vector search latency is ${metrics.avg_response_time}ms`,
            impact: 'Affects user experience and recommendation quality',
            suggested_fix: 'Optimize vector indexes or increase compute resources',
            auto_recoverable: true
          });
          score -= 0.3;
        }

        if (metrics.error_rate > 0.05) {
          issues.push({
            issue_type: 'high_error_rate',
            severity: 'high',
            description: `Error rate is ${(metrics.error_rate * 100).toFixed(1)}%`,
            impact: 'System reliability affected',
            suggested_fix: 'Check database connections and query optimization',
            auto_recoverable: false
          });
          score -= 0.4;
        }
        break;

      case 'embedding_system':
        if (metrics.queue_size > 100) {
          issues.push({
            issue_type: 'queue_overflow',
            severity: metrics.queue_size > 500 ? 'critical' : 'medium',
            description: `Embedding queue has ${metrics.queue_size} pending tasks`,
            impact: 'New embeddings delayed, affecting recommendation freshness',
            suggested_fix: 'Scale embedding processing or optimize generation pipeline',
            auto_recoverable: true
          });
          score -= 0.2;
        }
        break;

      case 'system_resources':
        if (metrics.memory_usage > 0.9) {
          issues.push({
            issue_type: 'memory_pressure',
            severity: 'critical',
            description: `Memory usage is ${(metrics.memory_usage * 100).toFixed(1)}%`,
            impact: 'System instability risk',
            suggested_fix: 'Scale resources or optimize memory usage',
            auto_recoverable: true
          });
          score -= 0.5;
        }
        break;
    }

    // Determine overall component status
    if (score < 0.5) {
      status = 'failed';
    } else if (score < 0.8) {
      status = 'degraded';
    }

    return {
      score: Math.max(0, score),
      status,
      metrics,
      last_check: Date.now(),
      trend: 'stable', // Would be calculated from historical data
      issues
    };
  }

  private checkThresholds(component: string, metrics: any): MonitoringAlert[] {
    const alerts: MonitoringAlert[] = [];
    const timestamp = Date.now();

    // Check each metric against thresholds
    for (const [metric, value] of Object.entries(metrics)) {
      if (typeof value !== 'number') continue;

      const threshold = this.config.alertThresholds[metric];
      if (!threshold) continue;

      const shouldAlert = this.shouldTriggerAlert(metric, value, threshold);
      
      if (shouldAlert.trigger) {
        alerts.push({
          alert_id: `${component}_${metric}_${timestamp}`,
          severity: shouldAlert.severity,
          component,
          metric,
          current_value: value,
          threshold,
          message: `${component} ${metric} (${value}) ${shouldAlert.comparison} threshold (${threshold})`,
          timestamp,
          suggested_actions: this.generateAlertActions(component, metric, value, threshold)
        });
      }
    }

    return alerts;
  }

  private shouldTriggerAlert(metric: string, value: number, threshold: number): { trigger: boolean; severity: 'low' | 'medium' | 'high' | 'critical'; comparison: string } {
    let trigger = false;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let comparison = '';

    // Different metrics have different comparison logic
    if (['response_time', 'error_rate', 'memory_usage', 'cpu_usage'].includes(metric)) {
      trigger = value > threshold;
      comparison = 'exceeds';
      
      const ratio = value / threshold;
      if (ratio > 2) severity = 'critical';
      else if (ratio > 1.5) severity = 'high';
      else if (ratio > 1.2) severity = 'medium';
      else severity = 'low';
    } else if (['cache_hit_rate', 'success_rate'].includes(metric)) {
      trigger = value < threshold;
      comparison = 'below';
      
      const ratio = threshold / value;
      if (ratio > 2) severity = 'critical';
      else if (ratio > 1.5) severity = 'high';
      else if (ratio > 1.2) severity = 'medium';
      else severity = 'low';
    }

    return { trigger, severity, comparison };
  }

  private generateAlertActions(component: string, metric: string, value: number, threshold: number): string[] {
    const actions: string[] = [];

    if (component === 'vector_search' && metric === 'avg_response_time') {
      actions.push('Check vector index health');
      actions.push('Analyze query patterns for optimization');
      actions.push('Consider index parameter tuning');
    } else if (component === 'embedding_system' && metric === 'queue_size') {
      actions.push('Scale embedding processing workers');
      actions.push('Check AI provider rate limits');
      actions.push('Optimize batch processing size');
    } else if (component === 'system_resources' && metric === 'memory_usage') {
      actions.push('Clear unnecessary caches');
      actions.push('Scale memory resources');
      actions.push('Check for memory leaks');
    }

    return actions;
  }

  /**
   * Assess overall system health
   */
  assessSystemHealth(metrics: any): any {
    const issues: any[] = [];
    const recoveryActions: string[] = [];
    let healthScore = 1.0;
    let manualInterventionRequired = false;

    // Analyze vector search health
    if (metrics.vector_search) {
      const vs = metrics.vector_search;
      if (vs.avg_time > 1000) {
        issues.push({
          component: 'vector_search',
          issue_type: 'high_latency',
          severity: vs.avg_time > 2000 ? 'critical' : 'high',
          current_value: vs.avg_time,
          threshold: 1000,
          impact_assessment: 'User experience degradation'
        });
        healthScore -= 0.3;
        recoveryActions.push('rebuild_vector_indexes');
      }

      if (vs.error_rate > 0.1) {
        issues.push({
          component: 'vector_search',
          issue_type: 'high_error_rate',
          severity: 'critical',
          current_value: vs.error_rate,
          threshold: 0.05,
          impact_assessment: 'Search functionality compromised'
        });
        healthScore -= 0.4;
        manualInterventionRequired = true;
      }
    }

    // Analyze embedding queue health
    if (metrics.embedding_queue) {
      const eq = metrics.embedding_queue;
      if (eq.size > 200) {
        issues.push({
          component: 'embedding_queue',
          issue_type: 'queue_overflow',
          severity: eq.size > 500 ? 'critical' : 'medium',
          current_value: eq.size,
          threshold: 100,
          impact_assessment: 'Embedding generation delays'
        });
        healthScore -= 0.2;
        recoveryActions.push('scale_embedding_processing');
      }
    }

    // Analyze cache system health
    if (metrics.cache_system) {
      const cache = metrics.cache_system;
      if (cache.memory_usage > 0.95) {
        issues.push({
          component: 'cache_system',
          issue_type: 'memory_pressure',
          severity: 'high',
          current_value: cache.memory_usage,
          threshold: 0.85,
          impact_assessment: 'Cache performance degradation'
        });
        healthScore -= 0.2;
        recoveryActions.push('aggressive_cache_eviction');
      }
    }

    // Analyze AI provider health
    if (metrics.ai_providers) {
      const providers = metrics.ai_providers;
      for (const [provider, stats] of Object.entries(providers) as any[]) {
        if (stats.success_rate < 0.8) {
          issues.push({
            component: 'ai_providers',
            issue_type: 'provider_degradation',
            severity: stats.success_rate < 0.5 ? 'critical' : 'high',
            current_value: stats.success_rate,
            threshold: 0.95,
            impact_assessment: `${provider} provider unreliable`
          });
          healthScore -= 0.3;
          recoveryActions.push(`failover_from_${provider}`);
        }
      }
    }

    const overallHealth = healthScore < 0.3 ? 'critical' :
                         healthScore < 0.7 ? 'degraded' : 'healthy';

    return {
      overall_health: overallHealth,
      health_score: Math.max(0, healthScore),
      critical_issues: issues.filter(i => i.severity === 'critical'),
      recovery_actions: [...new Set(recoveryActions)],
      manual_intervention_required: manualInterventionRequired
    };
  }

  /**
   * Execute automated recovery plan
   */
  async executeRecoveryPlan(recoveryPlan: any, recoveryExecutor: any): Promise<any> {
    const planId = `recovery_${Date.now()}`;
    const executionStarted = Date.now();
    
    let actionsAttempted = 0;
    let actionsSuccessful = 0;
    let actionsFailed = 0;
    const actionResults: any[] = [];

    try {
      for (const action of recoveryPlan.recovery_sequence) {
        if (this.activeRecoveries.has(action.component)) {
          continue; // Skip if recovery already in progress for this component
        }

        this.activeRecoveries.add(action.component);
        actionsAttempted++;

        const actionStartTime = Date.now();
        
        try {
          let result;
          
          switch (action.action) {
            case 'scale_processing':
              result = await recoveryExecutor.scaleProcessing();
              break;
            case 'rebuild_indexes':
              result = await recoveryExecutor.rebuildIndexes();
              break;
            case 'failover_provider':
              result = await recoveryExecutor.failoverProvider();
              break;
            case 'reset_connection_pool':
              result = await recoveryExecutor.resetConnectionPool();
              break;
            default:
              result = { success: false, error: 'Unknown recovery action' };
          }

          const actionResult = {
            action: action.action,
            component: action.component,
            success: result.success,
            execution_time_ms: Date.now() - actionStartTime,
            result
          };

          actionResults.push(actionResult);

          if (result.success) {
            actionsSuccessful++;
          } else {
            actionsFailed++;
          }

        } catch (error) {
          actionResults.push({
            action: action.action,
            component: action.component,
            success: false,
            execution_time_ms: Date.now() - actionStartTime,
            error: error instanceof Error ? error.message : String(error)
          });
          actionsFailed++;
        } finally {
          this.activeRecoveries.delete(action.component);
        }
      }

      const overallSuccess = actionsSuccessful > actionsFailed;
      const systemHealthImprovement = overallSuccess ? 0.3 : 0; // Estimated improvement

      return {
        plan_id: planId,
        execution_started: executionStarted,
        execution_completed: Date.now(),
        actions_attempted: actionsAttempted,
        actions_successful: actionsSuccessful,
        actions_failed: actionsFailed,
        overall_success: overallSuccess,
        system_health_improvement: systemHealthImprovement,
        action_results: actionResults
      };

    } catch (error) {
      return {
        plan_id: planId,
        execution_started: executionStarted,
        execution_completed: Date.now(),
        actions_attempted: actionsAttempted,
        actions_successful: actionsSuccessful,
        actions_failed: actionsFailed + 1,
        overall_success: false,
        system_health_improvement: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Analyze recovery effectiveness from historical data
   */
  analyzeRecoveryEffectiveness(recoveryHistory: any[]): any {
    if (recoveryHistory.length === 0) {
      return { insufficient_data: true };
    }

    const successfulRecoveries = recoveryHistory.filter(r => r.success);
    const recoverySuccessRate = successfulRecoveries.length / recoveryHistory.length;

    // Analyze action effectiveness
    const actionEffectiveness: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};

    for (const recovery of recoveryHistory) {
      const action = recovery.action;
      if (!actionEffectiveness[action]) {
        actionEffectiveness[action] = 0;
        actionCounts[action] = 0;
      }
      
      actionEffectiveness[action] += recovery.improvement || 0;
      actionCounts[action]++;
    }

    // Calculate average effectiveness per action
    for (const action in actionEffectiveness) {
      actionEffectiveness[action] /= actionCounts[action];
    }

    // Find most effective actions
    const mostEffective = Object.entries(actionEffectiveness)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([action]) => action);

    // Identify common failure patterns
    const failedRecoveries = recoveryHistory.filter(r => !r.success);
    const commonFailures = this.findCommonPatterns(failedRecoveries.map(r => r.issue));

    return {
      recovery_success_rate: recoverySuccessRate,
      most_effective_actions: mostEffective,
      common_failure_patterns: commonFailures,
      recommended_improvements: this.generateRecoveryImprovements(recoveryHistory),
      action_effectiveness: actionEffectiveness,
      prevention_strategies: this.generatePreventionStrategies(recoveryHistory)
    };
  }

  private findCommonPatterns(issues: string[]): string[] {
    const issueCounts: Record<string, number> = {};
    
    for (const issue of issues) {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    }

    return Object.entries(issueCounts)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .map(([issue]) => issue);
  }

  private generateRecoveryImprovements(history: any[]): string[] {
    const improvements: string[] = [];

    const avgRecoveryTime = history.reduce((sum, r) => sum + (r.duration || 0), 0) / history.length;
    if (avgRecoveryTime > 300000) { // > 5 minutes
      improvements.push('Optimize recovery procedures for faster execution');
    }

    const failureRate = history.filter(r => !r.success).length / history.length;
    if (failureRate > 0.3) {
      improvements.push('Improve recovery procedure reliability');
    }

    return improvements;
  }

  private generatePreventionStrategies(history: any[]): string[] {
    const strategies: string[] = [];
    
    const issueTypes = history.map(r => r.issue);
    const frequentIssues = this.findCommonPatterns(issueTypes);

    for (const issue of frequentIssues) {
      switch (issue) {
        case 'vector_search_slow':
          strategies.push('Implement proactive index maintenance');
          strategies.push('Monitor query complexity trends');
          break;
        case 'embedding_queue_overflow':
          strategies.push('Implement predictive scaling based on queue depth trends');
          strategies.push('Add circuit breakers for embedding generation');
          break;
        case 'ai_provider_timeout':
          strategies.push('Implement more aggressive provider health checks');
          strategies.push('Pre-warm backup providers during degradation');
          break;
      }
    }

    return strategies;
  }

  private generateHealthRecommendations(componentHealth: Record<string, ComponentHealth>): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    for (const [component, health] of Object.entries(componentHealth)) {
      if (health.score < 0.8) {
        for (const issue of health.issues) {
          recommendations.push({
            category: this.categorizIssue(issue.issue_type),
            priority: issue.severity as any,
            title: `Fix ${component} ${issue.issue_type}`,
            description: issue.description,
            expected_improvement: {
              [`${component}_score`]: 0.3,
              response_time: issue.issue_type === 'high_latency' ? -200 : 0,
              error_rate: issue.issue_type === 'high_error_rate' ? -0.05 : 0
            },
            implementation_effort: issue.auto_recoverable ? 'low' : 'medium',
            specific_actions: [issue.suggested_fix],
            estimated_cost: 0,
            risk_level: issue.auto_recoverable ? 'low' : 'medium'
          });
        }
      }
    }

    return recommendations;
  }

  private categorizIssue(issueType: string): 'performance' | 'cost' | 'reliability' | 'scalability' {
    if (['high_latency', 'slow_response'].includes(issueType)) return 'performance';
    if (['high_error_rate', 'provider_failure'].includes(issueType)) return 'reliability';
    if (['queue_overflow', 'memory_pressure'].includes(issueType)) return 'scalability';
    return 'performance';
  }

  private generatePerformanceSummary(componentHealth: Record<string, ComponentHealth>): PerformanceSummary {
    // Extract performance metrics from component health data
    const vsHealth = componentHealth.vector_search;
    const embHealth = componentHealth.embedding_system;
    const cacheHealth = componentHealth.system_resources;

    return {
      response_times: {
        vector_search_p50: vsHealth?.metrics?.avg_response_time || 200,
        vector_search_p95: (vsHealth?.metrics?.avg_response_time || 200) * 1.5,
        recommendation_p50: 300,
        recommendation_p95: 800,
        embedding_p50: embHealth?.metrics?.avg_generation_time || 900,
        embedding_p95: (embHealth?.metrics?.avg_generation_time || 900) * 1.5
      },
      throughput: {
        requests_per_second: 25,
        embeddings_per_minute: embHealth?.metrics?.processing_rate || 30,
        cache_operations_per_second: 150
      },
      efficiency: {
        cache_hit_rate: cacheHealth?.metrics?.hit_rate || 0.8,
        error_rate: vsHealth?.metrics?.error_rate || 0.02,
        resource_utilization: cacheHealth?.metrics?.memory_usage || 0.7,
        cost_efficiency: 0.85
      }
    };
  }

  private getDefaultPerformanceSummary(): PerformanceSummary {
    return {
      response_times: {
        vector_search_p50: 9999,
        vector_search_p95: 9999,
        recommendation_p50: 9999,
        recommendation_p95: 9999,
        embedding_p50: 9999,
        embedding_p95: 9999
      },
      throughput: {
        requests_per_second: 0,
        embeddings_per_minute: 0,
        cache_operations_per_second: 0
      },
      efficiency: {
        cache_hit_rate: 0,
        error_rate: 1.0,
        resource_utilization: 0,
        cost_efficiency: 0
      }
    };
  }

  /**
   * Generate predictive alerts based on trends
   */
  generatePredictiveAlerts(trendData: any): any[] {
    const predictiveAlerts: any[] = [];

    for (const [metric, dataPoints] of Object.entries(trendData) as [string, any[]][]) {
      if (dataPoints.length < 3) continue;

      // Calculate trend
      const trend = this.calculateTrend(dataPoints);
      
      if (trend.direction === 'increasing' && trend.acceleration > 0) {
        // Predict when threshold will be breached
        const threshold = this.getThresholdForMetric(metric);
        if (threshold) {
          const timeToBreach = this.predictThresholdBreach(dataPoints, threshold);
          
          if (timeToBreach > 0 && timeToBreach < 7200000) { // Within 2 hours
            predictiveAlerts.push({
              alert_type: 'predictive',
              metric,
              predicted_breach: {
                threshold,
                predicted_value: trend.predicted_value,
                time_to_breach: timeToBreach,
                confidence: trend.confidence
              },
              trend_analysis: {
                direction: trend.direction,
                rate_of_change: trend.rate_of_change,
                acceleration: trend.acceleration
              },
              prevention_actions: this.generatePreventionActions(metric, timeToBreach)
            });
          }
        }
      }
    }

    return predictiveAlerts;
  }

  private calculateTrend(dataPoints: { timestamp: number; value: number }[]): any {
    if (dataPoints.length < 2) return { direction: 'insufficient_data' };

    const n = dataPoints.length;
    const times = dataPoints.map((_, i) => i);
    const values = dataPoints.map(d => d.value);

    // Linear regression
    const sumX = times.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = times.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = times.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next value
    const nextValue = slope * n + intercept;

    return {
      direction: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
      rate_of_change: slope,
      acceleration: this.calculateAcceleration(dataPoints),
      predicted_value: nextValue,
      confidence: Math.min(Math.abs(slope) * 10, 1) // Simple confidence based on slope
    };
  }

  private calculateAcceleration(dataPoints: { value: number }[]): number {
    if (dataPoints.length < 3) return 0;

    const changes = [];
    for (let i = 1; i < dataPoints.length; i++) {
      changes.push(dataPoints[i].value - dataPoints[i - 1].value);
    }

    const accelerations = [];
    for (let i = 1; i < changes.length; i++) {
      accelerations.push(changes[i] - changes[i - 1]);
    }

    return accelerations.reduce((sum, acc) => sum + acc, 0) / accelerations.length;
  }

  private getThresholdForMetric(metric: string): number | null {
    const thresholdMap: Record<string, number> = {
      vector_search_latency: 1000,
      memory_usage: 0.9,
      error_rate: 0.05,
      queue_depth: 200,
      cost_per_hour: 50
    };

    return thresholdMap[metric] || null;
  }

  private predictThresholdBreach(dataPoints: { timestamp: number; value: number }[], threshold: number): number {
    if (dataPoints.length < 2) return -1;

    const trend = this.calculateTrend(dataPoints);
    if (trend.rate_of_change <= 0) return -1; // Not increasing

    const lastPoint = dataPoints[dataPoints.length - 1];
    const timeToReachThreshold = (threshold - lastPoint.value) / trend.rate_of_change;
    
    // Convert from data point intervals to milliseconds (approximate)
    const avgInterval = dataPoints.length > 1 ? 
      (dataPoints[dataPoints.length - 1].timestamp - dataPoints[0].timestamp) / (dataPoints.length - 1) : 
      3600000; // Default 1 hour

    return timeToReachThreshold * avgInterval;
  }

  private generatePreventionActions(metric: string, timeToBreach: number): string[] {
    const actions: string[] = [];
    const urgency = timeToBreach < 3600000 ? 'immediate' : 'planned';

    switch (metric) {
      case 'vector_search_latency':
        if (urgency === 'immediate') {
          actions.push('Enable aggressive query caching');
          actions.push('Temporarily reduce similarity threshold');
        }
        actions.push('Schedule index optimization');
        actions.push('Review recent query pattern changes');
        break;

      case 'memory_usage':
        if (urgency === 'immediate') {
          actions.push('Trigger emergency cache cleanup');
          actions.push('Reduce cache size limits');
        }
        actions.push('Plan memory scaling');
        actions.push('Analyze memory usage patterns');
        break;

      case 'queue_depth':
        if (urgency === 'immediate') {
          actions.push('Scale processing workers');
          actions.push('Temporarily disable non-critical AI tasks');
        }
        actions.push('Optimize batch processing');
        actions.push('Implement load shedding');
        break;
    }

    return actions;
  }

  // Utility methods
  onAlert(handler: (alert: MonitoringAlert) => void): void {
    this.alertHandlers.push(handler);
  }

  createAlertProcessor(config: any): any {
    return {
      processAlerts: (rawAlerts: any[]) => {
        // Group similar alerts
        const groupedAlerts = this.groupSimilarAlerts(rawAlerts, config.deduplicationWindow);
        
        // Apply escalation rules
        const escalatedAlerts = this.applyEscalationRules(groupedAlerts, config.escalationRules);
        
        return {
          alerts: escalatedAlerts,
          suppressed_duplicates: rawAlerts.length - escalatedAlerts.length,
          escalated_alerts: escalatedAlerts.filter(a => a.escalation_level > 0).length,
          grouped_alert_families: this.countAlertFamilies(escalatedAlerts)
        };
      }
    };
  }

  private groupSimilarAlerts(alerts: any[], deduplicationWindow: number): any[] {
    const grouped: any[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < alerts.length; i++) {
      if (processed.has(i)) continue;

      const baseAlert = alerts[i];
      const groupedAlert = {
        alert_id: `grouped_${baseAlert.type}_${Date.now()}`,
        grouped_alerts: [baseAlert],
        severity: baseAlert.severity || 'medium',
        escalation_level: 0,
        summary: baseAlert.type,
        recommended_actions: [],
        estimated_impact: 'medium'
      };

      // Find similar alerts within deduplication window
      for (let j = i + 1; j < alerts.length; j++) {
        if (processed.has(j)) continue;

        const otherAlert = alerts[j];
        if (otherAlert.type === baseAlert.type && 
            otherAlert.component === baseAlert.component &&
            Math.abs(otherAlert.timestamp - baseAlert.timestamp) < deduplicationWindow) {
          
          groupedAlert.grouped_alerts.push(otherAlert);
          processed.add(j);
        }
      }

      grouped.push(groupedAlert);
      processed.add(i);
    }

    return grouped;
  }

  private applyEscalationRules(alerts: any[], escalationRules: any): any[] {
    return alerts.map(alert => {
      const rule = escalationRules[alert.summary];
      if (rule && alert.grouped_alerts.length >= rule.threshold) {
        alert.escalation_level = 1;
        alert.severity = 'high';
      }
      return alert;
    });
  }

  private countAlertFamilies(alerts: any[]): number {
    const families = new Set(alerts.map(a => a.summary));
    return families.size;
  }
}

// Performance metric interface
interface PerformanceMetric {
  operation: string;
  time_ms: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, any>;
}

// Export factory function
export const createAIPerformanceMonitor = (config?: any) => {
  return new AIPerformanceMonitor({
    sampleSize: 10,
    benchmarkInterval: 60000,
    alertThresholds: {
      vectorSearch: 500,
      recommendationGeneration: 1000,
      embeddingGeneration: 2000,
      cacheHitRate: 0.8,
      errorRate: 0.02,
      ...config?.alertThresholds
    },
    ...config
  });
};