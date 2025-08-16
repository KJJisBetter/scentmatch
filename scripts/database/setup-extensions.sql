-- PostgreSQL Extensions Setup for ScentMatch
-- Run this script in Supabase SQL Editor to enable required extensions

-- Extension 1: UUID generation
-- Required for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension 2: Vector embeddings for AI
-- Required for storing and searching fragrance embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Extension 3: Fuzzy text search
-- Required for fragrance name and brand fuzzy searching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify installations
SELECT 
    extname,
    extversion,
    CASE 
        WHEN extname = 'uuid-ossp' THEN 'UUID generation for primary keys'
        WHEN extname = 'vector' THEN 'Vector embeddings for AI recommendations'
        WHEN extname = 'pg_trgm' THEN 'Fuzzy text search for fragrances'
        ELSE 'Unknown extension'
    END as purpose
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'vector', 'pg_trgm')
ORDER BY extname;

-- Test UUID generation
SELECT 
    'UUID Test' as test_name,
    uuid_generate_v4() as generated_uuid,
    'SUCCESS' as status;

-- Test Vector operations (using actual fragrance embedding dimension)
DO $$
DECLARE
    test_vector vector(1536);
    test_distance float;
BEGIN
    -- Create test vector with proper dimensions
    SELECT array_fill(0.1, ARRAY[1536])::vector INTO test_vector;
    
    -- Test vector distance calculation
    SELECT test_vector <-> array_fill(0.2, ARRAY[1536])::vector INTO test_distance;
    
    RAISE NOTICE 'Vector Test: SUCCESS - Distance calculated: %', test_distance;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Vector Test: FAILED - %', SQLERRM;
END $$;

-- Test Trigram similarity
SELECT 
    'Trigram Test' as test_name,
    similarity('fragrance', 'fragance') as similarity_score,
    CASE 
        WHEN similarity('fragrance', 'fragance') > 0 THEN 'SUCCESS'
        ELSE 'FAILED'
    END as status;

-- Performance test for UUID generation
DO $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    duration interval;
BEGIN
    start_time := clock_timestamp();
    
    -- Generate 1000 UUIDs
    PERFORM uuid_generate_v4() FROM generate_series(1,1000);
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    RAISE NOTICE 'Performance Test: Generated 1000 UUIDs in %', duration;
END $$;

-- Final verification query
SELECT 
    COUNT(*) as total_extensions,
    array_agg(extname ORDER BY extname) as installed_extensions
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'vector', 'pg_trgm');