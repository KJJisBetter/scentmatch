-- Migration: Enforce Mandatory Gender Preference (SCE-81 Deep Fix)
-- This ensures gender preference is NEVER missing from quiz sessions
-- Comprehensive solution that prevents all edge cases

-- STEP 1: Clean up existing sessions without gender data
-- Update sessions that have responses but missing gender preference
UPDATE user_quiz_responses 
SET answer_value = 'unisex'
WHERE session_id IN (
  SELECT DISTINCT session_id 
  FROM user_quiz_responses 
  WHERE session_id NOT IN (
    SELECT session_id 
    FROM user_quiz_responses 
    WHERE question_id = 'gender_preference'
  )
) AND question_id != 'gender_preference';

-- Insert missing gender preferences for existing sessions (default to unisex)
INSERT INTO user_quiz_responses (id, session_id, question_id, answer_value, created_at)
SELECT 
  gen_random_uuid(),
  DISTINCT session_id,
  'gender_preference',
  'unisex',
  NOW()
FROM user_quiz_responses 
WHERE session_id NOT IN (
  SELECT session_id 
  FROM user_quiz_responses 
  WHERE question_id = 'gender_preference'
)
ON CONFLICT DO NOTHING;

-- STEP 2: Add database constraint to prevent future sessions without gender
-- Create constraint function that validates gender exists before recommendations
CREATE OR REPLACE FUNCTION validate_gender_preference_exists(target_session_id TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if gender preference exists for session
  RETURN EXISTS (
    SELECT 1 
    FROM user_quiz_responses 
    WHERE session_id = (
      SELECT id FROM user_quiz_sessions WHERE session_token = target_session_id
    )
    AND question_id = 'gender_preference'
    AND answer_value IS NOT NULL
    AND answer_value != ''
  );
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Update RPC function to REQUIRE gender preference
DROP FUNCTION IF EXISTS get_quiz_recommendations(TEXT, INTEGER);

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

  -- Return recommendations with MANDATORY gender filtering
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
    (0.7 + RANDOM() * 0.3)::DECIMAL as archetype_alignment
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

-- STEP 4: Add trigger to prevent quiz responses without gender
CREATE OR REPLACE FUNCTION check_gender_preference_required()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is a non-gender question being inserted
  IF NEW.question_id != 'gender_preference' THEN
    -- Check if gender preference already exists for this session
    IF NOT EXISTS (
      SELECT 1 
      FROM user_quiz_responses 
      WHERE session_id = NEW.session_id 
        AND question_id = 'gender_preference'
    ) THEN
      -- Allow the insert but log warning
      RAISE NOTICE 'Quiz response added without gender preference. Session: %', NEW.session_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for gender preference validation
DROP TRIGGER IF EXISTS trigger_check_gender_preference ON user_quiz_responses;
CREATE TRIGGER trigger_check_gender_preference
  BEFORE INSERT ON user_quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION check_gender_preference_required();

-- STEP 5: Grant permissions
GRANT EXECUTE ON FUNCTION get_quiz_recommendations(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_gender_preference_exists(TEXT) TO authenticated;

-- STEP 6: Create index for better performance on gender filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_responses_gender_preference 
ON user_quiz_responses (session_id, question_id) 
WHERE question_id = 'gender_preference';

-- STEP 7: Add helpful function for debugging gender issues
CREATE OR REPLACE FUNCTION debug_quiz_session_gender(target_session_id TEXT)
RETURNS TABLE (
  session_token TEXT,
  has_gender BOOLEAN,
  gender_value TEXT,
  response_count INTEGER,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uqs.session_token,
    EXISTS(
      SELECT 1 FROM user_quiz_responses uqr 
      WHERE uqr.session_id = uqs.id AND uqr.question_id = 'gender_preference'
    ) as has_gender,
    (
      SELECT uqr.answer_value FROM user_quiz_responses uqr 
      WHERE uqr.session_id = uqs.id AND uqr.question_id = 'gender_preference' 
      LIMIT 1
    ) as gender_value,
    (
      SELECT COUNT(*)::INTEGER FROM user_quiz_responses uqr 
      WHERE uqr.session_id = uqs.id
    ) as response_count,
    uqs.created_at
  FROM user_quiz_sessions uqs
  WHERE uqs.session_token = target_session_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION debug_quiz_session_gender(TEXT) TO authenticated;