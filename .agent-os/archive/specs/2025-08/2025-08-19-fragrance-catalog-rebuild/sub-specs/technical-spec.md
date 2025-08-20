# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-19-fragrance-catalog-rebuild/spec.md

## Technical Requirements

### Data Import Process
- Drop existing `fragrances` and `fragrance_brands` tables (no backup - current data is incomplete)
- Recreate tables optimized for `fragrances-final-2025.json` structure (2,017 records)
- Import brands first from `brands-final-2025.json` (76 brands including missing Ralph Lauren, Hugo Boss)
- Import fragrances with proper foreign key relationships to brands
- Maintain popularity score ordering (16.37 → 0.x descending) for browse/search

### Schema Optimization
- Optimize `fragrances` table for popularity-based queries (score DESC indexing)
- Add search performance indexes for brand name + fragrance name queries
- Ensure sample availability and pricing fields support the new dataset structure
- Add proper constraints for data integrity (rating ranges, score validation)

### API Compatibility
- Ensure existing search API endpoints continue working with new data structure
- Verify `/api/search` returns results in popularity order instead of alphabetical
- Confirm fragrance detail pages work with new fragrance IDs
- Test that quiz recommendation system works with expanded fragrance catalog

### Import Script Requirements
- Handle fragrance name cleaning (remove "for women/men" suffixes properly)
- Map gender values correctly ("for men" → "men", "for women" → "women", "for women and men" → "unisex")
- Calculate sample prices based on brand tier and popularity score
- Generate proper slugs and ensure unique constraints
- Batch import for performance (100 records at a time)

### Auto-Embedding Pipeline Integration
- **GOOD NEWS:** Auto-embedding pipeline already exists via `trigger_embedding_generation()` trigger
- Pipeline automatically generates embeddings when fragrances are inserted (priority 3 for new)
- Uses HTTP webhooks to Voyage AI service for embedding generation
- **Action Required:** Ensure trigger is active and will process 2,017 new fragrances automatically
- **Cost Estimate:** ~2,017 * $0.00005 = ~$0.10 for complete embedding generation

### Search Performance Enhancement  
- Replace basic name search with popularity-weighted search
- Ensure Tom Ford search returns 45 results instead of 10
- Implement proper brand name search that finds all brand fragrances
- Add full-text search capabilities for fragrance descriptions and accords
- **Auto-embeddings will enable:** Vector similarity search for "fragrances like this" features