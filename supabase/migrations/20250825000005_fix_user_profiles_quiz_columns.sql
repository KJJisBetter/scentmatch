-- Fix User Profiles Quiz Columns - Critical Fix
-- Date: 2025-08-25
-- Purpose: Ensure user_profiles has required quiz-related columns

-- ============================================================================
-- STEP 1: ADD MISSING QUIZ COLUMNS TO USER_PROFILES
-- ============================================================================

-- Add quiz_completed_at column if missing (referenced by user-experience-detector)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'quiz_completed_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN quiz_completed_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added quiz_completed_at column to user_profiles';
  ELSE
    RAISE NOTICE 'quiz_completed_at column already exists in user_profiles';
  END IF;

  -- Add other quiz-related columns if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'quiz_personality_type'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN quiz_personality_type TEXT;
    RAISE NOTICE 'Added quiz_personality_type column to user_profiles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_step'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_step TEXT DEFAULT 'welcome' 
      CHECK (onboarding_step IN ('welcome', 'quiz', 'quiz_completed', 'account_created', 'recommendations_viewed', 'completed'));
    RAISE NOTICE 'Added onboarding_step column to user_profiles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'personality_confidence'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN personality_confidence DECIMAL(3,2);
    RAISE NOTICE 'Added personality_confidence column to user_profiles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'referral_source'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN referral_source TEXT;
    RAISE NOTICE 'Added referral_source column to user_profiles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'quiz_completion_time_seconds'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN quiz_completion_time_seconds INTEGER;
    RAISE NOTICE 'Added quiz_completion_time_seconds column to user_profiles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added onboarding_completed column to user_profiles';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE INDEXES FOR QUIZ-RELATED QUERIES
-- ============================================================================

-- Index for quiz completion lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_quiz_completed_idx 
  ON user_profiles(quiz_completed_at DESC) 
  WHERE quiz_completed_at IS NOT NULL;

-- Index for onboarding step tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_onboarding_step_idx 
  ON user_profiles(onboarding_step);

-- Index for personality type queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_personality_type_idx 
  ON user_profiles(quiz_personality_type);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'User Profiles Quiz Columns migration completed successfully';
  RAISE NOTICE 'All quiz-related columns should now exist in user_profiles table';
  RAISE NOTICE 'Indexes created for quiz completion and personality queries';
END $$;