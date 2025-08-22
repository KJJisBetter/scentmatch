-- SCE-69: Social Validation and Peer Context System
-- Date: 2025-08-22
-- Purpose: Add demographic tracking, social metrics, and peer validation for fragrance decisions

-- ============================================================================
-- STEP 1: CREATE USER DEMOGRAPHICS TABLE
-- ============================================================================

CREATE TABLE user_demographics (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    guest_session_id TEXT, -- For anonymous users
    
    -- Core Demographics
    age_group TEXT CHECK (age_group IN (
        '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
    )),
    experience_level TEXT CHECK (experience_level IN (
        'beginner', 'intermediate', 'experienced', 'expert'
    )) DEFAULT 'beginner',
    gender_preference TEXT CHECK (gender_preference IN (
        'men', 'women', 'unisex', 'no_preference'
    )),
    
    -- Geographic Context
    country_code TEXT, -- ISO country code
    region TEXT, -- Geographic region for cultural context
    
    -- Style Preferences (for similarity matching)
    style_preferences TEXT[], -- Array of style descriptors
    occasion_preferences TEXT[], -- Preferred occasions
    season_preferences TEXT[], -- Seasonal preferences
    
    -- Social Context
    social_influence_level INTEGER DEFAULT 5 CHECK (social_influence_level >= 1 AND social_influence_level <= 10),
    uniqueness_preference INTEGER DEFAULT 5 CHECK (uniqueness_preference >= 1 AND uniqueness_preference <= 10),
    
    -- Tracking
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_seen_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure either user_id or guest_session_id is present
    CONSTRAINT chk_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_session_id IS NULL) OR
        (user_id IS NULL AND guest_session_id IS NOT NULL)
    )
);

-- ============================================================================
-- STEP 2: CREATE SOCIAL METRICS TABLE
-- ============================================================================

CREATE TABLE fragrance_social_metrics (
    id SERIAL PRIMARY KEY,
    fragrance_id TEXT NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    
    -- Demographic Breakdown
    demographic_group TEXT NOT NULL, -- Format: "age:18-24,experience:beginner"
    
    -- Social Metrics
    total_users INTEGER DEFAULT 0,
    approval_rating DECIMAL(3,2) DEFAULT 0.00, -- 0.00-5.00 stars
    approval_count INTEGER DEFAULT 0,
    love_percentage DECIMAL(5,2) DEFAULT 0.00, -- Percentage who rated 4+ stars
    
    -- Experience Level Metrics
    beginner_approval DECIMAL(3,2) DEFAULT 0.00,
    beginner_count INTEGER DEFAULT 0,
    experienced_approval DECIMAL(3,2) DEFAULT 0.00,
    experienced_count INTEGER DEFAULT 0,
    
    -- Usage Patterns
    primary_occasions TEXT[], -- Most common occasions for this demographic
    seasonal_usage JSONB, -- Seasonal breakdown
    
    -- Confidence Metrics
    sample_size INTEGER DEFAULT 0, -- Total interactions
    confidence_score DECIMAL(3,2) DEFAULT 0.00, -- Statistical confidence (0-1)
    last_updated TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(fragrance_id, demographic_group)
);

-- ============================================================================
-- STEP 3: CREATE POPULARITY TRENDS TABLE
-- ============================================================================

CREATE TABLE fragrance_popularity_trends (
    id SERIAL PRIMARY KEY,
    fragrance_id TEXT NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    
    -- Time Period
    period_type TEXT NOT NULL CHECK (period_type IN (
        'daily', 'weekly', 'monthly', 'quarterly'
    )),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Popularity Metrics
    search_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    collection_adds INTEGER DEFAULT 0,
    sample_requests INTEGER DEFAULT 0,
    
    -- Trending Metrics
    trending_score DECIMAL(10,4) DEFAULT 0, -- Calculated trending score
    velocity_score DECIMAL(10,4) DEFAULT 0, -- Rate of change
    social_mentions INTEGER DEFAULT 0, -- External social references
    
    -- Comparative Metrics
    rank_in_category INTEGER, -- Rank within fragrance family
    percentile_score DECIMAL(5,2), -- Percentile within all fragrances
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(fragrance_id, period_type, period_start)
);

-- ============================================================================
-- STEP 4: CREATE PEER APPROVAL RATINGS TABLE
-- ============================================================================

CREATE TABLE peer_approval_ratings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_session_id TEXT,
    fragrance_id TEXT NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    
    -- Rating Details
    overall_rating DECIMAL(2,1) CHECK (overall_rating >= 0.0 AND overall_rating <= 5.0),
    would_recommend BOOLEAN DEFAULT false,
    experience_rating TEXT CHECK (experience_rating IN (
        'love', 'like', 'neutral', 'dislike', 'hate'
    )),
    
    -- Context
    usage_occasion TEXT, -- When they used/tested it
    wear_duration_hours INTEGER, -- How long they wore it
    experience_level_when_rated TEXT CHECK (experience_level_when_rated IN (
        'beginner', 'intermediate', 'experienced', 'expert'
    )),
    
    -- Social Validation
    is_verified_purchase BOOLEAN DEFAULT false,
    is_sample_experience BOOLEAN DEFAULT true,
    confidence_in_rating INTEGER CHECK (confidence_in_rating >= 1 AND confidence_in_rating <= 10),
    
    -- Review Content
    quick_review TEXT, -- Short review text
    helpful_votes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure either user_id or guest_session_id is present
    CONSTRAINT chk_user_or_guest_rating CHECK (
        (user_id IS NOT NULL AND guest_session_id IS NULL) OR
        (user_id IS NULL AND guest_session_id IS NOT NULL)
    ),
    
    -- Prevent duplicate ratings
    UNIQUE(fragrance_id, user_id),
    UNIQUE(fragrance_id, guest_session_id)
);

-- ============================================================================
-- STEP 5: CREATE UNIQUENESS SCORING TABLE
-- ============================================================================

CREATE TABLE fragrance_uniqueness_scores (
    id SERIAL PRIMARY KEY,
    fragrance_id TEXT NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE UNIQUE,
    
    -- Uniqueness Metrics
    popularity_score DECIMAL(3,2) DEFAULT 5.00, -- 1=very unique, 10=very common
    commonality_index DECIMAL(10,4) DEFAULT 0, -- Statistical commonality
    
    -- Market Penetration
    market_saturation DECIMAL(5,2) DEFAULT 0.00, -- Percentage of users who own it
    discovery_difficulty INTEGER DEFAULT 5 CHECK (discovery_difficulty >= 1 AND discovery_difficulty <= 10),
    
    -- Social Pressure Indicators
    conformity_pressure INTEGER DEFAULT 5 CHECK (conformity_pressure >= 1 AND conformity_pressure <= 10),
    distinctiveness_score INTEGER DEFAULT 5 CHECK (distinctiveness_score >= 1 AND distinctiveness_score <= 10),
    
    -- Alternative Suggestions
    similar_but_unique JSONB, -- Array of similar but less common alternatives
    
    last_calculated TIMESTAMP DEFAULT NOW(),
    calculation_version TEXT DEFAULT 'v1.0'
);

-- ============================================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- User Demographics Indexes
CREATE INDEX idx_user_demographics_user_id ON user_demographics(user_id);
CREATE INDEX idx_user_demographics_guest_session ON user_demographics(guest_session_id);
CREATE INDEX idx_user_demographics_age_experience ON user_demographics(age_group, experience_level);
CREATE INDEX idx_user_demographics_preferences ON user_demographics USING gin (style_preferences);

-- Social Metrics Indexes
CREATE INDEX idx_social_metrics_fragrance ON fragrance_social_metrics(fragrance_id);
CREATE INDEX idx_social_metrics_demographic ON fragrance_social_metrics(demographic_group);
CREATE INDEX idx_social_metrics_approval ON fragrance_social_metrics(approval_rating DESC, approval_count DESC);
CREATE INDEX idx_social_metrics_confidence ON fragrance_social_metrics(confidence_score DESC) 
WHERE confidence_score >= 0.7;

-- Popularity Trends Indexes
CREATE INDEX idx_popularity_trends_fragrance ON fragrance_popularity_trends(fragrance_id);
CREATE INDEX idx_popularity_trends_period ON fragrance_popularity_trends(period_type, period_start DESC);
CREATE INDEX idx_popularity_trends_trending ON fragrance_popularity_trends(trending_score DESC);
CREATE INDEX idx_popularity_trends_velocity ON fragrance_popularity_trends(velocity_score DESC);

-- Peer Ratings Indexes
CREATE INDEX idx_peer_ratings_fragrance ON peer_approval_ratings(fragrance_id);
CREATE INDEX idx_peer_ratings_user ON peer_approval_ratings(user_id);
CREATE INDEX idx_peer_ratings_rating ON peer_approval_ratings(overall_rating DESC);
CREATE INDEX idx_peer_ratings_experience ON peer_approval_ratings(experience_level_when_rated);
CREATE INDEX idx_peer_ratings_recommendation ON peer_approval_ratings(would_recommend) WHERE would_recommend = true;

-- Uniqueness Scores Indexes
CREATE INDEX idx_uniqueness_popularity ON fragrance_uniqueness_scores(popularity_score);
CREATE INDEX idx_uniqueness_distinctiveness ON fragrance_uniqueness_scores(distinctiveness_score DESC);

-- ============================================================================
-- STEP 7: CREATE SOCIAL CONTEXT CALCULATION FUNCTIONS
-- ============================================================================

-- Function to calculate demographic group identifier
CREATE OR REPLACE FUNCTION get_demographic_group(
    p_age_group TEXT,
    p_experience_level TEXT,
    p_gender_preference TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
BEGIN
    RETURN format('age:%s,exp:%s%s', 
        p_age_group, 
        p_experience_level,
        CASE WHEN p_gender_preference IS NOT NULL THEN format(',gender:%s', p_gender_preference) ELSE '' END
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get social context for a fragrance
CREATE OR REPLACE FUNCTION get_fragrance_social_context(
    p_fragrance_id TEXT,
    p_user_age_group TEXT DEFAULT NULL,
    p_user_experience_level TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    social_context JSONB := '{}';
    user_demographic_group TEXT;
    overall_metrics RECORD;
    peer_metrics RECORD;
    trending_data RECORD;
    uniqueness_data RECORD;
BEGIN
    -- Get user's demographic group if provided
    IF p_user_age_group IS NOT NULL AND p_user_experience_level IS NOT NULL THEN
        user_demographic_group := get_demographic_group(p_user_age_group, p_user_experience_level);
    END IF;
    
    -- Get overall social metrics
    SELECT 
        COUNT(DISTINCT CASE WHEN approval_count > 0 THEN demographic_group END) as demographic_groups,
        ROUND(AVG(approval_rating), 2) as avg_approval,
        SUM(approval_count) as total_approvals,
        ROUND(AVG(love_percentage), 1) as avg_love_percentage,
        ROUND(AVG(confidence_score), 2) as avg_confidence
    INTO overall_metrics
    FROM fragrance_social_metrics 
    WHERE fragrance_id = p_fragrance_id AND approval_count >= 5;
    
    -- Get peer-specific metrics if user demographic is available
    IF user_demographic_group IS NOT NULL THEN
        SELECT 
            approval_rating,
            approval_count,
            love_percentage,
            beginner_approval,
            experienced_approval,
            confidence_score
        INTO peer_metrics
        FROM fragrance_social_metrics 
        WHERE fragrance_id = p_fragrance_id 
        AND demographic_group = user_demographic_group;
    END IF;
    
    -- Get trending data
    SELECT 
        trending_score,
        velocity_score,
        rank_in_category,
        percentile_score
    INTO trending_data
    FROM fragrance_popularity_trends 
    WHERE fragrance_id = p_fragrance_id 
    AND period_type = 'monthly'
    ORDER BY period_start DESC 
    LIMIT 1;
    
    -- Get uniqueness data
    SELECT 
        popularity_score,
        distinctiveness_score,
        market_saturation,
        conformity_pressure
    INTO uniqueness_data
    FROM fragrance_uniqueness_scores 
    WHERE fragrance_id = p_fragrance_id;
    
    -- Build social context JSON
    social_context := jsonb_build_object(
        'overall', jsonb_build_object(
            'demographic_groups', COALESCE(overall_metrics.demographic_groups, 0),
            'avg_approval', COALESCE(overall_metrics.avg_approval, 0),
            'total_approvals', COALESCE(overall_metrics.total_approvals, 0),
            'love_percentage', COALESCE(overall_metrics.avg_love_percentage, 0),
            'confidence', COALESCE(overall_metrics.avg_confidence, 0)
        ),
        'peer_context', CASE 
            WHEN peer_metrics IS NOT NULL THEN jsonb_build_object(
                'approval_rating', peer_metrics.approval_rating,
                'approval_count', peer_metrics.approval_count,
                'love_percentage', peer_metrics.love_percentage,
                'beginner_friendly', peer_metrics.beginner_approval,
                'experienced_approval', peer_metrics.experienced_approval,
                'confidence', peer_metrics.confidence_score
            )
            ELSE NULL
        END,
        'trending', CASE 
            WHEN trending_data IS NOT NULL THEN jsonb_build_object(
                'trending_score', trending_data.trending_score,
                'velocity', trending_data.velocity_score,
                'rank_in_category', trending_data.rank_in_category,
                'percentile', trending_data.percentile_score
            )
            ELSE NULL
        END,
        'uniqueness', CASE 
            WHEN uniqueness_data IS NOT NULL THEN jsonb_build_object(
                'popularity_level', uniqueness_data.popularity_score,
                'distinctiveness', uniqueness_data.distinctiveness_score,
                'market_saturation', uniqueness_data.market_saturation,
                'conformity_pressure', uniqueness_data.conformity_pressure
            )
            ELSE NULL
        END
    );
    
    RETURN social_context;
END;
$$ LANGUAGE plpgsql;

-- Function to update social metrics for a fragrance
CREATE OR REPLACE FUNCTION update_fragrance_social_metrics(
    p_fragrance_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    updated_groups INTEGER := 0;
    processing_result JSONB;
BEGIN
    -- Update metrics for each demographic group that has ratings
    WITH demographic_ratings AS (
        SELECT 
            p_fragrance_id as fragrance_id,
            get_demographic_group(
                COALESCE(ud.age_group, 'unknown'),
                COALESCE(ud.experience_level, 'beginner'),
                ud.gender_preference
            ) as demographic_group,
            COUNT(*) as total_users,
            ROUND(AVG(par.overall_rating), 2) as approval_rating,
            COUNT(par.overall_rating) as approval_count,
            ROUND(
                COUNT(CASE WHEN par.overall_rating >= 4.0 THEN 1 END) * 100.0 / 
                NULLIF(COUNT(par.overall_rating), 0), 
                2
            ) as love_percentage,
            ROUND(
                AVG(CASE WHEN ud.experience_level = 'beginner' THEN par.overall_rating END), 
                2
            ) as beginner_approval,
            COUNT(CASE WHEN ud.experience_level = 'beginner' THEN 1 END) as beginner_count,
            ROUND(
                AVG(CASE WHEN ud.experience_level IN ('experienced', 'expert') THEN par.overall_rating END), 
                2
            ) as experienced_approval,
            COUNT(CASE WHEN ud.experience_level IN ('experienced', 'expert') THEN 1 END) as experienced_count,
            -- Calculate confidence based on sample size
            LEAST(1.0, COUNT(*) / 20.0) as confidence_score
        FROM peer_approval_ratings par
        LEFT JOIN user_demographics ud ON (
            par.user_id = ud.user_id OR 
            par.guest_session_id = ud.guest_session_id
        )
        WHERE par.fragrance_id = p_fragrance_id
        GROUP BY demographic_group
        HAVING COUNT(*) >= 3 -- Minimum sample size
    )
    INSERT INTO fragrance_social_metrics (
        fragrance_id, demographic_group, total_users, approval_rating, 
        approval_count, love_percentage, beginner_approval, beginner_count,
        experienced_approval, experienced_count, sample_size, confidence_score
    )
    SELECT 
        fragrance_id, demographic_group, total_users, approval_rating,
        approval_count, love_percentage, beginner_approval, beginner_count,
        experienced_approval, experienced_count, total_users, confidence_score
    FROM demographic_ratings
    ON CONFLICT (fragrance_id, demographic_group) 
    DO UPDATE SET
        total_users = EXCLUDED.total_users,
        approval_rating = EXCLUDED.approval_rating,
        approval_count = EXCLUDED.approval_count,
        love_percentage = EXCLUDED.love_percentage,
        beginner_approval = EXCLUDED.beginner_approval,
        beginner_count = EXCLUDED.beginner_count,
        experienced_approval = EXCLUDED.experienced_approval,
        experienced_count = EXCLUDED.experienced_count,
        sample_size = EXCLUDED.sample_size,
        confidence_score = EXCLUDED.confidence_score,
        last_updated = NOW();
    
    GET DIAGNOSTICS updated_groups = ROW_COUNT;
    
    processing_result := jsonb_build_object(
        'fragrance_id', p_fragrance_id,
        'updated_demographic_groups', updated_groups,
        'timestamp', NOW()
    );
    
    RETURN processing_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 8: CREATE ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all social tables
ALTER TABLE user_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragrance_social_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragrance_popularity_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_approval_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragrance_uniqueness_scores ENABLE ROW LEVEL SECURITY;

-- User Demographics Policies
CREATE POLICY "Users can view own demographics" ON user_demographics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own demographics" ON user_demographics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can manage guest demographics" ON user_demographics
    FOR ALL USING (user_id IS NULL AND guest_session_id IS NOT NULL);

-- Social Metrics Policies (Read-only for users, write for system)
CREATE POLICY "Public read access to social metrics" ON fragrance_social_metrics
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage social metrics" ON fragrance_social_metrics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Popularity Trends Policies (Read-only for users)
CREATE POLICY "Public read access to popularity trends" ON fragrance_popularity_trends
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage popularity trends" ON fragrance_popularity_trends
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Peer Approval Ratings Policies
CREATE POLICY "Users can view all peer ratings" ON peer_approval_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own ratings" ON peer_approval_ratings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can manage guest ratings" ON peer_approval_ratings
    FOR ALL USING (user_id IS NULL AND guest_session_id IS NOT NULL);

-- Uniqueness Scores Policies (Read-only for users)
CREATE POLICY "Public read access to uniqueness scores" ON fragrance_uniqueness_scores
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage uniqueness scores" ON fragrance_uniqueness_scores
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- STEP 9: CREATE TRIGGER FUNCTIONS
-- ============================================================================

-- Function to automatically update social metrics when ratings change
CREATE OR REPLACE FUNCTION trigger_update_social_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update social metrics for the affected fragrance
    PERFORM update_fragrance_social_metrics(
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.fragrance_id
            ELSE NEW.fragrance_id
        END
    );
    
    RETURN CASE 
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update social metrics
CREATE TRIGGER trigger_peer_rating_changes
    AFTER INSERT OR UPDATE OR DELETE ON peer_approval_ratings
    FOR EACH ROW EXECUTE FUNCTION trigger_update_social_metrics();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_social_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create timestamp triggers
CREATE TRIGGER trigger_demographics_timestamp
    BEFORE UPDATE ON user_demographics
    FOR EACH ROW EXECUTE FUNCTION update_social_timestamp();

-- ============================================================================
-- STEP 10: INSERT INITIAL SAMPLE DATA
-- ============================================================================

-- Insert some sample uniqueness scores for popular fragrances
INSERT INTO fragrance_uniqueness_scores (fragrance_id, popularity_score, distinctiveness_score, market_saturation, conformity_pressure)
VALUES 
    ('sauvage-dior', 9.5, 2.0, 15.2, 8.0),
    ('bleu-de-chanel', 8.5, 3.0, 12.8, 7.0),
    ('aventus-creed', 6.0, 7.5, 3.2, 4.0),
    ('la-nuit-de-lhomme-ysl', 7.5, 4.5, 8.5, 6.0),
    ('tom-ford-oud-wood', 4.0, 8.5, 1.8, 3.0)
ON CONFLICT (fragrance_id) DO NOTHING;

-- ============================================================================
-- FINAL VALIDATION
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count created tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'user_demographics', 'fragrance_social_metrics', 
        'fragrance_popularity_trends', 'peer_approval_ratings',
        'fragrance_uniqueness_scores'
    );
    
    -- Count created functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN (
        'get_demographic_group', 'get_fragrance_social_context',
        'update_fragrance_social_metrics'
    );
    
    -- Count created indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%social%' OR indexname LIKE 'idx_%demographic%' 
    OR indexname LIKE 'idx_%popularity%' OR indexname LIKE 'idx_%peer%' 
    OR indexname LIKE 'idx_%uniqueness%';
    
    RAISE NOTICE 'SCE-69 Social Validation System Migration Complete!';
    RAISE NOTICE 'Created % tables, % functions, % indexes', table_count, function_count, index_count;
    
    IF table_count = 5 AND function_count >= 3 THEN
        RAISE NOTICE 'All core components successfully created';
    ELSE
        RAISE WARNING 'Some components may be missing - please verify manually';
    END IF;
END $$;