# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-18-critical-release-fixes/spec.md

## Endpoints

### POST /api/quiz/analyze (Enhanced)

**Purpose:** Generate personalized AI insights instead of generic responses
**Parameters:**

- quiz responses (existing)
- user_preference_hash (new) - for caching
  **Response:** Enhanced with personalized insights

```json
{
  "recommendations": [
    {
      "fragrance_id": 123,
      "match_percentage": 95,
      "ai_insight": "This fresh aquatic fragrance perfectly matches your preference for clean, everyday scents with citrus notes that align with your classic style.",
      "reasoning": ["citrus_preference", "classic_style", "everyday_wear"],
      "confidence": "high"
    }
  ]
}
```

**Errors:**

- 429: Rate limit exceeded for AI generation
- 500: AI service unavailable

### GET /api/fragrances (Enhanced)

**Purpose:** Browse page endpoint with improved performance and filtering
**Parameters:**

- gender (enhanced validation)
- popularity_min (new)
- verified_only (new)
- page, limit (existing)
  **Response:** Optimized fragrance list with popularity data

```json
{
  "fragrances": [
    {
      "id": 123,
      "name": "Dior Sauvage",
      "brand": "Dior",
      "gender": "men",
      "popularity_score": 95,
      "popularity_rank": 1,
      "is_verified": true
    }
  ],
  "total_count": 2000,
  "pagination": { "page": 1, "total_pages": 100 }
}
```

**Errors:**

- 400: Invalid gender parameter
- 500: Database query timeout

### POST /api/admin/import-fragrances (New)

**Purpose:** Import fragrances from external data sources
**Parameters:**

- source_name: string ("fragrantica", "amazon")
- batch_size: number (default: 100)
- verify_data: boolean (default: true)
  **Response:** Import status

```json
{
  "import_id": "imp_123",
  "status": "processing",
  "estimated_completion": "2025-08-18T12:00:00Z",
  "fragrances_queued": 2000
}
```

**Errors:**

- 401: Unauthorized (admin only)
- 409: Import already in progress

### GET /api/admin/import-status/{import_id} (New)

**Purpose:** Check import progress for database rebuild
**Response:** Current status

```json
{
  "import_id": "imp_123",
  "status": "completed",
  "progress": 100,
  "fragrances_imported": 1847,
  "errors_count": 153,
  "completion_time": "2025-08-18T12:45:00Z"
}
```

## Controllers

### QuizController (Enhanced)

- **generateInsights()** - New method for personalized AI insight generation
- **cacheInsights()** - Cache management for AI-generated content
- **validateGenderFiltering()** - Ensure proper gender-based filtering

### FragranceController (Enhanced)

- **getBrowseCatalog()** - Optimized browse page data loading
- **getPopularFragrances()** - New method for popularity-based recommendations
- **validateFragranceData()** - Data quality validation for imports

### ImportController (New)

- **initiateImport()** - Start fragrance data import from external sources
- **getImportStatus()** - Monitor import progress
- **validateImportData()** - Quality assurance for imported data
