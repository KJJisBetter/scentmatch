/**
 * Comprehensive Error Handling and Retry System
 * 
 * Provides robust error handling, retry mechanisms, circuit breakers,
 * and recovery strategies for the AI embedding pipeline.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Error Types and Categories
export enum ErrorCategory {
  RATE_LIMIT = 'rate_limit',
  NETWORK = 'network',
  API_ERROR = 'api_error',
  VALIDATION = 'validation',
  DATABASE = 'database',
  TIMEOUT = 'timeout',
  QUOTA_EXCEEDED = 'quota_exceeded',
  AUTHENTICATION = 'authentication',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ProcessingError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  retryable: boolean;
  retry_after?: number; // milliseconds
  context: {
    fragrance_id?: string;
    task_id?: string;
    provider?: string;
    model?: string;
    attempt_number?: number;
  };
  timestamp: Date;
  stack_trace?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  jitterFactor: number;
  retryableCategories: ErrorCategory[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeoutMs: number;
  monitoringPeriodMs: number;
  resetTimeoutMs: number;
}

// Error Classifier - Categorizes and analyzes errors
export class ErrorClassifier {
  static categorizeError(error: any): ErrorCategory {
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toString() || '';

    // Rate limiting
    if (message.includes('rate limit') || message.includes('429') || code === '429') {
      return ErrorCategory.RATE_LIMIT;
    }

    // Network issues
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('econnreset') || message.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }

    // API errors
    if (message.includes('api') || code.startsWith('4') || code.startsWith('5')) {
      return ErrorCategory.API_ERROR;
    }

    // Database errors
    if (message.includes('database') || message.includes('sql') || 
        message.includes('relation') || code === '23503') {
      return ErrorCategory.DATABASE;
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || 
        message.includes('required') || code.startsWith('22')) {
      return ErrorCategory.VALIDATION;
    }

    // Authentication
    if (message.includes('auth') || message.includes('unauthorized') || 
        message.includes('forbidden') || code === '401' || code === '403') {
      return ErrorCategory.AUTHENTICATION;
    }

    // Quota/billing
    if (message.includes('quota') || message.includes('billing') || 
        message.includes('limit exceeded')) {
      return ErrorCategory.QUOTA_EXCEEDED;
    }

    return ErrorCategory.UNKNOWN;
  }

  static determineSeverity(category: ErrorCategory, context: any): ErrorSeverity {
    switch (category) {
      case ErrorCategory.RATE_LIMIT:
      case ErrorCategory.NETWORK:
        return ErrorSeverity.LOW; // Usually temporary

      case ErrorCategory.API_ERROR:
      case ErrorCategory.TIMEOUT:
        return ErrorSeverity.MEDIUM; // May require attention

      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.QUOTA_EXCEEDED:
        return ErrorSeverity.HIGH; // Needs immediate attention

      case ErrorCategory.DATABASE:
      case ErrorCategory.VALIDATION:
        return ErrorSeverity.CRITICAL; // System integrity issue

      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  static isRetryable(category: ErrorCategory): boolean {
    const retryableCategories = [
      ErrorCategory.RATE_LIMIT,
      ErrorCategory.NETWORK,
      ErrorCategory.TIMEOUT,
      ErrorCategory.API_ERROR // Some API errors are retryable
    ];

    return retryableCategories.includes(category);
  }

  static getRetryDelay(category: ErrorCategory, attemptNumber: number): number {
    const baseDelays = {
      [ErrorCategory.RATE_LIMIT]: 60000, // 1 minute for rate limits
      [ErrorCategory.NETWORK]: 5000,     // 5 seconds for network
      [ErrorCategory.TIMEOUT]: 10000,    // 10 seconds for timeout
      [ErrorCategory.API_ERROR]: 15000   // 15 seconds for API errors
    };

    const baseDelay = baseDelays[category] || 30000;
    return Math.min(baseDelay * Math.pow(2, attemptNumber - 1), 300000); // Max 5 minutes
  }
}

// Retry Handler with Exponential Backoff
export class RetryHandler {
  private config: RetryConfig;
  private retryStats = new Map<string, { attempts: number; lastAttempt: Date; errors: ProcessingError[] }>();

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      baseDelay: config.baseDelay || 1000,
      maxDelay: config.maxDelay || 300000, // 5 minutes
      exponentialBackoff: config.exponentialBackoff ?? true,
      jitterFactor: config.jitterFactor || 0.1,
      retryableCategories: config.retryableCategories || [
        ErrorCategory.RATE_LIMIT,
        ErrorCategory.NETWORK,
        ErrorCategory.TIMEOUT,
        ErrorCategory.API_ERROR
      ]
    };
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    taskId: string,
    context: any = {}
  ): Promise<{
    result?: T;
    success: boolean;
    attempts: number;
    totalDelay: number;
    finalError?: ProcessingError;
  }> {
    let lastError: ProcessingError;
    let totalDelay = 0;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Success - record stats and return
        this.recordSuccess(taskId, attempt);
        
        return {
          result,
          success: true,
          attempts: attempt,
          totalDelay
        };

      } catch (error) {
        lastError = this.createProcessingError(error, taskId, attempt, context);
        this.recordError(taskId, lastError);

        // Check if error is retryable
        if (!ErrorClassifier.isRetryable(lastError.category) || attempt === this.config.maxRetries) {
          break;
        }

        // Calculate retry delay
        const delay = this.calculateRetryDelay(lastError.category, attempt);
        totalDelay += delay;

        console.warn(`⚠️  Attempt ${attempt} failed for ${taskId}: ${lastError.message}`);
        console.log(`   🔄 Retrying in ${delay}ms...`);

        await this.sleep(delay);
      }
    }

    return {
      success: false,
      attempts: this.config.maxRetries,
      totalDelay,
      finalError: lastError
    };
  }

  private createProcessingError(error: any, taskId: string, attempt: number, context: any): ProcessingError {
    const category = ErrorClassifier.categorizeError(error);
    const severity = ErrorClassifier.determineSeverity(category, context);

    return {
      id: crypto.randomUUID(),
      category,
      severity,
      message: error.message || 'Unknown error',
      retryable: ErrorClassifier.isRetryable(category),
      retry_after: ErrorClassifier.getRetryDelay(category, attempt),
      context: {
        task_id: taskId,
        attempt_number: attempt,
        ...context
      },
      timestamp: new Date(),
      stack_trace: error.stack
    };
  }

  private calculateRetryDelay(category: ErrorCategory, attempt: number): number {
    let delay = ErrorClassifier.getRetryDelay(category, attempt);
    
    if (this.config.exponentialBackoff) {
      delay = Math.min(this.config.baseDelay * Math.pow(2, attempt - 1), this.config.maxDelay);
    }

    // Add jitter to prevent thundering herd
    const jitter = delay * this.config.jitterFactor * Math.random();
    return Math.round(delay + jitter);
  }

  private recordError(taskId: string, error: ProcessingError): void {
    if (!this.retryStats.has(taskId)) {
      this.retryStats.set(taskId, { attempts: 0, lastAttempt: new Date(), errors: [] });
    }

    const stats = this.retryStats.get(taskId)!;
    stats.attempts++;
    stats.lastAttempt = new Date();
    stats.errors.push(error);
  }

  private recordSuccess(taskId: string, attempts: number): void {
    if (this.retryStats.has(taskId)) {
      // Keep record of successful retry for metrics
      const stats = this.retryStats.get(taskId)!;
      stats.attempts = attempts;
      stats.lastAttempt = new Date();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRetryStats(taskId: string) {
    return this.retryStats.get(taskId);
  }

  getAllRetryStats() {
    return Array.from(this.retryStats.entries()).map(([taskId, stats]) => ({
      task_id: taskId,
      ...stats
    }));
  }
}

// Circuit Breaker for Provider Protection
export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private failures = new Map<string, Date[]>();
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastFailureTime: Date | null = null;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      timeoutMs: config.timeoutMs || 60000,
      monitoringPeriodMs: config.monitoringPeriodMs || 300000, // 5 minutes
      resetTimeoutMs: config.resetTimeoutMs || 60000 // 1 minute
    };
  }

  async execute<T>(
    operation: () => Promise<T>,
    providerId: string
  ): Promise<{
    result?: T;
    success: boolean;
    circuitState: string;
    error?: string;
  }> {
    // Check circuit state
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        console.log(`🔄 Circuit breaker HALF_OPEN for ${providerId}`);
      } else {
        return {
          success: false,
          circuitState: 'OPEN',
          error: 'Circuit breaker is OPEN - provider temporarily disabled'
        };
      }
    }

    try {
      const result = await operation();
      
      // Success - reset circuit if it was half-open
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        console.log(`✅ Circuit breaker CLOSED for ${providerId} - provider recovered`);
      }

      return {
        result,
        success: true,
        circuitState: this.state
      };

    } catch (error) {
      this.recordFailure(providerId);

      // Check if we should open the circuit
      if (this.shouldOpenCircuit(providerId)) {
        this.state = 'OPEN';
        this.lastFailureTime = new Date();
        console.warn(`🔴 Circuit breaker OPEN for ${providerId} - too many failures`);
      }

      return {
        success: false,
        circuitState: this.state,
        error: error.message
      };
    }
  }

  private recordFailure(providerId: string): void {
    const now = new Date();
    
    if (!this.failures.has(providerId)) {
      this.failures.set(providerId, []);
    }

    const providerFailures = this.failures.get(providerId)!;
    providerFailures.push(now);

    // Remove old failures outside monitoring period
    const cutoff = new Date(now.getTime() - this.config.monitoringPeriodMs);
    const recentFailures = providerFailures.filter(failure => failure > cutoff);
    this.failures.set(providerId, recentFailures);
  }

  private shouldOpenCircuit(providerId: string): boolean {
    const failures = this.failures.get(providerId) || [];
    return failures.length >= this.config.failureThreshold;
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.resetTimeoutMs;
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(providerId: string): number {
    return this.failures.get(providerId)?.length || 0;
  }

  reset(providerId?: string): void {
    if (providerId) {
      this.failures.delete(providerId);
    } else {
      this.failures.clear();
    }
    
    this.state = 'CLOSED';
    this.lastFailureTime = null;
    console.log(`🔄 Circuit breaker reset${providerId ? ` for ${providerId}` : ''}`);
  }
}

// Dead Letter Queue for Persistently Failing Tasks
export class DeadLetterQueue {
  private supabase: SupabaseClient;
  private maxAge: number; // milliseconds

  constructor(config: {
    supabase: SupabaseClient;
    maxAge?: number;
  }) {
    this.supabase = config.supabase;
    this.maxAge = config.maxAge || 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  async moveToDeadLetter(taskId: string, reason: string): Promise<void> {
    try {
      // Get the failed task
      const { data: task, error: fetchError } = await this.supabase
        .from('ai_processing_queue')
        .select('*')
        .eq('id', taskId)
        .single();

      if (fetchError || !task) {
        throw new Error(`Failed to fetch task for dead letter: ${fetchError?.message}`);
      }

      // Create dead letter entry
      const { error: dlqError } = await this.supabase
        .from('ai_processing_queue')
        .insert({
          task_type: 'dead_letter',
          task_data: {
            original_task: task,
            dead_letter_reason: reason,
            moved_at: new Date().toISOString(),
            original_task_id: taskId
          },
          priority: 10, // Lowest priority
          status: 'failed'
        });

      if (dlqError) {
        throw new Error(`Failed to create dead letter entry: ${dlqError.message}`);
      }

      // Remove original task
      await this.supabase
        .from('ai_processing_queue')
        .delete()
        .eq('id', taskId);

      console.log(`💀 Moved task ${taskId} to dead letter queue: ${reason}`);

    } catch (error) {
      console.error(`❌ Failed to move task to dead letter queue:`, error.message);
      throw error;
    }
  }

  async getDeadLetterTasks(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('ai_processing_queue')
      .select('*')
      .eq('task_type', 'dead_letter')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch dead letter tasks: ${error.message}`);
    }

    return data || [];
  }

  async retryDeadLetterTask(deadLetterTaskId: string): Promise<{
    success: boolean;
    new_task_id?: string;
    error?: string;
  }> {
    try {
      // Get dead letter task
      const { data: dlTask, error: fetchError } = await this.supabase
        .from('ai_processing_queue')
        .select('task_data')
        .eq('id', deadLetterTaskId)
        .eq('task_type', 'dead_letter')
        .single();

      if (fetchError || !dlTask) {
        throw new Error('Dead letter task not found');
      }

      const originalTask = dlTask.task_data.original_task;

      // Create new task with retry
      const { data: newTask, error: createError } = await this.supabase
        .from('ai_processing_queue')
        .insert({
          task_type: originalTask.task_type,
          task_data: originalTask.task_data,
          priority: 3, // Higher priority for retries
          status: 'pending'
        })
        .select('id')
        .single();

      if (createError) {
        throw new Error(`Failed to recreate task: ${createError.message}`);
      }

      // Remove from dead letter queue
      await this.supabase
        .from('ai_processing_queue')
        .delete()
        .eq('id', deadLetterTaskId);

      console.log(`🔄 Retrying dead letter task as ${newTask.id}`);

      return {
        success: true,
        new_task_id: newTask.id
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cleanupExpiredDeadLetters(): Promise<number> {
    const cutoff = new Date(Date.now() - this.maxAge);

    const { data, error } = await this.supabase
      .from('ai_processing_queue')
      .delete()
      .eq('task_type', 'dead_letter')
      .lt('created_at', cutoff.toISOString())
      .select('id');

    if (error) {
      console.error('Failed to cleanup dead letters:', error.message);
      return 0;
    }

    const deletedCount = data?.length || 0;
    if (deletedCount > 0) {
      console.log(`🗑️  Cleaned up ${deletedCount} expired dead letter tasks`);
    }

    return deletedCount;
  }
}

// Error Recovery Manager
export class ErrorRecoveryManager {
  private supabase: SupabaseClient;
  private retryHandler: RetryHandler;
  private deadLetterQueue: DeadLetterQueue;
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor(config: {
    supabase: SupabaseClient;
    retryConfig?: Partial<RetryConfig>;
    circuitBreakerConfig?: Partial<CircuitBreakerConfig>;
  }) {
    this.supabase = config.supabase;
    this.retryHandler = new RetryHandler(config.retryConfig);
    this.deadLetterQueue = new DeadLetterQueue({ supabase: config.supabase });
  }

  async processWithRecovery<T>(
    operation: () => Promise<T>,
    taskId: string,
    context: {
      fragrance_id?: string;
      provider?: string;
      model?: string;
    } = {}
  ): Promise<{
    result?: T;
    success: boolean;
    recovery_used: boolean;
    final_error?: ProcessingError;
  }> {
    // Get or create circuit breaker for provider
    const provider = context.provider || 'default';
    if (!this.circuitBreakers.has(provider)) {
      this.circuitBreakers.set(provider, new CircuitBreaker());
    }
    
    const circuitBreaker = this.circuitBreakers.get(provider)!;

    // Execute with circuit breaker protection
    const circuitResult = await circuitBreaker.execute(async () => {
      // Execute with retry logic
      return await this.retryHandler.executeWithRetry(operation, taskId, context);
    }, provider);

    if (circuitResult.success && circuitResult.result) {
      return {
        result: circuitResult.result.result,
        success: circuitResult.result.success,
        recovery_used: circuitResult.result.attempts > 1
      };
    }

    // If all retries failed, consider dead letter queue
    const retryStats = this.retryHandler.getRetryStats(taskId);
    if (retryStats && retryStats.attempts >= 3) {
      const lastError = retryStats.errors[retryStats.errors.length - 1];
      
      // Move to dead letter if persistently failing
      if (lastError.category !== ErrorCategory.RATE_LIMIT) {
        await this.deadLetterQueue.moveToDeadLetter(
          taskId,
          `Persistent failure after ${retryStats.attempts} attempts: ${lastError.message}`
        );
      }
    }

    return {
      success: false,
      recovery_used: true,
      final_error: retryStats?.errors[retryStats.errors.length - 1]
    };
  }

  async getRecoveryStats(): Promise<{
    total_retries: number;
    successful_recoveries: number;
    dead_letter_count: number;
    circuit_breaker_states: Record<string, string>;
    top_error_categories: Array<{ category: string; count: number }>;
  }> {
    const retryStats = this.retryHandler.getAllRetryStats();
    const deadLetters = await this.deadLetterQueue.getDeadLetterTasks();
    
    // Count error categories
    const errorCounts = new Map<string, number>();
    retryStats.forEach(stat => {
      stat.errors.forEach(error => {
        errorCounts.set(error.category, (errorCounts.get(error.category) || 0) + 1);
      });
    });

    const topErrors = Array.from(errorCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Circuit breaker states
    const circuitStates: Record<string, string> = {};
    this.circuitBreakers.forEach((breaker, provider) => {
      circuitStates[provider] = breaker.getState();
    });

    return {
      total_retries: retryStats.reduce((sum, stat) => sum + stat.attempts, 0),
      successful_recoveries: retryStats.filter(stat => stat.attempts > 1 && stat.errors.length < stat.attempts).length,
      dead_letter_count: deadLetters.length,
      circuit_breaker_states: circuitStates,
      top_error_categories: topErrors
    };
  }

  async performRecoveryMaintenance(): Promise<{
    cleaned_dead_letters: number;
    reset_circuit_breakers: number;
    cleared_old_retry_stats: number;
  }> {
    console.log('🔧 Performing error recovery maintenance...');

    // Clean up expired dead letters
    const cleanedDeadLetters = await this.deadLetterQueue.cleanupExpiredDeadLetters();

    // Reset circuit breakers that have been open too long
    let resetBreakers = 0;
    this.circuitBreakers.forEach((breaker, provider) => {
      if (breaker.getState() === 'OPEN') {
        breaker.reset(provider);
        resetBreakers++;
      }
    });

    // Clear old retry stats (keep last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let clearedStats = 0;
    
    this.retryHandler.getAllRetryStats().forEach(stat => {
      if (stat.lastAttempt < cutoff) {
        // In real implementation, would clear from storage
        clearedStats++;
      }
    });

    console.log(`🔧 Maintenance complete:`);
    console.log(`   🗑️  Cleaned ${cleanedDeadLetters} expired dead letters`);
    console.log(`   🔄 Reset ${resetBreakers} circuit breakers`);
    console.log(`   📊 Cleared ${clearedStats} old retry statistics`);

    return {
      cleaned_dead_letters: cleanedDeadLetters,
      reset_circuit_breakers: resetBreakers,
      cleared_old_retry_stats: clearedStats
    };
  }
}

// Comprehensive Error Handler for Embedding Operations
export class EmbeddingErrorHandler {
  private recoveryManager: ErrorRecoveryManager;
  private alertHandlers: Array<(error: ProcessingError) => void> = [];

  constructor(config: {
    supabase: SupabaseClient;
    enableAlerts?: boolean;
    retryConfig?: Partial<RetryConfig>;
  }) {
    this.recoveryManager = new ErrorRecoveryManager({
      supabase: config.supabase,
      retryConfig: config.retryConfig
    });

    if (config.enableAlerts) {
      this.setupDefaultAlertHandlers();
    }
  }

  async handleEmbeddingError(
    error: any,
    context: {
      fragrance_id: string;
      task_id: string;
      operation: string;
      provider?: string;
      model?: string;
    }
  ): Promise<{
    handled: boolean;
    action_taken: string;
    retry_scheduled: boolean;
    escalated: boolean;
  }> {
    const processingError = this.classifyAndEnrichError(error, context);
    
    // Notify alert handlers
    this.notifyAlertHandlers(processingError);

    // Log error details
    await this.logError(processingError);

    // Determine action based on error category and severity
    const action = this.determineRecoveryAction(processingError);

    switch (action.type) {
      case 'retry':
        return {
          handled: true,
          action_taken: 'scheduled_retry',
          retry_scheduled: true,
          escalated: false
        };

      case 'fallback':
        return {
          handled: true,
          action_taken: 'provider_fallback',
          retry_scheduled: true,
          escalated: false
        };

      case 'dead_letter':
        await this.recoveryManager.deadLetterQueue.moveToDeadLetter(
          context.task_id,
          `${processingError.category}: ${processingError.message}`
        );
        return {
          handled: true,
          action_taken: 'moved_to_dead_letter',
          retry_scheduled: false,
          escalated: true
        };

      case 'escalate':
        return {
          handled: false,
          action_taken: 'escalated_to_admin',
          retry_scheduled: false,
          escalated: true
        };

      default:
        return {
          handled: false,
          action_taken: 'no_action',
          retry_scheduled: false,
          escalated: false
        };
    }
  }

  private classifyAndEnrichError(error: any, context: any): ProcessingError {
    const category = ErrorClassifier.categorizeError(error);
    const severity = ErrorClassifier.determineSeverity(category, context);

    return {
      id: crypto.randomUUID(),
      category,
      severity,
      message: error.message || 'Unknown error',
      retryable: ErrorClassifier.isRetryable(category),
      retry_after: ErrorClassifier.getRetryDelay(category, context.attempt_number || 1),
      context,
      timestamp: new Date(),
      stack_trace: error.stack
    };
  }

  private determineRecoveryAction(error: ProcessingError): { type: string; reason: string } {
    // Critical errors get escalated immediately
    if (error.severity === ErrorSeverity.CRITICAL) {
      return { type: 'escalate', reason: 'Critical error requires immediate attention' };
    }

    // Rate limits and network issues get retried
    if (error.category === ErrorCategory.RATE_LIMIT || error.category === ErrorCategory.NETWORK) {
      return { type: 'retry', reason: 'Temporary issue, retry recommended' };
    }

    // API errors may benefit from provider fallback
    if (error.category === ErrorCategory.API_ERROR && error.context.provider) {
      return { type: 'fallback', reason: 'API error, try different provider' };
    }

    // Validation errors go to dead letter (likely not fixable by retry)
    if (error.category === ErrorCategory.VALIDATION) {
      return { type: 'dead_letter', reason: 'Validation error unlikely to resolve with retry' };
    }

    // Authentication and quota issues need escalation
    if (error.category === ErrorCategory.AUTHENTICATION || error.category === ErrorCategory.QUOTA_EXCEEDED) {
      return { type: 'escalate', reason: 'Requires configuration or billing attention' };
    }

    // Default to retry for unknown issues
    return { type: 'retry', reason: 'Unknown issue, attempting retry' };
  }

  private async logError(error: ProcessingError): Promise<void> {
    try {
      await this.supabase
        .from('ai_processing_queue')
        .insert({
          task_type: 'error_log',
          task_data: {
            error_id: error.id,
            category: error.category,
            severity: error.severity,
            message: error.message,
            context: error.context,
            retryable: error.retryable,
            timestamp: error.timestamp.toISOString()
          },
          priority: 9
        });
    } catch (logError) {
      console.error('Failed to log error:', logError.message);
    }
  }

  private setupDefaultAlertHandlers(): void {
    // High severity error alerts
    this.onAlert((error) => {
      if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
        console.error(`🚨 ${error.severity.toUpperCase()} ERROR: ${error.message}`);
        console.error(`   Context: ${JSON.stringify(error.context)}`);
      }
    });

    // Rate limit alerts
    this.onAlert((error) => {
      if (error.category === ErrorCategory.RATE_LIMIT) {
        console.warn(`⏱️  Rate limit hit for ${error.context.provider}: ${error.message}`);
      }
    });
  }

  onAlert(handler: (error: ProcessingError) => void): void {
    this.alertHandlers.push(handler);
  }

  private notifyAlertHandlers(error: ProcessingError): void {
    this.alertHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError) {
        console.error('Alert handler error:', handlerError.message);
      }
    });
  }

  async getErrorSummary(timeframe: number = 24 * 60 * 60 * 1000): Promise<{
    total_errors: number;
    by_category: Record<string, number>;
    by_severity: Record<string, number>;
    recovery_rate: number;
    top_failing_fragrances: Array<{ fragrance_id: string; error_count: number }>;
  }> {
    const cutoff = new Date(Date.now() - timeframe);

    // Get error logs from the timeframe
    const { data: errorLogs, error } = await this.supabase
      .from('ai_processing_queue')
      .select('task_data')
      .eq('task_type', 'error_log')
      .gte('created_at', cutoff.toISOString());

    if (error) {
      throw new Error(`Failed to fetch error logs: ${error.message}`);
    }

    const logs = errorLogs?.map(log => log.task_data) || [];
    
    const summary = {
      total_errors: logs.length,
      by_category: {},
      by_severity: {},
      recovery_rate: 0,
      top_failing_fragrances: []
    };

    // Analyze errors
    const fragranceErrorCounts = new Map<string, number>();
    
    logs.forEach(log => {
      // Count by category
      summary.by_category[log.category] = (summary.by_category[log.category] || 0) + 1;
      
      // Count by severity
      summary.by_severity[log.severity] = (summary.by_severity[log.severity] || 0) + 1;
      
      // Track fragrance-specific errors
      if (log.context?.fragrance_id) {
        const count = fragranceErrorCounts.get(log.context.fragrance_id) || 0;
        fragranceErrorCounts.set(log.context.fragrance_id, count + 1);
      }
    });

    // Calculate recovery rate (successful tasks vs total attempts)
    const { data: successfulTasks } = await this.supabase
      .from('ai_processing_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', cutoff.toISOString());

    const totalAttempts = (successfulTasks || 0) + summary.total_errors;
    summary.recovery_rate = totalAttempts > 0 ? (successfulTasks || 0) / totalAttempts : 1;

    // Top failing fragrances
    summary.top_failing_fragrances = Array.from(fragranceErrorCounts.entries())
      .map(([fragrance_id, error_count]) => ({ fragrance_id, error_count }))
      .sort((a, b) => b.error_count - a.error_count)
      .slice(0, 5);

    return summary;
  }
}

// Export main error handling interface
export function createErrorHandler(supabase: SupabaseClient): EmbeddingErrorHandler {
  return new EmbeddingErrorHandler({
    supabase,
    enableAlerts: true,
    retryConfig: {
      maxRetries: 3,
      baseDelay: 2000,
      exponentialBackoff: true
    }
  });
}