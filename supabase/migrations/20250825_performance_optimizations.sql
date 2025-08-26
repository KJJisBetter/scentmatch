-- Performance Optimization Migration
-- Adds essential indexes and optimizations for collection platform performance
-- Target: All queries < 200ms, complex analytics < 500ms

-- Collection Dashboard Performance Indexes
-- These indexes optimize the most frequent collection queries

-- Primary collection queries optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_collections_user_dashboard 
    ON user_collections(user_id, collection_type, created_at DESC)
    WHERE collection_type = 'saved';

-- Quiz session attribution index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_collections_quiz_session
    ON user_collections(quiz_session_token, created_at DESC)
    WHERE quiz_session_token IS NOT NULL;

-- Collection stats optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_collections_rating_stats
    ON user_collections(user_id, rating, created_at)
    WHERE rating IS NOT NULL AND collection_type = 'saved';

-- Fragrance join optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fragrances_collection_lookup
    ON fragrances(id, scent_family, gender, sample_available);

-- Search and Browse Performance Indexes
-- Optimize fragrance search and filtering operations

-- Gender filtering optimization (critical for quiz results)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fragrances_gender_available
    ON fragrances(gender, sample_available, rating_value DESC)
    WHERE sample_available = true;

-- Scent family browsing optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fragrances_family_rating
    ON fragrances(scent_family, rating_value DESC, sample_available)
    WHERE sample_available = true;

-- Price range filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fragrances_price_range
    ON fragrances(sample_price_usd, rating_value DESC)
    WHERE sample_available = true;

-- Brand filtering optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fragrances_brand_lookup
    ON fragrances(brand_id, rating_value DESC, sample_available);

-- Analytics Performance Indexes
-- Optimize collection analytics and insights generation

-- Analytics events for insights
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_analytics_user_time
    ON collection_analytics_events(user_id, created_at DESC, event_type);

-- Analytics events by quiz session
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_analytics_quiz_session
    ON collection_analytics_events(quiz_session_token, event_type, created_at);

-- Insights cache optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_insights_cache_lookup
    ON collection_insights_cache(user_id, insight_type, expires_at)
    WHERE expires_at > NOW();

-- User engagement optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_engagement_active_users
    ON user_engagement_scores(engagement_level, engagement_score_raw DESC, last_activity_at);

-- Social Features Performance Indexes
-- Optimize social proof and sharing features

-- Collection sharing optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_shares_owner_recent
    ON collection_shares(collection_owner_id, created_at DESC, share_type);

-- Trending fragrances calculation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_collections_trending
    ON user_collections(fragrance_id, created_at)
    WHERE created_at >= NOW() - INTERVAL '7 days';

-- Popular collections tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_shares_popularity
    ON collection_shares(fragrance_ids, created_at)
    WHERE created_at >= NOW() - INTERVAL '30 days';

-- Performance Monitoring and Optimization Functions
-- Store procedures for complex analytics with better performance

-- Optimized collection stats calculation
CREATE OR REPLACE FUNCTION get_optimized_collection_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_items', COUNT(*),
        'total_ratings', COUNT(rating),
        'average_rating', COALESCE(AVG(rating), 0),
        'families_explored', COUNT(DISTINCT f.scent_family),
        'completion_rate', ROUND((COUNT(rating)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2),
        'most_recent', MAX(uc.created_at),
        'top_families', (
            SELECT json_agg(
                json_build_object(
                    'family', f.scent_family,
                    'count', family_counts.count
                )
            )
            FROM (
                SELECT f.scent_family, COUNT(*) as count
                FROM user_collections uc
                JOIN fragrances f ON f.id = uc.fragrance_id
                WHERE uc.user_id = p_user_id 
                    AND uc.collection_type = 'saved'
                GROUP BY f.scent_family
                ORDER BY count DESC
                LIMIT 5
            ) family_counts
        )
    ) INTO result
    FROM user_collections uc
    JOIN fragrances f ON f.id = uc.fragrance_id
    WHERE uc.user_id = p_user_id 
        AND uc.collection_type = 'saved';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Optimized quiz recommendations function
CREATE OR REPLACE FUNCTION get_optimized_quiz_recommendations(
    p_gender TEXT,
    p_scent_families TEXT[],
    p_exclude_ids UUID[] DEFAULT '{}',
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    brand_name TEXT,
    scent_family TEXT,
    gender TEXT,
    rating_value DECIMAL,
    sample_price_usd DECIMAL,
    image_url TEXT,
    main_accords TEXT[],
    personality_tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        fb.name as brand_name,
        f.scent_family,
        f.gender,
        f.rating_value,
        f.sample_price_usd,
        f.image_url,
        f.main_accords,
        f.personality_tags
    FROM fragrances f
    JOIN fragrance_brands fb ON fb.id = f.brand_id
    WHERE f.sample_available = true
        AND f.gender = p_gender
        AND f.scent_family = ANY(p_scent_families)
        AND f.id != ALL(p_exclude_ids)
    ORDER BY f.rating_value DESC, f.popularity_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Optimized social validation data function
CREATE OR REPLACE FUNCTION get_social_validation_data(p_fragrance_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_collections', COUNT(DISTINCT uc.user_id),
        'recent_additions', COUNT(*) FILTER (WHERE uc.created_at >= NOW() - INTERVAL '7 days'),
        'average_rating', COALESCE(AVG(uc.rating), 0),
        'rating_distribution', (
            SELECT json_build_object(
                '5', COUNT(*) FILTER (WHERE rating = 5),
                '4', COUNT(*) FILTER (WHERE rating = 4),
                '3', COUNT(*) FILTER (WHERE rating = 3),
                '2', COUNT(*) FILTER (WHERE rating = 2),
                '1', COUNT(*) FILTER (WHERE rating = 1)
            )
            FROM user_collections 
            WHERE fragrance_id = p_fragrance_id 
                AND rating IS NOT NULL
        ),
        'trending_score', (
            -- Calculate trending based on recent activity
            CASE 
                WHEN COUNT(*) FILTER (WHERE uc.created_at >= NOW() - INTERVAL '24 hours') > 5 THEN 'hot'
                WHEN COUNT(*) FILTER (WHERE uc.created_at >= NOW() - INTERVAL '7 days') > 10 THEN 'trending'
                ELSE 'stable'
            END
        )
    ) INTO result
    FROM user_collections uc
    WHERE uc.fragrance_id = p_fragrance_id
        AND uc.collection_type = 'saved';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Performance monitoring function
CREATE OR REPLACE FUNCTION update_user_engagement_metrics(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    collection_size INTEGER;
    engagement_level TEXT;
    engagement_score INTEGER;
BEGIN
    -- Calculate current collection size
    SELECT COUNT(*) INTO collection_size
    FROM user_collections
    WHERE user_id = p_user_id AND collection_type = 'saved';
    
    -- Determine engagement level
    engagement_level := CASE
        WHEN collection_size >= 50 THEN 'expert'
        WHEN collection_size >= 15 THEN 'intermediate'
        ELSE 'beginner'
    END;
    
    -- Calculate engagement score (simplified)
    engagement_score := LEAST(1000, collection_size * 10 + 
        (SELECT COUNT(*) FROM user_collections WHERE user_id = p_user_id AND rating IS NOT NULL) * 5);
    
    -- Update or insert engagement data
    INSERT INTO user_engagement_scores (
        user_id, 
        engagement_level, 
        engagement_score_raw, 
        collection_size,
        last_activity_at,
        updated_at
    ) 
    VALUES (
        p_user_id, 
        engagement_level, 
        engagement_score, 
        collection_size,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        engagement_level = EXCLUDED.engagement_level,
        engagement_score_raw = EXCLUDED.engagement_score_raw,
        collection_size = EXCLUDED.collection_size,
        last_activity_at = EXCLUDED.last_activity_at,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Performance monitoring and cache management

-- Function to check index usage
CREATE OR REPLACE FUNCTION analyze_index_performance()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_scans BIGINT,
    index_tup_read BIGINT,
    index_tup_fetch BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        indexname as index_name,
        idx_scan as index_scans,
        idx_tup_read as index_tup_read,
        idx_tup_fetch as index_tup_fetch
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
        AND idx_scan > 0
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Cache cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM collection_insights_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Performance budget monitoring
CREATE OR REPLACE VIEW performance_monitoring AS
SELECT 
    'collection_dashboard' as query_type,
    COUNT(*) as query_count,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) * 1000) as avg_response_time_ms
FROM user_collections 
WHERE created_at >= NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'analytics_generation' as query_type,
    COUNT(*) as query_count,
    AVG(generation_time_ms) as avg_response_time_ms
FROM collection_insights_cache 
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Automated cache warming for popular users
CREATE OR REPLACE FUNCTION warm_popular_user_caches()
RETURNS INTEGER AS $$
DECLARE
    warmed_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Warm caches for users with recent activity
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM user_collections 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        LIMIT 100
    LOOP
        -- This would trigger cache generation in application layer
        INSERT INTO collection_insights_cache (
            user_id, 
            insight_type, 
            insight_data, 
            expires_at,
            generation_time_ms
        ) 
        SELECT 
            user_record.user_id,
            'stats_prewarmed',
            get_optimized_collection_stats(user_record.user_id),
            NOW() + INTERVAL '1 hour',
            0
        ON CONFLICT (user_id, insight_type) DO NOTHING;
        
        warmed_count := warmed_count + 1;
    END LOOP;
    
    RETURN warmed_count;
END;
$$ LANGUAGE plpgsql;

-- Create a materialized view for trending fragrances (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_fragrances AS
SELECT 
    f.id,
    f.name,
    f.scent_family,
    f.gender,
    f.rating_value,
    COUNT(uc.id) as collection_count,
    COUNT(uc.id) FILTER (WHERE uc.created_at >= NOW() - INTERVAL '7 days') as recent_count,
    (COUNT(uc.id) FILTER (WHERE uc.created_at >= NOW() - INTERVAL '7 days')::FLOAT / NULLIF(COUNT(uc.id), 0)) as trending_ratio
FROM fragrances f
LEFT JOIN user_collections uc ON uc.fragrance_id = f.id AND uc.collection_type = 'saved'
WHERE f.sample_available = true
GROUP BY f.id, f.name, f.scent_family, f.gender, f.rating_value
HAVING COUNT(uc.id) > 5  -- Only fragrances with significant collection count
ORDER BY trending_ratio DESC, recent_count DESC;

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_trending_fragrances_score 
    ON trending_fragrances(trending_ratio DESC, recent_count DESC);

-- Performance optimization complete notification
SELECT 'Performance optimization migration completed successfully' as status;