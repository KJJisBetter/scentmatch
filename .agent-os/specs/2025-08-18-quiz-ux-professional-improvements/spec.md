# Spec Requirements Document

> Spec: Quiz UX Professional Improvements
> Created: 2025-08-18
> Status: Planning

## Overview

Transform the current fragrance quiz experience to use natural, conversational language and remove AI-generated profiles in favor of direct fragrance recommendations with clear insights.

## User Stories

### Natural Fragrance Discovery Experience

As a user taking the fragrance quiz, I want conversational, friendly questions that don't sound pretentious or overly technical, so that I feel comfortable exploring without being intimidated by fancy terminology.

**Detailed Workflow:** User encounters natural questions like "What kind of fragrances do you enjoy most?" with simple experience levels like "Just getting started" or "I have my favorites", and receives direct fragrance recommendations with clear AI insights explaining the match reasoning.

### Simplified Result Flow

As a user completing the quiz, I want to see 3 carefully selected fragrances with clear reasoning, so that I can make informed decisions without being overwhelmed by AI-generated personality profiles.

**Detailed Workflow:** After quiz completion, user sees exactly 3 fragrance recommendations with brand names, professional scent descriptions, and specific AI insights explaining why each fragrance matches their preferences and lifestyle.

### Experience-Appropriate Complexity

As a user at different fragrance knowledge levels, I want question complexity that matches my expertise, so that beginners aren't overwhelmed while collectors get sophisticated options.

**Detailed Workflow:** Beginner users get 4 simple options with combined categories (Fresh = citrus + aquatic), while experienced users get 8-10 refined options with separated categories and professional terminology.

## Spec Scope

1. **Natural Language Implementation** - Replace pretentious terminology with conversational, friendly language throughout the quiz
2. **Experience Level Simplification** - Use natural terms like "Just getting started", "I have my favorites", "Love trying new things" instead of fancy classifications
3. **Question Option Restructuring** - Separate combined options like "casual & relaxed" into distinct choices with appropriate scaling (4 options for beginners, 8-10 for experienced)
4. **Gender Selection Standardization** - Fix "uninex" to "unisex" and limit to clear options (Women, Men, Unisex)
5. **Results Display Transformation** - Remove AI personality profiles and replace with 3 direct fragrance recommendations including AI insights
6. **Fragrance Name Data Cleanup** - Remove malformed naming like "Coach for Men" suffixes and standardize fragrance data presentation

## Out of Scope

- Complete quiz flow redesign or user interface overhaul
- Backend recommendation algorithm changes beyond result presentation
- Addition of new fragrance data sources or external API integrations
- Mobile app native implementation (web-only focus)

## Expected Deliverable

1. Natural, conversational quiz experience with appropriate complexity scaling based on user experience
2. Clean results display showing 3 curated fragrances with AI reasoning instead of personality profiles
3. Standardized fragrance data presentation without naming inconsistencies
