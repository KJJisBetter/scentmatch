# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-19-hybrid-data-pipeline-system/spec.md

## Data Flow Requirements

### Fragrance Table Integration
- **No Schema Changes** - Pipeline works with existing `fragrances` table structure
- **Data Normalization** - Transform Kaggle fields to match existing schema (id, brand_id, name, rating, etc.)
- **Bulk Import Strategy** - Use Supabase batch insert operations for efficient data loading
- **Duplicate Handling** - Check for existing entries by normalized name and brand before insertion
- **Data Quality Constraints** - Ensure all imported fragrances meet minimum quality thresholds

### Performance Optimizations

```sql
-- Index optimization for pipeline operations
CREATE INDEX IF NOT EXISTS idx_fragrances_rating_reviews 
ON fragrances(rating, review_count) 
WHERE rating > 3.5 AND review_count > 100;

-- Index for brand-based filtering during import
CREATE INDEX IF NOT EXISTS idx_fragrances_brand_priority 
ON fragrances(brand_id, rating) 
WHERE brand_id IN ('dior', 'chanel', 'tom-ford', 'creed');

-- Composite index for popularity scoring
CREATE INDEX IF NOT EXISTS idx_fragrances_popularity_score 
ON fragrances(rating, review_count, year) 
WHERE rating IS NOT NULL AND review_count IS NOT NULL;
```

### Data Migration Scripts

```sql
-- Migration for pipeline processing metadata
ALTER TABLE fragrances 
ADD COLUMN IF NOT EXISTS pipeline_priority_score DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS pipeline_source TEXT DEFAULT 'kaggle',
ADD COLUMN IF NOT EXISTS pipeline_imported_at TIMESTAMP DEFAULT NOW();

-- Update trigger for automatic embedding generation
CREATE OR REPLACE FUNCTION trigger_embedding_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger embedding pipeline when new fragrances added
  INSERT INTO embedding_queue (fragrance_id, source_table, priority)
  VALUES (NEW.id, 'fragrances', 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fragrance_embedding_trigger
  AFTER INSERT ON fragrances
  FOR EACH ROW
  EXECUTE FUNCTION trigger_embedding_generation();
```

### Data Validation Rules

```sql
-- Constraint for minimum quality standards
ALTER TABLE fragrances 
ADD CONSTRAINT check_pipeline_quality 
CHECK (
  (pipeline_source = 'kaggle' AND rating >= 3.5 AND review_count >= 100) 
  OR 
  (pipeline_source = 'scraping' AND rating >= 4.0 AND review_count >= 500)
  OR
  (pipeline_source IS NULL) -- Existing data exemption
);

-- Ensure required fields for pipeline imports
ALTER TABLE fragrances 
ADD CONSTRAINT check_pipeline_required_fields
CHECK (
  (pipeline_source IS NULL) 
  OR 
  (name IS NOT NULL AND brand_id IS NOT NULL AND rating IS NOT NULL)
);
```

## Rationale

**Performance Considerations:** The indexed queries will significantly speed up pipeline operations, especially during duplicate detection and quality filtering phases.

**Data Integrity:** The constraints ensure that all pipeline-imported data meets the quality standards defined in the technical specification while allowing existing data to remain unchanged.

**Monitoring Integration:** The pipeline metadata columns enable tracking of data sources and import timestamps for ongoing maintenance and quality assurance.