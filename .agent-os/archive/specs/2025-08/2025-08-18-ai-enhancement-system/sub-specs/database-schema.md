# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-18-ai-enhancement-system/spec.md

## Core Schema Changes

### Fragrance Embeddings Table Enhancement

```sql
-- Add embedding column to existing fragrances table
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS embedding VECTOR(2048),
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(50) DEFAULT 'voyage-3-large',
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS embedding_version INTEGER DEFAULT 1;

-- Create vector similarity index for fast search
CREATE INDEX IF NOT EXISTS fragrances_embedding_idx 
ON fragrances USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Add trigger for automatic embedding generation
CREATE OR REPLACE FUNCTION trigger_embedding_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if content changed or embedding missing
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (
       OLD.name IS DISTINCT FROM NEW.name OR 
       OLD.brand IS DISTINCT FROM NEW.brand OR 
       OLD.description IS DISTINCT FROM NEW.description OR
       OLD.notes IS DISTINCT FROM NEW.notes OR
       NEW.embedding IS NULL
     )) THEN
    
    -- Call Edge Function for async embedding generation
    PERFORM net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/generate-embedding',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || 
                 current_setting('app.jwt_token', true) || '"}',
      body := json_build_object(
        'fragrance_id', NEW.id,
        'content', json_build_object(
          'name', NEW.name,
          'brand', NEW.brand,
          'description', NEW.description,
          'notes', NEW.notes
        )
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS fragrances_embedding_trigger ON fragrances;
CREATE TRIGGER fragrances_embedding_trigger
  AFTER INSERT OR UPDATE ON fragrances
  FOR EACH ROW EXECUTE FUNCTION trigger_embedding_generation();
```

### User Preference Model

```sql
-- User embeddings and preference data
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_embedding VECTOR(2048),
  embedding_model VARCHAR(50) DEFAULT 'voyage-3-large',
  preference_strength FLOAT DEFAULT 0.5,
  last_updated TIMESTAMP DEFAULT NOW(),
  interaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for user preference lookups
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);

-- User interaction tracking
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance_id UUID REFERENCES fragrances(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- 'view', 'rating', 'favorite', 'search', 'purchase_intent'
  interaction_value FLOAT, -- rating value, time spent, etc.
  interaction_context JSONB, -- additional context like search query, page, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for interaction analysis
CREATE INDEX IF NOT EXISTS user_interactions_user_id_idx ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS user_interactions_fragrance_id_idx ON user_interactions(fragrance_id);
CREATE INDEX IF NOT EXISTS user_interactions_type_idx ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS user_interactions_created_at_idx ON user_interactions(created_at);
```

### AI Processing Queue

```sql
-- Queue for AI processing tasks
CREATE TABLE IF NOT EXISTS ai_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type VARCHAR(50) NOT NULL, -- 'embedding_generation', 'user_model_update', 'batch_processing'
  task_data JSONB NOT NULL,
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes for queue processing
CREATE INDEX IF NOT EXISTS ai_queue_status_priority_idx ON ai_processing_queue(status, priority, created_at);
CREATE INDEX IF NOT EXISTS ai_queue_task_type_idx ON ai_processing_queue(task_type);
```

### Collection Analysis Cache

```sql
-- Cache for collection analysis results
CREATE TABLE IF NOT EXISTS collection_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL, -- 'scent_family', 'seasonal', 'gaps', 'insights'
  analysis_data JSONB NOT NULL,
  confidence_score FLOAT,
  cache_expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, analysis_type)
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS collection_analysis_user_type_idx ON collection_analysis_cache(user_id, analysis_type);
CREATE INDEX IF NOT EXISTS collection_analysis_expires_idx ON collection_analysis_cache(cache_expires_at);
```

### Recommendation Cache

```sql
-- Cache for generated recommendations
CREATE TABLE IF NOT EXISTS recommendation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL, -- 'personalized', 'trending', 'seasonal', 'adventurous'
  recommendations JSONB NOT NULL, -- Array of recommendation objects
  context_hash VARCHAR(64), -- Hash of user state when generated
  confidence_score FLOAT,
  cache_expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for recommendation lookups
CREATE INDEX IF NOT EXISTS recommendation_cache_user_type_idx ON recommendation_cache(user_id, recommendation_type);
CREATE INDEX IF NOT EXISTS recommendation_cache_expires_idx ON recommendation_cache(cache_expires_at);
CREATE INDEX IF NOT EXISTS recommendation_cache_context_idx ON recommendation_cache(context_hash);
```

## Database Functions

### Vector Similarity Functions

```sql
-- Function to find similar fragrances using vector search
CREATE OR REPLACE FUNCTION find_similar_fragrances(
  query_embedding VECTOR(2048),
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 20,
  exclude_ids UUID[] DEFAULT '{}'
)
RETURNS TABLE (
  fragrance_id UUID,
  similarity FLOAT,
  name TEXT,
  brand TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    (f.embedding <=> query_embedding) * -1 + 1 AS similarity,
    f.name,
    f.brand,
    f.description
  FROM fragrances f
  WHERE f.embedding IS NOT NULL
    AND f.id != ALL(exclude_ids)
    AND (f.embedding <=> query_embedding) * -1 + 1 >= similarity_threshold
  ORDER BY f.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
```

### User Preference Functions

```sql
-- Function to update user embedding based on interactions
CREATE OR REPLACE FUNCTION update_user_embedding(
  target_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  user_collection RECORD;
  weighted_embedding VECTOR(2048);
  total_weight FLOAT := 0;
  interaction_weight FLOAT;
BEGIN
  -- Initialize weighted embedding
  weighted_embedding := ARRAY_FILL(0, ARRAY[2048])::VECTOR(2048);
  
  -- Calculate weighted average from user's collection and interactions
  FOR user_collection IN
    SELECT 
      f.embedding,
      COALESCE(uc.rating, 3) as rating,
      COALESCE(ui.interaction_count, 1) as interaction_count,
      COALESCE(uc.usage_frequency, 'occasional') as usage_frequency
    FROM user_collections uc
    JOIN fragrances f ON f.id = uc.fragrance_id
    LEFT JOIN (
      SELECT 
        fragrance_id,
        COUNT(*) as interaction_count
      FROM user_interactions 
      WHERE user_id = target_user_id 
        AND created_at > NOW() - INTERVAL '90 days'
      GROUP BY fragrance_id
    ) ui ON ui.fragrance_id = uc.fragrance_id
    WHERE uc.user_id = target_user_id
      AND f.embedding IS NOT NULL
  LOOP
    -- Calculate interaction weight
    interaction_weight := (user_collection.rating / 5.0) * 
                         (user_collection.interaction_count / 10.0) * 
                         CASE user_collection.usage_frequency
                           WHEN 'daily' THEN 1.0
                           WHEN 'weekly' THEN 0.8
                           WHEN 'occasional' THEN 0.5
                           WHEN 'special' THEN 0.3
                           ELSE 0.5
                         END;
    
    -- Add to weighted sum
    weighted_embedding := weighted_embedding + (user_collection.embedding * interaction_weight);
    total_weight := total_weight + interaction_weight;
  END LOOP;
  
  -- Normalize if we have interactions
  IF total_weight > 0 THEN
    weighted_embedding := weighted_embedding / total_weight;
    
    -- Update or insert user preferences
    INSERT INTO user_preferences (user_id, user_embedding, last_updated, interaction_count)
    VALUES (target_user_id, weighted_embedding, NOW(), total_weight::INTEGER)
    ON CONFLICT (user_id)
    DO UPDATE SET
      user_embedding = EXCLUDED.user_embedding,
      last_updated = EXCLUDED.last_updated,
      interaction_count = EXCLUDED.interaction_count;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

## Performance Optimizations

### Vector Index Configuration

```sql
-- Optimize vector index for production workload
ALTER INDEX fragrances_embedding_idx SET (lists = 1000);

-- Additional indexes for hybrid queries
CREATE INDEX IF NOT EXISTS fragrances_scent_family_embedding_idx 
ON fragrances(scent_family) 
WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS fragrances_brand_embedding_idx 
ON fragrances(brand) 
WHERE embedding IS NOT NULL;
```

### Cleanup Functions

```sql
-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Clean recommendation cache
  DELETE FROM recommendation_cache WHERE cache_expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean collection analysis cache
  DELETE FROM collection_analysis_cache WHERE cache_expires_at < NOW();
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  -- Clean old interactions (keep 1 year)
  DELETE FROM user_interactions WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Clean failed AI processing tasks (keep 7 days)
  DELETE FROM ai_processing_queue 
  WHERE status = 'failed' 
    AND created_at < NOW() - INTERVAL '7 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run daily
SELECT cron.schedule('cleanup-expired-cache', '0 2 * * *', 'SELECT cleanup_expired_cache();');
```

## Migration Script

```sql
-- Migration: Add AI enhancement system
-- Date: 2025-08-18
-- Description: Add vector embeddings, user preferences, and AI processing infrastructure

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- Apply all schema changes
-- (Include all CREATE TABLE and ALTER TABLE statements from above)

-- Insert initial data or configurations if needed
INSERT INTO ai_processing_queue (task_type, task_data, priority) 
VALUES ('batch_embedding_regeneration', '{"description": "Regenerate all embeddings after database cleanup"}', 1);

COMMIT;
```

## Row Level Security (RLS) Policies

```sql
-- User preferences security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- User interactions security
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own interactions" ON user_interactions
  FOR ALL USING (auth.uid() = user_id);

-- Collection analysis cache security
ALTER TABLE collection_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own analysis cache" ON collection_analysis_cache
  FOR ALL USING (auth.uid() = user_id);

-- Recommendation cache security
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own recommendation cache" ON recommendation_cache
  FOR ALL USING (auth.uid() = user_id);
```