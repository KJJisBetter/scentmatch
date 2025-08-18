-- COMPLETE DATABASE REBUILD FOR SCENTMATCH
-- Date: 2025-08-18
-- Purpose: Modern schema optimized for 2000+ Kaggle fragrances with enhanced features

-- ============================================================================
-- STEP 1: BACKUP AND DROP EXISTING TABLES
-- ============================================================================

-- Backup existing data
CREATE TABLE IF NOT EXISTS fragrances_backup_complete AS SELECT * FROM fragrances;
CREATE TABLE IF NOT EXISTS fragrance_brands_backup_complete AS SELECT * FROM fragrance_brands;

-- Drop existing tables (we'll rebuild from scratch)
DROP TABLE IF EXISTS ai_insights_cache CASCADE;
DROP TABLE IF EXISTS user_fragrance_interactions CASCADE;
DROP TABLE IF EXISTS user_collections CASCADE; 
DROP TABLE IF EXISTS fragrances CASCADE;
DROP TABLE IF EXISTS fragrance_brands CASCADE;

-- ============================================================================
-- STEP 2: CREATE ENHANCED BRANDS TABLE
-- ============================================================================

CREATE TABLE fragrance_brands (
    id TEXT PRIMARY KEY, -- kebab-case brand ID
    name TEXT NOT NULL, -- Display name
    slug TEXT NOT NULL UNIQUE, -- URL-friendly slug
    origin_country TEXT, -- Brand origin
    founded_year INTEGER, -- When brand was founded
    brand_tier TEXT CHECK (brand_tier IN ('luxury', 'premium', 'designer', 'mass', 'niche', 'celebrity')),
    website_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sample_availability_score INTEGER DEFAULT 0, -- 0-100 score for sample availability
    affiliate_supported BOOLEAN DEFAULT false, -- Whether we have affiliate partnerships
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: CREATE MODERN FRAGRANCES TABLE
-- ============================================================================

CREATE TABLE fragrances (
    -- Core Identity
    id TEXT PRIMARY KEY, -- Unique fragrance identifier
    brand_id TEXT NOT NULL REFERENCES fragrance_brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Clean fragrance name (no brand, no gender suffix)
    slug TEXT NOT NULL, -- URL-friendly slug
    
    -- Fragrance Details
    gender TEXT NOT NULL CHECK (gender IN ('men', 'women', 'unisex')), -- Standardized gender
    launch_year INTEGER, -- Year fragrance was launched
    perfumers TEXT[], -- Array of perfumer names
    fragrance_family TEXT, -- Primary family (oriental, fresh, floral, woody)
    
    -- Scent Profile (Enhanced for AI)
    main_accords TEXT[] NOT NULL DEFAULT '{}', -- Primary accords array
    top_notes TEXT[], -- Top notes
    middle_notes TEXT[], -- Heart notes  
    base_notes TEXT[], -- Base notes
    scent_profile_vector VECTOR(1536), -- Embedding for scent profile
    
    -- Descriptions and Content
    full_description TEXT, -- Rich description from Kaggle
    short_description TEXT, -- Marketing tagline
    scent_story TEXT, -- Narrative description for AI insights
    
    -- Ratings and Popularity
    rating_value DECIMAL(3,2), -- Average rating (0.00-5.00)
    rating_count INTEGER DEFAULT 0, -- Number of ratings
    popularity_score DECIMAL(10,4) DEFAULT 0, -- Calculated popularity score
    kaggle_score DECIMAL(10,4), -- Original Kaggle popularity
    trending_score INTEGER DEFAULT 0, -- Social media trending (0-100)
    
    -- Commercial Data (Affiliate-Friendly)
    sample_available BOOLEAN DEFAULT true, -- Sample availability
    sample_price_usd INTEGER, -- Sample price for display
    travel_size_available BOOLEAN DEFAULT false, -- Travel size availability
    full_bottle_min_price INTEGER, -- Minimum full bottle price (reference)
    affiliate_urls JSONB, -- Affiliate partner URLs
    
    -- Search and Discovery
    search_vector TSVECTOR, -- Full-text search
    personality_tags TEXT[], -- Personality matching tags
    occasion_tags TEXT[], -- Occasion matching tags
    season_tags TEXT[], -- Seasonal matching tags
    
    -- Data Management
    data_source TEXT DEFAULT 'kaggle', -- Source of data
    import_batch INTEGER, -- Import batch tracking
    is_verified BOOLEAN DEFAULT false, -- Data quality verification
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- External References
    fragrantica_url TEXT, -- Reference URL
    image_url TEXT, -- Product image URL
    
    UNIQUE(brand_id, name) -- Prevent duplicate brand+name combinations
);

-- ============================================================================
-- STEP 4: CREATE AI INSIGHTS AND RECOMMENDATION TABLES  
-- ============================================================================

-- AI-generated insights cache
CREATE TABLE ai_insights_cache (
    id SERIAL PRIMARY KEY,
    fragrance_id TEXT NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    user_preference_hash VARCHAR(64) NOT NULL, -- Hash of user quiz responses
    insight_text TEXT NOT NULL, -- Personalized AI insight
    reasoning_text TEXT, -- Detailed reasoning
    confidence_score DECIMAL(3,2), -- 0.00-1.00 confidence
    generated_date TIMESTAMP DEFAULT NOW(),
    expires_date TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
    ai_model VARCHAR(50) DEFAULT 'internal',
    cache_hits INTEGER DEFAULT 0,
    UNIQUE(fragrance_id, user_preference_hash)
);

-- User collections and interactions
CREATE TABLE user_collections (
    id SERIAL PRIMARY KEY,
    user_id UUID, -- Auth user ID (nullable for guest sessions)
    guest_session_id TEXT, -- For anonymous users
    fragrance_id TEXT NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    collection_type TEXT DEFAULT 'saved' CHECK (collection_type IN ('saved', 'owned', 'wishlist', 'tried')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- User's personal rating
    notes TEXT, -- User's personal notes
    purchase_date DATE, -- When they bought it
    sample_tried BOOLEAN DEFAULT false, -- Whether they tried a sample first
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User fragrance interactions (for recommendation improvement)
CREATE TABLE user_fragrance_interactions (
    id SERIAL PRIMARY KEY,
    user_id UUID, -- Auth user ID (nullable for guest sessions)
    guest_session_id TEXT, -- For anonymous users
    fragrance_id TEXT NOT NULL REFERENCES fragrances(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'sample_order', 'full_purchase', 'review')),
    interaction_metadata JSONB, -- Additional interaction data
    quiz_session_id TEXT, -- Link to quiz session
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STEP 5: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Fragrance table indexes
CREATE INDEX idx_fragrances_brand_id ON fragrances(brand_id);
CREATE INDEX idx_fragrances_gender ON fragrances(gender);
CREATE INDEX idx_fragrances_popularity ON fragrances(popularity_score DESC);
CREATE INDEX idx_fragrances_rating ON fragrances(rating_value DESC, rating_count DESC);
CREATE INDEX idx_fragrances_sample_available ON fragrances(sample_available);
CREATE INDEX idx_fragrances_family ON fragrances(fragrance_family);
CREATE INDEX idx_fragrances_verified ON fragrances(is_verified);
CREATE INDEX idx_fragrances_trending ON fragrances(trending_score DESC);

-- GIN indexes for arrays and full-text search
CREATE INDEX idx_fragrances_main_accords ON fragrances USING GIN(main_accords);
CREATE INDEX idx_fragrances_personality_tags ON fragrances USING GIN(personality_tags);
CREATE INDEX idx_fragrances_search_vector ON fragrances USING GIN(search_vector);

-- Vector similarity index (if pgvector is available)
CREATE INDEX IF NOT EXISTS idx_fragrances_scent_profile_vector 
ON fragrances USING hnsw (scent_profile_vector vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- AI insights cache indexes  
CREATE INDEX idx_ai_insights_fragrance_id ON ai_insights_cache(fragrance_id);
CREATE INDEX idx_ai_insights_preference_hash ON ai_insights_cache(user_preference_hash);
CREATE INDEX idx_ai_insights_expires ON ai_insights_cache(expires_date);

-- User interaction indexes
CREATE INDEX idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX idx_user_collections_guest_session ON user_collections(guest_session_id);
CREATE INDEX idx_user_interactions_user_id ON user_fragrance_interactions(user_id);
CREATE INDEX idx_user_interactions_fragrance_id ON user_fragrance_interactions(fragrance_id);

-- ============================================================================
-- STEP 6: CREATE UTILITY FUNCTIONS
-- ============================================================================

-- Function to standardize gender from Kaggle data
CREATE OR REPLACE FUNCTION standardize_gender_value(input_gender TEXT)
RETURNS TEXT AS $$
BEGIN
    input_gender := LOWER(TRIM(input_gender));
    
    CASE 
        WHEN input_gender LIKE '%women and men%' OR input_gender LIKE '%unisex%' THEN
            RETURN 'unisex'
        WHEN input_gender LIKE '%women%' AND input_gender NOT LIKE '%men%' THEN
            RETURN 'women'
        WHEN input_gender LIKE '%men%' AND input_gender NOT LIKE '%women%' THEN
            RETURN 'men'
        ELSE
            RETURN 'unisex' -- Default fallback
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate sample pricing based on brand tier and popularity
CREATE OR REPLACE FUNCTION calculate_sample_price_v2(
    brand_name TEXT,
    brand_tier TEXT,
    popularity_score DECIMAL,
    rating_value DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
    base_price INTEGER := 8;
    tier_premium INTEGER := 0;
    popularity_bonus INTEGER := 0;
    rating_bonus INTEGER := 0;
BEGIN
    -- Brand tier pricing
    CASE brand_tier
        WHEN 'luxury' THEN tier_premium := 10;
        WHEN 'premium' THEN tier_premium := 6;
        WHEN 'designer' THEN tier_premium := 4;
        WHEN 'niche' THEN tier_premium := 8;
        WHEN 'celebrity' THEN tier_premium := 2;
        ELSE tier_premium := 0;
    END CASE;
    
    -- Popularity bonus
    IF popularity_score > 20 THEN
        popularity_bonus := 5;
    ELSIF popularity_score > 15 THEN  
        popularity_bonus := 3;
    ELSIF popularity_score > 10 THEN
        popularity_bonus := 1;
    END IF;
    
    -- Rating bonus
    IF rating_value > 4.5 THEN
        rating_bonus := 3;
    ELSIF rating_value > 4.0 THEN
        rating_bonus := 2;
    ELSIF rating_value > 3.5 THEN
        rating_bonus := 1;
    END IF;
    
    RETURN LEAST(base_price + tier_premium + popularity_bonus + rating_bonus, 30);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate search vector
CREATE OR REPLACE FUNCTION update_fragrance_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE((SELECT name FROM fragrance_brands WHERE id = NEW.brand_id), '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.main_accords, ' '), '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'D');
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
CREATE TRIGGER trigger_update_fragrance_search_vector
    BEFORE INSERT OR UPDATE ON fragrances
    FOR EACH ROW EXECUTE FUNCTION update_fragrance_search_vector();

-- Function to get gender-filtered recommendations
CREATE OR REPLACE FUNCTION get_gender_filtered_fragrances(
    target_gender TEXT,
    scent_preferences TEXT[] DEFAULT '{}',
    personality_style TEXT DEFAULT NULL,
    result_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
    id TEXT,
    name TEXT,
    brand_name TEXT,
    gender TEXT,
    main_accords TEXT[],
    popularity_score DECIMAL,
    sample_price_usd INTEGER,
    match_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        fb.name as brand_name,
        f.gender,
        f.main_accords,
        f.popularity_score,
        f.sample_price_usd,
        -- Simple match scoring based on accord overlap
        CASE 
            WHEN array_length(scent_preferences, 1) > 0 THEN
                (SELECT COUNT(*) * 20 FROM unnest(f.main_accords) AS accord 
                 WHERE accord = ANY(scent_preferences))
            ELSE 50
        END::INTEGER as match_score
    FROM fragrances f
    JOIN fragrance_brands fb ON f.brand_id = fb.id
    WHERE 
        f.is_verified = true
        AND f.sample_available = true
        AND (
            target_gender = 'unisex' OR 
            f.gender = target_gender OR 
            f.gender = 'unisex'
        )
    ORDER BY 
        popularity_score DESC,
        rating_value DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE fragrance_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragrances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fragrance_interactions ENABLE ROW LEVEL SECURITY;

-- Public read policies for core data
CREATE POLICY "Brands are publicly readable" ON fragrance_brands FOR SELECT USING (true);
CREATE POLICY "Fragrances are publicly readable" ON fragrances FOR SELECT USING (true);
CREATE POLICY "AI insights cache is publicly readable" ON ai_insights_cache FOR SELECT USING (true);

-- User data policies
CREATE POLICY "Users can manage their own collections" ON user_collections
    FOR ALL USING (auth.uid() = user_id OR guest_session_id IS NOT NULL);

CREATE POLICY "Users can manage their own interactions" ON user_fragrance_interactions  
    FOR ALL USING (auth.uid() = user_id OR guest_session_id IS NOT NULL);

-- Service role can manage everything
CREATE POLICY "Service role manages brands" ON fragrance_brands
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages fragrances" ON fragrances
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages AI cache" ON ai_insights_cache
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 8: CREATE IMPORT TRACKING TABLE
-- ============================================================================

CREATE TABLE kaggle_import_tracking (
    id SERIAL PRIMARY KEY,
    import_batch INTEGER NOT NULL,
    source_file TEXT NOT NULL,
    import_date TIMESTAMP DEFAULT NOW(),
    total_records_processed INTEGER,
    brands_imported INTEGER,
    fragrances_imported INTEGER,
    duplicates_skipped INTEGER,
    errors_encountered INTEGER,
    quality_score DECIMAL(5,2), -- Overall quality score
    completion_time INTERVAL,
    notes TEXT
);

-- ============================================================================
-- FINAL VALIDATION
-- ============================================================================

-- Verify core tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fragrances') THEN
        RAISE EXCEPTION 'Database rebuild failed: fragrances table not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fragrance_brands') THEN
        RAISE EXCEPTION 'Database rebuild failed: fragrance_brands table not created';
    END IF;
    
    RAISE NOTICE 'Complete database rebuild successful - Ready for Kaggle import!';
END $$;