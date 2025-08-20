# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-18-ai-enhancement-system/spec.md

## AI-Powered Search API

### POST /api/search/ai

**Purpose:** Perform AI-powered semantic search with natural language queries
**Parameters:**
- `query` (string, required): Natural language search query
- `filters` (object, optional): Price range, brands, scent families, etc.
- `personalized` (boolean, default: true): Whether to personalize results
- `limit` (number, default: 20): Maximum number of results

**Response:**
```json
{
  "results": [
    {
      "fragrance_id": "uuid",
      "name": "Fragrance Name",
      "brand": "Brand Name",
      "similarity_score": 0.92,
      "confidence": "high",
      "explanation": "AI-generated explanation for match",
      "price_range": "$50-100",
      "scent_family": "woody"
    }
  ],
  "query_understanding": {
    "intent": "scent_description",
    "entities": ["fresh", "summer", "morning"],
    "suggested_filters": {
      "scent_families": ["citrus", "aquatic"],
      "occasions": ["casual", "daytime"]
    }
  },
  "total_count": 156,
  "processing_time_ms": 180
}
```

**Errors:**
- 400: Invalid query or parameters
- 429: Rate limit exceeded
- 500: AI service unavailable

### GET /api/search/suggestions

**Purpose:** Get AI-powered search suggestions as user types
**Parameters:**
- `q` (string, required): Partial query string
- `limit` (number, default: 5): Maximum suggestions

**Response:**
```json
{
  "suggestions": [
    {
      "text": "fresh summer fragrances for morning",
      "type": "semantic",
      "confidence": 0.89
    },
    {
      "text": "Tom Ford similar but affordable",
      "type": "comparison",
      "confidence": 0.76
    }
  ]
}
```

## Personalized Recommendations API

### GET /api/recommendations/personalized

**Purpose:** Get AI-generated personalized fragrance recommendations
**Parameters:**
- `type` (string): "general", "trending", "seasonal", "adventurous"
- `limit` (number, default: 20): Maximum recommendations
- `adventure_level` (number, 0-1): Exploration vs exploitation balance
- `context` (object, optional): Occasion, season, mood preferences

**Response:**
```json
{
  "recommendations": [
    {
      "fragrance_id": "uuid",
      "score": 0.91,
      "confidence": "high",
      "recommendation_type": "similar_to_favorites",
      "explanation": {
        "primary_reason": "Similar to your favorite Tom Ford Black Orchid",
        "factors": [
          {
            "type": "vector_similarity",
            "description": "91% scent profile match",
            "weight": 0.6
          },
          {
            "type": "accord_match", 
            "description": "Contains preferred vanilla and amber",
            "weight": 0.2
          }
        ]
      },
      "fragrance": {
        "name": "By Kilian Black Phantom",
        "brand": "By Kilian",
        "price_range": "$150-200"
      }
    }
  ],
  "user_context": {
    "preference_strength": 0.87,
    "dominant_families": ["oriental", "woody"],
    "recent_interactions": 45
  },
  "cache_info": {
    "cached": false,
    "generated_at": "2025-08-18T10:30:00Z"
  }
}
```

### POST /api/recommendations/feedback

**Purpose:** Submit feedback to improve AI recommendations
**Parameters:**
- `recommendation_id` (string, required): ID of the recommendation
- `fragrance_id` (string, required): ID of the fragrance
- `feedback_type` (string): "like", "dislike", "not_interested", "purchased"
- `rating` (number, 1-5, optional): User rating
- `context` (object, optional): Additional context about feedback

**Response:**
```json
{
  "success": true,
  "preference_updated": true,
  "new_preference_strength": 0.89,
  "message": "Thank you for your feedback. Your recommendations will improve."
}
```

## Collection Intelligence API

### GET /api/collection/analysis

**Purpose:** Get AI-powered analysis of user's fragrance collection
**Parameters:**
- `analysis_type` (string): "overview", "gaps", "seasonal", "preferences"
- `include_recommendations` (boolean, default: true): Include related recommendations

**Response:**
```json
{
  "analysis": {
    "collection_personality": "Sophisticated Oriental Lover",
    "dominant_families": [
      {
        "family": "oriental",
        "percentage": 45,
        "strength": "strong_preference"
      },
      {
        "family": "woody",
        "percentage": 30,
        "strength": "moderate_preference"
      }
    ],
    "seasonal_coverage": {
      "spring": 0.2,
      "summer": 0.1,
      "fall": 0.4,
      "winter": 0.3,
      "gaps": ["fresh summer fragrances"]
    },
    "occasion_coverage": {
      "daily": 0.3,
      "evening": 0.5,
      "special": 0.2,
      "gaps": ["casual daytime scents"]
    },
    "insights": [
      {
        "type": "preference_pattern",
        "title": "Strong Oriental Preference",
        "description": "You gravitate toward rich, warm oriental fragrances",
        "confidence": 0.92
      },
      {
        "type": "collection_gap",
        "title": "Summer Collection Gap",
        "description": "Consider adding fresh, citrusy fragrances for warm weather",
        "confidence": 0.78
      }
    ]
  },
  "recommendations": [
    {
      "type": "fill_gap",
      "category": "summer_fresh",
      "fragrances": ["uuid1", "uuid2", "uuid3"]
    }
  ],
  "cache_info": {
    "cached": true,
    "cache_expires": "2025-08-19T10:30:00Z"
  }
}
```

### POST /api/collection/optimize

**Purpose:** Get AI recommendations to optimize collection
**Parameters:**
- `optimization_goal` (string): "diversity", "gaps", "upgrade", "budget"
- `budget_range` (object, optional): Min/max budget for recommendations
- `preferences` (object, optional): User-specified preferences

**Response:**
```json
{
  "optimization_plan": {
    "goal": "diversity",
    "current_diversity_score": 0.34,
    "target_diversity_score": 0.67,
    "recommendations": [
      {
        "action": "add",
        "category": "fresh_citrus",
        "reason": "Expand summer/daytime options",
        "suggestions": ["uuid1", "uuid2"]
      },
      {
        "action": "consider_replacing",
        "current_fragrance": "uuid3",
        "reason": "Similar profile to existing favorites",
        "alternatives": ["uuid4", "uuid5"]
      }
    ]
  }
}
```

## AI Processing & Admin API

### POST /api/ai/embeddings/regenerate

**Purpose:** Trigger batch regeneration of all fragrance embeddings
**Parameters:**
- `batch_size` (number, default: 100): Number of fragrances per batch
- `model` (string, default: "voyage-3.5"): Embedding model to use
- `force` (boolean, default: false): Regenerate even if embeddings exist

**Response:**
```json
{
  "job_id": "uuid",
  "status": "queued",
  "total_fragrances": 2500,
  "estimated_completion": "2025-08-18T12:00:00Z",
  "batch_size": 100
}
```

### GET /api/ai/embeddings/status/{job_id}

**Purpose:** Check status of embedding generation job
**Response:**
```json
{
  "job_id": "uuid",
  "status": "processing",
  "progress": {
    "completed": 750,
    "total": 2500,
    "percentage": 30,
    "current_batch": 8,
    "total_batches": 25
  },
  "estimated_completion": "2025-08-18T11:45:00Z",
  "errors": [
    {
      "fragrance_id": "uuid",
      "error": "Rate limit exceeded",
      "retry_count": 2
    }
  ]
}
```

### POST /api/ai/users/rebuild-preferences

**Purpose:** Rebuild user preference models (admin endpoint)
**Parameters:**
- `user_ids` (array, optional): Specific users to rebuild (default: all)
- `force` (boolean, default: false): Force rebuild even if recent

**Response:**
```json
{
  "job_id": "uuid",
  "users_queued": 1250,
  "estimated_completion": "2025-08-18T13:00:00Z"
}
```

## Real-time Updates API (WebSocket)

### WebSocket /api/ws/recommendations

**Purpose:** Real-time recommendation updates as user browses

**Connection Parameters:**
- `user_id` (string): Authenticated user ID
- `session_id` (string): Browser session ID

**Message Types:**

**User Activity:**
```json
{
  "type": "user_activity",
  "data": {
    "fragrance_id": "uuid",
    "activity": "view",
    "duration": 15000,
    "context": {
      "page": "fragrance_detail",
      "referrer": "search"
    }
  }
}
```

**Recommendation Update:**
```json
{
  "type": "recommendation_update",
  "data": {
    "recommendations": [...],
    "reason": "preference_update",
    "confidence_change": 0.05
  }
}
```

**Collection Insight:**
```json
{
  "type": "collection_insight",
  "data": {
    "insight_type": "new_preference_detected",
    "title": "Growing Interest in Fresh Scents",
    "description": "Your recent activity suggests interest in citrus fragrances",
    "confidence": 0.73,
    "related_recommendations": ["uuid1", "uuid2"]
  }
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "AI recommendation service is temporarily unavailable",
    "details": {
      "provider": "voyage_ai",
      "fallback_available": true,
      "retry_after": 30
    },
    "timestamp": "2025-08-18T10:30:00Z"
  }
}
```

### AI-Specific Error Codes
- `AI_SERVICE_UNAVAILABLE`: Primary AI provider down, fallback may be available
- `EMBEDDING_GENERATION_FAILED`: Failed to generate embeddings for content
- `INSUFFICIENT_USER_DATA`: Not enough user data for personalized recommendations
- `RATE_LIMIT_EXCEEDED`: AI provider rate limit exceeded
- `INVALID_QUERY`: Query cannot be processed by AI system
- `MODEL_NOT_AVAILABLE`: Requested AI model not available

## Authentication & Rate Limiting

### Authentication
- All personalized endpoints require authenticated user session
- Admin endpoints require elevated permissions
- WebSocket connections require valid session token

### Rate Limiting
- Search API: 100 requests/minute per user
- Recommendations API: 50 requests/minute per user
- Feedback API: 200 requests/minute per user
- Embedding generation: 10 requests/minute (admin only)

### Caching Strategy
- Search results: 5 minutes for identical queries
- Personalized recommendations: 1 hour with user context hash
- Collection analysis: 24 hours unless collection changes
- Embedding generation status: Real-time (no cache)