-- Advanced Quiz Profile System Migration
-- Implements multi-dimensional personality profiles with vector storage
-- Task 2: Enhanced Database Schema & Profile Storage

-- Ensure pgvector extension is available
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================
-- 1. USER_PROFILE_VECTORS TABLE
-- =====================================

-- Create user_profile_vectors table for multi-trait personality system
CREATE TABLE IF NOT EXISTS user_profile_vectors (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_vector vector(256),
  personality_traits JSONB NOT NULL,
  trait_weights JSONB NOT NULL,
  confidence_score REAL DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  quiz_session_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for user_profile_vectors
-- HNSW index for vector similarity searches (cosine distance)
CREATE INDEX IF NOT EXISTS user_profiles_vector_hnsw_idx
ON user_profile_vectors USING hnsw (profile_vector vector_cosine_ops)
WITH (m = 8, ef_construction = 32);

-- GIN index for personality traits queries
CREATE INDEX IF NOT EXISTS user_profiles_traits_gin_idx
ON user_profile_vectors USING gin (personality_traits);

-- Index for session token lookups
CREATE INDEX IF NOT EXISTS user_profiles_session_token_idx
ON user_profile_vectors (quiz_session_token);

-- Index for confidence score ordering
CREATE INDEX IF NOT EXISTS user_profiles_confidence_idx
ON user_profile_vectors (confidence_score DESC);

-- =====================================
-- 2. QUIZ_RESPONSES_ENHANCED TABLE
-- =====================================

-- Create quiz_responses_enhanced table for multi-selection storage
CREATE TABLE IF NOT EXISTS quiz_responses_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_traits TEXT[] NOT NULL CHECK (array_length(selected_traits, 1) > 0), -- At least one trait
  trait_weights REAL[] NOT NULL CHECK (array_length(trait_weights, 1) = array_length(selected_traits, 1)), -- Same length as traits
  response_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  question_version INTEGER DEFAULT 1 NOT NULL
);

-- Create indexes for quiz_responses_enhanced
CREATE INDEX IF NOT EXISTS quiz_responses_session_idx 
ON quiz_responses_enhanced(session_token);

CREATE INDEX IF NOT EXISTS quiz_responses_user_idx 
ON quiz_responses_enhanced(user_id);

CREATE INDEX IF NOT EXISTS quiz_responses_question_idx 
ON quiz_responses_enhanced(question_id);

-- Composite index for session + question lookups
CREATE INDEX IF NOT EXISTS quiz_responses_session_question_idx 
ON quiz_responses_enhanced(session_token, question_id);

-- =====================================
-- 3. EXTEND FRAGRANCES TABLE
-- =====================================

-- Add metadata vector and personality tags to fragrances table
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS metadata_vector vector(256),
ADD COLUMN IF NOT EXISTS personality_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS purchase_prediction_score REAL DEFAULT 0.0 CHECK (purchase_prediction_score >= 0.0 AND purchase_prediction_score <= 1.0);

-- Create indexes for new fragrance columns
-- IVFFlat index for metadata vector similarity (good for large datasets)
CREATE INDEX IF NOT EXISTS fragrances_metadata_ivfflat_idx
ON fragrances USING ivfflat (metadata_vector vector_cosine_ops)
WITH (lists = 100);

-- GIN index for personality tags array queries
CREATE INDEX IF NOT EXISTS fragrances_personality_tags_gin_idx
ON fragrances USING gin (personality_tags);

-- Index for purchase prediction scores
CREATE INDEX IF NOT EXISTS fragrances_purchase_prediction_idx
ON fragrances (purchase_prediction_score DESC);

-- =====================================
-- 4. EXTEND USER_COLLECTIONS TABLE
-- =====================================

-- Add profile-aware collection metadata
ALTER TABLE user_collections
ADD COLUMN IF NOT EXISTS profile_match_score REAL DEFAULT 0.0 CHECK (profile_match_score >= 0.0 AND profile_match_score <= 1.0),
ADD COLUMN IF NOT EXISTS predicted_satisfaction REAL DEFAULT 0.0 CHECK (predicted_satisfaction >= 0.0 AND predicted_satisfaction <= 1.0),
ADD COLUMN IF NOT EXISTS purchase_probability REAL DEFAULT 0.0 CHECK (purchase_probability >= 0.0 AND purchase_probability <= 1.0);

-- Create index for profile match score ordering
CREATE INDEX IF NOT EXISTS user_collections_match_score_idx 
ON user_collections(profile_match_score DESC);

-- Composite index for user + match score
CREATE INDEX IF NOT EXISTS user_collections_user_match_idx 
ON user_collections(user_id, profile_match_score DESC);

-- =====================================
-- 5. DATABASE FUNCTIONS
-- =====================================

-- Helper function to normalize vectors
CREATE OR REPLACE FUNCTION normalize_vector(input_vector REAL[])
RETURNS REAL[] AS $$
DECLARE
  magnitude REAL := 0;
  normalized_vector REAL[];
  i INTEGER;
BEGIN
  -- Calculate magnitude
  FOR i IN 1..array_length(input_vector, 1) LOOP
    magnitude := magnitude + (input_vector[i] * input_vector[i]);
  END LOOP;
  magnitude := sqrt(magnitude);
  
  -- Avoid division by zero
  IF magnitude = 0 THEN
    RETURN input_vector;
  END IF;
  
  -- Normalize
  FOR i IN 1..array_length(input_vector, 1) LOOP
    normalized_vector[i] := input_vector[i] / magnitude;
  END LOOP;
  
  RETURN normalized_vector;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to encode traits to vector dimensions
CREATE OR REPLACE FUNCTION encode_trait_to_vector(
  trait_key TEXT,
  trait_value REAL,
  profile_vec REAL[],
  start_dim INTEGER,
  end_dim INTEGER
) RETURNS REAL[] AS $$
DECLARE
  dimensions_per_trait INTEGER := (end_dim - start_dim + 1) / 10; -- Support 10 major traits
  trait_index INTEGER;
  dim_start INTEGER;
  dim_end INTEGER;
  i INTEGER;
BEGIN
  -- Map trait names to indices (0-9)
  trait_index := CASE trait_key
    WHEN 'sophisticated' THEN 0
    WHEN 'casual' THEN 1
    WHEN 'confident' THEN 2
    WHEN 'romantic' THEN 3
    WHEN 'adventurous' THEN 4
    WHEN 'classic' THEN 5
    WHEN 'modern' THEN 6
    WHEN 'elegant' THEN 7
    WHEN 'fun' THEN 8
    ELSE 9  -- 'other' category
  END;
  
  -- Calculate dimension range for this trait
  dim_start := start_dim + (trait_index * dimensions_per_trait);
  dim_end := dim_start + dimensions_per_trait - 1;
  
  -- Encode trait value across allocated dimensions
  FOR i IN dim_start..LEAST(dim_end, end_dim) LOOP
    profile_vec[i] := trait_value * sin((i - dim_start + 1) * 3.14159 / dimensions_per_trait);
  END LOOP;
  
  RETURN profile_vec;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to encode preferences to vector dimensions
CREATE OR REPLACE FUNCTION encode_preference_to_vector(
  pref_key TEXT,
  pref_value REAL,
  profile_vec REAL[],
  start_dim INTEGER,
  end_dim INTEGER
) RETURNS REAL[] AS $$
DECLARE
  dimensions_per_pref INTEGER := (end_dim - start_dim + 1) / 8; -- Support 8 major preferences
  pref_index INTEGER;
  dim_start INTEGER;
  dim_end INTEGER;
  i INTEGER;
BEGIN
  -- Map preference names to indices (0-7)
  pref_index := CASE pref_key
    WHEN 'intensity' THEN 0
    WHEN 'longevity' THEN 1
    WHEN 'sillage' THEN 2
    WHEN 'freshness' THEN 3
    WHEN 'warmth' THEN 4
    WHEN 'sweetness' THEN 5
    WHEN 'complexity' THEN 6
    ELSE 7  -- 'other' category
  END;
  
  -- Calculate dimension range for this preference
  dim_start := start_dim + (pref_index * dimensions_per_pref);
  dim_end := dim_start + dimensions_per_pref - 1;
  
  -- Encode preference value across allocated dimensions
  FOR i IN dim_start..LEAST(dim_end, end_dim) LOOP
    profile_vec[i] := pref_value * cos((i - dim_start + 1) * 3.14159 / dimensions_per_pref);
  END LOOP;
  
  RETURN profile_vec;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main function to generate profile vectors from quiz responses
CREATE OR REPLACE FUNCTION generate_profile_vector(
  trait_responses JSONB,
  preference_responses JSONB
) RETURNS vector AS $$
DECLARE
  profile_vec REAL[256] := ARRAY_FILL(0.0, ARRAY[256]);
  trait_cursor CURSOR FOR
    SELECT key, value FROM jsonb_each(trait_responses);
  pref_cursor CURSOR FOR
    SELECT key, value FROM jsonb_each(preference_responses);
BEGIN
  -- Encode personality traits (dimensions 1-80)
  FOR trait_record IN trait_cursor LOOP
    profile_vec := encode_trait_to_vector(
      trait_record.key,
      (trait_record.value)::REAL,
      profile_vec,
      1, 80
    );
  END LOOP;

  -- Encode preferences (dimensions 81-160)
  FOR pref_record IN pref_cursor LOOP
    profile_vec := encode_preference_to_vector(
      pref_record.key,
      (pref_record.value)::REAL,
      profile_vec,
      81, 160
    );
  END LOOP;

  -- Normalize vector for cosine similarity
  profile_vec := normalize_vector(profile_vec);

  RETURN profile_vec::vector;
END;
$$ LANGUAGE plpgsql;

-- Function to get profile-based fragrance recommendations
CREATE OR REPLACE FUNCTION get_profile_recommendations(
  user_profile_vector vector(256),
  trait_weights JSONB,
  limit_count INTEGER DEFAULT 15
) RETURNS TABLE (
  fragrance_id TEXT,
  name TEXT,
  brand_name TEXT,
  similarity_score REAL,
  personality_boost REAL,
  final_score REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH scored_fragrances AS (
    SELECT
      f.id,
      f.name,
      f.brand_name,
      -- Base similarity score (cosine similarity: 1 - cosine_distance)
      GREATEST(0, 1 - (f.metadata_vector <=> user_profile_vector)) AS base_similarity,
      -- Personality trait bonus (15% boost for matching traits)
      CASE
        WHEN f.personality_tags && ARRAY(SELECT jsonb_object_keys(trait_weights))
        THEN 0.15
        ELSE 0.0
      END AS trait_bonus,
      -- Purchase prediction multiplier
      COALESCE(f.purchase_prediction_score, 0.0) * 0.1 AS purchase_boost
    FROM fragrances f
    WHERE
      f.metadata_vector IS NOT NULL
      AND GREATEST(0, 1 - (f.metadata_vector <=> user_profile_vector)) > 0.6 -- Pre-filter for performance
  )
  SELECT
    sf.id,
    sf.name,
    sf.brand_name,
    sf.base_similarity,
    sf.trait_bonus,
    (sf.base_similarity + sf.trait_bonus + sf.purchase_boost) AS final_score
  FROM scored_fragrances sf
  ORDER BY final_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar user profiles for cold-start recommendations
CREATE OR REPLACE FUNCTION find_similar_profiles(
  target_profile vector(256),
  similarity_threshold REAL DEFAULT 0.8,
  limit_count INTEGER DEFAULT 10
) RETURNS TABLE (
  user_id UUID,
  similarity_score REAL,
  successful_purchases INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    upv.user_id,
    GREATEST(0, 1 - (upv.profile_vector <=> target_profile)) AS similarity,
    COALESCE(uc.purchase_count, 0) AS purchases
  FROM user_profile_vectors upv
  LEFT JOIN (
    SELECT
      user_id,
      COUNT(*) as purchase_count
    FROM user_collections
    GROUP BY user_id
  ) uc ON upv.user_id = uc.user_id
  WHERE GREATEST(0, 1 - (upv.profile_vector <=> target_profile)) > similarity_threshold
  ORDER BY similarity DESC, purchases DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate quiz responses into personality profile
CREATE OR REPLACE FUNCTION aggregate_quiz_responses_to_profile(
  target_session_token TEXT
) RETURNS JSONB AS $$
DECLARE
  result_traits JSONB := '{}';
  result_weights JSONB := '{}';
  trait_totals JSONB := '{}';
  weight_totals JSONB := '{}';
  response_record RECORD;
  trait_name TEXT;
  trait_weight REAL;
  i INTEGER;
BEGIN
  -- Aggregate all responses for the session
  FOR response_record IN
    SELECT selected_traits, trait_weights
    FROM quiz_responses_enhanced
    WHERE session_token = target_session_token
    ORDER BY response_timestamp
  LOOP
    -- Process each trait in this response
    FOR i IN 1..array_length(response_record.selected_traits, 1) LOOP
      trait_name := response_record.selected_traits[i];
      trait_weight := response_record.trait_weights[i];
      
      -- Accumulate trait values and weights
      trait_totals := jsonb_set(
        trait_totals,
        ARRAY[trait_name],
        to_jsonb(COALESCE((trait_totals->>trait_name)::REAL, 0.0) + trait_weight)
      );
      
      weight_totals := jsonb_set(
        weight_totals,
        ARRAY[trait_name],
        to_jsonb(COALESCE((weight_totals->>trait_name)::REAL, 0.0) + 1.0)
      );
    END LOOP;
  END LOOP;
  
  -- Calculate averages and normalize
  FOR trait_name IN SELECT key FROM jsonb_each(trait_totals) LOOP
    result_traits := jsonb_set(
      result_traits,
      ARRAY[trait_name],
      to_jsonb((trait_totals->>trait_name)::REAL / (weight_totals->>trait_name)::REAL)
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'personality_traits', result_traits,
    'trait_weights', result_traits -- Use same values for weights in this version
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================

-- Enable RLS on new tables
ALTER TABLE user_profile_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses_enhanced ENABLE ROW LEVEL SECURITY;

-- User profile vectors policies
CREATE POLICY "user_profile_vectors_own_profile" ON user_profile_vectors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_profile_vectors_service_access" ON user_profile_vectors
  FOR ALL USING (auth.role() = 'service_role');

-- Quiz responses policies  
CREATE POLICY "quiz_responses_own_session" ON quiz_responses_enhanced
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.role() = 'service_role' OR
    (user_id IS NULL AND session_token IS NOT NULL) -- Allow guest sessions
  );

-- =====================================
-- 7. HELPFUL COMMENTS
-- =====================================

-- Table comments
COMMENT ON TABLE user_profile_vectors IS 'Stores multi-dimensional personality profiles with 256-dimension vectors for advanced fragrance matching';
COMMENT ON TABLE quiz_responses_enhanced IS 'Stores detailed quiz responses with multiple trait selections per question';

-- Column comments
COMMENT ON COLUMN user_profile_vectors.profile_vector IS '256-dimension vector encoding personality traits and preferences';
COMMENT ON COLUMN user_profile_vectors.personality_traits IS 'JSONB object containing trait names and their strength values (0.0-1.0)';
COMMENT ON COLUMN user_profile_vectors.trait_weights IS 'JSONB object containing relative importance weights for each trait';
COMMENT ON COLUMN user_profile_vectors.confidence_score IS 'Overall confidence in this profile based on quiz completion and consistency';

COMMENT ON COLUMN fragrances.metadata_vector IS '256-dimension vector for hybrid similarity matching with user profiles';
COMMENT ON COLUMN fragrances.personality_tags IS 'Array of personality traits this fragrance appeals to';
COMMENT ON COLUMN fragrances.purchase_prediction_score IS 'ML-generated score for purchase likelihood (0.0-1.0)';

COMMENT ON COLUMN user_collections.profile_match_score IS 'How well this fragrance matches the users profile (0.0-1.0)';
COMMENT ON COLUMN user_collections.predicted_satisfaction IS 'Predicted satisfaction score based on similar users (0.0-1.0)';
COMMENT ON COLUMN user_collections.purchase_probability IS 'Probability this user will purchase this fragrance (0.0-1.0)';

-- Function comments
COMMENT ON FUNCTION generate_profile_vector IS 'Generates a 256-dimension profile vector from personality traits and preferences';
COMMENT ON FUNCTION get_profile_recommendations IS 'Returns fragrance recommendations based on user profile vector with personality trait boosting';
COMMENT ON FUNCTION find_similar_profiles IS 'Finds users with similar personality profiles for cold-start recommendations';
COMMENT ON FUNCTION aggregate_quiz_responses_to_profile IS 'Aggregates enhanced quiz responses into a personality profile';

-- =====================================
-- 8. PERFORMANCE VALIDATION
-- =====================================

-- Create a function to validate database performance meets targets
CREATE OR REPLACE FUNCTION validate_profile_system_performance()
RETURNS TABLE (
  test_name TEXT,
  execution_time_ms REAL,
  passed BOOLEAN,
  target_ms REAL
) AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
  execution_ms REAL;
  test_vector vector(256) := array_fill(0.1, array[256])::vector;
BEGIN
  -- Test 1: Profile vector insertion
  start_time := clock_timestamp();
  INSERT INTO user_profile_vectors (user_id, profile_vector, personality_traits, trait_weights)
  VALUES (gen_random_uuid(), test_vector, '{"test": 0.5}', '{"test": 0.5}');
  end_time := clock_timestamp();
  execution_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
  
  RETURN QUERY SELECT 
    'Profile Vector Insert'::TEXT,
    execution_ms,
    execution_ms < 100.0,
    100.0::REAL;

  -- Test 2: Vector similarity search
  start_time := clock_timestamp();
  PERFORM * FROM user_profile_vectors 
  ORDER BY profile_vector <=> test_vector 
  LIMIT 10;
  end_time := clock_timestamp();
  execution_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
  
  RETURN QUERY SELECT 
    'Vector Similarity Search'::TEXT,
    execution_ms,
    execution_ms < 100.0,
    100.0::REAL;

  -- Cleanup test data
  DELETE FROM user_profile_vectors WHERE personality_traits = '{"test": 0.5}';
END;
$$ LANGUAGE plpgsql;