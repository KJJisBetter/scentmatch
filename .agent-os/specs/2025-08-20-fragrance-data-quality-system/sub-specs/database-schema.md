# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-20-fragrance-data-quality-system/spec.md

## Schema Changes

### New Tables for Canonical System

**Canonical Fragrances Table:**
```sql
-- Primary canonical fragrance table
CREATE TABLE fragrances_canonical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  brand_id UUID REFERENCES fragrance_brands(id),
  fragrance_line TEXT NOT NULL,
  concentration TEXT, -- 'Eau de Parfum', 'Eau de Toilette', etc.
  size_ml INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- Search optimization
  embedding vector(1536), -- OpenAI text-embedding-3-small
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(canonical_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(fragrance_line, '')), 'B')
  ) STORED,
  
  -- Quality tracking
  quality_score FLOAT DEFAULT 0.0,
  last_quality_check TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(canonical_name, brand_id)
);

-- Indexes for performance
CREATE INDEX idx_fragrances_canonical_embedding 
  ON fragrances_canonical 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_fragrances_canonical_fts 
  ON fragrances_canonical 
  USING gin (search_vector);

CREATE INDEX idx_fragrances_canonical_brand 
  ON fragrances_canonical (brand_id);

CREATE INDEX idx_fragrances_canonical_quality 
  ON fragrances_canonical (quality_score DESC);
```

**Fragrance Variants Table:**
```sql
-- Track name variations and malformed entries
CREATE TABLE fragrance_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id UUID REFERENCES fragrances_canonical(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  source TEXT CHECK (source IN ('user_input', 'import', 'ocr', 'manual')),
  confidence FLOAT DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  is_malformed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(variant_name)
);

-- Trigram index for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_variants_trgm 
  ON fragrance_variants 
  USING gin (variant_name gin_trgm_ops);

CREATE INDEX idx_variants_canonical 
  ON fragrance_variants (canonical_id);

CREATE INDEX idx_variants_malformed 
  ON fragrance_variants (is_malformed) WHERE is_malformed = TRUE;
```

### Missing Products Tracking

```sql
-- Track searches for products not in database
CREATE TABLE missing_product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Classification
  category TEXT, -- 'fragrance', 'brand', 'unknown'
  extracted_brand TEXT,
  extracted_product TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sourcing', 'added', 'rejected')),
  priority_score INTEGER DEFAULT 1,
  sourced_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX idx_missing_requests_query 
  ON missing_product_requests (search_query);

CREATE INDEX idx_missing_requests_status 
  ON missing_product_requests (status);

CREATE INDEX idx_missing_requests_priority 
  ON missing_product_requests (priority_score DESC, created_at DESC);

-- Aggregated missing product summary
CREATE TABLE missing_product_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_query TEXT UNIQUE NOT NULL,
  request_count INTEGER DEFAULT 1,
  unique_users INTEGER DEFAULT 1,
  first_requested TIMESTAMPTZ DEFAULT NOW(),
  last_requested TIMESTAMPTZ DEFAULT NOW(),
  priority_score INTEGER DEFAULT 1,
  
  -- Analysis
  suggested_alternatives JSONB DEFAULT '[]',
  sourcing_status TEXT DEFAULT 'pending',
  estimated_demand INTEGER DEFAULT 1
);

CREATE INDEX idx_missing_summary_priority 
  ON missing_product_summary (priority_score DESC, request_count DESC);
```

### Data Quality Monitoring

```sql
-- Track data quality metrics over time
CREATE TABLE data_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_timestamp TIMESTAMPTZ DEFAULT NOW(),
  overall_score FLOAT CHECK (overall_score >= 0.0 AND overall_score <= 1.0),
  
  -- Component scores
  name_formatting_score FLOAT DEFAULT 0.0,
  completeness_score FLOAT DEFAULT 0.0,
  duplicate_score FLOAT DEFAULT 0.0,
  variant_mapping_score FLOAT DEFAULT 0.0,
  
  -- Metrics
  total_products INTEGER,
  malformed_names INTEGER,
  missing_fields INTEGER,
  duplicate_products INTEGER,
  orphaned_variants INTEGER,
  
  -- Check details
  check_duration_ms INTEGER,
  issues_detected JSONB DEFAULT '[]'
);

CREATE INDEX idx_quality_scores_timestamp 
  ON data_quality_scores (check_timestamp DESC);

-- Individual quality issues
CREATE TABLE data_quality_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_type TEXT NOT NULL, -- 'malformed_name', 'duplicate', 'missing_field', etc.
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  fragrance_id UUID, -- May reference original or canonical table
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_quality_issues_status 
  ON data_quality_issues (status, severity, created_at DESC);
```

### Migration Support

```sql
-- Track migration progress from existing fragrance table
CREATE TABLE fragrance_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_fragrance_id TEXT NOT NULL, -- Reference to existing fragrances.id
  canonical_id UUID REFERENCES fragrances_canonical(id),
  migration_type TEXT CHECK (migration_type IN ('direct', 'normalized', 'merged')),
  migration_timestamp TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  -- Track what was changed
  original_name TEXT,
  canonical_name TEXT,
  normalization_applied BOOLEAN DEFAULT FALSE
);
```

### Database Functions

```sql
-- Smart fragrance search function
CREATE OR REPLACE FUNCTION search_fragrances_smart(
  query_text TEXT,
  query_embedding vector(1536) DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
) RETURNS TABLE (
  fragrance_id UUID,
  canonical_name TEXT,
  brand_name TEXT,
  similarity_score FLOAT,
  match_type TEXT
) AS $$
BEGIN
  -- Try exact match first
  RETURN QUERY
  SELECT 
    fc.id,
    fc.canonical_name,
    fb.name as brand_name,
    1.0::FLOAT,
    'exact'::TEXT
  FROM fragrances_canonical fc
  JOIN fragrance_brands fb ON fc.brand_id = fb.id
  WHERE LOWER(fc.canonical_name) = LOWER(query_text)
  LIMIT limit_count;
  
  IF FOUND THEN RETURN; END IF;
  
  -- Try variant match
  RETURN QUERY
  SELECT 
    fc.id,
    fc.canonical_name,
    fb.name as brand_name,
    fv.confidence,
    'variant'::TEXT
  FROM fragrance_variants fv
  JOIN fragrances_canonical fc ON fc.id = fv.canonical_id
  JOIN fragrance_brands fb ON fc.brand_id = fb.id
  WHERE LOWER(fv.variant_name) = LOWER(query_text)
  ORDER BY fv.confidence DESC
  LIMIT limit_count;
  
  IF FOUND THEN RETURN; END IF;
  
  -- Try trigram fuzzy match
  RETURN QUERY
  SELECT 
    fc.id,
    fc.canonical_name,
    fb.name as brand_name,
    similarity(fc.canonical_name, query_text)::FLOAT,
    'fuzzy'::TEXT
  FROM fragrances_canonical fc
  JOIN fragrance_brands fb ON fc.brand_id = fb.id
  WHERE similarity(fc.canonical_name, query_text) > 0.3
  ORDER BY similarity(fc.canonical_name, query_text) DESC
  LIMIT limit_count;
  
  IF FOUND THEN RETURN; END IF;
  
  -- Fall back to vector similarity if embedding provided
  IF query_embedding IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      fc.id,
      fc.canonical_name,
      fb.name as brand_name,
      1 - (fc.embedding <=> query_embedding)::FLOAT,
      'semantic'::TEXT
    FROM fragrances_canonical fc
    JOIN fragrance_brands fb ON fc.brand_id = fb.id
    ORDER BY fc.embedding <=> query_embedding
    LIMIT limit_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Data quality check function
CREATE OR REPLACE FUNCTION run_data_quality_checks()
RETURNS UUID AS $$
DECLARE
  check_id UUID;
  total_count INTEGER;
  malformed_count INTEGER;
  missing_count INTEGER;
  duplicate_count INTEGER;
  orphan_count INTEGER;
  overall_score FLOAT;
BEGIN
  check_id := gen_random_uuid();
  
  -- Count total products
  SELECT COUNT(*) INTO total_count FROM fragrances_canonical;
  
  -- Count malformed names (simple heuristics)
  SELECT COUNT(*) INTO malformed_count 
  FROM fragrances_canonical 
  WHERE canonical_name ~ '[A-Z]{2,}' -- All caps words
    OR canonical_name ~ '\([0-9]+\)$' -- Ends with (number)
    OR canonical_name ~ '^[A-Z][0-9]' -- Starts with letter+number
    OR length(canonical_name) < 5; -- Too short
  
  -- Count missing essential fields
  SELECT COUNT(*) INTO missing_count
  FROM fragrances_canonical
  WHERE brand_id IS NULL 
    OR fragrance_line IS NULL 
    OR fragrance_line = '';
  
  -- Count potential duplicates (high similarity)
  WITH similarity_pairs AS (
    SELECT COUNT(*) as pair_count
    FROM fragrances_canonical f1
    CROSS JOIN fragrances_canonical f2
    WHERE f1.id < f2.id
      AND f1.brand_id = f2.brand_id
      AND similarity(f1.canonical_name, f2.canonical_name) > 0.8
  )
  SELECT COALESCE(pair_count, 0) INTO duplicate_count FROM similarity_pairs;
  
  -- Count orphaned variants
  SELECT COUNT(*) INTO orphan_count
  FROM fragrance_variants fv
  WHERE NOT EXISTS (
    SELECT 1 FROM fragrances_canonical fc WHERE fc.id = fv.canonical_id
  );
  
  -- Calculate overall score
  overall_score := GREATEST(0.0, 1.0 - (
    (malformed_count::FLOAT / GREATEST(total_count, 1)) * 0.4 +
    (missing_count::FLOAT / GREATEST(total_count, 1)) * 0.3 +
    (duplicate_count::FLOAT / GREATEST(total_count, 1)) * 0.2 +
    (orphan_count::FLOAT / GREATEST(total_count, 1)) * 0.1
  ));
  
  -- Insert results
  INSERT INTO data_quality_scores (
    id, overall_score, name_formatting_score, completeness_score,
    duplicate_score, variant_mapping_score, total_products,
    malformed_names, missing_fields, duplicate_products, orphaned_variants
  ) VALUES (
    check_id, overall_score, 
    1.0 - (malformed_count::FLOAT / GREATEST(total_count, 1)),
    1.0 - (missing_count::FLOAT / GREATEST(total_count, 1)),
    1.0 - (duplicate_count::FLOAT / GREATEST(total_count, 1)),
    1.0 - (orphan_count::FLOAT / GREATEST(total_count, 1)),
    total_count, malformed_count, missing_count, duplicate_count, orphan_count
  );
  
  RETURN check_id;
END;
$$ LANGUAGE plpgsql;
```

## Migration Strategy

### Phase 1: Schema Creation
1. Create new canonical tables alongside existing fragrance table
2. Set up indexes and extensions (pg_trgm, pgvector)
3. Create database functions for searching and quality checks

### Phase 2: Data Migration
1. Analyze existing fragrance data and identify normalization patterns
2. Migrate clean data directly to canonical table
3. Create variant mappings for malformed names
4. Generate embeddings for semantic search

### Phase 3: Application Integration
1. Update API endpoints to use canonical system
2. Implement fallback to old system during transition
3. Gradual migration of search and recommendation systems
4. Remove old fragrance table once migration complete

### Rollback Plan
- Keep existing fragrance table during migration
- Feature flags to switch between old and new systems
- Data consistency checks before final cutover