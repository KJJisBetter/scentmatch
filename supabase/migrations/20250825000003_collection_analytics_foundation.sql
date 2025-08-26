-- Collection Analytics Foundation Migration
-- Date: 2025-08-25
-- Purpose: Create analytics tracking tables and functions for collection insights

-- ============================================================================
-- STEP 1: CREATE ANALYTICS EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS collection_analytics_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_session_id TEXT, -- For anonymous users
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    quiz_session_token TEXT, -- Attribution to originating quiz
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_session_id IS NULL) OR
        (user_id IS NULL AND guest_session_id IS NOT NULL)
    )
);

-- Add event type validation
ALTER TABLE collection_analytics_events 
ADD CONSTRAINT valid_event_type CHECK (
    event_type IN (
        'quiz_to_collection_conversion',
        'collection_item_added',
        'collection_item_removed',
        'collection_viewed',
        'collection_shared',
        'collection_organized',
        'fragrance_rated',
        'sample_ordered',
        'collection_milestone_reached'
    )
);

-- ============================================================================
-- STEP 2: CREATE COLLECTION SHARES TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS collection_shares (
    id BIGSERIAL PRIMARY KEY,
    collection_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    share_type TEXT NOT NULL CHECK (share_type IN ('collection', 'quiz_results', 'single_fragrance')),
    share_platform TEXT NOT NULL CHECK (share_platform IN ('twitter', 'instagram', 'facebook', 'direct_link', 'email', 'other')),
    share_data JSONB NOT NULL DEFAULT '{}',
    
    -- Metrics
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0, -- Referrals who create accounts
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration for temporary shares
    
    -- Share URL tracking
    share_url TEXT,
    share_token TEXT UNIQUE -- For tracking clicks and conversions
);

-- ============================================================================
-- STEP 3: CREATE USER ENGAGEMENT SCORES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_engagement_scores (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Collection metrics
    collection_size INTEGER DEFAULT 0,
    quiz_completion_count INTEGER DEFAULT 0,
    social_engagement_score INTEGER DEFAULT 0,
    
    -- Behavioral metrics
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    days_since_signup INTEGER DEFAULT 0,
    fragrance_ratings_count INTEGER DEFAULT 0,
    shares_created INTEGER DEFAULT 0,
    
    -- Calculated engagement level
    engagement_level TEXT DEFAULT 'beginner' CHECK (engagement_level IN ('beginner', 'intermediate', 'expert')),
    engagement_score_raw INTEGER DEFAULT 0, -- 0-1000 scale
    
    -- Preferences and patterns
    preferred_scent_families TEXT[] DEFAULT '{}',
    activity_patterns JSONB DEFAULT '{}',
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE COLLECTION INSIGHTS CACHE TABLE  
-- ============================================================================

CREATE TABLE IF NOT EXISTS collection_insights_cache (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    insight_data JSONB NOT NULL DEFAULT '{}',
    
    -- Cache metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    cache_version INTEGER DEFAULT 1,
    
    -- Performance tracking
    generation_time_ms INTEGER DEFAULT 0,
    
    UNIQUE(user_id, insight_type)
);

-- Add insight type validation
ALTER TABLE collection_insights_cache
ADD CONSTRAINT valid_insight_type CHECK (
    insight_type IN (
        'scent_profile_analysis',
        'collection_statistics',
        'recommendation_accuracy',
        'seasonal_preferences',
        'brand_affinity',
        'discovery_patterns',
        'social_context'
    )
);

-- ============================================================================
-- STEP 5: CREATE PERFORMANCE-OPTIMIZED INDEXES
-- ============================================================================

-- Analytics events indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_id 
    ON collection_analytics_events(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_guest_session 
    ON collection_analytics_events(guest_session_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_type_created 
    ON collection_analytics_events(event_type, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_quiz_token 
    ON collection_analytics_events(quiz_session_token);

-- Collection shares indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_shares_owner 
    ON collection_shares(collection_owner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_shares_platform_created 
    ON collection_shares(share_platform, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_shares_token 
    ON collection_shares(share_token);

-- Engagement scores indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_engagement_level 
    ON user_engagement_scores(engagement_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_engagement_score 
    ON user_engagement_scores(engagement_score_raw DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_engagement_last_active 
    ON user_engagement_scores(last_active_at DESC);

-- Insights cache indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insights_cache_user_type 
    ON collection_insights_cache(user_id, insight_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insights_cache_expires 
    ON collection_insights_cache(expires_at);

-- ============================================================================
-- STEP 6: CREATE ANALYTICS FUNCTIONS
-- ============================================================================

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION calculate_user_engagement_score(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    collection_size INTEGER;
    quiz_count INTEGER;
    ratings_count INTEGER;
    shares_count INTEGER;
    days_active INTEGER;
    final_score INTEGER;
BEGIN
    -- Get collection metrics
    SELECT COALESCE(COUNT(*), 0) INTO collection_size
    FROM user_collections 
    WHERE user_id = target_user_id;
    
    -- Get quiz completion count (from analytics events)
    SELECT COALESCE(COUNT(DISTINCT quiz_session_token), 0) INTO quiz_count
    FROM collection_analytics_events 
    WHERE user_id = target_user_id AND quiz_session_token IS NOT NULL;
    
    -- Get ratings count
    SELECT COALESCE(COUNT(*), 0) INTO ratings_count
    FROM user_collections 
    WHERE user_id = target_user_id AND rating IS NOT NULL;
    
    -- Get shares count
    SELECT COALESCE(COUNT(*), 0) INTO shares_count
    FROM collection_shares 
    WHERE collection_owner_id = target_user_id;
    
    -- Calculate days active (from engagement table or user creation)
    SELECT COALESCE(days_since_signup, 0) INTO days_active
    FROM user_engagement_scores 
    WHERE user_id = target_user_id;
    
    -- Calculate engagement score (0-1000 scale)
    final_score := LEAST(1000, (
        (collection_size * 20) +           -- Up to 200 points for 10 items
        (quiz_count * 50) +                -- Up to 150 points for 3 quizzes
        (ratings_count * 10) +             -- Up to 200 points for 20 ratings
        (shares_count * 25) +              -- Up to 125 points for 5 shares
        CASE 
            WHEN days_active > 30 THEN 100 -- Bonus for month+ users
            WHEN days_active > 7 THEN 50   -- Bonus for week+ users
            ELSE 0
        END +
        CASE
            WHEN collection_size >= 25 THEN 200  -- Power user bonus
            WHEN collection_size >= 10 THEN 100  -- Active user bonus
            ELSE 0
        END
    ));
    
    RETURN final_score;
END;
$$;

-- Function to determine engagement level from score
CREATE OR REPLACE FUNCTION get_engagement_level_from_score(score INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    CASE
        WHEN score >= 400 THEN RETURN 'expert';
        WHEN score >= 150 THEN RETURN 'intermediate';
        ELSE RETURN 'beginner';
    END CASE;
END;
$$;

-- Function to update user engagement scores
CREATE OR REPLACE FUNCTION update_user_engagement_metrics(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    calculated_score INTEGER;
    calculated_level TEXT;
    collection_count INTEGER;
    ratings_count INTEGER;
    shares_count INTEGER;
    user_created_at TIMESTAMP;
    days_since_signup INTEGER;
BEGIN
    -- Calculate current engagement score
    SELECT calculate_user_engagement_score(target_user_id) INTO calculated_score;
    SELECT get_engagement_level_from_score(calculated_score) INTO calculated_level;
    
    -- Get current metrics
    SELECT COALESCE(COUNT(*), 0) INTO collection_count
    FROM user_collections WHERE user_id = target_user_id;
    
    SELECT COALESCE(COUNT(*), 0) INTO ratings_count
    FROM user_collections WHERE user_id = target_user_id AND rating IS NOT NULL;
    
    SELECT COALESCE(COUNT(*), 0) INTO shares_count
    FROM collection_shares WHERE collection_owner_id = target_user_id;
    
    -- Get user creation date
    SELECT created_at INTO user_created_at
    FROM auth.users WHERE id = target_user_id;
    
    days_since_signup := EXTRACT(DAY FROM (NOW() - user_created_at))::INTEGER;
    
    -- Upsert engagement scores
    INSERT INTO user_engagement_scores (
        user_id,
        collection_size,
        fragrance_ratings_count,
        shares_created,
        engagement_score_raw,
        engagement_level,
        days_since_signup,
        last_active_at,
        updated_at
    ) VALUES (
        target_user_id,
        collection_count,
        ratings_count,
        shares_count,
        calculated_score,
        calculated_level,
        days_since_signup,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        collection_size = EXCLUDED.collection_size,
        fragrance_ratings_count = EXCLUDED.fragrance_ratings_count,
        shares_created = EXCLUDED.shares_created,
        engagement_score_raw = EXCLUDED.engagement_score_raw,
        engagement_level = EXCLUDED.engagement_level,
        days_since_signup = EXCLUDED.days_since_signup,
        last_active_at = NOW(),
        updated_at = NOW();
END;
$$;

-- ============================================================================
-- STEP 7: CREATE AUTOMATED TRIGGERS
-- ============================================================================

-- Trigger to update engagement scores when collections change
CREATE OR REPLACE FUNCTION trigger_update_engagement_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_user UUID;
BEGIN
    -- Get user_id from NEW or OLD record
    target_user := COALESCE(NEW.user_id, OLD.user_id);
    
    -- Only process if we have a valid user_id
    IF target_user IS NOT NULL THEN
        -- Update engagement metrics asynchronously (don't block the main operation)
        PERFORM pg_notify('update_engagement_scores', target_user::TEXT);
        
        -- For immediate sync, we can also update directly (comment out if performance is an issue)
        PERFORM update_user_engagement_metrics(target_user);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply trigger to user_collections
DROP TRIGGER IF EXISTS trigger_engagement_update_collections ON user_collections;
CREATE TRIGGER trigger_engagement_update_collections
    AFTER INSERT OR UPDATE OR DELETE ON user_collections
    FOR EACH ROW EXECUTE FUNCTION trigger_update_engagement_scores();

-- Apply trigger to collection_shares
DROP TRIGGER IF EXISTS trigger_engagement_update_shares ON collection_shares;
CREATE TRIGGER trigger_engagement_update_shares
    AFTER INSERT OR UPDATE OR DELETE ON collection_shares
    FOR EACH ROW EXECUTE FUNCTION trigger_update_engagement_scores();

-- ============================================================================
-- STEP 8: CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE collection_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_insights_cache ENABLE ROW LEVEL SECURITY;

-- Analytics events policies
CREATE POLICY "Users can access their own analytics events" ON collection_analytics_events
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all analytics events" ON collection_analytics_events
    FOR ALL USING (auth.role() = 'service_role');

-- Collection shares policies
CREATE POLICY "Users can manage their own collection shares" ON collection_shares
    FOR ALL USING (auth.uid() = collection_owner_id OR auth.uid() = shared_by_user_id);

CREATE POLICY "Service role can manage all collection shares" ON collection_shares
    FOR ALL USING (auth.role() = 'service_role');

-- Engagement scores policies
CREATE POLICY "Users can view their own engagement scores" ON user_engagement_scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all engagement scores" ON user_engagement_scores
    FOR ALL USING (auth.role() = 'service_role');

-- Insights cache policies
CREATE POLICY "Users can access their own insights cache" ON collection_insights_cache
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all insights cache" ON collection_insights_cache
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 9: CREATE CLEANUP FUNCTIONS
-- ============================================================================

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_insights_cache()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM collection_insights_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Function to clean up old analytics events (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM collection_analytics_events 
    WHERE created_at < (NOW() - INTERVAL '90 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- ============================================================================
-- STEP 10: GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT ON collection_analytics_events TO authenticated;
GRANT SELECT ON collection_shares TO authenticated;
GRANT SELECT ON user_engagement_scores TO authenticated;
GRANT SELECT ON collection_insights_cache TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Collection Analytics Foundation migration completed successfully';
    RAISE NOTICE 'Created tables: collection_analytics_events, collection_shares, user_engagement_scores, collection_insights_cache';
    RAISE NOTICE 'Created functions: calculate_user_engagement_score, update_user_engagement_metrics, cleanup functions';
    RAISE NOTICE 'Applied RLS policies and triggers for automatic engagement tracking';
END $$;