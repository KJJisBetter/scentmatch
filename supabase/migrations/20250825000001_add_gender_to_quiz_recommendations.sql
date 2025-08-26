-- Migration: Add gender field to get_quiz_recommendations function return
-- Issue: UI components expect gender field but RPC function doesn't return it
-- This eliminates the need for a separate fragrance details query

-- Drop existing function
DROP FUNCTION IF EXISTS get_quiz_recommendations(TEXT, INTEGER);

-- Recreate with gender field included in return
CREATE OR REPLACE FUNCTION get_quiz_recommendations(
  target_session_id TEXT,
  max_results INTEGER DEFAULT 8
)
RETURNS TABLE (
  fragrance_id TEXT,
  match_score DECIMAL,
  quiz_reasoning TEXT,
  archetype_alignment DECIMAL,
  gender TEXT,
  name TEXT,
  brand_name TEXT,
  sample_available BOOLEAN,
  sample_price_usd DECIMAL,
  image_url TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  personality_data RECORD;
  session_uuid UUID;
  user_gender_pref TEXT;
BEGIN
  -- Find session UUID from TEXT token
  SELECT id INTO session_uuid
  FROM user_quiz_sessions
  WHERE session_token = target_session_id;
  
  IF session_uuid IS NULL THEN
    RAISE EXCEPTION 'Quiz session not found: %', target_session_id;
  END IF;

  -- CRITICAL: Validate gender preference exists (MANDATORY REQUIREMENT)
  IF NOT validate_gender_preference_exists(target_session_id) THEN
    RAISE EXCEPTION 'Gender preference is required for recommendations. Session: %', target_session_id;
  END IF;

  -- Get gender preference (guaranteed to exist after validation)
  SELECT answer_value INTO user_gender_pref
  FROM user_quiz_responses
  WHERE session_id = session_uuid 
    AND question_id = 'gender_preference'
  LIMIT 1;

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

  -- Return recommendations with all needed fields (including gender)
  RETURN QUERY
  SELECT 
    f.id::TEXT,
    (0.8 + RANDOM() * 0.2)::DECIMAL as match_score,
    CASE personality_data.personality_type
      WHEN 'romantic' THEN 'Perfect floral match for your romantic style'
      WHEN 'sophisticated' THEN 'Complex oriental-woody for your sophisticated taste'  
      WHEN 'natural' THEN 'Fresh, natural scent aligned with your preferences'
      ELSE 'Recommended based on your quiz results'
    END as quiz_reasoning,
    (0.7 + RANDOM() * 0.3)::DECIMAL as archetype_alignment,
    f.gender,
    f.name,
    fb.name as brand_name,
    f.sample_available,
    f.sample_price_usd,
    f.image_url
  FROM fragrances f
  LEFT JOIN fragrance_brands fb ON f.brand_id = fb.id
  WHERE f.sample_available = true
    AND (
      -- MANDATORY GENDER FILTERING - NO EXCEPTIONS
      (user_gender_pref = 'men' AND f.gender IN ('men', 'unisex')) OR
      (user_gender_pref = 'women' AND f.gender IN ('women', 'unisex')) OR  
      (user_gender_pref = 'unisex' AND f.gender = 'unisex')
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

-- Add helpful comment
COMMENT ON FUNCTION get_quiz_recommendations(TEXT, INTEGER) IS 
'Returns personalized fragrance recommendations with all needed fields including gender for UI display. Eliminates need for separate fragrance details query.';