# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-17-enhanced-quiz-ai-recommendations/spec.md

## Technical Requirements

### Authentication Flow Fixes

- **Root Cause**: Server/client component boundary issues with auth cookie management
- **Solution**: Implement proper session waiting after signup, fix cookie handling in server components
- **Implementation**: Update auth.ts Server Actions with session refresh patterns
- **Validation**: Browser testing of complete signup → profile creation → redirect flow

### Experience-Level Adaptive UI

- **Frontend**: React component with conditional rendering based on experience level
- **State Management**: Store user experience level in quiz session context
- **Question Branching**: Dynamic question selection using existing QuizEngine branching logic
- **UI Adaptation**: Three distinct interface modes (simplified/standard/advanced)

### AI Profile Generation System

- **AI Model**: OpenAI GPT-4o-mini for cost-optimized text generation
- **Template System**: Hybrid approach with 80% template-based, 20% dynamic AI content
- **Performance Target**: Sub-500ms profile generation with 3-tier caching strategy
- **Uniqueness Algorithm**: Combinatorial name generation using adjective + noun + evocative place pattern

### Database Recommendation Engine

- **Vector Similarity**: Use existing Voyage AI embeddings with pgvector cosine similarity
- **Hybrid Scoring**: 60% embedding similarity + 20% accord overlap + 10% brand affinity + 10% sample availability
- **Performance**: Sub-200ms recommendation generation using existing get_quiz_recommendations function
- **Fallback Strategy**: Popular fragrances when personality analysis insufficient

### Real-Time Personalization

- **Favorite Fragrance Input**: Autocomplete search interface using existing fragrances table
- **Preference Learning**: Extract patterns from selected favorites using vector averaging
- **Progressive Enhancement**: Update recommendations as quiz progresses
- **Session Continuity**: Maintain state through guest-to-authenticated conversion

### Mobile-First Responsive Design

- **Touch Targets**: Minimum 48px height for all interactive elements
- **Progressive Disclosure**: Collapsible sections to prevent cognitive overload
- **Gesture Support**: Swipe navigation for question progression
- **Performance Budget**: Sub-1.5s LCP, sub-100ms interaction response

## External Dependencies

### AI Services Integration

- **OpenAI API**: GPT-4o-mini for profile description generation
- **Cost Optimization**: Template hybrid approach reduces token usage by 80%
- **Rate Limiting**: Implement circuit breaker pattern for API reliability
- **Fallback Strategy**: Pre-generated template responses for API failures

### Vector Database Optimization

- **pgvector Configuration**: Set ivfflat.probes = 10 for improved recall
- **Index Strategy**: Maintain existing IVFFlat indexes, prepare for HNSW migration at scale
- **Query Optimization**: Batch recommendation requests for performance
- **Caching Strategy**: Multi-layer caching with Redis for frequent queries
