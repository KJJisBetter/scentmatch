# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-18-critical-release-fixes/spec.md

## Schema Changes

### Fragrance Table Enhancements

```sql
-- Add popularity scoring and better gender classification
ALTER TABLE fragrances
ADD COLUMN popularity_score INTEGER DEFAULT 0,
ADD COLUMN popularity_rank INTEGER,
ADD COLUMN data_source VARCHAR(50),
ADD COLUMN last_updated TIMESTAMP DEFAULT NOW(),
ADD COLUMN is_verified BOOLEAN DEFAULT false;

-- Improve gender classification
ALTER TABLE fragrances
ADD CONSTRAINT check_gender_values CHECK (gender IN ('men', 'women', 'unisex'));

-- Add indexing for performance
CREATE INDEX idx_fragrances_popularity ON fragrances(popularity_score DESC);
CREATE INDEX idx_fragrances_gender_popularity ON fragrances(gender, popularity_score DESC);
CREATE INDEX idx_fragrances_verified ON fragrances(is_verified);
```

### New Tables for Data Quality

```sql
-- Track data sources and import history
CREATE TABLE fragrance_import_log (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL,
    import_date TIMESTAMP DEFAULT NOW(),
    fragrances_imported INTEGER,
    success_rate DECIMAL(5,2),
    notes TEXT
);

-- Cache AI-generated insights
CREATE TABLE ai_insights_cache (
    id SERIAL PRIMARY KEY,
    fragrance_id INTEGER REFERENCES fragrances(id),
    user_preference_hash VARCHAR(64),
    insight_text TEXT NOT NULL,
    generated_date TIMESTAMP DEFAULT NOW(),
    expires_date TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);
```

### Data Migration Scripts

```sql
-- Backup existing data
CREATE TABLE fragrances_backup AS SELECT * FROM fragrances;

-- Clean up duplicate or invalid entries
DELETE FROM fragrances WHERE name IS NULL OR brand IS NULL;

-- Standardize gender values
UPDATE fragrances SET gender = 'unisex' WHERE gender NOT IN ('men', 'women');
```

## Rationale

### Popularity Scoring

- **Purpose:** Enable proper ranking and recommendation prioritization
- **Performance:** Indexed columns for fast sorting and filtering
- **Data Integrity:** Track data sources and verification status

### Gender Classification

- **Purpose:** Fix gender filtering issues by enforcing valid values
- **Data Quality:** Constraint ensures only valid gender categories
- **User Experience:** Proper filtering prevents cross-gender recommendation errors

### AI Insights Caching

- **Purpose:** Avoid redundant API calls and improve performance
- **Scalability:** Hash-based caching for personalized insights
- **Cost Control:** Reduce OpenAI API usage through intelligent caching
