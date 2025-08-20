# Spec Requirements Document

> Spec: Browse Page Collection Redesign
> Created: 2025-08-20
> Status: Planning

## Overview

Transform the browse page from a store-like shopping interface to a personal fragrance discovery and collection management interface. Users can add fragrances to their collection and wishlist for improved AI recommendations, while still providing subtle purchase assistance through affiliate links. The interface prioritizes discovery and personal curation over commerce, but maintains revenue potential through helpful purchase guidance.

## User Stories

### Collection Building Story

As a fragrance enthusiast, I want to easily add discovered fragrances to my personal collection, so that the AI can better understand my preferences and provide more accurate recommendations.

**Workflow:** User searches/browses fragrances → views fragrance details → clicks "Add to Collection" → fragrance saved with ownership status → AI learns from collection data for future recommendations.

### Wishlist Management Story

As a fragrance beginner, I want to add interesting fragrances to my wishlist for future consideration, so that I can track fragrances I want to try and the AI can suggest similar options.

**Workflow:** User discovers appealing fragrance → clicks "Add to Wishlist" → fragrance saved for later → AI uses wishlist data to understand user interests and suggest related fragrances.

### Smart Discovery Story

As a user with an established collection, I want the browse page to show me personalized recommendations rather than just popular fragrances, so that I discover fragrances that match my actual preferences.

**Workflow:** Authenticated user with collection data visits browse page → AI analyzes their collection/wishlist → fragrances sorted by personalized relevance rather than popularity → user discovers tailored suggestions that improve over time.

### Purchase Assistance Story

As a user interested in a fragrance, I want subtle, helpful guidance on where to find samples or purchase options, so that I can actually try or buy fragrances I've discovered without the page feeling like a pushy store.

**Workflow:** User adds fragrance to wishlist → sees discrete "Find Samples" or "Where to Buy" links → can access affiliate purchase options when ready → maintains focus on discovery rather than immediate sales pressure.

### Brand Intelligence Story

As a user, I want the system to intelligently handle brand variations (like "Emporio Armani" vs "Giorgio Armani"), so that I get accurate brand information and don't see confusing duplicate entries.

**Workflow:** User searches for "Armani" fragrances → system intelligently groups and displays correct brand hierarchies → user sees clean, organized results without confusing duplicates or truncated names.

## Spec Scope

1. **Collection Action Redesign** - Replace primary shopping cart buttons with "Add to Collection" and "Add to Wishlist" actions as main CTAs
2. **Smart Discovery Algorithm** - Implement personalized sorting for authenticated users with collections vs. popularity-based sorting for new/unauthenticated users
3. **Subtle Purchase Assistance** - Add discrete "Find Samples" and "Where to Buy" secondary actions that maintain affiliate revenue without store-like appearance
4. **Brand Intelligence System** - Implement smart brand matching and hierarchy to handle brand variations correctly  
5. **Name Display Improvement** - Fix truncated fragrance names and ensure full names are visible
6. **Collection Status Indicators** - Show if user already owns or has wishlisted each fragrance
7. **User-Aware Interface** - Different UI states for authenticated vs. unauthenticated users to encourage account creation

## Out of Scope

- Actual collection database schema changes (assume tables exist)
- Authentication flow modifications
- Search algorithm improvements beyond brand intelligence
- Mobile app changes (web interface only)
- Purchase/commerce functionality removal from other pages

## Expected Deliverable

1. **Browse page prioritizes discovery and collection management over commerce** - Primary actions are collection-focused, secondary actions provide purchase assistance without store-like appearance
2. **Smart sorting adapts to user authentication and collection status** - New users see popular fragrances, established users see AI-personalized recommendations
3. **Users can add fragrances to collection and wishlist with clear visual feedback** - Functional buttons with proper state management and success indicators
4. **Subtle affiliate revenue opportunities remain accessible** - "Find Samples" and "Where to Buy" links available without dominating the interface
5. **Brand names are displayed correctly without truncation or confusion** - Full fragrance names visible, intelligent brand grouping working properly