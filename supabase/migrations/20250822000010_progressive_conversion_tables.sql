-- PROGRESSIVE CONVERSION TRACKING TABLES MIGRATION
-- Date: 2025-08-22
-- Purpose: Fix missing tables breaking progressive conversion and guest engagement
-- Addresses: Server errors for conversion_funnel_tracking and guest_engagement_tracking

-- ============================================================================
-- STEP 1: CREATE CONVERSION FUNNEL TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversion_funnel_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL,
  funnel_step TEXT NOT NULL CHECK (funnel_step IN (
    'quiz_completed', 
    'results_viewed', 
    'engagement_building', 
    'conversion_offered', 
    'account_created'
  )),
  investment_score DECIMAL(3,2) DEFAULT 0.0 CHECK (investment_score >= 0.0 AND investment_score <= 1.0),
  time_spent_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional for logged in users
  ip_address INET, -- For analytics
  user_agent TEXT, -- For device tracking
  referrer TEXT, -- Where they came from
  
  -- Performance tracking
  page_load_time_ms INTEGER,
  interaction_delay_ms INTEGER,
  
  -- Conversion metrics
  conversion_probability DECIMAL(3,2), -- Calculated likelihood of conversion
  conversion_trigger TEXT, -- What triggered this step
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- STEP 2: CREATE GUEST ENGAGEMENT TRACKING TABLE  
-- ============================================================================

CREATE TABLE IF NOT EXISTS guest_engagement_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL,
  engagement_events JSONB NOT NULL DEFAULT '[]'::JSONB,
  investment_score DECIMAL(3,2) DEFAULT 0.0 CHECK (investment_score >= 0.0 AND investment_score <= 1.0),
  conversion_readiness TEXT DEFAULT 'low' CHECK (conversion_readiness IN ('low', 'medium', 'high')),
  tracked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Session context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional for logged in users
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Engagement metrics
  total_time_spent_seconds INTEGER DEFAULT 0,
  pages_visited INTEGER DEFAULT 1,
  fragrances_viewed INTEGER DEFAULT 0,
  favorites_added INTEGER DEFAULT 0,
  samples_requested INTEGER DEFAULT 0,
  
  -- Behavioral indicators
  scroll_depth_percentage INTEGER DEFAULT 0 CHECK (scroll_depth_percentage >= 0 AND scroll_depth_percentage <= 100),
  click_frequency DECIMAL(5,2) DEFAULT 0.0, -- Clicks per minute
  return_visits INTEGER DEFAULT 0,
  
  -- Value building progress
  value_phase TEXT DEFAULT 'exploration' CHECK (value_phase IN ('exploration', 'investment', 'conversion')),
  last_activity_type TEXT,
  peak_engagement_moment TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- STEP 3: CREATE SEARCH RANKING AND POPULARITY SYSTEM
-- ============================================================================

-- Add popularity and ranking columns to fragrances table if they don't exist
DO $$
BEGIN
  -- Add search ranking score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fragrances' AND column_name = 'search_ranking_score'
  ) THEN
    ALTER TABLE fragrances ADD COLUMN search_ranking_score DECIMAL(10,4) DEFAULT 0.0;
  END IF;

  -- Add beginner friendly indicator
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fragrances' AND column_name = 'beginner_friendly'
  ) THEN
    ALTER TABLE fragrances ADD COLUMN beginner_friendly BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add variant hierarchy information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fragrances' AND column_name = 'is_main_variant'
  ) THEN
    ALTER TABLE fragrances ADD COLUMN is_main_variant BOOLEAN DEFAULT FALSE;
    ALTER TABLE fragrances ADD COLUMN parent_fragrance_id TEXT REFERENCES fragrances(id) ON DELETE SET NULL;
    ALTER TABLE fragrances ADD COLUMN variant_type TEXT CHECK (variant_type IN ('edt', 'edp', 'parfum', 'cologne', 'intense', 'elixir', 'absolute', 'limited'));
  END IF;

  -- Add normalized ID for better linking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fragrances' AND column_name = 'normalized_id'
  ) THEN
    ALTER TABLE fragrances ADD COLUMN normalized_id TEXT;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Conversion funnel tracking indexes
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_session_token ON conversion_funnel_tracking(session_token);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_step ON conversion_funnel_tracking(funnel_step);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_timestamp ON conversion_funnel_tracking(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_investment_score ON conversion_funnel_tracking(investment_score DESC);

-- Guest engagement tracking indexes
CREATE INDEX IF NOT EXISTS idx_guest_engagement_session_token ON guest_engagement_tracking(session_token);
CREATE INDEX IF NOT EXISTS idx_guest_engagement_tracked_at ON guest_engagement_tracking(tracked_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_engagement_investment_score ON guest_engagement_tracking(investment_score DESC);
CREATE INDEX IF NOT EXISTS idx_guest_engagement_conversion_readiness ON guest_engagement_tracking(conversion_readiness);
CREATE INDEX IF NOT EXISTS idx_guest_engagement_value_phase ON guest_engagement_tracking(value_phase);

-- Search and ranking indexes
CREATE INDEX IF NOT EXISTS idx_fragrances_search_ranking ON fragrances(search_ranking_score DESC);
CREATE INDEX IF NOT EXISTS idx_fragrances_beginner_friendly ON fragrances(beginner_friendly) WHERE beginner_friendly = TRUE;
CREATE INDEX IF NOT EXISTS idx_fragrances_main_variant ON fragrances(is_main_variant) WHERE is_main_variant = TRUE;
CREATE INDEX IF NOT EXISTS idx_fragrances_normalized_id ON fragrances(normalized_id);

-- ============================================================================
-- STEP 5: CREATE SEARCH RANKING FUNCTION
-- ============================================================================

-- Function to calculate search ranking score combining multiple factors
CREATE OR REPLACE FUNCTION calculate_search_ranking_score(
  popularity_score DECIMAL DEFAULT 0,
  rating_value DECIMAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  trending_score INTEGER DEFAULT 0,
  is_main_variant BOOLEAN DEFAULT FALSE,
  beginner_friendly BOOLEAN DEFAULT FALSE
)
RETURNS DECIMAL(10,4) AS $$
DECLARE
  base_score DECIMAL(10,4) := 0.0;
  popularity_weight DECIMAL(10,4) := 0.4;
  rating_weight DECIMAL(10,4) := 0.3;
  trend_weight DECIMAL(10,4) := 0.2;
  variant_bonus DECIMAL(10,4) := 0.1;
  beginner_bonus DECIMAL(10,4) := 0.05;
BEGIN
  -- Base popularity component (0-40 points)
  base_score := base_score + (COALESCE(popularity_score, 0) * popularity_weight);
  
  -- Rating quality component (0-30 points)
  IF COALESCE(rating_count, 0) > 0 THEN
    -- Weight rating by number of reviews (more reviews = more reliable)
    base_score := base_score + (
      COALESCE(rating_value, 0) * rating_weight * 
      LEAST(COALESCE(rating_count, 0) / 100.0, 1.0) -- Max weight at 100+ reviews
    );
  END IF;
  
  -- Trending component (0-20 points)
  base_score := base_score + (COALESCE(trending_score, 0) / 100.0 * trend_weight);
  
  -- Main variant bonus (prioritize main fragrances over variants)
  IF is_main_variant THEN
    base_score := base_score + variant_bonus;
  END IF;
  
  -- Beginner friendly bonus
  IF beginner_friendly THEN
    base_score := base_score + beginner_bonus;
  END IF;
  
  RETURN LEAST(base_score, 1.0); -- Cap at 1.0
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 6: CREATE FRAGRANCE ID NORMALIZATION FUNCTION
-- ============================================================================

-- Function to normalize fragrance IDs and prevent 404s
CREATE OR REPLACE FUNCTION normalize_fragrance_id(input_id TEXT)
RETURNS TEXT AS $$
BEGIN
  IF input_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove double underscores and normalize separators
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(input_id, '__+', '_', 'g'), -- Replace multiple underscores with single
      '[^a-z0-9_-]', '', 'g' -- Remove invalid characters
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 7: UPDATE EXISTING FRAGRANCE DATA
-- ============================================================================

-- Update normalized IDs for all fragrances
UPDATE fragrances 
SET normalized_id = normalize_fragrance_id(id)
WHERE normalized_id IS NULL;

-- Calculate search ranking scores for all fragrances
UPDATE fragrances 
SET search_ranking_score = calculate_search_ranking_score(
  popularity_score,
  rating_value,
  rating_count,
  trending_score,
  is_main_variant,
  beginner_friendly
);

-- ============================================================================
-- STEP 8: ENSURE SAUVAGE EXISTS AND IS PROPERLY CONFIGURED
-- ============================================================================

-- First, let's ensure Dior brand exists
INSERT INTO fragrance_brands (id, name, slug, brand_tier, is_active)
VALUES ('dior', 'Dior', 'dior', 'luxury', TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand_tier = EXCLUDED.brand_tier,
  is_active = EXCLUDED.is_active;

-- Insert/Update main Sauvage variants with proper hierarchy
INSERT INTO fragrances (
  id, brand_id, name, slug, gender, launch_year, fragrance_family,
  main_accords, full_description, short_description,
  rating_value, rating_count, popularity_score, trending_score,
  sample_available, sample_price_usd, is_verified,
  beginner_friendly, is_main_variant, variant_type,
  normalized_id, search_ranking_score
) VALUES 
-- Main Sauvage EDP (most popular)
(
  'dior_sauvage_edp', 'dior', 'Sauvage Eau de Parfum', 'sauvage-eau-de-parfum', 
  'men', 2018, 'woody',
  ARRAY['bergamot', 'pepper', 'lavender', 'ambroxan', 'sandalwood'],
  'A radically fresh composition that is raw and noble at the same time. Sauvage Eau de Parfum rewrites the rules of men''s fragrance by reconciling strength and nobility, natural freshness and sensuality.',
  'The iconic men''s fragrance with bergamot and ambroxan',
  4.2, 3500, 25.5, 95,
  TRUE, 18, TRUE,
  TRUE, TRUE, 'edp',
  'dior_sauvage_edp', 0.0
),
-- Sauvage EDT (original)
(
  'dior_sauvage_edt', 'dior', 'Sauvage Eau de Toilette', 'sauvage-eau-de-toilette',
  'men', 2015, 'woody', 
  ARRAY['bergamot', 'pepper', 'ambroxan', 'geranium', 'patchouli'],
  'Sauvage Eau de Toilette is a masterpiece composition that captures the fresh and noble accents of bergamot and ambroxan. A raw and fresh fragrance.',
  'The original Sauvage - fresh bergamot and ambroxan',
  4.1, 4200, 23.8, 85,
  TRUE, 16, TRUE,
  TRUE, FALSE, 'edt',
  'dior_sauvage_edt', 0.0
),
-- Sauvage Parfum (most intense)
(
  'dior_sauvage_parfum', 'dior', 'Sauvage Parfum', 'sauvage-parfum',
  'men', 2019, 'woody',
  ARRAY['bergamot', 'sandalwood', 'olibanum', 'vanilla', 'amber'],
  'Sauvage Parfum is a highly concentrated interpretation of the original, developed around an emblematic name in perfumery. A powerful and mysterious fragrance.',
  'The most intense Sauvage with sandalwood and vanilla',
  4.3, 1800, 20.2, 75,
  TRUE, 22, TRUE,
  FALSE, FALSE, 'parfum',
  'dior_sauvage_parfum', 0.0
)
ON CONFLICT (id) DO UPDATE SET
  rating_value = EXCLUDED.rating_value,
  rating_count = EXCLUDED.rating_count,
  popularity_score = EXCLUDED.popularity_score,
  trending_score = EXCLUDED.trending_score,
  beginner_friendly = EXCLUDED.beginner_friendly,
  is_main_variant = EXCLUDED.is_main_variant,
  normalized_id = EXCLUDED.normalized_id;

-- Update search ranking scores for Sauvage variants
UPDATE fragrances 
SET search_ranking_score = calculate_search_ranking_score(
  popularity_score,
  rating_value,
  rating_count,
  trending_score,
  is_main_variant,
  beginner_friendly
)
WHERE id LIKE 'dior_sauvage_%';

-- ============================================================================
-- STEP 9: CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE conversion_funnel_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_engagement_tracking ENABLE ROW LEVEL SECURITY;

-- Conversion funnel tracking policies
CREATE POLICY "Users can access own conversion data" ON conversion_funnel_tracking
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role manages conversion tracking" ON conversion_funnel_tracking
  FOR ALL TO service_role USING (true);

-- Guest engagement tracking policies  
CREATE POLICY "Users can access own engagement data" ON guest_engagement_tracking
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role manages engagement tracking" ON guest_engagement_tracking
  FOR ALL TO service_role USING (true);

-- ============================================================================
-- STEP 10: CREATE TRIGGER FOR AUTOMATIC UPDATES
-- ============================================================================

-- Trigger to automatically update search ranking when fragrance data changes
CREATE OR REPLACE FUNCTION update_search_ranking()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_ranking_score := calculate_search_ranking_score(
    NEW.popularity_score,
    NEW.rating_value,
    NEW.rating_count,
    NEW.trending_score,
    NEW.is_main_variant,
    NEW.beginner_friendly
  );
  
  NEW.normalized_id := normalize_fragrance_id(NEW.id);
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to fragrances table
DROP TRIGGER IF EXISTS trigger_update_search_ranking ON fragrances;
CREATE TRIGGER trigger_update_search_ranking
  BEFORE INSERT OR UPDATE ON fragrances
  FOR EACH ROW EXECUTE FUNCTION update_search_ranking();

-- ============================================================================
-- FINAL VALIDATION
-- ============================================================================

DO $$
BEGIN
  -- Verify conversion funnel tracking table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'conversion_funnel_tracking'
  ) THEN
    RAISE EXCEPTION 'Progressive conversion migration failed: conversion_funnel_tracking table not created';
  END IF;
  
  -- Verify guest engagement tracking table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'guest_engagement_tracking'
  ) THEN
    RAISE EXCEPTION 'Progressive conversion migration failed: guest_engagement_tracking table not created';
  END IF;
  
  -- Verify Sauvage variants exist
  IF NOT EXISTS (
    SELECT 1 FROM fragrances 
    WHERE id LIKE 'dior_sauvage_%' AND is_main_variant = TRUE
  ) THEN
    RAISE EXCEPTION 'Sauvage data migration failed: main Sauvage variant not found';
  END IF;
  
  -- Verify search ranking function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'calculate_search_ranking_score'
  ) THEN
    RAISE EXCEPTION 'Search ranking migration failed: ranking function not created';
  END IF;
  
  RAISE NOTICE 'Progressive conversion migration completed successfully!';
  RAISE NOTICE 'Tables created: conversion_funnel_tracking, guest_engagement_tracking';
  RAISE NOTICE 'Sauvage variants configured with proper hierarchy';
  RAISE NOTICE 'Search ranking system implemented';
  RAISE NOTICE 'Fragrance ID normalization system active';
END $$;