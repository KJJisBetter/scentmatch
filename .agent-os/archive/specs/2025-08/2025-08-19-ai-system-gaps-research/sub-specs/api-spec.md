# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-19-ai-system-gaps-research/spec.md

## Endpoints

### GET /api/ai/system/analysis

**Purpose:** Retrieve comprehensive analysis of current AI system capabilities and gaps
**Parameters:** None
**Response:** JSON object with system analysis results
**Errors:** 500 - Analysis generation failed

```typescript
interface SystemAnalysisResponse {
  current_capabilities: {
    vector_search: CapabilityStatus;
    recommendations: CapabilityStatus;
    personalization: CapabilityStatus;
    real_time_processing: CapabilityStatus;
  };
  identified_gaps: Gap[];
  performance_metrics: PerformanceMetrics;
  recommendations: Enhancement[];
}
```

### GET /api/ai/recommendations/enhanced

**Purpose:** Get enhanced recommendations using multi-armed bandit optimization
**Parameters:** 
- user_id: string
- context: object (optional) - time_of_day, session_context, etc.
- strategy: string (optional) - 'adaptive', 'exploration', 'exploitation'
**Response:** Enhanced recommendation list with algorithm attribution
**Errors:** 400 - Invalid parameters, 404 - User not found

```typescript
interface EnhancedRecommendationsResponse {
  recommendations: EnhancedRecommendation[];
  algorithm_used: string;
  confidence_score: number;
  exploration_factor: number;
  metadata: {
    response_time_ms: number;
    cache_hit: boolean;
    algorithm_selection_reason: string;
  };
}
```

### POST /api/ai/interactions/track

**Purpose:** Track user interactions for real-time preference learning
**Parameters:** Interaction event data in request body
**Response:** Processing acknowledgment
**Errors:** 400 - Invalid event data, 422 - Processing failed

```typescript
interface InteractionTrackingRequest {
  user_id: string;
  event_type: 'view' | 'click' | 'purchase' | 'rating' | 'wishlist';
  fragrance_id: string;
  context: {
    timestamp: string;
    session_id: string;
    source: string;
    duration_ms?: number;
    rating_value?: number;
  };
}
```

### GET /api/ai/embeddings/multi-resolution

**Purpose:** Generate or retrieve multi-resolution embeddings for fragrances
**Parameters:**
- fragrance_id: string
- resolution: '128' | '512' | '2048' | 'all'
**Response:** Embedding vectors at requested resolution(s)
**Errors:** 404 - Fragrance not found, 500 - Embedding generation failed

```typescript
interface MultiResolutionEmbeddingResponse {
  fragrance_id: string;
  embeddings: {
    resolution_128?: number[];
    resolution_512?: number[];
    resolution_2048?: number[];
  };
  generation_time_ms: number;
  cache_status: 'hit' | 'miss' | 'generated';
}
```

### GET /api/ai/search/adaptive

**Purpose:** Perform adaptive semantic search with contextual optimization
**Parameters:**
- query: string
- user_id: string (optional)
- precision: 'fast' | 'balanced' | 'precise'
- filters: object (optional)
**Response:** Search results with adaptive ranking
**Errors:** 400 - Invalid query, 500 - Search processing failed

```typescript
interface AdaptiveSearchResponse {
  results: SearchResult[];
  query_analysis: {
    intent: string;
    confidence: number;
    processed_query: string;
  };
  search_metadata: {
    total_results: number;
    search_time_ms: number;
    precision_used: string;
    personalization_applied: boolean;
  };
}
```

### POST /api/ai/algorithms/feedback

**Purpose:** Provide feedback for multi-armed bandit algorithm optimization
**Parameters:** Algorithm performance feedback in request body
**Response:** Updated algorithm parameters
**Errors:** 400 - Invalid feedback data, 500 - Update failed

```typescript
interface AlgorithmFeedbackRequest {
  algorithm_name: string;
  context_hash: string;
  success: boolean;
  user_id: string;
  session_context: object;
}
```

### GET /api/ai/performance/metrics

**Purpose:** Retrieve AI system performance metrics and health status
**Parameters:**
- time_range: string (optional) - '1h', '24h', '7d', '30d'
- metric_types: string[] (optional) - specific metrics to retrieve
**Response:** Performance metrics and system health data
**Errors:** 500 - Metrics collection failed

```typescript
interface PerformanceMetricsResponse {
  response_times: {
    search_avg_ms: number;
    recommendations_avg_ms: number;
    embedding_generation_avg_ms: number;
  };
  accuracy_metrics: {
    recommendation_ctr: number;
    search_satisfaction: number;
    personalization_effectiveness: number;
  };
  system_health: {
    cache_hit_rate: number;
    error_rate: number;
    throughput_rps: number;
  };
}
```

### WebSocket /api/ai/realtime/recommendations

**Purpose:** Real-time recommendation updates via WebSocket connection
**Authentication:** Bearer token in connection headers
**Events:** 
- recommendations_updated
- preference_model_updated
- system_optimization_complete

```typescript
interface RealtimeRecommendationEvent {
  type: 'recommendations_updated' | 'preference_model_updated';
  user_id: string;
  data: {
    updated_recommendations?: Recommendation[];
    model_version?: string;
    trigger_event?: string;
  };
  timestamp: string;
}
```

## Controllers

### AISystemController
- **analyzeSystem**: Orchestrates comprehensive AI system analysis
- **getEnhancedRecommendations**: Implements multi-armed bandit recommendation selection
- **trackInteraction**: Processes real-time user interaction events
- **getPerformanceMetrics**: Aggregates and returns system performance data

### EmbeddingController
- **generateMultiResolution**: Creates and caches multi-resolution embeddings
- **optimizeEmbeddings**: Manages embedding optimization and versioning
- **searchAdaptive**: Performs adaptive search with contextual optimization

### AlgorithmController
- **updateAlgorithmPerformance**: Updates multi-armed bandit algorithm parameters
- **selectOptimalAlgorithm**: Implements Thompson Sampling for algorithm selection
- **trackAlgorithmFeedback**: Processes algorithm performance feedback

## Purpose

These endpoints enable the implementation of advanced AI features including multi-armed bandit optimization, real-time preference learning, multi-resolution embeddings, and adaptive search capabilities. The API design supports both synchronous and real-time interactions while providing comprehensive monitoring and feedback mechanisms for continuous improvement of AI system performance.