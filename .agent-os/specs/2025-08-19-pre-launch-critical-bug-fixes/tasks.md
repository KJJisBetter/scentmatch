# Spec Tasks

## Tasks

- [ ] 1. Fix Search API "Unknown Brand" Issue Investigation and Validation
  - [ ] 1.1 Write tests for search API with "dior" query to verify proper brand name mapping
  - [ ] 1.2 Investigate current search API implementation and verify 2025-08-19 fix is still active
  - [ ] 1.3 Test search endpoints with curl/browser to reproduce or confirm fix
  - [ ] 1.4 Add cache busting if users still seeing cached "unknown brand" responses
  - [ ] 1.5 Check database for fragrances with genuinely missing brand_id values
  - [ ] 1.6 Verify all tests pass and search returns proper brand names

- [ ] 2. Fix Quiz Recommendation Algorithm Alphabetical Bias
  - [ ] 2.1 Write tests for quiz recommendation scoring with different preference combinations
  - [ ] 2.2 Analyze current algorithm in lib/quiz/working-recommendation-engine.ts for tie-breaking issues
  - [ ] 2.3 Implement randomization for equal scores to prevent alphabetical bias
  - [ ] 2.4 Add diversity scoring to prevent multiple fragrances from same brand
  - [ ] 2.5 Increase score differentiation by incorporating additional preference factors
  - [ ] 2.6 Test that different quiz preferences produce meaningfully different results
  - [ ] 2.7 Verify all tests pass and recommendations show proper variety

- [ ] 3. Fix Quiz Data Transfer "Failed to Transfer" Error
  - [ ] 3.1 Write tests for quiz data transfer flow from guest session to user account
  - [ ] 3.2 Create database migration to fix session_token data type from UUID to TEXT
  - [ ] 3.3 Update transfer_guest_session_to_user RPC function to accept TEXT parameter
  - [ ] 3.4 Apply migration to development database and test conversion flow
  - [ ] 3.5 Test complete user journey: guest quiz → account creation → data access
  - [ ] 3.6 Verify all tests pass and account creation works properly

- [ ] 4. Integration Testing and Production Readiness
  - [ ] 4.1 Write end-to-end tests for all three critical user flows
  - [ ] 4.2 Add monitoring and logging for error tracking in production
  - [ ] 4.3 Test all fixes work together without conflicts or regressions
  - [ ] 4.4 Verify professional error handling for any remaining edge cases
  - [ ] 4.5 Confirm fixes work with existing user sessions and cached data
  - [ ] 4.6 Verify all tests pass for production deployment readiness
