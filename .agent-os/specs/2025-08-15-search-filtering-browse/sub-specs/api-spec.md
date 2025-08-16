# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-15-search-filtering-browse/spec.md

## Endpoints

### POST /api/search/fragrances

**Purpose:** Execute AI-powered fragrance search with natural language processing and vector similarity
**Parameters:** 
- `query` (string): Natural language search query
- `filters` (object): Filter criteria including notes, brands, price range, concentration
- `limit` (number): Maximum results to return (default: 20)
- `offset` (number): Pagination offset (default: 0)
- `userId` (string, optional): User ID for personalized results

**Response:** 
```json
{
  "fragrances": [
    {
      "id": "string",
      "name": "string", 
      "brand": "string",
      "notes": ["string"],
      "similarity_score": "number",
      "price_range": "string",
      "sample_available": "boolean",
      "image_url": "string",
      "description": "string"
    }
  ],
  "total_count": "number",
  "search_metadata": {
    "query_processed": "string",
    "vector_search_used": "boolean",
    "personalization_applied": "boolean"
  }
}
```
**Errors:** 400 (invalid query), 429 (rate limit), 500 (search service error)

### GET /api/search/suggestions

**Purpose:** Provide autocomplete suggestions for search queries
**Parameters:**
- `q` (string): Partial search query
- `type` (enum): "brands", "notes", "fragrances", "all" (default: "all")
- `limit` (number): Maximum suggestions (default: 5)

**Response:**
```json
{
  "suggestions": [
    {
      "text": "string",
      "type": "brand|note|fragrance",
      "count": "number"
    }
  ]
}
```
**Errors:** 400 (invalid parameters), 500 (service error)

### GET /api/filters/options

**Purpose:** Retrieve available filter options and their counts
**Parameters:**
- `category` (enum, optional): "brands", "notes", "families", "concentrations", "price_ranges"

**Response:**
```json
{
  "brands": [
    {"name": "string", "count": "number"}
  ],
  "notes": [
    {"name": "string", "category": "top|middle|base", "count": "number"}
  ],
  "families": [
    {"name": "string", "description": "string", "count": "number"}
  ],
  "concentrations": [
    {"name": "string", "abbreviation": "string", "count": "number"}
  ],
  "price_ranges": [
    {"min": "number", "max": "number", "label": "string", "count": "number"}
  ]
}
```
**Errors:** 500 (service error)

## Controllers

### SearchController
**Action:** processFragranceSearch
**Business Logic:** 
- Parse natural language query using OpenAI API
- Extract search intent (notes, mood, occasion, brand)
- Execute vector similarity search using pgvector
- Apply filters and sorting logic
- Merge personalization signals if user authenticated

**Action:** generateSuggestions  
**Business Logic:**
- Query database for matching brands, notes, and fragrance names
- Rank suggestions by popularity and relevance
- Return formatted suggestions with metadata

### FiltersController
**Action:** getFilterOptions
**Business Logic:**
- Aggregate available filter values from fragrance database
- Calculate counts for each filter option
- Cache results for performance
- Return structured filter options for UI rendering

**Error Handling:**
- Input validation with detailed error messages
- Rate limiting protection for search endpoints
- Graceful fallback when AI services unavailable
- Database query optimization with proper indexing