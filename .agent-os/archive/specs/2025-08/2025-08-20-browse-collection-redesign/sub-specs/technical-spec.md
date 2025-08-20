# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-20-browse-collection-redesign/spec.md

## Technical Requirements

### UI Component Changes
- Replace primary `ShoppingCart` icon with `Plus` (collection) and `Bookmark` (wishlist) icons from Lucide React
- Keep sample availability information but reframe as "Sample Available" badge rather than pricing focus
- Replace "Try Sample" primary button with "Add to Collection" as main CTA
- Add secondary/subtle "Find Samples" and "Where to Buy" links with `ExternalLink` icon
- Implement collection status indicators (owned/wishlisted) with visual feedback
- Different UI states for authenticated vs. unauthenticated users

### Data Model Integration
- Integrate with existing user collection and wishlist tables in Supabase
- Add collection status checks to fragrance display logic
- Implement optimistic UI updates for collection/wishlist actions
- Add proper error handling for collection management operations

### Smart Sorting Algorithm
- **Unauthenticated users:** Sort by popularity_score (existing field) or relevance_score for search results
- **Authenticated users with empty collection:** Sort by popularity_score with encouragement to build collection
- **Authenticated users with collection data:** Sort by AI recommendation relevance based on user's collection/wishlist preferences
- Implement fallback to popularity sorting if AI recommendations fail
- Cache sorting results per user session for performance

### Brand Intelligence Algorithm
- Implement brand normalization logic to handle variations (Emporio Armani → Armani, Giorgio Armani → Armani)
- Create brand hierarchy mapping for parent/sub-brand relationships
- Fix brand display to show correct canonical brand names
- Ensure search and filtering works with normalized brand data

### Name Display Improvements
- Remove `line-clamp-1` CSS class that truncates fragrance names
- Implement proper text wrapping for longer fragrance names
- Ensure card height adapts to content length
- Add tooltip for very long names if needed

### Performance Considerations
- Maintain existing caching strategy for fragrance data
- Add client-side caching for user collection/wishlist status
- Optimize re-renders when collection status changes
- Ensure collection actions don't block UI interaction

## Integration Requirements

### Authentication Integration
- Verify user is authenticated before showing collection actions
- Show login prompt for unauthenticated users attempting collection actions
- Maintain collection state across authentication status changes

### AI Recommendation Integration  
- Ensure collection and wishlist actions trigger AI model updates
- Pass collection status data to recommendation endpoints
- Maintain consistency between browse page and recommendation algorithm data

### Database Integration
- Use existing Supabase client for collection/wishlist operations
- Implement proper error handling for database failures
- Add optimistic updates with rollback on error
- Ensure real-time updates if other users share collections