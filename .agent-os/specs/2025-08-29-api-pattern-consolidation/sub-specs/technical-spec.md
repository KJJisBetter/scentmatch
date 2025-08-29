# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-29-api-pattern-consolidation/spec.md

> Created: 2025-08-29
> Version: 1.0.0

## Technical Requirements

### Current Architecture Analysis

#### Proven Server Actions Pattern (collections.ts)

- **File**: `lib/actions/collections.ts`
- **Pattern**: Direct Supabase queries with @supabase/ssr
- **Performance**: Sub-200ms response times
- **Structure**: Type-safe functions with proper error handling
- **Caching**: Server-side caching with revalidation
- **File Size**: Under 200 lines, well-structured

#### Problematic API Routes

**Search API Route** (`/api/search`)

- **Current State**: 477 lines, monolithic structure
- **Performance Issue**: API route overhead + complex logic
- **Fuse.js Integration**: Client-side search with server filtering
- **Caching**: Inefficient, per-request processing
- **Maintainability**: Single large file violates 200-line rule

**Quiz API Routes** (`/api/quiz/*`)

- **AI Processing**: Heavy UnifiedRecommendationEngine operations
- **Performance Bottleneck**: Cold start + API route overhead
- **Error Handling**: Inconsistent timeout patterns
- **Result Persistence**: Indirect collection integration

### Target Architecture

#### Server Actions Consolidation Strategy

**Search Server Actions** (`lib/actions/search-actions.ts`)

```typescript
// Target structure - under 200 lines
export async function searchFragrances(
  query: SearchParams
): Promise<SearchResult>;
export async function getFragranceFilters(): Promise<FilterOptions>;
export async function getFragranceDetails(id: string): Promise<FragranceDetail>;
```

**Quiz Server Actions** (`lib/actions/quiz-actions.ts`)

```typescript
// Target structure - under 200 lines
export async function processQuizAnswer(answer: QuizAnswer): Promise<QuizState>;
export async function generateRecommendations(
  quiz: CompletedQuiz
): Promise<Recommendations>;
export async function saveQuizResults(
  results: QuizResults
): Promise<CollectionEntry>;
```

#### Performance Optimization Patterns

**Caching Layer Integration**

- Server-side caching with Next.js revalidation
- Fuse.js index caching for search performance
- AI recommendation result caching with TTL
- Fragment caching for complex UI components

**Database Query Optimization**

- Prepared statements for frequent queries
- Connection pooling optimization
- Query result caching at Supabase level
- Selective field loading for large datasets

### Migration Strategy

#### Phase 1: Search Migration (Week 1)

**Step 1**: Extract search logic from API route

- Create `lib/search/fragrance-search.ts` utility
- Migrate Fuse.js configuration and indexing
- Extract filter and sorting logic
- Maintain existing search interface

**Step 2**: Implement search Server Actions

- Create `lib/actions/search-actions.ts`
- Integrate with fragrance-search utility
- Implement server-side caching
- Add performance monitoring

**Step 3**: Update component integration

- Replace API route calls with Server Actions
- Update React Query patterns if used
- Verify performance benchmarks
- Browser testing with @qa-specialist

#### Phase 2: Quiz Migration (Week 2)

**Step 1**: Analyze quiz flow complexity

- Map current quiz API route dependencies
- Identify AI processing bottlenecks
- Document UnifiedRecommendationEngine integration points
- Plan error handling and timeout strategies

**Step 2**: Create quiz Server Actions

- Implement `lib/actions/quiz-actions.ts`
- Optimize AI recommendation generation
- Integrate with collections Server Actions
- Add comprehensive error handling

**Step 3**: Performance validation and monitoring

- Implement response time monitoring
- Add AI processing timeout handling
- Create performance regression tests
- Document optimization patterns

### Performance Optimizations

#### Server Actions Advantages

- **Reduced Latency**: Eliminates API route overhead (~50-100ms savings)
- **Better Caching**: Native Next.js revalidation patterns
- **Type Safety**: End-to-end TypeScript without API boundaries
- **Streaming**: Native support for streaming responses
- **Error Handling**: Consistent patterns with proper typing

#### Caching Strategies

```typescript
// Search result caching
const SEARCH_CACHE_TTL = 300; // 5 minutes
const FILTER_CACHE_TTL = 3600; // 1 hour
const AI_RECOMMENDATION_TTL = 1800; // 30 minutes
```

#### Monitoring Integration

- Response time tracking for all Server Actions
- Error rate monitoring with alerting
- Performance regression detection
- Resource usage optimization tracking

### Error Handling and Timeout Patterns

#### Standardized Error Types

```typescript
type ActionResult<T> = {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

#### Timeout Configuration

- **Search Operations**: 5s timeout with fallback
- **AI Processing**: 30s timeout with progress indicators
- **Database Operations**: 10s timeout with retry logic
- **External API Calls**: Maintain existing patterns

### Integration Requirements

#### Supabase Integration

- Maintain @supabase/ssr pattern consistency
- Use existing connection pooling
- Preserve RLS policies and security patterns
- Integrate with existing auth flows

#### UnifiedRecommendationEngine Integration

- Optimize for Server Actions execution context
- Implement proper timeout handling
- Add result caching layer
- Maintain existing AI model interfaces

#### Frontend Integration

- Update components to use Server Actions
- Maintain existing loading states
- Preserve error handling UX
- Add performance monitoring hooks

## External Dependencies

### Required Libraries

- **@supabase/ssr**: Existing version, maintain consistency
- **Fuse.js**: Keep current version, optimize configuration
- **UnifiedRecommendationEngine**: Internal library, optimize for Server Actions
- **React Hook Form + Zod**: Maintain for form validation

### Performance Monitoring

- Next.js built-in performance monitoring
- Custom metrics for Server Actions response times
- Error tracking and alerting integration
- Performance regression testing automation

### Development Tools

- TypeScript strict mode compliance
- ESLint configuration updates for Server Actions
- Playwright testing integration via @qa-specialist
- GitHub Actions CI/CD pipeline updates
