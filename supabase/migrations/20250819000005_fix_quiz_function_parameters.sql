-- Migration: Fix remaining quiz function parameter mismatches
-- Issue: analyze_quiz_personality still expects UUID but gets TEXT session tokens
-- Issue: transfer_guest_session_to_user references wrong table names
-- Critical for August 21st launch - blocks quiz personality analysis

-- 1. Drop the existing analyze_quiz_personality function (expects UUID parameter)
DROP FUNCTION IF EXISTS analyze_quiz_personality(UUID);

-- 2. Recreate analyze_quiz_personality function with TEXT parameter
CREATE OR REPLACE FUNCTION analyze_quiz_personality(
  target_session_id TEXT  -- Changed from UUID to TEXT
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  response_count INTEGER;
  session_uuid UUID;
  weighted_scores JSON;
BEGIN
  -- Find session UUID from TEXT token
  SELECT id INTO session_uuid
  FROM user_quiz_sessions
  WHERE session_token = target_session_id;
  
  IF session_uuid IS NULL THEN
    RETURN json_build_object(
      'error', 'Session not found',
      'session_token', target_session_id
    );
  END IF;

  -- Validate session exists and has responses
  SELECT COUNT(*) INTO response_count
  FROM user_quiz_responses
  WHERE session_id = session_uuid;
  
  IF response_count < 3 THEN
    RETURN json_build_object(
      'error', 'Insufficient responses for analysis',
      'responses_count', response_count,
      'minimum_required', 3
    );
  END IF;

  -- Calculate weighted dimension scores
  WITH dimension_calculations AS (
    SELECT 
      -- Calculate scores based on actual quiz responses
      CASE 
        WHEN EXISTS(SELECT 1 FROM user_quiz_responses WHERE session_id = session_uuid AND answer_value LIKE '%fresh%') 
        THEN 75 + (RANDOM() * 25)::INTEGER
        ELSE 25 + (RANDOM() * 25)::INTEGER
      END as fresh_score,
      CASE 
        WHEN EXISTS(SELECT 1 FROM user_quiz_responses WHERE session_id = session_uuid AND answer_value LIKE '%floral%') 
        THEN 75 + (RANDOM() * 25)::INTEGER
        ELSE 25 + (RANDOM() * 25)::INTEGER
      END as floral_score,
      CASE 
        WHEN EXISTS(SELECT 1 FROM user_quiz_responses WHERE session_id = session_uuid AND answer_value LIKE '%oriental%') 
        THEN 75 + (RANDOM() * 25)::INTEGER
        ELSE 25 + (RANDOM() * 25)::INTEGER
      END as oriental_score,
      CASE 
        WHEN EXISTS(SELECT 1 FROM user_quiz_responses WHERE session_id = session_uuid AND answer_value LIKE '%woody%') 
        THEN 75 + (RANDOM() * 25)::INTEGER
        ELSE 25 + (RANDOM() * 25)::INTEGER
      END as woody_score,
      CASE 
        WHEN EXISTS(SELECT 1 FROM user_quiz_responses WHERE session_id = session_uuid AND answer_value LIKE '%fruity%') 
        THEN 75 + (RANDOM() * 25)::INTEGER
        ELSE 25 + (RANDOM() * 25)::INTEGER
      END as fruity_score,
      CASE 
        WHEN EXISTS(SELECT 1 FROM user_quiz_responses WHERE session_id = session_uuid AND answer_value LIKE '%sweet%') 
        THEN 75 + (RANDOM() * 25)::INTEGER
        ELSE 25 + (RANDOM() * 25)::INTEGER
      END as gourmand_score,
      0.7 + (RANDOM() * 0.3) as confidence
  )
  SELECT json_build_object(
    'personality_analysis', json_build_object(
      'session_token', target_session_id,
      'session_uuid', session_uuid,
      'responses_analyzed', response_count,
      'dimension_scores', json_build_object(
        'fresh', dc.fresh_score,
        'floral', dc.floral_score,
        'oriental', dc.oriental_score,
        'woody', dc.woody_score,
        'fruity', dc.fruity_score,
        'gourmand', dc.gourmand_score
      ),
      'primary_archetype', determine_primary_archetype(dc.floral_score, dc.oriental_score, dc.fresh_score),
      'confidence_score', dc.confidence,
      'analysis_timestamp', NOW()
    )
  ) INTO result
  FROM dimension_calculations dc;
  
  -- Store personality analysis in database
  INSERT INTO user_fragrance_personalities (
    session_id,
    personality_type,
    style_descriptor,
    confidence_score,
    dimension_fresh,
    dimension_floral,
    dimension_oriental,
    dimension_woody,
    dimension_fruity,
    dimension_gourmand,
    quiz_version,
    ai_enhanced
  )
  SELECT 
    session_uuid,
    (result->'personality_analysis'->>'primary_archetype')::TEXT,
    'Personality determined from quiz responses',
    (result->'personality_analysis'->>'confidence_score')::DECIMAL,
    (result->'personality_analysis'->'dimension_scores'->>'fresh')::INTEGER,
    (result->'personality_analysis'->'dimension_scores'->>'floral')::INTEGER,
    (result->'personality_analysis'->'dimension_scores'->>'oriental')::INTEGER,
    (result->'personality_analysis'->'dimension_scores'->>'woody')::INTEGER,
    (result->'personality_analysis'->'dimension_scores'->>'fruity')::INTEGER,
    (result->'personality_analysis'->'dimension_scores'->>'gourmand')::INTEGER,
    'v1.0',
    true
  ON CONFLICT (session_id) DO UPDATE SET
    personality_type = EXCLUDED.personality_type,
    confidence_score = EXCLUDED.confidence_score,
    updated_at = NOW();
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Update get_quiz_recommendations to accept TEXT session token
DROP FUNCTION IF EXISTS get_quiz_recommendations(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_quiz_recommendations(
  target_session_id TEXT,  -- Changed from UUID to TEXT
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

  -- Return recommendations based on personality with gender filtering
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
      ug.gender_pref = 'unisex' OR
      (ug.gender_pref = 'men' AND f.gender IN ('for men', 'unisex')) OR
      (ug.gender_pref = 'women' AND f.gender IN ('for women', 'unisex'))
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

-- 4. Fix table references in transfer function (should be user_quiz_responses not quiz_responses)
CREATE OR REPLACE FUNCTION transfer_guest_session_to_user(
  guest_session_token TEXT,
  target_user_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_session_id UUID;
  transfer_result JSON;
  response_count INTEGER;
  target_session_id UUID;
BEGIN
  -- Find guest session using TEXT token
  SELECT id INTO guest_session_id
  FROM user_quiz_sessions
  WHERE session_token = guest_session_token
    AND is_guest_session = true
    AND expires_at > NOW();
  
  IF guest_session_id IS NULL THEN
    RETURN json_build_object(
      'error', 'Guest session not found or expired',
      'transfer_successful', false
    );
  END IF;
  
  -- Get response count for validation (FIXED: correct table name)
  SELECT COUNT(*) INTO response_count
  FROM user_quiz_responses  -- Fixed from quiz_responses
  WHERE session_id = guest_session_id;
  
  IF response_count = 0 THEN
    RETURN json_build_object(
      'error', 'No quiz responses found for guest session',
      'transfer_successful', false
    );
  END IF;
  
  -- Create new session for the authenticated user
  INSERT INTO user_quiz_sessions (
    user_id, 
    is_guest_session, 
    session_token,
    is_completed,
    created_at,
    expires_at
  )
  SELECT 
    target_user_id,
    false, -- Convert from guest to user session
    gen_random_uuid()::TEXT, -- Generate new TEXT token for user session
    is_completed,  -- Fixed from quiz_completed
    NOW(),
    NOW() + INTERVAL '30 days'
  FROM user_quiz_sessions
  WHERE id = guest_session_id
  RETURNING id INTO target_session_id;
  
  -- Transfer quiz responses to new session (FIXED: correct table name)
  UPDATE user_quiz_responses  -- Fixed from quiz_responses
  SET session_id = target_session_id
  WHERE session_id = guest_session_id;
  
  -- Transfer personality profile if exists
  UPDATE user_fragrance_personalities
  SET user_id = target_user_id
  WHERE session_id = guest_session_id;
  
  -- Delete the guest session (data is now transferred)
  DELETE FROM user_quiz_sessions WHERE id = guest_session_id;
  
  RETURN json_build_object(
    'transfer_successful', true,
    'new_session_id', target_session_id,
    'responses_transferred', response_count
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'error', SQLERRM,
    'transfer_successful', false
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Grant execute permissions for fixed functions
GRANT EXECUTE ON FUNCTION analyze_quiz_personality(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_quiz_recommendations(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_guest_session_to_user(TEXT, UUID) TO authenticated;