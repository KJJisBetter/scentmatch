# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-18-ai-enhancement-system/spec.md

## Multi-Provider AI Architecture

### Vendor-Agnostic Provider Pattern
- **Primary Provider**: Voyage AI (voyage-3-large for embeddings, #1 2025 retrieval performance, 2048 dimensions)
- **Secondary Provider**: Voyage AI (voyage-3.5 for rate limiting fallback, 1024 dimensions)
- **Tertiary Provider**: OpenAI (text-embedding-3-large for emergency fallback, GPT-4o-mini for text generation)
- **Provider Interface**: Abstract AI client supporting multiple backends with automatic failover
- **Quality Priority**: Best-in-class embeddings for core recommendation engine
- **Rate Limiting**: Per-provider rate limiting with intelligent queue management

### Provider Configuration
- **Environment-based**: Different providers per environment (dev/staging/prod)
- **Feature Flags**: Runtime provider switching without deployment
- **Health Monitoring**: Provider health checks with automatic failover
- **Cost Tracking**: Per-provider usage and cost monitoring

## Automated Embedding Pipeline

### Database Trigger System
- **PostgreSQL Triggers**: ON INSERT/UPDATE for `fragrances` table
- **Edge Function Invocation**: Trigger calls Supabase Edge Function for async processing
- **Embedding Generation**: Combine fragrance name, brand, description, notes for embedding text
- **Vector Storage**: Store embeddings in `embedding` column (VECTOR type with 2048 dimensions)
- **Error Handling**: Failed embedding generation retry mechanism with exponential backoff

### Edge Function Architecture
- **Embedding Generation Function**: Process fragrance data using voyage-3-large (2048 dimensions)
- **Batch Processing Function**: Handle bulk embedding regeneration for database cleanup
- **Provider Management**: Cascade from voyage-3-large → voyage-3.5 → OpenAI based on availability
- **Queue Management**: Process embedding requests with priority queuing and model selection

## Intelligent Recommendation Engine

### Hybrid Recommendation Algorithm
- **Vector Similarity (60%)**: Cosine similarity using user preference embedding vs fragrance embeddings
- **Collaborative Filtering (20%)**: Users with similar taste preferences
- **Content-Based Filtering (15%)**: Scent family, brand, price range matching
- **Contextual Factors (5%)**: Season, occasion, time of day, weather

### User Preference Model
- **Dynamic User Embedding**: Weighted average of user's rated fragrances (rating * usage frequency)
- **Preference Decay**: Time-based decay for older interactions (95% retention per week)
- **Preference Clustering**: Identify user preference archetypes for cold start recommendations
- **Real-time Updates**: User embedding updates on each significant interaction

### Recommendation Types
- **Personalized**: Based on user's collection and preference model
- **Trending**: Popular fragrances weighted by user's taste profile
- **Seasonal**: Weather and season-appropriate recommendations
- **Adventurous**: Recommendations outside user's comfort zone with adjustable exploration level

## Natural Language Processing

### Query Understanding
- **Intent Classification**: Categorize queries (scent description, occasion, mood, comparison)
- **Entity Extraction**: Identify brands, scent families, occasions, seasons from natural language
- **Contextual Embedding**: Generate query embeddings optimized for fragrance search
- **Query Expansion**: Enhance queries with synonyms and related fragrance terminology

### Search Implementation
- **Semantic Search**: Vector similarity search using query embeddings
- **Hybrid Search**: Combine semantic search with traditional keyword matching
- **Filter Integration**: Apply user filters (price, brand, availability) to semantic results
- **Result Ranking**: Machine learning ranking model considering relevance and personalization

## Collection Intelligence System

### Collection Analysis Engine
- **Scent Family Distribution**: Analyze user's collection for scent family preferences
- **Seasonal Analysis**: Identify gaps in seasonal fragrance coverage
- **Occasion Mapping**: Map collection to different use cases and occasions
- **Brand Affinity**: Calculate brand preferences and suggest similar brands
- **Collection Optimization**: Identify redundancies and recommend diverse additions

### Insights Generation
- **Personality Profile**: Generate fragrance personality based on collection patterns
- **Collection Gaps**: Identify missing scent families or occasions
- **Seasonal Recommendations**: Suggest fragrances for under-represented seasons
- **Collection Growth**: Recommend next purchases based on collection evolution

## Real-time Personalization

### Interaction Tracking
- **Implicit Feedback**: Track views, time spent, search patterns, browse behavior
- **Explicit Feedback**: Ratings, favorites, wishlist additions, purchase intentions
- **Preference Learning**: Update user models based on interaction patterns
- **A/B Testing**: Test recommendation algorithms and track conversion metrics

### Personalization Features
- **Dynamic Homepage**: Personalized fragrance recommendations and collections
- **Smart Filters**: Auto-suggest relevant filters based on user preferences
- **Contextual Recommendations**: Time, weather, and occasion-aware suggestions
- **Recommendation Explanations**: AI-generated explanations for each recommendation

## Performance & Scalability

### Embedding Storage & Retrieval
- **Vector Indexing**: Optimized pgvector indexes for fast similarity search
- **Embedding Dimensions**: 2048 dimensions (voyage-3-large) with fallback to 1024 (voyage-3.5)
- **Batch Operations**: Efficient batch similarity searches for recommendation generation
- **Caching Strategy**: Redis caching for frequently accessed embeddings and recommendations

### Real-time Requirements
- **Search Response Time**: <200ms for semantic search results
- **Recommendation Generation**: <500ms for personalized recommendations
- **Embedding Generation**: <30 seconds for new fragrance embeddings
- **User Model Updates**: Real-time preference updates within 5 seconds

## Security & Privacy

### Data Protection
- **Embedding Anonymization**: User embeddings don't contain identifiable information
- **Preference Privacy**: User preferences stored as abstract vector representations
- **AI Provider Security**: Encrypted API communications and secure credential management
- **Row Level Security**: Supabase RLS for user-specific AI data and recommendations

### Compliance
- **Data Minimization**: Only store necessary data for AI functionality
- **User Control**: Allow users to opt-out of AI features and delete preference data
- **Transparency**: Clear explanations of how AI recommendations are generated
- **Audit Logging**: Track AI decisions and user interactions for accountability

## External Dependencies (Conditional)

### AI Provider SDKs
- **Voyage AI SDK** - Direct API integration for embedding generation
  - **Justification**: Superior performance for retrieval tasks, 50% cost savings vs OpenAI
- **OpenAI SDK** - Fallback embedding provider and text generation
  - **Justification**: Proven reliability and established ecosystem integration
- **Vercel AI SDK** - Unified interface for multiple AI providers
  - **Justification**: Vendor-agnostic abstraction layer with streaming support

### Additional Libraries
- **@supabase/postgrest-js** - Enhanced PostgreSQL operations for vector queries
  - **Justification**: Advanced pgvector operations and batch processing
- **ml-matrix** - Matrix operations for vector similarity calculations
  - **Justification**: Client-side vector operations and embedding manipulations
- **date-fns** - Date operations for temporal preference decay calculations
  - **Justification**: Precise temporal calculations for preference modeling