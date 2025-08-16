# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-15-database-population-voyage-embeddings/spec.md

## Migration Execution Plan

### Step 1: Execute Existing Migrations
```bash
# Run migrations in order
supabase migration up
# Or execute individually:
# 1. 20250815000001_security_fixes_and_schema_foundation.sql
# 2. 20250815000002_database_functions.sql  
# 3. 20250815000003_quiz_system_foundation.sql
# 4. 20250815000004_quiz_content_and_logic.sql
```

### Step 2: Verify Schema Creation
```sql
-- Verify critical tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('fragrances', 'fragrance_brands', 'fragrance_embeddings', 'user_collections');

-- Verify vector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Verify indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('fragrances', 'fragrance_embeddings');
```

## Data Import Schema Mapping

### Fragrances Table Population
```sql
-- Map data/fragrances.json structure to database schema
INSERT INTO fragrances (
  id,                    -- Use existing id from JSON
  name,                  -- Direct mapping from name
  brand_id,              -- Map from brandId 
  description,           -- Generate from accords and metadata
  notes,                 -- Extract from accords array
  scent_family,          -- Derive from primary accord
  sample_available,      -- Default to true for MVP
  sample_price_usd,      -- Calculate based on pricing logic
  popularity_score,      -- Use score field from JSON
  created_at,
  updated_at
) VALUES (...);
```

### Fragrance Brands Table Population
```sql
-- Map data/brands.json to fragrance_brands table
INSERT INTO fragrance_brands (
  id,           -- Use id from brands.json
  name,         -- Direct mapping from name
  item_count,   -- Use itemCount from JSON
  popularity_score,  -- Calculate from aggregate fragrance ratings
  created_at,
  updated_at
) VALUES (...);
```

### Embedding Generation Schema
```sql
-- Store Voyage AI embeddings in fragrance_embeddings table
INSERT INTO fragrance_embeddings (
  fragrance_id,         -- Reference to fragrances.id
  embedding_version,    -- 'voyage-3.5'
  embedding,           -- 1024-dimension vector from Voyage AI
  embedding_source,    -- 'combined' (name + brand + accords + description)
  created_at,
  updated_at
) VALUES (...);
```

## Index Optimization

### Vector Similarity Indexes
```sql
-- Primary HNSW index for production performance
CREATE INDEX fragrance_embeddings_hnsw_cosine_idx 
ON fragrance_embeddings 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 24, ef_construction = 64);

-- Set query-time parameters for optimal performance
SET hnsw.ef_search = 40;
```

### Search Performance Indexes
```sql
-- Text search optimization
CREATE INDEX fragrances_name_gin_idx ON fragrances USING gin(name gin_trgm_ops);
CREATE INDEX fragrances_brand_idx ON fragrances(brand_id);
CREATE INDEX fragrances_popularity_idx ON fragrances(popularity_score DESC);

-- Array search for accords/notes
CREATE INDEX fragrances_notes_gin_idx ON fragrances USING gin(notes);
```

## Data Validation Rules

### Import Validation
```sql
-- Ensure data integrity during import
ALTER TABLE fragrances ADD CONSTRAINT fragrances_rating_valid 
CHECK (popularity_score >= 0 AND popularity_score <= 100);

ALTER TABLE fragrances ADD CONSTRAINT fragrances_name_not_empty 
CHECK (name IS NOT NULL AND trim(name) != '');

ALTER TABLE fragrance_brands ADD CONSTRAINT brands_item_count_valid 
CHECK (item_count >= 0);
```

### Embedding Validation
```sql
-- Validate embedding dimensions and quality
ALTER TABLE fragrance_embeddings ADD CONSTRAINT embedding_dimensions_valid 
CHECK (array_length(embedding, 1) = 1024);

-- Ensure embeddings are normalized (for cosine similarity)
CREATE OR REPLACE FUNCTION validate_embedding_magnitude(embedding vector)
RETURNS boolean AS $$
BEGIN
  -- Check that embedding magnitude is close to 1 (normalized)
  RETURN abs(sqrt(sum(x^2) for x in embedding) - 1.0) < 0.1;
END;
$$ LANGUAGE plpgsql;
```

## Performance Targets

### Query Performance Goals
- Fragrance import: < 30 seconds for all 1,467 records
- Embedding generation: < 10 minutes for all fragrances (batched)
- Vector similarity search: < 50ms for typical queries
- Full-text search: < 100ms for name/brand searches
- Combined search (vector + filters): < 200ms total

### Resource Usage Targets
- Voyage AI API cost: < $5 for initial embedding generation
- Database storage: ~10MB for embeddings (1,467 × 1024 × 4 bytes)
- Index size: ~20MB for HNSW index
- Memory usage: < 500MB during import process