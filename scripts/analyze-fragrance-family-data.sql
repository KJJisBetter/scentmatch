-- SCE-62: Missing Fragrance Family Data Analysis
-- Date: 2025-08-22
-- Purpose: Analyze fragrance family data quality issues

-- ============================================================================
-- STEP 1: Check current table structure for fragrance family columns
-- ============================================================================

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fragrances' 
AND (column_name LIKE '%family%' OR column_name LIKE '%scent%');

-- ============================================================================
-- STEP 2: Count total fragrances and missing family data
-- ============================================================================

-- Check for fragrance_family column (from migration)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fragrances' AND column_name = 'fragrance_family') THEN
        RAISE NOTICE '=== FRAGRANCE_FAMILY COLUMN ANALYSIS ===';
        
        -- Total count
        EXECUTE 'SELECT COUNT(*) as total_fragrances FROM fragrances';
        
        -- Missing/null family data 
        EXECUTE 'SELECT COUNT(*) as null_family FROM fragrances WHERE fragrance_family IS NULL';
        
        -- Empty string family data
        EXECUTE 'SELECT COUNT(*) as empty_family FROM fragrances WHERE fragrance_family = ''''';
        
        -- "Unknown" family data
        EXECUTE 'SELECT COUNT(*) as unknown_family FROM fragrances WHERE LOWER(fragrance_family) = ''unknown''';
        
        -- Valid family data distribution
        EXECUTE '
        SELECT 
            fragrance_family,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM fragrances), 2) as percentage
        FROM fragrances 
        WHERE fragrance_family IS NOT NULL 
        AND fragrance_family != '''' 
        AND LOWER(fragrance_family) != ''unknown''
        GROUP BY fragrance_family 
        ORDER BY count DESC
        LIMIT 10';
        
    END IF;
END $$;

-- Check for scent_family column (from types)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fragrances' AND column_name = 'scent_family') THEN
        RAISE NOTICE '=== SCENT_FAMILY COLUMN ANALYSIS ===';
        
        -- Missing/null family data 
        EXECUTE 'SELECT COUNT(*) as null_scent_family FROM fragrances WHERE scent_family IS NULL';
        
        -- Empty string family data
        EXECUTE 'SELECT COUNT(*) as empty_scent_family FROM fragrances WHERE scent_family = ''''';
        
        -- "Unknown" family data
        EXECUTE 'SELECT COUNT(*) as unknown_scent_family FROM fragrances WHERE LOWER(scent_family) = ''unknown''';
        
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Sample records with missing family data
-- ============================================================================

-- Sample fragrances with missing family data (using fragrance_family first)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fragrances' AND column_name = 'fragrance_family') THEN
        RAISE NOTICE '=== SAMPLE RECORDS WITH MISSING FRAGRANCE_FAMILY ===';
        EXECUTE '
        SELECT 
            f.id,
            f.name,
            fb.name as brand_name,
            f.fragrance_family,
            f.main_accords,
            f.top_notes,
            f.middle_notes,
            f.base_notes,
            COALESCE(f.full_description, f.short_description) as description
        FROM fragrances f
        JOIN fragrance_brands fb ON f.brand_id = fb.id
        WHERE f.fragrance_family IS NULL 
        OR f.fragrance_family = '''' 
        OR LOWER(f.fragrance_family) = ''unknown''
        ORDER BY f.popularity_score DESC NULLS LAST
        LIMIT 10';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fragrances' AND column_name = 'scent_family') THEN
        RAISE NOTICE '=== SAMPLE RECORDS WITH MISSING SCENT_FAMILY ===';
        EXECUTE '
        SELECT 
            f.id,
            f.name,
            fb.name as brand_name,
            f.scent_family,
            f.notes,
            f.description
        FROM fragrances f
        JOIN fragrance_brands fb ON f.brand_id = fb.id
        WHERE f.scent_family IS NULL 
        OR f.scent_family = '''' 
        OR LOWER(f.scent_family) = ''unknown''
        ORDER BY f.popularity_score DESC NULLS LAST
        LIMIT 10';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Analyze patterns in missing data
-- ============================================================================

-- Check if missing family data correlates with specific brands
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fragrances' AND column_name = 'fragrance_family') THEN
        RAISE NOTICE '=== BRANDS WITH MOST MISSING FAMILY DATA ===';
        EXECUTE '
        SELECT 
            fb.name as brand_name,
            COUNT(*) as total_fragrances,
            COUNT(CASE WHEN f.fragrance_family IS NULL OR f.fragrance_family = '''' OR LOWER(f.fragrance_family) = ''unknown'' THEN 1 END) as missing_family,
            ROUND(
                COUNT(CASE WHEN f.fragrance_family IS NULL OR f.fragrance_family = '''' OR LOWER(f.fragrance_family) = ''unknown'' THEN 1 END) * 100.0 / COUNT(*), 
                2
            ) as missing_percentage
        FROM fragrances f
        JOIN fragrance_brands fb ON f.brand_id = fb.id
        GROUP BY fb.name
        HAVING COUNT(CASE WHEN f.fragrance_family IS NULL OR f.fragrance_family = '''' OR LOWER(f.fragrance_family) = ''unknown'' THEN 1 END) > 0
        ORDER BY missing_family DESC, missing_percentage DESC
        LIMIT 15';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: Check note-based inference potential
-- ============================================================================

-- Analyze fragrances with rich note data but missing family
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fragrances' AND column_name = 'fragrance_family') THEN
        RAISE NOTICE '=== FRAGRANCES WITH RICH NOTE DATA BUT MISSING FAMILY ===';
        EXECUTE '
        SELECT 
            f.id,
            f.name,
            fb.name as brand_name,
            array_length(f.main_accords, 1) as accord_count,
            array_length(f.top_notes, 1) as top_note_count,
            array_length(f.middle_notes, 1) as middle_note_count,
            array_length(f.base_notes, 1) as base_note_count,
            f.main_accords,
            f.top_notes
        FROM fragrances f
        JOIN fragrance_brands fb ON f.brand_id = fb.id
        WHERE (f.fragrance_family IS NULL OR f.fragrance_family = '''' OR LOWER(f.fragrance_family) = ''unknown'')
        AND (
            array_length(f.main_accords, 1) > 0 
            OR array_length(f.top_notes, 1) > 0
            OR array_length(f.middle_notes, 1) > 0
            OR array_length(f.base_notes, 1) > 0
        )
        ORDER BY (
            COALESCE(array_length(f.main_accords, 1), 0) + 
            COALESCE(array_length(f.top_notes, 1), 0) + 
            COALESCE(array_length(f.middle_notes, 1), 0) + 
            COALESCE(array_length(f.base_notes, 1), 0)
        ) DESC
        LIMIT 10';
    END IF;
END $$;

-- ============================================================================
-- STEP 6: Data source analysis
-- ============================================================================

-- Check data sources and their family completion rates
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fragrances' AND column_name = 'data_source') THEN
        RAISE NOTICE '=== DATA SOURCE FAMILY COMPLETION RATES ===';
        EXECUTE '
        SELECT 
            COALESCE(f.data_source, ''unknown'') as data_source,
            COUNT(*) as total_count,
            COUNT(CASE WHEN f.fragrance_family IS NOT NULL AND f.fragrance_family != '''' AND LOWER(f.fragrance_family) != ''unknown'' THEN 1 END) as with_family,
            ROUND(
                COUNT(CASE WHEN f.fragrance_family IS NOT NULL AND f.fragrance_family != '''' AND LOWER(f.fragrance_family) != ''unknown'' THEN 1 END) * 100.0 / COUNT(*), 
                2
            ) as completion_rate
        FROM fragrances f
        GROUP BY COALESCE(f.data_source, ''unknown'')
        ORDER BY total_count DESC';
    END IF;
END $$;

-- ============================================================================
-- STEP 7: Import batch analysis (if applicable)
-- ============================================================================

-- Check import batches and their family completion rates
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fragrances' AND column_name = 'import_batch') THEN
        RAISE NOTICE '=== IMPORT BATCH FAMILY COMPLETION RATES ===';
        EXECUTE '
        SELECT 
            COALESCE(f.import_batch, 0) as import_batch,
            COUNT(*) as total_count,
            COUNT(CASE WHEN f.fragrance_family IS NOT NULL AND f.fragrance_family != '''' AND LOWER(f.fragrance_family) != ''unknown'' THEN 1 END) as with_family,
            ROUND(
                COUNT(CASE WHEN f.fragrance_family IS NOT NULL AND f.fragrance_family != '''' AND LOWER(f.fragrance_family) != ''unknown'' THEN 1 END) * 100.0 / COUNT(*), 
                2
            ) as completion_rate
        FROM fragrances f
        GROUP BY COALESCE(f.import_batch, 0)
        ORDER BY import_batch DESC';
    END IF;
END $$;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

RAISE NOTICE '=== ANALYSIS COMPLETE ===';
RAISE NOTICE 'This analysis shows:';
RAISE NOTICE '1. Current schema structure for family data';
RAISE NOTICE '2. Count and percentage of missing family data';
RAISE NOTICE '3. Sample records with missing data';
RAISE NOTICE '4. Patterns by brand, data source, and import batch';
RAISE NOTICE '5. Potential for note-based family inference';