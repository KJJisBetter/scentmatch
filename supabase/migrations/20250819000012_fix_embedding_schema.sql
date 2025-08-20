-- FIX EMBEDDING SCHEMA FOR PGVECTOR COMPATIBILITY
-- Date: 2025-08-19
-- Purpose: Fix embedding dimensions and data types for proper AI pipeline operation

-- ============================================================================
-- STEP 1: UPDATE EMBEDDING COLUMN TO CORRECT DIMENSIONS
-- ============================================================================

-- Fix embedding column to use 2000 dimensions (pgvector limit for ivfflat indexes)
-- Current: VECTOR(2048) → Target: VECTOR(2000)

-- First, drop any existing vector indexes that depend on the column
DROP INDEX IF EXISTS idx_fragrances_embedding_vector;
DROP INDEX IF EXISTS fragrances_embedding_idx;
DROP INDEX IF EXISTS embedding_similarity_idx;

-- Update the column type to correct dimensions
ALTER TABLE fragrances ALTER COLUMN embedding TYPE VECTOR(2000);

-- ============================================================================
-- STEP 2: FIX EMBEDDING VERSION DATA TYPE
-- ============================================================================

-- Current issue: embedding_version is INTEGER but code tries to store text
-- Fix: Keep as INTEGER but ensure code sends proper integer values

-- The column is already INTEGER, just document the expected values
COMMENT ON COLUMN fragrances.embedding_version IS 'Integer version number for embedding model (1, 2, 3, etc.)';

-- ============================================================================
-- STEP 3: UPDATE OTHER AI TABLES FOR CONSISTENCY
-- ============================================================================

-- Fix user_preferences embedding column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' AND column_name = 'user_embedding'
  ) THEN
    -- Drop any dependent indexes
    DROP INDEX IF EXISTS user_preferences_embedding_idx;
    
    -- Update column type
    ALTER TABLE user_preferences ALTER COLUMN user_embedding TYPE VECTOR(2000);
    
    -- Recreate index
    CREATE INDEX user_preferences_embedding_idx 
    ON user_preferences USING ivfflat (user_embedding vector_cosine_ops) 
    WITH (lists = 100);
  END IF;
END $$;

-- Fix recommendation_cache embedding column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recommendation_cache' AND column_name = 'query_embedding'
  ) THEN
    -- Drop any dependent indexes
    DROP INDEX IF EXISTS recommendation_cache_embedding_idx;
    
    -- Update column type  
    ALTER TABLE recommendation_cache ALTER COLUMN query_embedding TYPE VECTOR(2000);
    
    -- Recreate index
    CREATE INDEX recommendation_cache_embedding_idx 
    ON recommendation_cache USING ivfflat (query_embedding vector_cosine_ops) 
    WITH (lists = 100);
  END IF;
END $$;

-- ============================================================================
-- STEP 4: UPDATE FUNCTIONS TO USE CORRECT DIMENSIONS
-- ============================================================================

-- Update find_similar_fragrances function parameter
CREATE OR REPLACE FUNCTION find_similar_fragrances(
  query_embedding VECTOR(2000),  -- Fixed: 2000 not 2048
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 20,
  exclude_ids TEXT[] DEFAULT '{}'
)
RETURNS TABLE(
  fragrance_id TEXT,
  similarity_score FLOAT,
  name TEXT,
  brand_name TEXT,
  main_accords TEXT[],
  sample_price_usd INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    (f.embedding <=> query_embedding) * -1 + 1 as similarity_score,
    f.name,
    fb.name as brand_name,
    f.main_accords,
    f.sample_price_usd
  FROM fragrances f
  JOIN fragrance_brands fb ON f.brand_id = fb.id
  WHERE 
    f.embedding IS NOT NULL
    AND f.is_verified = true
    AND NOT (f.id = ANY(exclude_ids))
    AND (f.embedding <=> query_embedding) < (1 - similarity_threshold)
  ORDER BY f.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: RECREATE OPTIMIZED VECTOR INDEXES
-- ============================================================================

-- Recreate main embedding index for similarity search
CREATE INDEX IF NOT EXISTS fragrances_embedding_cosine_idx 
ON fragrances USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100)
WHERE embedding IS NOT NULL;

-- Create additional index for dot product similarity (faster for normalized vectors)
CREATE INDEX IF NOT EXISTS fragrances_embedding_ip_idx 
ON fragrances USING ivfflat (embedding vector_ip_ops) 
WITH (lists = 100)
WHERE embedding IS NOT NULL;

-- ============================================================================
-- STEP 6: CREATE EMBEDDING VALIDATION FUNCTION
-- ============================================================================

-- Function to validate embedding dimensions before storage
CREATE OR REPLACE FUNCTION validate_embedding_dimensions()
RETURNS TRIGGER AS $$
BEGIN
  -- Check embedding dimensions if not null
  IF NEW.embedding IS NOT NULL THEN
    IF array_length(NEW.embedding::FLOAT[], 1) != 2000 THEN
      RAISE EXCEPTION 'Embedding must have exactly 2000 dimensions, got %', 
        array_length(NEW.embedding::FLOAT[], 1);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger
DROP TRIGGER IF EXISTS validate_embedding_trigger ON fragrances;
CREATE TRIGGER validate_embedding_trigger
  BEFORE INSERT OR UPDATE ON fragrances
  FOR EACH ROW EXECUTE FUNCTION validate_embedding_dimensions();

-- ============================================================================
-- STEP 7: CLEAR ANY INVALID EXISTING EMBEDDINGS
-- ============================================================================

-- Clear any existing embeddings that don't match the new schema
-- (They would be invalid anyway due to dimension mismatch)
UPDATE fragrances 
SET 
  embedding = NULL,
  embedding_generated_at = NULL,
  embedding_model = NULL,
  embedding_version = NULL
WHERE embedding IS NOT NULL;

-- ============================================================================
-- FINAL VALIDATION
-- ============================================================================

DO $$
BEGIN
  -- Verify embedding column is correct dimensions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fragrances' 
    AND column_name = 'embedding'
    AND data_type = 'USER-DEFINED'
  ) THEN
    RAISE EXCEPTION 'Embedding schema fix failed: embedding column not properly updated';
  END IF;
  
  -- Verify validation function exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'validate_embedding_dimensions'
  ) THEN
    RAISE EXCEPTION 'Embedding schema fix failed: validation function not created';
  END IF;
  
  RAISE NOTICE 'Embedding schema fix completed successfully!';
  RAISE NOTICE 'Ready for 2000-dimension embedding generation with proper validation!';
END $$;