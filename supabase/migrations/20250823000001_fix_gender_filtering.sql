-- Migration: Fix gender filtering in get_quiz_recommendations
-- Issue: RPC function expects 'for men'/'for women' but database has 'men'/'women'
-- Critical fix for gender recommendation accuracy

-- Drop existing function
DROP FUNCTION IF EXISTS get_quiz_recommendations(TEXT, INTEGER);

-- Recreate with correct gender filtering logic
CREATE OR REPLACE FUNCTION get_quiz_recommendations(
  target_session_id TEXT,
  max_results INTEGER DEFAULT 8
)
RETURNS TABLE (
  fragrance_id TEXT,
  match_score DECIMAL,
  quiz_reasoning TEXT,
  archetype_alignment DECIMAL
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  personality_data RECORD;
  session_uuid UUID;
BEGIN
  -- Find session UUID from TEXT token
  SELECT id INTO session_uuid
  FROM user_quiz_sessions
  WHERE session_token = target_session_id;
  
  IF session_uuid IS NULL THEN
    RETURN; -- No session found
  END IF;

  -- Get personality profile for session
  SELECT 
    personality_type,
    confidence_score,
    dimension_fresh,
    dimension_floral,
    dimension_oriental,
    dimension_woody
  INTO personality_data
  FROM user_fragrance_personalities ufp
  WHERE ufp.session_id = session_uuid
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN; -- No personality profile found
  END IF;

  -- Return recommendations based on personality with CORRECTED gender filtering
  RETURN QUERY
  WITH user_gender AS (
    SELECT answer_value as gender_pref
    FROM user_quiz_responses
    WHERE session_id = session_uuid 
      AND question_id = 'gender_preference'
    LIMIT 1
  )
  SELECT 
    f.id::TEXT,
    (0.8 + RANDOM() * 0.2)::DECIMAL as match_score,
    CASE personality_data.personality_type
      WHEN 'romantic' THEN 'Perfect floral match for your romantic style'
      WHEN 'sophisticated' THEN 'Complex oriental-woody for your sophisticated taste'
      WHEN 'natural' THEN 'Fresh, natural scent aligned with your preferences'
      ELSE 'Recommended based on your quiz results'
    END as quiz_reasoning,
    (0.7 + RANDOM() * 0.3)::DECIMAL as archetype_alignment
  FROM fragrances f
  LEFT JOIN fragrance_brands fb ON f.brand_id = fb.id
  CROSS JOIN user_gender ug
  WHERE f.sample_available = true
    AND (
      -- FIXED: Match actual database gender values
      ug.gender_pref = 'unisex' OR
      (ug.gender_pref = 'men' AND f.gender IN ('men', 'unisex')) OR
      (ug.gender_pref = 'women' AND f.gender IN ('women', 'unisex'))
    )
  ORDER BY 
    -- Prioritize by personality alignment
    CASE personality_data.personality_type
      WHEN 'romantic' THEN 
        CASE WHEN 'floral' = ANY(f.accords) THEN 100 ELSE 50 END
      WHEN 'sophisticated' THEN
        CASE WHEN 'oriental' = ANY(f.accords) OR 'woody' = ANY(f.accords) THEN 100 ELSE 50 END
      WHEN 'natural' THEN
        CASE WHEN 'fresh' = ANY(f.accords) OR 'green' = ANY(f.accords) THEN 100 ELSE 50 END
      ELSE 60
    END DESC,
    RANDOM() -- Add variety
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_quiz_recommendations(TEXT, INTEGER) TO authenticated;