-- Fix Collection Quiz Attribution - Critical Fix for Collection Platform
-- Date: 2025-08-25
-- Purpose: Add quiz session attribution to user_collections and fix ON CONFLICT issues

-- ============================================================================
-- STEP 1: ADD QUIZ SESSION ATTRIBUTION TO USER_COLLECTIONS
-- ============================================================================

-- Add quiz_session_token column to user_collections for attribution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_collections' AND column_name = 'quiz_session_token'
  ) THEN
    ALTER TABLE user_collections ADD COLUMN quiz_session_token TEXT;
    
    -- Add index for quiz attribution queries
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_collections_quiz_token 
      ON user_collections(quiz_session_token);
    
    RAISE NOTICE 'Added quiz_session_token column to user_collections with index';
  ELSE
    RAISE NOTICE 'quiz_session_token column already exists in user_collections';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: FIX USER_QUIZ_RESPONSES UNIQUE CONSTRAINT
-- ============================================================================

-- Ensure proper unique constraint exists for ON CONFLICT
DO $$
BEGIN
  -- Check if the unique constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_quiz_responses' 
    AND constraint_name = 'user_quiz_responses_session_id_question_id_key'
  ) THEN
    -- Add the unique constraint that's referenced in the ON CONFLICT clause
    ALTER TABLE user_quiz_responses 
    ADD CONSTRAINT user_quiz_responses_session_id_question_id_key 
    UNIQUE (session_id, question_id);
    
    RAISE NOTICE 'Added unique constraint for session_id, question_id';
  ELSE
    RAISE NOTICE 'Unique constraint already exists for session_id, question_id';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: ENHANCE USER_COLLECTIONS FOR COLLECTION ANALYTICS
-- ============================================================================

-- Add additional columns needed for collection analytics if missing
DO $$
BEGIN
  -- Add social_metadata column for social features
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_collections' AND column_name = 'social_metadata'
  ) THEN
    ALTER TABLE user_collections ADD COLUMN social_metadata JSONB DEFAULT '{}';
    RAISE NOTICE 'Added social_metadata column to user_collections';
  END IF;

  -- Add engagement_score column for gamification
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_collections' AND column_name = 'engagement_score'
  ) THEN
    ALTER TABLE user_collections ADD COLUMN engagement_score INTEGER DEFAULT 0;
    RAISE NOTICE 'Added engagement_score column to user_collections';
  END IF;

  -- Add tags column for organization features  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_collections' AND column_name = 'tags'
  ) THEN
    ALTER TABLE user_collections ADD COLUMN tags TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added tags column to user_collections';
  END IF;

  -- Add category_id column for collection organization
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_collections' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE user_collections ADD COLUMN category_id TEXT;
    RAISE NOTICE 'Added category_id column to user_collections';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Indexes for collection analytics and quiz attribution
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_collections_analytics_combo
  ON user_collections(user_id, collection_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_collections_guest_session_token
  ON user_collections(guest_session_id, quiz_session_token) 
  WHERE guest_session_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_collections_tags_gin
  ON user_collections USING gin(tags)
  WHERE array_length(tags, 1) > 0;

-- Index for social metadata queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_collections_social_metadata_gin
  ON user_collections USING gin(social_metadata)
  WHERE social_metadata != '{}';

-- ============================================================================
-- STEP 5: UPDATE ROW LEVEL SECURITY FOR NEW COLUMNS
-- ============================================================================

-- Ensure RLS policies cover new columns (they should inherit from existing table policies)
-- No changes needed as existing policies use table-level access

-- ============================================================================
-- STEP 6: CREATE COLLECTION ANALYTICS HELPER FUNCTIONS
-- ============================================================================

-- Function to get collection stats with quiz attribution
CREATE OR REPLACE FUNCTION get_collection_stats_with_attribution(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_items INTEGER;
  quiz_attributed_items INTEGER;
  families_explored INTEGER;
  completion_rate INTEGER;
  average_rating DECIMAL;
  most_recent_date TIMESTAMP;
BEGIN
  -- Get basic collection stats
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE quiz_session_token IS NOT NULL),
    COUNT(DISTINCT f.scent_family) FILTER (WHERE f.scent_family IS NOT NULL),
    ROUND(COUNT(*) FILTER (WHERE rating IS NOT NULL OR (notes IS NOT NULL AND length(trim(notes)) > 0)) * 100.0 / GREATEST(COUNT(*), 1)),
    ROUND(AVG(rating) FILTER (WHERE rating IS NOT NULL), 1),
    MAX(uc.created_at)
  INTO 
    total_items,
    quiz_attributed_items,
    families_explored,
    completion_rate,
    average_rating,
    most_recent_date
  FROM user_collections uc
  LEFT JOIN fragrances f ON uc.fragrance_id = f.id
  WHERE uc.user_id = target_user_id AND uc.collection_type = 'saved';
  
  -- Build result JSON
  result := jsonb_build_object(
    'total_items', COALESCE(total_items, 0),
    'quiz_attributed_items', COALESCE(quiz_attributed_items, 0),
    'families_explored', COALESCE(families_explored, 0),
    'completion_rate', COALESCE(completion_rate, 0),
    'average_rating', COALESCE(average_rating, 0),
    'total_rated', (SELECT COUNT(*) FROM user_collections WHERE user_id = target_user_id AND rating IS NOT NULL),
    'most_recent', COALESCE(most_recent_date, NULL),
    'quiz_attribution_rate', CASE 
      WHEN total_items > 0 THEN ROUND(quiz_attributed_items * 100.0 / total_items) 
      ELSE 0 
    END
  );
  
  RETURN result;
END;
$$;

-- Function to get collection insights with performance optimization
CREATE OR REPLACE FUNCTION get_collection_insights_fast(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  scent_family_breakdown JSONB;
  collection_timeline JSONB;
  engagement_metrics JSONB;
BEGIN
  -- Get scent family breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'family', scent_family,
      'count', family_count,
      'percentage', ROUND(family_count * 100.0 / total_count, 1)
    )
  ) INTO scent_family_breakdown
  FROM (
    SELECT 
      f.scent_family,
      COUNT(*) as family_count,
      (SELECT COUNT(*) FROM user_collections WHERE user_id = target_user_id AND collection_type = 'saved') as total_count
    FROM user_collections uc
    JOIN fragrances f ON uc.fragrance_id = f.id
    WHERE uc.user_id = target_user_id 
    AND uc.collection_type = 'saved' 
    AND f.scent_family IS NOT NULL
    GROUP BY f.scent_family
    ORDER BY COUNT(*) DESC
    LIMIT 5
  ) families;

  -- Get collection timeline (last 10 additions)
  SELECT jsonb_agg(
    jsonb_build_object(
      'fragrance_name', f.name,
      'brand_name', fb.name,
      'added_at', uc.created_at,
      'rating', uc.rating,
      'quiz_attributed', (uc.quiz_session_token IS NOT NULL)
    )
  ) INTO collection_timeline
  FROM user_collections uc
  JOIN fragrances f ON uc.fragrance_id = f.id
  JOIN fragrance_brands fb ON f.brand_id = fb.id
  WHERE uc.user_id = target_user_id AND uc.collection_type = 'saved'
  ORDER BY uc.created_at DESC
  LIMIT 10;

  -- Calculate engagement metrics
  SELECT jsonb_build_object(
    'days_since_first_item', COALESCE(EXTRACT(DAY FROM (NOW() - MIN(created_at)))::INTEGER, 0),
    'items_per_week', CASE 
      WHEN EXTRACT(DAY FROM (NOW() - MIN(created_at))) > 0 
      THEN ROUND(COUNT(*) * 7.0 / EXTRACT(DAY FROM (NOW() - MIN(created_at))), 1)
      ELSE COUNT(*)
    END,
    'rating_frequency', ROUND(COUNT(*) FILTER (WHERE rating IS NOT NULL) * 100.0 / GREATEST(COUNT(*), 1), 1)
  ) INTO engagement_metrics
  FROM user_collections
  WHERE user_id = target_user_id AND collection_type = 'saved';

  -- Combine all insights
  result := jsonb_build_object(
    'scent_family_breakdown', COALESCE(scent_family_breakdown, '[]'::jsonb),
    'collection_timeline', COALESCE(collection_timeline, '[]'::jsonb),
    'engagement_metrics', COALESCE(engagement_metrics, '{}'::jsonb),
    'generated_at', NOW()
  );

  RETURN result;
END;
$$;

-- ============================================================================
-- STEP 7: GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION get_collection_stats_with_attribution(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_collection_insights_fast(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_collection_stats_with_attribution(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_collection_insights_fast(UUID) TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Collection Quiz Attribution migration completed successfully';
  RAISE NOTICE 'Added quiz_session_token column to user_collections';
  RAISE NOTICE 'Fixed ON CONFLICT constraint for user_quiz_responses';
  RAISE NOTICE 'Added collection analytics helper functions';
  RAISE NOTICE 'Created performance-optimized indexes';
END $$;