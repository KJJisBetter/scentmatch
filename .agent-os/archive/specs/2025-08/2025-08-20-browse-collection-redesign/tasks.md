# Spec Tasks

## Tasks

- [ ] 1. Smart Sorting Algorithm Implementation
  - [ ] 1.1 Write tests for personalized vs. popularity sorting logic
  - [ ] 1.2 Create GET /api/browse/personalized endpoint
  - [ ] 1.3 Implement user collection size detection
  - [ ] 1.4 Add AI recommendation integration for personalized sorting
  - [ ] 1.5 Add fallback to popularity sorting when AI fails
  - [ ] 1.6 Verify smart sorting works in browser testing

- [ ] 2. Collection Management Actions
  - [ ] 2.1 Write tests for collection and wishlist API endpoints
  - [ ] 2.2 Create POST /api/collection endpoint (add/remove actions)
  - [ ] 2.3 Create POST /api/wishlist endpoint (add/remove actions)
  - [ ] 2.4 Create GET /api/collection/status endpoint for bulk status checks
  - [ ] 2.5 Add optimistic UI updates with error rollback
  - [ ] 2.6 Verify collection actions work in browser testing

- [ ] 3. UI Component Redesign
  - [ ] 3.1 Write tests for new FragranceCard component behavior
  - [ ] 3.2 Replace ShoppingCart icon with Plus/Bookmark icons for primary actions
  - [ ] 3.3 Add discrete "Find Samples" and "Where to Buy" secondary links
  - [ ] 3.4 Implement collection status indicators (owned/wishlisted badges)
  - [ ] 3.5 Add different UI states for authenticated vs. unauthenticated users
  - [ ] 3.6 Fix truncated name display (remove line-clamp-1, add proper wrapping)
  - [ ] 3.7 Verify new UI components work in browser testing

- [ ] 4. Brand Intelligence System
  - [ ] 4.1 Write tests for brand normalization algorithm
  - [ ] 4.2 Create POST /api/brands/normalize endpoint
  - [ ] 4.3 Implement brand hierarchy mapping (Emporio Armani → Armani family)
  - [ ] 4.4 Add brand normalization to search and display logic
  - [ ] 4.5 Ensure search works with normalized brand data
  - [ ] 4.6 Verify brand intelligence fixes truncation and confusion in browser

- [ ] 5. Affiliate Link Integration
  - [ ] 5.1 Write tests for affiliate link fetching logic
  - [ ] 5.2 Create GET /api/affiliates/links endpoint
  - [ ] 5.3 Implement affiliate link organization by type (sample/travel/full)
  - [ ] 5.4 Add discrete affiliate link display in FragranceCard component
  - [ ] 5.5 Ensure affiliate tracking parameters are preserved
  - [ ] 5.6 Verify affiliate links work properly in browser testing