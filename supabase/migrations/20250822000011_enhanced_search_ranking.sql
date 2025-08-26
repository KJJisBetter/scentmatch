-- ENHANCED SEARCH RANKING MIGRATION
-- Date: 2025-08-22
-- Purpose: Implement beginner-friendly search that shows main fragrances first
-- Addresses: Sauvage search showing 20 random results instead of actual Sauvage

-- ============================================================================
-- STEP 1: CREATE ENHANCED SEARCH FUNCTION WITH RANKING
-- ============================================================================

-- Enhanced search function that prioritizes main variants and popular fragrances
CREATE OR REPLACE FUNCTION search_fragrances_beginner_friendly(
  query_text TEXT,
  user_gender TEXT DEFAULT 'unisex',
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
  fragrance_id TEXT,
  name TEXT,
  brand_name TEXT,
  gender TEXT,
  variant_type TEXT,
  is_main_variant BOOLEAN,
  beginner_friendly BOOLEAN,
  search_ranking_score DECIMAL,
  popularity_score DECIMAL,
  rating_value DECIMAL,
  rating_count INTEGER,
  sample_price_usd INTEGER,
  match_type TEXT,
  similarity_score DECIMAL
) AS $$
DECLARE
  normalized_query TEXT;
BEGIN
  -- Normalize the search query
  normalized_query := LOWER(TRIM(query_text));
  
  RETURN QUERY
  WITH search_matches AS (
    SELECT 
      f.id as fragrance_id,
      f.name,
      fb.name as brand_name,
      f.gender,
      f.variant_type,
      f.is_main_variant,
      f.beginner_friendly,
      f.search_ranking_score,
      f.popularity_score,
      f.rating_value,
      f.rating_count,
      f.sample_price_usd,
      CASE 
        -- Exact brand + name match (highest priority)
        WHEN LOWER(fb.name || ' ' || f.name) = normalized_query THEN 'exact_full'
        WHEN LOWER(f.name) = normalized_query THEN 'exact_name'
        WHEN LOWER(fb.name) = normalized_query THEN 'exact_brand'
        
        -- Partial matches
        WHEN LOWER(f.name) LIKE normalized_query || '%' THEN 'name_prefix'
        WHEN LOWER(fb.name) LIKE normalized_query || '%' THEN 'brand_prefix'
        WHEN LOWER(f.name) LIKE '%' || normalized_query || '%' THEN 'name_contains'
        WHEN LOWER(fb.name) LIKE '%' || normalized_query || '%' THEN 'brand_contains'
        
        -- Fuzzy matches using similarity
        WHEN similarity(LOWER(f.name), normalized_query) > 0.3 THEN 'fuzzy_name'
        WHEN similarity(LOWER(fb.name), normalized_query) > 0.3 THEN 'fuzzy_brand'
        
        ELSE 'other'
      END as match_type,
      
      -- Calculate similarity score
      CASE 
        WHEN LOWER(fb.name || ' ' || f.name) = normalized_query THEN 1.0
        WHEN LOWER(f.name) = normalized_query THEN 0.95
        WHEN LOWER(fb.name) = normalized_query THEN 0.90
        WHEN LOWER(f.name) LIKE normalized_query || '%' THEN 0.85
        WHEN LOWER(fb.name) LIKE normalized_query || '%' THEN 0.80
        WHEN LOWER(f.name) LIKE '%' || normalized_query || '%' THEN 0.70
        WHEN LOWER(fb.name) LIKE '%' || normalized_query || '%' THEN 0.65
        ELSE GREATEST(
          similarity(LOWER(f.name), normalized_query),
          similarity(LOWER(fb.name), normalized_query)
        )
      END as similarity_score
      
    FROM fragrances f
    JOIN fragrance_brands fb ON f.brand_id = fb.id
    WHERE 
      f.is_verified = TRUE
      AND f.sample_available = TRUE
      AND (
        -- Gender filtering
        user_gender = 'unisex' 
        OR f.gender = user_gender 
        OR f.gender = 'unisex'
        OR (user_gender = 'men' AND f.gender = 'men')
        OR (user_gender = 'women' AND f.gender = 'women')
      )
      AND (
        -- Text matching
        LOWER(f.name) LIKE '%' || normalized_query || '%'
        OR LOWER(fb.name) LIKE '%' || normalized_query || '%'
        OR similarity(LOWER(f.name), normalized_query) > 0.2
        OR similarity(LOWER(fb.name), normalized_query) > 0.2
        OR f.search_vector @@ plainto_tsquery('english', query_text)
      )
  ),
  
  ranked_results AS (
    SELECT 
      *,
      -- Calculate final ranking score
      (
        similarity_score * 0.4 +  -- Similarity is important
        (search_ranking_score * 0.3) + -- Overall popularity/quality
        (CASE WHEN is_main_variant THEN 0.2 ELSE 0.0 END) + -- Prefer main variants
        (CASE WHEN beginner_friendly THEN 0.1 ELSE 0.0 END) + -- Beginner bonus
        (CASE 
          WHEN match_type = 'exact_full' THEN 0.3
          WHEN match_type = 'exact_name' THEN 0.25
          WHEN match_type = 'exact_brand' THEN 0.20
          WHEN match_type = 'name_prefix' THEN 0.15
          WHEN match_type = 'brand_prefix' THEN 0.10
          ELSE 0.0
        END) -- Match type bonus
      ) as final_ranking_score
    FROM search_matches
  )
  
  SELECT 
    fragrance_id,
    name,
    brand_name,
    gender,
    variant_type,
    is_main_variant,
    beginner_friendly,
    search_ranking_score,
    popularity_score,
    rating_value,
    rating_count,
    sample_price_usd,
    match_type,
    similarity_score
  FROM ranked_results
  ORDER BY 
    final_ranking_score DESC,
    is_main_variant DESC,
    popularity_score DESC,
    rating_value DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: CREATE BRAND-SPECIFIC SEARCH FUNCTION
-- ============================================================================

-- Function specifically for finding brand variants (like "Sauvage" → all Sauvage variants)
CREATE OR REPLACE FUNCTION search_brand_variants(
  brand_or_fragrance_name TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  fragrance_id TEXT,
  name TEXT,
  brand_name TEXT,
  variant_type TEXT,
  is_main_variant BOOLEAN,
  popularity_score DECIMAL,
  rating_value DECIMAL,
  sample_price_usd INTEGER,
  variant_order INTEGER
) AS $$
DECLARE
  normalized_query TEXT;
  target_brand TEXT;
  target_fragrance TEXT;
BEGIN
  normalized_query := LOWER(TRIM(brand_or_fragrance_name));
  
  -- First, try to identify if this is a known fragrance name
  SELECT fb.name, f.name INTO target_brand, target_fragrance
  FROM fragrances f
  JOIN fragrance_brands fb ON f.brand_id = fb.id
  WHERE LOWER(f.name) = normalized_query
    OR LOWER(fb.name || ' ' || f.name) = normalized_query
    OR similarity(LOWER(f.name), normalized_query) > 0.8
  ORDER BY f.is_main_variant DESC, f.popularity_score DESC
  LIMIT 1;
  
  -- If we found a fragrance, return all its variants
  IF target_fragrance IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      f.id as fragrance_id,
      f.name,
      fb.name as brand_name,
      f.variant_type,
      f.is_main_variant,
      f.popularity_score,
      f.rating_value,
      f.sample_price_usd,
      CASE 
        WHEN f.is_main_variant THEN 1
        WHEN f.variant_type = 'edp' THEN 2
        WHEN f.variant_type = 'edt' THEN 3
        WHEN f.variant_type = 'parfum' THEN 4
        WHEN f.variant_type = 'intense' THEN 5
        ELSE 6
      END as variant_order
    FROM fragrances f
    JOIN fragrance_brands fb ON f.brand_id = fb.id
    WHERE 
      fb.name = target_brand
      AND LOWER(f.name) LIKE '%' || LOWER(target_fragrance) || '%'
      AND f.is_verified = TRUE
    ORDER BY variant_order, f.popularity_score DESC
    LIMIT limit_count;
  ELSE
    -- If no specific fragrance found, search broadly
    RETURN QUERY
    SELECT 
      f.id as fragrance_id,
      f.name,
      fb.name as brand_name,
      f.variant_type,
      f.is_main_variant,
      f.popularity_score,
      f.rating_value,
      f.sample_price_usd,
      CASE 
        WHEN f.is_main_variant THEN 1
        WHEN f.variant_type = 'edp' THEN 2
        WHEN f.variant_type = 'edt' THEN 3
        WHEN f.variant_type = 'parfum' THEN 4
        ELSE 5
      END as variant_order
    FROM fragrances f
    JOIN fragrance_brands fb ON f.brand_id = fb.id
    WHERE 
      (LOWER(f.name) LIKE '%' || normalized_query || '%'
       OR LOWER(fb.name) LIKE '%' || normalized_query || '%')
      AND f.is_verified = TRUE
    ORDER BY 
      f.is_main_variant DESC,
      variant_order,
      f.popularity_score DESC
    LIMIT limit_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: CREATE BEGINNER RECOMMENDATION FUNCTION
-- ============================================================================

-- Function to get beginner-friendly recommendations with educational context
CREATE OR REPLACE FUNCTION get_beginner_recommendations(
  user_gender TEXT DEFAULT 'unisex',
  experience_level TEXT DEFAULT 'beginner',
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  fragrance_id TEXT,
  name TEXT,
  brand_name TEXT,
  variant_type TEXT,
  short_description TEXT,
  why_beginner_friendly TEXT,
  fragrance_family TEXT,
  main_accords TEXT[],
  rating_value DECIMAL,
  rating_count INTEGER,
  sample_price_usd INTEGER,
  popularity_rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as fragrance_id,
    f.name,
    fb.name as brand_name,
    f.variant_type,
    f.short_description,
    CASE 
      WHEN f.beginner_friendly THEN 'Perfect for beginners - well-loved and easy to wear'
      WHEN f.popularity_score > 20 THEN 'Very popular choice - trusted by many'
      WHEN f.rating_value > 4.0 AND f.rating_count > 500 THEN 'Highly rated with lots of reviews'
      ELSE 'Quality fragrance with good reputation'
    END as why_beginner_friendly,
    f.fragrance_family,
    f.main_accords,
    f.rating_value,
    f.rating_count,
    f.sample_price_usd,
    ROW_NUMBER() OVER (ORDER BY f.search_ranking_score DESC, f.popularity_score DESC)::INTEGER as popularity_rank
  FROM fragrances f
  JOIN fragrance_brands fb ON f.brand_id = fb.id
  WHERE 
    f.is_verified = TRUE
    AND f.sample_available = TRUE
    AND (
      user_gender = 'unisex' 
      OR f.gender = user_gender 
      OR f.gender = 'unisex'
    )
    AND (
      f.beginner_friendly = TRUE
      OR f.popularity_score > 15
      OR (f.rating_value > 4.0 AND f.rating_count > 300)
    )
  ORDER BY 
    f.beginner_friendly DESC,
    f.search_ranking_score DESC,
    f.popularity_score DESC,
    f.rating_value DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: UPDATE SEARCH VECTOR GENERATION
-- ============================================================================

-- Enhanced search vector generation that includes brand and variant information
CREATE OR REPLACE FUNCTION update_fragrance_search_vector_enhanced()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE((SELECT name FROM fragrance_brands WHERE id = NEW.brand_id), '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.variant_type, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.main_accords, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.fragrance_family, '')), 'D');
  
  -- Update search ranking score
  NEW.search_ranking_score := calculate_search_ranking_score(
    NEW.popularity_score,
    NEW.rating_value,
    NEW.rating_count,
    NEW.trending_score,
    NEW.is_main_variant,
    NEW.beginner_friendly
  );
  
  NEW.normalized_id := normalize_fragrance_id(NEW.id);
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to use enhanced search vector
DROP TRIGGER IF EXISTS trigger_update_fragrance_search_vector ON fragrances;
CREATE TRIGGER trigger_update_fragrance_search_vector
  BEFORE INSERT OR UPDATE ON fragrances
  FOR EACH ROW EXECUTE FUNCTION update_fragrance_search_vector_enhanced();

-- ============================================================================
-- STEP 5: CREATE SEARCH ANALYTICS TRACKING
-- ============================================================================

-- Table to track search queries and results for optimization
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_text TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_token TEXT,
  results_count INTEGER DEFAULT 0,
  clicked_result_id TEXT REFERENCES fragrances(id) ON DELETE SET NULL,
  clicked_result_position INTEGER,
  search_method TEXT,
  filters_applied JSONB DEFAULT '{}'::JSONB,
  response_time_ms INTEGER,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for search analytics
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query_text);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_clicked_result ON search_analytics(clicked_result_id);

-- ============================================================================
-- STEP 6: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION search_fragrances_beginner_friendly TO authenticated;
GRANT EXECUTE ON FUNCTION search_fragrances_beginner_friendly TO anon;
GRANT EXECUTE ON FUNCTION search_brand_variants TO authenticated;
GRANT EXECUTE ON FUNCTION search_brand_variants TO anon;
GRANT EXECUTE ON FUNCTION get_beginner_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_beginner_recommendations TO anon;

-- Enable RLS on search analytics
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Search analytics policies
CREATE POLICY "Users can access own search analytics" ON search_analytics
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role manages search analytics" ON search_analytics
  FOR ALL TO service_role USING (true);

-- ============================================================================
-- STEP 7: UPDATE ALL EXISTING FRAGRANCES WITH NEW SYSTEM
-- ============================================================================

-- Update search vectors for all existing fragrances
UPDATE fragrances 
SET updated_at = NOW()
WHERE search_vector IS NULL OR normalized_id IS NULL;

-- Mark popular beginner-friendly fragrances
UPDATE fragrances 
SET beginner_friendly = TRUE
WHERE (
  popularity_score > 20 
  OR (rating_value > 4.0 AND rating_count > 500)
  OR id IN (
    'dior_sauvage_edp',
    'dior_sauvage_edt', 
    'chanel_bleu_de_chanel_edp',
    'versace_eros_edt',
    'tom_ford_oud_wood',
    'acqua_di_gio_profumo'
  )
);

-- ============================================================================
-- FINAL VALIDATION
-- ============================================================================

DO $$
DECLARE
  sauvage_count INTEGER;
  function_exists BOOLEAN;
BEGIN
  -- Check if Sauvage variants exist and are properly configured
  SELECT COUNT(*) INTO sauvage_count
  FROM fragrances f
  JOIN fragrance_brands fb ON f.brand_id = fb.id
  WHERE LOWER(f.name) LIKE '%sauvage%' 
    AND fb.name = 'Dior'
    AND f.is_verified = TRUE;
  
  IF sauvage_count = 0 THEN
    RAISE EXCEPTION 'Enhanced search migration failed: No Sauvage variants found';
  END IF;
  
  -- Check if search function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'search_fragrances_beginner_friendly'
  ) INTO function_exists;
  
  IF NOT function_exists THEN
    RAISE EXCEPTION 'Enhanced search migration failed: beginner search function not created';
  END IF;
  
  -- Test the search function with Sauvage
  PERFORM search_fragrances_beginner_friendly('sauvage', 'men', 5);
  
  RAISE NOTICE 'Enhanced search ranking migration completed successfully!';
  RAISE NOTICE 'Functions created: search_fragrances_beginner_friendly, search_brand_variants, get_beginner_recommendations';
  RAISE NOTICE 'Search analytics tracking enabled';
  RAISE NOTICE 'Sauvage search should now show actual Sauvage variants first';
  RAISE NOTICE 'Found % Sauvage variants in database', sauvage_count;
END $$;