# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-15-database-population-voyage-embeddings/spec.md

## Endpoints

### POST /api/admin/import-data

**Purpose:** Import fragrance and brand data from JSON files with validation and error handling
**Parameters:**
- `source` (enum): "brands", "fragrances", "all" (default: "all")
- `validate_only` (boolean): Run validation without importing (default: false)
- `batch_size` (number): Records per batch (default: 100)

**Response:**
```json
{
  "status": "success",
  "imported": {
    "brands": 40,
    "fragrances": 1467
  },
  "errors": [],
  "processing_time_ms": 15420,
  "validation_passed": true
}
```
**Errors:** 400 (validation failed), 403 (unauthorized), 500 (import failed)

### POST /api/admin/generate-embeddings

**Purpose:** Generate Voyage AI embeddings for fragrance records using voyage-3.5 model
**Parameters:**
- `batch_size` (number): Fragrances per batch (default: 50)
- `embedding_version` (string): AI model version (default: "voyage-3.5")
- `force_regenerate` (boolean): Regenerate existing embeddings (default: false)
- `fragrance_ids` (array, optional): Specific fragrances to process

**Response:**
```json
{
  "status": "success",
  "processed": 1467,
  "skipped": 0,
  "errors": [],
  "cost_estimate_usd": 4.23,
  "processing_time_ms": 245000,
  "voyage_api_calls": 30,
  "embeddings_generated": 1467
}
```
**Errors:** 400 (invalid parameters), 429 (rate limit), 500 (embedding generation failed)

### POST /api/admin/optimize-indexes

**Purpose:** Create and optimize database indexes for vector search performance
**Parameters:**
- `index_type` (enum): "hnsw", "ivfflat", "all" (default: "hnsw")
- `rebuild` (boolean): Drop and recreate existing indexes (default: false)

**Response:**
```json
{
  "status": "success",
  "indexes_created": [
    "fragrance_embeddings_hnsw_cosine_idx",
    "fragrances_name_gin_idx",
    "fragrances_popularity_idx"
  ],
  "query_performance_improvement": "85%",
  "index_build_time_ms": 12500
}
```
**Errors:** 403 (unauthorized), 500 (index creation failed)

### GET /api/admin/import-status

**Purpose:** Check status of data import and embedding generation processes
**Parameters:** None

**Response:**
```json
{
  "database": {
    "brands_count": 40,
    "fragrances_count": 1467,
    "embeddings_count": 1467,
    "migrations_applied": 4,
    "last_import": "2025-08-15T23:45:00Z"
  },
  "embeddings": {
    "voyage_3_5_count": 1467,
    "missing_embeddings": 0,
    "average_generation_time_ms": 167,
    "last_generation": "2025-08-15T23:52:00Z"
  },
  "performance": {
    "avg_search_time_ms": 45,
    "vector_index_health": "optimal",
    "database_size_mb": 156
  }
}
```
**Errors:** 500 (status check failed)

## Implementation Requirements

### Data Import Controller
**Action:** importFragranceData
**Business Logic:**
- Validate JSON file structure and required fields
- Map data structure to database schema with type conversion
- Handle duplicate detection and conflict resolution
- Execute batch insertions with transaction safety
- Generate import summary and error reports

### Embedding Generation Controller  
**Action:** generateVoyageEmbeddings
**Business Logic:**
- Create embedding text from fragrance metadata (name + brand + accords)
- Call Voyage AI API with proper rate limiting and error handling
- Store embeddings with version tracking and source attribution
- Monitor API costs and usage patterns
- Handle batch processing with progress tracking

### Index Optimization Controller
**Action:** optimizeVectorIndexes
**Business Logic:**
- Create HNSW indexes with optimal parameters for dataset size
- Monitor index build progress and performance impact
- Configure runtime parameters for query optimization
- Validate index effectiveness with sample queries
- Provide performance improvement metrics

### Status Monitoring Controller
**Action:** getImportStatus
**Business Logic:**
- Query database for current data counts and health metrics
- Calculate embedding generation coverage and gaps
- Monitor search performance and index utilization
- Provide actionable insights for optimization needs
- Track API usage and cost patterns

## Security and Access Control

**Admin-Only Endpoints:**
- All import and embedding endpoints require service role access
- Rate limiting protection for expensive operations
- API key validation for Voyage AI integration
- Transaction isolation for data consistency

**Error Handling:**
- Comprehensive validation before expensive operations
- Graceful degradation when external services unavailable
- Detailed error logging for debugging and monitoring
- Automatic cleanup for failed import operations