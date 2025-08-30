# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-30-scentmatch-critical-improvements/spec.md

> Created: 2025-08-30
> Version: 1.0.0

## Architecture Standardization

### Server Actions (Mutations & Data Operations)

**Use Case**: Direct database operations, form submissions, user actions
**Location**: `lib/actions/`
**Pattern**: Next.js Server Actions with 'use server' directive

```typescript
'use server';

export async function updateUserCollection(
  userId: string,
  collectionData: CollectionFormData
): Promise<ActionResult> {
  try {
    const supabase = createClient();
    // Direct database operation
    const { data, error } = await supabase
      .from('collections')
      .update(collectionData)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Current Server Actions to Maintain**:

- `lib/actions/collections.ts` - Collection CRUD operations
- `lib/actions/wishlist.ts` - Wishlist management
- `lib/actions/user-preferences.ts` - User settings
- `lib/actions/feedback.ts` - User feedback submission

### API Routes (Processing & External Integrations)

**Use Case**: AI processing, search operations, external API calls, complex business logic
**Location**: `app/api/`
**Pattern**: Next.js API routes with proper error handling

```typescript
export async function POST(request: Request): Promise<Response> {
  try {
    const { query, preferences } = await request.json();

    // AI processing or external API call
    const recommendations = await unifiedRecommendationEngine.process({
      query,
      preferences,
      maxResults: 10,
    });

    return Response.json({ recommendations });
  } catch (error) {
    return Response.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

**Current API Routes to Maintain**:

- `app/api/search/route.ts` - Search processing
- `app/api/recommendations/route.ts` - AI recommendations
- `app/api/quiz/process/route.ts` - Quiz result processing

## Endpoints

### Critical Fix Endpoints

#### POST /api/auth/confirm-email

**Purpose**: Handle email confirmation with improved reliability
**Request**:

```typescript
{
  token: string;
  email: string;
}
```

**Response**:

```typescript
{
  success: boolean;
  message: string;
  redirectUrl?: string;
}
```

**Error Handling**: Fallback confirmation methods, clear error messages

#### POST /api/quiz/convert-to-account

**Purpose**: Convert quiz results to user account
**Request**:

```typescript
{
  quizResults: QuizResults;
  email: string;
  password: string;
}
```

**Response**:

```typescript
{
  success: boolean;
  userId?: string;
  preferences?: UserPreferences;
  error?: string;
}
```

**Error Handling**: Retry logic, session preservation, detailed error codes

#### POST /api/recommendations/ai

**Purpose**: Optimized AI recommendation processing
**Request**:

```typescript
{
  query?: string;
  preferences: UserPreferences;
  context: 'quiz' | 'search' | 'browse';
  maxResults: number;
}
```

**Response**:

```typescript
{
  recommendations: FragranceRecommendation[];
  processingTime: number;
  cached: boolean;
}
```

**Performance**: <2s response time, caching layer, progressive loading

### Server Action Endpoints

#### updateCollection(formData: FormData)

**Purpose**: Update user fragrance collections
**Usage**: Form submissions, direct user actions
**Implementation**: Direct Supabase operations

#### submitFeedback(formData: FormData)

**Purpose**: Handle user feedback submission
**Usage**: Feedback forms, rating submissions
**Implementation**: Database insert with validation

#### updateUserPreferences(formData: FormData)

**Purpose**: Update user preference settings
**Usage**: Settings page, profile updates
**Implementation**: User table updates with optimistic UI

## Controllers

### Recommendation Controller

**Location**: `app/api/recommendations/route.ts`
**Responsibilities**:

- AI processing coordination
- Caching layer management
- Performance optimization
- Error handling and fallbacks

```typescript
class RecommendationController {
  async processRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    // Check cache first
    const cached = await this.checkCache(request);
    if (cached) return cached;

    // Process with AI engine
    const result = await unifiedRecommendationEngine.process(request);

    // Cache result
    await this.cacheResult(request, result);

    return result;
  }
}
```

### Search Controller

**Location**: `app/api/search/route.ts`
**Responsibilities**:

- Fuse.js search coordination
- Filter application
- Result formatting
- Performance monitoring

### Auth Controller

**Location**: `app/api/auth/*/route.ts`
**Responsibilities**:

- Supabase auth integration
- Email confirmation handling
- Session management
- Error recovery

## Migration Strategy

### Phase 1: Audit Current Architecture

1. **Identify Mixed Patterns**:

   ```bash
   # Find Server Actions used incorrectly
   grep -r "'use server'" app/api/

   # Find API routes doing direct DB operations
   grep -r "supabase.from" app/api/
   ```

2. **Categorize Endpoints**:
   - **Move to Server Actions**: Simple CRUD, form submissions
   - **Keep as API Routes**: AI processing, search, external APIs
   - **Refactor**: Mixed-pattern endpoints

### Phase 2: Migration Implementation

1. **Server Action Migrations**:
   - Move simple database operations from API routes
   - Update client-side forms to use Server Actions
   - Remove unnecessary API route boilerplate

2. **API Route Optimizations**:
   - Add proper caching headers
   - Implement error boundaries
   - Add performance monitoring

### Phase 3: Client-Side Updates

1. **Update Form Submissions**:

   ```typescript
   // Before (API route)
   const response = await fetch('/api/collections', {
     method: 'POST',
     body: JSON.stringify(data),
   });

   // After (Server Action)
   import { updateCollection } from '@/lib/actions/collections';
   const result = await updateCollection(formData);
   ```

2. **Update Processing Calls**:
   ```typescript
   // Keep for AI processing
   const recommendations = await fetch('/api/recommendations', {
     method: 'POST',
     body: JSON.stringify(query),
   });
   ```

## Performance Standards

### Response Time Targets

- **Server Actions**: <500ms (direct DB operations)
- **Search API**: <1s (with Fuse.js processing)
- **AI Recommendations**: <2s (with caching <1s)
- **Authentication**: <1s (Supabase integration)

### Caching Strategy

- **AI Recommendations**: 1 hour cache for similar queries
- **Search Results**: 30 minutes for popular queries
- **User Preferences**: Session-based caching
- **Static Data**: Edge caching via Vercel

### Error Handling Standards

- **Graceful Degradation**: Fallback responses for failures
- **Retry Logic**: 3 attempts with exponential backoff
- **User Messaging**: Clear, actionable error messages
- **Monitoring**: Log all failures for debugging
