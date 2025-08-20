/**
 * Real-Time Event Processing Pipeline
 * 
 * High-performance event streaming system for processing user interactions
 * and updating preferences in real-time with contextual learning.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';

// Core Types and Interfaces
export interface UserInteractionEvent {
  user_id: string;
  fragrance_id: string;
  event_type: 'view' | 'click' | 'rating' | 'favorite' | 'purchase_intent' | 'add_to_collection' | 'search' | 'share';
  event_value?: number; // Duration for views, rating value, etc.
  session_id: string;
  
  // Context information
  context: {
    page?: string;
    section?: string;
    position?: number;
    source?: string;
    referrer?: string;
    search_query?: string;
  };
  
  // Device and environment context
  device_context: {
    device_type: 'mobile' | 'tablet' | 'desktop';
    user_agent: string;
    screen_resolution?: string;
    connection_type?: string;
  };
  
  // Temporal context
  timestamp: Date;
  local_timezone?: string;
  
  // Quality indicators
  interaction_quality?: number; // 0-1 score based on engagement signals
  authenticity_score?: number; // 0-1 score for bot detection
}

export interface ProcessingResult {
  event_id: string;
  processed: boolean;
  processing_latency_ms: number;
  preference_signal_strength: number;
  immediate_learning_applied: boolean;
  downstream_triggers: string[];
  error?: string;
}

export interface EventStreamConfig {
  batch_size: number;
  flush_interval_ms: number;
  max_processing_latency_ms: number;
  priority_thresholds: {
    high: number;
    medium: number;
    low: number;
  };
  enable_circuit_breaker: boolean;
  enable_performance_monitoring: boolean;
}

// Real-Time Event Processor
export class RealTimeEventProcessor extends EventEmitter {
  private supabase: SupabaseClient;
  private config: EventStreamConfig;
  private processingQueue: UserInteractionEvent[] = [];
  private isProcessing: boolean = false;
  private flushTimer: NodeJS.Timeout | null = null;
  private circuitBreaker: EventProcessingCircuitBreaker;
  private performanceMonitor: EventProcessingPerformanceMonitor;

  constructor(supabase: SupabaseClient, config: Partial<EventStreamConfig> = {}) {
    super();
    this.supabase = supabase;
    this.config = {
      batch_size: config.batch_size || 20,
      flush_interval_ms: config.flush_interval_ms || 2000,
      max_processing_latency_ms: config.max_processing_latency_ms || 100,
      priority_thresholds: config.priority_thresholds || {
        high: 0.7,
        medium: 0.4,
        low: 0.2
      },
      enable_circuit_breaker: config.enable_circuit_breaker ?? true,
      enable_performance_monitoring: config.enable_performance_monitoring ?? true
    };

    this.circuitBreaker = new EventProcessingCircuitBreaker({
      failure_threshold: 5,
      timeout_ms: 30000,
      reset_timeout_ms: 60000
    });

    this.performanceMonitor = new EventProcessingPerformanceMonitor();
    this.startFlushTimer();
  }

  /**
   * Process single user interaction event in real-time
   */
  async processEvent(event: UserInteractionEvent): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Check circuit breaker
      if (this.config.enable_circuit_breaker && !this.circuitBreaker.isAllowed()) {
        return this.handleCircuitBreakerOpen(event, startTime);
      }

      // Calculate event priority and quality
      const priority = this.calculateEventPriority(event);
      const quality = this.calculateInteractionQuality(event);

      // For high-priority events, process immediately
      if (priority >= this.config.priority_thresholds.high) {
        return await this.processEventImmediate(event, priority, quality, startTime);
      }

      // For lower-priority events, add to batch queue
      this.addToQueue(event, priority, quality);
      
      return {
        event_id: `queued_${Date.now()}`,
        processed: false,
        processing_latency_ms: Date.now() - startTime,
        preference_signal_strength: this.calculateSignalStrength(event),
        immediate_learning_applied: false,
        downstream_triggers: [],
      };

    } catch (error) {
      this.circuitBreaker.recordFailure();
      this.emit('processing_error', { event, error });
      
      return {
        event_id: `error_${Date.now()}`,
        processed: false,
        processing_latency_ms: Date.now() - startTime,
        preference_signal_strength: 0,
        immediate_learning_applied: false,
        downstream_triggers: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process event immediately for high-priority interactions
   */
  private async processEventImmediate(
    event: UserInteractionEvent,
    priority: number,
    quality: number,
    startTime: number
  ): Promise<ProcessingResult> {
    try {
      // Store event with real-time processing metadata
      const { data: eventRecord, error: insertError } = await this.supabase
        .from('user_interactions')
        .insert({
          user_id: event.user_id,
          fragrance_id: event.fragrance_id,
          interaction_type: event.event_type,
          interaction_value: event.event_value,
          interaction_context: event.context,
          device_context: event.device_context,
          session_id: event.session_id,
          processing_status: 'processing',
          priority_score: priority,
          interaction_quality: quality,
          event_source: 'real_time',
          created_at: event.timestamp.toISOString()
        })
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Failed to store event: ${insertError.message}`);
      }

      // Process using database function for optimal performance
      const { data: processingResult, error: processError } = await this.supabase
        .rpc('process_real_time_interaction', {
          target_user_id: event.user_id,
          fragrance_id_param: event.fragrance_id,
          event_type_param: event.event_type,
          event_value_param: event.event_value,
          context_data: event.context || {},
          device_context_param: event.device_context || {}
        });

      if (processError) {
        throw new Error(`Failed to process event: ${processError.message}`);
      }

      const result = processingResult?.[0];
      const processingLatency = Date.now() - startTime;

      // Emit events for downstream systems
      this.emit('event_processed', {
        event_id: result?.event_id,
        user_id: event.user_id,
        signal_strength: result?.preference_signal_strength,
        triggers: result?.downstream_triggers
      });

      // Update performance metrics
      if (this.config.enable_performance_monitoring) {
        this.performanceMonitor.recordProcessing({
          latency_ms: processingLatency,
          priority: priority,
          success: true,
          signal_strength: result?.preference_signal_strength || 0
        });
      }

      this.circuitBreaker.recordSuccess();

      return {
        event_id: result?.event_id || eventRecord.id,
        processed: true,
        processing_latency_ms: processingLatency,
        preference_signal_strength: result?.preference_signal_strength || 0,
        immediate_learning_applied: result?.immediate_learning_applied || false,
        downstream_triggers: result?.downstream_triggers || []
      };

    } catch (error) {
      this.circuitBreaker.recordFailure();
      throw error;
    }
  }

  /**
   * Add event to batch processing queue
   */
  private addToQueue(event: UserInteractionEvent, priority: number, quality: number): void {
    const queueItem = {
      ...event,
      _priority: priority,
      _quality: quality,
      _queued_at: Date.now()
    };

    this.processingQueue.push(queueItem);
    
    // Sort by priority (highest first)
    this.processingQueue.sort((a, b) => (b as any)._priority - (a as any)._priority);

    // Process immediately if queue is full
    if (this.processingQueue.length >= this.config.batch_size) {
      this.flushQueue();
    }
  }

  /**
   * Flush queued events for batch processing
   */
  private async flushQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batchToProcess = this.processingQueue.splice(0, this.config.batch_size);

    try {
      await this.processBatch(batchToProcess);
    } catch (error) {
      console.error('Batch processing failed:', error);
      this.emit('batch_processing_error', { batch: batchToProcess, error });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process batch of events
   */
  private async processBatch(events: (UserInteractionEvent & any)[]): Promise<void> {
    const startTime = Date.now();

    // Prepare batch insert data
    const eventInserts = events.map(event => ({
      user_id: event.user_id,
      fragrance_id: event.fragrance_id,
      interaction_type: event.event_type,
      interaction_value: event.event_value,
      interaction_context: event.context,
      device_context: event.device_context,
      session_id: event.session_id,
      processing_status: 'processing',
      priority_score: event._priority,
      interaction_quality: event._quality,
      event_source: 'batch',
      created_at: event.timestamp.toISOString()
    }));

    // Batch insert events
    const { error: insertError } = await this.supabase
      .from('user_interactions')
      .insert(eventInserts);

    if (insertError) {
      throw new Error(`Batch insert failed: ${insertError.message}`);
    }

    // Process high-priority events from batch immediately
    const highPriorityEvents = events.filter(e => e._priority >= this.config.priority_thresholds.high);
    
    for (const event of highPriorityEvents) {
      try {
        await this.processEventImmediate(event, event._priority, event._quality, event._queued_at);
      } catch (error) {
        console.error('High-priority event processing failed:', error);
      }
    }

    // Emit batch processing completion
    this.emit('batch_processed', {
      events_count: events.length,
      processing_time_ms: Date.now() - startTime,
      high_priority_count: highPriorityEvents.length
    });
  }

  /**
   * Calculate event priority based on interaction type and context
   */
  private calculateEventPriority(event: UserInteractionEvent): number {
    let priority = 0.5; // Base priority

    // Event type priority
    const typePriorities = {
      'purchase_intent': 1.0,
      'add_to_collection': 0.9,
      'rating': 0.8,
      'favorite': 0.7,
      'share': 0.6,
      'click': 0.4,
      'search': 0.3,
      'view': 0.2
    };

    priority = typePriorities[event.event_type] || 0.3;

    // Boost priority for high-value interactions
    if (event.event_type === 'rating' && event.event_value) {
      priority *= (1 + (event.event_value - 3) / 10); // Boost for high ratings
    }

    // Boost priority for engaged interactions (long view times)
    if (event.event_type === 'view' && event.event_value && event.event_value > 30) {
      priority *= 1.2;
    }

    // Context-based priority adjustments
    if (event.context?.position !== undefined && event.context.position < 3) {
      priority *= 1.1; // Boost for top-position interactions
    }

    return Math.min(1.0, priority);
  }

  /**
   * Calculate interaction quality score
   */
  private calculateInteractionQuality(event: UserInteractionEvent): number {
    let quality = 0.7; // Base quality

    // Penalize very short view times (likely accidental)
    if (event.event_type === 'view' && event.event_value && event.event_value < 3) {
      quality *= 0.3;
    }

    // Boost for authentic engagement signals
    if (event.context?.source === 'organic') {
      quality *= 1.2;
    }

    // Penalize suspicious patterns (bot detection)
    if (event.authenticity_score !== undefined) {
      quality *= event.authenticity_score;
    }

    return Math.min(1.0, Math.max(0.1, quality));
  }

  /**
   * Calculate preference signal strength
   */
  private calculateSignalStrength(event: UserInteractionEvent): number {
    const typeMagnitudes = {
      'purchase_intent': 0.95,
      'add_to_collection': 0.85,
      'rating': 0.7,
      'favorite': 0.6,
      'share': 0.5,
      'click': 0.3,
      'search': 0.2,
      'view': 0.1
    };

    let baseStrength = typeMagnitudes[event.event_type] || 0.1;

    // Adjust for event value
    if (event.event_type === 'rating' && event.event_value) {
      baseStrength *= (event.event_value / 5.0);
    }

    if (event.event_type === 'view' && event.event_value) {
      // Normalize view duration to signal strength
      baseStrength *= Math.min(1.0, event.event_value / 60.0);
    }

    return baseStrength;
  }

  /**
   * Handle circuit breaker open state
   */
  private handleCircuitBreakerOpen(event: UserInteractionEvent, startTime: number): ProcessingResult {
    // Store event for later processing
    this.addToQueue(event, 0.1, 0.1); // Low priority when circuit is open
    
    this.emit('circuit_breaker_active', { event });

    return {
      event_id: `circuit_breaker_${Date.now()}`,
      processed: false,
      processing_latency_ms: Date.now() - startTime,
      preference_signal_strength: 0,
      immediate_learning_applied: false,
      downstream_triggers: [],
      error: 'Circuit breaker active - event queued for later processing'
    };
  }

  /**
   * Start automatic queue flushing
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushQueue();
    }, this.config.flush_interval_ms);
  }

  /**
   * Stop event processor and clean up
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining events
    if (this.processingQueue.length > 0) {
      this.flushQueue();
    }
  }

  /**
   * Get current processing metrics
   */
  getMetrics(): {
    queue_size: number;
    is_processing: boolean;
    circuit_breaker_status: string;
    performance_metrics: any;
  } {
    return {
      queue_size: this.processingQueue.length,
      is_processing: this.isProcessing,
      circuit_breaker_status: this.circuitBreaker.getState(),
      performance_metrics: this.config.enable_performance_monitoring 
        ? this.performanceMonitor.getMetrics()
        : null
    };
  }
}

// High-Velocity Event Stream Processor
export class HighVelocityEventStreamProcessor {
  private supabase: SupabaseClient;
  private eventProcessor: RealTimeEventProcessor;
  private samplingRate: number = 1.0;
  private eventBuffer: Map<string, UserInteractionEvent[]> = new Map();
  private config: {
    max_events_per_second: number;
    sampling_strategy: 'uniform' | 'priority_based' | 'user_based';
    buffer_size: number;
    processing_workers: number;
  };

  constructor(supabase: SupabaseClient, config: Partial<{
    max_events_per_second: number;
    sampling_strategy: 'uniform' | 'priority_based' | 'user_based';
    buffer_size: number;
    processing_workers: number;
  }> = {}) {
    this.supabase = supabase;
    this.eventProcessor = new RealTimeEventProcessor(supabase);
    this.config = {
      max_events_per_second: config.max_events_per_second || 1000,
      sampling_strategy: config.sampling_strategy || 'priority_based',
      buffer_size: config.buffer_size || 10000,
      processing_workers: config.processing_workers || 4
    };
  }

  /**
   * Process high-velocity event stream with adaptive sampling
   */
  async processEventStream(events: UserInteractionEvent[]): Promise<{
    total_events_received: number;
    events_processed: number;
    events_sampled: number;
    events_dropped: number;
    processing_efficiency: number;
    stream_health: 'healthy' | 'degraded' | 'overloaded';
  }> {
    const totalEvents = events.length;
    const eventsPerSecond = totalEvents; // Assume 1-second window for this calculation
    
    // Adjust sampling rate based on load
    this.adjustSamplingRate(eventsPerSecond);
    
    // Sample events based on strategy
    const sampledEvents = this.sampleEvents(events);
    
    // Process sampled events
    const processedCount = await this.processEventBatch(sampledEvents);
    
    const droppedCount = totalEvents - sampledEvents.length;
    const efficiency = processedCount / Math.max(totalEvents, 1);
    
    let streamHealth: 'healthy' | 'degraded' | 'overloaded' = 'healthy';
    if (efficiency < 0.5) streamHealth = 'overloaded';
    else if (efficiency < 0.8) streamHealth = 'degraded';

    return {
      total_events_received: totalEvents,
      events_processed: processedCount,
      events_sampled: sampledEvents.length,
      events_dropped: droppedCount,
      processing_efficiency: efficiency,
      stream_health: streamHealth
    };
  }

  /**
   * Adjust sampling rate based on system load
   */
  private adjustSamplingRate(eventsPerSecond: number): void {
    if (eventsPerSecond > this.config.max_events_per_second * 0.9) {
      // High load - reduce sampling
      this.samplingRate = Math.max(0.1, this.config.max_events_per_second / eventsPerSecond);
    } else if (eventsPerSecond < this.config.max_events_per_second * 0.5) {
      // Low load - increase sampling
      this.samplingRate = Math.min(1.0, this.samplingRate * 1.1);
    }
  }

  /**
   * Sample events based on configured strategy
   */
  private sampleEvents(events: UserInteractionEvent[]): UserInteractionEvent[] {
    if (this.samplingRate >= 1.0) {
      return events; // Process all events
    }

    switch (this.config.sampling_strategy) {
      case 'uniform':
        return events.filter(() => Math.random() < this.samplingRate);
      
      case 'priority_based':
        return events.filter(event => {
          const priority = this.calculateEventPriority(event);
          return Math.random() < Math.min(1.0, this.samplingRate + priority * 0.3);
        });
      
      case 'user_based':
        // Sample to ensure all active users get some processing
        const userGroups = this.groupEventsByUser(events);
        const sampledEvents: UserInteractionEvent[] = [];
        
        for (const [userId, userEvents] of userGroups.entries()) {
          const eventsToSample = Math.max(1, Math.floor(userEvents.length * this.samplingRate));
          sampledEvents.push(...userEvents.slice(0, eventsToSample));
        }
        
        return sampledEvents;
      
      default:
        return events.filter(() => Math.random() < this.samplingRate);
    }
  }

  /**
   * Group events by user for user-based sampling
   */
  private groupEventsByUser(events: UserInteractionEvent[]): Map<string, UserInteractionEvent[]> {
    const userGroups = new Map<string, UserInteractionEvent[]>();
    
    for (const event of events) {
      if (!userGroups.has(event.user_id)) {
        userGroups.set(event.user_id, []);
      }
      userGroups.get(event.user_id)!.push(event);
    }
    
    return userGroups;
  }

  /**
   * Process batch of events with parallel workers
   */
  private async processEventBatch(events: UserInteractionEvent[]): Promise<number> {
    const chunkSize = Math.ceil(events.length / this.config.processing_workers);
    const chunks = [];
    
    for (let i = 0; i < events.length; i += chunkSize) {
      chunks.push(events.slice(i, i + chunkSize));
    }

    // Process chunks in parallel
    const results = await Promise.allSettled(
      chunks.map(chunk => this.processChunk(chunk))
    );

    return results.reduce((total, result) => {
      if (result.status === 'fulfilled') {
        return total + result.value;
      }
      return total;
    }, 0);
  }

  /**
   * Process a chunk of events
   */
  private async processChunk(events: UserInteractionEvent[]): Promise<number> {
    let processedCount = 0;

    for (const event of events) {
      try {
        const result = await this.eventProcessor.processEvent(event);
        if (result.processed) {
          processedCount++;
        }
      } catch (error) {
        console.error('Event processing failed:', error);
      }
    }

    return processedCount;
  }

  /**
   * Calculate event priority (reuse from RealTimeEventProcessor)
   */
  private calculateEventPriority(event: UserInteractionEvent): number {
    const typePriorities = {
      'purchase_intent': 1.0,
      'add_to_collection': 0.9,
      'rating': 0.8,
      'favorite': 0.7,
      'share': 0.6,
      'click': 0.4,
      'search': 0.3,
      'view': 0.2
    };

    return typePriorities[event.event_type] || 0.3;
  }
}

// Event Processing Circuit Breaker
export class EventProcessingCircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half_open' = 'closed';
  private config: {
    failure_threshold: number;
    timeout_ms: number;
    reset_timeout_ms: number;
  };

  constructor(config: {
    failure_threshold: number;
    timeout_ms: number;
    reset_timeout_ms: number;
  }) {
    this.config = config;
  }

  /**
   * Check if processing is allowed
   */
  isAllowed(): boolean {
    const now = Date.now();

    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      if (now - this.lastFailureTime > this.config.reset_timeout_ms) {
        this.state = 'half_open';
        return true;
      }
      return false;
    }

    if (this.state === 'half_open') {
      return true; // Allow one request to test if system is healthy
    }

    return false;
  }

  /**
   * Record successful processing
   */
  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  /**
   * Record failed processing
   */
  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failure_threshold) {
      this.state = 'open';
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): string {
    return this.state;
  }
}

// Performance Monitor for Event Processing
export class EventProcessingPerformanceMonitor {
  private metrics: {
    total_events: number;
    successful_events: number;
    failed_events: number;
    total_latency_ms: number;
    peak_latency_ms: number;
    avg_signal_strength: number;
    last_reset: Date;
  };

  constructor() {
    this.metrics = {
      total_events: 0,
      successful_events: 0,
      failed_events: 0,
      total_latency_ms: 0,
      peak_latency_ms: 0,
      avg_signal_strength: 0,
      last_reset: new Date()
    };
  }

  /**
   * Record processing metrics
   */
  recordProcessing(data: {
    latency_ms: number;
    priority: number;
    success: boolean;
    signal_strength: number;
  }): void {
    this.metrics.total_events++;
    this.metrics.total_latency_ms += data.latency_ms;
    this.metrics.peak_latency_ms = Math.max(this.metrics.peak_latency_ms, data.latency_ms);
    
    if (data.success) {
      this.metrics.successful_events++;
    } else {
      this.metrics.failed_events++;
    }

    // Update average signal strength
    const prevAvg = this.metrics.avg_signal_strength;
    this.metrics.avg_signal_strength = (prevAvg * (this.metrics.total_events - 1) + data.signal_strength) / this.metrics.total_events;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): {
    success_rate: number;
    avg_latency_ms: number;
    peak_latency_ms: number;
    events_per_second: number;
    avg_signal_strength: number;
    health_status: string;
  } {
    const timeSinceReset = (Date.now() - this.metrics.last_reset.getTime()) / 1000;
    const eventsPerSecond = this.metrics.total_events / Math.max(timeSinceReset, 1);
    const successRate = this.metrics.successful_events / Math.max(this.metrics.total_events, 1);
    const avgLatency = this.metrics.total_latency_ms / Math.max(this.metrics.total_events, 1);

    let healthStatus = 'healthy';
    if (successRate < 0.9) healthStatus = 'degraded';
    if (avgLatency > 200) healthStatus = 'slow';
    if (eventsPerSecond > 1000) healthStatus = 'overloaded';

    return {
      success_rate: successRate,
      avg_latency_ms: avgLatency,
      peak_latency_ms: this.metrics.peak_latency_ms,
      events_per_second: eventsPerSecond,
      avg_signal_strength: this.metrics.avg_signal_strength,
      health_status: healthStatus
    };
  }

  /**
   * Reset metrics (call periodically to avoid stale data)
   */
  resetMetrics(): void {
    this.metrics = {
      total_events: 0,
      successful_events: 0,
      failed_events: 0,
      total_latency_ms: 0,
      peak_latency_ms: 0,
      avg_signal_strength: 0,
      last_reset: new Date()
    };
  }
}

// Event Stream Manager - Main Service Class
export class EventStreamManager {
  private eventProcessor: RealTimeEventProcessor;
  private highVelocityProcessor: HighVelocityEventStreamProcessor;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient, config: any = {}) {
    this.supabase = supabase;
    this.eventProcessor = new RealTimeEventProcessor(supabase, config.event_processor);
    this.highVelocityProcessor = new HighVelocityEventStreamProcessor(supabase, config.high_velocity);
  }

  /**
   * Process single event with automatic routing
   */
  async processEvent(event: UserInteractionEvent): Promise<ProcessingResult> {
    return await this.eventProcessor.processEvent(event);
  }

  /**
   * Process event stream with load balancing
   */
  async processEventStream(events: UserInteractionEvent[]) {
    if (events.length > 100) {
      // Use high-velocity processor for large batches
      return await this.highVelocityProcessor.processEventStream(events);
    } else {
      // Use regular processor for small batches
      const results = [];
      for (const event of events) {
        const result = await this.eventProcessor.processEvent(event);
        results.push(result);
      }
      return {
        total_events_received: events.length,
        events_processed: results.filter(r => r.processed).length,
        events_sampled: events.length,
        events_dropped: 0,
        processing_efficiency: results.filter(r => r.processed).length / events.length,
        stream_health: 'healthy' as const
      };
    }
  }

  /**
   * Get comprehensive system metrics
   */
  getSystemMetrics() {
    return {
      event_processor_metrics: this.eventProcessor.getMetrics(),
      system_health: 'healthy', // Would be calculated from various components
      uptime_seconds: process.uptime(),
      memory_usage_mb: process.memoryUsage().heapUsed / 1024 / 1024
    };
  }

  /**
   * Graceful shutdown
   */
  shutdown(): void {
    this.eventProcessor.stop();
  }
}

// Convenience factory function
export function createEventStreamManager(supabase: SupabaseClient): EventStreamManager {
  return new EventStreamManager(supabase, {
    event_processor: {
      batch_size: 20,
      flush_interval_ms: 2000,
      max_processing_latency_ms: 100,
      enable_circuit_breaker: true,
      enable_performance_monitoring: true
    },
    high_velocity: {
      max_events_per_second: 1000,
      sampling_strategy: 'priority_based',
      buffer_size: 10000,
      processing_workers: 4
    }
  });
}