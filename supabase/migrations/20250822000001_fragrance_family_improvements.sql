-- SCE-62: Fragrance Family Data Quality Improvements
-- Date: 2025-08-22
-- Purpose: Add constraints, indexes, and validation for fragrance family data

-- ============================================================================
-- STEP 1: Add family validation constraint
-- ============================================================================

-- First, let's see what family values we currently have
DO $$
DECLARE
    family_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT fragrance_family) INTO family_count 
    FROM fragrances 
    WHERE fragrance_family IS NOT NULL 
    AND fragrance_family != '' 
    AND LOWER(fragrance_family) != 'unknown';
    
    RAISE NOTICE 'Current distinct family values: %', family_count;
END $$;

-- Create constraint for valid fragrance families
-- Using common fragrance family categories
ALTER TABLE fragrances 
ADD CONSTRAINT chk_fragrance_family_valid 
CHECK (
    fragrance_family IS NULL OR 
    fragrance_family IN (
        'oriental', 'amber',
        'woody', 'woods',
        'fresh', 'citrus', 'aquatic',
        'floral', 'white floral',
        'gourmand', 'sweet',
        'fougere', 'aromatic',
        'chypre', 'mossy',
        'green', 'herbal',
        'spicy', 'warm spicy',
        'leather', 'animalic',
        'powdery', 'soft',
        'fruity', 'tropical'
    )
);

-- ============================================================================
-- STEP 2: Add inference tracking columns
-- ============================================================================

-- Add columns to track inference metadata
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS family_inference_confidence DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS family_inference_method TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS family_last_updated TIMESTAMP DEFAULT NULL;

-- Add check constraint for confidence score
ALTER TABLE fragrances 
ADD CONSTRAINT chk_family_confidence_valid 
CHECK (
    family_inference_confidence IS NULL OR 
    (family_inference_confidence >= 0.0 AND family_inference_confidence <= 1.0)
);

-- Add check constraint for inference method
ALTER TABLE fragrances 
ADD CONSTRAINT chk_family_inference_method_valid 
CHECK (
    family_inference_method IS NULL OR 
    family_inference_method IN ('manual', 'ai_inference', 'note_analysis', 'brand_pattern', 'import')
);

-- ============================================================================
-- STEP 3: Create improved indexes
-- ============================================================================

-- Improve existing family index
DROP INDEX IF EXISTS idx_fragrances_family;
CREATE INDEX idx_fragrances_family_complete ON fragrances(fragrance_family) 
WHERE fragrance_family IS NOT NULL;

-- Index for data quality queries
CREATE INDEX idx_fragrances_family_quality ON fragrances(
    fragrance_family, 
    family_inference_confidence, 
    family_inference_method
);

-- Index for missing family data analysis
CREATE INDEX idx_fragrances_missing_family ON fragrances(id, brand_id, popularity_score) 
WHERE fragrance_family IS NULL;

-- ============================================================================
-- STEP 4: Create family validation functions
-- ============================================================================

-- Function to validate and suggest family corrections
CREATE OR REPLACE FUNCTION validate_fragrance_family(
    input_family TEXT
)
RETURNS TABLE(
    is_valid BOOLEAN,
    suggested_family TEXT,
    reason TEXT
) AS $$
BEGIN
    -- Normalize input
    input_family := LOWER(TRIM(input_family));
    
    -- Check if already valid
    IF input_family IN (
        'oriental', 'amber', 'woody', 'woods', 'fresh', 'citrus', 'aquatic',
        'floral', 'white floral', 'gourmand', 'sweet', 'fougere', 'aromatic',
        'chypre', 'mossy', 'green', 'herbal', 'spicy', 'warm spicy',
        'leather', 'animalic', 'powdery', 'soft', 'fruity', 'tropical'
    ) THEN
        RETURN QUERY SELECT true, input_family, 'Valid family'::TEXT;
        RETURN;
    END IF;
    
    -- Suggest corrections for common variations
    CASE 
        WHEN input_family LIKE '%oriental%' OR input_family LIKE '%amber%' THEN
            RETURN QUERY SELECT false, 'oriental'::TEXT, 'Mapped oriental variant'::TEXT;
        WHEN input_family LIKE '%wood%' OR input_family LIKE '%cedar%' OR input_family LIKE '%sandalwood%' THEN
            RETURN QUERY SELECT false, 'woody'::TEXT, 'Mapped woody variant'::TEXT;
        WHEN input_family LIKE '%floral%' OR input_family LIKE '%flower%' OR input_family LIKE '%rose%' OR input_family LIKE '%jasmine%' THEN
            RETURN QUERY SELECT false, 'floral'::TEXT, 'Mapped floral variant'::TEXT;
        WHEN input_family LIKE '%fresh%' OR input_family LIKE '%citrus%' OR input_family LIKE '%marine%' OR input_family LIKE '%aquatic%' THEN
            RETURN QUERY SELECT false, 'fresh'::TEXT, 'Mapped fresh variant'::TEXT;
        WHEN input_family LIKE '%sweet%' OR input_family LIKE '%gourmand%' OR input_family LIKE '%vanilla%' THEN
            RETURN QUERY SELECT false, 'gourmand'::TEXT, 'Mapped gourmand variant'::TEXT;
        WHEN input_family LIKE '%spic%' OR input_family LIKE '%pepper%' THEN
            RETURN QUERY SELECT false, 'spicy'::TEXT, 'Mapped spicy variant'::TEXT;
        WHEN input_family LIKE '%green%' OR input_family LIKE '%herb%' THEN
            RETURN QUERY SELECT false, 'green'::TEXT, 'Mapped green variant'::TEXT;
        WHEN input_family LIKE '%fruit%' THEN
            RETURN QUERY SELECT false, 'fruity'::TEXT, 'Mapped fruity variant'::TEXT;
        ELSE
            RETURN QUERY SELECT false, NULL::TEXT, 'No suitable mapping found'::TEXT;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get family statistics
CREATE OR REPLACE FUNCTION get_family_statistics()
RETURNS TABLE(
    family_name TEXT,
    fragrance_count BIGINT,
    percentage DECIMAL(5,2),
    avg_confidence DECIMAL(3,2),
    manual_count BIGINT,
    inferred_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(f.fragrance_family, 'Unknown') as family_name,
        COUNT(*) as fragrance_count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
        ROUND(AVG(f.family_inference_confidence), 2) as avg_confidence,
        COUNT(CASE WHEN f.family_inference_method = 'manual' THEN 1 END) as manual_count,
        COUNT(CASE WHEN f.family_inference_method IN ('ai_inference', 'note_analysis') THEN 1 END) as inferred_count
    FROM fragrances f
    GROUP BY f.fragrance_family
    ORDER BY fragrance_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Create data quality monitoring view
-- ============================================================================

CREATE OR REPLACE VIEW fragrance_family_quality AS
SELECT 
    'Total Fragrances' as metric,
    COUNT(*)::TEXT as value,
    '100%' as target
FROM fragrances

UNION ALL

SELECT 
    'With Family Data' as metric,
    COUNT(CASE WHEN fragrance_family IS NOT NULL THEN 1 END)::TEXT as value,
    '>95%' as target
FROM fragrances

UNION ALL

SELECT 
    'Missing Family' as metric,
    COUNT(CASE WHEN fragrance_family IS NULL THEN 1 END)::TEXT as value,
    '<5%' as target
FROM fragrances

UNION ALL

SELECT 
    'High Confidence Inferences' as metric,
    COUNT(CASE WHEN family_inference_confidence >= 0.8 THEN 1 END)::TEXT as value,
    '>80% of inferences' as target
FROM fragrances
WHERE family_inference_method IN ('ai_inference', 'note_analysis')

UNION ALL

SELECT 
    'Unique Families' as metric,
    COUNT(DISTINCT fragrance_family)::TEXT as value,
    '15-25 families' as target
FROM fragrances
WHERE fragrance_family IS NOT NULL;

-- ============================================================================
-- STEP 6: Create trigger for family updates
-- ============================================================================

-- Function to automatically update family metadata
CREATE OR REPLACE FUNCTION update_family_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Update timestamp when family changes
    IF OLD.fragrance_family IS DISTINCT FROM NEW.fragrance_family THEN
        NEW.family_last_updated := NOW();
        
        -- Set inference method if not already set
        IF NEW.family_inference_method IS NULL AND NEW.fragrance_family IS NOT NULL THEN
            NEW.family_inference_method := 'manual';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_family_metadata ON fragrances;
CREATE TRIGGER trigger_update_family_metadata
    BEFORE UPDATE ON fragrances
    FOR EACH ROW EXECUTE FUNCTION update_family_metadata();

-- ============================================================================
-- STEP 7: Add helpful comments
-- ============================================================================

COMMENT ON COLUMN fragrances.fragrance_family IS 'Primary fragrance family classification (oriental, woody, fresh, floral, etc.)';
COMMENT ON COLUMN fragrances.family_inference_confidence IS 'Confidence score (0.0-1.0) for AI-inferred family classifications';
COMMENT ON COLUMN fragrances.family_inference_method IS 'Method used to determine family: manual, ai_inference, note_analysis, brand_pattern, import';
COMMENT ON COLUMN fragrances.family_last_updated IS 'Timestamp of last family data update';

COMMENT ON FUNCTION validate_fragrance_family(TEXT) IS 'Validates family names and suggests corrections for variants';
COMMENT ON FUNCTION get_family_statistics() IS 'Returns comprehensive family distribution and quality statistics';
COMMENT ON VIEW fragrance_family_quality IS 'Data quality dashboard for fragrance family completeness';

-- ============================================================================
-- FINAL VALIDATION
-- ============================================================================

-- Verify the changes
DO $$
BEGIN
    -- Check if constraints were added
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_fragrance_family_valid'
    ) THEN
        RAISE NOTICE 'Family validation constraint added successfully';
    END IF;
    
    -- Check if new columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fragrances' AND column_name = 'family_inference_confidence'
    ) THEN
        RAISE NOTICE 'Inference tracking columns added successfully';
    END IF;
    
    -- Check if indexes exist
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_fragrances_family_complete'
    ) THEN
        RAISE NOTICE 'Family indexes created successfully';
    END IF;
    
    RAISE NOTICE 'SCE-62 migration completed successfully!';
END $$;