# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-20-fragrance-data-quality-system/spec.md

## Data Quality Management Endpoints

### POST /api/data-quality/normalize

**Purpose:** Normalize fragrance name input using industry-standard formatting rules
**Parameters:** 
- `name` (string, required): Raw fragrance name to normalize
- `brand` (string, optional): Brand name for context
- `confidence_threshold` (float, optional): Minimum confidence for normalization (default: 0.8)

**Response:**
```json
{
  "success": true,
  "data": {
    "canonical_name": "Bleu de Chanel Eau de Parfum",
    "original_name": "Bleu De EDP",
    "brand": "Chanel",
    "fragrance_line": "Bleu de Chanel", 
    "concentration": "Eau de Parfum",
    "confidence": 0.95,
    "changes_applied": [
      "Fixed capitalization: 'De' → 'de'",
      "Expanded abbreviation: 'EDP' → 'Eau de Parfum'",
      "Added brand context: 'Chanel'"
    ]
  }
}
```

**Errors:**
- 400: Invalid input format
- 422: Unable to normalize with sufficient confidence

### GET /api/data-quality/variants/{canonical_id}

**Purpose:** Retrieve name variants for a canonical product
**Parameters:**
- `canonical_id` (UUID, path): ID of canonical fragrance
- `include_malformed` (boolean, query): Include malformed variants (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "canonical_name": "Bleu de Chanel Eau de Parfum",
    "variants": [
      {
        "variant_name": "Bleu De EDP",
        "source": "import",
        "confidence": 0.9,
        "is_malformed": true
      },
      {
        "variant_name": "Bleu de Chanel EDP",
        "source": "user_input", 
        "confidence": 0.95,
        "is_malformed": false
      }
    ]
  }
}
```

### POST /api/data-quality/report-issue

**Purpose:** Report data quality issues for manual review
**Parameters:**
- `fragrance_id` (UUID, required): ID of fragrance with issue
- `issue_type` (string, required): Type of issue ('malformed_name', 'duplicate', 'missing_field')
- `description` (string, required): Description of the issue
- `severity` (string, optional): Issue severity ('low', 'medium', 'high', 'critical')

**Response:**
```json
{
  "success": true,
  "data": {
    "issue_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "open",
    "created_at": "2025-08-20T10:30:00Z"
  }
}
```

## Missing Product Management Endpoints

### POST /api/missing-products/log

**Purpose:** Log missing product search for demand tracking
**Parameters:**
- `search_query` (string, required): User's search query
- `user_context` (object, optional): Additional context about the search
- `extract_info` (boolean, optional): Attempt to extract brand/product info (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "extracted_brand": "Coach",
    "extracted_product": "For Me",
    "category": "fragrance",
    "priority_score": 8,
    "alternatives_available": true
  }
}
```

### GET /api/missing-products/alternatives

**Purpose:** Get alternative suggestions for missing products
**Parameters:**
- `query` (string, required): Original search query
- `limit` (integer, optional): Maximum alternatives to return (default: 5)
- `similarity_threshold` (float, optional): Minimum similarity score (default: 0.6)

**Response:**
```json
{
  "success": true,
  "data": {
    "alternatives": [
      {
        "fragrance_id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Coach Dreams",
        "similarity_score": 0.85,
        "match_reason": "Same brand, similar feminine scent profile",
        "image_url": "/images/fragrances/coach-dreams.jpg"
      },
      {
        "fragrance_id": "456e7890-e89b-12d3-a456-426614174001", 
        "name": "Coach Floral",
        "similarity_score": 0.78,
        "match_reason": "Same brand, floral composition",
        "image_url": "/images/fragrances/coach-floral.jpg"
      }
    ],
    "request_notification": {
      "available": true,
      "endpoint": "/api/missing-products/notify",
      "message": "We'll notify you if we add Coach For Me to our catalog"
    }
  }
}
```

### POST /api/missing-products/notify

**Purpose:** Request notification when product becomes available
**Parameters:**
- `search_query` (string, required): Original search query
- `email` (string, optional): Email for notification (if not logged in)
- `notification_preferences` (object, optional): Notification settings

**Response:**
```json
{
  "success": true,
  "data": {
    "notification_id": "789e0123-e89b-12d3-a456-426614174002",
    "message": "You'll be notified when Coach For Me becomes available",
    "estimated_users_waiting": 23
  }
}
```

## Enhanced Search Endpoints

### GET /api/search/smart

**Purpose:** Enhanced search with fuzzy matching and normalization
**Parameters:**
- `q` (string, required): Search query
- `include_variants` (boolean, optional): Include variant name matching (default: true)
- `fuzzy_threshold` (float, optional): Fuzzy matching threshold (default: 0.3)
- `limit` (integer, optional): Results limit (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "fragrance_id": "123e4567-e89b-12d3-a456-426614174000",
        "canonical_name": "Bleu de Chanel Eau de Parfum",
        "brand": "Chanel",
        "match_type": "variant",
        "similarity_score": 0.98,
        "matched_variant": "Bleu De EDP"
      }
    ],
    "query_normalized": "bleu de chanel edp",
    "total_found": 1,
    "search_time_ms": 45
  }
}
```

## Quality Monitoring Endpoints

### GET /api/data-quality/score

**Purpose:** Get current overall data quality score
**Response:**
```json
{
  "success": true,
  "data": {
    "overall_score": 0.87,
    "component_scores": {
      "name_formatting": 0.92,
      "completeness": 0.85,
      "duplicates": 0.88,
      "variant_mapping": 0.83
    },
    "metrics": {
      "total_products": 15420,
      "malformed_names": 234,
      "missing_fields": 456,
      "duplicate_products": 12,
      "orphaned_variants": 67
    },
    "last_check": "2025-08-20T09:15:00Z",
    "trend": "improving"
  }
}
```

### GET /api/data-quality/issues

**Purpose:** Get active quality issues requiring attention
**Parameters:**
- `severity` (string, optional): Filter by severity level
- `limit` (integer, optional): Results limit (default: 50)
- `status` (string, optional): Filter by status ('open', 'resolved', 'ignored')

**Response:**
```json
{
  "success": true,
  "data": {
    "issues": [
      {
        "issue_id": "789e0123-e89b-12d3-a456-426614174002",
        "type": "malformed_name",
        "severity": "high",
        "fragrance_id": "123e4567-e89b-12d3-a456-426614174000",
        "description": "Name contains all-caps abbreviation: 'BLEU DE EDP'",
        "suggested_fix": "Normalize to: 'Bleu de Chanel Eau de Parfum'",
        "created_at": "2025-08-20T08:30:00Z",
        "status": "open"
      }
    ],
    "summary": {
      "total_issues": 156,
      "critical": 2,
      "high": 12,
      "medium": 67,
      "low": 75
    }
  }
}
```

### POST /api/data-quality/run-checks

**Purpose:** Trigger manual quality assessment
**Parameters:**
- `check_types` (array, optional): Specific checks to run (default: all)
- `async` (boolean, optional): Run asynchronously (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "check_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "running",
    "estimated_duration_ms": 30000,
    "progress_endpoint": "/api/data-quality/checks/550e8400-e29b-41d4-a716-446655440000/progress"
  }
}
```

## Integration Endpoints

### POST /api/fragrances/batch-normalize

**Purpose:** Batch normalize existing fragrance names
**Parameters:**
- `fragrance_ids` (array, required): List of fragrance IDs to normalize
- `confidence_threshold` (float, optional): Minimum confidence for auto-apply (default: 0.9)
- `preview_mode` (boolean, optional): Preview changes without applying (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "batch_id": "batch-789e0123-e89b-12d3-a456",
    "processed": 150,
    "normalized": 89,
    "skipped": 61,
    "changes": [
      {
        "fragrance_id": "123e4567-e89b-12d3-a456-426614174000",
        "original": "Bleu De EDP",
        "normalized": "Bleu de Chanel Eau de Parfum",
        "confidence": 0.95,
        "applied": true
      }
    ]
  }
}
```

## Error Handling

All endpoints return consistent error formats:

```json
{
  "success": false,
  "error": {
    "code": "FRAGRANCE_NOT_FOUND",
    "message": "Fragrance with ID 123e4567-e89b-12d3-a456-426614174000 not found",
    "details": {
      "fragrance_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  }
}
```

**Common Error Codes:**
- `INVALID_INPUT`: Input validation failed
- `FRAGRANCE_NOT_FOUND`: Referenced fragrance doesn't exist
- `NORMALIZATION_FAILED`: Unable to normalize with sufficient confidence
- `QUALITY_CHECK_FAILED`: Quality assessment could not be completed
- `RATE_LIMIT_EXCEEDED`: API rate limit exceeded