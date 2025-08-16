-- Migration: Quiz System Foundation
-- Created: 2025-08-15
-- Purpose: Create database schema for fragrance personality quiz system

-- =============================================================================
-- QUIZ SESSION MANAGEMENT TABLES
-- =============================================================================

-- 1. Quiz sessions for both authenticated and guest users
CREATE TABLE IF NOT EXISTS user_quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  quiz_version TEXT NOT NULL DEFAULT 'v1.0',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  current_question INTEGER DEFAULT 1 NOT NULL CHECK (current_question >= 1),
  total_questions INTEGER DEFAULT 15 NOT NULL CHECK (total_questions >= 1),
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,
  is_guest_session BOOLEAN DEFAULT TRUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL,
  referral_source TEXT,
  ip_hash TEXT, -- Hashed IP for analytics, not tracking
  user_agent_hash TEXT, -- Hashed user agent for analytics
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_completion CHECK (
    (is_completed = FALSE AND completed_at IS NULL) OR 
    (is_completed = TRUE AND completed_at IS NOT NULL)
  ),
  CONSTRAINT guest_or_user CHECK (
    (is_guest_session = TRUE) OR 
    (is_guest_session = FALSE AND user_id IS NOT NULL)
  )
);

-- 2. Individual quiz responses
CREATE TABLE IF NOT EXISTS user_quiz_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES user_quiz_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'multiple_choice', 'slider_scale', 'image_selection', 'scenario_based', 'text_input'
  )),
  answer_value TEXT NOT NULL,
  answer_metadata JSONB, -- Additional context like confidence, branching triggers
  response_time_ms INTEGER CHECK (response_time_ms > 0),
  question_weight DECIMAL(3,2) DEFAULT 1.0 CHECK (question_weight > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Unique constraint to prevent duplicate responses
  UNIQUE(session_id, question_id)
);

-- 3. Generated personality profiles
CREATE TABLE IF NOT EXISTS user_fragrance_personalities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_quiz_sessions(id) ON DELETE SET NULL,
  personality_type TEXT NOT NULL CHECK (personality_type IN (
    'romantic', 'sophisticated', 'natural', 'bold', 'playful', 'mysterious', 'classic', 'modern'
  )),
  secondary_type TEXT CHECK (secondary_type IN (
    'romantic', 'sophisticated', 'natural', 'bold', 'playful', 'mysterious', 'classic', 'modern'
  )),
  style_descriptor TEXT NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1) NOT NULL,
  
  -- Fragrance dimension scores (0-100)
  dimension_fresh INTEGER DEFAULT 50 CHECK (dimension_fresh >= 0 AND dimension_fresh <= 100),
  dimension_floral INTEGER DEFAULT 50 CHECK (dimension_floral >= 0 AND dimension_floral <= 100),
  dimension_oriental INTEGER DEFAULT 50 CHECK (dimension_oriental >= 0 AND dimension_oriental <= 100),
  dimension_woody INTEGER DEFAULT 50 CHECK (dimension_woody >= 0 AND dimension_woody <= 100),
  dimension_fruity INTEGER DEFAULT 50 CHECK (dimension_fruity >= 0 AND dimension_fruity <= 100),
  dimension_gourmand INTEGER DEFAULT 50 CHECK (dimension_gourmand >= 0 AND dimension_gourmand <= 100),
  
  -- Lifestyle and preference factors
  lifestyle_factors JSONB,
  preferred_intensity INTEGER CHECK (preferred_intensity >= 1 AND preferred_intensity <= 10),
  occasion_preferences TEXT[],
  seasonal_preferences TEXT[],
  brand_preferences TEXT[],
  
  -- Quiz metadata
  quiz_version TEXT NOT NULL DEFAULT 'v1.0',
  analysis_method TEXT DEFAULT 'hybrid_weighted',
  ai_enhanced BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- ENHANCE EXISTING TABLES FOR QUIZ INTEGRATION
-- =============================================================================

-- 4. Add quiz-related fields to user_profiles
DO $$
BEGIN
  -- Onboarding and quiz completion tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    ALTER TABLE user_profiles ADD COLUMN quiz_completed_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE user_profiles ADD COLUMN quiz_personality_type TEXT;
    ALTER TABLE user_profiles ADD COLUMN onboarding_step TEXT DEFAULT 'welcome' 
      CHECK (onboarding_step IN ('welcome', 'quiz', 'quiz_completed', 'account_created', 'recommendations_viewed', 'completed'));
    ALTER TABLE user_profiles ADD COLUMN referral_source TEXT;
    ALTER TABLE user_profiles ADD COLUMN quiz_completion_time_seconds INTEGER;
    ALTER TABLE user_profiles ADD COLUMN personality_confidence DECIMAL(3,2);
  END IF;
END $$;

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- 5. Create indexes for optimal query performance

-- Quiz session lookups
CREATE INDEX IF NOT EXISTS user_quiz_sessions_user_id_idx ON user_quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_quiz_sessions_session_token_idx ON user_quiz_sessions(session_token);
CREATE INDEX IF NOT EXISTS user_quiz_sessions_completed_idx ON user_quiz_sessions(completed_at DESC) 
  WHERE is_completed = true;
CREATE INDEX IF NOT EXISTS user_quiz_sessions_guest_cleanup_idx ON user_quiz_sessions(expires_at) 
  WHERE is_guest_session = true;

-- Quiz response queries
CREATE INDEX IF NOT EXISTS user_quiz_responses_session_id_idx ON user_quiz_responses(session_id);
CREATE INDEX IF NOT EXISTS user_quiz_responses_question_id_idx ON user_quiz_responses(question_id);
CREATE INDEX IF NOT EXISTS user_quiz_responses_created_at_idx ON user_quiz_responses(created_at DESC);

-- Personality profile lookups
CREATE INDEX IF NOT EXISTS user_fragrance_personalities_user_id_idx ON user_fragrance_personalities(user_id);
CREATE INDEX IF NOT EXISTS user_fragrance_personalities_type_idx ON user_fragrance_personalities(personality_type);
CREATE INDEX IF NOT EXISTS user_fragrance_personalities_confidence_idx ON user_fragrance_personalities(confidence_score DESC);
CREATE INDEX IF NOT EXISTS user_fragrance_personalities_session_idx ON user_fragrance_personalities(session_id);

-- Enhanced user profile queries
CREATE INDEX IF NOT EXISTS user_profiles_onboarding_step_idx ON user_profiles(onboarding_step);
CREATE INDEX IF NOT EXISTS user_profiles_quiz_completed_idx ON user_profiles(quiz_completed_at DESC) 
  WHERE quiz_completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_profiles_personality_type_idx ON user_profiles(quiz_personality_type);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- 6. Enable RLS on quiz tables
ALTER TABLE user_quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fragrance_personalities ENABLE ROW LEVEL SECURITY;

-- Quiz sessions policies (support for guest sessions)
CREATE POLICY "Users can access own quiz sessions" ON user_quiz_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Guest sessions accessible by session token" ON user_quiz_sessions
  FOR ALL USING (
    is_guest_session = true AND 
    expires_at > NOW() AND
    session_token IS NOT NULL
  );

-- Quiz responses policies (inherit from session permissions)
CREATE POLICY "Users can access own quiz responses" ON user_quiz_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_quiz_sessions uqs 
      WHERE uqs.id = session_id 
      AND (
        uqs.user_id = auth.uid() OR 
        (uqs.is_guest_session = true AND uqs.expires_at > NOW())
      )
    )
  );

-- Personality profiles policies (authenticated users only)
CREATE POLICY "Users can manage own personality profiles" ON user_fragrance_personalities
  FOR ALL USING (auth.uid() = user_id);

-- Service role policies for cleanup and administration
CREATE POLICY "Service role can manage quiz sessions" ON user_quiz_sessions
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage quiz responses" ON user_quiz_responses
  FOR ALL TO service_role USING (true);

-- =============================================================================
-- QUIZ ANALYSIS FUNCTIONS
-- =============================================================================

-- 7. Function to calculate personality from quiz responses
CREATE OR REPLACE FUNCTION analyze_quiz_personality(
  target_session_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  response_count INTEGER;
  weighted_scores JSON;
BEGIN
  -- Validate session exists and has responses
  SELECT COUNT(*) INTO response_count
  FROM user_quiz_responses
  WHERE session_id = target_session_id;
  
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
      -- Mock calculations for now - would implement actual algorithm
      50 + (RANDOM() * 50)::INTEGER as fresh_score,
      50 + (RANDOM() * 50)::INTEGER as floral_score,
      50 + (RANDOM() * 50)::INTEGER as oriental_score,
      50 + (RANDOM() * 50)::INTEGER as woody_score,
      50 + (RANDOM() * 50)::INTEGER as fruity_score,
      50 + (RANDOM() * 50)::INTEGER as gourmand_score,
      0.7 + (RANDOM() * 0.3) as confidence
  )
  SELECT json_build_object(
    'personality_analysis', json_build_object(
      'session_id', target_session_id,
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
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Helper function to determine archetype from scores
CREATE OR REPLACE FUNCTION determine_primary_archetype(
  floral_score INTEGER,
  oriental_score INTEGER,
  fresh_score INTEGER
)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simplified archetype determination logic
  IF floral_score >= 75 THEN
    RETURN 'romantic';
  ELSIF oriental_score >= 75 THEN
    RETURN 'sophisticated';
  ELSIF fresh_score >= 75 THEN
    RETURN 'natural';
  ELSE
    RETURN 'classic';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to get quiz-based recommendations
CREATE OR REPLACE FUNCTION get_quiz_recommendations(
  target_session_id UUID,
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
BEGIN
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
  JOIN user_quiz_sessions uqs ON ufp.session_id = uqs.id
  WHERE uqs.id = target_session_id
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN; -- No personality profile found
  END IF;

  -- Return mock recommendations based on personality
  -- In production, this would use vector similarity with personality weights
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
  WHERE f.sample_available = true
  ORDER BY RANDOM() -- Would be actual similarity scoring
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GUEST SESSION MANAGEMENT FUNCTIONS
-- =============================================================================

-- 9. Function to cleanup expired guest sessions
CREATE OR REPLACE FUNCTION cleanup_expired_quiz_sessions()
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleanup_result JSON;
  expired_count INTEGER;
  freed_storage DECIMAL;
BEGIN
  -- Count expired sessions
  SELECT COUNT(*) INTO expired_count
  FROM user_quiz_sessions
  WHERE is_guest_session = true 
    AND expires_at < NOW()
    AND is_completed = false; -- Don't delete completed sessions immediately
  
  -- Delete expired guest sessions and their responses
  WITH deleted_sessions AS (
    DELETE FROM user_quiz_sessions
    WHERE is_guest_session = true 
      AND expires_at < NOW()
      AND is_completed = false
    RETURNING id
  ),
  deleted_responses AS (
    DELETE FROM user_quiz_responses
    WHERE session_id IN (SELECT id FROM deleted_sessions)
    RETURNING session_id
  )
  SELECT 
    json_build_object(
      'cleaned_sessions', expired_count,
      'responses_cleaned', (SELECT COUNT(*) FROM deleted_responses),
      'storage_freed_estimate_kb', expired_count * 2, -- ~2KB per session
      'cleanup_timestamp', NOW()
    ) INTO cleanup_result;
  
  RETURN cleanup_result;
END;
$$ LANGUAGE plpgsql;

-- 10. Function to transfer guest session to authenticated user
CREATE OR REPLACE FUNCTION transfer_guest_session_to_user(
  guest_session_token UUID,
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
BEGIN
  -- Find guest session
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
  
  -- Count responses to transfer
  SELECT COUNT(*) INTO response_count
  FROM user_quiz_responses
  WHERE session_id = guest_session_id;
  
  -- Transfer session to user
  UPDATE user_quiz_sessions
  SET 
    user_id = target_user_id,
    is_guest_session = false,
    expires_at = NULL, -- Remove expiration for authenticated session
    updated_at = NOW()
  WHERE id = guest_session_id;
  
  -- Transfer personality profile if exists
  UPDATE user_fragrance_personalities
  SET user_id = target_user_id
  WHERE session_id = guest_session_id;
  
  -- Update user profile with quiz completion
  UPDATE user_profiles
  SET 
    quiz_completed_at = CASE 
      WHEN EXISTS(SELECT 1 FROM user_quiz_sessions WHERE id = guest_session_id AND is_completed = true)
      THEN NOW()
      ELSE quiz_completed_at
    END,
    onboarding_step = CASE 
      WHEN onboarding_step = 'welcome' THEN 'quiz_completed'
      ELSE onboarding_step
    END,
    updated_at = NOW()
  WHERE id = target_user_id;
  
  SELECT json_build_object(
    'transfer_successful', true,
    'session_id', guest_session_id,
    'responses_transferred', response_count,
    'personality_profile_transferred', EXISTS(
      SELECT 1 FROM user_fragrance_personalities 
      WHERE session_id = guest_session_id AND user_id = target_user_id
    ),
    'user_profile_updated', true,
    'transfer_timestamp', NOW()
  ) INTO transfer_result;
  
  RETURN transfer_result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- QUIZ ANALYTICS AND INSIGHTS FUNCTIONS
-- =============================================================================

-- 11. Function to get quiz completion analytics
CREATE OR REPLACE FUNCTION get_quiz_analytics(
  time_period TEXT DEFAULT '30 days'
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  analytics_result JSON;
  period_interval INTERVAL;
BEGIN
  -- Parse time period
  period_interval := CASE time_period
    WHEN '24 hours' THEN INTERVAL '24 hours'
    WHEN '7 days' THEN INTERVAL '7 days'
    WHEN '30 days' THEN INTERVAL '30 days'
    WHEN '90 days' THEN INTERVAL '90 days'
    ELSE INTERVAL '30 days'
  END;

  WITH quiz_stats AS (
    SELECT 
      COUNT(*) as total_sessions,
      COUNT(*) FILTER (WHERE is_completed = true) as completed_sessions,
      COUNT(*) FILTER (WHERE is_guest_session = true) as guest_sessions,
      COUNT(*) FILTER (WHERE is_guest_session = false) as auth_sessions,
      AVG(
        EXTRACT(EPOCH FROM (completed_at - started_at))
      ) FILTER (WHERE is_completed = true) as avg_completion_time_seconds,
      COUNT(DISTINCT referral_source) as referral_sources
    FROM user_quiz_sessions
    WHERE started_at >= NOW() - period_interval
  ),
  personality_distribution AS (
    SELECT 
      personality_type,
      COUNT(*) as count,
      AVG(confidence_score) as avg_confidence
    FROM user_fragrance_personalities ufp
    JOIN user_quiz_sessions uqs ON ufp.session_id = uqs.id
    WHERE uqs.started_at >= NOW() - period_interval
    GROUP BY personality_type
  )
  SELECT json_build_object(
    'time_period', time_period,
    'quiz_completion', json_build_object(
      'total_started', qs.total_sessions,
      'total_completed', qs.completed_sessions,
      'completion_rate', ROUND(qs.completed_sessions::DECIMAL / NULLIF(qs.total_sessions, 0), 3),
      'avg_completion_time_minutes', ROUND(qs.avg_completion_time_seconds / 60, 1),
      'guest_vs_auth', json_build_object(
        'guest_sessions', qs.guest_sessions,
        'auth_sessions', qs.auth_sessions
      )
    ),
    'personality_distribution', (
      SELECT json_agg(
        json_build_object(
          'archetype', personality_type,
          'count', count,
          'percentage', ROUND(count::DECIMAL / SUM(count) OVER() * 100, 1),
          'avg_confidence', ROUND(avg_confidence, 2)
        )
      )
      FROM personality_distribution
    ),
    'generated_at', NOW()
  ) INTO analytics_result
  FROM quiz_stats qs;
  
  RETURN analytics_result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS AND AUTOMATION
-- =============================================================================

-- 12. Update timestamp triggers
CREATE OR REPLACE FUNCTION update_quiz_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
DROP TRIGGER IF EXISTS update_user_quiz_sessions_updated_at ON user_quiz_sessions;
CREATE TRIGGER update_user_quiz_sessions_updated_at
  BEFORE UPDATE ON user_quiz_sessions
  FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at_column();

DROP TRIGGER IF EXISTS update_user_fragrance_personalities_updated_at ON user_fragrance_personalities;
CREATE TRIGGER update_user_fragrance_personalities_updated_at
  BEFORE UPDATE ON user_fragrance_personalities
  FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at_column();

-- =============================================================================
-- PERMISSIONS AND SECURITY
-- =============================================================================

-- 13. Grant appropriate permissions
GRANT EXECUTE ON FUNCTION analyze_quiz_personality TO authenticated;
GRANT EXECUTE ON FUNCTION get_quiz_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_guest_session_to_user TO authenticated;

-- Restrict administrative functions to service role
GRANT EXECUTE ON FUNCTION cleanup_expired_quiz_sessions TO service_role;
GRANT EXECUTE ON FUNCTION get_quiz_analytics TO service_role;

-- =============================================================================
-- DATA VALIDATION AND COMMENTS
-- =============================================================================

-- 14. Add table and column comments for documentation
COMMENT ON TABLE user_quiz_sessions IS 'Quiz sessions for both authenticated and guest users with automatic expiration';
COMMENT ON TABLE user_quiz_responses IS 'Individual quiz question responses with metadata and timing';
COMMENT ON TABLE user_fragrance_personalities IS 'Generated personality profiles from quiz analysis';

COMMENT ON COLUMN user_quiz_sessions.session_token IS 'Unique token for guest session access and security';
COMMENT ON COLUMN user_quiz_sessions.expires_at IS 'Automatic expiration for guest sessions (24 hours)';
COMMENT ON COLUMN user_quiz_sessions.ip_hash IS 'Hashed IP address for analytics (not user tracking)';

COMMENT ON COLUMN user_quiz_responses.response_time_ms IS 'Time taken to answer question (for bot detection and UX analysis)';
COMMENT ON COLUMN user_quiz_responses.answer_metadata IS 'Additional context like confidence, branching triggers, etc.';

COMMENT ON COLUMN user_fragrance_personalities.confidence_score IS 'AI confidence in personality assessment (0-1 scale)';
COMMENT ON COLUMN user_fragrance_personalities.dimension_fresh IS 'Fresh fragrance family preference score (0-100)';

-- =============================================================================
-- MIGRATION VALIDATION
-- =============================================================================

-- 15. Validate migration completed successfully
DO $$
DECLARE
  table_count INTEGER;
  index_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Count new tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_name IN ('user_quiz_sessions', 'user_quiz_responses', 'user_fragrance_personalities')
    AND table_schema = 'public';
    
  -- Count new indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE indexname LIKE '%quiz%' OR indexname LIKE '%personality%';
     
  -- Count new functions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_name IN ('analyze_quiz_personality', 'get_quiz_recommendations', 'cleanup_expired_quiz_sessions')
    AND routine_schema = 'public';

  -- Log results
  RAISE NOTICE 'Quiz migration validation: % tables, % indexes, % functions', 
    table_count, index_count, function_count;
    
  -- Ensure critical components exist
  ASSERT table_count >= 3, 'Missing required quiz tables';
  ASSERT function_count >= 3, 'Missing required quiz functions';
  
  RAISE NOTICE 'Quiz system migration completed successfully!';
END $$;