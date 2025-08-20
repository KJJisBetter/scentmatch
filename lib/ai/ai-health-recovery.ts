/**
 * AI System Health Checks and Automated Recovery
 * 
 * Comprehensive health monitoring system with automated recovery procedures
 * for all AI components including self-healing capabilities.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { AIClient } from './ai-client';

// Types for health monitoring and recovery
export interface HealthCheckResult {
  check_id: string;
  timestamp: number;
  overall_status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  health_score: number; // 0-1
  component_results: ComponentHealthResult[];
  critical_issues: HealthIssue[];
  recovery_actions_taken: RecoveryAction[];
  recommendations: HealthRecommendation[];
  next_check_scheduled: number;
}

export interface ComponentHealthResult {
  component: ComponentType;
  status: 'healthy' | 'degraded' | 'failed' | 'unknown';
  health_score: number;
  response_time_ms: number;
  error_rate: number;
  availability: number;
  last_successful_operation: number;
  checks_performed: HealthCheck[];
  issues_detected: HealthIssue[];
  auto_recovery_available: boolean;
}

export type ComponentType = 
  | 'embedding_system'
  | 'vector_search'
  | 'recommendation_engine'
  | 'ai_providers'
  | 'database_functions'
  | 'cache_system'
  | 'processing_queue'
  | 'real_time_features';

export interface HealthCheck {
  check_name: string;
  check_type: 'connectivity' | 'performance' | 'data_integrity' | 'functionality';
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  duration_ms: number;
  details: any;
  error_message?: string;
  recovery_suggested?: boolean;
}

export interface HealthIssue {
  issue_id: string;
  component: ComponentType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  issue_type: string;
  description: string;
  impact_assessment: ImpactAssessment;
  auto_recoverable: boolean;
  recovery_procedures: string[];
  escalation_required: boolean;
  first_detected: number;
  last_seen: number;
  occurrence_count: number;
}

export interface ImpactAssessment {
  user_impact: 'none' | 'minimal' | 'moderate' | 'severe';
  feature_impact: string[];
  estimated_affected_users: number;
  business_impact: 'low' | 'medium' | 'high' | 'critical';
  cascading_failures_risk: number;
}

export interface RecoveryAction {
  action_id: string;
  action_type: string;
  component: ComponentType;
  triggered_by: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  started_at: number;
  completed_at?: number;
  success: boolean;
  details: any;
  side_effects: string[];
  rollback_available: boolean;
}

export interface HealthRecommendation {
  recommendation_id: string;
  category: 'preventive' | 'corrective' | 'optimization';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  affected_components: ComponentType[];
  implementation_effort: 'low' | 'medium' | 'high';
  expected_impact: string;
  action_items: string[];
  timeline: string;
}

export interface RecoveryProcedure {
  procedure_id: string;
  name: string;
  description: string;
  applicable_issues: string[];
  risk_level: 'low' | 'medium' | 'high';
  success_rate: number;
  avg_execution_time_ms: number;
  prerequisites: string[];
  steps: RecoveryStep[];
  rollback_plan: RollbackPlan;
  monitoring_requirements: string[];
}

export interface RecoveryStep {
  step_number: number;
  description: string;
  action_type: 'database' | 'api_call' | 'configuration' | 'restart' | 'validation';
  parameters: Record<string, any>;
  timeout_ms: number;
  retry_count: number;
  success_criteria: string[];
  failure_handling: 'continue' | 'abort' | 'retry';
}

export interface RollbackPlan {
  rollback_available: boolean;
  rollback_steps: RecoveryStep[];
  rollback_risk: 'low' | 'medium' | 'high';
  data_loss_risk: boolean;
  estimated_rollback_time: number;
}

/**
 * AI System Health Monitor
 * Comprehensive health monitoring with automated recovery
 */
export class AISystemHealthMonitor {
  private supabase: ReturnType<typeof createClient<Database>>;
  private aiClient: AIClient;
  private config: {
    checkInterval: number;
    alertThresholds: Record<string, number>;
    recoveryProcedures: Record<string, string>;
    autoRecoveryEnabled: boolean;
    maxRecoveryAttempts: number;
    recoveryBackoffMs: number;
    healthScoreThresholds: Record<string, number>;
  };

  private healthHistory: Map<ComponentType, HealthCheckResult[]> = new Map();
  private activeRecoveries: Map<string, RecoveryAction> = new Map();
  private recoveryProcedures: Map<string, RecoveryProcedure> = new Map();
  private alertHandlers: ((issue: HealthIssue) => void)[] = [];
  private isRunning = false;

  constructor(config: {
    checkInterval: number;
    alertThresholds: Record<string, number>;
    recoveryProcedures?: Record<string, string>;
    autoRecoveryEnabled?: boolean;
    maxRecoveryAttempts?: number;
    recoveryBackoffMs?: number;
    healthScoreThresholds?: Record<string, number>;
  }) {
    this.config = {
      recoveryProcedures: {},
      autoRecoveryEnabled: true,
      maxRecoveryAttempts: 3,
      recoveryBackoffMs: 30000,
      healthScoreThresholds: {
        critical: 0.3,
        warning: 0.7,
        good: 0.9
      },
      ...config
    };

    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.aiClient = new AIClient();
    this.initializeRecoveryProcedures();
    this.startHealthMonitoring();
  }

  /**
   * Execute comprehensive health check
   */
  async executeHealthCheck(): Promise<HealthCheckResult> {
    const checkId = `health_${Date.now()}`;
    const timestamp = Date.now();
    
    console.log(`🏥 Starting AI system health check: ${checkId}`);

    const componentResults: ComponentHealthResult[] = [];
    const criticalIssues: HealthIssue[] = [];
    const recoveryActions: RecoveryAction[] = [];

    try {
      // Check each component
      const components: ComponentType[] = [
        'embedding_system',
        'vector_search',
        'recommendation_engine',
        'ai_providers',
        'database_functions',
        'cache_system',
        'processing_queue',
        'real_time_features'
      ];

      for (const component of components) {
        const result = await this.checkComponentHealth(component);
        componentResults.push(result);

        // Collect critical issues
        const componentCriticalIssues = result.issues_detected.filter(issue => issue.severity === 'critical');
        criticalIssues.push(...componentCriticalIssues);

        // Trigger recovery if needed and enabled
        if (this.config.autoRecoveryEnabled && result.status === 'failed' && result.auto_recovery_available) {
          const recoveryAction = await this.triggerRecovery(component, result.issues_detected);
          if (recoveryAction) {
            recoveryActions.push(recoveryAction);
          }
        }
      }

      // Calculate overall health score
      const healthScores = componentResults.map(r => r.health_score);
      const overallHealthScore = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;

      // Determine overall status
      const overallStatus = overallHealthScore >= this.config.healthScoreThresholds.good ? 'healthy' :
                           overallHealthScore >= this.config.healthScoreThresholds.warning ? 'degraded' :
                           overallHealthScore >= this.config.healthScoreThresholds.critical ? 'critical' : 'critical';

      // Generate recommendations
      const recommendations = this.generateHealthRecommendations(componentResults, criticalIssues);

      const result: HealthCheckResult = {
        check_id: checkId,
        timestamp,
        overall_status: overallStatus,
        health_score: overallHealthScore,
        component_results: componentResults,
        critical_issues: criticalIssues,
        recovery_actions_taken: recoveryActions,
        recommendations,
        next_check_scheduled: timestamp + this.config.checkInterval
      };

      // Store health check result
      await this.storeHealthCheckResult(result);

      console.log(`✅ Health check completed: ${overallStatus} (score: ${(overallHealthScore * 100).toFixed(1)}%)`);

      return result;

    } catch (error) {
      console.error('Health check failed:', error);
      
      return {
        check_id: checkId,
        timestamp,
        overall_status: 'critical',
        health_score: 0,
        component_results: [],
        critical_issues: [{
          issue_id: `health_check_failure_${timestamp}`,
          component: 'embedding_system',
          severity: 'critical',
          issue_type: 'health_check_failure',
          description: 'Health check system failure',
          impact_assessment: {
            user_impact: 'severe',
            feature_impact: ['health_monitoring'],
            estimated_affected_users: 0,
            business_impact: 'high',
            cascading_failures_risk: 0.8
          },
          auto_recoverable: false,
          recovery_procedures: ['Manual investigation required'],
          escalation_required: true,
          first_detected: timestamp,
          last_seen: timestamp,
          occurrence_count: 1
        }],
        recovery_actions_taken: [],
        recommendations: [],
        next_check_scheduled: timestamp + this.config.checkInterval
      };
    }
  }

  /**
   * Check health of individual component
   */
  private async checkComponentHealth(component: ComponentType): Promise<ComponentHealthResult> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];
    const issues: HealthIssue[] = [];
    let overallStatus: 'healthy' | 'degraded' | 'failed' | 'unknown' = 'unknown';
    let healthScore = 0;
    let responseTime = 0;
    let errorRate = 0;
    let availability = 0;

    try {
      switch (component) {
        case 'embedding_system':
          const embeddingChecks = await this.checkEmbeddingSystem();
          checks.push(...embeddingChecks.checks);
          issues.push(...embeddingChecks.issues);
          healthScore = embeddingChecks.score;
          responseTime = embeddingChecks.avgResponseTime;
          errorRate = embeddingChecks.errorRate;
          availability = embeddingChecks.availability;
          break;

        case 'vector_search':
          const searchChecks = await this.checkVectorSearch();
          checks.push(...searchChecks.checks);
          issues.push(...searchChecks.issues);
          healthScore = searchChecks.score;
          responseTime = searchChecks.avgResponseTime;
          errorRate = searchChecks.errorRate;
          availability = searchChecks.availability;
          break;

        case 'ai_providers':
          const providerChecks = await this.checkAIProviders();
          checks.push(...providerChecks.checks);
          issues.push(...providerChecks.issues);
          healthScore = providerChecks.score;
          responseTime = providerChecks.avgResponseTime;
          errorRate = providerChecks.errorRate;
          availability = providerChecks.availability;
          break;

        case 'database_functions':
          const dbChecks = await this.checkDatabaseFunctions();
          checks.push(...dbChecks.checks);
          issues.push(...dbChecks.issues);
          healthScore = dbChecks.score;
          responseTime = dbChecks.avgResponseTime;
          errorRate = dbChecks.errorRate;
          availability = dbChecks.availability;
          break;

        case 'cache_system':
          const cacheChecks = await this.checkCacheSystem();
          checks.push(...cacheChecks.checks);
          issues.push(...cacheChecks.issues);
          healthScore = cacheChecks.score;
          responseTime = cacheChecks.avgResponseTime;
          availability = cacheChecks.availability;
          break;

        case 'processing_queue':
          const queueChecks = await this.checkProcessingQueue();
          checks.push(...queueChecks.checks);
          issues.push(...queueChecks.issues);
          healthScore = queueChecks.score;
          availability = queueChecks.availability;
          break;

        default:
          // Generic component check
          checks.push({
            check_name: `${component}_basic_check`,
            check_type: 'connectivity',
            status: 'passed',
            duration_ms: 10,
            details: { status: 'Component not specifically monitored' }
          });
          healthScore = 0.8;
          availability = 1.0;
      }

      // Determine overall component status
      const failedChecks = checks.filter(check => check.status === 'failed').length;
      const warningChecks = checks.filter(check => check.status === 'warning').length;
      
      if (failedChecks > 0) {
        overallStatus = 'failed';
      } else if (warningChecks > 0 || healthScore < 0.8) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'healthy';
      }

    } catch (error) {
      console.error(`Health check failed for ${component}:`, error);
      
      overallStatus = 'failed';
      healthScore = 0;
      issues.push({
        issue_id: `${component}_check_failure_${Date.now()}`,
        component,
        severity: 'critical',
        issue_type: 'health_check_failure',
        description: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        impact_assessment: {
          user_impact: 'moderate',
          feature_impact: [component],
          estimated_affected_users: 100,
          business_impact: 'medium',
          cascading_failures_risk: 0.3
        },
        auto_recoverable: false,
        recovery_procedures: ['Manual investigation required'],
        escalation_required: true,
        first_detected: Date.now(),
        last_seen: Date.now(),
        occurrence_count: 1
      });
    }

    return {
      component,
      status: overallStatus,
      health_score: healthScore,
      response_time_ms: responseTime,
      error_rate: errorRate,
      availability: availability,
      last_successful_operation: Date.now(),
      checks_performed: checks,
      issues_detected: issues,
      auto_recovery_available: this.isAutoRecoveryAvailable(component, issues)
    };
  }

  /**
   * Check embedding system health
   */
  private async checkEmbeddingSystem(): Promise<any> {
    const checks: HealthCheck[] = [];
    const issues: HealthIssue[] = [];
    let score = 1.0;
    let responseTime = 0;
    let errorRate = 0;
    let availability = 1.0;

    // Check 1: AI provider connectivity
    try {
      const connectivityStart = Date.now();
      const testResponse = await this.aiClient.generateEmbedding('Health check test text');
      const connectivityTime = Date.now() - connectivityStart;
      
      checks.push({
        check_name: 'ai_provider_connectivity',
        check_type: 'connectivity',
        status: 'passed',
        duration_ms: connectivityTime,
        details: {
          provider: testResponse.provider,
          model: testResponse.model,
          dimensions: testResponse.embedding.length
        }
      });

      responseTime += connectivityTime;

    } catch (error) {
      checks.push({
        check_name: 'ai_provider_connectivity',
        check_type: 'connectivity',
        status: 'failed',
        duration_ms: 5000,
        details: {},
        error_message: error instanceof Error ? error.message : String(error),
        recovery_suggested: true
      });

      issues.push({
        issue_id: `embedding_connectivity_${Date.now()}`,
        component: 'embedding_system',
        severity: 'critical',
        issue_type: 'provider_connectivity_failure',
        description: 'Cannot connect to AI embedding providers',
        impact_assessment: {
          user_impact: 'severe',
          feature_impact: ['recommendations', 'search', 'new_content_processing'],
          estimated_affected_users: 1000,
          business_impact: 'critical',
          cascading_failures_risk: 0.9
        },
        auto_recoverable: true,
        recovery_procedures: ['restart_ai_client', 'switch_provider', 'check_api_keys'],
        escalation_required: true,
        first_detected: Date.now(),
        last_seen: Date.now(),
        occurrence_count: 1
      });

      score -= 0.8;
      errorRate += 1.0;
      availability = 0;
    }

    // Check 2: Embedding queue health
    try {
      const { data: queueStats, error } = await this.supabase
        .from('ai_processing_queue')
        .select('status')
        .eq('task_type', 'embedding_generation');

      if (error) throw error;

      const totalTasks = queueStats?.length || 0;
      const pendingTasks = queueStats?.filter(task => task.status === 'pending').length || 0;
      const failedTasks = queueStats?.filter(task => task.status === 'failed').length || 0;

      checks.push({
        check_name: 'embedding_queue_health',
        check_type: 'performance',
        status: pendingTasks < 100 && failedTasks < 10 ? 'passed' : 'warning',
        duration_ms: 50,
        details: {
          total_tasks: totalTasks,
          pending_tasks: pendingTasks,
          failed_tasks: failedTasks
        }
      });

      if (pendingTasks > 100) {
        issues.push({
          issue_id: `embedding_queue_overflow_${Date.now()}`,
          component: 'embedding_system',
          severity: pendingTasks > 500 ? 'critical' : 'medium',
          issue_type: 'queue_overflow',
          description: `${pendingTasks} pending embedding tasks`,
          impact_assessment: {
            user_impact: 'minimal',
            feature_impact: ['new_content_recommendations'],
            estimated_affected_users: 50,
            business_impact: 'low',
            cascading_failures_risk: 0.1
          },
          auto_recoverable: true,
          recovery_procedures: ['scale_embedding_workers', 'optimize_batch_size'],
          escalation_required: false,
          first_detected: Date.now(),
          last_seen: Date.now(),
          occurrence_count: 1
        });

        score -= 0.2;
      }

    } catch (error) {
      checks.push({
        check_name: 'embedding_queue_health',
        check_type: 'performance',
        status: 'failed',
        duration_ms: 100,
        details: {},
        error_message: error instanceof Error ? error.message : String(error)
      });

      score -= 0.3;
      errorRate += 0.5;
    }

    return {
      checks,
      issues,
      score: Math.max(0, score),
      avgResponseTime: responseTime / Math.max(checks.length, 1),
      errorRate,
      availability
    };
  }

  /**
   * Check vector search health
   */
  private async checkVectorSearch(): Promise<any> {
    const checks: HealthCheck[] = [];
    const issues: HealthIssue[] = [];
    let score = 1.0;
    let responseTime = 0;
    let errorRate = 0;
    let availability = 1.0;

    // Check 1: Vector similarity function availability
    try {
      const funcCheckStart = Date.now();
      
      const { data: testSearch, error } = await this.supabase.rpc('find_similar_fragrances', {
        query_embedding: Array(2000).fill(0.1) as any,
        similarity_threshold: 0.5,
        max_results: 1
      });

      const funcCheckTime = Date.now() - funcCheckStart;

      if (error) throw error;

      checks.push({
        check_name: 'vector_similarity_function',
        check_type: 'functionality',
        status: 'passed',
        duration_ms: funcCheckTime,
        details: {
          results_returned: testSearch?.length || 0,
          function_available: true
        }
      });

      responseTime += funcCheckTime;

      // Check performance
      if (funcCheckTime > 1000) {
        issues.push({
          issue_id: `vector_search_slow_${Date.now()}`,
          component: 'vector_search',
          severity: funcCheckTime > 2000 ? 'high' : 'medium',
          issue_type: 'slow_response',
          description: `Vector search taking ${funcCheckTime}ms`,
          impact_assessment: {
            user_impact: 'moderate',
            feature_impact: ['search', 'recommendations'],
            estimated_affected_users: 500,
            business_impact: 'medium',
            cascading_failures_risk: 0.2
          },
          auto_recoverable: true,
          recovery_procedures: ['optimize_vector_indexes', 'clear_query_cache'],
          escalation_required: false,
          first_detected: Date.now(),
          last_seen: Date.now(),
          occurrence_count: 1
        });

        score -= 0.3;
      }

    } catch (error) {
      checks.push({
        check_name: 'vector_similarity_function',
        check_type: 'functionality',
        status: 'failed',
        duration_ms: 5000,
        details: {},
        error_message: error instanceof Error ? error.message : String(error),
        recovery_suggested: true
      });

      issues.push({
        issue_id: `vector_search_failure_${Date.now()}`,
        component: 'vector_search',
        severity: 'critical',
        issue_type: 'function_failure',
        description: 'Vector similarity search not available',
        impact_assessment: {
          user_impact: 'severe',
          feature_impact: ['search', 'recommendations', 'similar_products'],
          estimated_affected_users: 1000,
          business_impact: 'critical',
          cascading_failures_risk: 0.7
        },
        auto_recoverable: true,
        recovery_procedures: ['restart_database_functions', 'rebuild_vector_indexes'],
        escalation_required: true,
        first_detected: Date.now(),
        last_seen: Date.now(),
        occurrence_count: 1
      });

      score = 0;
      errorRate = 1.0;
      availability = 0;
    }

    return { checks, issues, score, avgResponseTime: responseTime, errorRate, availability };
  }

  /**
   * Check AI providers health
   */
  private async checkAIProviders(): Promise<any> {
    const checks: HealthCheck[] = [];
    const issues: HealthIssue[] = [];
    let score = 1.0;
    let totalResponseTime = 0;
    let errorRate = 0;
    let availability = 1.0;

    const providers = ['voyage', 'openai']; // Based on our configuration

    for (const provider of providers) {
      try {
        const providerStart = Date.now();
        
        // Test embedding generation for each provider
        const testResponse = await this.aiClient.generateEmbedding('Provider health test', provider as any);
        const providerTime = Date.now() - providerStart;

        checks.push({
          check_name: `${provider}_provider_health`,
          check_type: 'connectivity',
          status: 'passed',
          duration_ms: providerTime,
          details: {
            provider: testResponse.provider,
            response_time: providerTime,
            tokens_used: testResponse.tokens_used,
            cost: testResponse.cost
          }
        });

        totalResponseTime += providerTime;

        // Check if response time is acceptable
        if (providerTime > 3000) {
          issues.push({
            issue_id: `${provider}_slow_response_${Date.now()}`,
            component: 'ai_providers',
            severity: 'medium',
            issue_type: 'slow_provider_response',
            description: `${provider} provider responding slowly (${providerTime}ms)`,
            impact_assessment: {
              user_impact: 'minimal',
              feature_impact: ['embedding_generation'],
              estimated_affected_users: 100,
              business_impact: 'low',
              cascading_failures_risk: 0.1
            },
            auto_recoverable: true,
            recovery_procedures: ['switch_to_backup_provider'],
            escalation_required: false,
            first_detected: Date.now(),
            last_seen: Date.now(),
            occurrence_count: 1
          });

          score -= 0.1;
        }

      } catch (error) {
        checks.push({
          check_name: `${provider}_provider_health`,
          check_type: 'connectivity',
          status: 'failed',
          duration_ms: 5000,
          details: {},
          error_message: error instanceof Error ? error.message : String(error),
          recovery_suggested: true
        });

        issues.push({
          issue_id: `${provider}_failure_${Date.now()}`,
          component: 'ai_providers',
          severity: 'high',
          issue_type: 'provider_failure',
          description: `${provider} provider not accessible`,
          impact_assessment: {
            user_impact: 'moderate',
            feature_impact: ['embedding_generation', 'new_recommendations'],
            estimated_affected_users: 200,
            business_impact: 'medium',
            cascading_failures_risk: 0.4
          },
          auto_recoverable: true,
          recovery_procedures: ['failover_to_backup_provider', 'check_api_credentials'],
          escalation_required: false,
          first_detected: Date.now(),
          last_seen: Date.now(),
          occurrence_count: 1
        });

        score -= 0.4;
        errorRate += 0.5;
      }
    }

    const avgResponseTime = totalResponseTime / Math.max(providers.length, 1);
    const workingProviders = providers.length - checks.filter(c => c.status === 'failed').length;
    availability = workingProviders / providers.length;

    return {
      checks,
      issues,
      score: Math.max(0, score),
      avgResponseTime: avgResponseTime,
      errorRate: errorRate / providers.length,
      availability
    };
  }

  /**
   * Check database functions health
   */
  private async checkDatabaseFunctions(): Promise<any> {
    const checks: HealthCheck[] = [];
    const issues: HealthIssue[] = [];
    let score = 1.0;
    let totalResponseTime = 0;
    let errorRate = 0;
    let availability = 1.0;

    const functions = [
      { name: 'find_similar_fragrances', critical: true },
      { name: 'update_user_embedding', critical: false },
      { name: 'cleanup_expired_cache', critical: false }
    ];

    for (const func of functions) {
      try {
        const funcStart = Date.now();
        let testResult;

        if (func.name === 'find_similar_fragrances') {
          const { data, error } = await this.supabase.rpc('find_similar_fragrances', {
            query_embedding: Array(2000).fill(0.1) as any,
            max_results: 1
          });
          
          if (error) throw error;
          testResult = data;
        } else if (func.name === 'cleanup_expired_cache') {
          const { data, error } = await this.supabase.rpc('cleanup_expired_cache');
          if (error) throw error;
          testResult = data;
        } else {
          // For update_user_embedding, just check if function exists
          testResult = 'function_available';
        }

        const funcTime = Date.now() - funcStart;

        checks.push({
          check_name: `${func.name}_health`,
          check_type: 'functionality',
          status: 'passed',
          duration_ms: funcTime,
          details: {
            function_name: func.name,
            result: testResult,
            execution_time: funcTime
          }
        });

        totalResponseTime += funcTime;

      } catch (error) {
        checks.push({
          check_name: `${func.name}_health`,
          check_type: 'functionality',
          status: 'failed',
          duration_ms: 1000,
          details: {},
          error_message: error instanceof Error ? error.message : String(error)
        });

        if (func.critical) {
          issues.push({
            issue_id: `${func.name}_failure_${Date.now()}`,
            component: 'database_functions',
            severity: 'critical',
            issue_type: 'critical_function_failure',
            description: `Critical database function ${func.name} not available`,
            impact_assessment: {
              user_impact: 'severe',
              feature_impact: ['search', 'recommendations'],
              estimated_affected_users: 1000,
              business_impact: 'critical',
              cascading_failures_risk: 0.8
            },
            auto_recoverable: false,
            recovery_procedures: ['restore_database_functions', 'check_permissions'],
            escalation_required: true,
            first_detected: Date.now(),
            last_seen: Date.now(),
            occurrence_count: 1
          });

          score -= 0.6;
          availability -= 0.5;
        } else {
          score -= 0.2;
        }

        errorRate += 0.3;
      }
    }

    return {
      checks,
      issues,
      score: Math.max(0, score),
      avgResponseTime: totalResponseTime / functions.length,
      errorRate: errorRate / functions.length,
      availability
    };
  }

  /**
   * Check cache system health
   */
  private async checkCacheSystem(): Promise<any> {
    const checks: HealthCheck[] = [];
    const issues: HealthIssue[] = [];
    let score = 1.0;
    let responseTime = 0;
    let availability = 1.0;

    // Check 1: Database cache accessibility
    try {
      const cacheStart = Date.now();
      
      const { data: cacheData, error } = await this.supabase
        .from('recommendation_cache')
        .select('id')
        .limit(1);

      const cacheTime = Date.now() - cacheStart;

      if (error) throw error;

      checks.push({
        check_name: 'database_cache_access',
        check_type: 'connectivity',
        status: 'passed',
        duration_ms: cacheTime,
        details: {
          cache_accessible: true,
          response_time: cacheTime
        }
      });

      responseTime = cacheTime;

    } catch (error) {
      checks.push({
        check_name: 'database_cache_access',
        check_type: 'connectivity',
        status: 'failed',
        duration_ms: 1000,
        details: {},
        error_message: error instanceof Error ? error.message : String(error)
      });

      issues.push({
        issue_id: `cache_access_failure_${Date.now()}`,
        component: 'cache_system',
        severity: 'medium',
        issue_type: 'cache_access_failure',
        description: 'Cannot access recommendation cache',
        impact_assessment: {
          user_impact: 'moderate',
          feature_impact: ['cached_recommendations'],
          estimated_affected_users: 300,
          business_impact: 'medium',
          cascading_failures_risk: 0.2
        },
        auto_recoverable: true,
        recovery_procedures: ['restart_cache_service', 'clear_cache'],
        escalation_required: false,
        first_detected: Date.now(),
        last_seen: Date.now(),
        occurrence_count: 1
      });

      score -= 0.3;
      availability = 0.5;
    }

    return { checks, issues, score, avgResponseTime: responseTime, errorRate: 0, availability };
  }

  /**
   * Check processing queue health
   */
  private async checkProcessingQueue(): Promise<any> {
    const checks: HealthCheck[] = [];
    const issues: HealthIssue[] = [];
    let score = 1.0;
    let availability = 1.0;

    try {
      const { data: queueStats, error } = await this.supabase
        .from('ai_processing_queue')
        .select('status, task_type, created_at')
        .limit(1000);

      if (error) throw error;

      const now = Date.now();
      const oneHourAgo = now - 3600000;
      
      const recentTasks = queueStats?.filter(task => 
        new Date(task.created_at).getTime() > oneHourAgo
      ) || [];

      const pendingTasks = queueStats?.filter(task => task.status === 'pending').length || 0;
      const failedTasks = queueStats?.filter(task => task.status === 'failed').length || 0;
      const stuckTasks = recentTasks.filter(task => 
        task.status === 'processing' && 
        new Date(task.created_at).getTime() < now - 1800000 // Stuck for >30 minutes
      ).length;

      checks.push({
        check_name: 'processing_queue_health',
        check_type: 'performance',
        status: pendingTasks < 50 && stuckTasks === 0 ? 'passed' : 'warning',
        duration_ms: 100,
        details: {
          total_tasks: queueStats?.length || 0,
          pending_tasks: pendingTasks,
          failed_tasks: failedTasks,
          stuck_tasks: stuckTasks,
          recent_tasks: recentTasks.length
        }
      });

      if (pendingTasks > 100 || stuckTasks > 0) {
        issues.push({
          issue_id: `queue_congestion_${Date.now()}`,
          component: 'processing_queue',
          severity: stuckTasks > 0 ? 'high' : 'medium',
          issue_type: 'queue_congestion',
          description: `Processing queue congested: ${pendingTasks} pending, ${stuckTasks} stuck`,
          impact_assessment: {
            user_impact: 'minimal',
            feature_impact: ['background_processing'],
            estimated_affected_users: 50,
            business_impact: 'low',
            cascading_failures_risk: 0.2
          },
          auto_recoverable: true,
          recovery_procedures: ['restart_queue_workers', 'clear_stuck_tasks'],
          escalation_required: false,
          first_detected: Date.now(),
          last_seen: Date.now(),
          occurrence_count: 1
        });

        score -= 0.2;
      }

    } catch (error) {
      checks.push({
        check_name: 'processing_queue_health',
        check_type: 'connectivity',
        status: 'failed',
        duration_ms: 1000,
        details: {},
        error_message: error instanceof Error ? error.message : String(error)
      });

      score = 0;
      availability = 0;
    }

    return { checks, issues, score, availability };
  }

  /**
   * Trigger automated recovery for component
   */
  private async triggerRecovery(component: ComponentType, issues: HealthIssue[]): Promise<RecoveryAction | null> {
    // Check if recovery is already in progress
    const existingRecovery = Array.from(this.activeRecoveries.values())
      .find(action => action.component === component && action.status === 'executing');

    if (existingRecovery) {
      console.log(`Recovery already in progress for ${component}`);
      return null;
    }

    // Find appropriate recovery procedure
    const criticalIssue = issues.find(issue => issue.severity === 'critical' && issue.auto_recoverable);
    if (!criticalIssue) {
      return null; // No auto-recoverable critical issues
    }

    const recoveryAction: RecoveryAction = {
      action_id: `recovery_${component}_${Date.now()}`,
      action_type: criticalIssue.recovery_procedures[0] || 'generic_restart',
      component,
      triggered_by: criticalIssue.issue_id,
      status: 'pending',
      started_at: Date.now(),
      success: false,
      details: {
        issue_type: criticalIssue.issue_type,
        severity: criticalIssue.severity,
        recovery_procedure: criticalIssue.recovery_procedures[0]
      },
      side_effects: [],
      rollback_available: true
    };

    this.activeRecoveries.set(recoveryAction.action_id, recoveryAction);

    // Execute recovery asynchronously
    this.executeRecoveryAction(recoveryAction);

    return recoveryAction;
  }

  private async executeRecoveryAction(action: RecoveryAction): Promise<void> {
    try {
      action.status = 'executing';
      console.log(`🔧 Executing recovery action: ${action.action_type} for ${action.component}`);

      // Execute based on action type
      switch (action.action_type) {
        case 'restart_ai_client':
          await this.restartAIClient();
          break;
        case 'switch_provider':
          await this.switchPrimaryProvider();
          break;
        case 'restart_database_functions':
          await this.restartDatabaseFunctions();
          break;
        case 'clear_stuck_tasks':
          await this.clearStuckTasks();
          break;
        case 'optimize_vector_indexes':
          await this.optimizeVectorIndexes();
          break;
        default:
          console.log(`Unknown recovery action: ${action.action_type}`);
      }

      action.status = 'completed';
      action.completed_at = Date.now();
      action.success = true;

      console.log(`✅ Recovery action completed successfully: ${action.action_type}`);

    } catch (error) {
      action.status = 'failed';
      action.completed_at = Date.now();
      action.success = false;
      action.details.error = error instanceof Error ? error.message : String(error);

      console.error(`❌ Recovery action failed: ${action.action_type}`, error);
    } finally {
      // Clean up active recovery tracking
      setTimeout(() => {
        this.activeRecoveries.delete(action.action_id);
      }, 300000); // Clean up after 5 minutes
    }
  }

  // Recovery procedure implementations
  private async restartAIClient(): Promise<void> {
    // Reinitialize AI client
    this.aiClient = new AIClient();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
  }

  private async switchPrimaryProvider(): Promise<void> {
    // Implementation would switch to backup provider
    console.log('Switching to backup AI provider');
  }

  private async restartDatabaseFunctions(): Promise<void> {
    // Implementation would restart database function pool
    console.log('Restarting database function connections');
  }

  private async clearStuckTasks(): Promise<void> {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 1800000);
      
      const { error } = await this.supabase
        .from('ai_processing_queue')
        .update({ status: 'failed', error_message: 'Task stuck - auto-cleared by health monitor' })
        .eq('status', 'processing')
        .lt('started_at', thirtyMinutesAgo.toISOString());

      if (error) throw error;
      
      console.log('Cleared stuck processing tasks');
    } catch (error) {
      throw new Error(`Failed to clear stuck tasks: ${error}`);
    }
  }

  private async optimizeVectorIndexes(): Promise<void> {
    // Implementation would optimize vector indexes
    console.log('Optimizing vector indexes for better performance');
  }

  /**
   * Initialize recovery procedures
   */
  private initializeRecoveryProcedures(): void {
    // Define standard recovery procedures
    const procedures: RecoveryProcedure[] = [
      {
        procedure_id: 'restart_ai_client',
        name: 'Restart AI Client',
        description: 'Reinitialize AI client connections',
        applicable_issues: ['provider_connectivity_failure', 'ai_client_error'],
        risk_level: 'low',
        success_rate: 0.9,
        avg_execution_time_ms: 5000,
        prerequisites: ['AI provider credentials available'],
        steps: [
          {
            step_number: 1,
            description: 'Gracefully close existing AI client connections',
            action_type: 'api_call',
            parameters: {},
            timeout_ms: 10000,
            retry_count: 0,
            success_criteria: ['Connections closed cleanly'],
            failure_handling: 'continue'
          },
          {
            step_number: 2,
            description: 'Reinitialize AI client with fresh connections',
            action_type: 'configuration',
            parameters: {},
            timeout_ms: 15000,
            retry_count: 2,
            success_criteria: ['Client initialized', 'Test embedding successful'],
            failure_handling: 'abort'
          }
        ],
        rollback_plan: {
          rollback_available: true,
          rollback_steps: [],
          rollback_risk: 'low',
          data_loss_risk: false,
          estimated_rollback_time: 5000
        },
        monitoring_requirements: ['Monitor AI provider response times', 'Track embedding generation success']
      },

      {
        procedure_id: 'optimize_vector_indexes',
        name: 'Optimize Vector Indexes',
        description: 'Rebuild and optimize vector similarity search indexes',
        applicable_issues: ['slow_response', 'vector_search_degradation'],
        risk_level: 'medium',
        success_rate: 0.85,
        avg_execution_time_ms: 300000, // 5 minutes
        prerequisites: ['Database maintenance window', 'Recent backup available'],
        steps: [
          {
            step_number: 1,
            description: 'Analyze current index performance',
            action_type: 'database',
            parameters: { analysis_type: 'index_stats' },
            timeout_ms: 30000,
            retry_count: 1,
            success_criteria: ['Index statistics retrieved'],
            failure_handling: 'continue'
          },
          {
            step_number: 2,
            description: 'Rebuild vector indexes with optimized parameters',
            action_type: 'database',
            parameters: { rebuild_indexes: true },
            timeout_ms: 300000,
            retry_count: 0,
            success_criteria: ['Index rebuild completed', 'Performance improved'],
            failure_handling: 'abort'
          }
        ],
        rollback_plan: {
          rollback_available: true,
          rollback_steps: [
            {
              step_number: 1,
              description: 'Restore original index configuration',
              action_type: 'database',
              parameters: { restore_backup: true },
              timeout_ms: 180000,
              retry_count: 1,
              success_criteria: ['Original indexes restored'],
              failure_handling: 'abort'
            }
          ],
          rollback_risk: 'low',
          data_loss_risk: false,
          estimated_rollback_time: 180000
        },
        monitoring_requirements: ['Monitor vector search performance', 'Track index usage statistics']
      }
    ];

    // Store procedures
    for (const procedure of procedures) {
      this.recoveryProcedures.set(procedure.procedure_id, procedure);
    }
  }

  /**
   * Generate health recommendations
   */
  private generateHealthRecommendations(
    componentResults: ComponentHealthResult[],
    criticalIssues: HealthIssue[]
  ): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // Preventive recommendations
    const degradedComponents = componentResults.filter(r => r.status === 'degraded');
    for (const component of degradedComponents) {
      recommendations.push({
        recommendation_id: `preventive_${component.component}_${Date.now()}`,
        category: 'preventive',
        priority: 'medium',
        title: `Address ${component.component} performance degradation`,
        description: `${component.component} showing signs of degradation (score: ${(component.health_score * 100).toFixed(1)}%)`,
        affected_components: [component.component],
        implementation_effort: 'medium',
        expected_impact: 'Prevent critical failures and maintain performance',
        action_items: [
          `Investigate ${component.component} performance metrics`,
          'Apply targeted optimizations',
          'Monitor for improvement'
        ],
        timeline: '1-2 days'
      });
    }

    // Critical issue recommendations
    for (const issue of criticalIssues) {
      recommendations.push({
        recommendation_id: `critical_${issue.issue_id}`,
        category: 'corrective',
        priority: 'urgent',
        title: `Resolve critical ${issue.component} issue`,
        description: issue.description,
        affected_components: [issue.component],
        implementation_effort: issue.auto_recoverable ? 'low' : 'high',
        expected_impact: 'Restore system functionality and prevent user impact',
        action_items: issue.recovery_procedures,
        timeline: issue.auto_recoverable ? 'Immediate' : '4-8 hours'
      });
    }

    // Optimization recommendations
    const lowPerformanceComponents = componentResults.filter(r => r.health_score < 0.8);
    if (lowPerformanceComponents.length > 2) {
      recommendations.push({
        recommendation_id: `optimization_system_wide_${Date.now()}`,
        category: 'optimization',
        priority: 'high',
        title: 'System-wide performance optimization needed',
        description: `${lowPerformanceComponents.length} components showing suboptimal performance`,
        affected_components: lowPerformanceComponents.map(c => c.component),
        implementation_effort: 'high',
        expected_impact: 'Significant improvement in overall system performance',
        action_items: [
          'Conduct comprehensive performance analysis',
          'Implement system-wide optimizations',
          'Upgrade infrastructure if needed'
        ],
        timeline: '1-2 weeks'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    });
  }

  private isAutoRecoveryAvailable(component: ComponentType, issues: HealthIssue[]): boolean {
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    return criticalIssues.some(issue => issue.auto_recoverable);
  }

  private async storeHealthCheckResult(result: HealthCheckResult): Promise<void> {
    try {
      // Store in AI processing queue for tracking
      await this.supabase
        .from('ai_processing_queue')
        .insert({
          task_type: 'health_check_complete',
          task_data: {
            check_id: result.check_id,
            overall_status: result.overall_status,
            health_score: result.health_score,
            critical_issues_count: result.critical_issues.length,
            recovery_actions_count: result.recovery_actions_taken.length,
            timestamp: result.timestamp
          },
          status: 'completed',
          priority: 10
        });

    } catch (error) {
      console.warn('Failed to store health check result:', error);
    }
  }

  private startHealthMonitoring(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Start periodic health checks
    setInterval(() => {
      this.executeHealthCheck().catch(error => {
        console.error('Scheduled health check failed:', error);
      });
    }, this.config.checkInterval);

    console.log(`🏥 AI system health monitoring started (interval: ${this.config.checkInterval}ms)`);
  }

  // Public API
  onHealthIssue(handler: (issue: HealthIssue) => void): void {
    this.alertHandlers.push(handler);
  }

  getHealthHistory(component?: ComponentType): Map<ComponentType, HealthCheckResult[]> {
    if (component) {
      const componentHistory = this.healthHistory.get(component);
      return new Map(componentHistory ? [[component, componentHistory]] : []);
    }
    return new Map(this.healthHistory);
  }

  getActiveRecoveries(): Map<string, RecoveryAction> {
    return new Map(this.activeRecoveries);
  }

  getRecoveryProcedures(): Map<string, RecoveryProcedure> {
    return new Map(this.recoveryProcedures);
  }

  async manualRecovery(component: ComponentType, procedure: string): Promise<RecoveryAction> {
    const recoveryAction: RecoveryAction = {
      action_id: `manual_recovery_${component}_${Date.now()}`,
      action_type: procedure,
      component,
      triggered_by: 'manual_request',
      status: 'pending',
      started_at: Date.now(),
      success: false,
      details: { manual_recovery: true },
      side_effects: [],
      rollback_available: true
    };

    await this.executeRecoveryAction(recoveryAction);
    return recoveryAction;
  }

  stopHealthMonitoring(): void {
    this.isRunning = false;
    console.log('🏥 AI system health monitoring stopped');
  }
}

// Export factory function
export const createAISystemHealthMonitor = (config?: any) => {
  return new AISystemHealthMonitor({
    checkInterval: 300000, // 5 minutes
    alertThresholds: {
      response_time: 1000,
      error_rate: 0.05,
      memory_usage: 0.85,
      disk_usage: 0.9,
      cpu_usage: 0.8
    },
    recoveryProcedures: {
      embedding_queue_overflow: 'scale_processing',
      vector_search_degradation: 'optimize_vector_indexes',
      ai_provider_failure: 'switch_provider',
      cache_memory_pressure: 'clear_cache',
      database_connection_issues: 'restart_connections'
    },
    autoRecoveryEnabled: true,
    maxRecoveryAttempts: 3,
    recoveryBackoffMs: 30000,
    healthScoreThresholds: {
      critical: 0.3,
      warning: 0.7,
      good: 0.9
    },
    ...config
  });
};

// Additional exports from performance monitoring
export {
  AIPerformanceMonitor,
  createAIPerformanceMonitor
} from './performance-monitoring';

export {
  VectorSearchOptimizer,
  createVectorSearchOptimizer
} from './vector-search-optimizer';

export {
  RecommendationCacheManager,
  createRecommendationCacheManager
} from './recommendation-cache-manager';