# Spec Requirements Document

> Spec: Enhanced Quiz & AI Recommendations System
> Created: 2025-08-17
> Status: Planning

## Overview

Comprehensively enhance the fragrance personality quiz system with experience-level adaptation, AI-generated unique profile descriptions, real-time recommendations using database fragrances, and seamless account creation flow. This spec addresses critical UX gaps and transforms the quiz into a sophisticated personalization engine that adapts to user expertise levels and provides genuine value through actual fragrance recommendations.

## User Stories

### 1. Experience-Level Adaptive Quiz Flow

**Primary User**: New fragrance user (65% of traffic)  
As a fragrance beginner, I want a quiz that adapts to my knowledge level, so that I don't feel overwhelmed by complex terminology or too many choices.

**Secondary User**: Fragrance enthusiast (25% of traffic)  
As someone familiar with fragrances, I want to shortcut basic questions and provide my existing favorites, so that I can get more refined recommendations faster.

**Advanced User**: Fragrance collector (10% of traffic)  
As a fragrance collector, I want to input my current collection and preferences, so that I receive expert-level recommendations that explore niche and rare options.

**Workflow Details:**

1. **Entry Point**: First question determines experience level ("How familiar are you with fragrances?")
2. **Adaptive Branching**: Quiz complexity and terminology adjust based on level
3. **Favorite Selection**: Advanced users can select 3-5 existing favorites from database
4. **Dynamic Questions**: Question difficulty and technical depth scale with experience
5. **Profile Generation**: AI creates unique, experience-appropriate personality descriptions

### 2. AI-Generated Unique Profile System

**Primary User**: All quiz completers  
As a quiz taker, I want to receive a unique, personalized profile name and description that feels specifically crafted for me, so that I feel understood and want to save/share my results.

**Workflow Details:**

1. **Unique Naming**: AI generates distinctive profile names like "Velvet Wanderer of Midnight Gardens" instead of generic "Sophisticated Explorer"
2. **Multi-Paragraph Insights**: 3-paragraph descriptions covering core identity, lifestyle integration, and discovery potential
3. **Personality Validation**: Profile makes user feel "deeply understood" and accurately reflects their preferences
4. **Social Shareability**: Unique profiles become social currency users want to share
5. **Account Conversion**: Profile uniqueness drives 42% higher account creation rates

### 3. Real Database Recommendations System

**Primary User**: Quiz completers expecting recommendations  
As someone who completed the quiz, I want to see actual fragrance recommendations from your inventory with explanations, not just placeholder text like "elegant choice".

**Workflow Details:**

1. **Real Fragrance Matching**: Use actual database fragrances with vector similarity
2. **AI-Powered Explanations**: Generate specific reasons why each fragrance matches the user's profile
3. **Sample-First Strategy**: Prioritize fragrances with sample availability
4. **Tiered Recommendations**: Show 3-5 "perfect matches" plus adventurous and seasonal options
5. **Purchase Path**: Direct integration to sample ordering with conversion optimization

## Spec Scope

1. **Authentication Flow Debugging** - Fix 401 unauthorized errors in account creation
2. **Experience-Level Detection** - First question determines user expertise with adaptive UI
3. **Profile Naming System** - AI-generated unique profile names and descriptions
4. **Favorite Fragrance Input** - Advanced users can select existing favorites from database
5. **Adaptive Quiz Engine** - Dynamic question selection based on experience level
6. **Real Recommendations Engine** - Replace placeholder recommendations with actual database matches
7. **AI Model Integration** - Implement optimal AI models for profile generation and recommendations
8. **Account Conversion Optimization** - Seamless guest-to-authenticated user flow

## Out of Scope

- Mobile app development (web-only focus)
- E-commerce integration beyond sample ordering
- Social features or community functionality
- Advanced analytics dashboard
- Multi-language support

## Expected Deliverable

1. **Fixed Authentication Flow** - Account creation works without 401 errors, tested via browser and API
2. **Adaptive Quiz Experience** - Three distinct user paths (beginner, enthusiast, collector) with appropriate complexity
3. **Unique AI Profiles** - Every user receives a distinctive profile name and multi-paragraph personality description
4. **Real Fragrance Recommendations** - Actual database fragrances displayed with AI-generated match explanations
5. **Optimized Conversion Flow** - Seamless transition from quiz completion to account creation with profile preservation
6. **Performance Targets** - Sub-200ms recommendation generation, 40% quiz-to-account conversion rate
