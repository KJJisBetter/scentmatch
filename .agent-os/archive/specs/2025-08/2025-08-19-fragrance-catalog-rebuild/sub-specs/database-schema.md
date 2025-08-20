# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-19-fragrance-catalog-rebuild/spec.md

## Schema Replacement Strategy

### Drop Existing Fragrance Tables
```sql
-- No backup needed - current data is incomplete and poorly organized
DROP TABLE IF EXISTS fragrances CASCADE;
DROP TABLE IF EXISTS fragrance_brands CASCADE;
```

### New Fragrance Brands Table (76 brands)
```sql
CREATE TABLE fragrance_brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    item_count INTEGER DEFAULT 0,
    popularity_tier TEXT CHECK (popularity_tier IN ('major', 'premium', 'niche', 'emerging')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### New Fragrances Table (2,017 fragrances)
```sql
CREATE TABLE fragrances (
    -- Core Identity  
    id TEXT PRIMARY KEY,
    brand_id TEXT NOT NULL REFERENCES fragrance_brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    
    -- Popularity and Ratings (KEY OPTIMIZATION)
    popularity_score DECIMAL(8,4) NOT NULL, -- 16.3784 down to 0.x
    rating_value DECIMAL(3,2), -- 4.57, 3.99, etc.
    rating_count INTEGER DEFAULT 0,
    
    -- Fragrance Details
    gender TEXT NOT NULL CHECK (gender IN ('men', 'women', 'unisex')),
    accords TEXT[] NOT NULL DEFAULT '{}',
    perfumers TEXT[] DEFAULT '{}',
    fragrantica_url TEXT,
    
    -- Sample Information
    sample_available BOOLEAN DEFAULT true,
    sample_price_usd INTEGER DEFAULT 15,
    
    -- Search and Discovery
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', name || ' ' || array_to_string(accords, ' '))
    ) STORED,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Performance Indexing Strategy

### Primary Indexes for Popular Fragrance Discovery
```sql
-- CRITICAL: Popularity-based browsing (replaces alphabetical)
CREATE INDEX idx_fragrances_popularity_score ON fragrances(popularity_score DESC);

-- Brand + popularity for brand pages (Tom Ford 45 results)
CREATE INDEX idx_fragrances_brand_popularity ON fragrances(brand_id, popularity_score DESC);

-- Gender + popularity for filtered browsing
CREATE INDEX idx_fragrances_gender_popularity ON fragrances(gender, popularity_score DESC);

-- Search performance  
CREATE INDEX idx_fragrances_search_vector ON fragrances USING GIN(search_vector);
CREATE INDEX idx_fragrances_name_brand ON fragrances(name, brand_id);

-- Sample filtering
CREATE INDEX idx_fragrances_samples ON fragrances(sample_available, sample_price_usd) 
WHERE sample_available = true;
```

## Data Import Process

### Import Order and Validation
```sql
-- 1. Import brands first (76 brands)
INSERT INTO fragrance_brands (id, name, slug, item_count, popularity_tier)
SELECT ...

-- 2. Import fragrances with proper relationships (2,017 records)
INSERT INTO fragrances (
    id, brand_id, name, slug, popularity_score, rating_value, rating_count,
    gender, accords, perfumers, fragrantica_url, sample_available, sample_price_usd
)
SELECT ...

-- 3. Update brand item counts
UPDATE fragrance_brands SET item_count = (
    SELECT COUNT(*) FROM fragrances WHERE brand_id = fragrance_brands.id
);
```

## Migration Validation

### Post-Import Verification
```sql
-- Verify complete import
SELECT COUNT(*) as total_fragrances FROM fragrances; -- Should be 2,017
SELECT COUNT(*) as total_brands FROM fragrance_brands; -- Should be 76

-- Verify top brands have complete collections
SELECT fb.name, COUNT(*) as count 
FROM fragrances f 
JOIN fragrance_brands fb ON f.brand_id = fb.id 
WHERE fb.name IN ('Dior', 'Chanel', 'Tom Ford', 'Ralph Lauren', 'Hugo Boss')
GROUP BY fb.name 
ORDER BY count DESC;
-- Expected: Dior=45, Chanel=45, Tom Ford=45, Ralph Lauren=57, Hugo Boss=57

-- Verify popularity ordering
SELECT name, brand_id, popularity_score 
FROM fragrances 
ORDER BY popularity_score DESC 
LIMIT 10;
-- Should show popular fragrances first, not alphabetical
```

## API Compatibility Requirements

### Search API Updates
- Ensure search results return in popularity order by default
- Verify brand searches return complete collections (Tom Ford = 45 results)
- Test that existing API response format remains compatible
- Confirm sample pricing and availability fields work correctly

### Fragrance Detail API
- Update fragrance detail endpoints to use new fragrance IDs
- Ensure proper brand name resolution through foreign key joins
- Verify rating and accord data displays correctly