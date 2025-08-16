# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-15-fragrance-quiz-onboarding-integration/spec.md

## Database Changes Required

### New Tables

#### user_quiz_sessions
```sql
CREATE TABLE user_quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token UUID DEFAULT gen_random_uuid(), -- For guest sessions
  quiz_version TEXT NOT NULL DEFAULT 'v1.0',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  current_question INTEGER DEFAULT 1,
  total_questions INTEGER DEFAULT 15,
  is_completed BOOLEAN DEFAULT FALSE,
  is_guest_session BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_quiz_responses
```sql
CREATE TABLE user_quiz_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES user_quiz_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_value TEXT NOT NULL,
  answer_metadata JSONB, -- Additional answer context
  response_time_ms INTEGER, -- Time taken to answer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_fragrance_personalities
```sql
CREATE TABLE user_fragrance_personalities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_quiz_sessions(id) ON DELETE SET NULL,
  personality_type TEXT NOT NULL, -- 'sophisticated_evening', 'fresh_daytime', etc.
  style_descriptor TEXT NOT NULL, -- Human-readable style description
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  dominant_families TEXT[], -- Top 3 scent families
  preferred_intensity INTEGER CHECK (preferred_intensity >= 1 AND preferred_intensity <= 10),
  occasion_preferences TEXT[], -- work, evening, casual, etc.
  seasonal_preferences TEXT[], -- spring, summer, fall, winter
  lifestyle_factors JSONB, -- Additional lifestyle analysis
  quiz_version TEXT NOT NULL DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enhanced Existing Tables

#### user_profiles (additional columns for quiz integration)
```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  onboarding_completed BOOLEAN DEFAULT FALSE,
  quiz_completed_at TIMESTAMP WITH TIME ZONE,
  quiz_personality_type TEXT,
  onboarding_step TEXT DEFAULT 'welcome', -- 'welcome', 'quiz', 'account', 'recommendations', 'completed'
  referral_source TEXT, -- How they found the quiz
  quiz_completion_time_seconds INTEGER;
```

### Indexes for Performance

```sql
-- Quiz session queries
CREATE INDEX user_quiz_sessions_user_id_idx ON user_quiz_sessions(user_id);
CREATE INDEX user_quiz_sessions_session_token_idx ON user_quiz_sessions(session_token);
CREATE INDEX user_quiz_sessions_completed_idx ON user_quiz_sessions(completed_at DESC) WHERE is_completed = true;

-- Quiz response queries
CREATE INDEX user_quiz_responses_session_id_idx ON user_quiz_responses(session_id);
CREATE INDEX user_quiz_responses_question_id_idx ON user_quiz_responses(question_id);

-- Personality lookup
CREATE INDEX user_fragrance_personalities_user_id_idx ON user_fragrance_personalities(user_id);
CREATE INDEX user_fragrance_personalities_type_idx ON user_fragrance_personalities(personality_type);

-- Enhanced user profile queries
CREATE INDEX user_profiles_onboarding_step_idx ON user_profiles(onboarding_step);
CREATE INDEX user_profiles_quiz_completed_idx ON user_profiles(quiz_completed_at DESC) WHERE quiz_completed_at IS NOT NULL;
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on new tables
ALTER TABLE user_quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fragrance_personalities ENABLE ROW LEVEL SECURITY;

-- Quiz sessions policies (including guest sessions)
CREATE POLICY "Users can access own quiz sessions or guest sessions with token" ON user_quiz_sessions
  FOR ALL USING (
    auth.uid() = user_id OR 
    (user_id IS NULL AND is_guest_session = true)
  );

-- Quiz responses policies
CREATE POLICY "Users can access own quiz responses" ON user_quiz_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_quiz_sessions uqs 
      WHERE uqs.id = session_id 
      AND (uqs.user_id = auth.uid() OR uqs.is_guest_session = true)
    )
  );

-- Personality profiles policies
CREATE POLICY "Users can manage own personality profiles" ON user_fragrance_personalities
  FOR ALL USING (auth.uid() = user_id);
```

### Database Functions

#### Generate Fragrance Personality
```sql
CREATE OR REPLACE FUNCTION generate_fragrance_personality(
  target_session_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  response_data RECORD;
BEGIN
  -- Analyze quiz responses to generate personality profile
  SELECT 
    json_build_object(
      'personality_type', determine_personality_type(target_session_id),
      'style_descriptor', generate_style_description(target_session_id),
      'confidence_score', calculate_confidence_score(target_session_id),
      'dominant_families', extract_preferred_families(target_session_id),
      'lifestyle_factors', analyze_lifestyle_responses(target_session_id)
    ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

#### Quiz to Recommendations Bridge
```sql
CREATE OR REPLACE FUNCTION get_quiz_based_recommendations(
  target_user_id UUID,
  personality_profile JSON,
  max_results INTEGER DEFAULT 12
)
RETURNS TABLE (
  fragrance_id TEXT,
  match_score FLOAT,
  match_reasons TEXT[],
  quiz_alignment FLOAT
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bridge quiz insights to recommendation algorithm
  RETURN QUERY
  SELECT 
    f.id::TEXT,
    calculate_quiz_match_score(f.id, personality_profile)::FLOAT,
    generate_quiz_match_reasons(f.id, personality_profile)::TEXT[],
    assess_quiz_alignment(f.id, personality_profile)::FLOAT
  FROM fragrances f
  WHERE f.sample_available = true
    AND calculate_quiz_match_score(f.id, personality_profile) >= 0.6
  ORDER BY calculate_quiz_match_score(f.id, personality_profile) DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
```

### Migration Script

```sql
-- Run in order:
-- 1. Create new tables for quiz system
-- 2. Add columns to existing user_profiles table
-- 3. Create indexes for performance
-- 4. Enable RLS and create policies
-- 5. Create functions for quiz analysis

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Validate data integrity after migration
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM user_quiz_sessions WHERE session_token IS NULL) = 0,
    'user_quiz_sessions must have valid session_token for guest support';
  ASSERT (SELECT COUNT(*) FROM user_quiz_responses WHERE session_id IS NULL) = 0,
    'user_quiz_responses must have valid session_id';
END $$;
```