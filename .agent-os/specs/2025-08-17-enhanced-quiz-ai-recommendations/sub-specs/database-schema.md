# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-17-enhanced-quiz-ai-recommendations/spec.md

## Schema Changes

### Enhanced User Profiles Table

```sql
-- Add profile naming and experience level fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'enthusiast', 'collector')),
ADD COLUMN IF NOT EXISTS profile_completion_step TEXT DEFAULT 'created',
ADD COLUMN IF NOT EXISTS ai_profile_description TEXT,
ADD COLUMN IF NOT EXISTS unique_profile_name TEXT;

-- Create index for profile searches
CREATE INDEX IF NOT EXISTS user_profiles_display_name_idx ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS user_profiles_experience_level_idx ON user_profiles(experience_level);
```

### Favorite Fragrances System

```sql
-- Create user favorites table for experience-based personalization
CREATE TABLE IF NOT EXISTS user_favorite_fragrances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fragrance_id UUID REFERENCES fragrances(id) ON DELETE CASCADE,
  selection_source TEXT DEFAULT 'quiz_input', -- 'quiz_input', 'browse', 'recommendation'
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',

  UNIQUE(user_id, fragrance_id)
);

-- RLS policies for favorites
CREATE POLICY "Users manage own favorites" ON user_favorite_fragrances
  FOR ALL USING (auth.uid() = user_id);

-- Index for quick lookups
CREATE INDEX user_favorite_fragrances_user_id_idx ON user_favorite_fragrances(user_id);
CREATE INDEX user_favorite_fragrances_fragrance_id_idx ON user_favorite_fragrances(fragrance_id);
```

### Enhanced Quiz Sessions

```sql
-- Add experience level and profile generation tracking
ALTER TABLE user_quiz_sessions
ADD COLUMN IF NOT EXISTS detected_experience_level TEXT,
ADD COLUMN IF NOT EXISTS ai_profile_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS unique_profile_name TEXT,
ADD COLUMN IF NOT EXISTS conversion_to_account_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS favorite_fragrances_collected BOOLEAN DEFAULT FALSE;

-- Index for analytics and session management
CREATE INDEX user_quiz_sessions_experience_level_idx ON user_quiz_sessions(detected_experience_level);
CREATE INDEX user_quiz_sessions_conversion_idx ON user_quiz_sessions(conversion_to_account_at) WHERE conversion_to_account_at IS NOT NULL;
```

### AI Profile Cache

```sql
-- Create table for caching AI-generated profiles and descriptions
CREATE TABLE IF NOT EXISTS ai_profile_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personality_type TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  unique_profile_name TEXT NOT NULL,
  profile_description TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(personality_type, experience_level, unique_profile_name)
);

-- Index for fast lookups
CREATE INDEX ai_profile_cache_personality_exp_idx ON ai_profile_cache(personality_type, experience_level);
CREATE INDEX ai_profile_cache_usage_idx ON ai_profile_cache(usage_count DESC, last_used_at DESC);
```

## Database Functions

### Enhanced Recommendation Function

```sql
-- Update existing recommendation function to include experience level
CREATE OR REPLACE FUNCTION get_enhanced_quiz_recommendations(
  target_session_id UUID,
  max_results INTEGER DEFAULT 8,
  include_experience_boost BOOLEAN DEFAULT TRUE
) RETURNS TABLE (
  fragrance_id UUID,
  name TEXT,
  brand TEXT,
  match_score DECIMAL(4,3),
  quiz_reasoning TEXT,
  experience_relevance TEXT,
  sample_available BOOLEAN,
  sample_price_usd DECIMAL(8,2)
) AS $$
DECLARE
  session_experience_level TEXT;
  user_personality_type TEXT;
BEGIN
  -- Get session details
  SELECT detected_experience_level INTO session_experience_level
  FROM user_quiz_sessions WHERE id = target_session_id;

  -- Get personality from existing calculation
  SELECT personality_type INTO user_personality_type
  FROM user_fragrance_personalities
  WHERE session_id = target_session_id
  ORDER BY created_at DESC LIMIT 1;

  -- Return recommendations with experience-level boosting
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    fb.name as brand,
    (base_match_score * experience_multiplier)::DECIMAL(4,3) as match_score,
    generate_reasoning(f.id, user_personality_type, session_experience_level) as quiz_reasoning,
    map_experience_relevance(f.id, session_experience_level) as experience_relevance,
    f.sample_available,
    f.sample_price_usd
  FROM fragrances f
  JOIN fragrance_brands fb ON f.brand_id = fb.id
  JOIN (
    -- Base recommendation logic with experience multipliers
    SELECT
      f2.id,
      calculate_personality_match(f2.id, user_personality_type) as base_match_score,
      CASE
        WHEN session_experience_level = 'beginner' AND f2.popularity_score > 70 THEN 1.2
        WHEN session_experience_level = 'collector' AND f2.popularity_score < 30 THEN 1.3
        ELSE 1.0
      END as experience_multiplier
    FROM fragrances f2
    WHERE f2.sample_available = true
  ) scored ON f.id = scored.id
  ORDER BY match_score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Profile Name Generation Function

```sql
-- Function to generate or retrieve unique profile names
CREATE OR REPLACE FUNCTION get_unique_profile_name(
  personality_type TEXT,
  experience_level TEXT,
  force_new BOOLEAN DEFAULT FALSE
) RETURNS TEXT AS $$
DECLARE
  cached_name TEXT;
  new_name TEXT;
BEGIN
  -- Check cache first unless forcing new
  IF NOT force_new THEN
    SELECT unique_profile_name INTO cached_name
    FROM ai_profile_cache
    WHERE ai_profile_cache.personality_type = get_unique_profile_name.personality_type
      AND ai_profile_cache.experience_level = get_unique_profile_name.experience_level
      AND usage_count < 3  -- Limit reuse to maintain uniqueness
    ORDER BY RANDOM()
    LIMIT 1;

    IF cached_name IS NOT NULL THEN
      -- Update usage count
      UPDATE ai_profile_cache
      SET usage_count = usage_count + 1, last_used_at = NOW()
      WHERE unique_profile_name = cached_name;

      RETURN cached_name;
    END IF;
  END IF;

  -- Generate new name (would be replaced with AI generation in production)
  new_name := generate_profile_name_template(personality_type, experience_level);

  -- Cache the new name
  INSERT INTO ai_profile_cache (personality_type, experience_level, unique_profile_name, profile_description, usage_count)
  VALUES (personality_type, experience_level, new_name, 'Generated', 1)
  ON CONFLICT (personality_type, experience_level, unique_profile_name)
  DO UPDATE SET usage_count = ai_profile_cache.usage_count + 1;

  RETURN new_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Migration Scripts

### Migration Order

1. **Schema Updates**: Add new columns to existing tables
2. **New Tables**: Create favorite fragrances and AI cache tables
3. **Functions**: Update/create database functions
4. **Indexes**: Create performance indexes
5. **RLS Policies**: Add security policies for new tables
6. **Data Migration**: Convert existing profiles to new schema

### Rollback Strategy

- All changes use `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`
- Backward compatible - existing functionality preserved
- New columns have sensible defaults
- Functions created with `CREATE OR REPLACE` for safe updates
