# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-19-complete-database-api-integration/spec.md

## Endpoints Requiring Database Integration

### POST /api/quiz/analyze

**Purpose:** Analyze quiz responses and generate recommendations using database functions
**Current State:** Uses JSON data fallback with `WorkingRecommendationEngine`
**Target State:** Direct Supabase RPC function calls

**Database Functions to Use:**
- `analyze_quiz_personality(target_session_id: TEXT)` - Analyze user personality from responses
- `get_quiz_recommendations(target_session_id: TEXT, max_results?: number)` - Get personalized recommendations
- `transfer_guest_session_to_user(guest_session_token: TEXT, target_user_id: UUID)` - Convert guest to user session

**Parameters:** 
- `responses: QuizResponse[]` - Array of quiz answers
- `session_token?: string` - Optional session identifier

**Response:**
```typescript
{
  analysis_complete: boolean;
  recommendations: FragranceRecommendation[];
  quiz_session_token: string;
  processing_time_ms: number;
  recommendation_method: string;
}
```

**Integration Changes:**
1. Store quiz responses in `user_quiz_responses` table
2. Call `analyze_quiz_personality()` for personality analysis
3. Call `get_quiz_recommendations()` for actual recommendations
4. Remove dependency on JSON fragrance data

### GET /api/search

**Purpose:** Search fragrances using semantic AI search and database functions
**Current State:** Mixed implementation with AI classes that may have TypeScript issues
**Target State:** Fully working AI search with database backend

**Database Functions to Use:**
- `advanced_fragrance_search()` - Multi-parameter search with filters
- `match_fragrances()` - Vector similarity matching
- `get_similar_fragrances()` - Find similar fragrances by ID

**Parameters:**
- `q: string` - Search query
- `scent_families?: string[]` - Filter by scent families
- `sample_only?: boolean` - Filter for samples only
- `brands?: string[]` - Filter by specific brands
- `occasions?: string[]` - Filter by occasions
- `seasons?: string[]` - Filter by seasons

**Integration Changes:**
1. Fix TypeScript errors in AI search classes
2. Ensure proper database connection in search engines
3. Remove JSON data fallbacks completely
4. Implement proper error handling for database failures

### GET /api/search/suggestions

**Purpose:** AI-powered autocomplete with personalization
**Current State:** Has fallback to basic Supabase queries but complex AI classes may have issues
**Target State:** Fully working AI suggestions with personalization

**Integration Changes:**
1. Fix `SearchSuggestionEngine` TypeScript compatibility
2. Ensure personalization queries work with user data
3. Test trending suggestions functionality
4. Remove JSON data dependencies

### POST /api/quiz/convert-to-account

**Purpose:** Transfer guest quiz data to authenticated user account
**Current State:** Calls `transfer_guest_session_to_user` RPC function
**Target State:** Fully working with recent session token fix

**Validation Required:**
1. Confirm TEXT session token fix is working
2. Test complete data transfer flow
3. Ensure no data loss during conversion

## Error Handling Standards

### Database Connection Errors
```typescript
{
  error: "Database connection failed";
  details?: string; // Only in development
  fallback_attempted: boolean;
  timestamp: string;
}
```

### Function Call Errors
```typescript
{
  error: "Database function error";
  function_name: string;
  parameters_sent: any;
  timestamp: string;
}
```

### Type Validation Errors
```typescript
{
  error: "Invalid request parameters";
  validation_errors: string[];
  expected_format: any;
}
```