# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-18-database-integration-system-fixes/spec.md

## Database Validation Requirements

### Schema Verification

- Verify all new tables exist and are properly structured:
  - `fragrance_embeddings` - Vector embeddings for similarity search
  - `user_preferences` - User fragrance preferences and quiz results
  - `user_fragrance_interactions` - User interaction tracking
  - Enhanced `fragrances` table - Additional metadata columns
  - Enhanced `user_collections` table - Collection management features

### Index Optimization

- Verify performance indexes are created and functional:
  - Vector similarity indexes on `fragrance_embeddings.embedding`
  - GIN indexes for array searches on fragrance accords
  - Composite indexes for filtering operations
  - Text search indexes for fragrance names and descriptions

### Database Function Validation

- Verify custom database functions are deployed and working:
  - `get_similar_fragrances(user_id, limit)` - Vector similarity recommendations
  - `get_collection_insights(user_id)` - Collection analytics
  - `update_user_preferences(user_id, preferences)` - Preference management
  - `track_fragrance_interaction(user_id, fragrance_id, interaction_type)` - Analytics

### Row Level Security (RLS)

- Verify RLS policies are properly configured:
  - `fragrances` and `fragrance_brands` tables have proper public read access
  - `user_preferences` and `user_collections` restrict access to owner
  - `user_fragrance_interactions` properly isolate user data
  - `fragrance_embeddings` accessible for similarity searches

## Integration Requirements

### Migration Status Check

```sql
-- Verify all migrations have been applied
SELECT version FROM supabase_migrations.schema_migrations
WHERE version LIKE '202508%'
ORDER BY version DESC;

-- Check table existence
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('fragrance_embeddings', 'user_preferences', 'user_fragrance_interactions');

-- Verify indexes exist
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('fragrance_embeddings', 'fragrances', 'user_preferences');
```

### Data Consistency Validation

- Verify existing fragrance data is compatible with new schema
- Check that fragrance_embeddings table has vector data for existing fragrances
- Validate that user_collections references are still intact
- Ensure fragrance metadata is properly populated

### Function Testing

```sql
-- Test vector similarity function
SELECT get_similar_fragrances(null, 5);

-- Test preference functions
SELECT * FROM update_user_preferences('test-user-id', '{"floral": 0.8, "woody": 0.6}'::jsonb);

-- Verify RLS policies
SET role = 'anon';
SELECT COUNT(*) FROM fragrances; -- Should work
SELECT COUNT(*) FROM user_preferences; -- Should return 0 or error
```

## Performance Requirements

### Query Performance Targets

- Vector similarity searches: < 100ms for 5-10 similar fragrances
- Fragrance filtering and search: < 200ms for browse page queries
- User preference updates: < 50ms for quiz result processing
- Collection operations: < 100ms for add/remove operations

### Index Strategy

- Use HNSW indexes for vector similarity (optimal for production workloads)
- Composite indexes for multi-column filtering (brand + family + price)
- Partial indexes for commonly filtered subsets (availability, gender)
- GIN indexes for full-text search and array operations
