# Spec Requirements Document

> Spec: Database Population & Voyage AI Embeddings
> Created: 2025-08-15
> Status: Planning

## Overview

Import existing curated fragrance data (1,467 fragrances, 40 brands) into the ScentMatch database and generate Voyage AI embeddings for AI-powered search and recommendations. This will activate the search and browse functionality by providing real fragrance data with high-quality vector embeddings optimized for semantic similarity search.

## User Stories

### Immediate Search Functionality Story

As a user visiting `/browse`, I want to search for "fresh citrus" and see actual fragrance results with real ratings and sample availability, so that I can discover and try fragrances that match my preferences.

The system loads with 1,467 real fragrances from the curated dataset, each with structured metadata including accords, ratings, and brand information. When users search, they receive semantically relevant results powered by Voyage AI embeddings that understand fragrance relationships and similarity.

### AI-Powered Discovery Story

As a fragrance enthusiast, I want the system to understand that fragrances with "vanilla" and "sweet" accords are similar to each other, so that I can discover new fragrances based on semantic relationships rather than just keyword matching.

The system uses Voyage AI voyage-3.5 embeddings to capture semantic relationships between fragrance accords, descriptions, and metadata. Vector similarity search provides intelligent recommendations that understand fragrance families and accord combinations, enabling discovery beyond simple text matching.

### Data Quality and Performance Story

As a developer, I want the database import and embedding generation to be efficient and reliable, so that the system can scale to thousands of fragrances while maintaining sub-500ms search performance.

The system includes automated data validation, batch embedding generation with API cost optimization, and pgvector index configuration for optimal query performance. Error handling ensures data integrity during import and embedding generation processes.

## Spec Scope

1. **Database Migration Execution** - Run existing migration scripts to create production-ready schema with vector support
2. **Data Import Pipeline** - Import 1,467 fragrances and 40 brands from existing JSON files with validation
3. **Voyage AI Embedding Generation** - Generate vector embeddings using voyage-3.5 model for all fragrance records
4. **Vector Index Optimization** - Configure pgvector HNSW indexes for optimal search performance
5. **Search System Validation** - Verify search APIs return real results with proper ranking and relevance

## Out of Scope

- Data collection or scraping (use existing curated data)
- Advanced recommendation algorithms beyond vector similarity (future enhancement)
- Real-time embedding updates (batch processing sufficient for initial launch)
- User preference learning (focus on content-based similarity first)

## Expected Deliverable

1. **Populated Database** - All 1,467 fragrances and 40 brands imported with complete metadata and working search functions
2. **AI-Powered Search** - Vector similarity search returning relevant results for queries like "woody amber" or "fresh floral"
3. **Production-Ready Performance** - Search response times under 500ms with properly configured indexes and optimized queries