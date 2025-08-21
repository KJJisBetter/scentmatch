# Server Actions Migration Guide

This guide shows how to migrate from API routes to Server Actions for better performance and user experience.

## ✅ Completed Server Actions

### 1. Collections Management

- **File**: `lib/actions/collections.ts`
- **Replaces**: `app/api/collection/route.ts`
- **Functions**: `toggleCollection`, `getUserCollection`, `isInCollection`

### 2. Wishlist Management

- **File**: `lib/actions/wishlist.ts`
- **Replaces**: `app/api/wishlist/route.ts`
- **Functions**: `toggleWishlist`, `getUserWishlist`, `isInWishlist`

### 3. Feedback Processing

- **File**: `lib/actions/feedback.ts`
- **Replaces**: `app/api/recommendations/feedback/route.ts`
- **Functions**: `processFeedback`

### 4. Account Conversion

- **File**: `lib/actions/account.ts`
- **Replaces**: `app/api/quiz/convert-to-account/route.ts`
- **Functions**: `convertToAccount`, `validateGuestSession`

## 🔄 Migration Examples

### Before: API Route Pattern

```typescript
// OLD: Using fetch to API route
const handleAddToCollection = async (fragranceId: string) => {
  try {
    const response = await fetch('/api/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fragrance_id: fragranceId,
        action: 'add',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add to collection');
    }

    const result = await response.json();

    if (result.success) {
      // Manually refresh or update state
      router.refresh();
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### After: Server Action Pattern

```typescript
// NEW: Using Server Action
import { toggleCollection } from '@/lib/actions';

const handleAddToCollection = async (fragranceId: string) => {
  try {
    const result = await toggleCollection({
      fragrance_id: fragranceId,
      action: 'add',
    });

    if (result.success) {
      // Automatic revalidation - no manual refresh needed!
      console.log(result.message);
    } else {
      console.error(result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Form Actions (Progressive Enhancement)

```typescript
// Server Actions work in forms without JavaScript
export default function AddToCollectionForm({ fragranceId }: { fragranceId: string }) {
  return (
    <form action={async () => {
      'use server';
      await toggleCollection({ fragrance_id: fragranceId, action: 'add' });
    }}>
      <button type="submit">Add to Collection</button>
    </form>
  );
}
```

## 🚀 Benefits of Server Actions

1. **Better Performance**: Direct database access without HTTP overhead
2. **Automatic Revalidation**: Cache invalidation with `revalidatePath()`
3. **Type Safety**: End-to-end TypeScript types
4. **Error Handling**: Proper error boundaries with `unstable_rethrow`
5. **Progressive Enhancement**: Works without JavaScript
6. **Simpler Code**: No JSON parsing or HTTP status handling

## 📝 Implementation Checklist

### Phase 1: Test Server Actions ✅

- [x] Create `lib/actions/` directory structure
- [x] Implement collections.ts
- [x] Implement wishlist.ts
- [x] Implement feedback.ts
- [x] Implement account.ts
- [x] Create index.ts with exports
- [x] Verify TypeScript compilation

### Phase 2: Migrate Components (Next)

- [ ] Update collection toggle buttons
- [ ] Update wishlist functionality
- [ ] Update feedback submission
- [ ] Update quiz conversion flow
- [ ] Test in browser with real user interactions

### Phase 3: Remove API Routes (Final)

- [ ] Verify all components use Server Actions
- [ ] Remove `app/api/collection/route.ts`
- [ ] Remove `app/api/wishlist/route.ts`
- [ ] Remove `app/api/recommendations/feedback/route.ts`
- [ ] Remove `app/api/quiz/convert-to-account/route.ts`

## 🔍 Testing Guidelines

1. **Functionality Testing**: Ensure all actions work as expected
2. **Error Handling**: Test with invalid inputs and network issues
3. **Revalidation**: Verify data updates immediately in UI
4. **Progressive Enhancement**: Test forms work without JavaScript
5. **Performance**: Compare before/after response times

## ⚠️ Important Notes

- Keep original API routes until migration is complete and tested
- Server Actions automatically handle authentication via cookies
- Use `revalidatePath()` to update cached data after mutations
- Handle errors properly with try/catch and `unstable_rethrow`
- Test both authenticated and unauthenticated scenarios

---

_This migration modernizes ScentMatch to use Next.js 15 Server Actions for better performance and user experience._
