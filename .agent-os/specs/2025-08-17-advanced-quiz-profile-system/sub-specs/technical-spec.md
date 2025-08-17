# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-17-advanced-quiz-profile-system/spec.md

## Technical Requirements

### Multi-Dimensional Quiz Architecture

- Replace current single-choice personality classification with multi-selection trait system
- Implement "Progressive Personality Mapping" approach: hook → narrow → refine → convert
- Support 2-3 trait combinations per user (e.g., casual+sophisticated+confident)
- Generate structured 256-dimension profile vectors (not embeddings) for cost efficiency
- Maintain sub-2.5 second quiz completion flow with real-time profile building

### Enhanced Profile Data Model

- Create `user_profile_vectors` table with structured vector storage (256 dimensions)
- Implement personality trait weighting system (primary 50%, secondary 30%, tertiary 20%)
- Store trait combinations as structured JSON with confidence scores
- Support profile evolution over time with behavioral signal integration
- Maintain backward compatibility with existing MVPPersonalityEngine fallbacks

### AI Integration Optimization

- Implement dual-vector architecture: structured profiles + full fragrance embeddings
- Use template-based description generation with 20% dynamic content for 75% token savings
- Create three-tier caching system: profile combinations, descriptions, search results
- Integrate profile-aware AI descriptions that adjust based on user trait combinations
- Implement cost control mechanisms with daily token budgets and fallback systems

### Database Schema Extensions

- Add user_profile_vectors table with pgvector support for similarity searches
- Extend fragrances table with metadata_vector column for hybrid matching
- Create HNSW indexes optimized for production workload (m=16, ef_construction=64)
- Implement profile-to-fragrance matching functions with weighted trait amplification
- Add behavioral feedback collection for continuous profile refinement

### Performance and Cost Targets

- Quiz completion flow: <2.5 seconds end-to-end
- Profile vector generation: <5ms (no API calls required)
- Recommendation retrieval: <100ms with caching, <500ms cold start
- Token budget: <$10/month for AI operations with proper caching
- Storage efficiency: 1KB per user profile vs 6KB for full embeddings

## External Dependencies

**OpenAI GPT-4 Integration**

- Required for template-based description generation with dynamic personalization
- Cost optimization through structured prompts and response caching
- Fallback to static templates when API unavailable

**pgvector Extension Enhancement**

- Advanced HNSW indexing for production-scale similarity searches
- Hybrid vector architecture combining structured and semantic embeddings
- Query optimization for weighted multi-trait matching algorithms
