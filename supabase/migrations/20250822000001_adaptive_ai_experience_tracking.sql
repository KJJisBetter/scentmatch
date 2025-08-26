-- ADAPTIVE AI EXPERIENCE TRACKING MIGRATION
-- Date: 2025-08-22
-- Purpose: Add columns for tracking user experience level and AI explanation preferences
-- Addresses: SCE-66 (verbose explanations) and SCE-67 (beginner education)

-- ============================================================================
-- STEP 1: ADD EXPERIENCE TRACKING COLUMNS TO USER_PROFILES
-- ============================================================================

DO $$
BEGIN
  -- Add AI experience tracking columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'ai_experience_level'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN ai_experience_level TEXT 
      CHECK (ai_experience_level IN ('beginner', 'intermediate', 'advanced'));
    ALTER TABLE user_profiles ADD COLUMN ai_experience_confidence DECIMAL(3,2) DEFAULT 0.5;
    ALTER TABLE user_profiles ADD COLUMN ai_explanation_preference TEXT DEFAULT 'adaptive'
      CHECK (ai_explanation_preference IN ('simple', 'adaptive', 'detailed'));
    ALTER TABLE user_profiles ADD COLUMN fragrance_education_completed BOOLEAN DEFAULT FALSE;
    ALTER TABLE user_profiles ADD COLUMN last_experience_analysis TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add engagement tracking columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'engagement_score'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN engagement_score DECIMAL(3,2) DEFAULT 0.0;
    ALTER TABLE user_profiles ADD COLUMN collection_interaction_count INTEGER DEFAULT 0;
    ALTER TABLE user_profiles ADD COLUMN detailed_search_count INTEGER DEFAULT 0;
    ALTER TABLE user_profiles ADD COLUMN explanation_expand_count INTEGER DEFAULT 0;
  END IF;

  -- Add educational content tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'education_terms_learned'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN education_terms_learned JSONB DEFAULT '[]'::JSONB;
    ALTER TABLE user_profiles ADD COLUMN beginner_mode_enabled BOOLEAN DEFAULT TRUE;
    ALTER TABLE user_profiles ADD COLUMN progressive_disclosure_preference BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE USER INTERACTION TRACKING TABLE
-- ============================================================================

-- Track user interactions with AI explanations for experience level refinement
CREATE TABLE IF NOT EXISTS user_ai_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'explanation_viewed', 'explanation_expanded', 'term_learned', 
    'recommendation_rated', 'educational_content_accessed'
  )),
  recommendation_id TEXT,
  explanation_type TEXT CHECK (explanation_type IN ('beginner', 'intermediate', 'advanced')),
  content_complexity TEXT CHECK (content_complexity IN ('simple', 'moderate', 'detailed')),
  interaction_metadata JSONB,
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'too_simple', 'too_complex', 'confusing')),
  session_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Experience level queries
CREATE INDEX IF NOT EXISTS user_profiles_ai_experience_level_idx 
  ON user_profiles(ai_experience_level) WHERE ai_experience_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_profiles_engagement_score_idx 
  ON user_profiles(engagement_score DESC) WHERE engagement_score > 0;

CREATE INDEX IF NOT EXISTS user_profiles_beginner_mode_idx 
  ON user_profiles(beginner_mode_enabled) WHERE beginner_mode_enabled = TRUE;

-- Interaction tracking queries
CREATE INDEX IF NOT EXISTS user_ai_interactions_user_id_idx ON user_ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS user_ai_interactions_type_idx ON user_ai_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS user_ai_interactions_created_at_idx ON user_ai_interactions(created_at DESC);

-- ============================================================================
-- STEP 4: CREATE FUNCTIONS FOR EXPERIENCE LEVEL CALCULATION
-- ============================================================================

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION calculate_user_engagement_score(target_user_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  collection_size INTEGER;
  days_active INTEGER;
  interaction_count INTEGER;
  engagement_score DECIMAL(3,2) := 0.0;
BEGIN
  -- Get collection size
  SELECT COUNT(*) INTO collection_size
  FROM user_collections 
  WHERE user_id = target_user_id;
  
  -- Get days active
  SELECT EXTRACT(DAY FROM (NOW() - created_at))::INTEGER INTO days_active
  FROM user_profiles 
  WHERE id = target_user_id;
  
  -- Get interaction count
  SELECT COUNT(*) INTO interaction_count
  FROM user_ai_interactions 
  WHERE user_id = target_user_id;
  
  -- Calculate engagement score (0-1 scale)
  engagement_score := LEAST(
    (COALESCE(collection_size, 0) / 20.0) * 0.4 +
    (LEAST(COALESCE(days_active, 0), 30) / 30.0) * 0.3 +
    (LEAST(COALESCE(interaction_count, 0), 50) / 50.0) * 0.3,
    1.0
  );
  
  RETURN engagement_score;
END;
$$ LANGUAGE plpgsql;

-- Function to determine experience level from engagement data
CREATE OR REPLACE FUNCTION determine_experience_level(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  collection_size INTEGER;
  days_active INTEGER;
  engagement_score DECIMAL(3,2);
  has_quiz BOOLEAN;
  interaction_count INTEGER;
BEGIN
  -- Get user data
  SELECT 
    COALESCE((SELECT COUNT(*) FROM user_collections WHERE user_id = target_user_id), 0),
    COALESCE(EXTRACT(DAY FROM (NOW() - created_at))::INTEGER, 0),
    COALESCE(quiz_completed_at IS NOT NULL, FALSE),
    COALESCE((SELECT COUNT(*) FROM user_ai_interactions WHERE user_id = target_user_id), 0)
  INTO collection_size, days_active, has_quiz, interaction_count
  FROM user_profiles 
  WHERE id = target_user_id;
  
  -- Calculate engagement
  engagement_score := calculate_user_engagement_score(target_user_id);
  
  -- Determine level based on multiple factors
  IF collection_size >= 10 AND days_active >= 30 AND engagement_score >= 0.7 THEN
    RETURN 'advanced';
  ELSIF (collection_size >= 3 AND days_active >= 7) OR (engagement_score >= 0.4 AND interaction_count >= 5) THEN
    RETURN 'intermediate';
  ELSE
    RETURN 'beginner';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: CREATE TRIGGER TO UPDATE EXPERIENCE LEVEL
-- ============================================================================

-- Trigger function to auto-update experience level
CREATE OR REPLACE FUNCTION update_user_experience_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level TEXT;
  new_engagement DECIMAL(3,2);
BEGIN
  -- Calculate new experience level and engagement score
  new_level := determine_experience_level(NEW.user_id);
  new_engagement := calculate_user_engagement_score(NEW.user_id);
  
  -- Update user profile
  UPDATE user_profiles 
  SET 
    ai_experience_level = new_level,
    engagement_score = new_engagement,
    last_experience_analysis = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to user interactions
DROP TRIGGER IF EXISTS trigger_update_experience_level ON user_ai_interactions;
CREATE TRIGGER trigger_update_experience_level
  AFTER INSERT OR UPDATE ON user_ai_interactions
  FOR EACH ROW EXECUTE FUNCTION update_user_experience_level();

-- Apply trigger to user collections (collection size affects experience level)
DROP TRIGGER IF EXISTS trigger_update_experience_level_collections ON user_collections;
CREATE TRIGGER trigger_update_experience_level_collections
  AFTER INSERT OR DELETE ON user_collections
  FOR EACH ROW EXECUTE FUNCTION update_user_experience_level();

-- ============================================================================
-- STEP 6: CREATE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new table
ALTER TABLE user_ai_interactions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own interaction data
CREATE POLICY "Users can manage own AI interactions" ON user_ai_interactions
  FOR ALL USING (auth.uid() = user_id);

-- Service role can access all data for analytics
CREATE POLICY "Service role can manage AI interactions" ON user_ai_interactions
  FOR ALL TO service_role USING (true);

-- ============================================================================
-- STEP 7: SEED BEGINNER-FRIENDLY EDUCATIONAL CONTENT
-- ============================================================================

-- Insert educational content into a dedicated table (if needed)
CREATE TABLE IF NOT EXISTS fragrance_education_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT UNIQUE NOT NULL,
  beginner_explanation TEXT NOT NULL,
  example TEXT,
  category TEXT NOT NULL CHECK (category IN ('concentration', 'notes', 'performance', 'families')),
  importance_score INTEGER DEFAULT 1 CHECK (importance_score BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Seed essential fragrance terms
INSERT INTO fragrance_education_content (term, beginner_explanation, example, category, importance_score) 
VALUES 
  ('EDP', 'Stronger concentration that lasts 6-8 hours', 'Like Sauvage EDP - lasts all day', 'concentration', 5),
  ('EDT', 'Lighter concentration that lasts 3-4 hours', 'Like Sauvage EDT - perfect for daytime', 'concentration', 5),
  ('Notes', 'The scents you smell - like ingredients in a recipe', 'Sauvage has bergamot (citrus) and pepper notes', 'notes', 5),
  ('Projection', 'How far others can smell your fragrance', 'Strong projection means people notice it from far away', 'performance', 4),
  ('Longevity', 'How long the fragrance lasts on your skin', 'Good longevity means still smelling it after 8 hours', 'performance', 4),
  ('Fresh', 'Clean, energizing scents like citrus and marine', 'Fresh scents make you feel awake and confident', 'families', 3),
  ('Woody', 'Warm, natural scents like sandalwood and cedar', 'Woody scents feel sophisticated and grounded', 'families', 3),
  ('Floral', 'Flower-based scents like rose and jasmine', 'Floral scents are romantic and elegant', 'families', 3)
ON CONFLICT (term) DO NOTHING;

-- ============================================================================
-- FINAL VALIDATION
-- ============================================================================

DO $$
BEGIN
  -- Verify experience tracking columns were added
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'ai_experience_level'
  ) THEN
    RAISE EXCEPTION 'Adaptive AI migration failed: ai_experience_level column not added';
  END IF;
  
  -- Verify interaction tracking table was created
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_ai_interactions'
  ) THEN
    RAISE EXCEPTION 'Adaptive AI migration failed: user_ai_interactions table not created';
  END IF;
  
  -- Verify functions were created
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'calculate_user_engagement_score'
  ) THEN
    RAISE EXCEPTION 'Adaptive AI migration failed: engagement score function not created';
  END IF;
  
  RAISE NOTICE 'Adaptive AI experience tracking migration completed successfully!';
  RAISE NOTICE 'Features enabled: experience level detection, beginner education, progressive disclosure';
  RAISE NOTICE 'Addresses SCE-66 (verbose explanations) and SCE-67 (beginner education)';
END $$;