# Spec Requirements Document

> Spec: Fragrance, Collections, and Recommendations Pages
> Created: 2025-08-15
> Status: Planning

## Overview

Implement three core user-facing pages that form the heart of the ScentMatch fragrance discovery experience: individual fragrance detail pages, personal collection management, and AI-powered recommendations system.

## User Stories

### Individual Fragrance Page

As a **fragrance explorer**, I want to view detailed information about a specific fragrance, so that I can understand its scent profile, read reviews, and decide whether to try a sample.

**Detailed Workflow:** User navigates from browse/search/recommendations to individual fragrance page. Page displays comprehensive fragrance information including visual scent timeline, notes breakdown, user reviews, sample purchasing options, and AI-powered similar recommendations. User can add to collection, purchase samples, or save to wishlist.

### Personal Collections Page

As a **fragrance collector**, I want to manage my personal fragrance collection with different organization views and insights, so that I can track my preferences, avoid duplicates, and discover patterns in my taste.

**Detailed Workflow:** User accesses their personal collection dashboard showing owned fragrances with multiple view options (grid, list, wheel, calendar). They can organize by occasion/season/mood, view AI-generated collection insights, log usage, and receive recommendations based on collection gaps.

### AI Recommendations Page

As a **fragrance seeker**, I want personalized fragrance recommendations that learn from my preferences and collection, so that I can discover new scents that match my taste without overwhelming choice paralysis.

**Detailed Workflow:** User receives curated fragrance suggestions based on collection analysis, quiz responses, and behavioral data. Recommendations are organized in themed sections with explanations. User can refine preferences through interactive feedback and receive real-time updated suggestions.

## Spec Scope

1. **Individual Fragrance Detail Page** - Complete fragrance information display with visual scent timeline, notes, reviews, and sample-first purchasing
2. **Personal Collection Management** - Multi-view collection dashboard with organization, insights, and usage tracking
3. **AI-Powered Recommendations Engine** - Personalized fragrance suggestions with interactive refinement and themed curation
4. **Cross-Page Integration** - Seamless navigation and data flow between all three page types
5. **Mobile-Optimized Experience** - Touch-friendly interfaces with swipe navigation and thumb-zone CTAs

## Out of Scope

- Full e-commerce checkout flow (focus on sample purchasing only)
- Social sharing features beyond basic collection snapshots
- Advanced analytics dashboard for admin users
- Bulk collection import/export functionality
- Video review hosting (embed only)

## Expected Deliverable

1. **Functional fragrance detail pages** accessible via `/fragrance/[id]` with complete information display and sample purchasing
2. **Working collection management** at `/dashboard/collection` with multiple organization views and AI insights
3. **Live recommendation system** at `/recommendations` with personalized suggestions and interactive refinement