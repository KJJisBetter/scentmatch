# Spec Requirements Document

> Spec: Gender Filtering Verification & Fix
> Created: 2025-08-25
> Status: Planning

## Overview

Fix the critical production blocker where women selecting "For Women" in quiz are receiving men's fragrances as recommendations. This destroys user trust and makes our AI personalization claim fraudulent, requiring immediate verification and resolution of the database RPC function gender filtering logic.

## User Stories

### Women User Quiz Experience
As a woman user, I want to receive only women's and unisex fragrances when I select "For Women" preferences, so that I don't waste time and money on fragrances designed for men and maintain trust in the platform's personalization.

When a woman completes the quiz selecting "For Women" + preference indicators like "Floral" + "Evening elegance", the system must never return men's exclusives like "Euphoria Men" and should only return women's fragrances and unisex options that match her preferences.

### Men User Quiz Experience
As a male user, I want to receive only men's and unisex fragrances when I select "For Men" preferences, so that the recommendations are relevant and appropriate for my intended use.

The system must enforce gender filtering consistently across all recommendation pathways to maintain platform credibility.

## Spec Scope

1. **Database RPC Verification** - Verify get_quiz_recommendations() function properly filters by gender values 
2. **Test Coverage Implementation** - Create automated tests preventing regression of gender filtering logic
3. **End-to-End Validation** - Browser test complete quiz flow for both men and women user scenarios
4. **Production Monitoring** - Implement alerts and debugging tools for gender filtering violations
5. **Data Integrity Audit** - Audit existing quiz sessions for any data inconsistencies

## Out of Scope

- Search and browse page gender filtering (separate from quiz recommendations)
- New gender categories beyond men/women/unisex
- Performance optimization of recommendation engine
- UI/UX changes to quiz interface

## Expected Deliverable

1. Automated test suite passing for all gender filtering scenarios with zero cross-gender recommendations
2. Production quiz flow browser-tested and verified working correctly for both men and women users
3. Database audit report confirming data integrity and proper gender value mappings

## Spec Documentation

- Tasks: @.agent-os/specs/2025-08-25-gender-filtering-verification/tasks.md
- Technical Specification: @.agent-os/specs/2025-08-25-gender-filtering-verification/sub-specs/technical-spec.md
- Tests Specification: @.agent-os/specs/2025-08-25-gender-filtering-verification/sub-specs/tests.md