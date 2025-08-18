# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-18-fragrance-ux-polish-experience/spec.md

## Database Changes Required

### Enhanced Fragrance Table Schema

**New Columns to Add:**

```sql
-- Add fragrance family categorization
ALTER TABLE fragrances ADD COLUMN fragrance_family TEXT;
ALTER TABLE fragrances ADD COLUMN fragrance_subfamily TEXT;

-- Add main accords for better matching
ALTER TABLE fragrances ADD COLUMN main_accords TEXT[]; -- Array of main scent accords

-- Add perfumer information
ALTER TABLE fragrances ADD COLUMN perfumers TEXT[]; -- Array of perfumer names

-- Add popularity and rating metrics
ALTER TABLE fragrances ADD COLUMN popularity_score DECIMAL(5,2);
ALTER TABLE fragrances ADD COLUMN rating_value DECIMAL(3,2);
ALTER TABLE fragrances ADD COLUMN rating_count INTEGER;

-- Add enhanced metadata
ALTER TABLE fragrances ADD COLUMN launch_year INTEGER;
ALTER TABLE fragrances ADD COLUMN concentration_type TEXT; -- EDT, EDP, Parfum, etc.
ALTER TABLE fragrances ADD COLUMN longevity_hours INTEGER;
ALTER TABLE fragrances ADD COLUMN sillage_rating INTEGER; -- 1-5 scale

-- Add affiliate and sourcing data
ALTER TABLE fragrances ADD COLUMN affiliate_links JSONB; -- Store partner links
ALTER TABLE fragrances ADD COLUMN sample_available BOOLEAN DEFAULT false;
ALTER TABLE fragrances ADD COLUMN sample_price DECIMAL(5,2);
```

### Data Migration Strategy

**Step 1: Backup Current Data**

```sql
-- Create backup table
CREATE TABLE fragrances_backup AS SELECT * FROM fragrances;
```

**Step 2: Import Research Data**

```sql
-- Create temporary import table for research data
CREATE TEMPORARY TABLE fragrance_import (
    id TEXT,
    brand_id TEXT,
    brand_name TEXT,
    name TEXT,
    slug TEXT,
    rating_value DECIMAL(3,2),
    rating_count INTEGER,
    score DECIMAL(8,4),
    gender TEXT,
    accords TEXT[],
    perfumers TEXT[],
    url TEXT
);

-- Import from research JSON files (via application code)
-- Data from /home/kevinjavier/dev/scentmatch-scrapped-last/research/output/fragrances.json
```

**Step 3: Map Research Data to Schema**

```sql
-- Update existing fragrances with research data where matches found
UPDATE fragrances SET
    main_accords = import.accords,
    perfumers = import.perfumers,
    rating_value = import.rating_value,
    rating_count = import.rating_count,
    popularity_score = import.score,
    fragrance_family = CASE
        WHEN 'floral' = ANY(import.accords) THEN 'Floral'
        WHEN 'woody' = ANY(import.accords) THEN 'Woody'
        WHEN 'oriental' = ANY(import.accords) OR 'amber' = ANY(import.accords) THEN 'Oriental'
        WHEN 'fresh' = ANY(import.accords) OR 'citrus' = ANY(import.accords) THEN 'Fresh'
        ELSE 'Unknown'
    END
FROM fragrance_import import
WHERE fragrances.name ILIKE '%' || import.name || '%'
   OR import.name ILIKE '%' || fragrances.name || '%';
```

**Step 4: Add New Fragrances from Research**

```sql
-- Insert new high-quality fragrances from research data
INSERT INTO fragrances (
    name, brand, description, gender, main_accords, perfumers,
    rating_value, rating_count, popularity_score, fragrance_family,
    created_at, updated_at
)
SELECT
    import.name,
    import.brand_name,
    'Premium fragrance from research database',
    import.gender,
    import.accords,
    import.perfumers,
    import.rating_value,
    import.rating_count,
    import.score,
    CASE
        WHEN 'floral' = ANY(import.accords) THEN 'Floral'
        WHEN 'woody' = ANY(import.accords) THEN 'Woody'
        WHEN 'oriental' = ANY(import.accords) OR 'amber' = ANY(import.accords) THEN 'Oriental'
        WHEN 'fresh' = ANY(import.accords) OR 'citrus' = ANY(import.accords) THEN 'Fresh'
        ELSE 'Unknown'
    END,
    NOW(),
    NOW()
FROM fragrance_import import
WHERE NOT EXISTS (
    SELECT 1 FROM fragrances
    WHERE name ILIKE '%' || import.name || '%'
       OR import.name ILIKE '%' || fragrances.name || '%'
)
AND import.rating_count > 100 -- Only import well-rated fragrances
AND import.score > 5.0; -- Only import popular fragrances
```

### Index Optimization

**Create Indexes for Better Performance:**

```sql
-- Fragrance family filtering
CREATE INDEX idx_fragrances_family ON fragrances(fragrance_family);

-- Gender filtering
CREATE INDEX idx_fragrances_gender ON fragrances(gender);

-- Popularity sorting
CREATE INDEX idx_fragrances_popularity ON fragrances(popularity_score DESC);

-- Rating sorting
CREATE INDEX idx_fragrances_rating ON fragrances(rating_value DESC, rating_count DESC);

-- Text search optimization
CREATE INDEX idx_fragrances_search ON fragrances USING GIN(to_tsvector('english', name || ' ' || brand));

-- Accords array search
CREATE INDEX idx_fragrances_accords ON fragrances USING GIN(main_accords);
```

### Data Quality Checks

**Validation Queries:**

```sql
-- Check for missing fragrance families
SELECT COUNT(*) as missing_family_count
FROM fragrances
WHERE fragrance_family IS NULL OR fragrance_family = 'Unknown';

-- Check rating data quality
SELECT
    fragrance_family,
    COUNT(*) as total,
    AVG(rating_value) as avg_rating,
    AVG(rating_count) as avg_review_count
FROM fragrances
WHERE rating_value IS NOT NULL
GROUP BY fragrance_family;

-- Check for duplicate entries
SELECT name, brand, COUNT(*)
FROM fragrances
GROUP BY name, brand
HAVING COUNT(*) > 1;
```

### Enhanced Quiz Response Schema

**New Quiz Profile Storage:**

```sql
-- Create table for enhanced quiz profiles
CREATE TABLE fragrance_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE,

    -- Profile metadata
    profile_name TEXT NOT NULL,
    profile_description TEXT,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'enthusiast', 'collector')),

    -- Fragrance preferences
    preferred_families TEXT[],
    preferred_accords TEXT[],
    intensity_preference TEXT CHECK (intensity_preference IN ('light', 'moderate', 'strong')),
    occasion_preferences TEXT[],

    -- Analysis data
    personality_analysis JSONB,
    quiz_responses JSONB,
    confidence_score DECIMAL(3,2),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast profile lookups
CREATE INDEX idx_fragrance_profiles_session ON fragrance_profiles(session_token);
CREATE INDEX idx_fragrance_profiles_user ON fragrance_profiles(user_id);
CREATE INDEX idx_fragrance_profiles_families ON fragrance_profiles USING GIN(preferred_families);
```

## Migration Timeline

**Phase 1 (Week 1):** Database schema updates and data backup
**Phase 2 (Week 1):** Research data import and mapping
**Phase 3 (Week 2):** Data quality validation and cleanup
**Phase 4 (Week 2):** Quiz profile schema implementation
**Phase 5 (Week 3):** Index optimization and performance testing

## Rollback Strategy

```sql
-- If migration fails, restore from backup
DROP TABLE IF EXISTS fragrances;
CREATE TABLE fragrances AS SELECT * FROM fragrances_backup;

-- Restore original indexes
-- (Individual index recreation commands would be preserved)
```
