# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-29-api-pattern-consolidation/spec.md

> Created: 2025-08-29
> Version: 1.0.0

## Endpoints

### Current API Structure vs Target Server Actions

#### Search Operations

**Current API Route**: `POST /api/search`

```typescript
// Current problematic pattern
Request: { query: string, filters: FilterParams, page: number }
Response: { results: Fragrance[], pagination: PaginationInfo, filters: FilterState }
```

**Target Server Actions**: `lib/actions/search-actions.ts`

```typescript
// Optimized Server Actions pattern
export async function searchFragrances(params: {
  query: string;
  filters?: FragranceFilters;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<SearchResponse>> {
  // Implementation with caching and optimization
}

export async function getFragranceById(
  id: string
): Promise<ActionResult<FragranceDetail>> {
  // Direct Supabase query with caching
}

export async function getPopularFragrances(
  limit?: number
): Promise<ActionResult<Fragrance[]>> {
  // Cached popular results
}

export async function getFragranceFilters(): Promise<
  ActionResult<FilterOptions>
> {
  // Long-lived cached filter options
}
```

#### Quiz Operations

**Current API Routes**: Multiple quiz endpoints

```typescript
// Current fragmented pattern
POST / api / quiz / start;
POST / api / quiz / answer;
POST / api / quiz / complete;
GET / api / quiz / recommendations;
```

**Target Server Actions**: `lib/actions/quiz-actions.ts`

```typescript
// Consolidated Server Actions pattern
export async function initializeQuiz(): Promise<ActionResult<QuizSession>> {
  // Initialize new quiz session
}

export async function submitQuizAnswer(params: {
  sessionId: string;
  questionId: string;
  answer: QuizAnswer;
}): Promise<ActionResult<QuizProgress>> {
  // Process single answer with state update
}

export async function generateQuizRecommendations(params: {
  sessionId: string;
  preferences: QuizPreferences;
}): Promise<ActionResult<RecommendationResults>> {
  // AI processing with caching and timeout handling
}

export async function saveQuizToCollection(params: {
  userId: string;
  quizResults: QuizResults;
  collectionName?: string;
}): Promise<ActionResult<CollectionEntry>> {
  // Integration with existing collections Server Actions
}
```

### Function Signatures

#### Search Server Actions Specification

```typescript
// Type definitions
interface SearchParams {
  query: string;
  filters?: {
    priceRange?: [number, number];
    fragranceFamily?: string[];
    season?: string[];
    occasion?: string[];
    rating?: number;
  };
  sortBy?: 'relevance' | 'price' | 'rating' | 'popularity';
  limit?: number;
  offset?: number;
}

interface SearchResponse {
  results: FragranceSearchResult[];
  total: number;
  hasMore: boolean;
  filters: ActiveFilters;
  searchTime: number; // Performance tracking
}

interface FragranceSearchResult {
  id: string;
  name: string;
  brand: string;
  price: number;
  rating: number;
  imageUrl: string;
  fragranceFamily: string;
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  relevanceScore: number; // Fuse.js score
}

// Core search function
export async function searchFragrances(
  params: SearchParams
): Promise<ActionResult<SearchResponse>> {
  const startTime = performance.now();

  try {
    // Validate input parameters
    const validatedParams = SearchParamsSchema.parse(params);

    // Check cache first
    const cacheKey = generateSearchCacheKey(validatedParams);
    const cached = await getCachedResult<SearchResponse>(cacheKey);
    if (cached) {
      return { data: cached };
    }

    // Execute search with Fuse.js optimization
    const searchResults = await executeFragranceSearch(validatedParams);

    // Cache results with appropriate TTL
    await cacheResult(cacheKey, searchResults, SEARCH_CACHE_TTL);

    // Performance tracking
    const searchTime = performance.now() - startTime;
    await trackPerformanceMetric('search_duration', searchTime);

    return { data: { ...searchResults, searchTime } };
  } catch (error) {
    return {
      error: {
        code: 'SEARCH_ERROR',
        message: 'Search operation failed',
        details: error,
      },
    };
  }
}
```

#### Quiz Server Actions Specification

```typescript
// Type definitions
interface QuizSession {
  id: string;
  userId?: string;
  currentQuestion: number;
  totalQuestions: number;
  answers: QuizAnswer[];
  startedAt: Date;
}

interface QuizAnswer {
  questionId: string;
  selectedOptions: string[];
  confidence: number; // 1-5 scale
  timestamp: Date;
}

interface RecommendationResults {
  recommendations: RecommendationItem[];
  confidence: number;
  reasoning: string;
  processingTime: number;
  sessionId: string;
}

interface RecommendationItem {
  fragrance: FragranceDetail;
  matchScore: number; // 0-1 scale
  matchReasons: string[];
  category: 'primary' | 'alternative' | 'exploration';
}

// Quiz processing with AI integration
export async function generateQuizRecommendations(params: {
  sessionId: string;
  preferences: QuizPreferences;
}): Promise<ActionResult<RecommendationResults>> {
  const startTime = performance.now();

  try {
    // Validate session and preferences
    const session = await validateQuizSession(params.sessionId);
    const validatedPrefs = QuizPreferencesSchema.parse(params.preferences);

    // Check for cached recommendations
    const cacheKey = `quiz_recommendations:${params.sessionId}`;
    const cached = await getCachedResult<RecommendationResults>(cacheKey);
    if (cached) {
      return { data: cached };
    }

    // AI processing with timeout
    const recommendations = (await Promise.race([
      processAIRecommendations(session, validatedPrefs),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI processing timeout')), 30000)
      ),
    ])) as RecommendationResults;

    // Cache with shorter TTL due to personalization
    await cacheResult(cacheKey, recommendations, AI_RECOMMENDATION_TTL);

    // Performance tracking
    const processingTime = performance.now() - startTime;
    await trackPerformanceMetric('ai_recommendation_duration', processingTime);

    return {
      data: {
        ...recommendations,
        processingTime: processingTime,
      },
    };
  } catch (error) {
    return {
      error: {
        code: 'AI_RECOMMENDATION_ERROR',
        message: 'Failed to generate recommendations',
        details: error,
      },
    };
  }
}
```

### Error Handling Patterns

#### Standardized Error Response Format

```typescript
interface ActionError {
  code:
    | 'VALIDATION_ERROR'
    | 'DATABASE_ERROR'
    | 'SEARCH_ERROR'
    | 'AI_PROCESSING_ERROR'
    | 'TIMEOUT_ERROR'
    | 'CACHE_ERROR'
    | 'UNKNOWN_ERROR';
  message: string;
  details?: unknown;
  timestamp: Date;
  actionName: string;
}

interface ActionResult<T> {
  data?: T;
  error?: ActionError;
  metadata?: {
    duration: number;
    fromCache: boolean;
    retryCount: number;
  };
}
```

#### Error Handling Implementation

```typescript
// Centralized error handling wrapper
function withErrorHandling<T extends any[], R>(
  actionName: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<ActionResult<R>> => {
    const startTime = performance.now();
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      try {
        const result = await fn(...args);
        const duration = performance.now() - startTime;

        return {
          data: result,
          metadata: { duration, fromCache: false, retryCount },
        };
      } catch (error) {
        retryCount++;

        // Determine if retry is appropriate
        if (shouldRetry(error) && retryCount < MAX_RETRIES) {
          await delay(RETRY_DELAY * retryCount);
          continue;
        }

        // Log error for monitoring
        await logError(actionName, error, {
          retryCount,
          duration: performance.now() - startTime,
        });

        return {
          error: {
            code: categorizeError(error),
            message: getErrorMessage(error),
            details: error,
            timestamp: new Date(),
            actionName,
          },
        };
      }
    }
  };
}
```

### Performance Monitoring Integration

#### Response Time Tracking

```typescript
// Performance monitoring integration
async function trackPerformanceMetric(
  metricName: string,
  value: number,
  tags?: Record<string, string>
): Promise<void> {
  // Integration with monitoring service
  await performanceTracker.track({
    metric: metricName,
    value,
    timestamp: new Date(),
    tags: {
      ...tags,
      environment: process.env.NODE_ENV,
      version: process.env.VERCEL_GIT_COMMIT_SHA,
    },
  });
}

// Automatic performance tracking decorator
function withPerformanceTracking<T extends any[], R>(
  actionName: string,
  targetTime: number // Target response time in ms
) {
  return function decorator(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<
      (...args: T) => Promise<ActionResult<R>>
    >
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (...args: T): Promise<ActionResult<R>> {
      const startTime = performance.now();
      const result = await method.apply(this, args);
      const duration = performance.now() - startTime;

      // Track performance metrics
      await trackPerformanceMetric(`${actionName}_duration`, duration);

      // Alert if exceeding target time
      if (duration > targetTime) {
        await trackPerformanceMetric(`${actionName}_slow_response`, 1, {
          targetTime: targetTime.toString(),
          actualTime: duration.toString(),
        });
      }

      return result;
    };
  };
}
```

### Caching Layer Integration Points

#### Cache Configuration

```typescript
interface CacheConfig {
  key: string;
  ttl: number; // Time to live in seconds
  tags?: string[]; // For cache invalidation
  compress?: boolean; // For large payloads
}

// Cache TTL configuration
export const CACHE_TTL = {
  SEARCH_RESULTS: 300, // 5 minutes
  FRAGRANCE_DETAILS: 3600, // 1 hour
  FILTER_OPTIONS: 3600, // 1 hour
  AI_RECOMMENDATIONS: 1800, // 30 minutes
  POPULAR_FRAGRANCES: 1800, // 30 minutes
  USER_PREFERENCES: 300, // 5 minutes
} as const;

// Cache key generation
function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (result, key) => {
        result[key] = params[key];
        return result;
      },
      {} as Record<string, any>
    );

  const paramString = JSON.stringify(sortedParams);
  const hash = createHash('md5').update(paramString).digest('hex');

  return `${prefix}:${hash}`;
}

// Cache invalidation patterns
export async function invalidateSearchCache(tags?: string[]): Promise<void> {
  await cacheService.invalidateByTags(['search', ...(tags || [])]);
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await cacheService.invalidateByTags([`user:${userId}`]);
}
```

## Controllers

### Server Actions Organization

#### File Structure

```
lib/actions/
├── search-actions.ts       # Search and discovery operations
├── quiz-actions.ts         # Quiz processing and AI recommendations
├── collections.ts          # Existing collections (reference pattern)
├── shared/
│   ├── cache.ts           # Caching utilities
│   ├── performance.ts     # Performance tracking
│   ├── error-handling.ts  # Error handling utilities
│   └── validation.ts      # Zod schemas and validation
```

#### Import and Usage Patterns

```typescript
// Component usage - consistent across all Server Actions
import {
  searchFragrances,
  getFragranceFilters,
} from '@/lib/actions/search-actions';
import { generateQuizRecommendations } from '@/lib/actions/quiz-actions';

// Form action usage with React Hook Form
const { handleSubmit } = useForm<SearchFormData>();

const onSubmit = async (data: SearchFormData) => {
  const result = await searchFragrances(data);

  if (result.error) {
    // Handle error with consistent UI patterns
    showErrorToast(result.error.message);
    return;
  }

  // Handle success
  setSearchResults(result.data.results);
  updateFilters(result.data.filters);
};

// Streaming usage for AI recommendations
const handleQuizComplete = async (preferences: QuizPreferences) => {
  const result = await generateQuizRecommendations({
    sessionId: quiz.id,
    preferences,
  });

  if (result.error) {
    handleQuizError(result.error);
    return;
  }

  // Process recommendations
  displayRecommendations(result.data.recommendations);
  trackQuizCompletion(result.data.processingTime);
};
```

This comprehensive API specification establishes the foundation for migrating from API routes to Server Actions while maintaining performance, reliability, and developer experience standards.
