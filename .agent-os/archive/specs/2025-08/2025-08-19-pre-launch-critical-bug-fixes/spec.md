# Spec Requirements Document

> Spec: Pre-Launch Critical Bug Fixes
> Created: 2025-08-19
> Status: Planning

## Overview

Fix critical pre-launch bugs blocking the August 21st MVP release: search API returning "unknown brand" cards, quiz recommendations showing alphabetical bias instead of AI-powered results, and account creation failing with "failed to transfer quiz data" error.

## User Stories

### Search Bug Resolution

As a user searching for specific fragrance brands like "dior", I want to see properly labeled fragrance cards with correct brand names, so that I can browse and discover fragrances without confusing "unknown brand" placeholders.

**Current Broken Behavior:** Search for "dior" returns cards showing "unknown brand" text instead of "Dior" brand name, making results appear broken and unprofessional.

**Expected Working Behavior:** Search returns properly labeled Dior fragrances with correct brand names and metadata.

### Quiz Recommendation Intelligence

As a user completing the fragrance quiz with specific preferences (Fresh & Clean, Warm & Spicy, etc.), I want to receive personalized AI-powered recommendations that reflect my choices, so that the quiz provides value and leads to relevant fragrance discoveries.

**Current Broken Behavior:** All quiz completions return the same 3 fragrances starting with brands beginning with "A" (Ariana Grande, Azzaro) regardless of different quiz answers, making the quiz appear non-functional.

**Expected Working Behavior:** Different quiz preferences produce meaningfully different recommendations that reflect user's stated scent preferences and personality style.

### Account Creation After Quiz

As a guest user who completes the quiz and wants to save my results, I want to create an account and have my quiz data transferred successfully, so that I can access my recommendations and build my fragrance profile.

**Current Broken Behavior:** After quiz completion, attempting to create an account fails with "failed to transfer quiz data" error, blocking the conversion from guest to registered user.

**Expected Working Behavior:** Quiz data transfers seamlessly to new account, allowing users to save their results and continue their fragrance journey.

## Spec Scope

1. **Search API Brand Field Mapping** - Verify and fix brand name display in search results
2. **Quiz Algorithm Intelligence** - Fix recommendation scoring to use actual quiz preferences
3. **Database Schema Alignment** - Fix session token data type mismatch for quiz data transfer
4. **Integration Testing** - Ensure all three systems work properly in production environment
5. **Cache Invalidation** - Clear any cached broken responses from previous bugs

## Out of Scope

- Complete redesign of recommendation algorithm (use existing scoring approach)
- Advanced AI features beyond current implementation
- Major database schema changes beyond the session token fix
- New quiz questions or UI changes
- Performance optimizations (focus on functionality first)

## Expected Deliverable

1. Search for "dior" returns properly labeled Dior fragrance cards with correct brand names
2. Quiz with different preferences produces different recommendation sets (no more alphabetical bias)
3. Guest users can successfully create accounts and access their quiz recommendations
