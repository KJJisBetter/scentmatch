# Spec Requirements Document

> Spec: Critical Release Fixes
> Created: 2025-08-18
> Status: Planning

## Overview

Fix critical production issues blocking August 21st release: gender filtering returning wrong fragrances, generic AI insights, broken browse page, and database rebuild with top 2000 popular fragrances.

## User Stories

### Gender Filtering Fix

As a male user, I want to receive men's fragrance recommendations when I select "For Men" in the quiz, so that I get relevant recommendations instead of women's fragrances like Ariana Grande perfumes.

**Workflow:** User selects "For Men" → Quiz processes preferences → Recommendation engine filters by gender → Returns only men's or unisex fragrances → User receives appropriate recommendations

### AI Insights Enhancement

As a user completing the quiz, I want to receive personalized AI insights explaining why each fragrance matches my specific preferences, so that I understand the reasoning behind each recommendation instead of generic text.

**Workflow:** User completes quiz → AI analyzes responses → Generates personalized insights per fragrance → User sees unique explanations → User makes informed sampling decisions

### Browse Page Restoration

As a user wanting to explore fragrances, I want the browse page to load quickly and display fragrance catalog, so that I can discover fragrances beyond quiz recommendations.

**Workflow:** User clicks "Browse Fragrances" → Page loads successfully → Catalog displays with filtering → User can search and filter → User discovers new fragrances

## Spec Scope

1. **Gender Filtering System** - Fix recommendation engine to respect gender preferences and return appropriate fragrances
2. **AI Insights Generation** - Replace generic text with personalized explanations based on user preferences and fragrance characteristics
3. **Browse Page Debug** - Identify and fix loading issues causing timeout errors
4. **Database Rebuild** - Import top 2000 popular fragrances using researched data sources
5. **Quality Assurance** - Comprehensive testing of all user flows before August 21st release

## Out of Scope

- New features or UI changes beyond fixing existing functionality
- Advanced recommendation algorithm improvements beyond gender filtering
- Sample purchasing integration enhancements
- Mobile app development

## Expected Deliverable

1. Quiz recommendations correctly filtered by selected gender with no cross-gender errors
2. Browse page loads successfully within 5 seconds with full fragrance catalog
3. AI insights provide unique, personalized explanations for each recommendation
4. Database contains 2000+ properly categorized popular fragrances with accurate metadata
5. All critical user paths (quiz → recommendations → browse) work flawlessly in production
