# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-20-pre-launch-audit-refinement/spec.md

## API Changes for Browse Pagination

### Enhanced Browse Endpoint

#### GET /api/browse

**Purpose:** Retrieve paginated fragrance list with filtering support
**Parameters:**
- `page` (number, optional): Page number, defaults to 1
- `limit` (number, optional): Items per page, defaults to 20, max 100
- `search` (string, optional): Search term for fragrance names
- `brand` (uuid, optional): Filter by brand ID
- `sort` (string, optional): Sort order ('name', 'brand', 'newest'), defaults to 'newest'

**Response:**
```typescript
{
  data: {
    fragrances: Fragrance[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number,
      hasNext: boolean,
      hasPrev: boolean
    }
  }
}
```

**Errors:**
- `400 Bad Request`: Invalid pagination parameters
- `500 Internal Server Error`: Database query failure

### Route Validation Endpoints

#### GET /api/validate-routes

**Purpose:** Internal endpoint to validate all application routes
**Parameters:** None
**Response:**
```typescript
{
  data: {
    valid_routes: string[],
    broken_routes: string[],
    redirect_needed: { from: string, to: string }[]
  }
}
```

## Enhanced Error Handling

### Custom 404 API Response

**Standardized 404 Response:**
```typescript
{
  error: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    suggestions: string[]
  }
}
```

### Quiz API Bug Fixes

#### Enhanced POST /api/quiz/convert-to-account

**Error Handling Improvements:**
- Validate session token format before database operations
- Provide detailed error messages for debugging
- Implement retry logic for temporary failures

**Enhanced Response:**
```typescript
{
  data: {
    transfer_successful: boolean,
    user_id: string,
    preserved_data: {
      quiz_responses: number,
      recommendations: number
    }
  },
  error?: {
    code: string,
    message: string,
    debug_info?: object
  }
}
```

## Route Structure Validation

### Dynamic Route Verification

**Fragrance Detail Routes:**
- `/browse/[id]` - Validate fragrance ID exists
- `/brand/[slug]` - Validate brand slug exists  
- `/collection/[id]` - Validate user collection access

**Fallback Handling:**
- Implement proper 404 pages for all dynamic routes
- Add redirect logic for changed URL structures
- Ensure all internal links use valid routes

## Performance Optimizations

### Pagination Response Optimization

**Response Size Management:**
- Limit response payload size with proper field selection
- Implement response compression for large datasets
- Use efficient JSON serialization

**Caching Headers:**
- Set appropriate cache headers for browse endpoint
- Implement ETags for browse result caching
- Configure CDN caching for static route validation