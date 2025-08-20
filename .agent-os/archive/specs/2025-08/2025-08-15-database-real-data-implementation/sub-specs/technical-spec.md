# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-15-database-real-data-implementation/spec.md

## Technical Requirements

### Database Schema Requirements
- PostgreSQL 17+ with pgvector extension for AI features
- User profiles table with RLS policies for data isolation
- Fragrance brands table with search indexes and popularity tracking
- Fragrances table with vector columns, full-text search, and complete metadata
- User collections table with relationships and rating system
- Performance indexes for sub-200ms query response times

### Data Import Requirements  
- JSON parser for `/data/fragrances.json` (37,197 records)
- Data validation and transformation pipeline
- Batch import processing for large dataset
- Error handling and rollback capabilities
- Preserve all original metadata: brand names, ratings, URLs, notes, perfumers

### Technology Stability Requirements
- Research and document stable versions for all dependencies
- Fix PostCSS v4 incompatibility (downgrade to v3.4.0)
- Verify Next.js 15, React 19, TailwindCSS compatibility matrix
- Document version decisions for future reference

### Testing Requirements (QA-Driven)
- QA tester designs all test specifications and coverage requirements
- Backend engineer implements database tests per QA specifications
- Data engineer implements data import tests per QA specifications  
- Frontend engineer implements UI tests per QA specifications
- All agents implement tests only, never create test specifications

### Build & Performance Requirements
- Clean build process without warnings or errors
- Database queries under 200ms for search operations
- Successful import of 37,000+ records within reasonable time
- Memory efficient processing for large JSON file
- Production-ready error handling and logging