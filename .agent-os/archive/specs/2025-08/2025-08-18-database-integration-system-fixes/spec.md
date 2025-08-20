# Spec Requirements Document

> Spec: Database Integration & System Fixes
> Created: 2025-08-18
> Status: Planning

## Overview

Fix critical database integration issues affecting API endpoints, quiz recommendation system, and complete user journey functionality. This spec addresses the gap between the new database schema implementation and the existing application code that needs to work with the updated structure.

## User Stories

### Database-Application Integration

As a **developer**, I want the API endpoints to work correctly with the new database schema, so that all application features function as expected without breaking existing functionality.

**Detailed Workflow:** The new database schema with fragrance_embeddings, user_preferences, and enhanced tables must be properly integrated with existing API endpoints. Current API routes may be using old table structures or missing required joins with new tables. All database queries need to be updated to work with the new schema while maintaining backward compatibility where needed.

### Quiz-to-Recommendations Integration

As a **user taking the fragrance quiz**, I want my quiz results to generate accurate recommendations using the new database structure, so that I receive personalized fragrance suggestions that match my preferences and don't have gender filtering bugs.

**Detailed Workflow:** The quiz recommendation engine must be updated to use the new user_preferences table, fragrance_embeddings for vector similarity, and enhanced fragrance metadata. The system should eliminate cross-gender recommendation bugs (like men getting Ariana Grande recommendations) and leverage the new database functions for improved recommendation accuracy.

### End-to-End User Journey Testing

As a **product manager**, I want the complete user journey (quiz → recommendations → browse) to work seamlessly, so that users can successfully discover fragrances without encountering broken pages or timeout issues.

**Detailed Workflow:** Test the complete flow from quiz completion through recommendation display to browse page functionality. Address any timeout issues, broken API calls, or integration problems that prevent users from completing their fragrance discovery journey.

## Spec Scope

1. **API Endpoint Integration** - Update all API routes to work correctly with new database schema and tables
2. **Quiz Recommendation System** - Fix quiz-to-recommendations pipeline to use new database structure and eliminate bugs
3. **Database Query Optimization** - Ensure all database queries are optimized for the new schema with proper indexes and functions
4. **Browse Page Functionality** - Fix timeout issues and ensure browse page works with updated database integration
5. **End-to-End Testing** - Comprehensive testing of the complete user journey from quiz to recommendations to browse

## Out of Scope

- New feature development beyond fixing existing integrations
- Database schema changes (schema is already implemented, focus is on application integration)
- UI/UX redesigns (focus is on functionality fixes)

## Expected Deliverable

1. All API endpoints work correctly with new database schema and return expected data
2. Quiz recommendations system generates accurate results using new database structure without gender filtering bugs
3. Browse page loads successfully without timeout issues and displays fragrance data correctly
