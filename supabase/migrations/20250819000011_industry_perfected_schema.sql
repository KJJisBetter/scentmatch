-- INDUSTRY PERFECTED SCHEMA ENHANCEMENTS
-- Date: 2025-08-19
-- Purpose: Add columns for industry-standard formatting and advanced scoring

-- ============================================================================
-- STEP 1: ADD ADVANCED FORMATTING COLUMNS TO FRAGRANCES TABLE
-- ============================================================================

-- Brand and product formatting
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS concentration TEXT; -- EDT, EDP, Parfum, etc.

ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS enhanced_description TEXT; -- Rich industry-style descriptions

ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS format_version TEXT DEFAULT '2.0'; -- Track data format version

-- Advanced scoring columns
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS bayesian_rating DECIMAL(3,2) DEFAULT NULL; -- Bayesian average rating

-- Enhanced pricing columns (FragranceX/FragranceNet style)
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS full_bottle_price INTEGER DEFAULT NULL; -- Full bottle price estimate

ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS retail_price INTEGER DEFAULT NULL; -- Suggested retail price

ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT NULL; -- Discount percentage display

ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS price_per_ml DECIMAL(5,2) DEFAULT NULL; -- Price per ML for comparison

-- Brand tier for advanced scoring
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS brand_tier TEXT 
CHECK (brand_tier IN ('luxury', 'premium', 'designer', 'niche', 'celebrity', 'mass'));

-- ============================================================================
-- STEP 2: ADD ENHANCED BRAND COLUMNS
-- ============================================================================

-- Brand formatting and tier information
ALTER TABLE fragrance_brands 
ADD COLUMN IF NOT EXISTS display_name TEXT; -- Properly formatted brand name

ALTER TABLE fragrance_brands 
ADD COLUMN IF NOT EXISTS brand_tier TEXT DEFAULT 'designer'
CHECK (brand_tier IN ('luxury', 'premium', 'designer', 'niche', 'celebrity', 'mass'));

ALTER TABLE fragrance_brands 
ADD COLUMN IF NOT EXISTS prestige_score DECIMAL(3,2) DEFAULT 1.0; -- Brand prestige multiplier

-- ============================================================================
-- STEP 3: UPDATE EXISTING INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for advanced popularity scoring
CREATE INDEX IF NOT EXISTS idx_fragrances_popularity_bayesian 
ON fragrances(popularity_score DESC, bayesian_rating DESC) 
WHERE popularity_score IS NOT NULL;

-- Index for brand tier filtering
CREATE INDEX IF NOT EXISTS idx_fragrances_brand_tier 
ON fragrances(brand_tier, popularity_score DESC)
WHERE brand_tier IS NOT NULL;

-- Index for concentration filtering
CREATE INDEX IF NOT EXISTS idx_fragrances_concentration 
ON fragrances(concentration, popularity_score DESC)
WHERE concentration IS NOT NULL;

-- Index for price range filtering  
CREATE INDEX IF NOT EXISTS idx_fragrances_sample_price_range 
ON fragrances(sample_price_usd, popularity_score DESC)
WHERE sample_price_usd IS NOT NULL;

-- Index for full bottle price comparisons
CREATE INDEX IF NOT EXISTS idx_fragrances_full_bottle_price 
ON fragrances(full_bottle_price, popularity_score DESC)
WHERE full_bottle_price IS NOT NULL;

-- ============================================================================
-- STEP 4: CREATE INDUSTRY-STANDARD UTILITY FUNCTIONS
-- ============================================================================

-- Function to calculate price per ML
CREATE OR REPLACE FUNCTION calculate_price_per_ml(
    bottle_price INTEGER,
    volume_ml INTEGER DEFAULT 100
)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF bottle_price IS NULL OR bottle_price <= 0 OR volume_ml <= 0 THEN
        RETURN NULL;
    END IF;
    
    RETURN ROUND((bottle_price::DECIMAL / volume_ml), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to format pricing display (FragranceX style)
CREATE OR REPLACE FUNCTION format_pricing_display(
    sample_price INTEGER,
    full_price INTEGER,
    retail_price INTEGER
)
RETURNS JSONB AS $$
DECLARE
    discount_percent INTEGER;
    pricing_display JSONB;
BEGIN
    -- Calculate discount percentage
    IF retail_price IS NOT NULL AND full_price IS NOT NULL AND retail_price > full_price THEN
        discount_percent := ROUND(((retail_price - full_price)::DECIMAL / retail_price) * 100);
    ELSE
        discount_percent := NULL;
    END IF;
    
    -- Build pricing display object
    pricing_display := jsonb_build_object(
        'sample_price', CASE WHEN sample_price IS NOT NULL THEN '$' || sample_price || '.00' ELSE NULL END,
        'full_bottle_price', CASE WHEN full_price IS NOT NULL THEN '$' || full_price || '.00' ELSE NULL END,
        'retail_price', CASE WHEN retail_price IS NOT NULL THEN '$' || retail_price || '.00' ELSE NULL END,
        'discount_percent', discount_percent,
        'savings_display', CASE 
            WHEN discount_percent IS NOT NULL AND discount_percent > 0 
            THEN discount_percent || '% OFF Retail'
            ELSE NULL 
        END
    );
    
    RETURN pricing_display;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get industry-standard search ordering
CREATE OR REPLACE FUNCTION get_industry_standard_ordering(
    sort_type TEXT DEFAULT 'popularity',
    gender_filter TEXT DEFAULT NULL,
    brand_tier_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
    fragrance_id TEXT,
    display_name TEXT,
    brand_display TEXT,
    popularity_score DECIMAL,
    bayesian_rating DECIMAL,
    sample_price_display TEXT,
    concentration_display TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name || CASE 
            WHEN f.concentration IS NOT NULL 
            THEN ' (' || f.concentration || ')' 
            ELSE '' 
        END as display_name,
        fb.display_name || ' ' || f.name as brand_display,
        f.popularity_score,
        f.bayesian_rating,
        '$' || f.sample_price_usd || '.00' as sample_price_display,
        COALESCE(f.concentration, 'Fragrance') as concentration_display
    FROM fragrances f
    JOIN fragrance_brands fb ON f.brand_id = fb.id
    WHERE 
        (gender_filter IS NULL OR f.gender = gender_filter OR f.gender = 'unisex')
        AND (brand_tier_filter IS NULL OR f.brand_tier = brand_tier_filter)
        AND f.is_verified = true
    ORDER BY 
        CASE 
            WHEN sort_type = 'popularity' THEN f.popularity_score
            WHEN sort_type = 'rating' THEN f.bayesian_rating * 20  -- Scale to match popularity range
            WHEN sort_type = 'price_low' THEN -f.sample_price_usd  -- Negative for ASC
            WHEN sort_type = 'price_high' THEN f.sample_price_usd
            ELSE f.popularity_score
        END DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: CREATE VIEWS FOR INDUSTRY-STANDARD DATA ACCESS
-- ============================================================================

-- View for best sellers (top popularity scores)
CREATE OR REPLACE VIEW bestseller_fragrances AS
SELECT 
    f.id,
    f.name,
    fb.display_name as brand_name,
    f.concentration,
    f.popularity_score,
    f.bayesian_rating,
    f.sample_price_usd,
    f.full_bottle_price,
    f.discount_percent,
    f.enhanced_description,
    format_pricing_display(f.sample_price_usd, f.full_bottle_price, f.retail_price) as pricing_display
FROM fragrances f
JOIN fragrance_brands fb ON f.brand_id = fb.id
WHERE f.popularity_score IS NOT NULL
ORDER BY f.popularity_score DESC, f.bayesian_rating DESC
LIMIT 100;

-- View for new arrivals (recent launches with good ratings)  
CREATE OR REPLACE VIEW new_arrivals AS
SELECT 
    f.id,
    f.name,
    fb.display_name as brand_name,
    f.concentration,
    f.launch_year,
    f.bayesian_rating,
    f.sample_price_usd,
    f.enhanced_description
FROM fragrances f
JOIN fragrance_brands fb ON f.brand_id = fb.id
WHERE 
    f.launch_year >= 2020 
    AND f.bayesian_rating >= 4.0
    AND f.rating_count >= 100
ORDER BY f.launch_year DESC, f.bayesian_rating DESC
LIMIT 50;

-- View for luxury showcase (premium brands only)
CREATE OR REPLACE VIEW luxury_showcase AS
SELECT 
    f.id,
    f.name,
    fb.display_name as brand_name,
    f.concentration,
    f.popularity_score,
    f.bayesian_rating,
    f.sample_price_usd,
    f.full_bottle_price,
    f.discount_percent
FROM fragrances f
JOIN fragrance_brands fb ON f.brand_id = fb.id
WHERE f.brand_tier IN ('luxury', 'premium')
ORDER BY f.brand_tier DESC, f.popularity_score DESC
LIMIT 200;

-- ============================================================================
-- STEP 6: CREATE PRICING CALCULATION TRIGGERS
-- ============================================================================

-- Trigger to auto-calculate price per ML when prices change
CREATE OR REPLACE FUNCTION update_price_per_ml()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.full_bottle_price IS NOT NULL THEN
        NEW.price_per_ml := calculate_price_per_ml(NEW.full_bottle_price, 100);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS trigger_update_price_per_ml ON fragrances;
CREATE TRIGGER trigger_update_price_per_ml
    BEFORE INSERT OR UPDATE ON fragrances
    FOR EACH ROW EXECUTE FUNCTION update_price_per_ml();

-- ============================================================================
-- STEP 7: UPDATE ROW LEVEL SECURITY FOR NEW COLUMNS
-- ============================================================================

-- The existing RLS policies will cover the new columns automatically
-- since they allow SELECT for all columns

-- ============================================================================
-- FINAL VALIDATION
-- ============================================================================

DO $$
BEGIN
    -- Verify new columns were added
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fragrances' AND column_name = 'bayesian_rating'
    ) THEN
        RAISE EXCEPTION 'Industry perfected schema migration failed: bayesian_rating column not added';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fragrances' AND column_name = 'enhanced_description'
    ) THEN
        RAISE EXCEPTION 'Industry perfected schema migration failed: enhanced_description column not added';
    END IF;
    
    -- Verify views were created
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'bestseller_fragrances'
    ) THEN
        RAISE EXCEPTION 'Industry perfected schema migration failed: bestseller_fragrances view not created';
    END IF;
    
    RAISE NOTICE 'Industry perfected schema migration completed successfully!';
    RAISE NOTICE 'Ready for perfected data import with advanced scoring and formatting!';
END $$;