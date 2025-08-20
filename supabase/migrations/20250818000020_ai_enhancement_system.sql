-- AI ENHANCEMENT SYSTEM FOR SCENTMATCH
-- Date: 2025-08-18
-- Purpose: Add comprehensive AI capabilities with vector embeddings, automated processing, and intelligent recommendations

-- ============================================================================
-- STEP 1: ENABLE REQUIRED EXTENSIONS
-- ============================================================================

-- Enable pgvector for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable HTTP for external API calls from database functions
CREATE EXTENSION IF NOT EXISTS http;

-- Enable pg_cron for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: ENHANCE FRAGRANCES TABLE WITH AI CAPABILITIES
-- ============================================================================

-- Add AI-related columns to existing fragrances table
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS embedding VECTOR(2048),
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(50) DEFAULT 'voyage-3-large',
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS embedding_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS ai_description TEXT, -- AI-generated description
ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64); -- Hash of content for change detection

-- Create vector similarity index for fast search
CREATE INDEX IF NOT EXISTS fragrances_embedding_idx 
ON fragrances USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 1000);

-- Additional indexes for AI queries
CREATE INDEX IF NOT EXISTS fragrances_embedding_model_idx ON fragrances(embedding_model);
CREATE INDEX IF NOT EXISTS fragrances_embedding_generated_at_idx ON fragrances(embedding_generated_at);

-- ============================================================================
-- STEP 3: CREATE USER PREFERENCES AND AI TRACKING TABLES
-- ============================================================================

-- User embeddings and preference data
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_embedding VECTOR(2048),
  embedding_model VARCHAR(50) DEFAULT 'voyage-3-large',
  preference_strength FLOAT DEFAULT 0.5 CHECK (preference_strength >= 0 AND preference_strength <= 1),
  last_updated TIMESTAMP DEFAULT NOW(),
  interaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for user preference lookups
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS user_preferences_last_updated_idx ON user_preferences(last_updated);

-- User interaction tracking for preference learning
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance_id TEXT REFERENCES fragrances(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'rating', 'favorite', 'search', 'purchase_intent', 'collection_add', 'collection_remove')),
  interaction_value FLOAT, -- rating value, time spent, search relevance, etc.
  interaction_context JSONB DEFAULT '{}', -- search query, page, referrer, etc.
  session_id VARCHAR(100), -- Browser session for grouping interactions
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for interaction analysis
CREATE INDEX IF NOT EXISTS user_interactions_user_id_idx ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS user_interactions_fragrance_id_idx ON user_interactions(fragrance_id);
CREATE INDEX IF NOT EXISTS user_interactions_type_idx ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS user_interactions_created_at_idx ON user_interactions(created_at);
CREATE INDEX IF NOT EXISTS user_interactions_session_idx ON user_interactions(session_id);

-- ============================================================================
-- STEP 4: CREATE AI PROCESSING INFRASTRUCTURE
-- ============================================================================

-- Queue for AI processing tasks (embedding generation, user model updates, etc.)
CREATE TABLE IF NOT EXISTS ai_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('embedding_generation', 'user_model_update', 'batch_processing', 'cache_refresh', 'preference_analysis')),
  task_data JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 1 (highest) to 10 (lowest)
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  processing_node VARCHAR(100), -- Which server/function is processing
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours') -- Tasks expire after 24 hours
);

-- Indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS ai_queue_status_priority_idx ON ai_processing_queue(status, priority, created_at);
CREATE INDEX IF NOT EXISTS ai_queue_task_type_idx ON ai_processing_queue(task_type);
CREATE INDEX IF NOT EXISTS ai_queue_expires_at_idx ON ai_processing_queue(expires_at);
CREATE INDEX IF NOT EXISTS ai_queue_processing_node_idx ON ai_processing_queue(processing_node);

-- ============================================================================
-- STEP 5: CREATE CACHE TABLES FOR AI FEATURES
-- ============================================================================

-- Cache for collection analysis results
CREATE TABLE IF NOT EXISTS collection_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('scent_family', 'seasonal', 'gaps', 'insights', 'personality', 'optimization')),
  analysis_data JSONB NOT NULL DEFAULT '{}',
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  data_version INTEGER DEFAULT 1, -- For invalidating cache when algorithms change
  cache_expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, analysis_type)
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS collection_analysis_user_type_idx ON collection_analysis_cache(user_id, analysis_type);
CREATE INDEX IF NOT EXISTS collection_analysis_expires_idx ON collection_analysis_cache(cache_expires_at);

-- Cache for generated recommendations
CREATE TABLE IF NOT EXISTS recommendation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('personalized', 'trending', 'seasonal', 'adventurous', 'similar', 'gap_filling')),
  recommendations JSONB NOT NULL DEFAULT '[]', -- Array of recommendation objects
  context_hash VARCHAR(64), -- Hash of user state when generated (for cache invalidation)
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  generation_metadata JSONB DEFAULT '{}', -- Algorithm version, model used, etc.
  cache_expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for recommendation lookups
CREATE INDEX IF NOT EXISTS recommendation_cache_user_type_idx ON recommendation_cache(user_id, recommendation_type);
CREATE INDEX IF NOT EXISTS recommendation_cache_expires_idx ON recommendation_cache(cache_expires_at);
CREATE INDEX IF NOT EXISTS recommendation_cache_context_idx ON recommendation_cache(context_hash);

-- ============================================================================
-- STEP 6: CREATE AI DATABASE FUNCTIONS
-- ============================================================================

-- Function to find similar fragrances using vector search
CREATE OR REPLACE FUNCTION find_similar_fragrances(
  query_embedding VECTOR(2048),
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 20,
  exclude_ids TEXT[] DEFAULT '{}'
)
RETURNS TABLE (
  fragrance_id TEXT,
  similarity FLOAT,
  name TEXT,
  brand TEXT,
  description TEXT,
  scent_family TEXT,
  rating_value FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    (1 - (f.embedding <=> query_embedding)) AS similarity,
    f.name,
    f.brand_name,
    f.description,
    f.scent_family,
    f.rating_value
  FROM fragrances f
  WHERE f.embedding IS NOT NULL
    AND f.id != ALL(exclude_ids)
    AND (1 - (f.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY f.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user embedding based on interactions and collection
CREATE OR REPLACE FUNCTION update_user_embedding(
  target_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  user_collection RECORD;
  weighted_embedding VECTOR(2048);
  total_weight FLOAT := 0;
  interaction_weight FLOAT;
  collection_count INTEGER := 0;
BEGIN
  -- Initialize weighted embedding to zero vector
  weighted_embedding := ARRAY_FILL(0, ARRAY[2048])::VECTOR(2048);
  
  -- Calculate weighted average from user's collection and interactions
  FOR user_collection IN
    SELECT 
      f.embedding,
      COALESCE(uc.rating, 3.0) as rating,
      COALESCE(ui.interaction_count, 1) as interaction_count,
      COALESCE(uc.usage_frequency, 'occasional') as usage_frequency,
      -- Apply temporal decay for older interactions
      CASE 
        WHEN uc.created_at > NOW() - INTERVAL '30 days' THEN 1.0
        WHEN uc.created_at > NOW() - INTERVAL '90 days' THEN 0.8
        WHEN uc.created_at > NOW() - INTERVAL '180 days' THEN 0.6
        ELSE 0.4
      END as temporal_weight
    FROM user_collections uc
    JOIN fragrances f ON f.id = uc.fragrance_id
    LEFT JOIN (
      SELECT 
        fragrance_id,
        COUNT(*) as interaction_count,
        AVG(interaction_value) as avg_interaction_value
      FROM user_interactions 
      WHERE user_id = target_user_id 
        AND created_at > NOW() - INTERVAL '180 days'
        AND interaction_type IN ('view', 'rating', 'favorite')
      GROUP BY fragrance_id
    ) ui ON ui.fragrance_id = uc.fragrance_id
    WHERE uc.user_id = target_user_id
      AND f.embedding IS NOT NULL
  LOOP
    collection_count := collection_count + 1;
    
    -- Calculate interaction weight based on multiple factors
    interaction_weight := 
      -- Base rating weight (0.2 to 1.0)
      GREATEST(0.2, user_collection.rating / 5.0) * 
      -- Interaction frequency weight (0.5 to 1.0)
      GREATEST(0.5, LEAST(1.0, user_collection.interaction_count / 10.0)) * 
      -- Usage frequency weight
      CASE user_collection.usage_frequency
        WHEN 'daily' THEN 1.0
        WHEN 'weekly' THEN 0.9
        WHEN 'monthly' THEN 0.7
        WHEN 'occasional' THEN 0.5
        WHEN 'special' THEN 0.3
        ELSE 0.5
      END *
      -- Temporal decay weight
      user_collection.temporal_weight;
    
    -- Add to weighted sum
    weighted_embedding := weighted_embedding + (user_collection.embedding * interaction_weight);
    total_weight := total_weight + interaction_weight;
  END LOOP;
  
  -- Only proceed if we have collection data
  IF total_weight > 0 AND collection_count > 0 THEN
    -- Normalize weighted embedding
    weighted_embedding := weighted_embedding / total_weight;
    
    -- Calculate preference strength based on data quality
    DECLARE
      preference_strength FLOAT := LEAST(1.0, 
        (collection_count / 20.0) * 0.7 + -- More items = higher confidence
        (total_weight / collection_count) * 0.3 -- Higher weights = higher confidence
      );
    BEGIN
      -- Update or insert user preferences
      INSERT INTO user_preferences (
        user_id, 
        user_embedding, 
        embedding_model,
        preference_strength,
        last_updated, 
        interaction_count
      )
      VALUES (
        target_user_id, 
        weighted_embedding, 
        'voyage-3-large',
        preference_strength,
        NOW(), 
        collection_count
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        user_embedding = EXCLUDED.user_embedding,
        preference_strength = EXCLUDED.preference_strength,
        last_updated = EXCLUDED.last_updated,
        interaction_count = EXCLUDED.interaction_count;
    END;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired cache and old data
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Clean expired recommendation cache
  DELETE FROM recommendation_cache WHERE cache_expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean expired collection analysis cache
  DELETE FROM collection_analysis_cache WHERE cache_expires_at < NOW();
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean old user interactions (keep 1 year)
  DELETE FROM user_interactions WHERE created_at < NOW() - INTERVAL '1 year';
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean expired/failed AI processing tasks
  DELETE FROM ai_processing_queue 
  WHERE (status = 'failed' AND created_at < NOW() - INTERVAL '7 days')
     OR (status = 'completed' AND created_at < NOW() - INTERVAL '3 days')
     OR (expires_at < NOW());
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Log cleanup activity
  INSERT INTO ai_processing_queue (task_type, task_data, priority)
  VALUES ('cache_cleanup', json_build_object('deleted_records', deleted_count, 'cleanup_time', NOW()), 8);
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate content hash for change detection
CREATE OR REPLACE FUNCTION generate_content_hash(
  fragrance_name TEXT,
  brand_name TEXT,
  description TEXT DEFAULT '',
  notes TEXT[] DEFAULT '{}'
)
RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(
    digest(
      COALESCE(fragrance_name, '') || '|' ||
      COALESCE(brand_name, '') || '|' ||
      COALESCE(description, '') || '|' ||
      COALESCE(array_to_string(notes, ','), ''),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 7: CREATE AUTOMATIC EMBEDDING GENERATION TRIGGER
-- ============================================================================

-- Function to trigger embedding generation via HTTP webhook
CREATE OR REPLACE FUNCTION trigger_embedding_generation()
RETURNS TRIGGER AS $$
DECLARE
  new_content_hash VARCHAR(64);
  webhook_url TEXT;
  webhook_response TEXT;
BEGIN
  -- Calculate content hash for the new/updated fragrance
  new_content_hash := generate_content_hash(
    NEW.name,
    NEW.brand_name,
    NEW.description,
    NEW.notes
  );
  
  -- Only trigger if content changed or embedding missing
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (
       OLD.content_hash IS DISTINCT FROM new_content_hash OR
       NEW.embedding IS NULL
     )) THEN
    
    -- Update content hash
    NEW.content_hash := new_content_hash;
    
    -- Add to AI processing queue for async processing
    INSERT INTO ai_processing_queue (
      task_type, 
      task_data, 
      priority,
      expires_at
    ) VALUES (
      'embedding_generation',
      json_build_object(
        'fragrance_id', NEW.id,
        'content', json_build_object(
          'name', NEW.name,
          'brand', NEW.brand_name,
          'description', COALESCE(NEW.description, ''),
          'notes', COALESCE(NEW.notes, '{}'),
          'scent_family', COALESCE(NEW.scent_family, ''),
          'accords', COALESCE(NEW.accords, '{}')
        ),
        'content_hash', new_content_hash,
        'priority_reason', CASE 
          WHEN TG_OP = 'INSERT' THEN 'new_fragrance'
          ELSE 'content_updated'
        END
      ),
      CASE 
        WHEN TG_OP = 'INSERT' THEN 3 -- Higher priority for new fragrances
        ELSE 5 -- Normal priority for updates
      END,
      NOW() + INTERVAL '6 hours' -- Task expires in 6 hours
    );
    
    -- Log trigger execution (for debugging)
    IF current_setting('app.debug_ai_triggers', true) = 'true' THEN
      RAISE NOTICE 'Embedding generation queued for fragrance: % (operation: %)', NEW.id, TG_OP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS fragrances_embedding_trigger ON fragrances;
CREATE TRIGGER fragrances_embedding_trigger
  BEFORE INSERT OR UPDATE ON fragrances
  FOR EACH ROW EXECUTE FUNCTION trigger_embedding_generation();

-- ============================================================================
-- STEP 8: CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on AI tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_queue ENABLE ROW LEVEL SECURITY;

-- User preferences policies
CREATE POLICY "Users can only access their own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- User interactions policies  
CREATE POLICY "Users can only access their own interactions" ON user_interactions
  FOR ALL USING (auth.uid() = user_id);

-- Collection analysis cache policies
CREATE POLICY "Users can only access their own analysis cache" ON collection_analysis_cache
  FOR ALL USING (auth.uid() = user_id);

-- Recommendation cache policies
CREATE POLICY "Users can only access their own recommendation cache" ON recommendation_cache
  FOR ALL USING (auth.uid() = user_id);

-- AI processing queue policies (admin/system access only)
CREATE POLICY "Only system can access AI processing queue" ON ai_processing_queue
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

-- ============================================================================
-- STEP 9: CREATE SCHEDULED JOBS
-- ============================================================================

-- Schedule cache cleanup to run every 6 hours
SELECT cron.schedule(
  'ai-cache-cleanup',
  '0 */6 * * *', -- Every 6 hours
  'SELECT cleanup_expired_cache();'
);

-- Schedule user preference model updates to run daily at 2 AM
SELECT cron.schedule(
  'daily-preference-updates',
  '0 2 * * *', -- Daily at 2 AM
  $$
  INSERT INTO ai_processing_queue (task_type, task_data, priority)
  SELECT 
    'user_model_update',
    json_build_object('user_id', user_id, 'reason', 'scheduled_update'),
    7
  FROM user_preferences 
  WHERE last_updated < NOW() - INTERVAL '7 days'
  LIMIT 100; -- Process 100 users per day
  $$
);

-- ============================================================================
-- STEP 10: INSERT INITIAL AI PROCESSING TASKS
-- ============================================================================

-- Queue embedding regeneration for all existing fragrances without embeddings
INSERT INTO ai_processing_queue (task_type, task_data, priority)
SELECT 
  'embedding_generation',
  json_build_object(
    'fragrance_id', id,
    'content', json_build_object(
      'name', name,
      'brand', brand_name,
      'description', COALESCE(description, ''),
      'notes', COALESCE(notes, '{}'),
      'scent_family', COALESCE(scent_family, ''),
      'accords', COALESCE(accords, '{}')
    ),
    'priority_reason', 'initial_migration'
  ),
  6 -- Medium priority for initial migration
FROM fragrances 
WHERE embedding IS NULL
ON CONFLICT DO NOTHING; -- Avoid duplicates if migration runs multiple times

-- Add batch processing task for the full regeneration
INSERT INTO ai_processing_queue (task_type, task_data, priority) 
VALUES (
  'batch_processing', 
  json_build_object(
    'operation', 'regenerate_all_embeddings',
    'description', 'Regenerate all fragrance embeddings after database cleanup',
    'batch_size', 100,
    'target_model', 'voyage-3-large'
  ), 
  1 -- Highest priority
);

-- ============================================================================
-- STEP 11: CREATE HELPER VIEWS FOR AI OPERATIONS
-- ============================================================================

-- View for fragrance vectors with metadata
CREATE OR REPLACE VIEW fragrance_vectors AS
SELECT 
  id,
  name,
  brand_name,
  embedding,
  embedding_model,
  embedding_generated_at,
  embedding_version,
  CASE 
    WHEN embedding IS NULL THEN 'missing'
    WHEN embedding_generated_at < NOW() - INTERVAL '30 days' THEN 'stale'
    ELSE 'current'
  END as embedding_status,
  content_hash
FROM fragrances
WHERE embedding IS NOT NULL;

-- View for AI system health monitoring
CREATE OR REPLACE VIEW ai_system_health AS
SELECT 
  'embedding_coverage' as metric,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL)::FLOAT / COUNT(*)::FLOAT as value,
  'percentage' as unit
FROM fragrances
UNION ALL
SELECT 
  'pending_tasks' as metric,
  COUNT(*)::FLOAT as value,
  'count' as unit
FROM ai_processing_queue
WHERE status = 'pending'
UNION ALL
SELECT 
  'failed_tasks_last_24h' as metric,
  COUNT(*)::FLOAT as value,
  'count' as unit
FROM ai_processing_queue
WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'user_preferences_count' as metric,
  COUNT(*)::FLOAT as value,
  'count' as unit
FROM user_preferences;

-- ============================================================================
-- STEP 12: GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions for the web app
GRANT SELECT, INSERT, UPDATE ON user_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_preferences TO authenticated;  
GRANT SELECT, INSERT, UPDATE ON collection_analysis_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE ON recommendation_cache TO authenticated;

-- Grant read access to system views
GRANT SELECT ON fragrance_vectors TO authenticated;
GRANT SELECT ON ai_system_health TO service_role;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION find_similar_fragrances TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_embedding TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache TO service_role;
GRANT EXECUTE ON FUNCTION generate_content_hash TO authenticated;

-- ============================================================================
-- STEP 13: FINAL VALIDATION AND LOGGING
-- ============================================================================

-- Log migration completion
INSERT INTO ai_processing_queue (task_type, task_data, priority)
VALUES (
  'migration_complete',
  json_build_object(
    'migration', '20250818000020_ai_enhancement_system',
    'completion_time', NOW(),
    'tables_created', ARRAY[
      'user_preferences',
      'user_interactions', 
      'ai_processing_queue',
      'collection_analysis_cache',
      'recommendation_cache'
    ],
    'functions_created', ARRAY[
      'find_similar_fragrances',
      'update_user_embedding',
      'cleanup_expired_cache',
      'generate_content_hash',
      'trigger_embedding_generation'
    ],
    'indexes_created', ARRAY[
      'fragrances_embedding_idx',
      'user_preferences_user_id_idx',
      'user_interactions_user_id_idx',
      'ai_queue_status_priority_idx'
    ]
  ),
  10
);

-- Analyze tables for query planning optimization
ANALYZE fragrances;
ANALYZE user_preferences;
ANALYZE user_interactions;
ANALYZE ai_processing_queue;
ANALYZE collection_analysis_cache;
ANALYZE recommendation_cache;