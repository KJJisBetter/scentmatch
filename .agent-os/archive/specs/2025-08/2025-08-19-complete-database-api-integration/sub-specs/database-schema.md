# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-19-complete-database-api-integration/spec.md

## Schema Validation and Fixes

### Existing Schema Review
- Verify all tables from `types/database.ts` exist in actual Supabase instance
- Confirm all RPC functions are properly deployed and callable
- Validate vector indexing is active for embedding searches
- Check foreign key relationships and constraints are working

### Required Schema Adjustments

#### Session Token Consistency (Already Fixed)
```sql
-- Ensure session_token is TEXT type across all references
-- (This was already fixed in migration 20250819000004)
ALTER TABLE user_quiz_sessions 
ALTER COLUMN session_token TYPE TEXT;
```

#### Missing Indexes for Performance
```sql
-- Add performance indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_fragrances_brand_lookup 
ON fragrances(brand_id, name);

CREATE INDEX IF NOT EXISTS idx_user_collections_user_lookup 
ON user_collections(user_id, status);

CREATE INDEX IF NOT EXISTS idx_quiz_responses_session_lookup 
ON user_quiz_responses(session_id, question_id);
```

#### Function Parameter Validation
```sql
-- Ensure all RPC functions handle proper parameter types
-- Validate that function signatures match TypeScript definitions
-- Test with actual data to confirm return types are correct
```

## Migration Requirements

### Data Integrity Checks
- Verify existing fragrance data is complete and properly formatted
- Ensure all brand relationships are correctly established
- Validate embedding data exists for vector similarity functions

### Function Deployment Status
- Confirm all functions from `types/database.ts` are deployed in Supabase
- Test each function with sample parameters
- Fix any deployment or compilation issues

## Performance Considerations

### Vector Search Optimization
- Ensure pgvector extension is properly configured
- Validate HNSW indexes are built for embedding columns
- Test vector similarity query performance with sample data

### Query Optimization
- Optimize frequently used fragrance search queries
- Ensure proper indexing for filter combinations
- Add query result caching where appropriate