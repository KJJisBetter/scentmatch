-- Migration: Security Fixes and Schema Foundation
-- Created: 2025-08-15
-- Purpose: Fix critical security issues and create foundation for collections/recommendations

-- =============================================================================
-- CRITICAL SECURITY FIXES (Priority 1)
-- =============================================================================

-- 1. Move extensions out of public schema for security
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move vector extension to dedicated schema
-- Note: This requires superuser privileges - document for manual execution
-- ALTER EXTENSION vector SET SCHEMA extensions;
-- ALTER EXTENSION pg_trgm SET SCHEMA extensions;  
-- ALTER EXTENSION unaccent SET SCHEMA extensions;

-- For now, document the security issue
COMMENT ON EXTENSION vector IS 'SECURITY: Should be moved to extensions schema';
COMMENT ON EXTENSION pg_trgm IS 'SECURITY: Should be moved to extensions schema';
COMMENT ON EXTENSION unaccent IS 'SECURITY: Should be moved to extensions schema';

-- 2. Enable RLS on existing tables (CRITICAL SECURITY FIX)
ALTER TABLE fragrances ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragrance_brands ENABLE ROW LEVEL SECURITY;

-- Create public read policies for fragrance data (authenticated users only)
CREATE POLICY "Authenticated users can read fragrances" ON fragrances
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read fragrance brands" ON fragrance_brands  
  FOR SELECT TO authenticated USING (true);

-- Restrict write access to service role only
CREATE POLICY "Only service role can modify fragrances" ON fragrances
  FOR ALL TO service_role USING (true);

CREATE POLICY "Only service role can modify fragrance brands" ON fragrance_brands
  FOR ALL TO service_role USING (true);

-- =============================================================================
-- NEW TABLES FOR COLLECTIONS AND RECOMMENDATIONS
-- =============================================================================

-- 3. Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preference_type TEXT NOT NULL CHECK (preference_type IN (
    'scent_family', 'intensity', 'longevity', 'occasion', 'season', 'mood', 'price_range'
  )),
  preference_value TEXT NOT NULL,
  preference_strength DECIMAL(3,2) DEFAULT 0.5 CHECK (preference_strength >= 0 AND preference_strength <= 1),
  learned_from TEXT CHECK (learned_from IN (
    'quiz', 'collection_analysis', 'rating', 'feedback', 'interaction'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, preference_type, preference_value)
);

-- Enable RLS and create policies for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 4. Create user_fragrance_interactions table  
CREATE TABLE IF NOT EXISTS user_fragrance_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fragrance_id TEXT REFERENCES fragrances(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'view', 'like', 'dislike', 'sample_request', 'add_to_collection', 
    'remove_from_collection', 'rating', 'review', 'share'
  )),
  interaction_context TEXT CHECK (interaction_context IN (
    'recommendation', 'search', 'similar', 'browse', 'collection', 'wishlist', 'trending'
  )),
  interaction_metadata JSONB, -- Additional context like rating value, review text, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS and create policies for user_fragrance_interactions
ALTER TABLE user_fragrance_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interactions" ON user_fragrance_interactions
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 5. Create fragrance_embeddings table for multiple embedding versions
CREATE TABLE IF NOT EXISTS fragrance_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fragrance_id TEXT REFERENCES fragrances(id) ON DELETE CASCADE NOT NULL,
  embedding_version TEXT NOT NULL DEFAULT 'voyage-3.5',
  embedding VECTOR(1024), -- Default to Voyage AI dimensions
  embedding_source TEXT NOT NULL CHECK (embedding_source IN (
    'notes', 'description', 'reviews', 'combined', 'accords'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(fragrance_id, embedding_version, embedding_source)
);

-- Enable RLS for fragrance_embeddings (public read for similarity search)
ALTER TABLE fragrance_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read fragrance embeddings" ON fragrance_embeddings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only service role can modify fragrance embeddings" ON fragrance_embeddings
  FOR ALL TO service_role USING (true);

-- =============================================================================
-- ENHANCE EXISTING TABLES
-- =============================================================================

-- 6. Add new columns to fragrances table for enhanced metadata
ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS
  intensity_score INTEGER CHECK (intensity_score >= 1 AND intensity_score <= 10);

ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS
  longevity_hours INTEGER CHECK (longevity_hours >= 1 AND longevity_hours <= 24);

ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS
  sillage_rating INTEGER CHECK (sillage_rating >= 1 AND sillage_rating <= 10);

ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS
  recommended_occasions TEXT[];

ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS  
  recommended_seasons TEXT[];

ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS
  mood_tags TEXT[];

ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS
  sample_available BOOLEAN DEFAULT true;

ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS
  sample_price_usd DECIMAL(5,2);

ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS
  travel_size_available BOOLEAN DEFAULT false;

ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS
  travel_size_ml INTEGER;

ALTER TABLE fragrances ADD COLUMN IF NOT EXISTS
  travel_size_price_usd DECIMAL(6,2);

-- 7. Enhance user_collections table if needed (reconcile with existing schema)
-- Check current schema and add missing columns
DO $$
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_collections' AND column_name = 'status'
  ) THEN
    ALTER TABLE user_collections ADD COLUMN status TEXT DEFAULT 'owned' 
    CHECK (status IN ('owned', 'wishlist', 'tried', 'selling'));
  END IF;

  -- Add purchase metadata if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_collections' AND column_name = 'purchase_date'
  ) THEN
    ALTER TABLE user_collections ADD COLUMN purchase_date DATE;
    ALTER TABLE user_collections ADD COLUMN purchase_price DECIMAL(10,2);
    ALTER TABLE user_collections ADD COLUMN size_ml INTEGER;
  END IF;

  -- Add usage patterns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_collections' AND column_name = 'usage_frequency'
  ) THEN
    ALTER TABLE user_collections ADD COLUMN usage_frequency TEXT 
    CHECK (usage_frequency IN ('daily', 'weekly', 'occasional', 'special'));
    ALTER TABLE user_collections ADD COLUMN personal_notes TEXT;
    ALTER TABLE user_collections ADD COLUMN occasions TEXT[];
    ALTER TABLE user_collections ADD COLUMN seasons TEXT[];
  END IF;
END $$;

-- =============================================================================
-- PERFORMANCE INDEXES  
-- =============================================================================

-- 8. Create indexes for optimal performance

-- Vector similarity search indexes
CREATE INDEX IF NOT EXISTS fragrance_embeddings_vector_cosine_idx 
ON fragrance_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Alternative index for different similarity metrics
CREATE INDEX IF NOT EXISTS fragrance_embeddings_vector_l2_idx 
ON fragrance_embeddings USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- User collection query indexes
CREATE INDEX IF NOT EXISTS user_collections_user_id_idx ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS user_collections_added_at_idx ON user_collections(added_at DESC);
CREATE INDEX IF NOT EXISTS user_collections_status_idx ON user_collections(status);
CREATE INDEX IF NOT EXISTS user_collections_user_status_idx ON user_collections(user_id, status);

-- User preferences query indexes  
CREATE INDEX IF NOT EXISTS user_preferences_user_id_type_idx ON user_preferences(user_id, preference_type);
CREATE INDEX IF NOT EXISTS user_preferences_type_value_idx ON user_preferences(preference_type, preference_value);

-- User interactions analytics indexes
CREATE INDEX IF NOT EXISTS user_fragrance_interactions_user_id_idx ON user_fragrance_interactions(user_id);
CREATE INDEX IF NOT EXISTS user_fragrance_interactions_created_at_idx ON user_fragrance_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS user_fragrance_interactions_type_idx ON user_fragrance_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS user_fragrance_interactions_fragrance_id_idx ON user_fragrance_interactions(fragrance_id);

-- Fragrance search and filtering indexes
CREATE INDEX IF NOT EXISTS fragrances_sample_available_idx ON fragrances(sample_available) 
WHERE sample_available = true;

-- GIN indexes for array searches
CREATE INDEX IF NOT EXISTS fragrances_occasions_gin_idx ON fragrances USING gin(recommended_occasions);
CREATE INDEX IF NOT EXISTS fragrances_seasons_gin_idx ON fragrances USING gin(recommended_seasons);  
CREATE INDEX IF NOT EXISTS fragrances_mood_tags_gin_idx ON fragrances USING gin(mood_tags);

-- Collection array indexes
CREATE INDEX IF NOT EXISTS user_collections_occasions_gin_idx ON user_collections USING gin(occasions);
CREATE INDEX IF NOT EXISTS user_collections_seasons_gin_idx ON user_collections USING gin(seasons);

-- Existing embedding index optimization (if needed)
-- Note: Check if current embedding column needs index optimization
DO $$
BEGIN
  -- Add index on existing embedding column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'fragrances' AND indexname LIKE '%embedding%'
  ) THEN
    CREATE INDEX fragrances_embedding_cosine_idx 
    ON fragrances USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  END IF;
END $$;

-- =============================================================================
-- TRIGGERS AND AUTOMATION
-- =============================================================================

-- 9. Create updated_at triggers for timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fragrance_embeddings_updated_at ON fragrance_embeddings;
CREATE TRIGGER update_fragrance_embeddings_updated_at
  BEFORE UPDATE ON fragrance_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DATA VALIDATION AND CONSTRAINTS
-- =============================================================================

-- 10. Add additional constraints and validation

-- Ensure fragrance IDs are consistent (existing are TEXT, new should match)
ALTER TABLE fragrance_embeddings 
  ALTER COLUMN fragrance_id TYPE TEXT;

-- Add check constraints for data quality
ALTER TABLE fragrances ADD CONSTRAINT IF NOT EXISTS fragrances_intensity_valid 
  CHECK (intensity_score IS NULL OR (intensity_score >= 1 AND intensity_score <= 10));

ALTER TABLE fragrances ADD CONSTRAINT IF NOT EXISTS fragrances_longevity_valid
  CHECK (longevity_hours IS NULL OR (longevity_hours >= 1 AND longevity_hours <= 24));

ALTER TABLE fragrances ADD CONSTRAINT IF NOT EXISTS fragrances_sillage_valid
  CHECK (sillage_rating IS NULL OR (sillage_rating >= 1 AND sillage_rating <= 10));

-- Validate array contents for occasions and seasons
ALTER TABLE fragrances ADD CONSTRAINT IF NOT EXISTS fragrances_occasions_valid
  CHECK (
    recommended_occasions IS NULL OR 
    recommended_occasions <@ ARRAY['work', 'casual', 'evening', 'date', 'special', 'formal', 'sport', 'travel']
  );

ALTER TABLE fragrances ADD CONSTRAINT IF NOT EXISTS fragrances_seasons_valid  
  CHECK (
    recommended_seasons IS NULL OR
    recommended_seasons <@ ARRAY['spring', 'summer', 'fall', 'winter']
  );

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

-- 11. Add table and column comments for documentation
COMMENT ON TABLE user_preferences IS 'User fragrance preferences learned from interactions and explicit feedback';
COMMENT ON TABLE user_fragrance_interactions IS 'Track all user interactions with fragrances for analytics and recommendations';
COMMENT ON TABLE fragrance_embeddings IS 'Multiple embedding versions for different AI models and similarity search';

COMMENT ON COLUMN user_preferences.preference_strength IS 'Confidence score 0-1 for how strong this preference is';
COMMENT ON COLUMN user_preferences.learned_from IS 'Source of this preference (quiz, behavior analysis, etc.)';

COMMENT ON COLUMN fragrance_embeddings.embedding_version IS 'AI model version (voyage-3.5, openai-ada-002, etc.)';
COMMENT ON COLUMN fragrance_embeddings.embedding_source IS 'What data was used to generate embedding';

COMMENT ON COLUMN fragrances.intensity_score IS 'Subjective intensity rating 1-10';
COMMENT ON COLUMN fragrances.longevity_hours IS 'How long the fragrance lasts in hours';
COMMENT ON COLUMN fragrances.sillage_rating IS 'How far the scent projects 1-10';

-- =============================================================================
-- MIGRATION VALIDATION
-- =============================================================================

-- 12. Validate migration completed successfully
DO $$
DECLARE
  table_count INTEGER;
  index_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count new tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_name IN ('user_preferences', 'user_fragrance_interactions', 'fragrance_embeddings')
    AND table_schema = 'public';
    
  -- Count new indexes  
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE indexname LIKE '%user_preferences%' 
     OR indexname LIKE '%user_fragrance_interactions%'
     OR indexname LIKE '%fragrance_embeddings%';
     
  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename IN ('fragrances', 'fragrance_brands', 'user_preferences', 
                     'user_fragrance_interactions', 'fragrance_embeddings');

  -- Log results
  RAISE NOTICE 'Migration validation: % new tables, % new indexes, % RLS policies', 
    table_count, index_count, policy_count;
    
  -- Ensure critical components exist
  ASSERT table_count >= 2, 'Missing required tables';
  ASSERT policy_count >= 5, 'Missing required RLS policies';
  
  RAISE NOTICE 'Migration completed successfully!';
END $$;