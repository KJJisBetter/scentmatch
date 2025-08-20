/**
 * WebSocket Real-Time Updates System
 * 
 * High-performance WebSocket implementation for pushing real-time recommendation
 * updates, preference changes, and personalized notifications to users.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';
import WebSocket from 'ws';

// Core Types and Interfaces
export interface WebSocketConnection {
  connection_id: string;
  user_id: string;
  socket: WebSocket;
  last_heartbeat: Date;
  message_queue: WebSocketMessage[];
  metadata: {
    connected_at: Date;
    user_agent: string;
    ip_address: string;
    connection_quality: 'poor' | 'good' | 'excellent';
  };
}

export interface WebSocketMessage {
  message_id: string;
  message_type: 'recommendation_update' | 'preference_sync' | 'system_notification' | 'heartbeat' | 'learning_progress';
  payload: any;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = highest priority
  created_at: Date;
  expires_at: Date;
  retry_count: number;
  max_retries: number;
}

export interface RecommendationUpdate {
  update_type: 'new_recommendations' | 'preferences_changed' | 'algorithm_optimized' | 'contextual_adaptation';
  recommendations?: any[];
  preference_changes?: {
    updated_families: string[];
    confidence_changes: Record<string, number>;
    new_patterns: string[];
  };
  optimization_details?: {
    algorithm_switched: boolean;
    old_algorithm: string;
    new_algorithm: string;
    performance_improvement: number;
  };
  context_factors?: any;
  metadata: {
    trigger_event: string;
    generated_at: Date;
    confidence: number;
    processing_time_ms: number;
  };
}

// WebSocket Connection Manager
export class WebSocketConnectionManager extends EventEmitter {
  private connections: Map<string, WebSocketConnection> = new Map();
  private supabase: SupabaseClient;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageProcessor: WebSocketMessageProcessor;
  private config: {
    heartbeat_interval_ms: number;
    max_connections_per_user: number;
    message_queue_max_size: number;
    connection_timeout_ms: number;
    enable_message_compression: boolean;
  };

  constructor(supabase: SupabaseClient, config: Partial<{
    heartbeat_interval_ms: number;
    max_connections_per_user: number;
    message_queue_max_size: number;
    connection_timeout_ms: number;
    enable_message_compression: boolean;
  }> = {}) {
    super();
    this.supabase = supabase;
    this.messageProcessor = new WebSocketMessageProcessor(supabase);
    this.config = {
      heartbeat_interval_ms: config.heartbeat_interval_ms || 30000,
      max_connections_per_user: config.max_connections_per_user || 3,
      message_queue_max_size: config.message_queue_max_size || 100,
      connection_timeout_ms: config.connection_timeout_ms || 300000, // 5 minutes
      enable_message_compression: config.enable_message_compression ?? false
    };

    this.startHeartbeatMonitoring();
  }

  /**
   * Register new WebSocket connection
   */
  async registerConnection(
    userId: string,
    socket: WebSocket,
    connectionMetadata: {
      user_agent: string;
      ip_address: string;
    }
  ): Promise<{
    connection_id: string;
    registered: boolean;
    queue_initialized: boolean;
    existing_connections_closed: number;
  }> {
    try {
      const connectionId = `ws_${userId}_${Date.now()}`;
      
      // Close existing connections if limit exceeded
      const existingConnections = this.getUserConnections(userId);
      let closedConnections = 0;
      
      if (existingConnections.length >= this.config.max_connections_per_user) {
        // Close oldest connections
        const connectionsToClose = existingConnections
          .sort((a, b) => a.metadata.connected_at.getTime() - b.metadata.connected_at.getTime())
          .slice(0, existingConnections.length - this.config.max_connections_per_user + 1);
        
        for (const conn of connectionsToClose) {
          await this.closeConnection(conn.connection_id, 'connection_limit_exceeded');
          closedConnections++;
        }
      }

      // Create connection object
      const connection: WebSocketConnection = {
        connection_id: connectionId,
        user_id: userId,
        socket: socket,
        last_heartbeat: new Date(),
        message_queue: [],
        metadata: {
          connected_at: new Date(),
          user_agent: connectionMetadata.user_agent,
          ip_address: connectionMetadata.ip_address,
          connection_quality: 'good'
        }
      };

      // Set up socket event handlers
      this.setupSocketEventHandlers(connection);

      // Store connection
      this.connections.set(connectionId, connection);

      // Store in database
      await this.supabase
        .from('websocket_connections')
        .insert({
          connection_id: connectionId,
          user_id: userId,
          connection_type: 'recommendation_updates',
          client_info: {
            user_agent: connectionMetadata.user_agent,
            ip_address: connectionMetadata.ip_address
          },
          status: 'connected'
        });

      // Load any pending messages for this user
      await this.loadPendingMessages(connectionId, userId);

      this.emit('connection_registered', { connection_id: connectionId, user_id: userId });

      return {
        connection_id: connectionId,
        registered: true,
        queue_initialized: true,
        existing_connections_closed: closedConnections
      };

    } catch (error) {
      console.error('Failed to register WebSocket connection:', error);
      return {
        connection_id: '',
        registered: false,
        queue_initialized: false,
        existing_connections_closed: 0
      };
    }
  }

  /**
   * Send real-time recommendation update to user
   */
  async sendRecommendationUpdate(
    userId: string,
    update: RecommendationUpdate,
    priority: 1 | 2 | 3 | 4 | 5 = 3
  ): Promise<{
    sent_to_connections: number;
    queued_messages: number;
    failed_deliveries: number;
    total_latency_ms: number;
  }> {
    const startTime = Date.now();
    const userConnections = this.getUserConnections(userId);
    let sentCount = 0;
    let queuedCount = 0;
    let failedCount = 0;

    const message: WebSocketMessage = {
      message_id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message_type: 'recommendation_update',
      payload: update,
      priority: priority,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 120000), // 2 minutes expiry for real-time updates
      retry_count: 0,
      max_retries: 3
    };

    // Send to all active connections
    for (const connection of userConnections) {
      try {
        if (connection.socket.readyState === WebSocket.OPEN) {
          await this.sendMessage(connection, message);
          sentCount++;
        } else {
          // Queue message if connection is not ready
          this.queueMessage(connection, message);
          queuedCount++;
        }
      } catch (error) {
        console.error(`Failed to send message to connection ${connection.connection_id}:`, error);
        failedCount++;
      }
    }

    // Store message in database for persistence
    await this.storeMessage(userId, message);

    return {
      sent_to_connections: sentCount,
      queued_messages: queuedCount,
      failed_deliveries: failedCount,
      total_latency_ms: Date.now() - startTime
    };
  }

  /**
   * Broadcast system-wide notification
   */
  async broadcastSystemNotification(
    notification: {
      notification_type: 'system_maintenance' | 'feature_update' | 'performance_improvement';
      message: string;
      metadata?: any;
    },
    targetUsers?: string[]
  ): Promise<{
    total_connections: number;
    successful_broadcasts: number;
    failed_broadcasts: number;
  }> {
    const connectionsToNotify = targetUsers 
      ? this.getConnectionsForUsers(targetUsers)
      : Array.from(this.connections.values());

    let successCount = 0;
    let failCount = 0;

    const broadcastMessage: WebSocketMessage = {
      message_id: `broadcast_${Date.now()}`,
      message_type: 'system_notification',
      payload: notification,
      priority: 2,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 300000), // 5 minutes expiry
      retry_count: 0,
      max_retries: 1 // System notifications don't need many retries
    };

    for (const connection of connectionsToNotify) {
      try {
        if (connection.socket.readyState === WebSocket.OPEN) {
          await this.sendMessage(connection, broadcastMessage);
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    return {
      total_connections: connectionsToNotify.length,
      successful_broadcasts: successCount,
      failed_broadcasts: failCount
    };
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketEventHandlers(connection: WebSocketConnection): void {
    const { socket, connection_id, user_id } = connection;

    // Handle incoming messages
    socket.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleIncomingMessage(connection, message);
      } catch (error) {
        console.error(`Error handling message from ${connection_id}:`, error);
      }
    });

    // Handle connection close
    socket.on('close', async (code: number, reason: string) => {
      await this.handleConnectionClose(connection_id, code, reason);
    });

    // Handle errors
    socket.on('error', async (error: Error) => {
      console.error(`WebSocket error for ${connection_id}:`, error);
      await this.handleConnectionError(connection_id, error);
    });

    // Handle pong (heartbeat response)
    socket.on('pong', () => {
      connection.last_heartbeat = new Date();
      this.updateConnectionHealth(connection);
    });
  }

  /**
   * Handle incoming message from client
   */
  private async handleIncomingMessage(connection: WebSocketConnection, message: any): Promise<void> {
    try {
      switch (message.type) {
        case 'heartbeat':
          connection.last_heartbeat = new Date();
          await this.sendHeartbeatResponse(connection);
          break;
          
        case 'preference_update':
          await this.handlePreferenceUpdate(connection, message.payload);
          break;
          
        case 'request_recommendations':
          await this.handleRecommendationRequest(connection, message.payload);
          break;
          
        case 'feedback':
          await this.handleRealtimeFeedback(connection, message.payload);
          break;
          
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }

      // Update connection activity
      await this.updateConnectionActivity(connection);

    } catch (error) {
      console.error('Error handling incoming message:', error);
      await this.sendErrorMessage(connection, 'message_processing_failed', error.message);
    }
  }

  /**
   * Send message to WebSocket connection
   */
  private async sendMessage(connection: WebSocketConnection, message: WebSocketMessage): Promise<void> {
    const { socket } = connection;
    
    if (socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not open');
    }

    const messagePayload = {
      message_id: message.message_id,
      type: message.message_type,
      data: message.payload,
      timestamp: message.created_at.toISOString(),
      priority: message.priority
    };

    const messageString = this.config.enable_message_compression
      ? this.compressMessage(JSON.stringify(messagePayload))
      : JSON.stringify(messagePayload);

    socket.send(messageString);

    // Update message tracking
    await this.supabase
      .from('websocket_message_queue')
      .update({
        delivery_status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('message_id', message.message_id);
  }

  /**
   * Queue message for later delivery
   */
  private queueMessage(connection: WebSocketConnection, message: WebSocketMessage): void {
    // Remove expired messages first
    connection.message_queue = connection.message_queue.filter(
      msg => msg.expires_at.getTime() > Date.now()
    );

    // Add new message if queue not full
    if (connection.message_queue.length < this.config.message_queue_max_size) {
      connection.message_queue.push(message);
      
      // Sort by priority
      connection.message_queue.sort((a, b) => a.priority - b.priority);
    } else {
      console.warn(`Message queue full for connection ${connection.connection_id}`);
    }
  }

  /**
   * Process queued messages when connection becomes available
   */
  private async processQueuedMessages(connection: WebSocketConnection): Promise<void> {
    while (connection.message_queue.length > 0 && connection.socket.readyState === WebSocket.OPEN) {
      const message = connection.message_queue.shift();
      if (message && message.expires_at.getTime() > Date.now()) {
        try {
          await this.sendMessage(connection, message);
        } catch (error) {
          console.error('Failed to send queued message:', error);
          
          // Retry if not exceeded max retries
          if (message.retry_count < message.max_retries) {
            message.retry_count++;
            connection.message_queue.unshift(message);
          }
        }
      }
    }
  }

  /**
   * Get connections for specific users
   */
  private getConnectionsForUsers(userIds: string[]): WebSocketConnection[] {
    return Array.from(this.connections.values()).filter(
      conn => userIds.includes(conn.user_id)
    );
  }

  /**
   * Get all connections for a user
   */
  private getUserConnections(userId: string): WebSocketConnection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.user_id === userId
    );
  }

  /**
   * Close connection with cleanup
   */
  private async closeConnection(connectionId: string, reason: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      // Close WebSocket if still open
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.close(1000, reason);
      }

      // Update database
      await this.supabase
        .from('websocket_connections')
        .update({
          status: 'disconnected',
          disconnected_at: new Date().toISOString()
        })
        .eq('connection_id', connectionId);

      // Remove from active connections
      this.connections.delete(connectionId);

      this.emit('connection_closed', { connection_id: connectionId, reason });

    } catch (error) {
      console.error(`Error closing connection ${connectionId}:`, error);
    }
  }

  /**
   * Handle connection close event
   */
  private async handleConnectionClose(connectionId: string, code: number, reason: string): Promise<void> {
    await this.closeConnection(connectionId, `Client closed: ${code} ${reason}`);
  }

  /**
   * Handle connection error
   */
  private async handleConnectionError(connectionId: string, error: Error): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Update connection quality based on error
    connection.metadata.connection_quality = 'poor';

    // Close connection if too many errors
    await this.closeConnection(connectionId, `Error: ${error.message}`);
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
    }, this.config.heartbeat_interval_ms);
  }

  /**
   * Check connection heartbeats and clean up stale connections
   */
  private async checkHeartbeats(): Promise<void> {
    const now = Date.now();
    const staleConnections = [];

    for (const [connectionId, connection] of this.connections.entries()) {
      const timeSinceHeartbeat = now - connection.last_heartbeat.getTime();
      
      if (timeSinceHeartbeat > this.config.connection_timeout_ms) {
        staleConnections.push(connectionId);
      } else if (timeSinceHeartbeat > this.config.heartbeat_interval_ms * 2) {
        // Send ping to check if connection is alive
        try {
          if (connection.socket.readyState === WebSocket.OPEN) {
            connection.socket.ping();
          }
        } catch (error) {
          staleConnections.push(connectionId);
        }
      }
    }

    // Close stale connections
    for (const connectionId of staleConnections) {
      await this.closeConnection(connectionId, 'heartbeat_timeout');
    }
  }

  /**
   * Load pending messages from database
   */
  private async loadPendingMessages(connectionId: string, userId: string): Promise<void> {
    try {
      const { data: pendingMessages, error } = await this.supabase
        .from('websocket_message_queue')
        .select('*')
        .eq('user_id', userId)
        .eq('delivery_status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('priority', { ascending: true })
        .limit(this.config.message_queue_max_size);

      if (error) {
        console.error('Failed to load pending messages:', error);
        return;
      }

      const connection = this.connections.get(connectionId);
      if (!connection) return;

      // Convert database messages to queue format
      for (const dbMessage of pendingMessages || []) {
        const queueMessage: WebSocketMessage = {
          message_id: dbMessage.id,
          message_type: dbMessage.message_type,
          payload: dbMessage.message_payload,
          priority: dbMessage.priority,
          created_at: new Date(dbMessage.created_at),
          expires_at: new Date(dbMessage.expires_at),
          retry_count: dbMessage.retry_count || 0,
          max_retries: dbMessage.max_retries || 3
        };

        connection.message_queue.push(queueMessage);
      }

      // Process queued messages
      await this.processQueuedMessages(connection);

    } catch (error) {
      console.error('Failed to load pending messages:', error);
    }
  }

  /**
   * Store message in database for persistence
   */
  private async storeMessage(userId: string, message: WebSocketMessage): Promise<void> {
    try {
      await this.supabase
        .from('websocket_message_queue')
        .insert({
          user_id: userId,
          message_type: message.message_type,
          message_payload: message.payload,
          priority: message.priority,
          delivery_status: 'pending',
          expires_at: message.expires_at.toISOString()
        });
    } catch (error) {
      console.error('Failed to store message in database:', error);
    }
  }

  /**
   * Handle preference update from client
   */
  private async handlePreferenceUpdate(connection: WebSocketConnection, payload: any): Promise<void> {
    // Process client-initiated preference update
    this.emit('client_preference_update', {
      user_id: connection.user_id,
      preferences: payload,
      connection_id: connection.connection_id
    });
  }

  /**
   * Handle recommendation request from client
   */
  private async handleRecommendationRequest(connection: WebSocketConnection, payload: any): Promise<void> {
    this.emit('recommendation_request', {
      user_id: connection.user_id,
      request_params: payload,
      connection_id: connection.connection_id
    });
  }

  /**
   * Handle real-time feedback from client
   */
  private async handleRealtimeFeedback(connection: WebSocketConnection, payload: any): Promise<void> {
    this.emit('realtime_feedback', {
      user_id: connection.user_id,
      feedback: payload,
      connection_id: connection.connection_id
    });
  }

  /**
   * Send heartbeat response
   */
  private async sendHeartbeatResponse(connection: WebSocketConnection): Promise<void> {
    const heartbeatMessage: WebSocketMessage = {
      message_id: `heartbeat_${Date.now()}`,
      message_type: 'heartbeat',
      payload: { timestamp: new Date().toISOString(), status: 'alive' },
      priority: 5, // Lowest priority
      created_at: new Date(),
      expires_at: new Date(Date.now() + 10000), // 10 seconds expiry
      retry_count: 0,
      max_retries: 0
    };

    await this.sendMessage(connection, heartbeatMessage);
  }

  /**
   * Send error message to client
   */
  private async sendErrorMessage(connection: WebSocketConnection, errorType: string, errorMessage: string): Promise<void> {
    const errorMsg: WebSocketMessage = {
      message_id: `error_${Date.now()}`,
      message_type: 'system_notification',
      payload: {
        error_type: errorType,
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      priority: 1, // High priority for errors
      created_at: new Date(),
      expires_at: new Date(Date.now() + 30000),
      retry_count: 0,
      max_retries: 2
    };

    await this.sendMessage(connection, errorMsg);
  }

  /**
   * Update connection activity metrics
   */
  private async updateConnectionActivity(connection: WebSocketConnection): Promise<void> {
    await this.supabase
      .from('websocket_connections')
      .update({
        last_message_at: new Date().toISOString(),
        messages_received: this.supabase.sql`messages_received + 1`
      })
      .eq('connection_id', connection.connection_id);
  }

  /**
   * Update connection health based on performance
   */
  private updateConnectionHealth(connection: WebSocketConnection): void {
    const timeSinceLastHeartbeat = Date.now() - connection.last_heartbeat.getTime();
    
    if (timeSinceLastHeartbeat < 10000) {
      connection.metadata.connection_quality = 'excellent';
    } else if (timeSinceLastHeartbeat < 30000) {
      connection.metadata.connection_quality = 'good';
    } else {
      connection.metadata.connection_quality = 'poor';
    }
  }

  /**
   * Compress message for efficient transmission
   */
  private compressMessage(message: string): string {
    // Simplified compression - in production would use proper compression
    return message.replace(/\s+/g, ' ').trim();
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    total_connections: number;
    connections_by_quality: Record<string, number>;
    avg_queue_size: number;
    total_queued_messages: number;
  } {
    const connections = Array.from(this.connections.values());
    
    const qualityDistribution = connections.reduce((acc, conn) => {
      acc[conn.metadata.connection_quality] = (acc[conn.metadata.connection_quality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalQueuedMessages = connections.reduce((sum, conn) => sum + conn.message_queue.length, 0);
    const avgQueueSize = connections.length > 0 ? totalQueuedMessages / connections.length : 0;

    return {
      total_connections: connections.length,
      connections_by_quality: qualityDistribution,
      avg_queue_size: avgQueueSize,
      total_queued_messages: totalQueuedMessages
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    // Stop heartbeat monitoring
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all connections gracefully
    const closePromises = Array.from(this.connections.keys()).map(
      connectionId => this.closeConnection(connectionId, 'server_shutdown')
    );

    await Promise.allSettled(closePromises);
  }
}

// WebSocket Message Processor
class WebSocketMessageProcessor {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Process message for delivery tracking
   */
  async processMessage(message: WebSocketMessage, delivery_status: string): Promise<void> {
    await this.supabase
      .from('websocket_message_queue')
      .update({
        delivery_status,
        delivered_at: delivery_status === 'delivered' ? new Date().toISOString() : null,
        delivery_latency_ms: delivery_status === 'delivered' 
          ? Date.now() - message.created_at.getTime()
          : null
      })
      .eq('message_id', message.message_id);
  }
}

// Real-Time Recommendation Notifier
export class RealTimeRecommendationNotifier extends EventEmitter {
  private connectionManager: WebSocketConnectionManager;
  private supabase: SupabaseClient;
  private notificationQueue: Map<string, RecommendationUpdate[]> = new Map();

  constructor(supabase: SupabaseClient, connectionManager: WebSocketConnectionManager) {
    super();
    this.supabase = supabase;
    this.connectionManager = connectionManager;
    
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Notify user of preference changes and new recommendations
   */
  async notifyPreferenceChange(
    userId: string,
    preferenceChange: {
      changed_families: string[];
      confidence_changes: Record<string, number>;
      trigger_event: string;
      new_recommendations?: any[];
    }
  ): Promise<{
    notification_sent: boolean;
    delivery_metrics: any;
  }> {
    const update: RecommendationUpdate = {
      update_type: 'preferences_changed',
      preference_changes: {
        updated_families: preferenceChange.changed_families,
        confidence_changes: preferenceChange.confidence_changes,
        new_patterns: []
      },
      recommendations: preferenceChange.new_recommendations,
      metadata: {
        trigger_event: preferenceChange.trigger_event,
        generated_at: new Date(),
        confidence: 0.8,
        processing_time_ms: 0
      }
    };

    const deliveryResult = await this.connectionManager.sendRecommendationUpdate(userId, update, 2);

    return {
      notification_sent: deliveryResult.sent_to_connections > 0,
      delivery_metrics: deliveryResult
    };
  }

  /**
   * Notify user of algorithm optimization
   */
  async notifyAlgorithmOptimization(
    userId: string,
    optimization: {
      old_algorithm: string;
      new_algorithm: string;
      performance_improvement: number;
      confidence: number;
    }
  ): Promise<void> {
    const update: RecommendationUpdate = {
      update_type: 'algorithm_optimized',
      optimization_details: {
        algorithm_switched: true,
        old_algorithm: optimization.old_algorithm,
        new_algorithm: optimization.new_algorithm,
        performance_improvement: optimization.performance_improvement
      },
      metadata: {
        trigger_event: 'thompson_sampling_optimization',
        generated_at: new Date(),
        confidence: optimization.confidence,
        processing_time_ms: 0
      }
    };

    await this.connectionManager.sendRecommendationUpdate(userId, update, 3);
  }

  /**
   * Notify user of contextual adaptation
   */
  async notifyContextualAdaptation(
    userId: string,
    adaptation: {
      context_factors: any;
      adaptations_applied: string[];
      new_recommendations: any[];
    }
  ): Promise<void> {
    const update: RecommendationUpdate = {
      update_type: 'contextual_adaptation',
      recommendations: adaptation.new_recommendations,
      context_factors: adaptation.context_factors,
      metadata: {
        trigger_event: 'contextual_bandit_adaptation',
        generated_at: new Date(),
        confidence: 0.75,
        processing_time_ms: 0
      }
    };

    await this.connectionManager.sendRecommendationUpdate(userId, update, 2);
  }

  /**
   * Setup event listeners for automatic notifications
   */
  private setupEventListeners(): void {
    // Listen for preference changes from other systems
    this.connectionManager.on('client_preference_update', async (event) => {
      await this.notifyPreferenceChange(event.user_id, {
        changed_families: event.preferences.changed_families || [],
        confidence_changes: event.preferences.confidence_changes || {},
        trigger_event: 'client_initiated_update'
      });
    });

    // Listen for recommendation requests
    this.connectionManager.on('recommendation_request', async (event) => {
      // Would trigger recommendation generation and send via WebSocket
      this.emit('generate_recommendations', event);
    });

    // Listen for real-time feedback
    this.connectionManager.on('realtime_feedback', async (event) => {
      // Would process feedback and send updated recommendations
      this.emit('process_feedback', event);
    });
  }
}

// WebSocket Server Factory
export class WebSocketServer {
  private server: WebSocket.Server | null = null;
  private connectionManager: WebSocketConnectionManager;
  private notifier: RealTimeRecommendationNotifier;

  constructor(
    private supabase: SupabaseClient,
    private port: number = 8080
  ) {
    this.connectionManager = new WebSocketConnectionManager(supabase);
    this.notifier = new RealTimeRecommendationNotifier(supabase, this.connectionManager);
  }

  /**
   * Start WebSocket server
   */
  async start(): Promise<{
    server_started: boolean;
    port: number;
    ready_for_connections: boolean;
  }> {
    try {
      this.server = new WebSocket.Server({ port: this.port });

      this.server.on('connection', async (socket: WebSocket, request: any) => {
        await this.handleNewConnection(socket, request);
      });

      this.server.on('error', (error: Error) => {
        console.error('WebSocket server error:', error);
      });

      return {
        server_started: true,
        port: this.port,
        ready_for_connections: true
      };

    } catch (error) {
      console.error('Failed to start WebSocket server:', error);
      return {
        server_started: false,
        port: this.port,
        ready_for_connections: false
      };
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleNewConnection(socket: WebSocket, request: any): Promise<void> {
    try {
      // Extract user info from request (would normally use JWT auth)
      const userId = this.extractUserIdFromRequest(request);
      const userAgent = request.headers['user-agent'] || '';
      const ipAddress = request.connection.remoteAddress || '';

      if (!userId) {
        socket.close(1008, 'Authentication required');
        return;
      }

      // Register connection
      await this.connectionManager.registerConnection(userId, socket, {
        user_agent: userAgent,
        ip_address: ipAddress
      });

    } catch (error) {
      console.error('Error handling new connection:', error);
      socket.close(1011, 'Internal server error');
    }
  }

  /**
   * Extract user ID from WebSocket request
   */
  private extractUserIdFromRequest(request: any): string | null {
    // In production, would validate JWT token from query params or headers
    const url = new URL(request.url, 'ws://localhost');
    return url.searchParams.get('user_id');
  }

  /**
   * Stop WebSocket server
   */
  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      await this.connectionManager.shutdown();
    }
  }

  /**
   * Get server statistics
   */
  getServerStats(): any {
    return {
      server_running: this.server !== null,
      connection_stats: this.connectionManager.getConnectionStats(),
      port: this.port
    };
  }
}

// Factory function for easy initialization
export function createRealTimeWebSocketSystem(supabase: SupabaseClient, port?: number): {
  server: WebSocketServer;
  connectionManager: WebSocketConnectionManager;
  notifier: RealTimeRecommendationNotifier;
} {
  const connectionManager = new WebSocketConnectionManager(supabase);
  const notifier = new RealTimeRecommendationNotifier(supabase, connectionManager);
  const server = new WebSocketServer(supabase, port);

  return {
    server,
    connectionManager,
    notifier
  };
}