# Spec Requirements Document

> Spec: Homepage Search Quiz Gender Linear Fixes
> Created: 2025-08-20
> Status: Planning

## Overview

Fix critical launch-blocking Linear issues identified as SCE-46, SCE-47, SCE-42/43, SCE-44, and SCE-48 that prevent successful August 21st platform launch. These issues include homepage 404 errors, broken search functionality, quiz navigation failures, and severe gender representation problems that destroy user trust and platform usability.

## User Stories

### Homepage Navigation Recovery (SCE-46)
As a user navigating between fragrance pages and the homepage, I want seamless navigation without encountering 404 errors, so that I can explore the platform confidently and return to the main page to discover more content.

**Critical Issue:** Homepage returns 404 error when navigating from fragrance detail pages - complete site failure that causes immediate user abandonment.

### Functional Search Discovery (SCE-47)
As a user looking for specific fragrances, I want to search for "Chanel No 5" or other known fragrances and get relevant results, so that I can verify the platform has inventory I'm interested in.

**Critical Issue:** Search functionality completely broken with "TypeError: Failed to fetch" preventing all fragrance discovery on browse page.

### Quiz Research Journey (SCE-42/43)
As a beginner completing the fragrance quiz, I want to click "Learn More" on my recommendations to research fragrances before purchasing samples, so that I can make informed decisions about my first fragrance purchases.

**Critical Issues:** Quiz "Learn More" buttons lead to 404 error pages, completely breaking the beginner trust and research-to-purchase conversion funnel.

### Gender-Inclusive Discovery (SCE-44/48)
As a woman user taking the quiz or browsing fragrances, I want to see women's and unisex fragrances prominently displayed, so that I feel the platform serves my demographic and I can find relevant options.

**Critical Issues:** Browse page shows 80% men's fragrances with 0% women's fragrances, making platform appear male-focused and irrelevant to female users.

## Spec Scope

1. **Homepage Navigation Fix (SCE-46)** - Resolve 404 errors when navigating from fragrance pages back to homepage
2. **Search Functionality Restoration (SCE-47)** - Fix "TypeError: Failed to fetch" errors preventing fragrance search on browse page
3. **Quiz Navigation Repair (SCE-42/43)** - Fix "Learn More" button 404 errors on quiz recommendation pages  
4. **Gender Balance Correction (SCE-44/48)** - Ensure women's fragrances are visible in browse and recommendations
5. **Database Gender Audit** - Verify fragrance gender classifications reflect actual inventory balance
6. **Comprehensive Testing** - Verify all fixes work end-to-end in browser before launch

## Out of Scope

- New feature development or UI enhancements
- Performance optimizations beyond critical functionality  
- Advanced search features or filtering improvements
- Collection management or wishlist enhancements
- Previously resolved Linear issues (SCE-31, SCE-33, SCE-34 already completed)

## Expected Deliverable

1. **Homepage accessible from all navigation paths** - No 404 errors when returning to homepage from any page
2. **Search functionality working on browse page** - Fragrance search returns proper API responses without fetch errors
3. **Quiz "Learn More" buttons work correctly** - Lead to functional fragrance detail pages for research
4. **Browse page shows gender balance** - Women's and unisex fragrances visible, not just men's fragrances
5. **Platform appears gender-inclusive** - Female users see relevant options and feel platform serves them