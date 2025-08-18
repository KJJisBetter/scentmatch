# Spec Tasks

## Tasks

- [ ] 1. Fix Gender Filtering System
  - [ ] 1.1 Write tests for gender filtering logic
  - [ ] 1.2 Audit working-recommendation-engine.ts for gender filtering bugs
  - [ ] 1.3 Fix gender filtering to prevent cross-gender recommendations
  - [ ] 1.4 Test quiz flow with men's selection returns only men's/unisex fragrances
  - [ ] 1.5 Verify all tests pass

- [ ] 2. Debug and Fix Browse Page Loading Issues
  - [ ] 2.1 Write tests for browse page functionality
  - [ ] 2.2 Debug timeout issues in /app/browse/page.tsx
  - [ ] 2.3 Optimize database queries causing performance issues
  - [ ] 2.4 Implement proper error boundaries and loading states
  - [ ] 2.5 Verify browse page loads within 5 seconds
  - [ ] 2.6 Verify all tests pass

- [ ] 3. Enhance AI Insights Generation
  - [ ] 3.1 Write tests for personalized AI insight generation
  - [ ] 3.2 Replace generic AI insight templates with dynamic generation
  - [ ] 3.3 Implement caching system for AI-generated insights
  - [ ] 3.4 Generate unique explanations based on user preferences and fragrance notes
  - [ ] 3.5 Verify insights are personalized and not generic
  - [ ] 3.6 Verify all tests pass

- [ ] 4. Database Schema Enhancements
  - [ ] 4.1 Write tests for new database schema changes
  - [ ] 4.2 Create and apply database migration scripts
  - [ ] 4.3 Add popularity scoring and better gender classification
  - [ ] 4.4 Create AI insights caching table
  - [ ] 4.5 Verify all database changes applied successfully
  - [ ] 4.6 Verify all tests pass

- [ ] 5. Database Rebuild with Top 2000 Fragrances
  - [ ] 5.1 Write tests for fragrance import functionality
  - [ ] 5.2 Implement Fragrantica data scraping integration
  - [ ] 5.3 Create data validation and quality assurance pipeline
  - [ ] 5.4 Import and validate 2000+ popular fragrances
  - [ ] 5.5 Verify database contains properly categorized fragrances
  - [ ] 5.6 Verify all tests pass

- [ ] 6. End-to-End Quality Assurance
  - [ ] 6.1 Write comprehensive Playwright tests for critical user flows
  - [ ] 6.2 Test complete quiz → recommendations → browse user journey
  - [ ] 6.3 Validate gender filtering works correctly across all flows
  - [ ] 6.4 Verify AI insights are personalized and accurate
  - [ ] 6.5 Performance testing for page load times under 5 seconds
  - [ ] 6.6 Verify all tests pass
