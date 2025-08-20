# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-15-fragrance-collections-recommendations-pages/spec.md

## API Endpoints

### Fragrance Detail APIs

#### GET /api/fragrances/[id]

**Purpose:** Get complete fragrance information including similar fragrances
**Parameters:** 
- `id` (path): Fragrance UUID
- `include_similar` (query): Boolean, default true
- `similar_limit` (query): Number, default 6

**Response:**
```typescript
{
  id: string;
  name: string;
  brand: string;
  scent_family: string;
  top_notes: string[];
  middle_notes: string[];
  base_notes: string[];
  description: string;
  intensity_score: number;
  longevity_hours: number;
  sillage_rating: number;
  recommended_occasions: string[];
  recommended_seasons: string[];
  mood_tags: string[];
  sample_available: boolean;
  sample_price_usd: number;
  similar_fragrances?: {
    id: string;
    name: string;
    brand: string;
    similarity_score: number;
  }[];
}
```

**Errors:** 404 if fragrance not found

#### POST /api/fragrances/[id]/interactions

**Purpose:** Track user interactions with fragrance page
**Parameters:**
- `id` (path): Fragrance UUID
- `interaction_type` (body): 'view' | 'like' | 'dislike' | 'sample_request'
- `context` (body): 'recommendation' | 'search' | 'similar' | 'browse'

**Response:** `{ success: boolean }`

### Collection Management APIs

#### GET /api/collections

**Purpose:** Get user's fragrance collection with filtering and sorting
**Parameters:**
- `status` (query): 'owned' | 'wishlist' | 'tried'
- `sort_by` (query): 'added_at' | 'rating' | 'usage_frequency' | 'name'
- `sort_order` (query): 'asc' | 'desc'
- `occasion` (query): Filter by occasion
- `season` (query): Filter by season

**Response:**
```typescript
{
  collections: {
    id: string;
    fragrance: {
      id: string;
      name: string;
      brand: string;
      scent_family: string;
      intensity_score: number;
    };
    status: string;
    added_at: string;
    rating?: number;
    occasions: string[];
    seasons: string[];
    personal_notes?: string;
    usage_frequency?: string;
  }[];
  total_count: number;
  insights: {
    total_fragrances: number;
    dominant_families: { family: string; count: number }[];
    average_intensity: number;
    most_worn_occasion: string;
    collection_diversity_score: number;
  };
}
```

#### POST /api/collections

**Purpose:** Add fragrance to user's collection
**Parameters:**
- `fragrance_id` (body): UUID
- `status` (body): 'owned' | 'wishlist' | 'tried'
- `rating` (body): Optional 1-5 integer
- `occasions` (body): Optional string array
- `seasons` (body): Optional string array
- `personal_notes` (body): Optional string

**Response:** `{ id: string; success: boolean }`

#### PUT /api/collections/[id]

**Purpose:** Update collection entry
**Parameters:** Same as POST plus `id` (path): Collection entry UUID
**Response:** `{ success: boolean }`

#### DELETE /api/collections/[id]

**Purpose:** Remove from collection
**Parameters:** `id` (path): Collection entry UUID
**Response:** `{ success: boolean }`

### Recommendations APIs

#### GET /api/recommendations

**Purpose:** Get personalized fragrance recommendations
**Parameters:**
- `limit` (query): Number, default 20
- `section` (query): 'perfect_matches' | 'trending' | 'adventurous' | 'seasonal'
- `refresh` (query): Boolean, force recalculation

**Response:**
```typescript
{
  sections: {
    perfect_matches: {
      fragrances: {
        id: string;
        name: string;
        brand: string;
        confidence_score: number;
        reason: string;
        sample_available: boolean;
        sample_price_usd: number;
      }[];
      explanation: string;
    };
    trending: { /* similar structure */ };
    adventurous: { /* similar structure */ };
    seasonal: { /* similar structure */ };
  };
  user_preferences: {
    dominant_families: string[];
    intensity_preference: number;
    occasion_preferences: string[];
  };
}
```

#### POST /api/recommendations/feedback

**Purpose:** Provide feedback on recommendations
**Parameters:**
- `fragrance_id` (body): UUID
- `feedback_type` (body): 'love' | 'like' | 'dislike' | 'not_interested'
- `reason` (body): Optional feedback reason
- `recommendation_context` (body): Which section the recommendation came from

**Response:** `{ success: boolean; updated_preferences: boolean }`

#### POST /api/recommendations/preferences

**Purpose:** Update user preferences manually
**Parameters:**
- `intensity_preference` (body): Number 1-10
- `family_preferences` (body): Object with family weights
- `occasion_preferences` (body): Array of preferred occasions
- `mood_preferences` (body): Array of preferred moods

**Response:** `{ success: boolean }`

## Server Actions

### Collection Management Actions

#### addToCollection
```typescript
async function addToCollection(
  fragranceId: string,
  status: 'owned' | 'wishlist' | 'tried',
  metadata?: {
    rating?: number;
    occasions?: string[];
    seasons?: string[];
    personalNotes?: string;
  }
): Promise<{ success: boolean; id?: string; error?: string }>
```

#### updateCollectionEntry
```typescript
async function updateCollectionEntry(
  entryId: string,
  updates: {
    rating?: number;
    occasions?: string[];
    seasons?: string[];
    personalNotes?: string;
    usageFrequency?: string;
  }
): Promise<{ success: boolean; error?: string }>
```

#### removeFromCollection
```typescript
async function removeFromCollection(
  entryId: string
): Promise<{ success: boolean; error?: string }>
```

### Preference Learning Actions

#### updatePreferencesFromInteraction
```typescript
async function updatePreferencesFromInteraction(
  fragranceId: string,
  interactionType: string,
  context: string
): Promise<{ success: boolean }>
```

#### generateRecommendations
```typescript
async function generateRecommendations(
  userId: string,
  options?: {
    limit?: number;
    excludeOwned?: boolean;
    focusOnGaps?: boolean;
  }
): Promise<{
  recommendations: RecommendationSection[];
  confidence: number;
}>
```

## API Route Handlers

### Fragrance Routes (`app/api/fragrances/`)

#### `[id]/route.ts`
- Handles GET requests for individual fragrance data
- Includes similar fragrance calculation using vector similarity
- Caches results for popular fragrances
- Tracks page views for analytics

#### `[id]/interactions/route.ts`
- Handles POST requests for user interactions
- Updates user preference learning models
- Rate limited to prevent spam

### Collection Routes (`app/api/collections/`)

#### `route.ts`
- GET: Returns user collection with filtering/sorting
- POST: Adds new item to collection

#### `[id]/route.ts`
- PUT: Updates existing collection entry
- DELETE: Removes from collection

#### `insights/route.ts`
- GET: Returns collection analytics and insights
- Cached with 1-hour TTL for performance

### Recommendation Routes (`app/api/recommendations/`)

#### `route.ts`
- GET: Returns personalized recommendations
- Implements caching with user-specific invalidation
- Triggers background preference model updates

#### `feedback/route.ts`
- POST: Processes recommendation feedback
- Updates user preference weights in real-time
- Triggers recommendation refresh

#### `preferences/route.ts`
- GET: Returns current user preferences
- POST: Updates user preferences manually

## Error Handling

### Standardized Error Responses
```typescript
{
  error: {
    code: 'FRAGRANCE_NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'RATE_LIMITED';
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

### Authentication Middleware
- All collection and recommendation APIs require authentication
- Public fragrance detail APIs for SEO and sharing
- Rate limiting based on user type (authenticated vs anonymous)

## Performance Considerations

### Caching Strategy
- **Fragrance Data:** Static generation with ISR (revalidate: 3600)
- **Similar Fragrances:** Redis cache with 1-hour TTL
- **User Collections:** Real-time with optimistic updates
- **Recommendations:** User-specific cache with smart invalidation

### Database Optimization
- Vector similarity queries optimized with proper indexing
- Collection queries use compound indexes
- Pagination for large collections
- Background jobs for expensive analytics calculations