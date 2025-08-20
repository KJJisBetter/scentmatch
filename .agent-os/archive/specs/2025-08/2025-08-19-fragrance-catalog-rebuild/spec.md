# Spec Requirements Document

> Spec: Fragrance Catalog Rebuild with Complete 2025 Dataset
> Created: 2025-08-19
> Status: Planning

## Overview

Completely rebuild the fragrance catalog (`fragrances` and `fragrance_brands` tables) using the complete `fragrances-final-2025.json` dataset (2,017 fragrances) to replace the incomplete current dataset (1,400 fragrances) and fix major data gaps in popular brands.

## User Stories

### Complete Brand Coverage

As a user searching for popular brands like Ralph Lauren, Hugo Boss, or Tom Ford, I want to find comprehensive fragrance collections (57, 57, and 45 fragrances respectively), so that I can explore the full range of options instead of seeing incomplete results.

The current database is missing major brand collections and showing alphabetical results instead of popularity-based recommendations.

### Popularity-Based Discovery

As a user browsing fragrances, I want to see the most popular and highly-rated fragrances first (Sauvage, Bleu de Chanel, etc.), so that I discover fragrances that are proven favorites instead of random alphabetical listings.

## Spec Scope

1. **Complete Fragrance Catalog Replacement** - Replace incomplete fragrance data with 2,017 properly scored fragrances
2. **Brand Collection Expansion** - Add missing major brands (Ralph Lauren 57, Hugo Boss 57, complete Dior 45)
3. **Popularity-Based Organization** - Import data with proper popularity scoring (16.37 → 0.x descending)
4. **Search Enhancement** - Ensure popular fragrances appear first in search results
5. **Data Directory Cleanup** - Remove confusing duplicate data files

## Out of Scope

- User management tables (`user_profiles`, `user_collections`) - these stay unchanged
- Quiz system tables (`user_quiz_sessions`, `user_quiz_responses`, `user_fragrance_personalities`) - working perfectly
- Authentication or user-facing features - focus only on catalog data
- Performance optimization beyond basic indexing

## Expected Deliverable

1. Search for "dior" returns 45 results instead of 18
2. Popular fragrances like Sauvage appear first in browse/search instead of "1 Million Absolutely Gold"
3. Major brands like Ralph Lauren (57 fragrances) are discoverable