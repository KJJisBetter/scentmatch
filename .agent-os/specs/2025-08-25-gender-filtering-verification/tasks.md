# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-25-gender-filtering-verification/spec.md

> Created: 2025-08-25
> Status: Ready for Implementation

## Tasks

### 1. Database Query Audit
- [ ] Review all Supabase queries in lib/supabase/ for proper gender filtering
- [ ] Audit lib/ai-sdk/unified-recommendation-engine.ts for gender constraints
- [ ] Check fragrance search functions for gender parameter usage
- [ ] Verify browse/discovery queries filter by gender

### 2. API Endpoint Verification
- [ ] Test /api/quiz/ endpoints with gender filtering
- [ ] Verify /api/search/ respects gender parameters
- [ ] Check any browse/discovery API endpoints
- [ ] Test error handling for missing gender parameters

### 3. UI Component Testing
- [ ] Verify quiz components pass gender correctly
- [ ] Test search components with gender filtering
- [ ] Check browse components respect gender selection
- [ ] Validate form validation for gender inputs

### 4. Comprehensive Test Suite
- [ ] Write unit tests for database query functions
- [ ] Create integration tests for API endpoints
- [ ] Implement browser tests for complete user flows
- [ ] Add edge case testing for error scenarios

### 5. End-to-End Validation
- [ ] Browser test: Complete quiz flow (women see only women's fragrances)
- [ ] Browser test: Search results filtered by gender
- [ ] Browser test: Browse page gender filtering
- [ ] Verify no cross-gender recommendations in any flow

### 6. Documentation and Cleanup
- [ ] Document findings and fixes applied
- [ ] Update relevant code comments
- [ ] Ensure test coverage metrics meet standards
- [ ] Validate fix prevents regression