-- FRAGRANCE DATA QUALITY SYSTEM MIGRATION
-- Date: 2025-08-20
-- Purpose: Implement canonical fragrance system for data quality and normalization
-- Spec: @.agent-os/specs/2025-08-20-fragrance-data-quality-system/

-- ============================================================================
-- STEP 1: ENABLE REQUIRED EXTENSIONS  
-- ============================================================================

-- Enable pg_trgm for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable pgvector for semantic search (if not already enabled)  
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- STEP 2: CREATE CANONICAL FRAGRANCE SYSTEM TABLES
-- ============================================================================

-- Primary canonical fragrance table
CREATE TABLE IF NOT EXISTS fragrances_canonical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  brand_id TEXT REFERENCES fragrance_brands(id) ON DELETE CASCADE,
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

-- Track name variations and malformed entries
CREATE TABLE IF NOT EXISTS fragrance_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id UUID REFERENCES fragrances_canonical(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  source TEXT CHECK (source IN ('user_input', 'import', 'ocr', 'manual')),
  confidence FLOAT DEFAULT 0.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  is_malformed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(variant_name)
);

-- Track searches for products not in database
CREATE TABLE IF NOT EXISTS missing_product_requests (
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

-- Aggregated missing product summary
CREATE TABLE IF NOT EXISTS missing_product_summary (
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

-- Track data quality metrics over time
CREATE TABLE IF NOT EXISTS data_quality_scores (
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

-- Individual quality issues
CREATE TABLE IF NOT EXISTS data_quality_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_type TEXT NOT NULL, -- 'malformed_name', 'duplicate', 'missing_field', etc.
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  fragrance_id TEXT, -- May reference original or canonical table
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Track migration progress from existing fragrance table
CREATE TABLE IF NOT EXISTS fragrance_migration_log (
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

-- ============================================================================
-- STEP 3: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Canonical fragrances indexes
CREATE INDEX IF NOT EXISTS idx_fragrances_canonical_embedding 
  ON fragrances_canonical 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_fragrances_canonical_fts 
  ON fragrances_canonical 
  USING gin (search_vector);

CREATE INDEX IF NOT EXISTS idx_fragrances_canonical_brand 
  ON fragrances_canonical (brand_id);

CREATE INDEX IF NOT EXISTS idx_fragrances_canonical_quality 
  ON fragrances_canonical (quality_score DESC);

CREATE INDEX IF NOT EXISTS idx_fragrances_canonical_name 
  ON fragrances_canonical (canonical_name);

-- Variant indexes  
CREATE INDEX IF NOT EXISTS idx_variants_trgm 
  ON fragrance_variants 
  USING gin (variant_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_variants_canonical 
  ON fragrance_variants (canonical_id);

CREATE INDEX IF NOT EXISTS idx_variants_malformed 
  ON fragrance_variants (is_malformed) WHERE is_malformed = TRUE;

CREATE INDEX IF NOT EXISTS idx_variants_confidence 
  ON fragrance_variants (confidence DESC);

-- Missing product indexes
CREATE INDEX IF NOT EXISTS idx_missing_requests_query 
  ON missing_product_requests (search_query);

CREATE INDEX IF NOT EXISTS idx_missing_requests_status 
  ON missing_product_requests (status);

CREATE INDEX IF NOT EXISTS idx_missing_requests_priority 
  ON missing_product_requests (priority_score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_missing_summary_priority 
  ON missing_product_summary (priority_score DESC, request_count DESC);

-- Quality monitoring indexes
CREATE INDEX IF NOT EXISTS idx_quality_scores_timestamp 
  ON data_quality_scores (check_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_quality_issues_status 
  ON data_quality_issues (status, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quality_issues_type 
  ON data_quality_issues (issue_type, severity);

-- Migration tracking indexes
CREATE INDEX IF NOT EXISTS idx_migration_log_original 
  ON fragrance_migration_log (original_fragrance_id);

CREATE INDEX IF NOT EXISTS idx_migration_log_canonical 
  ON fragrance_migration_log (canonical_id);

-- ============================================================================
-- STEP 4: CREATE UTILITY FUNCTIONS
-- ============================================================================

-- Helper function to check if extension exists
CREATE OR REPLACE FUNCTION check_extension_exists(extension_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM pg_extension WHERE extname = extension_name
  );
END;
$$ LANGUAGE plpgsql;

-- Function to normalize fragrance concentration 
CREATE OR REPLACE FUNCTION normalize_concentration(input_concentration TEXT)
RETURNS TEXT AS $$
BEGIN
  input_concentration := LOWER(TRIM(input_concentration));
  
  CASE 
    WHEN input_concentration IN ('edp', 'eau de parfum') THEN
      RETURN 'Eau de Parfum'
    WHEN input_concentration IN ('edt', 'eau de toilette') THEN
      RETURN 'Eau de Toilette'  
    WHEN input_concentration IN ('edc', 'eau de cologne', 'cologne') THEN
      RETURN 'Eau de Cologne'
    WHEN input_concentration IN ('parfum', 'extrait', 'extrait de parfum') THEN
      RETURN 'Extrait de Parfum'
    WHEN input_concentration = 'aftershave' THEN
      RETURN 'Aftershave'
    ELSE
      RETURN initcap(input_concentration) -- Capitalize first letter
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function for fuzzy variant search using trigrams
CREATE OR REPLACE FUNCTION similarity_search_variants(
  query_text TEXT,
  threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  variant_id UUID,
  variant_name TEXT,
  canonical_id UUID,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fv.id,
    fv.variant_name,
    fv.canonical_id,
    similarity(fv.variant_name, query_text)::FLOAT
  FROM fragrance_variants fv
  WHERE similarity(fv.variant_name, query_text) > threshold
  ORDER BY similarity(fv.variant_name, query_text) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: CREATE CORE SEARCH FUNCTIONS
-- ============================================================================

-- Smart fragrance search function with multi-stage approach
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
    WHERE fc.embedding IS NOT NULL
    ORDER BY fc.embedding <=> query_embedding
    LIMIT limit_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: CREATE DATA QUALITY FUNCTIONS
-- ============================================================================

-- Comprehensive data quality check function
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
  
  -- Count total canonical products
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

-- Function to log missing product requests
CREATE OR REPLACE FUNCTION log_missing_product_request(
  query TEXT,
  user_id_param UUID DEFAULT NULL,
  ip_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  request_id UUID;
  normalized_query TEXT;
  summary_id UUID;
BEGIN
  request_id := gen_random_uuid();
  normalized_query := LOWER(TRIM(query));
  
  -- Insert individual request
  INSERT INTO missing_product_requests (
    id, search_query, user_id, ip_address, user_agent
  ) VALUES (
    request_id, query, user_id_param, ip_param, user_agent_param
  );
  
  -- Update or create summary
  INSERT INTO missing_product_summary (normalized_query, request_count, unique_users)
  VALUES (normalized_query, 1, CASE WHEN user_id_param IS NOT NULL THEN 1 ELSE 0 END)
  ON CONFLICT (normalized_query) DO UPDATE SET
    request_count = missing_product_summary.request_count + 1,
    unique_users = missing_product_summary.unique_users + 
      CASE WHEN user_id_param IS NOT NULL THEN 1 ELSE 0 END,
    last_requested = NOW(),
    priority_score = LEAST(10, missing_product_summary.request_count + 1);
  
  RETURN request_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE fragrances_canonical ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragrance_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE missing_product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE missing_product_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragrance_migration_log ENABLE ROW LEVEL SECURITY;

-- Public read policies for core data
CREATE POLICY "Canonical fragrances are publicly readable" 
  ON fragrances_canonical FOR SELECT USING (true);

CREATE POLICY "Fragrance variants are publicly readable" 
  ON fragrance_variants FOR SELECT USING (true);

CREATE POLICY "Missing product summary is publicly readable" 
  ON missing_product_summary FOR SELECT USING (true);

CREATE POLICY "Data quality scores are publicly readable" 
  ON data_quality_scores FOR SELECT USING (true);

-- User-specific policies for requests
CREATE POLICY "Users can create missing product requests" 
  ON missing_product_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own requests" 
  ON missing_product_requests FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Service role can manage everything
CREATE POLICY "Service role manages canonical fragrances" 
  ON fragrances_canonical FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages variants" 
  ON fragrance_variants FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages quality data" 
  ON data_quality_scores FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages quality issues" 
  ON data_quality_issues FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages migration log" 
  ON fragrance_migration_log FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 8: VALIDATION AND VERIFICATION
-- ============================================================================

-- Verify all required tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fragrances_canonical') THEN
    RAISE EXCEPTION 'Migration failed: fragrances_canonical table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fragrance_variants') THEN
    RAISE EXCEPTION 'Migration failed: fragrance_variants table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_quality_scores') THEN
    RAISE EXCEPTION 'Migration failed: data_quality_scores table not created';
  END IF;
  
  -- Verify extensions are available
  IF NOT check_extension_exists('pg_trgm') THEN
    RAISE EXCEPTION 'Migration failed: pg_trgm extension not available';
  END IF;
  
  IF NOT check_extension_exists('vector') THEN
    RAISE EXCEPTION 'Migration failed: pgvector extension not available';
  END IF;
  
  RAISE NOTICE 'Fragrance Data Quality System migration successful!';
  RAISE NOTICE 'Tables created: fragrances_canonical, fragrance_variants, missing_product_requests, data_quality_scores, data_quality_issues';
  RAISE NOTICE 'Functions created: search_fragrances_smart, run_data_quality_checks, log_missing_product_request';
  RAISE NOTICE 'Extensions enabled: pg_trgm, pgvector';
END $$;