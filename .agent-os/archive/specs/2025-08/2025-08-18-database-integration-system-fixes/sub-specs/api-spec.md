# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-18-database-integration-system-fixes/spec.md

## API Endpoint Updates

### Quiz Recommendation Endpoints

#### POST /api/quiz/analyze

**Purpose:** Process quiz results and generate personalized recommendations using new database structure
**Current Issues:** May not be using new user_preferences table or fragrance_embeddings for similarity
**Required Updates:**

- Update to store results in `user_preferences` table
- Use `get_similar_fragrances` database function for recommendations
- Fix gender filtering logic to prevent cross-gender recommendations
  **Parameters:** Quiz answers, user preferences, demographic info
  **Response:** Personality analysis + fragrance recommendations with proper gender filtering
  **Errors:** Handle database connection failures, invalid quiz data, recommendation generation failures

#### GET /api/recommendations

**Purpose:** Get personalized recommendations based on stored user preferences
**Updates Needed:**

- Query `user_preferences` table for personalization
- Use vector similarity with `fragrance_embeddings` table
- Integrate with new database functions for enhanced recommendations
  **Parameters:** user_id (optional for guest users), limit, categories
  **Response:** Array of recommended fragrances with similarity scores
  **Errors:** Handle missing preferences, database query failures

### Fragrance Data Endpoints

#### GET /api/fragrances

**Purpose:** Get paginated fragrance list for browse page
**Current Issues:** Likely causing timeout due to inefficient queries or missing indexes
**Required Fixes:**

- Optimize database queries with proper LIMIT/OFFSET
- Use database indexes for filtering operations
- Implement proper error handling for large result sets
  **Parameters:** page, limit, filters (brand, family, price range, gender)
  **Response:** Paginated fragrance list with metadata
  **Errors:** Handle timeout issues, invalid filter parameters

#### GET /api/fragrances/[id]

**Purpose:** Get individual fragrance details with enhanced metadata
**Updates Needed:**

- Include data from enhanced fragrances table schema
- Add vector similarity recommendations using fragrance_embeddings
- Integrate user interaction tracking
  **Parameters:** fragrance ID
  **Response:** Complete fragrance details with similar fragrances
  **Errors:** Handle missing fragrances, database query failures

#### GET /api/fragrances/[id]/similar

**Purpose:** Get similar fragrances using vector embeddings
**Implementation:** Use `get_similar_fragrances` database function with new fragrance_embeddings table
**Parameters:** fragrance ID, limit (default 5)
**Response:** Array of similar fragrances with similarity scores
**Errors:** Handle missing embeddings, vector search failures

### User Collection Endpoints

#### GET /api/collections

**Purpose:** Get user's fragrance collections with enhanced metadata
**Updates Needed:**

- Query enhanced `user_collections` table with new metadata columns
- Use `get_collection_insights` database function for analytics
  **Parameters:** user_id
  **Response:** User collections with insights and analytics
  **Errors:** Handle authentication failures, missing collections

#### POST /api/collections/interactions

**Purpose:** Track user interactions for recommendation improvement
**Implementation:** Use `track_fragrance_interaction` database function
**Parameters:** user_id, fragrance_id, interaction_type (view, like, dislike, purchase)
**Response:** Success confirmation
**Errors:** Handle invalid interaction types, database write failures

### Browse Page Data Endpoints

#### GET /api/browse/filters

**Purpose:** Get available filter options with counts
**Optimization Needed:**

- Use aggregate queries with proper indexing
- Cache filter counts for performance
  **Parameters:** None
  **Response:** Available brands, families, price ranges with counts
  **Errors:** Handle database timeout, cache failures

## Integration Requirements

### Database Connection Updates

- Update all endpoints to use new database schema
- Implement proper connection pooling and timeout handling
- Add retry logic for database connection failures

### Query Optimization

- Use prepared statements for frequently executed queries
- Implement proper indexing strategy for all filtered queries
- Add query performance monitoring and logging

### Error Handling

- Standardize error responses across all endpoints
- Implement graceful degradation for database failures
- Add proper logging for debugging integration issues

### Performance Monitoring

- Add response time tracking for all endpoints
- Implement database query performance monitoring
- Set up alerts for timeout or failure thresholds

## Testing Requirements

### Integration Testing

- Test all endpoints with actual database connections
- Verify proper data retrieval with new schema
- Test error scenarios and fallback behavior

### Performance Testing

- Load testing for browse page endpoints
- Stress testing for recommendation generation
- Database query performance validation

### End-to-End Testing

- Complete user journey testing (quiz → recommendations → browse)
- Cross-browser compatibility for API interactions
- Mobile API performance validation
