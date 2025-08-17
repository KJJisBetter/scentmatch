# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-17-advanced-quiz-profile-system/spec.md

## Schema Changes

### New Tables

**user_profile_vectors** - Structured profile storage for multi-trait personality system

```sql
CREATE TABLE user_profile_vectors (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  profile_vector vector(256),
  personality_traits JSONB NOT NULL,
  trait_weights JSONB NOT NULL,
  confidence_score REAL DEFAULT 0.0,
  quiz_session_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for similarity searches
CREATE INDEX user_profiles_vector_hnsw_idx
ON user_profile_vectors USING hnsw (profile_vector vector_cosine_ops)
WITH (m = 8, ef_construction = 32);

-- Index for trait queries
CREATE INDEX user_profiles_traits_gin_idx
ON user_profile_vectors USING gin (personality_traits);
```

**quiz_responses_enhanced** - Store detailed multi-selection quiz responses

```sql
CREATE TABLE quiz_responses_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_token TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_traits TEXT[] NOT NULL, -- Multiple selections per question
  trait_weights REAL[] NOT NULL,   -- Weights for each selected trait
  response_timestamp TIMESTAMPTZ DEFAULT NOW(),
  question_version INTEGER DEFAULT 1
);

CREATE INDEX quiz_responses_session_idx ON quiz_responses_enhanced(session_token);
CREATE INDEX quiz_responses_user_idx ON quiz_responses_enhanced(user_id);
```

### Table Extensions

**fragrances table** - Add metadata vector for hybrid matching

```sql
ALTER TABLE fragrances
ADD COLUMN metadata_vector vector(256),
ADD COLUMN personality_tags TEXT[] DEFAULT '{}',
ADD COLUMN purchase_prediction_score REAL DEFAULT 0.0;

-- Hybrid index strategy
CREATE INDEX fragrances_metadata_ivfflat_idx
ON fragrances USING ivfflat (metadata_vector vector_cosine_ops)
WITH (lists = 100);

-- Composite index for tag filtering
CREATE INDEX fragrances_personality_tags_gin_idx
ON fragrances USING gin (personality_tags);
```

**user_collections table** - Add profile-aware collection metadata

```sql
ALTER TABLE user_collections
ADD COLUMN profile_match_score REAL DEFAULT 0.0,
ADD COLUMN predicted_satisfaction REAL DEFAULT 0.0,
ADD COLUMN purchase_probability REAL DEFAULT 0.0;

CREATE INDEX user_collections_match_score_idx ON user_collections(profile_match_score DESC);
```

## Database Functions

### Profile Vector Generation

```sql
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
      trait_record.value::REAL,
      profile_vec,
      1, 80
    );
  END LOOP;

  -- Encode preferences (dimensions 81-160)
  FOR pref_record IN pref_cursor LOOP
    profile_vec := encode_preference_to_vector(
      pref_record.key,
      pref_record.value::REAL,
      profile_vec,
      81, 160
    );
  END LOOP;

  -- Normalize vector for cosine similarity
  profile_vec := normalize_vector(profile_vec);

  RETURN profile_vec::vector;
END;
$$ LANGUAGE plpgsql;
```

### Multi-Trait Fragrance Matching

```sql
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
      -- Base similarity score
      (1 - (f.metadata_vector <=> user_profile_vector)) AS base_similarity,
      -- Personality trait bonus
      CASE
        WHEN f.personality_tags && ARRAY(SELECT jsonb_object_keys(trait_weights))
        THEN 0.15 -- 15% boost for matching traits
        ELSE 0.0
      END AS trait_bonus,
      -- Purchase prediction multiplier
      f.purchase_prediction_score * 0.1 AS purchase_boost
    FROM fragrances f
    WHERE
      f.metadata_vector IS NOT NULL
      AND f.sample_available = true
      AND (1 - (f.metadata_vector <=> user_profile_vector)) > 0.6 -- Pre-filter
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
```

### Profile Similarity Search for Cold Start

```sql
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
    (1 - (upv.profile_vector <=> target_profile)) AS similarity,
    COALESCE(uc.purchase_count, 0) AS purchases
  FROM user_profile_vectors upv
  LEFT JOIN (
    SELECT
      user_id,
      COUNT(*) as purchase_count
    FROM user_collections
    WHERE status = 'purchased'
    GROUP BY user_id
  ) uc ON upv.user_id = uc.user_id
  WHERE (1 - (upv.profile_vector <=> target_profile)) > similarity_threshold
  ORDER BY similarity DESC, purchases DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

## Migration Strategy

### Migration Order

1. Create new tables (user_profile_vectors, quiz_responses_enhanced)
2. Add columns to existing tables (fragrances metadata_vector, personality_tags)
3. Create database functions for profile operations
4. Build and populate metadata vectors for existing fragrances
5. Migrate existing quiz data to enhanced format
6. Create optimized indexes (HNSW, GIN, composite)

### Data Migration

```sql
-- Migrate existing simple personalities to enhanced profiles
INSERT INTO user_profile_vectors (user_id, personality_traits, trait_weights, profile_vector)
SELECT
  up.id,
  jsonb_build_object(
    COALESCE(up.quiz_personality_type, 'classic'), 1.0
  ),
  jsonb_build_object(
    COALESCE(up.quiz_personality_type, 'classic'), 0.8
  ),
  generate_legacy_profile_vector(COALESCE(up.quiz_personality_type, 'classic'))
FROM user_profiles up
WHERE up.quiz_completed_at IS NOT NULL;
```

### Rollback Plan

- Maintain existing quiz system during development
- Feature flag for new vs old quiz system
- Gradual rollout with A/B testing
- Database rollback scripts for each migration step
