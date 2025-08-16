-- Migration: Database Functions for Collections and Recommendations  
-- Created: 2025-08-15
-- Purpose: Create database functions for similarity search, collections, and recommendations

-- =============================================================================
-- VECTOR SIMILARITY FUNCTIONS
-- =============================================================================

-- 1. Get similar fragrances using vector embeddings
CREATE OR REPLACE FUNCTION get_similar_fragrances(
  target_fragrance_id TEXT,
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 10,
  embedding_version TEXT DEFAULT 'voyage-3.5'
)
RETURNS TABLE (
  fragrance_id TEXT,
  similarity_score FLOAT,
  name TEXT,
  brand TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF target_fragrance_id IS NULL OR target_fragrance_id = '' THEN
    RETURN;
  END IF;
  
  IF similarity_threshold < 0 OR similarity_threshold > 1 THEN
    similarity_threshold := 0.7;
  END IF;
  
  IF max_results < 1 OR max_results > 100 THEN
    max_results := 10;
  END IF;

  RETURN QUERY
  SELECT 
    f.id::TEXT,
    (1 - (fe1.embedding <=> fe2.embedding))::FLOAT as similarity,
    f.name::TEXT,
    fb.name::TEXT as brand
  FROM fragrance_embeddings fe1
  JOIN fragrance_embeddings fe2 ON fe1.embedding_version = fe2.embedding_version
    AND fe1.embedding_source = fe2.embedding_source
  JOIN fragrances f ON fe2.fragrance_id = f.id
  LEFT JOIN fragrance_brands fb ON f.brand_id = fb.id
  WHERE fe1.fragrance_id = target_fragrance_id
    AND fe2.fragrance_id != target_fragrance_id
    AND fe1.embedding_version = embedding_version
    AND fe2.embedding_version = embedding_version
    AND fe1.embedding_source = 'combined'
    AND fe2.embedding_source = 'combined'
    AND (1 - (fe1.embedding <=> fe2.embedding)) >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- 2. Match fragrances with existing embeddings (for backward compatibility)
CREATE OR REPLACE FUNCTION match_fragrances(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  similarity FLOAT
)
SECURITY DEFINER  
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF query_embedding IS NULL THEN
    RETURN;
  END IF;
  
  IF match_threshold < 0 OR match_threshold > 1 THEN
    match_threshold := 0.7;
  END IF;
  
  IF match_count < 1 OR match_count > 100 THEN
    match_count := 10;
  END IF;

  RETURN QUERY
  SELECT 
    fragrances.id::TEXT,
    (1 - (fragrances.embedding <=> query_embedding))::FLOAT as similarity
  FROM fragrances
  WHERE fragrances.embedding IS NOT NULL
    AND (1 - (fragrances.embedding <=> query_embedding)) >= match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Multi-vector similarity comparison
CREATE OR REPLACE FUNCTION multi_vector_similarity(
  fragrance_id TEXT,
  embedding_versions TEXT[] DEFAULT ARRAY['voyage-3.5', 'openai-ada-002'],
  max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
  similar_fragrance_id TEXT,
  avg_similarity FLOAT,
  version_scores JSONB
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF fragrance_id IS NULL OR array_length(embedding_versions, 1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH similarity_scores AS (
    SELECT 
      fe2.fragrance_id,
      fe1.embedding_version,
      (1 - (fe1.embedding <=> fe2.embedding)) as similarity
    FROM fragrance_embeddings fe1
    JOIN fragrance_embeddings fe2 ON fe1.embedding_version = fe2.embedding_version
    WHERE fe1.fragrance_id = fragrance_id
      AND fe2.fragrance_id != fragrance_id
      AND fe1.embedding_version = ANY(embedding_versions)
      AND fe1.embedding_source = 'combined'
      AND fe2.embedding_source = 'combined'
  )
  SELECT 
    ss.fragrance_id::TEXT,
    AVG(ss.similarity)::FLOAT,
    jsonb_object_agg(ss.embedding_version, ss.similarity) as version_scores
  FROM similarity_scores ss
  GROUP BY ss.fragrance_id
  HAVING COUNT(DISTINCT ss.embedding_version) = array_length(embedding_versions, 1)
  ORDER BY AVG(ss.similarity) DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- USER COLLECTION ANALYTICS FUNCTIONS
-- =============================================================================

-- 4. Get comprehensive collection insights
CREATE OR REPLACE FUNCTION get_collection_insights(target_user_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Validate input
  IF target_user_id IS NULL THEN
    RETURN '{"error": "user_id required"}'::JSON;
  END IF;

  SELECT json_build_object(
    'total_fragrances', COALESCE(collection_stats.total, 0),
    'by_status', COALESCE(collection_stats.by_status, '[]'::JSON),
    'dominant_families', COALESCE(family_stats.families, '[]'::JSON),
    'average_intensity', COALESCE(intensity_stats.avg_intensity, 0),
    'intensity_distribution', COALESCE(intensity_stats.distribution, '[]'::JSON),
    'most_worn_occasions', COALESCE(occasion_stats.occasions, '[]'::JSON),
    'seasonal_preferences', COALESCE(season_stats.seasons, '[]'::JSON),
    'collection_diversity_score', COALESCE(diversity_stats.diversity, 0),
    'average_rating', COALESCE(rating_stats.avg_rating, 0),
    'price_range', COALESCE(price_stats.range, '{"min": 0, "max": 0}'::JSON),
    'recent_additions', COALESCE(recent_stats.recent, '[]'::JSON)
  ) INTO result
  FROM (
    -- Collection totals and status breakdown
    SELECT 
      COUNT(*) as total,
      json_agg(json_build_object('status', status, 'count', cnt)) as by_status
    FROM (
      SELECT status, COUNT(*) as cnt
      FROM user_collections 
      WHERE user_id = target_user_id
      GROUP BY status
    ) status_counts
  ) collection_stats
  CROSS JOIN (
    -- Scent family analysis
    SELECT json_agg(
      json_build_object('family', scent_family, 'count', cnt, 'percentage', 
        ROUND(cnt::DECIMAL / NULLIF(SUM(cnt) OVER (), 0) * 100, 1))
      ORDER BY cnt DESC
    ) as families
    FROM (
      SELECT f.scent_family, COUNT(*) as cnt
      FROM user_collections uc
      JOIN fragrances f ON uc.fragrance_id = f.id
      WHERE uc.user_id = target_user_id AND f.scent_family IS NOT NULL
      GROUP BY f.scent_family
      ORDER BY COUNT(*) DESC
      LIMIT 8
    ) family_counts
  ) family_stats
  CROSS JOIN (
    -- Intensity analysis  
    SELECT 
      ROUND(AVG(f.intensity_score), 1) as avg_intensity,
      json_agg(
        json_build_object('intensity', intensity_range, 'count', cnt)
        ORDER BY intensity_range
      ) as distribution
    FROM (
      SELECT 
        CASE 
          WHEN f.intensity_score <= 3 THEN 'Light (1-3)'
          WHEN f.intensity_score <= 6 THEN 'Moderate (4-6)'
          WHEN f.intensity_score <= 8 THEN 'Strong (7-8)'
          ELSE 'Very Strong (9-10)'
        END as intensity_range,
        COUNT(*) as cnt
      FROM user_collections uc
      JOIN fragrances f ON uc.fragrance_id = f.id
      WHERE uc.user_id = target_user_id AND f.intensity_score IS NOT NULL
      GROUP BY intensity_range
    ) intensity_groups
  ) intensity_stats
  CROSS JOIN (
    -- Most worn occasions
    SELECT json_agg(
      json_build_object('occasion', occasion, 'count', cnt)
      ORDER BY cnt DESC
    ) as occasions
    FROM (
      SELECT occasion, COUNT(*) as cnt
      FROM user_collections uc,
           LATERAL unnest(COALESCE(uc.occasions, ARRAY[]::TEXT[])) as occasion_list(occasion)
      WHERE uc.user_id = target_user_id AND uc.occasions IS NOT NULL
      GROUP BY occasion
      ORDER BY COUNT(*) DESC
      LIMIT 5
    ) occasion_counts
  ) occasion_stats
  CROSS JOIN (
    -- Seasonal preferences
    SELECT json_agg(
      json_build_object('season', season, 'count', cnt)
      ORDER BY cnt DESC  
    ) as seasons
    FROM (
      SELECT season, COUNT(*) as cnt
      FROM user_collections uc,
           LATERAL unnest(COALESCE(uc.seasons, ARRAY[]::TEXT[])) as season_list(season)
      WHERE uc.user_id = target_user_id AND uc.seasons IS NOT NULL
      GROUP BY season
    ) season_counts
  ) season_stats
  CROSS JOIN (
    -- Collection diversity score
    SELECT 
      CASE 
        WHEN total_frags = 0 THEN 0
        ELSE ROUND(unique_families::DECIMAL / total_frags, 2)
      END as diversity
    FROM (
      SELECT 
        COUNT(*) as total_frags,
        COUNT(DISTINCT f.scent_family) as unique_families
      FROM user_collections uc
      JOIN fragrances f ON uc.fragrance_id = f.id  
      WHERE uc.user_id = target_user_id
    ) div_calc
  ) diversity_stats
  CROSS JOIN (
    -- Average rating
    SELECT ROUND(AVG(rating), 1) as avg_rating
    FROM user_collections
    WHERE user_id = target_user_id AND rating IS NOT NULL
  ) rating_stats
  CROSS JOIN (
    -- Price range analysis
    SELECT json_build_object(
      'min', COALESCE(MIN(purchase_price), 0),
      'max', COALESCE(MAX(purchase_price), 0), 
      'average', ROUND(AVG(purchase_price), 2)
    ) as range
    FROM user_collections
    WHERE user_id = target_user_id AND purchase_price IS NOT NULL
  ) price_stats
  CROSS JOIN (
    -- Recent additions (last 30 days)
    SELECT json_agg(
      json_build_object(
        'fragrance_id', uc.fragrance_id,
        'name', f.name,
        'brand', fb.name,
        'added_at', uc.added_at
      )
      ORDER BY uc.added_at DESC
    ) as recent
    FROM user_collections uc
    JOIN fragrances f ON uc.fragrance_id = f.id
    LEFT JOIN fragrance_brands fb ON f.brand_id = fb.id
    WHERE uc.user_id = target_user_id 
      AND uc.added_at >= NOW() - INTERVAL '30 days'
    ORDER BY uc.added_at DESC
    LIMIT 10
  ) recent_stats;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. Get collection timeline and growth patterns
CREATE OR REPLACE FUNCTION get_collection_timeline(
  target_user_id UUID,
  time_period TEXT DEFAULT '1 year'
)
RETURNS TABLE (
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  additions_count INTEGER,
  dominant_family TEXT,
  avg_price DECIMAL
)
SECURITY DEFINER
SET search_path = public  
AS $$
DECLARE
  interval_val INTERVAL;
BEGIN
  -- Parse time period
  interval_val := CASE time_period
    WHEN '1 month' THEN INTERVAL '1 month'
    WHEN '3 months' THEN INTERVAL '3 months' 
    WHEN '6 months' THEN INTERVAL '6 months'
    WHEN '1 year' THEN INTERVAL '1 year'
    ELSE INTERVAL '1 year'
  END;

  RETURN QUERY
  WITH time_buckets AS (
    SELECT 
      date_trunc('month', uc.added_at) as month_start,
      date_trunc('month', uc.added_at) + INTERVAL '1 month' - INTERVAL '1 second' as month_end,
      uc.fragrance_id,
      uc.purchase_price,
      f.scent_family
    FROM user_collections uc
    JOIN fragrances f ON uc.fragrance_id = f.id
    WHERE uc.user_id = target_user_id 
      AND uc.added_at >= NOW() - interval_val
  )
  SELECT 
    tb.month_start,
    tb.month_end,
    COUNT(*)::INTEGER as additions_count,
    MODE() WITHIN GROUP (ORDER BY tb.scent_family)::TEXT as dominant_family,
    ROUND(AVG(tb.purchase_price), 2) as avg_price
  FROM time_buckets tb
  GROUP BY tb.month_start, tb.month_end
  ORDER BY tb.month_start DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PERSONALIZED RECOMMENDATION FUNCTIONS
-- =============================================================================

-- 6. Get personalized recommendations based on user preferences and behavior
CREATE OR REPLACE FUNCTION get_personalized_recommendations(
  target_user_id UUID,
  max_results INTEGER DEFAULT 20,
  include_owned BOOLEAN DEFAULT FALSE,
  occasion_filter TEXT DEFAULT NULL,
  season_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  fragrance_id TEXT,
  recommendation_score FLOAT,
  recommendation_reasons TEXT[],
  name TEXT,
  brand TEXT,
  sample_price DECIMAL
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF target_user_id IS NULL THEN
    RETURN;
  END IF;
  
  IF max_results < 1 OR max_results > 100 THEN
    max_results := 20;
  END IF;

  RETURN QUERY
  WITH user_preferences AS (
    -- Get user's learned preferences
    SELECT preference_type, preference_value, preference_strength
    FROM user_preferences up
    WHERE up.user_id = target_user_id
  ),
  user_collection_families AS (
    -- Get user's favorite scent families from collection
    SELECT f.scent_family, COUNT(*) as family_count
    FROM user_collections uc
    JOIN fragrances f ON uc.fragrance_id = f.id
    WHERE uc.user_id = target_user_id AND uc.status IN ('owned', 'tried')
    GROUP BY f.scent_family
  ),
  user_liked_interactions AS (
    -- Get fragrances user has liked/rated highly
    SELECT ufi.fragrance_id
    FROM user_fragrance_interactions ufi
    WHERE ufi.user_id = target_user_id 
      AND ufi.interaction_type IN ('like', 'rating')
  ),
  owned_fragrances AS (
    -- Get user's owned fragrances to exclude (if requested)
    SELECT uc.fragrance_id
    FROM user_collections uc
    WHERE uc.user_id = target_user_id
  ),
  candidate_fragrances AS (
    -- Score fragrances based on user preferences
    SELECT 
      f.id as fragrance_id,
      f.name,
      fb.name as brand,
      f.sample_price_usd,
      -- Scoring factors
      CASE WHEN EXISTS(SELECT 1 FROM user_collection_families ucf WHERE ucf.scent_family = f.scent_family) 
           THEN 0.3 ELSE 0.0 END +
      CASE WHEN EXISTS(SELECT 1 FROM user_preferences up WHERE up.preference_type = 'scent_family' AND up.preference_value = f.scent_family)
           THEN 0.25 ELSE 0.0 END +
      CASE WHEN f.sample_available THEN 0.15 ELSE 0.0 END +
      CASE WHEN occasion_filter IS NULL OR f.recommended_occasions @> ARRAY[occasion_filter]
           THEN 0.1 ELSE 0.0 END +
      CASE WHEN season_filter IS NULL OR f.recommended_seasons @> ARRAY[season_filter]
           THEN 0.1 ELSE 0.0 END +
      -- Random factor for diversity
      RANDOM() * 0.1 as base_score
    FROM fragrances f
    LEFT JOIN fragrance_brands fb ON f.brand_id = fb.id
    WHERE (include_owned OR NOT EXISTS(SELECT 1 FROM owned_fragrances of WHERE of.fragrance_id = f.id))
      AND (occasion_filter IS NULL OR f.recommended_occasions @> ARRAY[occasion_filter])  
      AND (season_filter IS NULL OR f.recommended_seasons @> ARRAY[season_filter])
  )
  SELECT 
    cf.fragrance_id::TEXT,
    cf.base_score::FLOAT as recommendation_score,
    ARRAY[
      CASE WHEN EXISTS(SELECT 1 FROM user_collection_families ucf WHERE ucf.scent_family = (SELECT scent_family FROM fragrances WHERE id = cf.fragrance_id))
           THEN 'Similar to fragrances in your collection' END,
      CASE WHEN cf.sample_price_usd IS NOT NULL 
           THEN 'Sample available for $' || cf.sample_price_usd::TEXT END,
      CASE WHEN occasion_filter IS NOT NULL
           THEN 'Perfect for ' || occasion_filter || ' occasions' END,
      CASE WHEN season_filter IS NOT NULL  
           THEN 'Great for ' || season_filter || ' season' END
    ]::TEXT[] as recommendation_reasons,
    cf.name::TEXT,
    cf.brand::TEXT,
    cf.sample_price_usd
  FROM candidate_fragrances cf
  WHERE cf.base_score > 0.1 -- Minimum relevance threshold
  ORDER BY cf.base_score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SEARCH AND FILTERING FUNCTIONS  
-- =============================================================================

-- 7. Advanced fragrance search with multiple filters
CREATE OR REPLACE FUNCTION advanced_fragrance_search(
  query_text TEXT DEFAULT NULL,
  scent_families TEXT[] DEFAULT NULL,
  intensity_min INTEGER DEFAULT NULL,
  intensity_max INTEGER DEFAULT NULL,
  longevity_min INTEGER DEFAULT NULL, 
  occasions TEXT[] DEFAULT NULL,
  seasons TEXT[] DEFAULT NULL,
  sample_available_only BOOLEAN DEFAULT FALSE,
  max_results INTEGER DEFAULT 25
)
RETURNS TABLE (
  fragrance_id TEXT,
  name TEXT,
  brand TEXT,
  scent_family TEXT,
  relevance_score FLOAT
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate max_results
  IF max_results < 1 OR max_results > 100 THEN
    max_results := 25;
  END IF;

  RETURN QUERY
  SELECT 
    f.id::TEXT,
    f.name::TEXT,
    fb.name::TEXT as brand,
    f.scent_family::TEXT,
    -- Relevance scoring
    (CASE 
      WHEN query_text IS NOT NULL THEN
        ts_rank(f.search_vector, plainto_tsquery('english', query_text)) * 0.6 +
        similarity(f.name, query_text) * 0.4
      ELSE 0.5
    END)::FLOAT as relevance_score
  FROM fragrances f
  LEFT JOIN fragrance_brands fb ON f.brand_id = fb.id
  WHERE 
    -- Text search
    (query_text IS NULL OR (
      f.search_vector @@ plainto_tsquery('english', query_text) OR
      f.name ILIKE '%' || query_text || '%' OR
      f.description ILIKE '%' || query_text || '%'
    ))
    -- Scent family filter
    AND (scent_families IS NULL OR f.scent_family = ANY(scent_families))
    -- Intensity filters
    AND (intensity_min IS NULL OR f.intensity_score >= intensity_min)
    AND (intensity_max IS NULL OR f.intensity_score <= intensity_max)
    -- Longevity filter
    AND (longevity_min IS NULL OR f.longevity_hours >= longevity_min)
    -- Occasion filter
    AND (occasions IS NULL OR f.recommended_occasions && occasions)
    -- Season filter  
    AND (seasons IS NULL OR f.recommended_seasons && seasons)
    -- Sample availability
    AND (NOT sample_available_only OR f.sample_available = true)
  ORDER BY relevance_score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- UTILITY AND MAINTENANCE FUNCTIONS
-- =============================================================================

-- 8. Refresh embedding cache for batch updates
CREATE OR REPLACE FUNCTION refresh_embedding_cache(
  embedding_version TEXT DEFAULT 'voyage-3.5',
  batch_size INTEGER DEFAULT 100
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  processed_count INTEGER := 0;
  error_count INTEGER := 0;
  result JSON;
BEGIN
  -- This would typically call out to an external embedding service
  -- For now, return status information
  
  SELECT json_build_object(
    'embedding_version', embedding_version,
    'batch_size', batch_size,
    'status', 'pending',
    'message', 'Embedding refresh requires external service integration'
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 9. Database health and performance monitoring
CREATE OR REPLACE FUNCTION get_database_health()
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'timestamp', NOW(),
    'table_stats', (
      SELECT json_object_agg(table_name, row_count)
      FROM (
        SELECT 'fragrances' as table_name, COUNT(*) as row_count FROM fragrances
        UNION ALL
        SELECT 'user_collections', COUNT(*) FROM user_collections  
        UNION ALL
        SELECT 'user_preferences', COUNT(*) FROM user_preferences
        UNION ALL  
        SELECT 'user_fragrance_interactions', COUNT(*) FROM user_fragrance_interactions
        UNION ALL
        SELECT 'fragrance_embeddings', COUNT(*) FROM fragrance_embeddings
      ) counts
    ),
    'index_usage', (
      SELECT json_agg(
        json_build_object(
          'table', schemaname || '.' || tablename,
          'index', indexname, 
          'size', pg_size_pretty(pg_relation_size(indexname::regclass))
        )
      )
      FROM pg_indexes 
      WHERE schemaname = 'public'
        AND tablename IN ('fragrances', 'user_collections', 'user_preferences', 
                         'user_fragrance_interactions', 'fragrance_embeddings')
      LIMIT 10
    ),
    'rls_status', (
      SELECT json_object_agg(tablename, rowsecurity)
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('fragrances', 'fragrance_brands', 'user_collections',
                         'user_preferences', 'user_fragrance_interactions', 'fragrance_embeddings')
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION PERMISSIONS AND SECURITY
-- =============================================================================

-- Grant execute permissions to authenticated users for read functions
GRANT EXECUTE ON FUNCTION get_similar_fragrances TO authenticated;
GRANT EXECUTE ON FUNCTION match_fragrances TO authenticated;
GRANT EXECUTE ON FUNCTION multi_vector_similarity TO authenticated;
GRANT EXECUTE ON FUNCTION get_collection_insights TO authenticated;
GRANT EXECUTE ON FUNCTION get_collection_timeline TO authenticated;
GRANT EXECUTE ON FUNCTION get_personalized_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION advanced_fragrance_search TO authenticated;

-- Restrict maintenance functions to service role
GRANT EXECUTE ON FUNCTION refresh_embedding_cache TO service_role;
GRANT EXECUTE ON FUNCTION get_database_health TO service_role;

-- Add function documentation
COMMENT ON FUNCTION get_similar_fragrances IS 'Find similar fragrances using vector embeddings';
COMMENT ON FUNCTION get_collection_insights IS 'Generate comprehensive analytics for user collection';
COMMENT ON FUNCTION get_personalized_recommendations IS 'AI-powered personalized fragrance recommendations';
COMMENT ON FUNCTION advanced_fragrance_search IS 'Multi-faceted search with filters and ranking';