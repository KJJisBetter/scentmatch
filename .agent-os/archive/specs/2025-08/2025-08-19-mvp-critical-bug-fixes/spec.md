# Spec Requirements Document

> Spec: MVP Critical Bug Fixes for August 21st Launch
> Created: 2025-08-19
> Status: Planning

## Overview

Fix 4 critical bugs blocking ScentMatch MVP launch on August 21st. These are production-breaking issues that prevent core user flows from working properly. No feature enhancements - purely bug fixes to achieve launch-ready state.

## User Stories

### Story 1: Functional Browse Experience

As a fragrance enthusiast visiting ScentMatch, I want to browse fragrances and see actual fragrance names and ratings, so that I can evaluate and discover new scents effectively.

**Current Broken Workflow:**
1. User visits browse page
2. Sees "undefined" instead of fragrance names
3. Sees "NaN" instead of star ratings  
4. Cannot effectively evaluate fragrances
5. Abandons platform due to broken experience

### Story 2: Working Search Functionality

As a user searching for specific fragrances, I want the search to return results without server errors, so that I can find fragrances I'm interested in.

**Current Broken Workflow:**
1. User enters search query
2. Search API returns 500 error due to undefined variable
3. User sees technical error instead of results
4. Search functionality completely unusable

### Story 3: Seamless Quiz-to-Account Flow

As a user who completed the quiz, I want to create an account to save my results, so that I can access my personalized recommendations later.

**Current Broken Workflow:**
1. User completes quiz and gets recommendations
2. Clicks "Create Account" to save results
3. Gets 401 Unauthorized error
4. Loses quiz results and cannot save progress

## Spec Scope

1. **Fix Search API Variable Bug** - Resolve `ReferenceError: enhancedResults is not defined` in `app/api/search/route.ts:180`
2. **Fix Browse Data Display** - Ensure fragrance names and ratings display correctly instead of "undefined" and "NaN"
3. **Fix Quiz Account Conversion** - Resolve 401 Unauthorized error in POST `/api/quiz/convert-to-account`
4. **Fix Rating Calculation Logic** - Ensure rating numbers display properly instead of "NaN"

## Out of Scope

- Performance optimizations beyond fixing broken functionality
- New features or enhancements
- UI/UX improvements beyond fixing broken data display
- Additional AI capabilities or algorithm improvements
- Code refactoring unless directly required for bug fixes
- Database schema changes unless absolutely necessary

## Expected Deliverable

1. **Working Browse Page** - All fragrance names and ratings display correctly
2. **Functional Search API** - Search returns results without 500 errors  
3. **Working Quiz Conversion** - Users can create accounts from quiz results without authentication errors
4. **Professional Data Display** - No "undefined" or "NaN" visible to users anywhere in the application