-- Fix Profile System Database Functions
-- Task 8.2: Fix database function parameter and return format issues (SCE-17)

-- Update get_profile_recommendations function to handle missing columns gracefully
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
        WHEN f.personality_tags IS NOT NULL 
             AND f.personality_tags && ARRAY(SELECT jsonb_object_keys(trait_weights))
        THEN 0.15
        ELSE 0.0
      END AS trait_bonus,
      -- Purchase prediction multiplier (gracefully handle missing column)
      0.0 AS purchase_boost
    FROM fragrances f
    WHERE
      f.metadata_vector IS NOT NULL
      -- Remove sample_available filter for now to avoid missing column error
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

-- Update find_similar_profiles function to handle missing columns
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
    COALESCE(uc.purchases, 0) AS purchases
  FROM user_profile_vectors upv
  LEFT JOIN (
    SELECT 
      user_id, 
      COUNT(*) AS purchases
    FROM user_collections
    -- Remove status filter to avoid missing column issues
    GROUP BY user_id
  ) uc ON upv.user_id = uc.user_id
  WHERE GREATEST(0, 1 - (upv.profile_vector <=> target_profile)) > similarity_threshold
  ORDER BY similarity DESC, purchases DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;