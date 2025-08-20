# Spec Tasks

## Tasks

- [ ] 1. Data Directory Cleanup and Preparation
  - [ ] 1.1 Archive old confusing data files (COMPLETED)
  - [ ] 1.2 Validate fragrances-final-2025.json structure and completeness
  - [ ] 1.3 Validate brands-final-2025.json structure and completeness
  - [ ] 1.4 Create import validation tests
  - [ ] 1.5 Verify data quality and consistency
  - [ ] 1.6 Confirm all import tests pass

- [ ] 2. Database Schema Rebuild
  - [ ] 2.1 Write tests for new schema structure
  - [ ] 2.2 Drop existing fragrances and fragrance_brands tables (no backup)
  - [ ] 2.3 Create optimized fragrance_brands table with proper indexing
  - [ ] 2.4 Create optimized fragrances table with popularity scoring
  - [ ] 2.5 Add performance indexes for popularity-based queries
  - [ ] 2.6 Verify all schema tests pass

- [ ] 3. Data Import Implementation
  - [ ] 3.1 Write tests for import process
  - [ ] 3.2 Create brand import script for brands-final-2025.json (76 brands)
  - [ ] 3.3 Create fragrance import script for fragrances-final-2025.json (2,017 records)
  - [ ] 3.4 Implement data cleaning and validation during import
  - [ ] 3.5 Execute complete import process
  - [ ] 3.6 Verify all import tests pass

- [ ] 4. API Integration Verification
  - [ ] 4.1 Write tests for API compatibility with new dataset
  - [ ] 4.2 Test search API returns results in popularity order
  - [ ] 4.3 Verify brand searches return complete collections (Dior=45, Tom Ford=45)
  - [ ] 4.4 Test fragrance detail pages work with new fragrance IDs
  - [ ] 4.5 Confirm quiz recommendation system works with expanded catalog
  - [ ] 4.6 Verify all API integration tests pass

- [ ] 5. Auto-Embedding Pipeline Integration  
  - [ ] 5.1 Write tests for auto-embedding trigger with new dataset
  - [ ] 5.2 Verify trigger_embedding_generation() function is active
  - [ ] 5.3 Clear existing fragrance_embeddings table (IDs will be invalid)
  - [ ] 5.4 Monitor auto-embedding pipeline during fragrance import (2,017 records)
  - [ ] 5.5 Verify embedding queue processes all new fragrances automatically
  - [ ] 5.6 Test vector similarity search works with new embeddings

- [ ] 6. User Experience Validation
  - [ ] 6.1 Write tests for user-facing improvements
  - [ ] 6.2 Test that popular fragrances appear first in browse page
  - [ ] 6.3 Verify search for major brands returns complete results
  - [ ] 6.4 Test that sample availability and pricing work correctly
  - [ ] 6.5 Confirm recommendation quality improves with larger dataset
  - [ ] 6.6 Verify all user experience tests pass