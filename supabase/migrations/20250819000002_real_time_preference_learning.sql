-- REAL-TIME PREFERENCE LEARNING SYSTEM FOR SCENTMATCH
-- Date: 2025-08-19
-- Purpose: Add real-time event processing, streaming updates, and contextual preference learning

-- ============================================================================
-- STEP 1: ENHANCE USER INTERACTION EVENTS FOR REAL-TIME PROCESSING
-- ============================================================================

-- Add real-time processing columns to existing user_interactions table
ALTER TABLE user_interactions 
ADD COLUMN IF NOT EXISTS event_stream_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'processed', 'failed')),
ADD COLUMN IF NOT EXISTS priority_score FLOAT DEFAULT 0.5 CHECK (priority_score >= 0 AND priority_score <= 1),
ADD COLUMN IF NOT EXISTS processing_latency_ms INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preference_signal_strength FLOAT DEFAULT 0.0 CHECK (preference_signal_strength >= 0 AND preference_signal_strength <= 1),
ADD COLUMN IF NOT EXISTS real_time_processed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS batch_processed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS event_source VARCHAR(50) DEFAULT 'web' CHECK (event_source IN ('web', 'mobile', 'api', 'background')),
ADD COLUMN IF NOT EXISTS device_context JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interaction_quality FLOAT DEFAULT 0.5 CHECK (interaction_quality >= 0 AND interaction_quality <= 1);

-- Indexes for real-time event processing
CREATE INDEX IF NOT EXISTS user_interactions_stream_processing_idx 
ON user_interactions(processing_status, priority_score DESC, created_at ASC)
WHERE processing_status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS user_interactions_real_time_idx 
ON user_interactions(user_id, created_at DESC, processing_status)
WHERE real_time_processed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_interactions_event_stream_idx 
ON user_interactions(event_stream_id);

CREATE INDEX IF NOT EXISTS user_interactions_priority_idx 
ON user_interactions(priority_score DESC, created_at)
WHERE processing_status = 'pending';

-- ============================================================================
-- STEP 2: CREATE REAL-TIME EVENT QUEUE SYSTEM
-- ============================================================================

-- Real-time event processing queue with priority handling
CREATE TABLE IF NOT EXISTS real_time_event_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('interaction', 'preference_update', 'embedding_refresh', 'recommendation_request', 'feedback_processing')),
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Processing control
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 1 = highest priority
  processing_status VARCHAR(20) DEFAULT 'queued' CHECK (processing_status IN ('queued', 'processing', 'completed', 'failed', 'retrying')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Performance tracking
  processing_node VARCHAR(100), -- Which server/worker is processing
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ DEFAULT NULL,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  processing_duration_ms INTEGER DEFAULT NULL,
  
  -- Real-time constraints
  deadline TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 seconds'), -- Must be processed within 30 seconds
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'), -- Expires after 5 minutes
  
  -- Error handling
  error_message TEXT DEFAULT NULL,
  error_context JSONB DEFAULT '{}'
);

-- Indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS real_time_queue_processing_idx 
ON real_time_event_queue(processing_status, priority, queued_at)
WHERE processing_status IN ('queued', 'retrying');

CREATE INDEX IF NOT EXISTS real_time_queue_user_idx 
ON real_time_event_queue(user_id, event_type, queued_at DESC);

CREATE INDEX IF NOT EXISTS real_time_queue_deadline_idx 
ON real_time_event_queue(deadline)
WHERE processing_status IN ('queued', 'processing');

CREATE INDEX IF NOT EXISTS real_time_queue_expires_idx 
ON real_time_event_queue(expires_at)
WHERE processing_status != 'completed';

-- ============================================================================
-- STEP 3: CREATE REAL-TIME PREFERENCE TRACKING
-- ============================================================================

-- Real-time user preference state with versioning
CREATE TABLE IF NOT EXISTS user_preference_realtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Preference vectors at different time scales
  immediate_preferences JSONB DEFAULT '{}', -- Last 1 hour
  short_term_preferences JSONB DEFAULT '{}', -- Last 24 hours
  medium_term_preferences JSONB DEFAULT '{}', -- Last 7 days
  long_term_preferences JSONB DEFAULT '{}', -- Last 30 days
  
  -- Real-time metrics
  preference_volatility FLOAT DEFAULT 0.0 CHECK (preference_volatility >= 0 AND preference_volatility <= 1),
  learning_velocity FLOAT DEFAULT 0.0 CHECK (learning_velocity >= 0 AND learning_velocity <= 1),
  context_adaptation_score FLOAT DEFAULT 0.5 CHECK (context_adaptation_score >= 0 AND context_adaptation_score <= 1),
  
  -- Temporal tracking
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  last_preference_update_at TIMESTAMPTZ DEFAULT NOW(),
  last_embedding_sync_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Model versioning
  preference_model_version INTEGER DEFAULT 1,
  embedding_version INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- Indexes for real-time preference queries
CREATE INDEX IF NOT EXISTS user_preference_realtime_user_idx ON user_preference_realtime(user_id);
CREATE INDEX IF NOT EXISTS user_preference_realtime_updated_idx ON user_preference_realtime(updated_at DESC);
CREATE INDEX IF NOT EXISTS user_preference_realtime_interaction_idx ON user_preference_realtime(last_interaction_at DESC);

-- ============================================================================
-- STEP 4: CREATE CONTEXTUAL LEARNING TABLES
-- ============================================================================

-- Contextual patterns for adaptive learning
CREATE TABLE IF NOT EXISTS contextual_preference_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Context definition
  context_hash VARCHAR(64) NOT NULL,
  context_factors JSONB NOT NULL DEFAULT '{}',
  
  -- Learned preferences for this context
  learned_preferences JSONB NOT NULL DEFAULT '{}',
  preference_strength FLOAT DEFAULT 0.5 CHECK (preference_strength >= 0 AND preference_strength <= 1),
  confidence_level FLOAT DEFAULT 0.5 CHECK (confidence_level >= 0 AND confidence_level <= 1),
  
  -- Learning metrics
  interaction_count INTEGER DEFAULT 0,
  positive_feedback_count INTEGER DEFAULT 0,
  negative_feedback_count INTEGER DEFAULT 0,
  last_reinforcement_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Temporal decay
  decay_factor FLOAT DEFAULT 1.0 CHECK (decay_factor >= 0 AND decay_factor <= 1),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one pattern per user-context combination
  UNIQUE(user_id, context_hash)
);

-- Indexes for contextual pattern queries
CREATE INDEX IF NOT EXISTS contextual_patterns_user_context_idx ON contextual_preference_patterns(user_id, context_hash);
CREATE INDEX IF NOT EXISTS contextual_patterns_strength_idx ON contextual_preference_patterns(preference_strength DESC, confidence_level DESC);
CREATE INDEX IF NOT EXISTS contextual_patterns_accessed_idx ON contextual_preference_patterns(last_accessed_at DESC);

-- ============================================================================
-- STEP 5: CREATE WEBSOCKET CONNECTION TRACKING
-- ============================================================================

-- WebSocket connections for real-time updates
CREATE TABLE IF NOT EXISTS websocket_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id VARCHAR(100) NOT NULL UNIQUE,
  
  -- Connection metadata
  connection_type VARCHAR(50) DEFAULT 'recommendation_updates' CHECK (connection_type IN ('recommendation_updates', 'preference_sync', 'real_time_notifications')),
  client_info JSONB DEFAULT '{}', -- User agent, device type, etc.
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error', 'expired')),
  last_heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Message tracking
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  queue_size INTEGER DEFAULT 0,
  
  -- Performance metrics
  avg_message_latency_ms INTEGER DEFAULT NULL,
  connection_quality FLOAT DEFAULT 1.0 CHECK (connection_quality >= 0 AND connection_quality <= 1),
  
  -- Lifecycle
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ DEFAULT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Indexes for WebSocket management
CREATE INDEX IF NOT EXISTS websocket_connections_user_idx ON websocket_connections(user_id);
CREATE INDEX IF NOT EXISTS websocket_connections_status_idx ON websocket_connections(status, last_heartbeat_at DESC);
CREATE INDEX IF NOT EXISTS websocket_connections_expires_idx ON websocket_connections(expires_at) WHERE status = 'connected';

-- Message queue for WebSocket delivery
CREATE TABLE IF NOT EXISTS websocket_message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id VARCHAR(100) REFERENCES websocket_connections(connection_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message content
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('recommendation_update', 'preference_sync', 'system_notification', 'heartbeat')),
  message_payload JSONB NOT NULL DEFAULT '{}',
  
  -- Delivery control
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'expired')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ DEFAULT NULL,
  delivered_at TIMESTAMPTZ DEFAULT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- Indexes for message queue processing
CREATE INDEX IF NOT EXISTS websocket_message_queue_delivery_idx 
ON websocket_message_queue(delivery_status, priority, created_at)
WHERE delivery_status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS websocket_message_queue_connection_idx 
ON websocket_message_queue(connection_id, created_at DESC);

-- ============================================================================
-- STEP 6: CREATE REAL-TIME PROCESSING FUNCTIONS
-- ============================================================================

-- Function to process real-time interaction event
CREATE OR REPLACE FUNCTION process_real_time_interaction(
  target_user_id UUID,
  fragrance_id_param TEXT,
  event_type_param VARCHAR(50),
  event_value_param FLOAT DEFAULT NULL,
  context_data JSONB DEFAULT '{}',
  device_context_param JSONB DEFAULT '{}'
)
RETURNS TABLE (
  event_id UUID,
  processing_latency_ms INTEGER,
  preference_signal_strength FLOAT,
  immediate_learning_applied BOOLEAN,
  downstream_triggers JSONB
) AS $$
DECLARE
  start_time TIMESTAMPTZ := clock_timestamp();
  event_record_id UUID;
  signal_strength FLOAT := 0.0;
  learning_applied BOOLEAN := FALSE;
  triggers JSONB := '[]'::JSONB;
  processing_time INTEGER;
BEGIN
  -- Insert interaction event with real-time metadata
  INSERT INTO user_interactions (
    user_id,
    fragrance_id,
    interaction_type,
    interaction_value,
    interaction_context,
    device_context,
    processing_status,
    priority_score,
    event_source,
    created_at
  ) VALUES (
    target_user_id,
    fragrance_id_param,
    event_type_param,
    event_value_param,
    context_data,
    device_context_param,
    'processing',
    CASE event_type_param
      WHEN 'purchase_intent' THEN 1.0
      WHEN 'rating' THEN 0.8
      WHEN 'favorite' THEN 0.7
      WHEN 'click' THEN 0.4
      WHEN 'view' THEN 0.2
      ELSE 0.3
    END,
    'real_time',
    start_time
  ) RETURNING id INTO event_record_id;

  -- Calculate preference signal strength
  signal_strength := CASE event_type_param
    WHEN 'purchase_intent' THEN 0.95
    WHEN 'rating' THEN LEAST(1.0, COALESCE(event_value_param, 3.0) / 5.0)
    WHEN 'favorite' THEN 0.8
    WHEN 'click' THEN 0.6
    WHEN 'view' THEN LEAST(0.4, COALESCE(event_value_param, 10.0) / 60.0) -- Based on view duration
    ELSE 0.1
  END;

  -- Apply immediate learning if signal is strong enough
  IF signal_strength > 0.5 THEN
    learning_applied := TRUE;
    
    -- Update real-time preferences
    INSERT INTO user_preference_realtime (
      user_id,
      immediate_preferences,
      last_interaction_at,
      last_preference_update_at,
      preference_volatility,
      learning_velocity
    ) VALUES (
      target_user_id,
      jsonb_build_object(
        'latest_interaction', jsonb_build_object(
          'fragrance_id', fragrance_id_param,
          'event_type', event_type_param,
          'signal_strength', signal_strength,
          'timestamp', start_time
        )
      ),
      start_time,
      start_time,
      0.1, -- Initial volatility
      signal_strength
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      immediate_preferences = user_preference_realtime.immediate_preferences || EXCLUDED.immediate_preferences,
      last_interaction_at = EXCLUDED.last_interaction_at,
      last_preference_update_at = EXCLUDED.last_preference_update_at,
      learning_velocity = (user_preference_realtime.learning_velocity * 0.9) + (EXCLUDED.learning_velocity * 0.1),
      updated_at = start_time;
    
    -- Trigger downstream systems
    triggers := jsonb_build_array(
      'cache_invalidation',
      'recommendation_refresh',
      'embedding_update_scheduled'
    );
  END IF;

  -- Calculate processing time
  processing_time := EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000;

  -- Update processing status
  UPDATE user_interactions
  SET 
    processing_status = 'processed',
    preference_signal_strength = signal_strength,
    processing_latency_ms = processing_time,
    real_time_processed_at = clock_timestamp()
  WHERE id = event_record_id;

  -- Return processing results
  RETURN QUERY SELECT 
    event_record_id,
    processing_time,
    signal_strength,
    learning_applied,
    triggers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next high-priority events for processing
CREATE OR REPLACE FUNCTION get_next_real_time_events(
  batch_size INTEGER DEFAULT 10,
  max_age_seconds INTEGER DEFAULT 30
)
RETURNS TABLE (
  event_id UUID,
  user_id UUID,
  event_type VARCHAR(50),
  priority_score FLOAT,
  age_seconds INTEGER,
  context_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  UPDATE user_interactions
  SET processing_status = 'processing'
  WHERE id IN (
    SELECT ui.id
    FROM user_interactions ui
    WHERE ui.processing_status = 'pending'
      AND ui.created_at > NOW() - (max_age_seconds || ' seconds')::INTERVAL
    ORDER BY ui.priority_score DESC, ui.created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    id,
    user_interactions.user_id,
    interaction_type,
    priority_score,
    EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER,
    interaction_context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: CREATE CONTEXTUAL PREFERENCE LEARNING FUNCTIONS
-- ============================================================================

-- Function to update contextual preference patterns
CREATE OR REPLACE FUNCTION update_contextual_preferences(
  target_user_id UUID,
  context_factors JSONB,
  preference_updates JSONB,
  feedback_strength FLOAT
)
RETURNS TABLE (
  pattern_id UUID,
  context_hash VARCHAR(64),
  preference_strength_change FLOAT,
  confidence_change FLOAT
) AS $$
DECLARE
  context_hash_value VARCHAR(64);
  current_strength FLOAT;
  current_confidence FLOAT;
  new_strength FLOAT;
  new_confidence FLOAT;
  pattern_record_id UUID;
BEGIN
  -- Generate context hash
  context_hash_value := encode(
    digest(context_factors::TEXT, 'sha256'), 'hex'
  )::VARCHAR(64);
  
  -- Get current pattern strength and confidence
  SELECT preference_strength, confidence_level, id
  INTO current_strength, current_confidence, pattern_record_id
  FROM contextual_preference_patterns
  WHERE user_id = target_user_id AND context_hash = context_hash_value;
  
  -- Initialize if pattern doesn't exist
  IF pattern_record_id IS NULL THEN
    current_strength := 0.5;
    current_confidence := 0.1;
    
    INSERT INTO contextual_preference_patterns (
      user_id,
      context_hash,
      context_factors,
      learned_preferences,
      preference_strength,
      confidence_level,
      interaction_count
    ) VALUES (
      target_user_id,
      context_hash_value,
      context_factors,
      preference_updates,
      current_strength,
      current_confidence,
      1
    ) RETURNING id INTO pattern_record_id;
  END IF;
  
  -- Calculate new strength and confidence
  new_strength := current_strength + (feedback_strength * 0.1); -- Learning rate of 0.1
  new_strength := GREATEST(0.0, LEAST(1.0, new_strength)); -- Clamp to [0,1]
  
  new_confidence := current_confidence + (ABS(feedback_strength) * 0.05); -- Confidence grows with interaction
  new_confidence := GREATEST(0.0, LEAST(1.0, new_confidence));
  
  -- Update contextual pattern
  UPDATE contextual_preference_patterns
  SET 
    learned_preferences = learned_preferences || preference_updates,
    preference_strength = new_strength,
    confidence_level = new_confidence,
    interaction_count = interaction_count + 1,
    last_reinforcement_at = NOW(),
    last_accessed_at = NOW(),
    updated_at = NOW()
  WHERE id = pattern_record_id;
  
  RETURN QUERY SELECT 
    pattern_record_id,
    context_hash_value,
    new_strength - current_strength,
    new_confidence - current_confidence;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: CREATE REAL-TIME NOTIFICATION SYSTEM
-- ============================================================================

-- WebSocket notification queue for real-time updates
CREATE TABLE IF NOT EXISTS real_time_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id VARCHAR(100) REFERENCES websocket_connections(connection_id) ON DELETE CASCADE,
  
  -- Notification content
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('recommendation_update', 'preference_sync', 'system_alert', 'learning_progress')),
  notification_payload JSONB NOT NULL DEFAULT '{}',
  
  -- Delivery tracking
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'expired')),
  delivery_attempts INTEGER DEFAULT 0,
  max_delivery_attempts INTEGER DEFAULT 3,
  
  -- Performance tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ DEFAULT NULL,
  delivered_at TIMESTAMPTZ DEFAULT NULL,
  delivery_latency_ms INTEGER DEFAULT NULL,
  
  -- Expiration
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 minutes') -- Real-time notifications expire quickly
);

-- Indexes for notification delivery
CREATE INDEX IF NOT EXISTS real_time_notifications_delivery_idx 
ON real_time_notifications(delivery_status, priority, created_at)
WHERE delivery_status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS real_time_notifications_connection_idx 
ON real_time_notifications(connection_id, created_at DESC);

CREATE INDEX IF NOT EXISTS real_time_notifications_expires_idx 
ON real_time_notifications(expires_at)
WHERE delivery_status != 'delivered';

-- ============================================================================
-- STEP 9: CREATE PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- Real-time system performance view
CREATE OR REPLACE VIEW real_time_system_performance AS
SELECT 
  -- Event processing metrics
  COUNT(*) FILTER (WHERE processing_status = 'pending') as pending_events,
  COUNT(*) FILTER (WHERE processing_status = 'processing') as processing_events,
  COUNT(*) FILTER (WHERE processing_status = 'processed' AND real_time_processed_at > NOW() - INTERVAL '1 hour') as processed_last_hour,
  COUNT(*) FILTER (WHERE processing_status = 'failed') as failed_events,
  
  -- Performance metrics
  AVG(processing_latency_ms) FILTER (WHERE processing_latency_ms IS NOT NULL AND real_time_processed_at > NOW() - INTERVAL '1 hour') as avg_processing_latency_ms,
  MAX(processing_latency_ms) FILTER (WHERE processing_latency_ms IS NOT NULL AND real_time_processed_at > NOW() - INTERVAL '1 hour') as max_processing_latency_ms,
  AVG(preference_signal_strength) FILTER (WHERE real_time_processed_at > NOW() - INTERVAL '1 hour') as avg_signal_strength,
  
  -- System health indicators
  CASE 
    WHEN COUNT(*) FILTER (WHERE processing_status = 'pending') > 1000 THEN 'overloaded'
    WHEN COUNT(*) FILTER (WHERE processing_status = 'failed') > 100 THEN 'degraded'
    WHEN AVG(processing_latency_ms) FILTER (WHERE processing_latency_ms IS NOT NULL AND real_time_processed_at > NOW() - INTERVAL '1 hour') > 200 THEN 'slow'
    ELSE 'healthy'
  END as system_health_status
  
FROM user_interactions
WHERE created_at > NOW() - INTERVAL '24 hours';

-- WebSocket connection health view
CREATE OR REPLACE VIEW websocket_system_health AS
SELECT 
  -- Connection metrics
  COUNT(*) FILTER (WHERE status = 'connected') as active_connections,
  COUNT(*) FILTER (WHERE last_heartbeat_at < NOW() - INTERVAL '1 minute') as stale_connections,
  COUNT(*) FILTER (WHERE status = 'error') as error_connections,
  
  -- Message delivery metrics
  AVG(avg_message_latency_ms) FILTER (WHERE avg_message_latency_ms IS NOT NULL) as system_avg_latency_ms,
  SUM(messages_sent) as total_messages_sent_24h,
  SUM(queue_size) as total_queue_size,
  
  -- System health
  CASE 
    WHEN COUNT(*) FILTER (WHERE status = 'connected') = 0 THEN 'no_connections'
    WHEN COUNT(*) FILTER (WHERE status = 'error') > COUNT(*) * 0.1 THEN 'high_error_rate'
    WHEN AVG(avg_message_latency_ms) > 1000 THEN 'high_latency'
    ELSE 'healthy'
  END as websocket_health_status
  
FROM websocket_connections
WHERE connected_at > NOW() - INTERVAL '24 hours';

-- ============================================================================
-- STEP 10: CREATE AUTOMATED TRIGGERS AND MAINTENANCE
-- ============================================================================

-- Trigger for automatic real-time processing
CREATE OR REPLACE FUNCTION trigger_real_time_processing()
RETURNS TRIGGER AS $$
BEGIN
  -- Add to real-time processing queue for high-priority events
  IF NEW.priority_score > 0.7 THEN
    INSERT INTO real_time_event_queue (
      user_id,
      event_type,
      event_data,
      priority,
      deadline
    ) VALUES (
      NEW.user_id,
      'interaction',
      jsonb_build_object(
        'interaction_id', NEW.id,
        'fragrance_id', NEW.fragrance_id,
        'interaction_type', NEW.interaction_type,
        'interaction_value', NEW.interaction_value,
        'context', NEW.interaction_context
      ),
      CASE 
        WHEN NEW.priority_score > 0.9 THEN 1 -- Highest priority
        WHEN NEW.priority_score > 0.7 THEN 2 -- High priority
        ELSE 3 -- Medium priority
      END,
      NOW() + INTERVAL '10 seconds' -- Must be processed within 10 seconds
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user interactions
CREATE TRIGGER user_interactions_real_time_trigger
  AFTER INSERT ON user_interactions
  FOR EACH ROW EXECUTE FUNCTION trigger_real_time_processing();

-- Function to clean up expired real-time data
CREATE OR REPLACE FUNCTION cleanup_real_time_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Clean expired event queue items
  DELETE FROM real_time_event_queue WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean expired WebSocket messages
  DELETE FROM websocket_message_queue WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean disconnected WebSocket connections
  DELETE FROM websocket_connections 
  WHERE status = 'disconnected' AND disconnected_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean old real-time notifications
  DELETE FROM real_time_notifications WHERE expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Apply temporal decay to contextual patterns
  UPDATE contextual_preference_patterns
  SET 
    decay_factor = decay_factor * 0.99,
    preference_strength = preference_strength * decay_factor
  WHERE last_accessed_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 11: CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE user_preference_realtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE contextual_preference_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE websocket_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE websocket_message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_event_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_notifications ENABLE ROW LEVEL SECURITY;

-- Real-time preferences policies
CREATE POLICY "Users can access their own real-time preferences" ON user_preference_realtime
  FOR ALL USING (auth.uid() = user_id);

-- Contextual patterns policies
CREATE POLICY "Users can access their own contextual patterns" ON contextual_preference_patterns
  FOR ALL USING (auth.uid() = user_id);

-- WebSocket connections policies
CREATE POLICY "Users can manage their own WebSocket connections" ON websocket_connections
  FOR ALL USING (auth.uid() = user_id);

-- WebSocket messages policies
CREATE POLICY "Users can access their own WebSocket messages" ON websocket_message_queue
  FOR ALL USING (auth.uid() = user_id);

-- Real-time queue policies (system access only)
CREATE POLICY "Only system can access real-time event queue" ON real_time_event_queue
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

-- Real-time notifications policies
CREATE POLICY "Users can view their own notifications" ON real_time_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 12: CREATE SCHEDULED MAINTENANCE
-- ============================================================================

-- Schedule real-time data cleanup every 10 minutes
SELECT cron.schedule(
  'real-time-data-cleanup',
  '*/10 * * * *', -- Every 10 minutes
  'SELECT cleanup_real_time_data();'
);

-- ============================================================================
-- STEP 13: GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions for real-time processing
GRANT SELECT, INSERT, UPDATE ON user_preference_realtime TO authenticated;
GRANT SELECT, INSERT, UPDATE ON contextual_preference_patterns TO authenticated;
GRANT SELECT, INSERT, UPDATE ON websocket_connections TO authenticated;
GRANT SELECT, INSERT ON websocket_message_queue TO authenticated;
GRANT SELECT ON real_time_notifications TO authenticated;

-- Grant access to views
GRANT SELECT ON real_time_system_performance TO authenticated;
GRANT SELECT ON websocket_system_health TO service_role;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION process_real_time_interaction TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_real_time_events TO service_role;
GRANT EXECUTE ON FUNCTION update_contextual_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_real_time_data TO service_role;

-- ============================================================================
-- STEP 14: ANALYZE TABLES FOR OPTIMIZATION
-- ============================================================================

ANALYZE user_interactions;
ANALYZE user_preference_realtime;
ANALYZE contextual_preference_patterns;
ANALYZE websocket_connections;
ANALYZE websocket_message_queue;
ANALYZE real_time_event_queue;
ANALYZE real_time_notifications;

-- ============================================================================
-- STEP 15: LOG MIGRATION COMPLETION
-- ============================================================================

INSERT INTO ai_processing_queue (task_type, task_data, priority)
VALUES (
  'migration_complete',
  json_build_object(
    'migration', '20250819000002_real_time_preference_learning',
    'completion_time', NOW(),
    'tables_enhanced', ARRAY[
      'user_interactions',
      'user_preference_realtime',
      'contextual_preference_patterns',
      'websocket_connections',
      'websocket_message_queue',
      'real_time_event_queue',
      'real_time_notifications'
    ],
    'functions_created', ARRAY[
      'process_real_time_interaction',
      'get_next_real_time_events',
      'update_contextual_preferences',
      'cleanup_real_time_data'
    ],
    'views_created', ARRAY[
      'real_time_system_performance',
      'websocket_system_health'
    ],
    'features_enabled', ARRAY[
      'real_time_event_processing',
      'contextual_preference_learning',
      'websocket_real_time_updates',
      'priority_based_processing',
      'automatic_preference_adaptation'
    ]
  ),
  10
);