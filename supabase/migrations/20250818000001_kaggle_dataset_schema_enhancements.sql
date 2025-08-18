-- Migration: Kaggle Dataset Schema Enhancements
-- Date: 2025-08-18
-- Purpose: Enhance fragrance schema to support rich Kaggle dataset with 2000+ fragrances

-- Add new columns to fragrances table for Kaggle dataset integration
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS perfumers TEXT[], -- Array of perfumer names
ADD COLUMN IF NOT EXISTS fragrantica_url TEXT, -- Reference URL
ADD COLUMN IF NOT EXISTS full_description TEXT, -- Rich description from Kaggle
ADD COLUMN IF NOT EXISTS main_accords TEXT[], -- Full accord array instead of single scent_family
ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'kaggle', -- Track data source
ADD COLUMN IF NOT EXISTS kaggle_score DECIMAL(10,4), -- Original Kaggle popularity score
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS import_batch INTEGER; -- Track which import batch

-- Improve gender classification to handle unisex better
ALTER TABLE fragrances 
DROP CONSTRAINT IF EXISTS check_gender_values;

ALTER TABLE fragrances 
ADD CONSTRAINT check_gender_values CHECK (
  gender IN ('men', 'women', 'unisex', 'for men', 'for women', 'for women and men')
);

-- Add indexes for improved performance
CREATE INDEX IF NOT EXISTS idx_fragrances_kaggle_score ON fragrances(kaggle_score DESC);
CREATE INDEX IF NOT EXISTS idx_fragrances_main_accords ON fragrances USING GIN(main_accords);
CREATE INDEX IF NOT EXISTS idx_fragrances_data_source ON fragrances(data_source);
CREATE INDEX IF NOT EXISTS idx_fragrances_verified ON fragrances(is_verified);
CREATE INDEX IF NOT EXISTS idx_fragrances_import_batch ON fragrances(import_batch);

-- Create backup of current data before major changes
CREATE TABLE IF NOT EXISTS fragrances_backup_20250818 AS 
SELECT * FROM fragrances;

-- Create kaggle import log table
CREATE TABLE IF NOT EXISTS kaggle_import_log (
    id SERIAL PRIMARY KEY,
    import_batch INTEGER NOT NULL,
    source_file VARCHAR(255),
    import_date TIMESTAMP DEFAULT NOW(),
    fragrances_imported INTEGER,
    fragrances_updated INTEGER,
    success_rate DECIMAL(5,2),
    notes TEXT,
    completion_time INTERVAL
);

-- Create function to clean and standardize gender values
CREATE OR REPLACE FUNCTION standardize_gender(input_gender TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Standardize gender values from Kaggle dataset
    CASE 
        WHEN input_gender ILIKE '%for women and men%' OR input_gender ILIKE '%unisex%' THEN
            RETURN 'unisex'
        WHEN input_gender ILIKE '%for women%' THEN
            RETURN 'women'  
        WHEN input_gender ILIKE '%for men%' THEN
            RETURN 'men'
        ELSE
            RETURN 'unisex' -- Default fallback
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to extract scent family from accords
CREATE OR REPLACE FUNCTION extract_primary_scent_family(accords TEXT[])
RETURNS TEXT AS $$
BEGIN
    -- Extract primary scent family from accords array
    IF array_length(accords, 1) IS NULL OR array_length(accords, 1) = 0 THEN
        RETURN 'miscellaneous';
    END IF;
    
    -- Return the first accord as primary scent family
    RETURN accords[1];
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate sample pricing based on brand and popularity
CREATE OR REPLACE FUNCTION calculate_sample_price(
    brand_name TEXT,
    kaggle_score DECIMAL,
    rating_value DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
    base_price INTEGER := 8;
    brand_premium INTEGER := 0;
    popularity_bonus INTEGER := 0;
    rating_bonus INTEGER := 0;
BEGIN
    -- Brand premium pricing
    IF brand_name ILIKE ANY(ARRAY['Tom Ford', 'Creed', 'Maison Margiela', 'KILIAN Paris']) THEN
        brand_premium := 7; -- Luxury brands
    ELSIF brand_name ILIKE ANY(ARRAY['Chanel', 'Dior', 'Guerlain', 'Hermès']) THEN
        brand_premium := 5; -- Premium brands
    ELSIF brand_name ILIKE ANY(ARRAY['Versace', 'Prada', 'Armani', 'Burberry']) THEN
        brand_premium := 3; -- Designer brands
    END IF;
    
    -- Popularity bonus
    IF kaggle_score > 18 THEN
        popularity_bonus := 4;
    ELSIF kaggle_score > 15 THEN  
        popularity_bonus := 2;
    END IF;
    
    -- Rating bonus
    IF rating_value > 4.5 THEN
        rating_bonus := 2;
    ELSIF rating_value > 4.0 THEN
        rating_bonus := 1;
    END IF;
    
    RETURN LEAST(base_price + brand_premium + popularity_bonus + rating_bonus, 25);
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the enhancements
COMMENT ON TABLE fragrances IS 'Enhanced fragrance table supporting rich Kaggle dataset with 2000+ fragrances, detailed accords, perfumer information, and popularity scoring';

-- Validation
DO $$
BEGIN
    -- Verify new columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fragrances' AND column_name = 'main_accords'
    ) THEN
        RAISE EXCEPTION 'Migration failed: main_accords column not created';
    END IF;
    
    -- Verify functions exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'standardize_gender'
    ) THEN
        RAISE EXCEPTION 'Migration failed: standardize_gender function not created';
    END IF;
    
    RAISE NOTICE 'Migration 20250818000001 completed successfully';
END $$;