# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-25-critical-product-page-404-fix/spec.md

> Created: 2025-08-25
> Version: 1.0.0

## Schema Changes

### Fragrance ID Normalization

**Add normalized_id column to fragrances table:**
```sql
ALTER TABLE fragrances 
ADD COLUMN normalized_id TEXT;

-- Create unique index for normalized IDs
CREATE UNIQUE INDEX idx_fragrances_normalized_id 
ON fragrances(normalized_id) 
WHERE normalized_id IS NOT NULL;
```

**Populate normalized IDs for existing data:**
```sql
-- Normalize existing fragrance IDs
UPDATE fragrances 
SET normalized_id = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(brand || '-' || name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
)
WHERE normalized_id IS NULL;
```

### Data Integrity Constraints

**Foreign key constraint for recommendations:**
```sql
-- Add fragrance_id column to quiz_results table if not exists
ALTER TABLE quiz_results 
ADD COLUMN IF NOT EXISTS fragrance_id INTEGER REFERENCES fragrances(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_quiz_results_fragrance_id 
ON quiz_results(fragrance_id);
```

**Validation constraints:**
```sql
-- Ensure normalized_id follows proper format
ALTER TABLE fragrances 
ADD CONSTRAINT check_normalized_id_format 
CHECK (normalized_id ~ '^[a-z0-9-]+$');

-- Prevent empty normalized IDs
ALTER TABLE fragrances 
ADD CONSTRAINT check_normalized_id_not_empty 
CHECK (LENGTH(normalized_id) > 0);
```

### Recommendation Tracking

**Create fragrance_recommendation_log table:**
```sql
CREATE TABLE IF NOT EXISTS fragrance_recommendation_log (
  id BIGSERIAL PRIMARY KEY,
  quiz_session_id TEXT NOT NULL,
  recommended_fragrance_id TEXT NOT NULL, -- Raw ID from recommendation engine
  actual_fragrance_id INTEGER REFERENCES fragrances(id), -- Validated ID
  recommendation_source TEXT NOT NULL, -- 'ai_engine', 'fallback', etc.
  is_valid BOOLEAN NOT NULL DEFAULT false,
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_recommendation_log_session 
ON fragrance_recommendation_log(quiz_session_id);

CREATE INDEX idx_recommendation_log_recommended 
ON fragrance_recommendation_log(recommended_fragrance_id);
```

## Migrations

### Migration 1: Add Normalized ID Support

```sql
-- File: supabase/migrations/20250825000001_add_fragrance_normalized_ids.sql

BEGIN;

-- Add normalized_id column
ALTER TABLE fragrances 
ADD COLUMN normalized_id TEXT;

-- Create function to normalize fragrance IDs
CREATE OR REPLACE FUNCTION normalize_fragrance_id(brand_name TEXT, fragrance_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(brand_name || '-' || fragrance_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Populate normalized IDs for existing data
UPDATE fragrances 
SET normalized_id = normalize_fragrance_id(brand, name)
WHERE normalized_id IS NULL;

-- Add constraints
ALTER TABLE fragrances 
ADD CONSTRAINT check_normalized_id_format 
CHECK (normalized_id ~ '^[a-z0-9-]+$');

ALTER TABLE fragrances 
ADD CONSTRAINT check_normalized_id_not_empty 
CHECK (LENGTH(normalized_id) > 0);

-- Create unique index
CREATE UNIQUE INDEX idx_fragrances_normalized_id 
ON fragrances(normalized_id) 
WHERE normalized_id IS NOT NULL;

-- Make normalized_id NOT NULL after populating data
ALTER TABLE fragrances 
ALTER COLUMN normalized_id SET NOT NULL;

COMMIT;
```

### Migration 2: Recommendation Tracking

```sql
-- File: supabase/migrations/20250825000002_add_recommendation_tracking.sql

BEGIN;

-- Create recommendation tracking table
CREATE TABLE fragrance_recommendation_log (
  id BIGSERIAL PRIMARY KEY,
  quiz_session_id TEXT NOT NULL,
  recommended_fragrance_id TEXT NOT NULL,
  actual_fragrance_id INTEGER REFERENCES fragrances(id),
  recommendation_source TEXT NOT NULL DEFAULT 'ai_engine',
  is_valid BOOLEAN NOT NULL DEFAULT false,
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_recommendation_log_session 
ON fragrance_recommendation_log(quiz_session_id);

CREATE INDEX idx_recommendation_log_recommended 
ON fragrance_recommendation_log(recommended_fragrance_id);

CREATE INDEX idx_recommendation_log_actual 
ON fragrance_recommendation_log(actual_fragrance_id);

CREATE INDEX idx_recommendation_log_created_at 
ON fragrance_recommendation_log(created_at);

-- RLS policies
ALTER TABLE fragrance_recommendation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to recommendation logs"
ON fragrance_recommendation_log FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Allow insert for recommendation tracking"
ON fragrance_recommendation_log FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recommendation_log_updated_at
    BEFORE UPDATE ON fragrance_recommendation_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

### Migration 3: Data Consistency Audit

```sql
-- File: supabase/migrations/20250825000003_audit_fragrance_consistency.sql

BEGIN;

-- Create view for fragrance ID consistency audit
CREATE OR REPLACE VIEW fragrance_id_audit AS
SELECT 
  f.id,
  f.brand,
  f.name,
  f.normalized_id,
  -- Check if there are multiple fragrances with similar normalized IDs
  COUNT(*) OVER (PARTITION BY f.normalized_id) as duplicate_count,
  -- Check for potential recommendation mismatches
  EXISTS(
    SELECT 1 FROM fragrance_recommendation_log frl 
    WHERE frl.recommended_fragrance_id = f.normalized_id
    AND frl.actual_fragrance_id != f.id
  ) as has_recommendation_mismatch
FROM fragrances f;

-- Create function to find orphaned recommendations
CREATE OR REPLACE FUNCTION find_orphaned_recommendations()
RETURNS TABLE(
  recommended_id TEXT,
  recommendation_count BIGINT,
  potential_matches TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    frl.recommended_fragrance_id,
    COUNT(*)::BIGINT as recommendation_count,
    ARRAY_AGG(DISTINCT f.normalized_id) FILTER (WHERE similarity(frl.recommended_fragrance_id, f.normalized_id) > 0.5)
  FROM fragrance_recommendation_log frl
  LEFT JOIN fragrances f ON frl.actual_fragrance_id = f.id
  WHERE frl.actual_fragrance_id IS NULL
  GROUP BY frl.recommended_fragrance_id
  ORDER BY recommendation_count DESC;
END;
$$ LANGUAGE plpgsql;

COMMIT;
```