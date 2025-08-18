# Spec Requirements Document

> Spec: Fix Critical UX Failures in Fragrance Discovery Experience  
> Created: 2025-08-18  
> Status: Planning

## Overview

Fix three critical failures in ScentMatch that are breaking the user experience: (1) Quiz questions are too generic and don't capture fragrance preferences, (2) AI personality profile is invisible after quiz completion, (3) Database has malformed names that look unprofessional. Additionally, clarify affiliate-focused messaging and improve mobile experience.

## Current Problems Identified

### Problem 1: Quiz Questions Are Not Fragrance-Specific

**Current State**: Quiz asks generic personality questions like "What describes your personality?" with options like "Casual", "Professional", "Romantic"
**Problem**: Users can't express actual fragrance preferences - no questions about citrus vs woody, fresh vs warm, floral preferences, or scent occasions
**Impact**: AI recommendations are based on personality guessing rather than actual scent preferences

### Problem 2: AI Profile Display Is Broken/Invisible

**Current State**: After quiz completion, users don't see their AI-generated fragrance personality profile
**Problem**: The post-quiz results screen doesn't prominently display the profile that explains their fragrance personality and preferences
**Impact**: Users don't understand their matches or feel confident in recommendations

### Problem 3: Database Names Are Malformed

**Current State**: Fragrance names like "Cloud Ariana Grandefor women" and "Coco Mademoiselle Chanelfor women"
**Problem**: Missing spaces and brand name duplication makes the platform look unprofessional
**Impact**: Loss of credibility, especially for luxury fragrance recommendations

### Problem 4: Unclear Affiliate vs Store Messaging

**Current State**: Interface messaging may suggest ScentMatch sells fragrances directly
**Problem**: Platform should clearly guide users to partner retailers for samples and purchases
**Impact**: Confused user expectations about the platform's role

## User Stories

### Fix Broken Quiz Experience

As a fragrance seeker, I want quiz questions that ask about my actual scent preferences (citrus vs woody, fresh vs warm, floral types, wearing occasions), so that the AI can understand my fragrance taste instead of guessing from personality traits.

**Specific Requirements:**

- Replace "What describes your personality?" with "Which scent families appeal to you?" (Citrus, Floral, Woody, Oriental options)
- Replace "How do you spend free time?" with "When do you want to smell amazing?" (Work, dates, everyday, special occasions)
- Add "Which notes do you gravitate toward?" with specific accord options
- Add "How do you want your fragrance to make you feel?" with scent-emotion connections

### Fix Missing AI Profile Display

As a quiz taker, I want to immediately see my AI-generated fragrance personality profile with clear visual presentation, so I understand my scent character and trust the recommendations.

**Specific Requirements:**

- Large, prominent profile card showing fragrance personality name (e.g., "The Fresh Minimalist", "The Warm Sophisticate")
- Visual fragrance wheel showing user's position across families
- Clear explanation: "Based on your preferences for [citrus, woody] scents and [fresh, confident] occasions, you're a [profile type]"
- Show top 3 preferred accords and explain why recommendations match

### Fix Database Name Quality

As a user browsing recommendations, I want to see professionally formatted fragrance names from respected brands, so I trust the platform's expertise and credibility.

**Specific Requirements:**

- Clean fragrance names: "Cloud" not "Cloud Ariana Grandefor women"
- Proper brand attribution: "Cloud by Ariana Grande" format
- Luxury brand names displayed with proper respect: "Coco Mademoiselle by Chanel"
- Gender tags as separate, subtle indicators

### Clarify Affiliate Discovery Focus

As someone seeking fragrance guidance, I want clear messaging that ScentMatch helps me discover and try fragrances through trusted partners, so I understand this is expert guidance, not a store.

**Specific Requirements:**

- Homepage/header: "Discover Your Perfect Fragrance" not store-like language
- Recommendation cards: "Try Sample at Sephora" and "Shop Full Size at Ulta" buttons
- Clear disclosure: "ScentMatch earns commission from our retail partners"
- Sample-first messaging: "Start with a sample" as primary call-to-action

## Spec Scope

1. **Replace Quiz Questions** - Swap out 5-7 generic personality questions with fragrance-specific questions about scent families, notes, occasions, and emotional preferences
2. **Fix AI Profile Display** - Create large, prominent post-quiz profile display component that actually shows and explains the user's fragrance personality
3. **Clean Database Names** - Fix malformed fragrance names using clean research dataset and implement proper name formatting
4. **Update Affiliate Messaging** - Replace store-like language with discovery guide messaging throughout interface
5. **Mobile Touch Optimization** - Ensure fragrance selection, quiz, and profile display work properly on mobile devices

## Out of Scope

- Creating new AI personality algorithms (fix display of existing results)
- Changing core database schema (work with existing structure)
- Adding new external integrations
- Building e-commerce functionality
- Advanced personalization features

## Expected Deliverable

1. **Working fragrance quiz** that asks about scent preferences and can be completed in browser without errors
2. **Visible AI profile display** that shows prominently after quiz with clear personality explanation and visual elements
3. **Professional fragrance database** with clean names like "Coco Mademoiselle by Chanel" instead of malformed versions
4. **Clear affiliate discovery flow** with "Try Sample" buttons and discovery-focused messaging throughout
5. **Mobile-functional interface** for quiz, profile display, and recommendations tested on actual mobile devices
