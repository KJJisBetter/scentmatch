# Spec Requirements Document

> Spec: Refined Quiz System Complete Redesign
> Created: 2025-08-18
> Status: Planning

## Overview

Complete redesign of the fragrance quiz system using research-backed natural language, experience-appropriate complexity scaling, refined AI recommendation system with practical guidance, and comprehensive fragrance data cleanup.

## User Stories

### Natural Progressive Quiz Experience

As a user taking the fragrance quiz, I want questions that feel conversational and scale appropriately with my experience level, so that beginners aren't overwhelmed while experienced users get the granular choices they want.

**Detailed Workflow:** Beginner users get 4 simple scent options with combined categories, while experienced users get 10+ refined options with separated categories. All users experience natural, friendly language without pretentious terminology.

### Intelligent AI Recommendations with Practical Guidance

As a user completing the quiz, I want to receive exactly 3 fragrance recommendations with clear explanations of why each matches my preferences and practical guidance on how to wear them, so that I can make confident purchasing decisions.

**Detailed Workflow:** After quiz completion, user sees 3 curated fragrances with brand names, natural scent descriptions, AI insights explaining the match reasoning, and practical spray guidance based on fragrance strength.

### Clean Fragrance Data Experience

As a user browsing fragrances, I want clean, consistent fragrance names without confusing suffixes, so that I can easily find and understand fragrance options.

**Detailed Workflow:** User sees standardized fragrance names like "Coach" instead of "Coach for Men" and "Bleu de Chanel" instead of "Bleu de Chanel for Men", creating a professional, clean browsing experience.

## Spec Scope

1. **Complete Quiz Question Redesign** - Implement experience-based progressive complexity (4 options for beginners, 7 for enthusiasts, 10+ for experienced)
2. **Natural Language Implementation** - Replace all quiz text with conversational, friendly language that doesn't try too hard
3. **AI Recommendation System Enhancement** - Create sophisticated prompt system for generating personalized insights with practical spray guidance
4. **Fragrance Data Standardization** - Clean all fragrance names removing gender suffixes and standardize brand/name presentation
5. **Experience-Appropriate Question Flow** - Different question paths for different experience levels (beginners skip seasons, experienced get favorites input)
6. **Results Display Transformation** - Replace AI personality profiles with direct fragrance recommendations including strength and usage guidance

## Out of Scope

- Complete UI/UX design overhaul (maintaining existing visual style)
- Backend recommendation algorithm changes beyond prompt engineering
- Addition of new fragrance data sources or external APIs
- Mobile app native features (web-focused implementation)

## Expected Deliverable

1. Redesigned quiz experience with research-backed question progression and natural language
2. Enhanced AI recommendation system providing 3 fragrances with practical guidance and match explanations
3. Clean fragrance dataset with standardized naming conventions and no malformed entries
