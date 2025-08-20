# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-20-pre-launch-audit-refinement/spec.md

## Database Changes for Pagination

### Pagination Query Optimization

**Enhanced Browse Queries:**
```sql
-- Efficient pagination query with COUNT optimization
SELECT 
  f.*,
  b.name as brand_name,
  COUNT(*) OVER() as total_count
FROM fragrances f
LEFT JOIN fragrance_brands b ON f.brand_id = b.id
WHERE f.status = 'active'
ORDER BY f.created_at DESC
LIMIT $1 OFFSET $2;
```

**Index Optimization:**
```sql
-- Ensure proper indexes exist for pagination performance
CREATE INDEX IF NOT EXISTS idx_fragrances_status_created_at 
ON fragrances(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fragrances_brand_id 
ON fragrances(brand_id);
```

### Browse Filtering Support

**Extended Browse Queries with Filters:**
```sql
-- Pagination with search filters
SELECT 
  f.*,
  b.name as brand_name,
  COUNT(*) OVER() as total_count
FROM fragrances f
LEFT JOIN fragrance_brands b ON f.brand_id = b.id
WHERE f.status = 'active'
  AND ($3::text IS NULL OR f.name ILIKE '%' || $3 || '%')
  AND ($4::uuid IS NULL OR f.brand_id = $4)
ORDER BY 
  CASE WHEN $5 = 'name' THEN f.name END ASC,
  CASE WHEN $5 = 'brand' THEN b.name END ASC,
  f.created_at DESC
LIMIT $1 OFFSET $2;
```

## Performance Considerations

**Query Optimization:**
- Use `COUNT(*) OVER()` window function to get total count in single query
- Implement proper LIMIT/OFFSET for server-side pagination
- Ensure indexes exist on frequently filtered columns

**Caching Strategy:**
- Consider implementing query result caching for common browse requests
- Cache total counts for performance when filtering is not applied

## Migration Requirements

No new tables or schema changes required. Only query optimization and index verification needed.

**Index Verification Script:**
```sql
-- Verify existing indexes
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename IN ('fragrances', 'fragrance_brands')
ORDER BY tablename, indexname;
```