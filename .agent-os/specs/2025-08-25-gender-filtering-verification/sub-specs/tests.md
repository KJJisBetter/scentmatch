# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-25-gender-filtering-verification/spec.md

> Created: 2025-08-25
> Version: 1.0.0

## Test Coverage

### Unit Tests
- Database query functions properly filter by gender
- Quiz recommendation engine respects gender constraints
- Search functions filter results by gender
- Utility functions handle gender validation correctly

### Integration Tests
- Quiz flow end-to-end with gender filtering
- Search API returns only gender-appropriate results
- Browse/discovery flows respect gender constraints
- Error handling for invalid gender inputs

### Browser Tests (Playwright)
- Complete quiz flow verification (women only see women's fragrances)
- Search results filtering by gender
- Browse page gender filtering
- Error states and edge cases

### Database Tests
- Verify gender column constraints
- Test data integrity for fragrance gender classification
- RLS policies respect gender filtering

## Mocking Requirements

- Mock fragrance database with known gender classifications
- Mock user sessions with specific gender selections
- Mock API responses for consistent testing
- Test data fixtures with mixed gender fragrances for validation