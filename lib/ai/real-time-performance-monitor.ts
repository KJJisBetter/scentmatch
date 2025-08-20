/**
 * Real-time Performance Monitor for AI Features
 * 
 * Comprehensive monitoring system for real-time AI features including
 * WebSocket connections, activity tracking, recommendations, and collection insights.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Types for performance monitoring
export interface PerformanceMetrics {
  timestamp: number;
  metric_type: MetricType;
  component: ComponentType;
  value: number;
  unit: MetricUnit;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
}

export type MetricType = 
  | 'response_time'
  | 'throughput'
  | 'error_rate'
  | 'connection_count'
  | 'memory_usage'
  | 'cpu_usage'
  | 'cache_hit_rate'
  | 'queue_size'
  | 'success_rate'
  | 'latency'
  | 'bandwidth'
  | 'concurrent_users'
  | 'recommendation_accuracy'
  | 'insight_relevance';

export type ComponentType = 
  | 'websocket_manager'
  | 'activity_tracker'
  | 'recommendation_engine'
  | 'collection_intelligence'
  | 'ai_client'
  | 'database'
  | 'cache'
  | 'notification_system'
  | 'system_overall';

export type MetricUnit = 
  | 'milliseconds'
  | 'seconds'
  | 'requests_per_second'
  | 'percentage'
  | 'count'
  | 'bytes'
  | 'megabytes'
  | 'operations_per_second';

export interface PerformanceAlert {
  id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  component: ComponentType;
  metric_type: MetricType;
  threshold: number;
  current_value: number;
  message: string;
  timestamp: number;
  resolved: boolean;
  resolution_time?: number;
  impact_assessment: ImpactAssessment;
  suggested_actions: string[];
}

export type AlertType = 
  | 'threshold_exceeded'
  | 'threshold_below'
  | 'anomaly_detected'
  | 'system_degradation'
  | 'connection_failure'
  | 'high_error_rate'
  | 'resource_exhaustion';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ImpactAssessment {
  user_impact: 'none' | 'minimal' | 'moderate' | 'severe';
  feature_impact: string[];
  estimated_affected_users: number;
  service_degradation: boolean;
}

export interface PerformanceReport {
  period: {
    start: number;
    end: number;
    duration_hours: number;
  };
  summary: PerformanceSummary;
  component_performance: ComponentPerformance[];
  alerts_summary: AlertsSummary;
  trends: TrendAnalysis[];
  recommendations: PerformanceRecommendation[];
  sla_compliance: SLACompliance;
}

export interface PerformanceSummary {
  overall_health: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  uptime_percentage: number;
  average_response_time: number;
  total_requests: number;
  error_rate: number;
  peak_concurrent_users: number;
  resource_utilization: ResourceUtilization;
}

export interface ResourceUtilization {
  cpu_avg: number;
  memory_avg: number;
  memory_peak: number;
  websocket_connections_avg: number;
  websocket_connections_peak: number;
  cache_hit_rate: number;
  database_query_performance: number;
}

export interface ComponentPerformance {
  component: ComponentType;
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: {
    average_response_time: number;
    throughput: number;
    error_rate: number;
    availability: number;
  };
  key_insights: string[];
  improvement_areas: string[];
}

export interface AlertsSummary {
  total_alerts: number;
  alerts_by_severity: Record<AlertSeverity, number>;
  alerts_by_component: Record<ComponentType, number>;
  average_resolution_time: number;
  unresolved_count: number;
  most_frequent_alert_types: string[];
}

export interface TrendAnalysis {
  metric: MetricType;
  component: ComponentType;
  trend_direction: 'improving' | 'stable' | 'degrading';
  trend_strength: number; // 0-1
  time_period: 'hourly' | 'daily' | 'weekly';
  data_points: { timestamp: number; value: number }[];
  statistical_summary: {
    mean: number;
    median: number;
    std_deviation: number;
    min: number;
    max: number;
  };
}

export interface PerformanceRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'performance' | 'reliability' | 'scalability' | 'cost';
  title: string;
  description: string;
  expected_impact: string;
  implementation_effort: 'low' | 'medium' | 'high';
  specific_actions: string[];
  estimated_improvement: Record<MetricType, number>;
}

export interface SLACompliance {
  response_time_sla: { target: number; achieved: number; compliant: boolean };
  uptime_sla: { target: number; achieved: number; compliant: boolean };
  error_rate_sla: { target: number; achieved: number; compliant: boolean };
  availability_sla: { target: number; achieved: number; compliant: boolean };
  overall_compliance: number; // 0-1
}

/**
 * Real-time Performance Monitor
 * Monitors all real-time AI features and provides comprehensive analytics
 */
export class RealtimePerformanceMonitor {
  private supabase: ReturnType<typeof createClient<Database>>;
  private metricsBuffer: PerformanceMetrics[] = [];
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private performanceHistory: Map<string, PerformanceMetrics[]> = new Map();
  private alertHandlers: ((alert: PerformanceAlert) => void)[] = [];
  
  // Component monitors
  private componentMonitors: Map<ComponentType, ComponentMonitor> = new Map();
  
  // Configuration
  private config = {
    metricsFlushInterval: 30000, // 30 seconds
    metricsRetentionPeriod: 86400000 * 7, // 7 days
    alertCooldownPeriod: 300000, // 5 minutes
    anomalyDetectionWindow: 3600000, // 1 hour
    trendAnalysisWindow: 86400000, // 24 hours
    bufferSize: 1000,
    
    // SLA targets
    slaTargets: {
      response_time: 500, // ms
      uptime: 0.999, // 99.9%
      error_rate: 0.01, // 1%
      availability: 0.995 // 99.5%
    },
    
    // Alert thresholds
    alertThresholds: {
      response_time: 1000, // ms
      error_rate: 0.05, // 5%
      memory_usage: 0.8, // 80%
      cpu_usage: 0.7, // 70%
      connection_count: 1000,
      cache_hit_rate: 0.7 // 70%
    }
  };

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    this.initializeComponentMonitors();
    this.startPeriodicFlush();
    this.startAnomalyDetection();
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    metricType: MetricType,
    component: ComponentType,
    value: number,
    unit: MetricUnit,
    metadata?: Record<string, any>,
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      metric_type: metricType,
      component,
      value,
      unit,
      metadata,
      tags
    };

    this.metricsBuffer.push(metric);
    
    // Update component monitor
    const monitor = this.componentMonitors.get(component);
    if (monitor) {
      monitor.recordMetric(metric);
    }

    // Check for alerts
    this.checkAlertConditions(metric);

    // Flush buffer if full
    if (this.metricsBuffer.length >= this.config.bufferSize) {
      this.flushMetrics();
    }
  }

  /**
   * Record operation timing
   */
  recordOperation<T>(
    operation: () => Promise<T>,
    component: ComponentType,
    operationType: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    
    return operation().then(
      (result) => {
        const duration = Date.now() - startTime;
        this.recordMetric(
          'response_time',
          component,
          duration,
          'milliseconds',
          { ...metadata, operation_type: operationType, success: true }
        );
        return result;
      },
      (error) => {
        const duration = Date.now() - startTime;
        this.recordMetric(
          'response_time',
          component,
          duration,
          'milliseconds',
          { ...metadata, operation_type: operationType, success: false, error: error.message }
        );
        
        // Record error
        this.recordMetric(
          'error_rate',
          component,
          1,
          'count',
          { operation_type: operationType, error_type: error.name, error_message: error.message }
        );
        
        throw error;
      }
    );
  }

  /**
   * Start timing an operation
   */
  startTiming(operationId: string, component: ComponentType, operationType: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(
        'response_time',
        component,
        duration,
        'milliseconds',
        { operation_id: operationId, operation_type: operationType }
      );
    };
  }

  /**
   * Record WebSocket connection metrics
   */
  recordWebSocketMetrics(
    activeConnections: number,
    totalConnections: number,
    failedConnections: number,
    avgLatency: number
  ): void {
    this.recordMetric('connection_count', 'websocket_manager', activeConnections, 'count');
    this.recordMetric('latency', 'websocket_manager', avgLatency, 'milliseconds');
    
    if (totalConnections > 0) {
      const errorRate = failedConnections / totalConnections;
      this.recordMetric('error_rate', 'websocket_manager', errorRate, 'percentage');
    }
  }

  /**
   * Record activity tracking metrics
   */
  recordActivityTrackingMetrics(
    eventsProcessed: number,
    queueSize: number,
    processingTime: number,
    batchSuccess: boolean
  ): void {
    this.recordMetric('throughput', 'activity_tracker', eventsProcessed, 'operations_per_second');
    this.recordMetric('queue_size', 'activity_tracker', queueSize, 'count');
    this.recordMetric('response_time', 'activity_tracker', processingTime, 'milliseconds');
    
    if (!batchSuccess) {
      this.recordMetric('error_rate', 'activity_tracker', 1, 'count');
    }
  }

  /**
   * Record recommendation engine metrics
   */
  recordRecommendationMetrics(
    generationTime: number,
    cacheHitRate: number,
    recommendationAccuracy: number,
    userCount: number
  ): void {
    this.recordMetric('response_time', 'recommendation_engine', generationTime, 'milliseconds');
    this.recordMetric('cache_hit_rate', 'recommendation_engine', cacheHitRate, 'percentage');
    this.recordMetric('recommendation_accuracy', 'recommendation_engine', recommendationAccuracy, 'percentage');
    this.recordMetric('concurrent_users', 'recommendation_engine', userCount, 'count');
  }

  /**
   * Record collection intelligence metrics
   */
  recordCollectionIntelligenceMetrics(
    analysisTime: number,
    insightsGenerated: number,
    insightRelevance: number,
    notificationsSent: number
  ): void {
    this.recordMetric('response_time', 'collection_intelligence', analysisTime, 'milliseconds');
    this.recordMetric('throughput', 'collection_intelligence', insightsGenerated, 'count');
    this.recordMetric('insight_relevance', 'collection_intelligence', insightRelevance, 'percentage');
    this.recordMetric('throughput', 'notification_system', notificationsSent, 'count');
  }

  /**
   * Record AI client metrics
   */
  recordAIClientMetrics(
    requestTime: number,
    success: boolean,
    providerUsed: string,
    tokensUsed: number,
    cost: number
  ): void {
    this.recordMetric(
      'response_time',
      'ai_client',
      requestTime,
      'milliseconds',
      { provider: providerUsed, tokens_used: tokensUsed, cost }
    );
    
    if (!success) {
      this.recordMetric('error_rate', 'ai_client', 1, 'count', { provider: providerUsed });
    }
  }

  /**
   * Record system resource metrics
   */
  recordSystemMetrics(memoryUsage: number, cpuUsage: number): void {
    this.recordMetric('memory_usage', 'system_overall', memoryUsage, 'percentage');
    this.recordMetric('cpu_usage', 'system_overall', cpuUsage, 'percentage');
  }

  /**
   * Check alert conditions for a metric
   */
  private checkAlertConditions(metric: PerformanceMetrics): void {
    const thresholds = this.config.alertThresholds;
    const threshold = thresholds[metric.metric_type as keyof typeof thresholds];
    
    if (threshold !== undefined) {
      const shouldAlert = this.shouldTriggerAlert(metric, threshold);
      
      if (shouldAlert) {
        this.triggerAlert(metric, threshold);
      }
    }
  }

  private shouldTriggerAlert(metric: PerformanceMetrics, threshold: number): boolean {
    switch (metric.metric_type) {
      case 'response_time':
      case 'memory_usage':
      case 'cpu_usage':
      case 'error_rate':
        return metric.value > threshold;
      
      case 'cache_hit_rate':
        return metric.value < threshold;
      
      case 'connection_count':
        return metric.value > threshold;
      
      default:
        return false;
    }
  }

  private triggerAlert(metric: PerformanceMetrics, threshold: number): void {
    const alertId = `${metric.component}_${metric.metric_type}_${Date.now()}`;
    
    // Check for cooldown
    const existingAlert = Array.from(this.activeAlerts.values()).find(alert =>
      alert.component === metric.component &&
      alert.metric_type === metric.metric_type &&
      !alert.resolved &&
      Date.now() - alert.timestamp < this.config.alertCooldownPeriod
    );

    if (existingAlert) {
      return; // Skip due to cooldown
    }

    const alert: PerformanceAlert = {
      id: alertId,
      alert_type: this.determineAlertType(metric, threshold),
      severity: this.determineSeverity(metric, threshold),
      component: metric.component,
      metric_type: metric.metric_type,
      threshold,
      current_value: metric.value,
      message: this.generateAlertMessage(metric, threshold),
      timestamp: Date.now(),
      resolved: false,
      impact_assessment: this.assessImpact(metric),
      suggested_actions: this.generateSuggestedActions(metric)
    };

    this.activeAlerts.set(alertId, alert);
    
    // Notify alert handlers
    this.alertHandlers.forEach(handler => handler(alert));
  }

  private determineAlertType(metric: PerformanceMetrics, threshold: number): AlertType {
    if (metric.metric_type === 'error_rate' && metric.value > threshold) {
      return 'high_error_rate';
    } else if (metric.metric_type === 'response_time' && metric.value > threshold) {
      return 'system_degradation';
    } else if (metric.metric_type === 'connection_count' && metric.value > threshold) {
      return 'resource_exhaustion';
    } else if (metric.value > threshold) {
      return 'threshold_exceeded';
    } else {
      return 'threshold_below';
    }
  }

  private determineSeverity(metric: PerformanceMetrics, threshold: number): AlertSeverity {
    const ratio = metric.value / threshold;
    
    if (metric.metric_type === 'error_rate') {
      if (ratio > 5) return 'critical';
      if (ratio > 3) return 'high';
      if (ratio > 2) return 'medium';
      return 'low';
    }
    
    if (metric.metric_type === 'response_time') {
      if (ratio > 5) return 'critical';
      if (ratio > 3) return 'high';
      if (ratio > 2) return 'medium';
      return 'low';
    }
    
    if (ratio > 2) return 'high';
    if (ratio > 1.5) return 'medium';
    return 'low';
  }

  private generateAlertMessage(metric: PerformanceMetrics, threshold: number): string {
    const component = metric.component.replace('_', ' ');
    const metricName = metric.metric_type.replace('_', ' ');
    
    return `${component} ${metricName} (${metric.value}${metric.unit}) exceeded threshold (${threshold}${metric.unit})`;
  }

  private assessImpact(metric: PerformanceMetrics): ImpactAssessment {
    let userImpact: ImpactAssessment['user_impact'] = 'minimal';
    let estimatedAffectedUsers = 0;
    let servicesDegraded = false;

    if (metric.component === 'websocket_manager') {
      userImpact = 'moderate';
      estimatedAffectedUsers = 100;
      servicesDegraded = true;
    } else if (metric.component === 'recommendation_engine') {
      userImpact = 'moderate';
      estimatedAffectedUsers = 50;
    } else if (metric.metric_type === 'error_rate' && metric.value > 0.1) {
      userImpact = 'severe';
      estimatedAffectedUsers = 200;
      servicesDegraded = true;
    }

    return {
      user_impact: userImpact,
      feature_impact: this.getAffectedFeatures(metric.component),
      estimated_affected_users: estimatedAffectedUsers,
      service_degradation: servicesDegraded
    };
  }

  private getAffectedFeatures(component: ComponentType): string[] {
    const featureMap: Record<ComponentType, string[]> = {
      websocket_manager: ['Real-time updates', 'Live recommendations', 'Activity tracking'],
      activity_tracker: ['User behavior tracking', 'Preference learning'],
      recommendation_engine: ['Personalized recommendations', 'Real-time updates'],
      collection_intelligence: ['Collection insights', 'Preference notifications'],
      ai_client: ['AI-powered features', 'Semantic search'],
      database: ['Data persistence', 'User profiles'],
      cache: ['Performance optimization'],
      notification_system: ['User notifications'],
      system_overall: ['All features']
    };

    return featureMap[component] || [];
  }

  private generateSuggestedActions(metric: PerformanceMetrics): string[] {
    const actions: string[] = [];

    switch (metric.metric_type) {
      case 'response_time':
        actions.push('Check database query performance');
        actions.push('Review caching strategy');
        actions.push('Optimize algorithmic complexity');
        break;
      
      case 'error_rate':
        actions.push('Check error logs for root cause');
        actions.push('Verify external service availability');
        actions.push('Review recent deployments');
        break;
      
      case 'memory_usage':
        actions.push('Check for memory leaks');
        actions.push('Review caching policies');
        actions.push('Optimize data structures');
        break;
      
      case 'connection_count':
        actions.push('Scale WebSocket infrastructure');
        actions.push('Implement connection pooling');
        actions.push('Review connection cleanup logic');
        break;
    }

    return actions;
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(
    startTime: number,
    endTime: number
  ): Promise<PerformanceReport> {
    const metrics = await this.getMetricsForPeriod(startTime, endTime);
    const alerts = Array.from(this.activeAlerts.values()).filter(
      alert => alert.timestamp >= startTime && alert.timestamp <= endTime
    );

    const summary = this.calculatePerformanceSummary(metrics);
    const componentPerformance = this.calculateComponentPerformance(metrics);
    const alertsSummary = this.calculateAlertsSummary(alerts);
    const trends = this.calculateTrends(metrics);
    const recommendations = this.generateRecommendations(metrics, alerts);
    const slaCompliance = this.calculateSLACompliance(metrics);

    return {
      period: {
        start: startTime,
        end: endTime,
        duration_hours: (endTime - startTime) / 3600000
      },
      summary,
      component_performance: componentPerformance,
      alerts_summary: alertsSummary,
      trends,
      recommendations,
      sla_compliance: slaCompliance
    };
  }

  private calculatePerformanceSummary(metrics: PerformanceMetrics[]): PerformanceSummary {
    const responseTimeMetrics = metrics.filter(m => m.metric_type === 'response_time');
    const errorMetrics = metrics.filter(m => m.metric_type === 'error_rate');
    const connectionMetrics = metrics.filter(m => m.metric_type === 'connection_count');
    const memoryMetrics = metrics.filter(m => m.metric_type === 'memory_usage');
    const cpuMetrics = metrics.filter(m => m.metric_type === 'cpu_usage');
    const cacheMetrics = metrics.filter(m => m.metric_type === 'cache_hit_rate');

    const avgResponseTime = this.calculateAverage(responseTimeMetrics.map(m => m.value));
    const errorRate = this.calculateAverage(errorMetrics.map(m => m.value));
    const peakConnections = Math.max(...connectionMetrics.map(m => m.value), 0);
    const avgMemory = this.calculateAverage(memoryMetrics.map(m => m.value));
    const peakMemory = Math.max(...memoryMetrics.map(m => m.value), 0);
    const avgCpu = this.calculateAverage(cpuMetrics.map(m => m.value));
    const cacheHitRate = this.calculateAverage(cacheMetrics.map(m => m.value));

    return {
      overall_health: this.determineOverallHealth(avgResponseTime, errorRate, avgMemory, avgCpu),
      uptime_percentage: this.calculateUptime(metrics),
      average_response_time: avgResponseTime,
      total_requests: metrics.filter(m => m.metric_type === 'throughput').length,
      error_rate: errorRate,
      peak_concurrent_users: peakConnections,
      resource_utilization: {
        cpu_avg: avgCpu,
        memory_avg: avgMemory,
        memory_peak: peakMemory,
        websocket_connections_avg: this.calculateAverage(connectionMetrics.map(m => m.value)),
        websocket_connections_peak: peakConnections,
        cache_hit_rate: cacheHitRate,
        database_query_performance: avgResponseTime // Simplified
      }
    };
  }

  private determineOverallHealth(
    avgResponseTime: number,
    errorRate: number,
    memoryUsage: number,
    cpuUsage: number
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    const responseTimeScore = avgResponseTime < 200 ? 1 : avgResponseTime < 500 ? 0.8 : avgResponseTime < 1000 ? 0.6 : 0.3;
    const errorRateScore = errorRate < 0.01 ? 1 : errorRate < 0.05 ? 0.7 : errorRate < 0.1 ? 0.4 : 0.2;
    const memoryScore = memoryUsage < 0.6 ? 1 : memoryUsage < 0.8 ? 0.7 : memoryUsage < 0.9 ? 0.4 : 0.2;
    const cpuScore = cpuUsage < 0.5 ? 1 : cpuUsage < 0.7 ? 0.8 : cpuUsage < 0.85 ? 0.5 : 0.3;

    const overallScore = (responseTimeScore + errorRateScore + memoryScore + cpuScore) / 4;

    if (overallScore >= 0.9) return 'excellent';
    if (overallScore >= 0.75) return 'good';
    if (overallScore >= 0.6) return 'fair';
    if (overallScore >= 0.4) return 'poor';
    return 'critical';
  }

  private calculateUptime(metrics: PerformanceMetrics[]): number {
    // Simplified uptime calculation
    const errorMetrics = metrics.filter(m => m.metric_type === 'error_rate');
    const totalErrorCount = errorMetrics.reduce((sum, m) => sum + m.value, 0);
    const totalOperations = metrics.length;
    
    return totalOperations > 0 ? Math.max(0, 1 - (totalErrorCount / totalOperations)) : 1;
  }

  private calculateComponentPerformance(metrics: PerformanceMetrics[]): ComponentPerformance[] {
    const components: ComponentType[] = ['websocket_manager', 'activity_tracker', 'recommendation_engine', 'collection_intelligence', 'ai_client'];
    
    return components.map(component => {
      const componentMetrics = metrics.filter(m => m.component === component);
      
      if (componentMetrics.length === 0) {
        return {
          component,
          status: 'healthy' as const,
          metrics: {
            average_response_time: 0,
            throughput: 0,
            error_rate: 0,
            availability: 1
          },
          key_insights: ['No data available'],
          improvement_areas: []
        };
      }

      const responseTimeMetrics = componentMetrics.filter(m => m.metric_type === 'response_time');
      const throughputMetrics = componentMetrics.filter(m => m.metric_type === 'throughput');
      const errorMetrics = componentMetrics.filter(m => m.metric_type === 'error_rate');

      const avgResponseTime = this.calculateAverage(responseTimeMetrics.map(m => m.value));
      const avgThroughput = this.calculateAverage(throughputMetrics.map(m => m.value));
      const avgErrorRate = this.calculateAverage(errorMetrics.map(m => m.value));
      const availability = 1 - avgErrorRate;

      return {
        component,
        status: this.determineComponentStatus(avgResponseTime, avgErrorRate),
        metrics: {
          average_response_time: avgResponseTime,
          throughput: avgThroughput,
          error_rate: avgErrorRate,
          availability
        },
        key_insights: this.generateComponentInsights(component, componentMetrics),
        improvement_areas: this.identifyImprovementAreas(component, avgResponseTime, avgErrorRate)
      };
    });
  }

  private determineComponentStatus(responseTime: number, errorRate: number): 'healthy' | 'degraded' | 'unhealthy' {
    if (errorRate > 0.1 || responseTime > 2000) return 'unhealthy';
    if (errorRate > 0.05 || responseTime > 1000) return 'degraded';
    return 'healthy';
  }

  private generateComponentInsights(component: ComponentType, metrics: PerformanceMetrics[]): string[] {
    const insights: string[] = [];
    
    const responseTimeMetrics = metrics.filter(m => m.metric_type === 'response_time');
    if (responseTimeMetrics.length > 0) {
      const avgResponseTime = this.calculateAverage(responseTimeMetrics.map(m => m.value));
      insights.push(`Average response time: ${avgResponseTime.toFixed(0)}ms`);
    }

    const errorMetrics = metrics.filter(m => m.metric_type === 'error_rate');
    if (errorMetrics.length > 0) {
      const errorRate = this.calculateAverage(errorMetrics.map(m => m.value));
      insights.push(`Error rate: ${(errorRate * 100).toFixed(2)}%`);
    }

    return insights;
  }

  private identifyImprovementAreas(component: ComponentType, responseTime: number, errorRate: number): string[] {
    const areas: string[] = [];
    
    if (responseTime > 500) {
      areas.push('Optimize response time');
    }
    
    if (errorRate > 0.01) {
      areas.push('Reduce error rate');
    }

    switch (component) {
      case 'websocket_manager':
        if (responseTime > 200) areas.push('Optimize connection handling');
        break;
      case 'recommendation_engine':
        if (responseTime > 300) areas.push('Implement better caching');
        break;
      case 'ai_client':
        if (responseTime > 1000) areas.push('Optimize AI provider calls');
        break;
    }

    return areas;
  }

  private calculateAlertsSummary(alerts: PerformanceAlert[]): AlertsSummary {
    const totalAlerts = alerts.length;
    const alertsBySeverity: Record<AlertSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    const alertsByComponent: Record<ComponentType, number> = {} as any;
    
    alerts.forEach(alert => {
      alertsBySeverity[alert.severity]++;
      alertsByComponent[alert.component] = (alertsByComponent[alert.component] || 0) + 1;
    });

    const resolvedAlerts = alerts.filter(a => a.resolved);
    const avgResolutionTime = resolvedAlerts.length > 0 ?
      this.calculateAverage(resolvedAlerts.map(a => (a.resolution_time || 0) - a.timestamp)) : 0;

    const unresolved = alerts.filter(a => !a.resolved).length;
    
    const alertTypeCounts: Record<string, number> = {};
    alerts.forEach(alert => {
      alertTypeCounts[alert.alert_type] = (alertTypeCounts[alert.alert_type] || 0) + 1;
    });
    
    const mostFrequent = Object.entries(alertTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    return {
      total_alerts: totalAlerts,
      alerts_by_severity: alertsBySeverity,
      alerts_by_component: alertsByComponent,
      average_resolution_time: avgResolutionTime,
      unresolved_count: unresolved,
      most_frequent_alert_types: mostFrequent
    };
  }

  private calculateTrends(metrics: PerformanceMetrics[]): TrendAnalysis[] {
    const trends: TrendAnalysis[] = [];
    const metricTypes: MetricType[] = ['response_time', 'error_rate', 'throughput'];
    const components: ComponentType[] = ['websocket_manager', 'recommendation_engine', 'activity_tracker'];

    for (const metricType of metricTypes) {
      for (const component of components) {
        const componentMetrics = metrics.filter(m => 
          m.metric_type === metricType && m.component === component
        );

        if (componentMetrics.length > 5) {
          const trend = this.calculateTrend(componentMetrics);
          if (trend) {
            trends.push(trend);
          }
        }
      }
    }

    return trends;
  }

  private calculateTrend(metrics: PerformanceMetrics[]): TrendAnalysis | null {
    if (metrics.length < 2) return null;

    const sortedMetrics = metrics.sort((a, b) => a.timestamp - b.timestamp);
    const values = sortedMetrics.map(m => m.value);
    const dataPoints = sortedMetrics.map(m => ({ timestamp: m.timestamp, value: m.value }));

    // Simple linear regression for trend direction
    const n = values.length;
    const sumX = sortedMetrics.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = sortedMetrics.reduce((sum, metric, i) => sum + i * metric.value, 0);
    const sumXX = sortedMetrics.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    let direction: 'improving' | 'stable' | 'degrading';
    if (Math.abs(slope) < 0.1) {
      direction = 'stable';
    } else if (metrics[0].metric_type === 'error_rate' || metrics[0].metric_type === 'response_time') {
      direction = slope < 0 ? 'improving' : 'degrading';
    } else {
      direction = slope > 0 ? 'improving' : 'degrading';
    }

    return {
      metric: metrics[0].metric_type,
      component: metrics[0].component,
      trend_direction: direction,
      trend_strength: Math.min(Math.abs(slope), 1),
      time_period: 'daily',
      data_points: dataPoints,
      statistical_summary: {
        mean: this.calculateAverage(values),
        median: this.calculateMedian(values),
        std_deviation: this.calculateStandardDeviation(values),
        min: Math.min(...values),
        max: Math.max(...values)
      }
    };
  }

  private generateRecommendations(
    metrics: PerformanceMetrics[],
    alerts: PerformanceAlert[]
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // High error rate recommendation
    const errorMetrics = metrics.filter(m => m.metric_type === 'error_rate');
    const avgErrorRate = this.calculateAverage(errorMetrics.map(m => m.value));
    
    if (avgErrorRate > 0.02) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        title: 'Reduce Error Rate',
        description: 'Current error rate is above acceptable threshold',
        expected_impact: 'Improved user experience and system reliability',
        implementation_effort: 'medium',
        specific_actions: [
          'Implement circuit breakers',
          'Add retry mechanisms',
          'Improve error handling',
          'Monitor external dependencies'
        ],
        estimated_improvement: {
          error_rate: -0.015
        } as any
      });
    }

    // High response time recommendation
    const responseMetrics = metrics.filter(m => m.metric_type === 'response_time');
    const avgResponseTime = this.calculateAverage(responseMetrics.map(m => m.value));
    
    if (avgResponseTime > 800) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        title: 'Optimize Response Time',
        description: 'Response times are higher than optimal',
        expected_impact: 'Faster user interactions and better perceived performance',
        implementation_effort: 'medium',
        specific_actions: [
          'Implement caching strategy',
          'Optimize database queries',
          'Add CDN for static assets',
          'Implement connection pooling'
        ],
        estimated_improvement: {
          response_time: -300
        } as any
      });
    }

    return recommendations;
  }

  private calculateSLACompliance(metrics: PerformanceMetrics[]): SLACompliance {
    const responseMetrics = metrics.filter(m => m.metric_type === 'response_time');
    const errorMetrics = metrics.filter(m => m.metric_type === 'error_rate');
    
    const avgResponseTime = this.calculateAverage(responseMetrics.map(m => m.value));
    const avgErrorRate = this.calculateAverage(errorMetrics.map(m => m.value));
    const uptime = this.calculateUptime(metrics);
    const availability = 1 - avgErrorRate;

    const responseTimeSLA = {
      target: this.config.slaTargets.response_time,
      achieved: avgResponseTime,
      compliant: avgResponseTime <= this.config.slaTargets.response_time
    };

    const uptimeSLA = {
      target: this.config.slaTargets.uptime,
      achieved: uptime,
      compliant: uptime >= this.config.slaTargets.uptime
    };

    const errorRateSLA = {
      target: this.config.slaTargets.error_rate,
      achieved: avgErrorRate,
      compliant: avgErrorRate <= this.config.slaTargets.error_rate
    };

    const availabilitySLA = {
      target: this.config.slaTargets.availability,
      achieved: availability,
      compliant: availability >= this.config.slaTargets.availability
    };

    const compliantCount = [responseTimeSLA, uptimeSLA, errorRateSLA, availabilitySLA]
      .filter(sla => sla.compliant).length;

    return {
      response_time_sla: responseTimeSLA,
      uptime_sla: uptimeSLA,
      error_rate_sla: errorRateSLA,
      availability_sla: availabilitySLA,
      overall_compliance: compliantCount / 4
    };
  }

  // Utility methods
  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateAverage(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private async getMetricsForPeriod(startTime: number, endTime: number): Promise<PerformanceMetrics[]> {
    try {
      const { data: metrics, error } = await this.supabase
        .from('performance_metrics')
        .select('*')
        .gte('timestamp', new Date(startTime).toISOString())
        .lte('timestamp', new Date(endTime).toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      return (metrics || []).map(m => ({
        timestamp: new Date(m.timestamp).getTime(),
        metric_type: m.metric_type as MetricType,
        component: m.component as ComponentType,
        value: m.value,
        unit: m.unit as MetricUnit,
        metadata: m.metadata,
        tags: m.tags
      }));
    } catch (error) {
      console.error('Failed to get metrics for period:', error);
      return [];
    }
  }

  private initializeComponentMonitors(): void {
    const components: ComponentType[] = [
      'websocket_manager',
      'activity_tracker', 
      'recommendation_engine',
      'collection_intelligence',
      'ai_client',
      'database',
      'cache',
      'notification_system',
      'system_overall'
    ];

    components.forEach(component => {
      this.componentMonitors.set(component, new ComponentMonitor(component));
    });
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushMetrics();
    }, this.config.metricsFlushInterval);
  }

  private startAnomalyDetection(): void {
    setInterval(() => {
      this.detectAnomalies();
    }, this.config.anomalyDetectionWindow);
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metricsToFlush = [...this.metricsBuffer];
      this.metricsBuffer = [];

      const { error } = await this.supabase
        .from('performance_metrics')
        .insert(metricsToFlush.map(metric => ({
          timestamp: new Date(metric.timestamp).toISOString(),
          metric_type: metric.metric_type,
          component: metric.component,
          value: metric.value,
          unit: metric.unit,
          metadata: metric.metadata,
          tags: metric.tags
        })));

      if (error) throw error;
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }

  private detectAnomalies(): void {
    // Implement anomaly detection algorithm
    // This would analyze historical data and detect unusual patterns
  }

  // Public API
  onAlert(handler: (alert: PerformanceAlert) => void): void {
    this.alertHandlers.push(handler);
  }

  async getCurrentMetrics(): Promise<PerformanceMetrics[]> {
    return [...this.metricsBuffer];
  }

  async getActiveAlerts(): Promise<PerformanceAlert[]> {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolution_time = Date.now();
    }
  }

  async getComponentStatus(component: ComponentType): Promise<ComponentPerformance | null> {
    const monitor = this.componentMonitors.get(component);
    return monitor ? monitor.getStatus() : null;
  }
}

/**
 * Component Monitor
 * Monitors individual component performance
 */
class ComponentMonitor {
  private component: ComponentType;
  private recentMetrics: PerformanceMetrics[] = [];
  private maxMetrics = 100;

  constructor(component: ComponentType) {
    this.component = component;
  }

  recordMetric(metric: PerformanceMetrics): void {
    this.recentMetrics.push(metric);
    
    // Keep only recent metrics
    if (this.recentMetrics.length > this.maxMetrics) {
      this.recentMetrics = this.recentMetrics.slice(-this.maxMetrics);
    }
  }

  getStatus(): ComponentPerformance {
    const responseTimeMetrics = this.recentMetrics.filter(m => m.metric_type === 'response_time');
    const throughputMetrics = this.recentMetrics.filter(m => m.metric_type === 'throughput');
    const errorMetrics = this.recentMetrics.filter(m => m.metric_type === 'error_rate');

    const avgResponseTime = this.calculateAverage(responseTimeMetrics.map(m => m.value));
    const avgThroughput = this.calculateAverage(throughputMetrics.map(m => m.value));
    const avgErrorRate = this.calculateAverage(errorMetrics.map(m => m.value));
    const availability = 1 - avgErrorRate;

    return {
      component: this.component,
      status: avgErrorRate > 0.1 || avgResponseTime > 2000 ? 'unhealthy' :
              avgErrorRate > 0.05 || avgResponseTime > 1000 ? 'degraded' : 'healthy',
      metrics: {
        average_response_time: avgResponseTime,
        throughput: avgThroughput,
        error_rate: avgErrorRate,
        availability
      },
      key_insights: [`${this.recentMetrics.length} recent metrics recorded`],
      improvement_areas: []
    };
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }
}

// Export factory function
export const createRealtimePerformanceMonitor = (
  supabaseUrl?: string,
  supabaseKey?: string
) => {
  return new RealtimePerformanceMonitor(supabaseUrl, supabaseKey);
};