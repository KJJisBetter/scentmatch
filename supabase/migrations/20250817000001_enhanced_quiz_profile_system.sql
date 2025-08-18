-- Enhanced Quiz & AI Profile System Database Migration
-- Created: 2025-08-17
-- Purpose: Support experience-level adaptive quiz, AI profile generation, and favorite fragrances

-- =============================================================================
-- 1. ENHANCED USER PROFILES TABLE
-- =============================================================================

-- Add new columns to user_profiles for AI profile features
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'enthusiast', 'collector')),
ADD COLUMN IF NOT EXISTS profile_completion_step TEXT DEFAULT 'created',
ADD COLUMN IF NOT EXISTS ai_profile_description TEXT,
ADD COLUMN IF NOT EXISTS unique_profile_name TEXT;

-- Create indexes for efficient profile searches and analytics
CREATE INDEX IF NOT EXISTS user_profiles_display_name_idx ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS user_profiles_experience_level_idx ON user_profiles(experience_level);
CREATE INDEX IF NOT EXISTS user_profiles_unique_name_idx ON user_profiles(unique_profile_name);
CREATE INDEX IF NOT EXISTS user_profiles_completion_step_idx ON user_profiles(profile_completion_step);

-- =============================================================================
-- 2. USER FAVORITE FRAGRANCES TABLE
-- =============================================================================

-- Create table for user favorite fragrances (for enthusiast/collector experience levels)
CREATE TABLE IF NOT EXISTS user_favorite_fragrances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fragrance_id UUID REFERENCES fragrances(id) ON DELETE CASCADE NOT NULL,
  selection_source TEXT DEFAULT 'quiz_input' CHECK (selection_source IN ('quiz_input', 'browse', 'recommendation', 'manual')),
  confidence_score DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, fragrance_id)
);

-- Enable RLS on user_favorite_fragrances
ALTER TABLE user_favorite_fragrances ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_favorite_fragrances
CREATE POLICY "Users manage own favorites" ON user_favorite_fragrances
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS user_favorite_fragrances_user_id_idx ON user_favorite_fragrances(user_id);
CREATE INDEX IF NOT EXISTS user_favorite_fragrances_fragrance_id_idx ON user_favorite_fragrances(fragrance_id);
CREATE INDEX IF NOT EXISTS user_favorite_fragrances_source_idx ON user_favorite_fragrances(selection_source);
CREATE INDEX IF NOT EXISTS user_favorite_fragrances_confidence_idx ON user_favorite_fragrances(confidence_score DESC);

-- =============================================================================
-- 3. ENHANCED QUIZ SESSIONS TABLE
-- =============================================================================

-- Add experience level tracking and AI profile generation fields
ALTER TABLE user_quiz_sessions
ADD COLUMN IF NOT EXISTS detected_experience_level TEXT CHECK (detected_experience_level IN ('beginner', 'enthusiast', 'collector')),
ADD COLUMN IF NOT EXISTS ai_profile_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS unique_profile_name TEXT,
ADD COLUMN IF NOT EXISTS conversion_to_account_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS favorite_fragrances_collected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS quiz_completion_quality_score DECIMAL(3,2) DEFAULT 0.0;

-- Indexes for analytics and session management
CREATE INDEX IF NOT EXISTS user_quiz_sessions_experience_level_idx ON user_quiz_sessions(detected_experience_level);
CREATE INDEX IF NOT EXISTS user_quiz_sessions_conversion_idx ON user_quiz_sessions(conversion_to_account_at) WHERE conversion_to_account_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_quiz_sessions_ai_generated_idx ON user_quiz_sessions(ai_profile_generated) WHERE ai_profile_generated = TRUE;
CREATE INDEX IF NOT EXISTS user_quiz_sessions_quality_idx ON user_quiz_sessions(quiz_completion_quality_score DESC);

-- =============================================================================
-- 4. AI PROFILE CACHE TABLE
-- =============================================================================

-- Create table for caching AI-generated profiles for performance optimization
CREATE TABLE IF NOT EXISTS ai_profile_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personality_type TEXT NOT NULL,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'enthusiast', 'collector')),
  unique_profile_name TEXT NOT NULL,
  profile_description TEXT NOT NULL,
  style_descriptor TEXT,
  usage_count INTEGER DEFAULT 0,
  uniqueness_score DECIMAL(3,2) DEFAULT 0.0,
  generation_method TEXT DEFAULT 'template' CHECK (generation_method IN ('ai', 'template', 'hybrid')),
  ai_token_usage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Ensure uniqueness of profile names within personality + experience combinations
  UNIQUE(personality_type, experience_level, unique_profile_name)
);

-- Enable RLS for ai_profile_cache (allow public read for guest users)
ALTER TABLE ai_profile_cache ENABLE ROW LEVEL SECURITY;

-- RLS policy: Allow read access for profile generation, restrict writes to service role
CREATE POLICY "Public read access for profile generation" ON ai_profile_cache
  FOR SELECT USING (true);

CREATE POLICY "Service role only for cache management" ON ai_profile_cache
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only for cache updates" ON ai_profile_cache
  FOR UPDATE USING (auth.role() = 'service_role');

-- Indexes for fast AI profile cache lookups
CREATE INDEX IF NOT EXISTS ai_profile_cache_personality_exp_idx ON ai_profile_cache(personality_type, experience_level);
CREATE INDEX IF NOT EXISTS ai_profile_cache_usage_idx ON ai_profile_cache(usage_count DESC, last_used_at DESC);
CREATE INDEX IF NOT EXISTS ai_profile_cache_uniqueness_idx ON ai_profile_cache(uniqueness_score DESC);
CREATE INDEX IF NOT EXISTS ai_profile_cache_expires_idx ON ai_profile_cache(expires_at) WHERE expires_at > NOW();

-- =============================================================================
-- 5. DATABASE FUNCTIONS
-- =============================================================================

-- Enhanced quiz recommendations function with experience-level boosting
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
  personality_data RECORD;
BEGIN
  -- Get session details and personality data
  SELECT 
    uqs.detected_experience_level,
    ufp.personality_type
  INTO session_experience_level, user_personality_type
  FROM user_quiz_sessions uqs
  LEFT JOIN user_fragrance_personalities ufp ON ufp.session_id = uqs.id
  WHERE uqs.id = target_session_id;
  
  -- If no personality data found, use fallback
  IF user_personality_type IS NULL THEN
    user_personality_type := 'balanced_explorer';
  END IF;
  
  -- If no experience level detected, default to beginner
  IF session_experience_level IS NULL THEN
    session_experience_level := 'beginner';
  END IF;
  
  -- Return recommendations with experience-level optimization
  RETURN QUERY
  SELECT 
    f.id as fragrance_id,
    f.name,
    fb.name as brand,
    LEAST(1.0, (
      -- Base personality match (40%)
      COALESCE(similarity_score(f.id, user_personality_type), 0.5) * 0.4 +
      -- Sample availability boost (20%)
      CASE WHEN f.sample_available THEN 0.2 ELSE 0.0 END +
      -- Experience level relevance (20%)
      CASE 
        WHEN session_experience_level = 'beginner' AND f.popularity_score > 70 THEN 0.2
        WHEN session_experience_level = 'collector' AND f.popularity_score < 40 THEN 0.2
        WHEN session_experience_level = 'enthusiast' THEN 0.15
        ELSE 0.1
      END +
      -- Price accessibility (10%)
      CASE 
        WHEN f.sample_price_usd <= 8 THEN 0.1
        WHEN f.sample_price_usd <= 15 THEN 0.05
        ELSE 0.0
      END +
      -- Random factor for diversity (10%)
      (RANDOM() * 0.1)
    ) * CASE 
        WHEN include_experience_boost THEN
          CASE session_experience_level
            WHEN 'beginner' THEN 1.1  -- Boost popular choices
            WHEN 'collector' THEN 1.2  -- Boost unique choices
            ELSE 1.0
          END
        ELSE 1.0
      END)::DECIMAL(4,3) as match_score,
    generate_experience_appropriate_reasoning(f.id, user_personality_type, session_experience_level) as quiz_reasoning,
    map_experience_relevance(f.id, session_experience_level) as experience_relevance,
    f.sample_available,
    f.sample_price_usd
  FROM fragrances f
  JOIN fragrance_brands fb ON f.brand_id = fb.id
  WHERE f.sample_available = true  -- Only recommend available samples
  ORDER BY match_score DESC, f.popularity_score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Generate experience-appropriate reasoning
CREATE OR REPLACE FUNCTION generate_experience_appropriate_reasoning(
  fragrance_id UUID,
  personality_type TEXT,
  experience_level TEXT
) RETURNS TEXT AS $$
DECLARE
  fragrance_data RECORD;
  reasoning TEXT;
BEGIN
  -- Get fragrance details
  SELECT f.name, fb.name as brand, f.scent_family, f.notes
  INTO fragrance_data
  FROM fragrances f
  JOIN fragrance_brands fb ON f.brand_id = fb.id
  WHERE f.id = fragrance_id;
  
  -- Generate experience-appropriate reasoning
  CASE experience_level
    WHEN 'beginner' THEN
      reasoning := format('This %s fragrance from %s is perfect for someone discovering their scent style. Its approachable character makes it ideal for everyday wear.',
        COALESCE(fragrance_data.scent_family, 'beautiful'), fragrance_data.brand);
    WHEN 'enthusiast' THEN
      reasoning := format('Based on your %s preferences, this %s from %s offers the refined sophistication you appreciate. Its composition balances complexity with wearability.',
        personality_type, fragrance_data.name, fragrance_data.brand);
    WHEN 'collector' THEN
      reasoning := format('This exceptional %s represents the artistry and craftsmanship that resonates with your discerning %s aesthetic. Its sophisticated composition showcases masterful perfumery.',
        fragrance_data.name, personality_type);
    ELSE
      reasoning := format('This %s from %s aligns beautifully with your fragrance preferences.',
        fragrance_data.name, fragrance_data.brand);
  END CASE;
  
  RETURN reasoning;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Map experience relevance
CREATE OR REPLACE FUNCTION map_experience_relevance(
  fragrance_id UUID,
  experience_level TEXT
) RETURNS TEXT AS $$
DECLARE
  fragrance_popularity INTEGER;
  relevance TEXT;
BEGIN
  -- Get fragrance popularity
  SELECT COALESCE(popularity_score, 50) INTO fragrance_popularity
  FROM fragrances WHERE id = fragrance_id;
  
  CASE experience_level
    WHEN 'beginner' THEN
      IF fragrance_popularity > 70 THEN
        relevance := 'Popular choice - perfect for beginners';
      ELSE
        relevance := 'Approachable and easy to wear';
      END IF;
    WHEN 'enthusiast' THEN
      IF fragrance_popularity BETWEEN 30 AND 80 THEN
        relevance := 'Well-regarded among enthusiasts';
      ELSE
        relevance := 'Quality choice for developing taste';
      END IF;
    WHEN 'collector' THEN
      IF fragrance_popularity < 40 THEN
        relevance := 'Niche selection for collectors';
      ELSE
        relevance := 'Recognized quality in your collection';
      END IF;
    ELSE
      relevance := 'Matches your profile';
  END CASE;
  
  RETURN relevance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Calculate similarity score (simplified for now)
CREATE OR REPLACE FUNCTION similarity_score(
  fragrance_id UUID,
  personality_type TEXT
) RETURNS DECIMAL(3,2) AS $$
DECLARE
  base_score DECIMAL(3,2) := 0.6;
  scent_family TEXT;
BEGIN
  -- Get fragrance scent family
  SELECT f.scent_family INTO scent_family
  FROM fragrances f WHERE f.id = fragrance_id;
  
  -- Basic personality to scent family matching
  CASE 
    WHEN personality_type LIKE '%floral%' AND scent_family ILIKE '%floral%' THEN
      base_score := 0.9;
    WHEN personality_type LIKE '%fresh%' AND scent_family ILIKE '%fresh%' THEN
      base_score := 0.85;
    WHEN personality_type LIKE '%woody%' AND scent_family ILIKE '%woody%' THEN
      base_score := 0.85;
    WHEN personality_type LIKE '%oriental%' AND scent_family ILIKE '%oriental%' THEN
      base_score := 0.88;
    WHEN personality_type LIKE '%fruity%' AND scent_family ILIKE '%fruity%' THEN
      base_score := 0.82;
    WHEN personality_type LIKE '%gourmand%' AND scent_family ILIKE '%gourmand%' THEN
      base_score := 0.83;
    ELSE
      base_score := 0.6;
  END CASE;
  
  RETURN base_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. UNIQUE PROFILE NAME GENERATION FUNCTION
-- =============================================================================

-- Function to generate or retrieve unique profile names from cache
CREATE OR REPLACE FUNCTION get_unique_profile_name(
  personality_type TEXT,
  experience_level TEXT,
  force_new BOOLEAN DEFAULT FALSE
) RETURNS TEXT AS $$
DECLARE
  cached_name TEXT;
  new_name TEXT;
  adjectives TEXT[];
  nouns TEXT[];
  places TEXT[];
  dominant_dimension TEXT;
BEGIN
  -- Check cache first unless forcing new generation
  IF NOT force_new THEN
    SELECT unique_profile_name INTO cached_name
    FROM ai_profile_cache
    WHERE ai_profile_cache.personality_type = get_unique_profile_name.personality_type
      AND ai_profile_cache.experience_level = get_unique_profile_name.experience_level
      AND usage_count < 3  -- Limit reuse to maintain uniqueness
      AND expires_at > NOW()
    ORDER BY RANDOM()
    LIMIT 1;
    
    IF cached_name IS NOT NULL THEN
      -- Update usage count and last used timestamp
      UPDATE ai_profile_cache 
      SET 
        usage_count = usage_count + 1, 
        last_used_at = NOW()
      WHERE unique_profile_name = cached_name;
      
      RETURN cached_name;
    END IF;
  END IF;
  
  -- Generate new unique profile name
  -- Experience-level appropriate adjectives
  CASE experience_level
    WHEN 'beginner' THEN
      adjectives := ARRAY['Discovering', 'Gentle', 'Fresh', 'Sweet', 'Bright', 'Charming', 'Delightful', 'Pure'];
    WHEN 'enthusiast' THEN
      adjectives := ARRAY['Refined', 'Elegant', 'Sophisticated', 'Harmonious', 'Curated', 'Balanced', 'Graceful', 'Polished'];
    WHEN 'collector' THEN
      adjectives := ARRAY['Discerning', 'Connoisseur', 'Avant-garde', 'Masterful', 'Visionary', 'Distinguished', 'Exquisite', 'Sublime'];
    ELSE
      adjectives := ARRAY['Elegant', 'Sophisticated', 'Refined'];
  END CASE;
  
  -- Extract dominant dimension from personality type
  IF personality_type ILIKE '%floral%' THEN
    nouns := ARRAY['Bloom', 'Bouquet', 'Petal', 'Rose', 'Jasmine', 'Iris', 'Lily', 'Orchid'];
  ELSIF personality_type ILIKE '%fresh%' THEN
    nouns := ARRAY['Breeze', 'Dawn', 'Mist', 'Spring', 'Dewdrop', 'Zephyr', 'Aurora', 'Ozone'];
  ELSIF personality_type ILIKE '%oriental%' THEN
    nouns := ARRAY['Mystic', 'Spice', 'Incense', 'Amber', 'Saffron', 'Oud', 'Frankincense', 'Cardamom'];
  ELSIF personality_type ILIKE '%woody%' THEN
    nouns := ARRAY['Cedar', 'Sandalwood', 'Oak', 'Grove', 'Forest', 'Timber', 'Bark', 'Root'];
  ELSIF personality_type ILIKE '%fruity%' THEN
    nouns := ARRAY['Berry', 'Citrus', 'Nectar', 'Essence', 'Juice', 'Zest', 'Pulp', 'Rind'];
  ELSIF personality_type ILIKE '%gourmand%' THEN
    nouns := ARRAY['Confection', 'Dessert', 'Treat', 'Delicacy', 'Cream', 'Honey', 'Caramel', 'Vanilla'];
  ELSE
    nouns := ARRAY['Essence', 'Spirit', 'Soul', 'Dream', 'Vision', 'Aura'];
  END IF;
  
  -- Evocative places
  places := ARRAY[
    'Secret Gardens', 'Midnight Forests', 'Ancient Temples', 'Hidden Valleys',
    'Moonlit Orchards', 'Crystal Caves', 'Starry Meadows', 'Whispering Woods',
    'Golden Sanctuaries', 'Velvet Libraries', 'Silk Pavilions', 'Emerald Groves',
    'Pearl Chambers', 'Ruby Courtyards', 'Sapphire Halls', 'Diamond Galleries'
  ];
  
  -- Generate unique name using pattern: Adjective + Noun + "of" + Place
  new_name := 
    adjectives[1 + floor(random() * array_length(adjectives, 1))::int] || ' ' ||
    nouns[1 + floor(random() * array_length(nouns, 1))::int] || ' of ' ||
    places[1 + floor(random() * array_length(places, 1))::int];
  
  -- Cache the new name
  INSERT INTO ai_profile_cache (
    personality_type, 
    experience_level, 
    unique_profile_name, 
    profile_description,
    style_descriptor,
    usage_count,
    generation_method
  )
  VALUES (
    personality_type, 
    experience_level, 
    new_name,
    format('Template description for %s %s profile', experience_level, personality_type),
    'template_generated',
    1,
    'template'
  )
  ON CONFLICT (personality_type, experience_level, unique_profile_name) 
  DO UPDATE SET 
    usage_count = ai_profile_cache.usage_count + 1,
    last_used_at = NOW();
  
  RETURN new_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. ANALYTICS AND REPORTING FUNCTIONS
-- =============================================================================

-- Function to get quiz completion analytics by experience level
CREATE OR REPLACE FUNCTION get_quiz_analytics_by_experience(
  date_range_days INTEGER DEFAULT 7
) RETURNS TABLE (
  experience_level TEXT,
  total_sessions INTEGER,
  completed_sessions INTEGER,
  completion_rate DECIMAL(5,2),
  avg_completion_time_minutes DECIMAL(8,2),
  conversion_to_account_rate DECIMAL(5,2),
  ai_profiles_generated INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(uqs.detected_experience_level, 'unknown') as experience_level,
    COUNT(*)::INTEGER as total_sessions,
    COUNT(CASE WHEN uqs.is_completed THEN 1 END)::INTEGER as completed_sessions,
    ROUND(
      COUNT(CASE WHEN uqs.is_completed THEN 1 END)::DECIMAL / 
      NULLIF(COUNT(*), 0) * 100, 
      2
    ) as completion_rate,
    ROUND(
      AVG(EXTRACT(EPOCH FROM (uqs.completed_at - uqs.started_at)) / 60), 
      2
    ) as avg_completion_time_minutes,
    ROUND(
      COUNT(CASE WHEN uqs.conversion_to_account_at IS NOT NULL THEN 1 END)::DECIMAL / 
      NULLIF(COUNT(CASE WHEN uqs.is_completed THEN 1 END), 0) * 100, 
      2
    ) as conversion_to_account_rate,
    COUNT(CASE WHEN uqs.ai_profile_generated THEN 1 END)::INTEGER as ai_profiles_generated
  FROM user_quiz_sessions uqs
  WHERE uqs.created_at >= (NOW() - INTERVAL '%d days', date_range_days)
  GROUP BY COALESCE(uqs.detected_experience_level, 'unknown')
  ORDER BY total_sessions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get favorite fragrance insights
CREATE OR REPLACE FUNCTION get_favorite_fragrance_insights(
  target_user_id UUID
) RETURNS TABLE (
  total_favorites INTEGER,
  top_brand TEXT,
  dominant_scent_family TEXT,
  selection_confidence DECIMAL(3,2),
  discovery_patterns JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_favorites,
    (
      SELECT fb.name 
      FROM user_favorite_fragrances uff2
      JOIN fragrances f2 ON uff2.fragrance_id = f2.id
      JOIN fragrance_brands fb ON f2.brand_id = fb.id
      WHERE uff2.user_id = target_user_id
      GROUP BY fb.name
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as top_brand,
    (
      SELECT f3.scent_family
      FROM user_favorite_fragrances uff3
      JOIN fragrances f3 ON uff3.fragrance_id = f3.id
      WHERE uff3.user_id = target_user_id AND f3.scent_family IS NOT NULL
      GROUP BY f3.scent_family
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as dominant_scent_family,
    ROUND(AVG(uff.confidence_score), 2) as selection_confidence,
    json_build_object(
      'selection_sources', json_agg(DISTINCT uff.selection_source),
      'avg_days_since_selection', ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - uff.selected_at)) / 86400), 1),
      'has_quiz_selections', bool_or(uff.selection_source = 'quiz_input')
    ) as discovery_patterns
  FROM user_favorite_fragrances uff
  WHERE uff.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 8. MIGRATION VALIDATION
-- =============================================================================

-- Verify all new tables exist
DO $$
BEGIN
  ASSERT (SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_favorite_fragrances'
  )), 'user_favorite_fragrances table was not created';
  
  ASSERT (SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ai_profile_cache'
  )), 'ai_profile_cache table was not created';
  
  RAISE NOTICE 'Enhanced Quiz Profile System migration completed successfully';
END $$;