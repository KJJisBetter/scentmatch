/**
 * Server Actions for ScentMatch - Next.js 15 Modernization
 *
 * This module exports all Server Actions that replace API routes
 * for better performance, type safety, and user experience.
 *
 * Server Actions provide:
 * - Direct database access without HTTP overhead
 * - Automatic revalidation of cached data
 * - Better error handling with unstable_rethrow
 * - Type-safe operations with TypeScript
 * - Progressive enhancement support
 */

// Collection management actions
export {
  toggleCollection,
  getUserCollection,
  isInCollection,
  type CollectionActionParams,
  type CollectionActionResult,
  type CollectionItem,
  type GetCollectionResult,
} from './collections';

// Wishlist management actions
export {
  toggleWishlist,
  getUserWishlist,
  isInWishlist,
  type WishlistActionParams,
  type WishlistActionResult,
  type WishlistItem,
  type GetWishlistResult,
} from './wishlist';

// Feedback and recommendation actions
export {
  processFeedback,
  type FeedbackParams,
  type FeedbackResult,
} from './feedback';

// Account conversion actions
export {
  convertToAccount,
  validateGuestSession,
  type ConvertToAccountParams,
  type ConvertToAccountResult,
} from './account';

/**
 * Migration Guide: API Routes → Server Actions
 *
 * OLD API Route Pattern:
 * ```typescript
 * const response = await fetch('/api/collection', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ fragrance_id: '123', action: 'add' })
 * });
 * const result = await response.json();
 * ```
 *
 * NEW Server Action Pattern:
 * ```typescript
 * import { toggleCollection } from '@/lib/actions';
 *
 * const result = await toggleCollection({
 *   fragrance_id: '123',
 *   action: 'add'
 * });
 * ```
 *
 * Benefits of Server Actions:
 * 1. No HTTP request overhead
 * 2. Automatic error handling with unstable_rethrow
 * 3. Built-in revalidation with revalidatePath
 * 4. Type safety end-to-end
 * 5. Works with or without JavaScript (progressive enhancement)
 * 6. Better performance and user experience
 */
