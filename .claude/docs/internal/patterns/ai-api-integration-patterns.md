# AI API Integration Patterns

**Created:** 2025-08-18  
**Type:** API Implementation Patterns  
**Context:** Production AI API endpoints

## API Design Patterns

### 1. AI-Enhanced Endpoint Pattern

**Pattern:** Enhance existing APIs with AI while maintaining backward compatibility

```typescript
// Before: Simple keyword search
GET /api/search?q=vanilla

// After: AI-first with fallback
GET /api/search?q=vanilla&ai=true
Response: {
  "ai_powered": true,
  "search_methods_used": ["vector", "keyword"],
  "embedding_cost": 0.000027
}

// Fallback still works
GET /api/search?q=vanilla&ai=false
Response: {
  "ai_powered": false,
  "search_method": "keyword"
}
```

### 2. Progressive AI Response Pattern

**Pattern:** Start with basic response, progressively add AI features

```typescript
// Phase 1: Basic response
{
  "fragrances": [...],
  "total": 15
}

// Phase 2: Add AI metadata
{
  "fragrances": [...],
  "total": 15,
  "ai_powered": true,
  "search_methods_used": ["vector"]
}

// Phase 3: Add AI insights
{
  "fragrances": [...],
  "query_understanding": {
    "intent": "scent_description",
    "entities": ["vanilla", "oriental"]
  },
  "metadata": {
    "embedding_cost": 0.000027,
    "personalization_applied": true
  }
}
```

### 3. Multi-Type Recommendation Pattern

**Pattern:** Single endpoint serving multiple recommendation algorithms

```typescript
// Unified recommendation endpoint
GET /api/recommendations/personalized?types=personalized,trending,seasonal

Response: {
  "recommendations": [
    { 
      "fragrance_id": "rec-1", 
      "recommendation_type": "personalized",
      "algorithm_used": "content_based",
      "confidence": 0.89 
    },
    { 
      "fragrance_id": "rec-2", 
      "recommendation_type": "trending",
      "algorithm_used": "popularity_signal",
      "confidence": 0.76 
    }
  ]
}
```

### 4. Intelligent Caching Headers Pattern

**Pattern:** Different cache strategies based on AI content

```typescript
// AI-generated content (expensive, can cache longer)
headers: {
  'Cache-Control': 'private, max-age=1800', // 30 minutes
  'X-AI-Generated': 'true',
  'X-Cache-Strategy': 'ai_content'
}

// Real-time learning content (cache shorter)
headers: {
  'Cache-Control': 'private, max-age=300', // 5 minutes  
  'X-Personalization-Applied': 'true',
  'X-Cache-Strategy': 'personalized'
}

// Fallback content (cache longer, cheaper to regenerate)
headers: {
  'Cache-Control': 'public, s-maxage=3600', // 1 hour
  'X-AI-Generated': 'false',
  'X-Cache-Strategy': 'fallback'
}
```

### 5. Feedback Processing Pattern

**Pattern:** Structured feedback collection with immediate learning

```typescript
// Feedback API accepts multiple feedback types
POST /api/recommendations/feedback
{
  "fragrance_id": "123",
  "feedback_type": "rating",
  "rating_value": 5,
  "context": {
    "recommendation_id": "rec-456",
    "source": "personalized",
    "position": 1
  }
}

Response: {
  "feedback_processed": true,
  "learning_impact": 0.15, // High impact = strong preference signal
  "preference_update": {
    "embedding_updated": true,
    "confidence_change": 0.05
  },
  "recommendation_refresh": {
    "cache_invalidated": true,
    "new_recommendations_available": true
  }
}
```

## Error Handling Patterns

### 1. AI Service Fallback Pattern

```typescript
// Pattern: Graceful AI Degradation
async function searchWithFallback(query: string) {
  try {
    // Try AI-powered search first
    return await semanticSearch(query);
  } catch (aiError) {
    console.warn('AI search failed, using keyword fallback');
    
    try {
      // Fallback to keyword search
      const results = await keywordSearch(query);
      return {
        ...results,
        fallback_used: true,
        degradation_reason: aiError.message
      };
    } catch (fallbackError) {
      // Final fallback to popular items
      return await popularItemsFallback();
    }
  }
}
```

### 2. Rate Limit Handling Pattern

```typescript
// Pattern: Intelligent Rate Limit Recovery
if (error.message.includes('rate limit')) {
  // Try cheaper model first
  if (currentModel === 'voyage-3-large') {
    return await generateEmbedding(text, 'voyage-3.5');
  }
  
  // Then try different provider
  if (currentProvider === 'voyage') {
    return await generateEmbedding(text, 'openai');
  }
  
  // Finally, use exponential backoff
  await delay(calculateBackoffDelay(attemptNumber));
  return await retry();
}
```

### 3. Partial Success Pattern

```typescript
// Pattern: Return Partial Results on Partial Failure
const batchResults = {
  successful: [],
  failed: [],
  partial_success: true
};

batchItems.forEach(async item => {
  try {
    const result = await processItem(item);
    batchResults.successful.push(result);
  } catch (error) {
    batchResults.failed.push({ item, error: error.message });
  }
});

// Return what we could process
return {
  results: batchResults.successful,
  errors: batchResults.failed,
  success_rate: batchResults.successful.length / batchItems.length
};
```

## Performance Optimization Patterns

### 1. Embedding Batching Pattern

```typescript
// Pattern: Optimal Batch Processing
const BATCH_SIZE = 25; // Sweet spot for API limits
const DELAY_BETWEEN_BATCHES = 3000; // Rate limit protection

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await processBatch(batch);
  
  if (i + BATCH_SIZE < items.length) {
    await delay(DELAY_BETWEEN_BATCHES);
  }
}
```

### 2. Query Optimization Pattern

```typescript
// Pattern: Database Query Optimization for AI
// ❌ Bad: Multiple round trips
const user = await getUser(userId);
const collection = await getUserCollection(userId);
const embeddings = await getEmbeddings(collection.map(c => c.fragrance_id));

// ✅ Good: Single optimized query
const { data } = await supabase
  .from('user_collections')
  .select(`
    fragrance_id,
    rating,
    usage_frequency,
    fragrances!inner(
      embedding,
      fragrance_family,
      main_accords
    )
  `)
  .eq('user_id', userId)
  .not('fragrances.embedding', 'is', null);
```

### 3. Concurrent Processing Pattern

```typescript
// Pattern: Safe Concurrency for AI Operations
const semaphore = new Semaphore(5); // Max 5 concurrent AI requests

const results = await Promise.all(
  items.map(async item => {
    await semaphore.acquire();
    try {
      return await processItem(item);
    } finally {
      semaphore.release();
    }
  })
);
```

## Monitoring Integration Patterns

### 1. Performance Tracking Pattern

```typescript
// Pattern: Comprehensive Performance Tracking
const startTime = Date.now();
const result = await aiOperation();
const processingTime = Date.now() - startTime;

// Track metrics
recordMetric('ai_operation_time', processingTime);
recordMetric('ai_operation_success', 1);
recordMetric('ai_cost', result.cost);

// Add to response headers
headers: {
  'X-Processing-Time': processingTime.toString(),
  'X-AI-Cost': result.cost.toString(),
  'X-Cache-Used': result.cached.toString()
}
```

### 2. Health Check Integration Pattern

```typescript
// Pattern: Component Health Reporting
const componentHealth = {
  ai_providers: await checkAIProviderHealth(),
  database: await checkDatabaseHealth(), 
  cache: await checkCacheHealth(),
  queues: await checkQueueHealth()
};

const overallHealth = calculateOverallHealth(componentHealth);

// Structured health response
return {
  status: overallHealth > 0.9 ? 'healthy' : 'degraded',
  components: componentHealth,
  alerts: generateAlerts(componentHealth),
  recommendations: generateHealthRecommendations(componentHealth)
};
```

## Real-World Usage Examples

### Semantic Search with Personalization
```bash
# Natural language search with user context
curl -X POST http://localhost:3000/api/search/ai \
  -H "Content-Type: application/json" \
  -d '{
    "query": "fresh summer fragrance for office wear",
    "personalization": {
      "user_id": "user-123",
      "context": {
        "time_of_day": "morning",
        "season": "summer",
        "occasion": "office"
      }
    },
    "options": {
      "enable_explanations": true,
      "max_results": 10
    }
  }'
```

### Personalized Recommendations
```bash
# Multi-type personalized recommendations
curl "http://localhost:3000/api/recommendations/personalized?user_id=123&types=personalized,trending,seasonal&include_explanations=true&adventure_level=0.7"
```

### Collection Analysis
```bash
# Comprehensive collection intelligence
curl -X POST http://localhost:3000/api/collection/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "analysis_types": ["patterns", "gaps", "personality", "optimization"],
    "include_explanations": true
  }'
```

### Real-Time Feedback
```bash
# Process user feedback for learning
curl -X POST http://localhost:3000/api/recommendations/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "fragrance_id": "fragrance-456",
    "feedback_type": "rating",
    "rating_value": 5,
    "recommendation_id": "rec-789",
    "context": { "source": "personalized" }
  }'
```

## Common Pitfalls & Solutions

### Pitfall 1: Vector Dimension Mismatch
**Problem:** voyage-3-large (2048) vs pgvector limit (2000)
**Solution:** Always normalize to 2000 before database storage

### Pitfall 2: Cache Key Conflicts
**Problem:** Different users getting each other's cached recommendations
**Solution:** Always include user_id and context_hash in cache keys

### Pitfall 3: Expensive AI Operations in Request Path
**Problem:** API timeouts from slow AI operations
**Solution:** Use async queues for expensive operations, return quickly

### Pitfall 4: No Fallback Strategy
**Problem:** Complete failure when AI services down
**Solution:** Always implement non-AI fallback for critical features

## Testing Strategies

### Unit Testing AI Components
```typescript
// Mock AI services for consistent testing
const mockAIService = {
  generateEmbedding: vi.fn().mockResolvedValue(mockEmbedding),
  findSimilar: vi.fn().mockResolvedValue(mockResults)
};
```

### Integration Testing Real AI
```typescript
// Test with real AI services in staging
if (process.env.NODE_ENV === 'staging') {
  // Use real AI services
} else {
  // Use mocks for speed
}
```

### Performance Testing
```typescript
// Load testing with realistic AI workloads
const concurrentRequests = 50;
const promises = Array.from({ length: concurrentRequests }, () => 
  fetch('/api/search/ai', { method: 'POST', body: testQuery })
);

const results = await Promise.allSettled(promises);
const successRate = results.filter(r => r.status === 'fulfilled').length / concurrentRequests;
expect(successRate).toBeGreaterThan(0.95);
```

---

**These patterns are battle-tested and ready for production use across any AI-enhanced application.**