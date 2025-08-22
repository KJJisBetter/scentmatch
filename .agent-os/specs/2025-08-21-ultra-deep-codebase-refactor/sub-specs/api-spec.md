# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-ultra-deep-codebase-refactor/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## API Modernization Strategy

### Routes to Convert to Server Actions

**Collection Management (Currently /api/collection/*)**
- Convert to single `updateUserCollection` Server Action
- Handles add, remove, rate, and update operations
- Eliminates 4-6 separate API endpoints

**Wishlist Operations (Currently /api/wishlist/*)**  
- Convert to single `updateUserWishlist` Server Action
- Handles add, remove, and bulk operations
- Eliminates 3-4 separate API endpoints

**Recommendation Feedback (Currently /api/recommendations/feedback)**
- Convert to `submitRecommendationFeedback` Server Action
- Handles user rating and preference learning
- Eliminates dedicated feedback endpoint

### Routes to Maintain as API Routes

**Search Operations (/api/search/*)**
- **Reason:** Complex search logic with external integrations
- **Endpoints:** /api/search/fragrances, /api/search/suggestions
- **Keep as API routes due to:** Complex query processing, external API calls, caching requirements

**AI Processing (/api/quiz/analyze)**
- **Reason:** Heavy AI computation requiring specialized error handling
- **Keep as API route due to:** Long processing time, streaming responses, specialized error handling

## New Server Actions

### updateUserCollection

```typescript
'use server'
export async function updateUserCollection(
  action: 'add' | 'remove' | 'rate' | 'update',
  fragranceId: string,
  metadata?: {
    rating?: number;
    notes?: string;
    tags?: string[];
  }
): Promise<{ success: boolean; error?: string; data?: CollectionItem }>
```

**Purpose:** Unified collection management replacing multiple API endpoints  
**Parameters:** 
- action: Type of operation to perform
- fragranceId: Target fragrance identifier  
- metadata: Optional rating, notes, and tags
**Response:** Success status with optional collection item data
**Errors:** Invalid fragrance ID, unauthorized access, database errors

### updateUserWishlist

```typescript
'use server'
export async function updateUserWishlist(
  action: 'add' | 'remove' | 'bulk_add' | 'clear',
  fragranceIds: string | string[]
): Promise<{ success: boolean; error?: string; count?: number }>
```

**Purpose:** Unified wishlist operations with bulk support  
**Parameters:**
- action: Type of wishlist operation
- fragranceIds: Single ID or array for bulk operations
**Response:** Success status with item count  
**Errors:** Invalid IDs, unauthorized access, quota exceeded

### submitRecommendationFeedback

```typescript
'use server' 
export async function submitRecommendationFeedback(
  recommendationId: string,
  feedback: {
    rating: number;
    helpful: boolean;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }>
```

**Purpose:** Capture user feedback for AI learning  
**Parameters:**
- recommendationId: Target recommendation identifier
- feedback: Rating, helpfulness, and optional notes  
**Response:** Success confirmation
**Errors:** Invalid recommendation ID, invalid rating range

## Form Integration

### React Hook Form + Zod Integration

```typescript
// Collection rating form schema
const CollectionRatingSchema = z.object({
  rating: z.number().min(1).max(5),
  notes: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional()
});

// Form implementation with Server Action
function CollectionRatingForm({ fragranceId }: { fragranceId: string }) {
  const form = useForm<z.infer<typeof CollectionRatingSchema>>({
    resolver: zodResolver(CollectionRatingSchema)
  });
  
  async function onSubmit(data: z.infer<typeof CollectionRatingSchema>) {
    const result = await updateUserCollection('rate', fragranceId, data);
    // Handle result with proper error states
  }
}
```

## Error Handling Strategy

### Server Action Error Patterns

**Validation Errors**
- Use Zod schema validation before processing
- Return structured error messages for form display
- Maintain type safety across client/server boundary

**Database Errors**  
- Implement retry logic for transient failures
- Log errors for monitoring while returning user-friendly messages
- Maintain data consistency through transaction patterns

**Authorization Errors**
- Verify user session and permissions before processing
- Return appropriate HTTP status equivalents in Server Action responses
- Maintain security through proper RLS policies